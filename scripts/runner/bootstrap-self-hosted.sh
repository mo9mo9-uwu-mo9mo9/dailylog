#!/usr/bin/env bash
set -euo pipefail

# GitHub Actions self-hosted runner bootstrapper
# Target host: Ubuntu (n100ubuntu), run as user `dailylog`
# Directory: /srv/.runner
# Labels: dailylog-prod
# Name: n100ubuntu-dailylog
#
# Usage:
#   RUNNER_TOKEN=xxxx ./bootstrap-self-hosted.sh
#   ./bootstrap-self-hosted.sh --token xxxx

REPO_URL="https://github.com/mo9mo9-uwu-mo9mo9/dailylog"
RUNNER_DIR="/srv/.runner"
RUNNER_NAME="n100ubuntu-dailylog"
RUNNER_LABELS="dailylog-prod"
SVC_USER="dailylog"

TOKEN="${RUNNER_TOKEN:-}"
if [[ "${1:-}" == "--token" && -n "${2:-}" ]]; then
  TOKEN="$2"
fi

if [[ -z "$TOKEN" ]]; then
  echo "[ERR] Registration token is required. Set RUNNER_TOKEN or pass --token." >&2
  exit 2
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

echo "[INFO] Detecting latest runner binary..."
API_URL="https://api.github.com/repos/actions/runner/releases/latest"
ASSET_URL=$(curl -fsSL "$API_URL" | \
  grep -oE '"browser_download_url":\s*"[^"]+linux-x64-[^"]+\.tar\.gz"' | \
  head -n1 | cut -d '"' -f4)

if [[ -z "$ASSET_URL" ]]; then
  echo "[ERR] Failed to resolve runner binary URL." >&2
  exit 1
fi

echo "[INFO] Downloading runner: $ASSET_URL"
curl -fsSL "$ASSET_URL" -o runner.tar.gz
tar xzf runner.tar.gz
rm -f runner.tar.gz

echo "[INFO] Configuring runner for $REPO_URL ..."
./config.sh --url "$REPO_URL" \
  --token "$TOKEN" \
  --labels "$RUNNER_LABELS" \
  --name "$RUNNER_NAME" \
  --unattended

echo "[INFO] Installing as service for user: $SVC_USER"
if [ "$(id -u)" -eq 0 ]; then
  ./svc.sh install "$SVC_USER"
  ./svc.sh start
  echo "[OK] Runner service installed and started as root."
else
  if command -v sudo >/dev/null 2>&1; then
    if sudo -n ./svc.sh install "$SVC_USER" && sudo -n ./svc.sh start; then
      echo "[OK] Runner service installed via sudo and started."
    else
      echo "[WARN] Could not install service via sudo (no NOPASSWD?). Skipping service install."
      echo "       Please run as root: /srv/.runner/svc.sh install $SVC_USER && /srv/.runner/svc.sh start"
    fi
  else
    echo "[WARN] 'sudo' not found and not running as root; skipping service install."
    echo "       Please run as root: /srv/.runner/svc.sh install $SVC_USER && /srv/.runner/svc.sh start"
  fi
fi

echo "[OK] Runner configured. Verify in GitHub > Settings > Actions > Runners."

