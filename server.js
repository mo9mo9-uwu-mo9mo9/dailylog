require('dotenv').config();
const { createApp } = require('./src/app');

const { app } = createApp();

// 本番は 3002 を既定ポートとする（.env / systemd が無い環境でも Deploy のヘルスチェックと一致させる）
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`[server] Listening on :${PORT}`));
