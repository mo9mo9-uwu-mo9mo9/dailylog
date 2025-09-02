#!/usr/bin/env node
const { initDb, defaultDbPath } = require('../src/db');

const dbPath = defaultDbPath();
const db = initDb(dbPath);
console.log(`[db:init] initialized at: ${dbPath}`);
db.close();
