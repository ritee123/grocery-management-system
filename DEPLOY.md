# Sanu Store Deployment Guide

This project has:
- `Frontend/` -> Next.js app
- `backend_django/` -> Django REST API

Recommended deployment:
- Frontend: Vercel
- Backend: Render (Web Service + PostgreSQL)

---

## 1) Deploy Django backend on Render

### A. Create PostgreSQL database
1. In Render, create a new **PostgreSQL** instance.
2. Copy these values from Render database info:
   - database name
   - user
   - password
   - host
   - port

### B. Create Web Service from this repo
1. Create a new **Web Service** and select this repository.
2. Set **Root Directory** to:
   - `backend_django`
3. Set **Build Command**:
   - `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
4. Set **Start Command**:
   - `gunicorn sanu_store.wsgi:application --bind 0.0.0.0:$PORT`

### C. Configure backend environment variables
In Render Web Service -> Environment, set:

- `DJANGO_SECRET_KEY` = strong random secret
- `DJANGO_DEBUG` = `False`
- `DJANGO_ALLOWED_HOSTS` = your Render host (example: `your-api.onrender.com`)
- `DB_ENGINE` = `postgresql`
- `DB_NAME` = value from Render database
- `DB_USER` = value from Render database
- `DB_PASSWORD` = value from Render database
- `DB_HOST` = value from Render database
- `DB_PORT` = value from Render database

Add this after frontend deployment:
- `VERCEL_DOMAINS` = `https://your-frontend.vercel.app`

### D. Verify backend is live
Open:
- `https://<your-render-host>/api/bootstrap/`

You should get JSON.

---

## 2) Deploy Next.js frontend on Vercel

1. Import this same repository to Vercel.
2. Set **Root Directory** to:
   - `Frontend`
3. In project environment variables, set:
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-host>`
4. Deploy.

---

## 3) Connect frontend domain in backend CORS/CSRF

After Vercel deploy, copy the frontend URL (for example `https://sanu-store.vercel.app`) and set in backend Render service:

- `VERCEL_DOMAINS` = `https://sanu-store.vercel.app`

Then redeploy backend.

---

## 4) Common deployment checks

- Backend returns JSON at `/api/bootstrap/`
- Frontend can log in and create records
- Browser network calls go to Render backend URL
- No CORS errors in browser console

---

## 5) Optional custom domains

If using custom domains:
- Add frontend custom domain URL to `VERCEL_DOMAINS`
- Add backend custom domain host to `DJANGO_ALLOWED_HOSTS`
- Update `NEXT_PUBLIC_API_URL` in Vercel to backend custom domain
