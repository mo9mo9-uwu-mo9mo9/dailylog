# DailyLog

日次の「生活行動表」アプリと、N100 常時公開サーバ運用ノートをまとめる小規模リポジトリです。実装は軽量・単一バイナリ志向（Node.js + Express + SQLite）を想定し、公開には Tailscale Funnel を利用します。

## ドキュメント取り扱い

- 機微情報を含むため、設計/運用ドキュメントは Git 管理外とします。
- 保管場所: ローカルの `tmp/docs/`（このリポジトリでは無視されます）。
- 公開可能な資料が必要になった場合のみ、別リポジトリや配布用ドキュメントに切り出します。

## 目的と現状

- 目的: 日次の行動・指標を簡潔に記録し、A4 横印刷できる UI を提供。API は `/api/day` を中心とした最小構成。
- 現状: 月次グラフの視認性改善（配色3段階＋高さ可変）とモノクロ印刷最適化を実装済み（関連 Issue: #37 / PR: #38）。

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

## 表示設定（月次グラフ/日次）

- 配色トーン（3段階）
  - 高コントラスト（`pal=hc`）: 識別最優先。レビューや共有向け。
  - ミドル（`pal=mid`）: 既定。目に刺さりにくく実用的な中間トーン。
  - 淡色（`pal=pastel`）: 旧配色に近い淡い色味。
- セル高さ（4段階・月次のみ）
  - `h=10|14|18|22`（px）。既定は 14。
- 保存/復元
  - `localStorage` に `dailylog.pal` / `dailylog.cell_h` を保存。URL パラメータ指定がある場合はそちらを優先。
- 例
  - 月次（ミドル＋高さ14px）: `/month.html?month=2025-09&pal=mid&h=14`
  - サンプル表示（DB不要）: `?sample=1..6` を付与（例: `&sample=3`）

## 印刷（モノクロ推奨設定）

- A4 横・倍率100%・背景グラフィックONを推奨。
- 月次はカテゴリ別の粗めパターン＋薄い罫線で判別性を確保（`@media print`）。
- 高さは 14px 既定。判別しにくい場合は画面上で 18px に上げてから印刷。

## 日次との連携

- 月次から日次へ遷移する際に `pal`（配色）を引き継ぎます。
- 日次も URL / `localStorage` の `dailylog.pal` を読み取り `palette-*` を適用します。
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
- 本プロジェクトでは GitHub CLI（`gh`）の利用を標準とします（Issue/PR/レビュー操作）。初回は `gh auth login`、以降は `gh auth status` で確認してください。
- ドキュメント命名は `<分類>_<番号>_<タイトル>_v_<整数>.md` を推奨（保管は `tmp/docs/`）。

### Issue ラベル（必須）

- すべての Issue に `priority:P0` または `priority:P1` を必ず付与し、`type:*` ラベル（例: `type:feature`）を少なくとも1つ併記します。
- ラベルが存在しない場合は作成してください。初回は `scripts/gh-labels-init.sh` を実行すると標準セットを自動作成します（冪等）。
- 例（作成と起票）:

```bash
scripts/gh-labels-init.sh
gh issue create \
  --title "feat: 〇〇を追加" \
  --body  "背景/方針/受け入れ基準（日本語）" \
  --label "priority:P1" --label "type:feature"
```

## 運用（参考）

- 本番は N100 サーバ（Ubuntu）上で `systemd` 常駐、公開は Tailscale Funnel を使用。
- サービス名: `dailylog.service`、作業ディレクトリ: `/srv/dailylog`。
- 再起動: `sudo systemctl restart dailylog`、疎通: `curl -u $AUTH_USER:$AUTH_PASS http://127.0.0.1:$PORT/api/health`。

### Runner 設定ファイル（ローカル機密設定）

- 読み込み優先: `local/runner.env` → （後方互換）`tmp/local/runner.env`。
- `tmp/local/runner.env` は廃止予定です。`local/runner.env` に移行してください。
- `local/` は `.gitignore` 済み（Git 管理外）。

## ライセンス

未定（必要に応じて追記）。
