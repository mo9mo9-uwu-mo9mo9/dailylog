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
# or
#   ./bootstrap-self-hosted.sh --token xxxx
#
# Notes:
# - Registration token is ephemeral. Do NOT store long-lived secrets here.
# - Requires: curl, tar, systemd (for svc.sh), sudo (for service restart in workflow)

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
  --unattended \
  --ephemeral false

echo "[INFO] Installing as service for user: $SVC_USER"
./svc.sh install "$SVC_USER"
./svc.sh start

echo "[OK] Runner installed and started. Verify in GitHub > Settings > Actions > Runners."

