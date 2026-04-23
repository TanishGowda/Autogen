import logging
from datetime import datetime, timezone
from typing import Any
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import Client, create_client
from supabase_auth.errors import AuthApiError

from openai_service import (
    generate_code_diagrams_bundle,
    generate_code_tests_bundle,
    generate_user_story_bundle,
    repair_plantuml,
    truncate_code_bundle,
)
from plantuml_service import (
    fetch_svg_bytes,
    fetch_two_svgs_parallel,
    is_plausible_plantuml,
    normalize_plantuml_block,
)
from storage_service import create_signed_url, delete_paths, upload_svg

logger = logging.getLogger(__name__)

# Ensure backend/.env wins over stale terminal-level environment variables.
load_dotenv(override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    allowed_origins: str = Field(default="http://localhost:5173", alias="ALLOWED_ORIGINS")
    supabase_storage_bucket: str = Field(default="project-files", alias="SUPABASE_STORAGE_BUCKET")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    plantuml_server_url: str = Field(
        default="https://www.plantuml.com/plantuml/svg/",
        alias="PLANTUML_SERVER_URL",
    )


settings = Settings()
supabase_public: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
bearer_scheme = HTTPBearer()


class AuthSignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=120)


class AuthSignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class UserSettingsUpdateRequest(BaseModel):
    full_name: str | None = None
    notifications: bool | None = None
    auto_download: bool | None = None
    openai_api_key: str | None = None


class UserStoryCreateRequest(BaseModel):
    project_name: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=20)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_auth_user(user_data: Any) -> dict[str, Any]:
    return {
        "id": user_data.id,
        "email": user_data.email,
        "user_metadata": user_data.user_metadata or {},
    }


def detect_language(filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    mapping = {
        "java": "Java",
        "py": "Python",
        "js": "JavaScript",
        "ts": "TypeScript",
        "jsx": "React JSX",
        "tsx": "React TSX",
        "cpp": "C++",
        "c": "C",
        "cs": "C#",
        "rb": "Ruby",
        "go": "Go",
        "kt": "Kotlin",
        "swift": "Swift",
        "php": "PHP",
    }
    return mapping.get(ext, "Unknown")


def require_openai() -> str:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analysis is unavailable: OPENAI_API_KEY is not configured on the server.",
        )
    return settings.openai_api_key


def enrich_analysis_result_with_signed_urls(row: dict[str, Any]) -> dict[str, Any]:
    """Add signed URLs for stored diagram SVG paths (1 hour)."""
    out = dict(row)
    bucket = settings.supabase_storage_bucket
    pairs = [
        ("architecture_diagram_image_path", "architecture_diagram_image_url"),
        ("usecase_diagram_image_path", "usecase_diagram_image_url"),
        ("sequence_diagram_image_path", "sequence_diagram_image_url"),
        ("controlflow_diagram_image_path", "controlflow_diagram_image_url"),
        ("class_diagram_image_path", "class_diagram_image_url"),
    ]
    for path_key, url_key in pairs:
        p = out.get(path_key)
        out[url_key] = create_signed_url(supabase_admin, bucket, p, 3600)
    return out


def ensure_profile(user_id: str, user_email: str, user_metadata: dict[str, Any]) -> dict[str, Any]:
    existing = (
        supabase_admin.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    payload = {
        "user_id": user_id,
        "email": user_email,
        "full_name": user_metadata.get("full_name"),
        "avatar_url": user_metadata.get("avatar_url"),
        "notifications": True,
        "auto_download": False,
        "openai_api_key": None,
    }
    created = supabase_admin.table("profiles").insert(payload).execute()
    return created.data[0]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    token = credentials.credentials
    try:
        auth_response = supabase_public.auth.get_user(token)
    except AuthApiError as e:
        # Expired/invalid JWT should be a clean auth error, not a 500.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
        ) from e
    except Exception as e:
        logger.exception("Unexpected auth verification failure: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from e
    user = auth_response.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token."
        )
    return {"token": token, "user": user}


