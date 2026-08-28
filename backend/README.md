# UK Bangla backend

This directory contains the Django/Wagtail CMS and JSON API for the existing
Next.js frontend. SQLite is the default database and uploaded media is stored
in `media/`.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_news
python manage.py createsuperuser
python manage.py runserver
```

Visit `http://localhost:8000/admin/` for Wagtail and `http://localhost:8000/api/`
for the API. Configure the frontend to use these endpoints as needed.

## API

- `GET /api/stories/?category=politics&limit=20`
- `GET /api/stories/<slug>/`
- `GET /api/categories/`
- `GET /api/most-read/?limit=10`
- `POST /api/newsletter/subscribe/` with `{"email":"reader@example.com"}`

Set `FRONTEND_ORIGINS` in `.env` for additional trusted browser origins.
