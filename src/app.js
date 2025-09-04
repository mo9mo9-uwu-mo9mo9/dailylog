const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const { initDb } = require('./db');

// Build and return an Express app. Options allow test-time overrides.
// opts: { dbFile?: string, auth?: { user?: string, pass?: string } }
function createApp(opts = {}) {
  // Ensure DB ready and get handle
  const db = initDb(opts.dbFile);

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  // Base path for hosting under a prefix (e.g., /dailylog, /dailylog-dev)
  // Empty string or '/' means root
  const BASE_PATH_RAW = (process.env.BASE_PATH || '').trim();
  const BASE_PATH = BASE_PATH_RAW && BASE_PATH_RAW !== '/' ? BASE_PATH_RAW : '';

  // Optional Basic Auth (enabled when AUTH_USER/PASS are set)
  const AUTH_USER = opts?.auth?.user ?? process.env.AUTH_USER ?? '';
  const AUTH_PASS = opts?.auth?.pass ?? process.env.AUTH_PASS ?? '';
  const { timingSafeEqual } = require('crypto');
  function safeEq(a, b) {
    const ba = Buffer.from(String(a ?? ''));
    const bb = Buffer.from(String(b ?? ''));
    if (ba.length !== bb.length) return false;
    try {
      return timingSafeEqual(ba, bb);
    } catch {
      return false;
    }
  }
  function basicAuth(req, res, next) {
    if (!AUTH_USER || !AUTH_PASS) return next();
    const hdr = req.headers['authorization'] || '';
    if (!hdr.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="DailyLog"');
      return res.status(401).send('Auth required');
    }
    const [u, p] = Buffer.from(hdr.split(' ')[1], 'base64').toString().split(':');
    if (safeEq(u, AUTH_USER) && safeEq(p, AUTH_PASS)) return next();
    res.set('WWW-Authenticate', 'Basic realm="DailyLog"');
    return res.status(401).send('Bad credentials');
  }
  app.use(basicAuth);

  // --- API router (mounted at /api and, if BASE_PATH set, also at BASE_PATH + /api)
  const api = express.Router();
  // Health
  api.get('/health', (_req, res) => res.json({ ok: true }));

  // --- Helpers (DB statements)
  const getDayStmt = db.prepare('SELECT * FROM days WHERE date = ?');
  const getActsStmt = db.prepare(
    'SELECT slot_index AS slot, label, category FROM activities WHERE date = ? ORDER BY slot_index'
  );
  // month/export 用の集約クエリ（prepare をルートで共有）
  const listDaysByLikeStmt = db.prepare('SELECT * FROM days WHERE date LIKE ? ORDER BY date');
  const listActsByLikeStmt = db.prepare(
    'SELECT date, slot_index AS slot, label, category FROM activities WHERE date LIKE ? ORDER BY date, slot_index'
  );
  const upsertDayStmt = db.prepare(`INSERT INTO days (
    date, sleep_minutes, fatigue_morning, fatigue_noon, fatigue_night,
    mood_morning, mood_noon, mood_night, note
  ) VALUES (@date,@sleep_minutes,@fatigue_morning,@fatigue_noon,@fatigue_night,
            @mood_morning,@mood_noon,@mood_night,@note)
  ON CONFLICT(date) DO UPDATE SET
    sleep_minutes=excluded.sleep_minutes,
    fatigue_morning=excluded.fatigue_morning,
    fatigue_noon=excluded.fatigue_noon,
    fatigue_night=excluded.fatigue_night,
    mood_morning=excluded.mood_morning,
    mood_noon=excluded.mood_noon,
    mood_night=excluded.mood_night,
    note=excluded.note`);
  const delActsStmt = db.prepare('DELETE FROM activities WHERE date = ?');
  const insActStmt = db.prepare(
    'INSERT INTO activities (date, slot_index, label, category) VALUES (?,?,?,?)'
  );

  function isISODate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  }

  function normalizeSlot(v) {
    if (typeof v === 'number' && Number.isInteger(v)) return v;
    if (typeof v === 'string' && /^\d{1,2}$/.test(v)) {
      const n = Number(v);
      if (Number.isInteger(n)) return n;
    }
    return null;
  }

  // --- API: GET /day
  api.get('/day', (req, res) => {
    const d = req.query.date;
    if (!isISODate(d)) return res.status(400).json({ error: 'bad date' });
    const row = getDayStmt.get(d) || {
      date: d,
      sleep_minutes: 0,
      fatigue_morning: 0,
      fatigue_noon: 0,
      fatigue_night: 0,
      mood_morning: 0,
      mood_noon: 0,
      mood_night: 0,
      note: '',
    };
    const acts = getActsStmt.all(d);
    res.json({
      date: row.date,
      sleep_minutes: row.sleep_minutes,
      fatigue: { morning: row.fatigue_morning, noon: row.fatigue_noon, night: row.fatigue_night },
      mood: { morning: row.mood_morning, noon: row.mood_noon, night: row.mood_night },
      note: row.note,
      activities: acts,
    });
  });

  // --- API: POST /day
  api.post('/day', (req, res) => {
    const p = req.body || {};
    if (!isISODate(p.date)) return res.status(400).json({ error: 'bad date' });
    const payload = {
      date: p.date,
      sleep_minutes: p.sleep_minutes | 0,
      fatigue_morning: p?.fatigue?.morning | 0,
      fatigue_noon: p?.fatigue?.noon | 0,
      fatigue_night: p?.fatigue?.night | 0,
      mood_morning: p?.mood?.morning | 0,
      mood_noon: p?.mood?.noon | 0,
      mood_night: p?.mood?.night | 0,
      note: String(p.note || ''),
    };
    const activities = Array.isArray(p.activities) ? p.activities : [];
    const seen = new Set();
    const normalizedActs = [];
    for (const a of activities) {
      const n = normalizeSlot(a?.slot);
      if (n === null || n < 0 || n > 47) {
        return res.status(400).json({ error: 'bad slot', slot: a?.slot });
      }
      if (seen.has(n)) {
        return res.status(400).json({ error: 'duplicate slot', slot: n });
      }
      seen.add(n);
      normalizedActs.push({
        slot: n,
        label: String(a?.label || ''),
        category: String(a?.category || ''),
      });
    }

    const tx = db.transaction(() => {
      upsertDayStmt.run(payload);
      delActsStmt.run(p.date);
      for (const a of normalizedActs) insActStmt.run(p.date, a.slot, a.label, a.category);
    });
    tx();
    res.json({ ok: true });
  });

  // --- API: GET /export?month=YYYY-MM (CSV)
  api.get('/export', (req, res) => {
    const m = String(req.query.month || '');
    if (!/^\d{4}-\d{2}$/.test(m)) return res.status(400).json({ error: 'bad month' });

    // Prepare queries
    const like = `${m}-%`;
    const daysStmt = db.prepare('SELECT * FROM days WHERE date LIKE ? ORDER BY date');
    const actsByDateStmt = db.prepare(
      'SELECT slot_index AS slot, label, category FROM activities WHERE date = ?'
    );

    function timeForSlot(i) {
      const h = String(Math.floor(i / 2)).padStart(2, '0');
      const m1 = i % 2 ? '30' : '00';
      const hn = String(Math.floor((i + 1) / 2)).padStart(2, '0');
      const mn = (i + 1) % 2 ? '30' : '00';
      return { start: `${h}:${m1}`, end: `${hn}:${mn}` };
    }

    const rows = [];
    rows.push(
      [
        'date',
        'slot_index',
        'time_start',
        'time_end',
        'category',
        'label',
        'sleep_minutes',
        'fatigue_morning',
        'fatigue_noon',
        'fatigue_night',
        'mood_morning',
        'mood_noon',
        'mood_night',
        'note',
      ].join(',')
    );

    const dayRows = daysStmt.all(like);
    for (const d of dayRows) {
      const acts = Object.create(null);
      for (const a of actsByDateStmt.all(d.date)) acts[a.slot] = a;
      for (let i = 0; i < 48; i++) {
        const t = timeForSlot(i);
        const a = acts[i] || { label: '', category: '' };
        rows.push(
          [
            d.date,
            String(i),
            t.start,
            t.end,
            escapeCsv(a.category),
            escapeCsv(a.label),
            d.sleep_minutes,
            d.fatigue_morning,
            d.fatigue_noon,
            d.fatigue_night,
            d.mood_morning,
            d.mood_noon,
            d.mood_night,
            escapeCsv(d.note || ''),
          ].join(',')
        );
      }
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dailylog_${m}.csv"`);
    res.send(csv);
  });

  // --- API: GET /month?month=YYYY-MM (JSON aggregate)
  api.get('/month', (req, res) => {
    const m = String(req.query.month || '');
    if (!/^\d{4}-\d{2}$/.test(m)) return res.status(400).json({ error: 'bad month' });

    // Prepare queries
    const like = `${m}-%`;

    // Build index of days and activities by date
    const byDate = Object.create(null);
    for (const d of listDaysByLikeStmt.all(like)) {
      byDate[d.date] = {
        date: d.date,
        sleep_minutes: d.sleep_minutes,
        fatigue: { morning: d.fatigue_morning, noon: d.fatigue_noon, night: d.fatigue_night },
        mood: { morning: d.mood_morning, noon: d.mood_noon, night: d.mood_night },
        note: d.note || '',
        activities: [],
      };
    }

    for (const a of listActsByLikeStmt.all(like)) {
      if (!byDate[a.date]) {
        byDate[a.date] = {
          date: a.date,
          sleep_minutes: 0,
          fatigue: { morning: 0, noon: 0, night: 0 },
          mood: { morning: 0, noon: 0, night: 0 },
          note: '',
          activities: [],
        };
      }
      byDate[a.date].activities.push({
        slot: a.slot | 0,
        label: a.label || '',
        category: a.category || '',
      });
    }

    // Ensure full month coverage (include days with no data)
    function daysInMonth(ym) {
      const [Y, MM] = ym.split('-').map(Number);
      const last = new Date(Y, MM, 0).getDate();
      const out = [];
      for (let d = 1; d <= last; d++) out.push(`${ym}-${String(d).padStart(2, '0')}`);
      return out;
    }

    const days = [];
    for (const d of daysInMonth(m)) {
      const row = byDate[d] || {
        date: d,
        sleep_minutes: 0,
        fatigue: { morning: 0, noon: 0, night: 0 },
        mood: { morning: 0, noon: 0, night: 0 },
        note: '',
        activities: [],
      };
      // Ensure activities are sorted by slot
      if (Array.isArray(row.activities) && row.activities.length > 1) {
        row.activities.sort((a, b) => (a.slot | 0) - (b.slot | 0));
      }
      days.push(row);
    }

    res.json({ month: m, days });
  });

  function escapeCsv(v) {
    const s = String(v ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return '"' + s.replaceAll('"', '""') + '"';
    }
    return s;
  }

  // Mount API under /api and also under BASE_PATH + /api for reverse proxies with a prefix
  app.use('/api', api);
  if (BASE_PATH) app.use(BASE_PATH + '/api', api);

  // Static files (serve at root and, if BASE_PATH set, also under BASE_PATH)
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir, { extensions: ['html'] }));
  if (BASE_PATH) app.use(BASE_PATH, express.static(publicDir, { extensions: ['html'] }));

  return {
    app,
    db,
    close: () => {
      try {
        db.close();
      } catch {}
    },
  };
}

module.exports = { createApp };
