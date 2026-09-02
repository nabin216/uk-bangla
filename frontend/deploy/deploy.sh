#!/usr/bin/env bash
# Server-side frontend deploy. Called by GitHub Actions over SSH.
# Builds the Next.js app on the server and restarts the web service.
set -euo pipefail

REPO=/srv/ukbangla
export NEXT_PUBLIC_API_URL="https://ukbanglaguardian.com"

cd "$REPO"
git fetch --prune origin
git reset --hard origin/main

cd "$REPO/frontend"
npm ci --no-audit --no-fund
npm run build

sudo systemctl restart ukbangla-web
echo "Frontend deployed: $(git rev-parse --short HEAD)"
