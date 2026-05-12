# Taskflow

Full-stack task app with:
- FastAPI backend
- Next.js frontend
- Supabase Auth + Postgres (with RLS)

## Menu

- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
  - [Backend (`.env` in repo root)](#backend-env-in-repo-root)
  - [Frontend (`frontend/.env`)](#frontend-frontendenv)
- [Install & Run](#install--run)
- [Docker (backend API)](#docker-backend-api)
- [Complete GitHub OAuth Flow with Next.js + Supabase](#complete-github-oauth-flow-with-nextjs--supabase)
- [Slack OAuth Setup (Supabase)](#slack-oauth-setup-supabase)
- [Google OAuth Setup (Supabase)](#google-oauth-setup-supabase)
- [API Endpoints (Backend)](#api-endpoints-backend)
- [Auth + RLS Flow](#auth--rls-flow)
- [Notes](#notes)

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

- Python 3.12+ (see `pyproject.toml`)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python toolchain; installs deps from `pyproject.toml` when you `uv run`)
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

# Transactional email (SendGrid — Web API v3)
SENDGRID_API_KEY=your-sendgrid-api-key
# Verified sender or domain in SendGrid
EMAIL_FROM=noreply@yourdomain.com
```

### Frontend (`frontend/.env`)

```env
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

## Install & Run

### 1) Backend

From the **repository root** (where `app/` and `pyproject.toml` live):

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend listens on port **8000** — open `http://127.0.0.1:8000` on this machine (`0.0.0.0` binds on all interfaces, e.g. for LAN access or Docker port mapping).

**Email worker (RQ):** with Redis running, `SENDGRID_API_KEY`, and a verified `EMAIL_FROM`, process the `emails` queue from the repo root:

```bash
uv run rq worker emails --url redis://127.0.0.1:6379/0
```

Enqueue from app code with `enqueue_send_email(...)` in `app/worker/email_worker.py`.

```python
from app.worker.email_worker import enqueue_send_email

# Standard subject/body email
enqueue_send_email(
    to_email="user@example.com",
    subject="Welcome to Taskflow",
    body_text="Thanks for joining Taskflow.",
    body_html="<p>Thanks for joining <strong>Taskflow</strong>.</p>",
)

# SendGrid dynamic template email
enqueue_send_email(
    to_email="user@example.com",
    template_id="d-1234567890abcdef1234567890abcdef",
    dynamic_template_data={"first_name": "Ada"},
)
```

Worker behavior from `app/worker/email_worker.py`:
- Queue name is `emails`.
- If `template_id` is provided, template content/subject comes from SendGrid.
- If `template_id` is not provided, `subject` is required and at least one of `body_text` or `body_html` must be provided.
- Non-2xx SendGrid responses raise an error so the RQ job can retry/fail visibly.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Docker (backend API)

From the **repository root** (where the `Dockerfile` is):

### — Build Docker image

```bash
docker build -t task-api .
```

### — Run container

```bash
docker run -p 8000:8000 task-api
```

The API listens on `http://127.0.0.1:8000`. Pass the same variables as in [Backend (`.env` in repo root)](#backend-env-in-repo-root) (for example `--env-file .env`) so the container can reach Supabase and Redis.

## Complete GitHub OAuth Flow with Next.js + Supabase

Architecture:

Next.js frontend
↓
Supabase Auth
↓
GitHub OAuth
↓
Supabase session/JWT
↓
Dashboard
↓
FastAPI backend (optional)

### Step 1 - Enable GitHub Provider in Supabase

Open Supabase Dashboard, then go to:

- Authentication
- Providers
- GitHub

Enable the GitHub provider.

Keep this page open because you will paste:

- Client ID
- Client Secret

later.

### Step 2 - Create GitHub OAuth App

Open:

- GitHub Developer Settings OAuth Apps

Then click:

- New OAuth App

### Step 3 - Fill GitHub OAuth App

Application name:

- Taskflow Dev

Homepage URL (development):

- `http://localhost:3000`

Authorization callback URL:

- `https://ronvhnxctpkvhzpwcewq.supabase.co/auth/v1/callback`

Important: use your Supabase callback URL, not your Next.js route.

### Step 4 - Copy GitHub Credentials

After creating the app, GitHub gives you:

- Client ID
- Client Secret

Copy both values.

### Step 5 - Paste into Supabase

Go back to:

- Supabase
- Authentication
- Providers
- GitHub

Paste:

- Client ID
- Client Secret

Then save.

### Step 6 - Configure Supabase URLs

Go to:

- Authentication
- URL Configuration

Set:

- Site URL
  - `http://localhost:3000`

- Redirect URLs
  - `http://localhost:3000/auth/callback`


## Slack OAuth Setup (Supabase)

Overall Flow

Next.js (login button)
↓
Supabase Auth
↓
Slack OAuth screen (workspace + permissions)
↓
Slack redirects to Supabase callback
↓
Supabase creates session (JWT)
↓
Next.js receives session
↓
Redirect -> `/dashboard`

### 1. Create Slack App

Go to:

- Slack API Apps

Click:

- Create New App
- From scratch

### 2. Choose Workspace

Pick your Slack workspace (or dev workspace).

### 3. Enable OAuth

Go to:

- OAuth & Permissions

### 4. Add Redirect URL (VERY IMPORTANT)

Slack expects Supabase callback:

- `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

For this project:

- `https://ronvhnxctpkvhzpwcewq.supabase.co/auth/v1/callback`

Add it under:

- Redirect URLs

### 5. Add Scopes

Typical scopes:

- `openid`
- `email`
- `profile`

Optional (depending on app):

- `chat:write`
- `users:read`
- `channels:read`

### 6. Get Client ID + Secret

From:

- Basic Information

Copy:

- Client ID
- Client Secret

### 7. Configure Supabase Slack Provider

Go to:

- Supabase Dashboard
- Authentication -> Providers -> Slack

Enable Slack and paste:

- Client ID
- Client Secret

Save.

### 8. Set Supabase Auth URLs

Go to:

- Authentication -> URL Configuration

Set:

- Site URL
  - `http://localhost:3000`
- Redirect URLs
  - `http://localhost:3000/auth/callback`

## Google OAuth Setup (Supabase)

Use this exact configuration to make Google login work with Supabase.

### 1) Google Cloud Console: OAuth Client

Set these values in your Google OAuth client:

- **Authorized JavaScript origins**
  - `http://localhost:3000`
  - `https://yourdomain.com` (when deployed)

- **Authorized redirect URIs**
  - `https://ronvhnxctpkvhzpwcewq.supabase.co/auth/v1/callback`

Important: for Supabase OAuth, Google redirect URI must point to the Supabase callback endpoint (`...supabase.co/auth/v1/callback`), not your frontend URL.

### 2) Supabase Dashboard: URL Configuration

Go to:

- Authentication -> URL Configuration

Set:

- **Site URL**
  - `http://localhost:3000`

- **Redirect URLs** (allow list)
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/dashboard` (optional)

### 3) Next.js Google Login Call

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "http://localhost:3000/auth/callback",
  },
});
```

### Common OAuth Mistake

Do **not** put `http://localhost:3000/auth/callback` into Google's "Authorized redirect URIs".

For Supabase OAuth, Google should redirect to:

- `https://ronvhnxctpkvhzpwcewq.supabase.co/auth/v1/callback`

Then Supabase creates the session and redirects back to your app (`redirectTo` / Site URL).

### OAuth Flow Visualization

1. Next.js app user clicks Google login.
2. User completes Google OAuth consent.
3. Google redirects to Supabase callback (`...supabase.co/auth/v1/callback`).
4. Supabase creates session.
5. Supabase redirects back to your Next.js app.
6. User is logged in.

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
