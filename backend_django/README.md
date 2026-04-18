# Django Backend Setup

This folder contains the Django + Django REST Framework backend for `sanu store`.

## 1) Create virtual environment

```powershell
cd "c:\Users\Acer\Downloads\sanu store\backend_django"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

## 2) Install dependencies

```powershell
pip install -r requirements.txt
```

## 3) Optional environment variables

1. Copy `.env.example` to `.env`.
2. Set values for your local setup.

By default, backend uses SQLite.  
Set `DB_ENGINE=postgresql` to use PostgreSQL.

## 4) Run database migrations

```powershell
python manage.py migrate
```

## 5) Start development server

```powershell
python manage.py runserver
```

Backend API base URL: `http://127.0.0.1:8000/api/`
