# Taskflow

Full-stack task app with:
- FastAPI backend
- Next.js frontend
- Supabase Auth + Postgres (with RLS)

## Project Structure

- `app/` - FastAPI backend
- `frontend/` - Next.js 16 frontend (App Router)

## Features

- Email/password signup + login (Supabase Auth)
- Protected dashboard route: `/dashboard`
- Create tasks
- List tasks (scoped to logged-in user)
- Delete tasks
- Toast notifications (top-right)

## Prerequisites

- Python 3.10+
- Node.js 20+
- npm
- Supabase project

## Environment Variables

### Backend (`.env` in repo root)

```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-or-publishable-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend (`frontend/.env`)

```env
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

## Install & Run

### 1) Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## API Endpoints (Backend)

- `GET /health`
- `POST /tasks` (requires `Authorization: Bearer <access_token>`)
- `GET /tasks` (requires `Authorization: Bearer <access_token>`)
- `DELETE /tasks/{task_id}` (requires `Authorization: Bearer <access_token>`)

## Auth + RLS Flow

1. User logs in on Next.js frontend.
2. Frontend gets Supabase access token.
3. Frontend sends token in `Authorization` header to Next.js API routes.
4. Next.js forwards token to FastAPI.
5. FastAPI uses token for Supabase requests.
6. Supabase RLS evaluates the real authenticated user (`auth.uid()`).

## Notes

- `user_id` is derived on backend from JWT, not trusted from frontend payload.
- Task reads/deletes are user-scoped.
- If signup does not auto-login, confirm your Supabase email confirmation settings.