app = FastAPI(title="AutoGen Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/auth/signup")
def sign_up(payload: AuthSignUpRequest) -> dict[str, Any]:
    result = supabase_public.auth.sign_up(
        {
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {"full_name": payload.full_name} if payload.full_name else {},
                "email_redirect_to": f"{settings.frontend_url}/login",
            },
        }
    )
    if result.user is None:
        raise HTTPException(status_code=400, detail="Unable to create account.")

    needs_email_confirmation = result.session is None
    response: dict[str, Any] = {"needs_email_confirmation": needs_email_confirmation}

    if result.session:
        ensure_profile(result.user.id, result.user.email, result.user.user_metadata or {})
        response["session"] = {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
        }
        response["user"] = to_auth_user(result.user)

    return response


@app.post("/api/v1/auth/signin")
def sign_in(payload: AuthSignInRequest) -> dict[str, Any]:
    result = supabase_public.auth.sign_in_with_password(
        {"email": payload.email, "password": payload.password}
    )
    if result.user is None or result.session is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    ensure_profile(result.user.id, result.user.email, result.user.user_metadata or {})
    return {
        "session": {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
        },
        "user": to_auth_user(result.user),
    }


@app.post("/api/v1/auth/refresh")
def refresh(payload: RefreshRequest) -> dict[str, Any]:
    refreshed = supabase_public.auth.refresh_session(payload.refresh_token)
    if refreshed.user is None or refreshed.session is None:
        raise HTTPException(status_code=401, detail="Unable to refresh session.")
    return {
        "session": {
            "access_token": refreshed.session.access_token,
            "refresh_token": refreshed.session.refresh_token,
        },
        "user": to_auth_user(refreshed.user),
    }


@app.get("/api/v1/auth/me")
def me(current=Depends(get_current_user)) -> dict[str, Any]:
    user = current["user"]
    profile = ensure_profile(user.id, user.email, user.user_metadata or {})
    return {"user": to_auth_user(user), "profile": profile}


@app.post("/api/v1/auth/signout")
def sign_out() -> dict[str, bool]:
    return {"success": True}


@app.get("/api/v1/auth/google-url")
def get_google_oauth_url() -> dict[str, str]:
    oauth = supabase_public.auth.sign_in_with_oauth(
        {
            "provider": "google",
            "options": {"redirect_to": f"{settings.frontend_url}/login"},
        }
    )
    oauth_url = oauth.url if hasattr(oauth, "url") else None
    if not oauth_url:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured in Supabase for this project.",
        )
    return {"url": oauth_url}


@app.get("/api/v1/settings")
def get_settings(current=Depends(get_current_user)) -> dict[str, Any]:
    user = current["user"]
    profile = ensure_profile(user.id, user.email, user.user_metadata or {})
    return profile


@app.put("/api/v1/settings")
def update_settings(payload: UserSettingsUpdateRequest, current=Depends(get_current_user)) -> dict[str, Any]:
    user = current["user"]
    update_data: dict[str, Any] = {}
    if payload.full_name is not None:
        update_data["full_name"] = payload.full_name
    if payload.notifications is not None:
        update_data["notifications"] = payload.notifications
    if payload.auto_download is not None:
        update_data["auto_download"] = payload.auto_download
    if payload.openai_api_key is not None:
        update_data["openai_api_key"] = payload.openai_api_key

    if not update_data:
        return ensure_profile(user.id, user.email, user.user_metadata or {})

    updated = (
        supabase_admin.table("profiles")
        .update(update_data)
        .eq("user_id", user.id)
        .execute()
    )
    if not updated.data:
        ensure_profile(user.id, user.email, user.user_metadata or {})
        updated = (
            supabase_admin.table("profiles")
            .update(update_data)
            .eq("user_id", user.id)
            .execute()
        )
    return updated.data[0]


