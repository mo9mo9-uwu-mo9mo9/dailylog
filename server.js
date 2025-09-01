require('dotenv').config();
const { createApp } = require('./src/app');

const { app } = createApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[server] Listening on http://127.0.0.1:${PORT}`));
