const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function defaultDbPath() {
  const envFile = process.env.DB_FILE;
  if (envFile === ':memory:' || envFile === 'file::memory:?cache=shared') {
    return envFile; // real in-memory DB for tests
  }
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  ensureDir(dataDir);
  return path.join(dataDir, envFile || 'dailylog.db');
}

function openDb(dbFile) {
  const file = dbFile || defaultDbPath();
  const db = new Database(file);
  // Pragmas: use WAL on file DBs; avoid WAL on memory DBs to prevent lock errors
  try {
    if (db.memory) {
      db.pragma('journal_mode = MEMORY');
      db.pragma('synchronous = OFF');
    } else {
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
    }
  } catch (_) {
    // Ignore pragma errors in test environments
  }
  return db;
}

function initDb(dbFile) {
  const db = openDb(dbFile);
  db.exec(`
    CREATE TABLE IF NOT EXISTS days (
      date            TEXT PRIMARY KEY,
      sleep_minutes   INTEGER DEFAULT 0,
      fatigue_morning INTEGER DEFAULT 0,
      fatigue_noon    INTEGER DEFAULT 0,
      fatigue_night   INTEGER DEFAULT 0,
      mood_morning    INTEGER DEFAULT 0,
      mood_noon       INTEGER DEFAULT 0,
      mood_night      INTEGER DEFAULT 0,
      note            TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS activities (
      date        TEXT NOT NULL,
      slot_index  INTEGER NOT NULL,
      label       TEXT DEFAULT '',
      PRIMARY KEY(date, slot_index)
    );
  `);
  return db;
}

module.exports = { openDb, initDb, defaultDbPath };
