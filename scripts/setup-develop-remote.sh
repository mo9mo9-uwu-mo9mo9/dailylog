#!/usr/bin/env bash
set -euo pipefail

# 初回のみ: 検証環境(dailylog-develop) を /srv に用意し、systemd を有効化する。
# 想定ホスト: Ubuntu (root または sudo)

msg() { echo -e "\e[32m[setup]\e[0m $*"; }
err() { echo -e "\e[31m[error]\e[0m $*" >&2; }

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  err "root で実行してください（sudo 推奨）"; exit 1
fi

USER_NAME=dailylog
GROUP_NAME=$USER_NAME
APP_DIR=/srv/dailylog-develop
DATA_DIR=$APP_DIR/data
UNIT_SRC=$(dirname "$0")/systemd/dailylog-develop.service
UNIT_DST=/etc/systemd/system/dailylog-develop.service

msg "ユーザ/グループ確認: $USER_NAME"
if ! id "$USER_NAME" &>/dev/null; then
  useradd -r -s /usr/sbin/nologin "$USER_NAME"
fi

msg "ディレクトリ作成: $APP_DIR"
install -d -o "$USER_NAME" -g "$GROUP_NAME" "$APP_DIR"
install -d -o "$USER_NAME" -g "$GROUP_NAME" "$DATA_DIR"

if [[ ! -f "$APP_DIR/.env" ]]; then
  msg "サンプル .env を作成 (PORT=3003 / BASE_PATH=/dailylog-dev)"
  cat >"$APP_DIR/.env" <<'ENV'
PORT=3003
BASE_PATH=/dailylog-dev
DATA_DIR=/srv/dailylog-develop/data
DB_FILE=dailylog-dev.db
# AUTH_USER=
# AUTH_PASS=
ENV
  chown "$USER_NAME:$GROUP_NAME" "$APP_DIR/.env"
fi

msg "systemd ユニット配置: $UNIT_DST"
install -m 0644 "$UNIT_SRC" "$UNIT_DST"
systemctl daemon-reload
systemctl enable --now dailylog-develop

msg "完了: ランニング状態を確認します"
systemctl --no-pager status dailylog-develop || true
echo "Health: curl -i http://127.0.0.1:3003/api/health"

