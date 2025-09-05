require('dotenv').config();
const { createApp } = require('./src/app');

const { app } = createApp();

// 本番は 3002 を既定ポートとする（.env / systemd が無い環境でも Deploy のヘルスチェックと一致させる）
const PORT = process.env.PORT || 3002;
// README の確認手順に合わせ、URLを含む形式で出力する
const HOST_LOG = '127.0.0.1'; // 表示用（実際の bind は OS 既定）
const basePath = (process.env.BASE_PATH || '').trim();
app.listen(PORT, () => {
  const url = `http://${HOST_LOG}:${PORT}`;
  // 1行目は README が期待する形式
  console.log(`[server] Listening on ${url}`);
  // BASE_PATH が設定されていれば補足を出す（例: /dailylog, /dailylog-dev）
  if (basePath && basePath !== '/') {
    console.log(`[server] Base path: ${basePath}`);
  }
});
