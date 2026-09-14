#!/usr/bin/env bash
# Server-side deploy script. Called by the GitHub Actions workflow over SSH.
# Assumes the repo is checked out at /srv/ukbangla and a venv at /srv/ukbangla/.venv
set -euo pipefail

REPO=/srv/ukbangla
VENV=$REPO/.venv

cd "$REPO"
git fetch --prune origin
git reset --hard origin/main

cd "$REPO/backend"
sudo systemctl stop ukbangla || true
"$VENV/bin/pip" install --upgrade pip
"$VENV/bin/pip" install -r requirements.txt
"$VENV/bin/python" manage.py migrate --noinput
"$VENV/bin/python" manage.py collectstatic --noinput

sudo install -m 644 deploy/ukbangla.service /etc/systemd/system/ukbangla.service
sudo systemctl daemon-reload
# Restart the gunicorn service (needs a sudoers rule, see deploy/README.md)
sudo systemctl restart ukbangla
echo "Backend deployed: $(git rev-parse --short HEAD)"
