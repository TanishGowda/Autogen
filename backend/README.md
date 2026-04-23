# AutoGen Backend

FastAPI backend: Supabase Auth, PostgreSQL, Storage, **OpenAI** (PlantUML generation), **PlantUML server** (SVG render), signed URLs for diagram images.

## Modules

| File | Role |
|------|------|
| `main.py` | Routes, orchestration |
| `openai_service.py` | User story: 1 JSON call. Code: diagrams + summary, then tests (2 calls) |
| `plantuml_service.py` | Encode PlantUML → fetch SVG from `PLANTUML_SERVER_URL` |
| `storage_service.py` | Upload SVGs, signed URLs, delete paths |
| `supabase_schema.sql` | Full schema (includes diagram image path columns) |
| `supabase_migration_diagram_images.sql` | Add diagram columns if you have an older DB |

## Environment (`.env`)

Required:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` — required for `/api/v1/projects/user-story` and `/api/v1/projects/code-upload`

Optional:

- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `PLANTUML_SERVER_URL` (default `https://www.plantuml.com/plantuml/svg/`)
- `FRONTEND_URL`, `ALLOWED_ORIGINS`, `SUPABASE_STORAGE_BUCKET`

## Flow (summary)

1. **User story:** OpenAI returns `architecture_diagram`, `usecase_diagram`, `summary` → SVGs fetched in parallel → uploaded to `{user_id}/{project_id}/diagrams/*.svg` → DB stores PlantUML + paths.
2. **Code upload:** OpenAI call 1 → control flow + class + summary → SVGs + storage; call 2 → white/black tests → `test_cases` rows.

Result endpoint adds **signed URLs** (`*_diagram_image_url`) for the frontend `<img>` tags.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env — set OPENAI_API_KEY and Supabase keys
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health: `http://localhost:8000/health`

## Supabase

1. Run `supabase_schema.sql` (or migration file if upgrading).
2. Storage bucket `project-files` (private).
