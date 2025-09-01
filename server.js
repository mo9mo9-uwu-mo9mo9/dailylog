const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const { initDb } = require('./src/db');

// Ensure DB ready and get handle
const db = initDb();

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Optional Basic Auth (enabled when AUTH_USER/PASS are set)
const AUTH_USER = process.env.AUTH_USER || '';
const AUTH_PASS = process.env.AUTH_PASS || '';
function basicAuth(req, res, next) {
  if (!AUTH_USER || !AUTH_PASS) return next();
  const hdr = req.headers['authorization'] || '';
  if (!hdr.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="DailyLog"');
    return res.status(401).send('Auth required');
  }
  const [u, p] = Buffer.from(hdr.split(' ')[1], 'base64').toString().split(':');
  if (u === AUTH_USER && p === AUTH_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="DailyLog"');
  return res.status(401).send('Bad credentials');
}
app.use(basicAuth);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Helpers (DB statements)
const getDayStmt = db.prepare('SELECT * FROM days WHERE date = ?');
const getActsStmt = db.prepare('SELECT slot_index AS slot, label FROM activities WHERE date = ? ORDER BY slot_index');
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

function isISODate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s||''); }

// --- API: GET /api/day
app.get('/api/day', (req, res) => {
  const d = req.query.date;
  if (!isISODate(d)) return res.status(400).json({ error: 'bad date' });
  const row = getDayStmt.get(d) || {
    date: d, sleep_minutes: 0,
    fatigue_morning: 0, fatigue_noon: 0, fatigue_night: 0,
    mood_morning: 0, mood_noon: 0, mood_night: 0, note: ''
  };
  const acts = getActsStmt.all(d);
  res.json({
    date: row.date,
    sleep_minutes: row.sleep_minutes,
    fatigue: { morning: row.fatigue_morning, noon: row.fatigue_noon, night: row.fatigue_night },
    mood: { morning: row.mood_morning, noon: row.mood_noon, night: row.mood_night },
    note: row.note,
    activities: acts
  });
});

// --- API: POST /api/day
app.post('/api/day', (req, res) => {
  const p = req.body || {};
  if (!isISODate(p.date)) return res.status(400).json({ error: 'bad date' });
  const payload = {
    date: p.date,
    sleep_minutes: p.sleep_minutes|0,
    fatigue_morning: p?.fatigue?.morning|0,
    fatigue_noon: p?.fatigue?.noon|0,
    fatigue_night: p?.fatigue?.night|0,
    mood_morning: p?.mood?.morning|0,
    mood_noon: p?.mood?.noon|0,
    mood_night: p?.mood?.night|0,
    note: String(p.note || '')
  };
  const activities = Array.isArray(p.activities) ? p.activities : [];
  if (activities.some(a => (a.slot|0) < 0 || (a.slot|0) > 47)) return res.status(400).json({ error: 'bad slot' });

  const tx = db.transaction(() => {
    upsertDayStmt.run(payload);
    delActsStmt.run(p.date);
    for (const a of activities) insActStmt.run(p.date, a.slot|0, String(a.label||''));
  });
  tx();
  res.json({ ok: true });
});

// Static files
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[server] Listening on http://127.0.0.1:${PORT}`));
