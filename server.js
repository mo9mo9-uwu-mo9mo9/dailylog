const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const { initDb } = require('./src/db');

// Ensure DB ready
initDb();

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Static files
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[server] Listening on http://127.0.0.1:${PORT}`));