@app.get("/api/v1/projects")
def list_projects(
    search: str | None = None,
    status_filter: str | None = None,
    mode: str | None = None,
    current=Depends(get_current_user),
) -> list[dict[str, Any]]:
    user_id = current["user"].id
    query = (
        supabase_admin.table("projects")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
    )
    if status_filter and status_filter != "all":
        query = query.eq("status", status_filter)
    if mode and mode != "all":
        query = query.eq("mode", mode)

    response = query.execute()
    data = response.data or []
    if search:
        s = search.lower()
        data = [
            row
            for row in data
            if s in (row.get("name") or "").lower()
            or s in (row.get("language") or "").lower()
            or s in (row.get("mode") or "").lower()
        ]
    return data


@app.post("/api/v1/projects/user-story")
def create_user_story_project(payload: UserStoryCreateRequest, current=Depends(get_current_user)) -> dict[str, Any]:
    api_key = require_openai()
    user = current["user"]
    project_insert = (
        supabase_admin.table("projects")
        .insert(
            {
                "user_id": user.id,
                "name": payload.project_name.strip(),
                "description": payload.description.strip(),
                "mode": "user-story",
                "status": "processing",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
        )
        .execute()
    )
    if not project_insert.data:
        raise HTTPException(status_code=400, detail="Could not create project.")

    project = project_insert.data[0]
    pid = project["id"]

    try:
        ai = generate_user_story_bundle(api_key, settings.openai_model, payload.description)
        arch = normalize_plantuml_block(ai.architecture_diagram)
        uc = normalize_plantuml_block(ai.usecase_diagram)
        seq = normalize_plantuml_block(ai.sequence_diagram)
        if not is_plausible_plantuml(arch):
            arch = normalize_plantuml_block(
                repair_plantuml(api_key, settings.openai_model, arch, "architecture")
            )
        if not is_plausible_plantuml(uc):
            uc = normalize_plantuml_block(
                repair_plantuml(api_key, settings.openai_model, uc, "usecase")
            )
        if not is_plausible_plantuml(seq):
            seq = normalize_plantuml_block(
                repair_plantuml(api_key, settings.openai_model, seq, "sequence")
            )
        svg_arch, svg_uc = fetch_two_svgs_parallel(settings.plantuml_server_url, arch, uc)
        svg_seq = fetch_svg_bytes(settings.plantuml_server_url, seq)
        prefix = f"{user.id}/{pid}/diagrams"
        path_arch = f"{prefix}/architecture.svg"
        path_uc = f"{prefix}/usecase.svg"
        path_seq = f"{prefix}/sequence.svg"
        upload_svg(supabase_admin, settings.supabase_storage_bucket, path_arch, svg_arch)
        upload_svg(supabase_admin, settings.supabase_storage_bucket, path_uc, svg_uc)
        upload_svg(supabase_admin, settings.supabase_storage_bucket, path_seq, svg_seq)

        result_insert = (
            supabase_admin.table("analysis_results")
            .insert(
                {
                    "project_id": pid,
                    "mode": "user-story",
                    "architecture_diagram": arch,
                    "usecase_diagram": uc,
                    "sequence_diagram": seq,
                    "controlflow_diagram": None,
                    "class_diagram": None,
                    "architecture_diagram_image_path": path_arch,
                    "usecase_diagram_image_path": path_uc,
                    "sequence_diagram_image_path": path_seq,
                    "controlflow_diagram_image_path": None,
                    "class_diagram_image_path": None,
                    "summary": ai.summary,
                    "created_at": now_iso(),
                }
            )
            .execute()
        )
        if not result_insert.data:
            raise RuntimeError("Could not save analysis result.")

        supabase_admin.table("projects").update({"status": "completed", "updated_at": now_iso()}).eq(
            "id", pid
        ).execute()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("user-story analysis failed: %s", e)
        supabase_admin.table("projects").update({"status": "failed", "updated_at": now_iso()}).eq("id", pid).execute()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analysis failed. Check OPENAI_API_KEY, PlantUML server reachability, and Supabase Storage.",
        ) from e

    return {"project_id": pid, "status": "completed"}


