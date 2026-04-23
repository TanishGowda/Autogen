"""PlantUML text encoding (PlantUML pipe format) and SVG fetch from a PlantUML server."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin
import zlib

import httpx

logger = logging.getLogger(__name__)


def _encode_6bit(b: int) -> str:
    if b < 10:
        return chr(48 + b)
    b -= 10
    if b < 26:
        return chr(65 + b)
    b -= 26
    if b < 26:
        return chr(97 + b)
    b -= 26
    if b == 0:
        return "-"
    if b == 1:
        return "_"
    return "?"


def encode_plantuml(text: str) -> str:
    """PlantUML server encoding: raw DEFLATE + PlantUML base64 alphabet."""
    data = text.encode("utf-8")
    # PlantUML expects raw DEFLATE bytes (no zlib/gzip headers).
    data = zlib.compress(data, level=9, wbits=-15)
    parts: list[str] = []
    i = 0
    while i < len(data):
        b1 = data[i]
        b2 = data[i + 1] if i + 1 < len(data) else 0
        b3 = data[i + 2] if i + 2 < len(data) else 0
        parts.append(_encode_6bit((b1 >> 2) & 0x3F))
        parts.append(_encode_6bit(((b1 & 0x3) << 4) | ((b2 >> 4) & 0xF)))
        parts.append(_encode_6bit(((b2 & 0xF) << 2) | ((b3 >> 6) & 0x3)))
        parts.append(_encode_6bit(b3 & 0x3F))
        i += 3
    return "".join(parts)


def build_svg_url(plantuml_server_base: str, plantuml_text: str) -> str:
    """Build GET URL for SVG. Base should be like https://www.plantuml.com/plantuml/svg/"""
    base = plantuml_server_base.rstrip("/") + "/"
    encoded = encode_plantuml(plantuml_text)
    return urljoin(base, encoded)


def fetch_svg_bytes(plantuml_server_base: str, plantuml_text: str, timeout: float = 90.0) -> bytes:
    url = build_svg_url(plantuml_server_base, plantuml_text)
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        response = client.get(url)
        response.raise_for_status()
        return response.content


def fetch_two_svgs_parallel(
    plantuml_server_base: str,
    text_a: str,
    text_b: str,
) -> tuple[bytes, bytes]:
    """Fetch two SVGs in parallel."""

    def fetch_one(text: str) -> bytes:
        return fetch_svg_bytes(plantuml_server_base, text)

    with ThreadPoolExecutor(max_workers=2) as executor:
        fut_a = executor.submit(fetch_one, text_a)
        fut_b = executor.submit(fetch_one, text_b)
        return fut_a.result(), fut_b.result()


def is_plausible_plantuml(text: str) -> bool:
    t = text.strip()
    return "@startuml" in t and "@enduml" in t


def normalize_plantuml_block(text: str) -> str:
    """Trim markdown fences if the model wrapped code."""
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        t = "\n".join(lines).strip()
    return t
