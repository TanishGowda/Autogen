"""OpenAI calls for user-story (1 JSON) and code-upload (2 JSON calls)."""

from __future__ import annotations

import json
import re
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, Field, field_validator

MAX_CODE_CHARS = 120_000


class UserStoryAIResult(BaseModel):
    architecture_diagram: str = Field(..., description="Full PlantUML block")
    usecase_diagram: str = Field(..., description="Full PlantUML block")
    sequence_diagram: str = Field(..., description="Full PlantUML block")
    summary: str


class CodeDiagramsAIResult(BaseModel):
    controlflow_diagram: str
    class_diagram: str
    summary: str


class TestCaseItem(BaseModel):
    name: str
    description: str
    input: str
    expected_output: str
    code: str | None = None

    @field_validator("input", "expected_output", "code", mode="before")
    @classmethod
    def coerce_to_string(cls, value: Any) -> Any:
        """Accept structured model output and normalize to strings for storage/UI."""
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=False, indent=2)
        return str(value)


class CodeTestsAIResult(BaseModel):
    whitebox_tests: list[TestCaseItem]
    blackbox_tests: list[TestCaseItem]


USER_STORY_SYSTEM = """You are an expert software architect and UML modeler. Output ONLY valid JSON with keys:
architecture_diagram, usecase_diagram, sequence_diagram, summary.

General rules for ALL diagrams:
- Each diagram value must be a complete PlantUML document: @startuml ... @enduml only (no markdown fences).
- Prefer RICH, DETAILED models: many labeled elements, relationships, and notes—not minimal stubs.
- Use skinparam, titles, legends, and notes where helpful for clarity.
- Keep PlantUML valid and renderable; avoid exotic plugins that public servers may not support.

architecture_diagram:
- Use C4-style or layered structure when it fits: containers/components, databases, queues, external systems.
- Show major subsystems, interfaces, data stores, and direction of dependency/data flow.
- Include at least 8–15 meaningful elements (packages/components/actors/interfaces) unless the domain is tiny.
- Add short notes on responsibilities, protocols, or integration points.

usecase_diagram:
- Include primary actors, secondary/supporting actors, and a full boundary (system box).
- List concrete use cases (verbs/noun phrases), not a single generic bubble.
- Use <<include>> / <<extend>> where relationships matter; group related use cases with packages if useful.
- Aim for breadth: multiple use cases reflecting the description (typically 6+ when the story allows).

sequence_diagram:
- Show realistic message flows: HTTP/API calls, auth, DB, async, errors where relevant.
- Use participant aliases, activate/deactivate lifelines, and group with alt/opt/loop/par when flows branch.
- Include at least 4 participants when the story implies multiple services/roles.
- Add return messages and notes for non-obvious steps.

summary: Clear prose summarizing architecture, actors, and main flows (not a repeat of raw PlantUML).

No markdown outside JSON."""

CODE_DIAGRAMS_SYSTEM = """You are an expert at reverse-engineering code into precise UML. Output ONLY valid JSON with keys:
controlflow_diagram, class_diagram, summary.

General:
- Each diagram is full PlantUML @startuml...@enduml, valid and detailed—not toy diagrams.
- Prefer explicit branches, merges, swimlanes or partitions if they clarify control flow.

controlflow_diagram:
- PlantUML activity diagram or flowchart covering main paths: normal flow, key branches, loops, early returns/errors.
- Include enough activities/decisions to reflect real logic (typically many nodes for non-trivial code).
- Name activities with short verb phrases; use fork/join only if parallelism exists.

class_diagram:
- Show main classes, key methods/signatures, fields where relevant, visibility (+/-/~/#) when useful.
- Model associations, inheritance, dependencies, compositions as appropriate; use notes for invariants.
- Include interfaces/abstract classes and important collaborators; avoid a single lonely class unless code is trivial.

summary: Concise technical summary of behavior, structure, and notable edge cases.

No markdown outside JSON."""