@app.post("/api/v1/projects/code-upload")
async def create_code_upload_project(
    project_name: str = Form(...),
    files: list[UploadFile] = File(...),
    current=Depends(get_current_user),
) -> dict[str, Any]:
    api_key = require_openai()
    user = current["user"]
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")

    file_payloads: list[dict[str, Any]] = []
    for f in files:
        content = await f.read()
        if not content:
            continue
        file_payloads.append(
            {
                "name": f.filename,
                "size": len(content),
                "language": detect_language(f.filename or ""),
                "content": content.decode("utf-8", errors="ignore"),
                "raw": content,
            }
        )

    if not file_payloads:
        raise HTTPException(status_code=400, detail="Uploaded files were empty.")

    language_counts: dict[str, int] = {}
    for fp in file_payloads:
        language_counts[fp["language"]] = language_counts.get(fp["language"], 0) + 1
    primary_language = max(language_counts, key=language_counts.get)

    project_insert = (
        supabase_admin.table("projects")
        .insert(
            {
                "user_id": user.id,
                "name": project_name.strip(),
                "description": f"{len(file_payloads)} source files uploaded",
                "mode": "code-upload",
                "language": primary_language,
                "file_count": len(file_payloads),
                "status": "processing",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
        )
        .execute()
    )
    if not project_insert.data:
        raise HTTPException(status_code=400, detail="Could not create project.")
    project = project_insert.data[0]

    file_rows: list[dict[str, Any]] = []
    for item in file_payloads:
        path = f"{user.id}/{project['id']}/{item['name']}"
        try:
            supabase_admin.storage.from_(settings.supabase_storage_bucket).upload(
                path, item["raw"], {"upsert": "true"}
            )
        except Exception:
            pass
        file_rows.append(
            {
                "project_id": project["id"],
                "user_id": user.id,
                "file_name": item["name"],
                "language": item["language"],
                "size_bytes": item["size"],
                "storage_path": path,
                "created_at": now_iso(),
            }
        )
    if file_rows:
        supabase_admin.table("project_files").insert(file_rows).execute()

    pid = project["id"]
    code_text = truncate_code_bundle(
        "\n\n".join(f"// File: {fp['name']}\n{fp['content']}" for fp in file_payloads)
    )

    try:
        diagrams = generate_code_diagrams_bundle(api_key, settings.openai_model, code_text)
        cf = normalize_plantuml_block(diagrams.controlflow_diagram)
        cl = normalize_plantuml_block(diagrams.class_diagram)
        if not is_plausible_plantuml(cf):
            cf = normalize_plantuml_block(
                repair_plantuml(api_key, settings.openai_model, cf, "controlflow")
            )
        if not is_plausible_plantuml(cl):
            cl = normalize_plantuml_block(
                repair_plantuml(api_key, settings.openai_model, cl, "class")
            )
        svg_cf, svg_cl = fetch_two_svgs_parallel(settings.plantuml_server_url, cf, cl)
        prefix = f"{user.id}/{pid}/diagrams"
        path_cf = f"{prefix}/controlflow.svg"
        path_cl = f"{prefix}/class.svg"
        upload_svg(supabase_admin, settings.supabase_storage_bucket, path_cf, svg_cf)
        upload_svg(supabase_admin, settings.supabase_storage_bucket, path_cl, svg_cl)

        tests_ai = generate_code_tests_bundle(api_key, settings.openai_model, code_text)

        result_insert = (
            supabase_admin.table("analysis_results")
            .insert(
                {
                    "project_id": pid,
                    "mode": "code-upload",
                    "architecture_diagram": None,
                    "usecase_diagram": None,
                    "sequence_diagram": None,
                    "controlflow_diagram": cf,
                    "class_diagram": cl,
                    "architecture_diagram_image_path": None,
                    "usecase_diagram_image_path": None,
                    "sequence_diagram_image_path": None,
                    "controlflow_diagram_image_path": path_cf,
                    "class_diagram_image_path": path_cl,
                    "summary": diagrams.summary,
                    "created_at": now_iso(),
                }
            )
            .execute()
        )
        if not result_insert.data:
            raise RuntimeError("Could not save analysis result.")

        for t in tests_ai.whitebox_tests:
            supabase_admin.table("test_cases").insert(
                {
                    "project_id": pid,
                    "name": t.name,
                    "description": t.description,
                    "type": "whitebox",
                    "input": t.input,
                    "expected_output": t.expected_output,
                    "code": t.code,
                    "created_at": now_iso(),
                }
            ).execute()
        for t in tests_ai.blackbox_tests:
            supabase_admin.table("test_cases").insert(
                {
                    "project_id": pid,
                    "name": t.name,
                    "description": t.description,
                    "type": "blackbox",
                    "input": t.input,
                    "expected_output": t.expected_output,
                    "code": t.code,
                    "created_at": now_iso(),
                }
            ).execute()

        supabase_admin.table("projects").update({"status": "completed", "updated_at": now_iso()}).eq(
            "id", pid
        ).execute()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("code-upload analysis failed: %s", e)
        supabase_admin.table("projects").update({"status": "failed", "updated_at": now_iso()}).eq("id", pid).execute()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analysis failed. Check OPENAI_API_KEY, PlantUML server reachability, and Supabase Storage.",
        ) from e

    return {"project_id": pid, "status": "completed"}


