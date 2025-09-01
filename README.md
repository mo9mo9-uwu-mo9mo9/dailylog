# DailyLog

日次の「生活行動表」アプリと、N100 常時公開サーバ運用ノートをまとめる小規模リポジトリです。実装は軽量・単一バイナリ志向（Node.js + Express + SQLite）を想定し、公開には Tailscale Funnel を利用します。

## 収録ドキュメント
- サーバ構築: [docs/n_100_常時公開サーバ｜os選定と構築ガイド_v_1.md](docs/n_100_常時公開サーバ｜os選定と構築ガイド_v_1.md)
- アプリ仕様: [docs/生活行動表アプリ_v_0.md](docs/生活行動表アプリ_v_0.md)

## 目的と現状
- 目的: 日次の行動・指標を簡潔に記録し、A4 横印刷できる UI を提供。API は `/api/day` を中心とした最小構成。
- 現状: ドキュメント先行。コードは未同梱（スケルトンは docs に記載）。

## クイックスタート（開発用の雛形）
```bash
# Node 20+ を推奨
node -v

# 1) 初期化 & 依存
npm init -y
npm i express helmet compression dotenv better-sqlite3
npm i -D nodemon vitest supertest eslint prettier

# 2) 実行（server.js を用意した場合）
npx nodemon server.js
# 3) テスト（導入後）
npx vitest -r
```

## 想定ディレクトリ
```
.
├─ docs/                   # 設計・運用ドキュメント
├─ server.js               # API/静的配信（後で追加）
├─ public/                 # フロント（後で追加）
└─ data/                   # SQLite（Git 管理外）
```

## 貢献ガイド
- コーディング/命名/PR ルールは [AGENTS.md](AGENTS.md) を参照。
- ドキュメント命名は `docs/<分類>_<番号>_<タイトル>_v_<整数>.md` を推奨（例は AGENTS.md 参照）。

## ライセンス
未定（必要に応じて追記）。