CODE_TESTS_SYSTEM = """You are a QA engineer. Output ONLY valid JSON with keys whitebox_tests, blackbox_tests.

Each array item is an object with: name, description, input, expected_output, and optional code (string).
Use string values for input and expected_output (JSON-serialize structured values as a single string if needed).

whitebox_tests:
- Structural/coverage-oriented: branches, loops, internal state, private/helper paths.
- Ground each test in the actual uploaded code; reference concrete functions/classes where natural.

blackbox_tests (TARGET — best effort; fewer valid tests is acceptable, never pad with junk):
1) Boundary Value Analysis (BVA): black-box tests exercise boundaries of inputs/outputs of the primary public
   behavior (main API, CLI entry, or public class methods users call).
2) Let n = the number of DISTINCT input variables/parameters (or independent input fields) of that primary
   interface. Count one variable per parameter; for grouped config objects, count top-level fields that matter.
   If unclear, pick the single most important public function and count its parameters as n; use at least n = 1
   for non-trivial code.
3) IDEAL target: (4 * n) + 1 black-box tests matching classic BVA—one "all nominal" case plus four
   boundary-focused cases per input dimension (min, just above min, nominal band, just below max, max),
   distributed across the n variables. Strive for this count when it remains meaningful and non-redundant.
4) If you cannot reach (4n+1) with sound, distinct BVA cases, return as many strong BVA cases as you can—do not
   duplicate or invent weak tests just to hit a number. The application will show whatever you return without error.
5) In each black-box test description, briefly state which boundary or combination it targets (BVA).
6) Tests must be behavioral (inputs/outputs, exceptions), not white-box (no asserting on internal lines).

If the code has multiple public entry points, focus black-box tests on ONE coherent primary entry and state
which function/API n refers to in the first black-box test's description.

If counting yields n > 8, use n = 8 when planning the ideal (4n+1) target (max 33 black-box tests) and note the
cap in the first black-box test description."""


def _parse_json_object(content: str) -> dict[str, Any]:
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines).strip()
    return json.loads(content)


def _client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key)


def generate_user_story_bundle(api_key: str, model: str, description: str) -> UserStoryAIResult:
    client = _client(api_key)
    user_content = (
        f"System description:\n\n{description}\n\n"
        "Return JSON only. Produce detailed, information-dense PlantUML for all three diagrams "
        "(many elements, relationships, notes, and realistic sequence interactions as specified)."
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": USER_STORY_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    raw = resp.choices[0].message.content or "{}"
    data = _parse_json_object(raw)
    return UserStoryAIResult.model_validate(data)


def generate_code_diagrams_bundle(api_key: str, model: str, code_bundle: str) -> CodeDiagramsAIResult:
    client = _client(api_key)
    diagrams_user = (
        f"Source code:\n\n{code_bundle}\n\n"
        "Return JSON only. Make both diagrams detailed: many nodes/edges, branches, classes, and notes—"
        "not minimal sketches."
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": CODE_DIAGRAMS_SYSTEM},
            {"role": "user", "content": diagrams_user},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    raw = resp.choices[0].message.content or "{}"
    data = _parse_json_object(raw)
    return CodeDiagramsAIResult.model_validate(data)


def generate_code_tests_bundle(api_key: str, model: str, code_bundle: str) -> CodeTestsAIResult:
    client = _client(api_key)
    tests_user = (
        f"Source code:\n\n{code_bundle}\n\n"
        "Return JSON only. For blackbox_tests: apply BVA; set n for the chosen primary public interface; "
        "aim for (4*n)+1 tests; state n in the first black-box description. Fewer sound tests is OK—no padding."
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": CODE_TESTS_SYSTEM},
            {"role": "user", "content": tests_user},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    raw = resp.choices[0].message.content or "{}"
    data = _parse_json_object(raw)
    return CodeTestsAIResult.model_validate(data)


def repair_plantuml(api_key: str, model: str, broken: str, label: str) -> str:
    """One retry to fix invalid PlantUML."""
    client = _client(api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "Fix the following PlantUML so it renders. Output ONLY the PlantUML text, "
                "starting with @startuml and ending with @enduml. No markdown.",
            },
            {"role": "user", "content": f"Diagram ({label}):\n\n{broken[:8000]}"},
        ],
        temperature=0.1,
    )
    fixed = (resp.choices[0].message.content or "").strip()
    fixed = re.sub(r"^```plantuml\s*", "", fixed)
    fixed = re.sub(r"^```\s*", "", fixed)
    fixed = re.sub(r"\s*```$", "", fixed)
    return fixed.strip()


def truncate_code_bundle(text: str) -> str:
    if len(text) <= MAX_CODE_CHARS:
        return text
    return text[:MAX_CODE_CHARS] + "\n\n[... truncated for token limits ...]"
