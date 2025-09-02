#!/usr/bin/env bash
set -euo pipefail

# リポジトリに標準ラベルが無い場合は作成します（冪等）。
# 前提: gh にログイン済み（gh auth status）。

have_jq() {
  command -v jq >/dev/null 2>&1
}

label_exists() {
  local name="$1"
  if have_jq; then
    gh label list --limit 200 --json name | jq -r '.[].name' | grep -Fxq "$name" 2>/dev/null || return 1
  else
    gh label list --limit 200 | awk '{print $1}' | grep -Fxq "$name" 2>/dev/null || return 1
  fi
}

ensure_label() {
  local name="$1"; shift
  local color="$1"; shift
  local desc="$*"
  if label_exists "$name"; then
    echo "[skip] ${name} は既に存在します" >&2
  else
    echo "[add] ${name}" >&2
    gh label create "$name" --color "$color" --description "$desc"
  fi
}

echo "==> ラベルの存在確認（必要なら作成）"
ensure_label "priority:P0" FF0000 "最優先（MVP必須）"
ensure_label "priority:P1" FFA500 "優先（MVP後すぐ）"

ensure_label "type:feature" 0E8A16 "機能追加"
ensure_label "type:infra"   0052CC "インフラ/環境/CI"
ensure_label "type:test"    5319E7 "テスト/品質"
ensure_label "type:bug"     D73A4A "不具合修正"
ensure_label "type:docs"    1D76DB "ドキュメント"

echo "==> 完了しました"

