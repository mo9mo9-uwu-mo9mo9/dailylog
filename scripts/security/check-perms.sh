#!/usr/bin/env bash
set -euo pipefail

# 権限点検（read-only）。--strict で不備があれば非0終了。

STRICT=0
[[ "${1:-}" == "--strict" ]] && STRICT=1

warn() { echo -e "\e[33m[WARN]\e[0m $*"; }
ok()   { echo -e "\e[32m[ OK ]\e[0m $*"; }
fail() { echo -e "\e[31m[FAIL]\e[0m $*"; [[ $STRICT -eq 1 ]] && exit 1; }

check_mode() {
  local path=$1 want=$2
  [[ -e "$path" ]] || { warn "$path: not found (skip)"; return; }
  local mode; mode=$(stat -c %a "$path" 2>/dev/null || stat -f %Lp "$path")
  if [[ "$mode" -le "$want" ]]; then ok "$path mode=$mode (<= $want)"; else fail "$path mode=$mode (want <= $want)"; fi
}

check_owner() {
  local path=$1 want_user=$2
  [[ -e "$path" ]] || return
  local owner; owner=$(stat -c %U "$path" 2>/dev/null || stat -f %Su "$path")
  if [[ "$owner" == "$want_user" ]]; then ok "$path owner=$owner"; else warn "$path owner=$owner (want $want_user)"; fi
}

echo "[info] checking permissions..."
check_mode ".env" 640 || true
check_owner ".env" "dailylog" || true

if [[ -d data ]]; then
  check_mode "data" 750 || true
  while IFS= read -r -d '' db; do
    check_mode "$db" 640 || true
    check_owner "$db" "dailylog" || true
  done < <(find data -maxdepth 1 -name '*.db' -print0 2>/dev/null || true)
fi

echo "[done]"

