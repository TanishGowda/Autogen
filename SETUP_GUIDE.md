# AutoGen — Complete setup & run guide

This document is the **single place** for what you must configure, example environment files, how to run the stack, and a **sanity review** of whether things should work.

---

## What this project does (quick)

| Piece | Role |
|--------|------|
| **Frontend** (`frontend/`) | React UI; talks only to your **backend** via `VITE_API_BASE_URL`. **No** Supabase keys in the browser for API calls. |
| **Backend** (`backend/`) | FastAPI: Supabase Auth validation, DB + Storage (service role), **OpenAI** for PlantUML + text, **PlantUML HTTP** for SVG, stores SVGs in Storage, returns **signed URLs**. |
| **Supabase** | Auth, PostgreSQL, private Storage bucket `project-files`. |

---

## Prerequisites (install before you start)

| Requirement | Notes |
|-------------|--------|
| **Node.js** | **20.19+** or **22.12+** recommended (Vite may warn on older 22.x). Check: `node -v` |
| **npm** | Comes with Node. Check: `npm -v` |
| **Python** | **3.10+**. Check: `python --version` |
| **Supabase account** | Free tier is fine: [supabase.com](https://supabase.com) |
| **OpenAI API key** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — billing enabled if required |
| **Internet** | Required for OpenAI API and (by default) public PlantUML server |

---

## Part A — Supabase project (do this once)

### A1. Create or open a project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a project or select an existing one. Wait until it is **healthy**.

### A2. Copy API keys

1. **Project Settings → API**
2. Copy and save securely:
   - **Project URL** (e.g. `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key
   - **service_role** key — **backend only**. Never commit it to git, never put it in the frontend.

### A3. Run database SQL

1. **SQL Editor → New query**
2. Paste the **entire** contents of `backend/supabase_schema.sql` and **Run**.

If you **already** ran an **older** schema without diagram image columns, also run once:

- `backend/supabase_migration_diagram_images.sql`

### A4. Storage bucket

1. **Storage → New bucket**
2. Name: **`project-files`**
3. **Private** (recommended). The backend uses the service role to upload/read.

### A5. Authentication

1. **Authentication → Providers**
   - Enable **Email** (and choose whether email confirmation is required).
   - Optionally enable **Google** — use Google Cloud OAuth; redirect URI must match Supabase’s callback.
2. **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:5173`
   - **Additional Redirect URLs** (examples):  
     `http://localhost:5173/login`  
     `http://localhost:5173/dashboard`

---

## Part B — Backend environment & run

### B1. Example `backend/.env` (copy and rename)

Create **`backend/.env`** (not committed to git). You can start from **`backend/.env.example`**:

```powershell
cd path\to\Autogen\backend
copy .env.example .env
```

**Full example — replace placeholders with your real values:**

```env
# --- Supabase (Project Settings → API) ---
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key...

# --- CORS + frontend origin (local dev) ---
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# --- Storage bucket name (must match bucket you created) ---
SUPABASE_STORAGE_BUCKET=project-files

# --- OpenAI (required for "New Analysis" — user story & code upload) ---
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (defaults are fine to start)
OPENAI_MODEL=gpt-4o-mini
PLANTUML_SERVER_URL=https://www.plantuml.com/plantuml/svg/
```

**Important**

- **`OPENAI_API_KEY`** must be set for analyses to succeed. Without it, analysis endpoints return **503** with a clear message.
- **`PLANTUML_SERVER_URL`** must be a **base URL** ending with `/svg/` (same encoding as the public PlantUML server). The backend fetches SVG bytes from this URL.

### B2. Install dependencies & start backend

```powershell
cd path\to\Autogen\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Health check:** open [http://localhost:8000/health](http://localhost:8000/health) — expect:

```json
{"status":"ok"}
```

Leave this terminal **open** while developing.

---

## Part C — Frontend environment & run

### C1. Example `frontend/.env`

Create **`frontend/.env`**:

```powershell
cd path\to\Autogen\frontend
copy .env.example .env
```

**Full example — local backend:**

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...your-anon-key...
```

If you deploy later, set this to your **public API URL** (HTTPS).

**Note:** `VITE_SUPABASE_*` is required for **Google OAuth** only (PKCE callback exchange in browser). Main authenticated API calls still go through your backend using JWT in `localStorage`.

### C2. Install & start frontend

Open a **second** terminal:

```powershell
cd path\to\Autogen\frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Part D — End-to-end check

1. **Register / Login** at `/login` (email/password or Google if configured).
2. **Dashboard** → **New Analysis**.
3. **User story** — enter name + description (≥ 20 chars) → submit → should navigate to `/analysis/:id` with diagrams and summary.
4. **Code upload** — upload supported source files → submit → diagrams + tests + summary.
5. **History** — projects listed; **delete** removes DB rows and storage objects (for paths the app tracks).
6. **Reload** an analysis page — diagrams use **signed URLs**; if images break after a long time, **refresh** the page to get new signed URLs.

---

## Review: will everything work?

This is an honest checklist based on the current codebase.

### Should work if:

| Condition | Why |
|-----------|-----|
| Supabase SQL ran successfully | Tables + RLS exist; `analysis_results` has diagram path columns (schema or migration). |
| Bucket `project-files` exists | Uploads for code + SVG diagrams. |
| `backend/.env` has valid Supabase keys + **`OPENAI_API_KEY`** | Analysis pipeline calls OpenAI and stores results. |
| Backend can reach **OpenAI** and **PlantUML** URLs | Outbound HTTPS from your machine/network. |
| Frontend `VITE_API_BASE_URL` points to running backend | API calls succeed; CORS matches `ALLOWED_ORIGINS`. |
| User is logged in | JWT required for protected routes and API. |

### Known caveats / failure points:

| Issue | What to do |
|--------|------------|
| **503** on analyze | Set **`OPENAI_API_KEY`** in `backend/.env` and restart uvicorn. |
| **502** on analyze | OpenAI error, PlantUML fetch failed, or Storage upload failed. Check backend terminal logs; verify API key, quota, and bucket name. |
| **Node version warning** from Vite | Prefer upgrading Node to **20.19+** or **22.12+**; app may still run with a warning. |
| **Diagram images** expire | Signed URLs are **short-lived** (~1 hour in code). **Refresh** the analysis page to get new URLs. |
| **pip / websockets** errors | `requirements.txt` pins `websockets` for Supabase realtime; use `pip install -r requirements.txt` in a venv. |
| **Google login** | Must be enabled in Supabase + Google Cloud with correct redirect URIs. |

### Security reminder

- Never commit **`.env`** files.
- Never put **`SUPABASE_SERVICE_ROLE_KEY`** or **`OPENAI_API_KEY`** in the frontend repo or public repos.

---

## Quick reference — file locations

| File | Purpose |
|------|---------|
| `backend/.env.example` | Template for backend (copy → `.env`) |
| `frontend/.env.example` | Template for frontend (copy → `.env`) |
| `backend/supabase_schema.sql` | Full DB schema |
| `backend/supabase_migration_diagram_images.sql` | Add diagram columns if upgrading old DB |
| `README.md` | Short project overview |

---

## Daily workflow (two terminals)

**Terminal 1 — backend**

```powershell
cd Autogen\backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — frontend**

```powershell
cd Autogen\frontend
npm run dev
```

Then use **http://localhost:5173**.

---

*Last updated to match the repository layout and env templates. If you change ports or deploy, update `FRONTEND_URL`, `ALLOWED_ORIGINS`, and `VITE_API_BASE_URL` accordingly.*