@app.get("/api/v1/projects/{project_id}")
def get_project(project_id: str, current=Depends(get_current_user)) -> dict[str, Any]:
    user_id = current["user"].id
    response = (
        supabase_admin.table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found.")
    return response.data[0]


@app.get("/api/v1/projects/{project_id}/result")
def get_project_result(project_id: str, current=Depends(get_current_user)) -> dict[str, Any]:
    user_id = current["user"].id
    project = (
        supabase_admin.table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found.")

    result = (
        supabase_admin.table("analysis_results")
        .select("*")
        .eq("project_id", project_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Analysis result not found.")

    tests = (
        supabase_admin.table("test_cases")
        .select("*")
        .eq("project_id", project_id)
        .execute()
    ).data or []
    white = [t for t in tests if t.get("type") == "whitebox"]
    black = [t for t in tests if t.get("type") == "blackbox"]

    merged = enrich_analysis_result_with_signed_urls(result.data[0])
    merged["whitebox_tests"] = white
    merged["blackbox_tests"] = black
    return merged


@app.delete("/api/v1/projects/{project_id}")
def delete_project(project_id: str, current=Depends(get_current_user)) -> dict[str, bool]:
    user_id = current["user"].id
    project = (
        supabase_admin.table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found.")

    ar = (
        supabase_admin.table("analysis_results")
        .select(
            "architecture_diagram_image_path, usecase_diagram_image_path, "
            "sequence_diagram_image_path, controlflow_diagram_image_path, class_diagram_image_path"
        )
        .eq("project_id", project_id)
        .limit(1)
        .execute()
    )
    diagram_paths: list[str] = []
    if ar.data:
        row = ar.data[0]
        for k in (
            "architecture_diagram_image_path",
            "usecase_diagram_image_path",
            "sequence_diagram_image_path",
            "controlflow_diagram_image_path",
            "class_diagram_image_path",
        ):
            if row.get(k):
                diagram_paths.append(row[k])

    pf = (
        supabase_admin.table("project_files")
        .select("storage_path")
        .eq("project_id", project_id)
        .execute()
    )
    file_paths = [r["storage_path"] for r in (pf.data or []) if r.get("storage_path")]
    delete_paths(supabase_admin, settings.supabase_storage_bucket, diagram_paths + file_paths)

    supabase_admin.table("test_cases").delete().eq("project_id", project_id).execute()
    supabase_admin.table("analysis_results").delete().eq("project_id", project_id).execute()
    supabase_admin.table("project_files").delete().eq("project_id", project_id).execute()
    supabase_admin.table("projects").delete().eq("id", project_id).eq("user_id", user_id).execute()
    return {"success": True}
