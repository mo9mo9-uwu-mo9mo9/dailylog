#!/usr/bin/env bash
set -euo pipefail

# Remote installer for GitHub Actions self-hosted runner
# - Runs locally; connects to remote Ubuntu host via SSH
# - Requires: gh (authenticated), ssh, scp
#
# Usage:
#   SSH_HOST=user@host [SSH_PORT=22] ./scripts/runner/install-remote.sh
#
# What it does (remote):
# - Ensure user `dailylog`, dirs /srv/dailylog and /srv/.runner
# - Install minimal sudoers for service restart
# - Install curl/git, fetch latest Actions runner, register with labels
# - Optionally clone repo into /srv/dailylog if not present

REPO_SLUG="mo9mo9-uwu-mo9mo9/dailylog"

# Optional local config (git-ignored): local/runner.env
# Example:
#   SSH_HOST=root@n100ubuntu
#   SSH_PORT=22
# Backward-compat: also load tmp/local/runner.env if present (deprecated)
CFG_FILE_NEW="local/runner.env"
CFG_FILE_OLD="tmp/local/runner.env"
if [[ -f "$CFG_FILE_NEW" ]]; then
  # shellcheck disable=SC1090
  source "$CFG_FILE_NEW"
elif [[ -f "$CFG_FILE_OLD" ]]; then
  echo "[WARN] tmp/local/runner.env は廃止予定です。local/runner.env に移動してください。" >&2
  # shellcheck disable=SC1090
  source "$CFG_FILE_OLD"
fi

SSH_HOST="${SSH_HOST:-}"
SSH_PORT="${SSH_PORT:-22}"

if [[ -z "$SSH_HOST" ]]; then
  echo "[ERR] SSH_HOST is required (e.g., dailylog@n100ubuntu)" >&2
  exit 2
fi

echo "[INFO] Generating registration token via GitHub API..."
TOKEN=$(gh api -X POST repos/${REPO_SLUG}/actions/runners/registration-token -q .token)
if [[ -z "$TOKEN" ]]; then
  echo "[ERR] Failed to obtain registration token. Is gh authenticated?" >&2
  exit 1
fi

ssh_opts=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)

echo "[INFO] Preparing remote host: $SSH_HOST"
ssh "${ssh_opts[@]}" "$SSH_HOST" 'sudo bash -s' <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl tar git
id -u dailylog >/dev/null 2>&1 || useradd -r -m -d /srv/dailylog -s /usr/sbin/nologin dailylog
install -d -o dailylog -g dailylog /srv/.runner /srv/dailylog
cat >/etc/sudoers.d/dailylog-runner <<EOF
Defaults:dailylog !requiretty
dailylog ALL=(root) NOPASSWD: /usr/bin/systemctl restart dailylog, /usr/bin/systemctl is-active dailylog
EOF
chmod 440 /etc/sudoers.d/dailylog-runner
REMOTE

echo "[INFO] Copying bootstrap script..."
scp -P "$SSH_PORT" scripts/runner/bootstrap-self-hosted.sh "$SSH_HOST":/srv/.runner/bootstrap.sh
ssh "${ssh_opts[@]}" "$SSH_HOST" 'sudo chown dailylog:dailylog /srv/.runner/bootstrap.sh && sudo chmod +x /srv/.runner/bootstrap.sh'

echo "[INFO] Registering and starting runner as dailylog..."
ssh "${ssh_opts[@]}" "$SSH_HOST" "sudo -u dailylog env RUNNER_TOKEN='$TOKEN' bash /srv/.runner/bootstrap.sh"

echo "[INFO] Ensuring app repo exists at /srv/dailylog"
ssh "${ssh_opts[@]}" "$SSH_HOST" 'if [ ! -d /srv/dailylog/.git ]; then sudo -u dailylog git clone https://github.com/'"$REPO_SLUG"' /srv/dailylog; fi'

echo "[OK] Runner should be online with label dailylog-prod. Trigger deploy when ready."

