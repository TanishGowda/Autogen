# AutoGen — AI-Powered Code Analysis Framework

An LLM-powered framework that generates software engineering artifacts (architecture diagrams, use-case diagrams, and test cases) from descriptions and source code.

**→ Full step-by-step setup, example `.env` files, run commands, and a “will it work?” review: [`SETUP_GUIDE.md`](./SETUP_GUIDE.md)**

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | React + TypeScript + Vite                       |
| Styling        | Tailwind CSS                                    |
| Authentication | Supabase Auth (email/password + Google OAuth)   |
| Database       | Supabase (PostgreSQL)                           |
| Storage        | Supabase Storage (uploaded code files)         |
| Backend        | Python + FastAPI                                |
| AI Engine      | OpenAI API (server-side key — not user keys)   |
| Diagrams       | PlantUML (public server for SVG preview)       |

## Project Structure

```
Autogen/
├── frontend/          # React app (calls backend API only)
├── backend/           # FastAPI + Supabase (service role) + analysis
└── README.md
```

## Prerequisites

1. **Node.js** — 20.19+ or 22.12+ (see [nodejs.org](https://nodejs.org/))
2. **Python 3.10+** — for the backend
3. **Supabase account** — [supabase.com](https://supabase.com/)

---

## Setup (Steps 1–4) — Supabase & Auth

Complete these first if you have not already:

1. **Supabase project** — Create/open project → **Project Settings → API** → copy **Project URL**, **anon** key, **service_role** key (service role is **backend only**; never put it in the frontend).
2. **Database** — **SQL Editor** → run the full file `backend/supabase_schema.sql`.  
   If you created the DB **before** diagram columns existed, also run `backend/supabase_migration_diagram_images.sql` once.
3. **Storage** — **Storage** → create private bucket `project-files`.
4. **Auth** — Enable **Email** provider; enable **Google** with OAuth client from Google Cloud; set **URL Configuration** (Site URL `http://localhost:5173`, add redirect URLs for `/login` and `/dashboard` as needed).

---

## Run the app (Steps 5–8)

Assume your project root is `Autogen` and you already finished step 4 above.

### Step 5 — Backend environment

1. Open PowerShell and go to the backend folder:

   ```powershell
   cd path\to\Autogen\backend
   ```

2. Copy the env template:

   ```powershell
   copy .env.example .env
   ```

3. Edit `.env` and set:

   | Variable | Description |
   |----------|-------------|
   | `SUPABASE_URL` | From Supabase → Project Settings → API → Project URL |
   | `SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server only) |
   | `FRONTEND_URL` | `http://localhost:5173` |
   | `ALLOWED_ORIGINS` | `http://localhost:5173` |
   | `SUPABASE_STORAGE_BUCKET` | `project-files` |
   | `OPENAI_API_KEY` | **Required** for analyses — [OpenAI API key](https://platform.openai.com/api-keys) (server only; never in frontend) |
   | `OPENAI_MODEL` | Optional, default `gpt-4o-mini` |
   | `PLANTUML_SERVER_URL` | Optional, default `https://www.plantuml.com/plantuml/svg/` |

   Analysis calls **OpenAI** (1 JSON for user story; 2 for code upload), renders **SVG** via the PlantUML server, uploads SVGs to **Supabase Storage**, and returns **signed URLs** to the result page.

### Step 6 — Install Python dependencies & run backend

```powershell
cd path\to\Autogen\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Leave this terminal window open.

**Check:** open [http://localhost:8000/health](http://localhost:8000/health) — you should see `{"status":"ok"}`.

### Step 7 — Frontend environment

1. Copy `frontend\.env.example` to `frontend\.env` (or create `.env` manually).

2. Put only:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

   The frontend talks to the **backend**; it does **not** use Supabase keys directly.

### Step 8 — Install & run frontend

Open a **second** PowerShell window:

```powershell
cd path\to\Autogen\frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → **Login** → sign up or sign in.

---

## Step 9 — Verify the flow

1. **Login** — Email/password or Google (if configured).
2. **Dashboard** — **New Analysis** or **History**.
3. **New Analysis** — User story mode or code upload → submit → opens result page.
4. **History** — List from backend; delete removes a project.
5. **Sign out** — From the sidebar.

---

## Pages (authenticated)

| Route | Description |
|-------|-------------|
| `/dashboard` | Dashboard (New Analysis + History) |
| `/analyze` | Start an analysis |
| `/analysis/:id` | View diagrams & tests |
| `/history` | Past analyses |

Settings page is **removed** for now; it can be added back later.

---

## Development notes

- OpenAI key lives only in **backend** `.env` — not in the UI.
- Diagram SVGs are stored in the `project-files` bucket under `{user_id}/{project_id}/diagrams/`.
- Result API returns short-lived signed URLs; refresh the analysis page if an image URL expires.
- See `backend/README.md` for backend-specific details.
