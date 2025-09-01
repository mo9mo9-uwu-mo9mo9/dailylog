# DailyLog

日次の「生活行動表」アプリと、N100 常時公開サーバ運用ノートをまとめる小規模リポジトリです。実装は軽量・単一バイナリ志向（Node.js + Express + SQLite）を想定し、公開には Tailscale Funnel を利用します。

## ドキュメント取り扱い
- 機微情報を含むため、設計/運用ドキュメントは Git 管理外とします。
- 保管場所: ローカルの `tmp/docs/`（このリポジトリでは無視されます）。
- 公開可能な資料が必要になった場合のみ、別リポジトリや配布用ドキュメントに切り出します。

## 目的と現状
- 目的: 日次の行動・指標を簡潔に記録し、A4 横印刷できる UI を提供。API は `/api/day` を中心とした最小構成。
- 現状: 実装前。Issue/マイルストーンに沿って MVP 構築中。

## クイックスタート（開発用の雛形）
```bash
# Node 20+ を推奨
node -v

# 1) 初期化 & 依存
npm init -y
npm i express helmet compression dotenv better-sqlite3
npm i -D nodemon vitest supertest eslint prettier

# 2) .env を作成（例）
cp .env.example .env
sed -i.bak 's/^PORT=.*/PORT=3002/' .env && rm .env.bak

# 3) 実行（開発: nodemon / 本番: node or systemd）
npx nodemon server.js
# 3) テスト（導入後）
npx vitest -r
```

## 想定ディレクトリ
```
.
├─ server.js               # API/静的配信（後で追加）
├─ public/                 # フロント（後で追加）
├─ data/                   # SQLite（Git 管理外）
└─ tmp/docs/               # 私的ドキュメント（Git 管理外）

## 環境変数
- `PORT`: リッスンポート（例: 3002）
- `DATA_DIR`: SQLite の格納ディレクトリ（例: ./data）
- `DB_FILE`: SQLite ファイル名（例: dailylog.db / `:memory:` ならメモリDB）
- `AUTH_USER` / `AUTH_PASS`: 設定すると Basic 認証が有効
```

## 貢献ガイド
- コーディング/命名/PR ルールは [AGENTS.md](AGENTS.md) を参照。
- ドキュメント命名は `<分類>_<番号>_<タイトル>_v_<整数>.md` を推奨（保管は `tmp/docs/`）。

## ライセンス
未定（必要に応じて追記）。
