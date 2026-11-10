# Deploying to a Hetzner VPS

One-time server setup, then every `git push` to `main` deploys automatically.

## 0. Repo layout

Use a **monorepo** with `frontend/` and `backend/` subfolders and `.github/workflows/`
at the root (this is how the deploy workflows are written). See the top-level
instructions for moving the existing `frontend/.git` up to the repo root.

Push to GitHub, default branch `main`.

## 1. Provision the server

- Hetzner CX22 (2 vCPU / 4 GB), Ubuntu 24.04.
- Create a non-root `deploy` user with sudo.
- Point DNS (or Cloudflare) `A` record at the server IP.

```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nginx git postgresql
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy
```

## 2. Get the code + venv

```bash
sudo mkdir -p /srv/ukbangla && sudo chown deploy:deploy /srv/ukbangla
sudo -u deploy git clone https://github.com/<you>/<repo>.git /srv/ukbangla
cd /srv/ukbangla
sudo -u deploy python3 -m venv .venv
sudo -u deploy .venv/bin/pip install -r backend/requirements.txt gunicorn
```

## 3. Postgres (optional but recommended)

```bash
sudo -u postgres psql -c "CREATE USER ukbangla WITH PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -c "CREATE DATABASE ukbangla OWNER ukbangla;"
```

## 4. backend/.env  (create on the server, never commit)

```
DJANGO_SECRET_KEY=<run: python -c "import secrets;print(secrets.token_urlsafe(50))">
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=ukbanglaguardian.com,www.ukbanglaguardian.com
FRONTEND_ORIGINS=https://ukbanglaguardian.com,https://www.ukbanglaguardian.com
WAGTAILADMIN_BASE_URL=https://ukbanglaguardian.com
POSTGRES_DB=ukbangla
POSTGRES_USER=ukbangla
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Then:

```bash
cd /srv/ukbangla/backend
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py seed_news
../.venv/bin/python manage.py createsuperuser
../.venv/bin/python manage.py collectstatic --noinput
```

## 5. gunicorn service

```bash
sudo cp /srv/ukbangla/backend/deploy/ukbangla.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ukbangla
```

Allow the deploy user to restart it without a password:

```bash
echo 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart ukbangla' | sudo tee /etc/sudoers.d/ukbangla
sudo chmod 0440 /etc/sudoers.d/ukbangla
chmod +x /srv/ukbangla/backend/deploy/deploy.sh
```

## 6. nginx

```bash
sudo mkdir -p /var/www/ukbangla
sudo cp /srv/ukbangla/backend/deploy/nginx.conf /etc/nginx/sites-available/ukbangla
sudo ln -s /etc/nginx/sites-available/ukbangla /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

TLS: either proxy through **Cloudflare** (set SSL mode "Full") or run
`sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx`.

## 7. GitHub secrets & variables

Repo → Settings → Secrets and variables → Actions:

| Kind | Name | Value |
|---|---|---|
| Secret | `HETZNER_HOST` | server IP |
| Secret | `HETZNER_USER` | `deploy` |
| Secret | `HETZNER_SSH_KEY` | private key whose public half is in `deploy`'s `~/.ssh/authorized_keys` |
| Variable | `NEXT_PUBLIC_API_URL` | `https://ukbanglaguardian.com` (only for the frontend workflow) |

## 8. Frontend hosting — pick one

**A. Cloudflare Pages (recommended, free, offloads all static traffic):**
delete `.github/workflows/deploy-frontend.yml`, then in the Cloudflare dashboard:
create a Pages project from the repo, set **root directory** `frontend`,
build command `npm run build`, output directory `out`, and add the
`NEXT_PUBLIC_API_URL` environment variable. Auto-deploys on every push.

**B. On the Hetzner box:** keep `deploy-frontend.yml`. It builds the export in
CI and rsyncs `frontend/out/` to `/var/www/ukbangla/`.

## Daily workflow

```bash
git add -A && git commit -m "..." && git push
```

Backend changes → `deploy-backend.yml` runs (pull, migrate, collectstatic, restart).
Frontend changes → Cloudflare Pages rebuilds (or `deploy-frontend.yml` runs).

## Backups (cron on the server)

```bash
# /etc/cron.daily/ukbangla-backup
pg_dump -U ukbangla ukbangla | gzip > /srv/backups/db-$(date +\%F).sql.gz
tar czf /srv/backups/media-$(date +\%F).tar.gz -C /srv/ukbangla/backend media
find /srv/backups -mtime +14 -delete
```
