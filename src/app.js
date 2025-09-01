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

  // Health
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // --- Helpers (DB statements)
  const getDayStmt = db.prepare('SELECT * FROM days WHERE date = ?');
  const getActsStmt = db.prepare(
    'SELECT slot_index AS slot, label FROM activities WHERE date = ? ORDER BY slot_index'
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
  const insActStmt = db.prepare('INSERT INTO activities (date, slot_index, label) VALUES (?,?,?)');

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

  // --- API: GET /api/day
  app.get('/api/day', (req, res) => {
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

  // --- API: POST /api/day
  app.post('/api/day', (req, res) => {
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
      normalizedActs.push({ slot: n, label: String(a?.label || '') });
    }

    const tx = db.transaction(() => {
      upsertDayStmt.run(payload);
      delActsStmt.run(p.date);
      for (const a of normalizedActs) insActStmt.run(p.date, a.slot, a.label);
    });
    tx();
    res.json({ ok: true });
  });

  // Static files
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir, { extensions: ['html'] }));

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
