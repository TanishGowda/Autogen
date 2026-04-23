"""Upload diagram SVGs to Supabase Storage and create signed URLs."""

from __future__ import annotations

import logging
from typing import Any

from supabase import Client

logger = logging.getLogger(__name__)


def upload_svg(
    supabase: Client,
    bucket: str,
    storage_path: str,
    svg_bytes: bytes,
) -> None:
    supabase.storage.from_(bucket).upload(
        storage_path,
        svg_bytes,
        file_options={"content-type": "image/svg+xml", "upsert": "true"},
    )


def create_signed_url(
    supabase: Client,
    bucket: str,
    storage_path: str | None,
    expires_in: int = 3600,
) -> str | None:
    if not storage_path:
        return None
    try:
        result = supabase.storage.from_(bucket).create_signed_url(storage_path, expires_in)
        if isinstance(result, dict):
            return result.get("signedURL") or result.get("signedUrl")
        if hasattr(result, "get"):
            return result.get("signedURL")  # type: ignore[union-attr]
    except Exception as e:
        logger.warning("signed URL failed for %s: %s", storage_path, e)
    return None


def delete_paths(supabase: Client, bucket: str, paths: list[str]) -> None:
    paths = [p for p in paths if p]
    if not paths:
        return
    try:
        supabase.storage.from_(bucket).remove(paths)
    except Exception as e:
        logger.warning("storage delete failed: %s", e)
