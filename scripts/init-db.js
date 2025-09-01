#!/usr/bin/env node
const { initDb, defaultDbPath } = require('../src/db');
const path = require('path');

const dbPath = defaultDbPath();
const db = initDb(dbPath);
const file = db.name || db.memory ? '(memory)' : dbPath;
console.log(`[db:init] initialized at: ${dbPath}`);
db.close();
