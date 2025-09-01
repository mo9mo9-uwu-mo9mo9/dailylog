# Repository Guidelines

## プロジェクト構成とモジュール整理

- **標準構成**: `src/` 本体実装, `tests/` テスト, `scripts/` 補助スクリプト, `assets/` 共有アセット。ドキュメントは **Git 管理外**（`tmp/docs/`）。
- **配置方針**: 入口は `src/main.*` またはパッケージの `__main__`/`cli`。テストはミラー構成（例: `src/foo/bar.py` → `tests/foo/test_bar.py`）。
- **設定優先**: `pyproject.toml`/`package.json`/`Makefile` 等が存在する場合はその定義を最優先。

## ビルド・テスト・開発コマンド

- **Node 例**: `npm i`（依存取得）, `npm run dev`（ローカル実行）, `npm test`（単体テスト）, `npm run build`（ビルド）。
- **Python 例**: `python -m venv .venv && source .venv/bin/activate`（仮想環境）, `pip install -r requirements.txt` または `pip install -e .`（依存）, `pytest -q`（テスト）, `python -m dailylog` または `python src/main.py`（実行）。
- **Makefile がある場合**: `make lint`/`make format`/`make test` を利用。

## コーディング規約と命名

- **インデント**: Python 4スペース, JS/TS 2スペース。改行は LF, UTF-8。
- **命名**: Python は `snake_case.py`、JS/TS は `kebab-case.ts` 可。ブランチは `feat/<短い説明>` / `fix/<短い説明>`。
- **整形/静的解析**: JS/TS は `eslint`/`prettier`、Python は `ruff`/`black` 推奨（例: `ruff check . && black .`）。可能なら `pre-commit` で自動化。

## テスト方針

- **フレームワーク**: Python は `pytest`、JS/TS は `vitest`/`jest` を想定。
- **命名/配置**: `tests/test_*.py`、`*.test.ts`。外部I/Oはモック化。
- **カバレッジ**: 目安 80%+。例: `pytest --cov=src`、`npm test -- --coverage`。

## コミットとPRガイドライン

- **コミット規約**: Conventional Commits（例: `feat(cli): 週次集計を追加`、`fix: 日付パースの不具合`）。小さく一貫した変更単位で。
- **PR 要件**: 目的・背景、変更点、関連Issue、スクリーンショット/ログ、テスト観点。CI緑（lint/format/test 通過）が前提。
- **レビュー**: 差分は読みやすく。破壊的変更は `BREAKING CHANGE:` を記載。

## コミュニケーション言語（重要）

- 本リポジトリの Issue / PR / コミットメッセージ / ドキュメント / やり取りは、原則として「日本語のみ」を使用します（英語不可）。

## 開発フロー（重要）

- 変更は必ず「調査 → Issue 作成 → Issue に基づく PR」の順で進める。
- PR には関連 Issue を必ず明記する（例: `関連 Issue: #123` または `Closes #123`）。
- CI で PR 本文／タイトルに Issue 参照が無い場合は失敗させる（.github/workflows/pr-issue-check.yml）。

## セキュリティ/設定のヒント（任意）

- **秘密情報**: `.env` はコミット禁止。`env.example` を用意し環境変数で注入。
- **依存管理**: ロックファイルを更新したらPRに理由を明記。
- **ブランチ保護**: `main` 直コミット禁止、Squash Merge 推奨。

## ドキュメント運用と命名（重要）

- **保管先**: 設計/運用ドキュメントは `tmp/docs/` に保存（Git には含めない）。
- **命名パターン**: `<分類>_<番号>_<タイトル>_v_<整数>.md`
- **例**:
  - `tmp/docs/n_100_常時公開サーバ｜os選定と構築ガイド_v_1.md`
  - `tmp/docs/生活行動表アプリ_v_0.md`
- **ルール**: 日本語タイトル可、区切りはアンダースコア。版数は `v_0` から昇順。公開が必要な場合は内容をサニタイズして別配布とする。

> このリポジトリは現在最小構成です。上記の標準に従い、初回のコード追加時に必要なディレクトリと設定を作成してください。
