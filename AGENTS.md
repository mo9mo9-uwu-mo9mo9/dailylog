# Repository Guidelines

## 目次

- [プロジェクト構成とモジュール整理](#プロジェクト構成とモジュール整理)
- [ビルド・テスト・開発コマンド](#ビルドテスト開発コマンド)
- [コーディング規約と命名](#コーディング規約と命名)
- [テスト方針](#テスト方針)
- [コミットとPRガイドライン](#コミットとprガイドライン)
- [セルフレビュー（任意・指示ベース）](#セルフレビュー任意指示ベース)
- [Issue 運用ルール（重要・明文化）](#issue-運用ルール重要明文化)
- [コミュニケーション言語（重要）](#コミュニケーション言語重要)
- [開発フロー（重要）](#開発フロー重要)
- [作業依頼と承認フロー（重要）](#作業依頼と承認フロー重要)
- [Issue/PR 統合（低リスクの効率化）](#issuepr-統合低リスクの効率化)
- [デプロイ（本番自動化・明文化）](#デプロイ本番自動化明文化)
- [GitHub CLI（gh）の利用方針（重要・明文化）](#github-cli-ghの利用方針重要明文化)
- [ラベル運用の明文化（必須）](#ラベル運用の明文化必須)
- [Codex レビュー依頼の手順（任意・明示）](#codex-レビュー依頼の手順任意明示)
- [PR マージ後の運用（main チェックアウトとブランチ整理）](#pr-マージ後の運用main-チェックアウトとブランチ整理)
- [セキュリティ/設定のヒント（任意）](#セキュリティ設定のヒント任意)
- [ドキュメント運用と命名（重要）](#ドキュメント運用と命名重要)

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

#### Conventional Commits のOK/NG例

- OK例:
  - `feat(api): 週次集計のCSV出力を追加`
  - `fix(auth): Basic認証の401戻り値を修正`
  - `chore(ci): Node 20.x でのCI行を追加`
- NG例:
  - `update` / `misc` / `fix bug`
  - 日本語のみで型なし（例: `修正しました`）

### セルフレビュー（任意・指示ベース）

- 原則: PR本文に専用のセルフレビュー欄は設けません。
- 運用: 必要時に作成者/依頼者の指示で Codex にレビューを依頼し、結果は PR コメントに投稿します。
- 依頼手順: PR に `codex:review` ラベルを付与し、GitHub Actions の "Auto Codex Review" を `workflow_dispatch` で実行します。
- 観点の例（コメントに記載推奨）:
  - 受け入れ基準（画面/印刷/API）
  - UI/印刷の確認（拡大縮小・印刷プレビュー）
  - セキュリティ（XSS/入力検証/認可）
  - エラーハンドリング・境界値
  - パフォーマンス（無駄な再描画/重い処理）
  - i18n/表記・単位・日付整合
  - 影響範囲（既存ページ/月次/印刷/API）
  - テスト/CI（lint/format/test の通過、手動確認の記録）

## Issue 運用ルール（重要・明文化）

- **優先度ラベルは必須**: すべての Issue に `priority:P0` または `priority:P1` を必ず付与する。
  - `P0`: 最優先（MVP必須）。
  - `P1`: 優先（MVP後すぐ）。
- **分類ラベルの付与**: `type:feature` / `type:infra` / `type:test` などの種別ラベルを併記する。
- **完了時のクローズ**: 実装が main に取り込まれたら、根拠（PR/コミット/確認結果）をコメントして Close。
- **不要Issueの整理**: 仕様変更等で不要になった場合は根拠を明記して Close。

## コミュニケーション言語（重要）

- 本リポジトリの Issue / PR / コミットメッセージ / ドキュメント / やり取りは、原則として「日本語のみ」を使用します（英語不可）。

#### 日本語運用のOK/NG例

- OK例:
  - 「この変更の目的は○○。影響範囲はAPIのみ。テストは8件すべて緑。」
  - 「CIログ引用＋一言和訳（例: `All tests passed` → 全テスト成功）」
- NG例:
  - 英語だけの要約・スラングのみ（例: “LGTM, ship it”）
  - 絵文字のみの承認（👍 だけ 等）

## 開発フロー（重要）

- 変更は必ず「調査 → Issue 作成 → Issue に基づく PR」の順で進める。
- PR には関連 Issue を必ず明記する（例: `関連 Issue: #123` または `Closes #123`）。
- 相談・質問があった場合は、即実装に入らず、まず「意見（選択肢/メリデメ/推奨）」を日本語で回答し、合意のうえで実装に進む。
  - 流れ: 相談 → 意見・比較 → 方針合意 → Issue に方針を明記 → PR 実装。
  - 例: 「SVG と CSS の比較」「線幅/配色の候補」「リスク/影響範囲」の提示。
- CI で PR 本文／タイトルに Issue 参照が無い場合は失敗させる（.github/workflows/pr-issue-check.yml）。
- 追加の指示がユーザーから出た場合:
  - まず実現方法を分析し、方針・影響範囲・受け入れ基準を整理した「Issue」を必ず作成する。
  - Issue のレビュー（必要なら質疑）後に、当該 Issue に基づく PR を作成する。
  - 一気に実装に着手（直接コミット/PR）するのはNG。

### 作業依頼と承認フロー（重要）

- 基本原則: 指示なしで実装に着手しない。無言着手→事後報告は禁止。
- 手順: 作業指示を受領したら、以下の順で必ず合意を取る。
  1. 不明点の確認（箇条書きで質問）
  2. 作業内容の明示（下記テンプレに沿って提示）
  3. 承認キーワードの提示（固定: 「OK」=着手可 / 「NG」=中止・修正依頼）
  4. 「OK」の明示があるまで実装やコマンド実行は行わない（待機時間の既定なし）
- 作業内容テンプレ（提示項目）:
  - 目的/背景
  - 範囲/非対象
  - 受け入れ基準（何ができたら完了か）
  - 影響範囲（UI/DB/API/CI/運用）
  - リスク/戻し方（ロールバック方針）
  - 実施手順（ステップ一覧・所要目安）
  - 前提/制約・オープンな質問
- 承認キーワード: 固定「OK/NG」。明示の「OK」まで着手しない。
- 待機時間: 設定しない（承認が出るまで待機）。
- 例外運用: なし。必要が生じた場合のみ、その都度合意して例外を定義する。

#### 提案テンプレ（コピペ用）

```
目的/背景:
範囲/非対象:
受け入れ基準:
影響範囲(UI/DB/API/CI/運用):
リスク/戻し方:
実施手順(所要目安):
前提/制約・質問:

承認キーワード: OK / NG
```

### Issue/PR 統合（低リスクの効率化）

- 目的: 断片化の解消、レビュー負荷の低減、デプロイ回数の最適化。
- 判断基準（統合候補）:
  - 重複/包括（実質同じ内容、片方がもう片方を包含）
  - 近接テーマ（同一機能・同一ドメインの小改修が散在）
  - 同一ファイル/近接行で競合が想定される変更
  - ドキュメントのみ微修正、リリース影響なし
  - 優先度/ラベルが一致または整合可能
- 提案手順（実装前）:
  - 統合候補一覧 → 理由 → 推奨アクション → 影響/リスク → 戻し方 → 対象リンク（Issue/PR番号）を提示
  - あなたの「OK」を受けて統合を実施
- 実施手順（合意後）:
  - Issue: 片方へ集約し、他方はコメントで根拠（リンク/理由）を添えて Close。ラベル/優先度を引継ぎ
  - PR: 上位PRへ取り込み（コミット/差分）し、下位PRはコメントで Close（または再作成）。必要に応じてチェックリスト化
  - 履歴: Squashマージを基本とし、関連Issueの参照（Closes #n / 関連 Issue: #n）を明記
- ロールバック: 統合が不適切と判明した場合は元のIssue/PRを再オープン or 新規作成で切り戻し

#### コメント雛形（コピペ用）

Issue重複/包括のClose:

```
重複/包括のため本IssueはCloseします。統合先: #<番号>
理由: <重複/包括の理由>
引継ぎ: ラベル/優先度は統合先に反映済み。
再オープン条件: 統合先でカバーできない論点がある場合はコメントしてください。
```

PR統合告知（下位PRをClose）:

```
本PRの変更は #<番号> に取り込みました。以降は統合先でレビューをお願いします。
理由: 変更範囲の重複/競合回避・レビュー集約のため。
ロールバック: 必要であれば再PRを作成します。
```

## デプロイ（本番自動化・明文化）

- 運用: push to `main` で GitHub Actions "Deploy (production)" が self-hosted ランナー（n100ubuntu-dailylog）上で実行され、自動で本番が最新化される。
  - 処理: `git reset --hard origin/main` → `npm ci --omit=dev` → `systemctl restart dailylog` → ヘルスチェック（127.0.0.1:3002/api/health の 200/401 をOKとする）。
  - 公開: Tailscale Funnel 経由（例: `https://<host>.<tailnet>.ts.net/dailylog/`）。
- 手動実行: Actions から "Deploy (production)" を `workflow_dispatch` で実行可能。
- フォールバック（SSH）:
  ```bash
  ssh <prod-host>
  cd /srv/dailylog
  git fetch --prune && git reset --hard origin/main
  npm ci --omit=dev
  sudo systemctl restart dailylog
  curl -i http://127.0.0.1:3002/api/health
  ```
- 注意: 本番での直編集は禁止。更新は必ず PR → main → 自動デプロイの経路で行う。

## GitHub CLI（gh）の利用方針（重要・明文化）

- 本プロジェクトの Issue/PR/レビュー操作は、原則として GitHub CLI `gh` を使用します（UI 操作可だが既定は gh）。
- 事前条件: `gh auth status` でログイン済みであること（必要なら `gh auth login`）。

### よく使うコマンド例

```bash
# Issue 作成（必ず優先度＋種別ラベルを付与）
gh issue create \
  --title "feat: 〇〇を追加" \
  --body  "背景/方針/受け入れ基準を日本語で記載" \
  --label "priority:P1" --label "type:feature"

# 既存 Issue にラベル追加
gh issue edit <番号> --add-label "priority:P0,type:infra"

# PR 作成（本文に関連 Issue を必ず明記）
gh pr create \
  --base main --head <topic-branch> \
  --title "feat: 〇〇を実装" \
  --body  $'関連 Issue: #<番号>\n\n概要/方針/受け入れ基準を日本語で記載'

# CI は PR 本文/タイトルに Issue 参照が無いと失敗（.github/workflows/pr-issue-check.yml）

# PR レビュー状況の確認
gh pr view --web    # ブラウザで開く
gh pr checks        # CI 状況

# マージ（Squash＋ブランチ削除を既定とする）
gh pr merge --squash --delete-branch

# マージ後の Issue クローズ（根拠をコメント）
gh issue close <番号> \
  --comment "PR #<PR番号> を main にマージ済み。受け入れ基準を満たすことを確認し Close。"

# 参考: ラベルの作成（初回のみ、権限保持者が実施）
gh label create "priority:P0" --color FF0000 --description "最優先（MVP必須）"
gh label create "priority:P1" --color FFA500 --description "優先（MVP後すぐ）"
gh label create "codex:review" --color BFDADC --description "Codex レビューの手動依頼に使用"
```

#### 追加チートシート（頻出1行）

- CI結果一覧: `gh pr checks <PR番号>`
- 直近のデプロイ履歴: `gh run list --workflow "Deploy (production)" --limit 5`
- ヘルスチェック（本番）: `curl -i http://127.0.0.1:3002/api/health`
- PRのWeb表示: `gh pr view <PR番号> --web`
- ラベル一括付与: `gh issue edit <番号> --add-label "priority:P1,type:infra"`

- すべてのコミュニケーション（Issue/PR/コメント/本文/コミットメッセージ）は日本語で記載してください。
- `main` 直コミットは禁止。必ず Issue 起票 → ブランチ → PR（gh）で進めてください。

### ラベル運用の明文化（必須）

- すべての Issue は作成時点で以下を必ず付与する:
  - 優先度: `priority:P0` または `priority:P1`（必須・いずれか1つ）
  - 種別: `type:feature` / `type:infra` / `type:test` など（少なくとも1つ）
- ラベルがリポジトリに存在しない場合は、その場で作成すること（`gh label create`）。権限保持者は初回に標準セットを作成してください。
- 補助スクリプト: `scripts/gh-labels-init.sh` を用意しています。初回または不足時に実行してください。

```bash
# 例: ラベルが無い場合に作成してから Issue を起票
scripts/gh-labels-init.sh
gh issue create \
  --title "feat: 〇〇を追加" \
  --body  "背景/方針/受け入れ基準（日本語）" \
  --label "priority:P1" --label "type:feature"
```

### Codex レビュー依頼の手順（任意・明示）

- 自動投稿は無効。必要時のみ手動で実行します。
- 手順:
  - 対象 PR に `codex:review` ラベルを付与
  - GitHub Actions の "Auto Codex Review" を `workflow_dispatch` で実行し、`pr_number` を指定、`confirm` を `true` にする
- ラベルが無い場合は投稿されません（安全策）。

### PR マージ後の運用（main チェックアウトとブランチ整理）

- PR を `main` にマージしたら、ローカルで `main` にチェックアウトして最新化し、マージ済みブランチを整理することを明文化する。
- 手順（Squash Merge 推奨の前提）:
  1. 取得と `main` 最新化

  ```bash
  git fetch origin
  git checkout main
  git pull --ff-only
  ```

  2. マージ済みトピックブランチの削除（ローカル／リモート）

  ```bash
  # ローカル削除（未マージの場合は失敗する）
  git branch -d <topic-branch>

  # リモート削除（または GitHub の「Delete branch」ボタン）
  git push origin --delete <topic-branch>

  # 追跡ブランチの掃除（任意）
  git fetch -p
  ```

- 注意:
  - 未マージブランチは `-d` では削除されない。強制削除（`-D`）は原則禁止。必要時は合意のうえで実施。
  - リリースタグ等が必要な場合はタグ付け後に削除すること。
  - `main` 直コミットは禁止（ブランチ保護）。

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

#### 運用の棲み分け

- `AGENTS.md`: 規範ドキュメント（運用ルールのソース・オブ・トゥルース）。PRで管理し、履歴を残す。
- `tmp/docs/`: 作業メモ/設計ドラフト（Git管理外）。公開時は必要に応じてサニタイズし別配布。

---

### 付録: P0緊急時の短縮フロー（合意時のみ）

```
状況: P0/緊急。最小影響で復旧を優先。
即時案: <最小手当の内容>（所要 <分>）
影響/リスク: <簡潔に>
戻し方: <簡潔に>
承認キーワード: OK / NG
```

> このリポジトリは現在最小構成です。上記の標準に従い、初回のコード追加時に必要なディレクトリと設定を作成してください。
