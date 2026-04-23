"""
Triangle classification — sample for code-upload testing.

Given three side lengths, determine if they form a valid triangle and
what type: equilateral, isosceles, or scalene.
"""

from __future__ import annotations

from enum import Enum


class TriangleType(str, Enum):
    EQUILATERAL = "equilateral"
    ISOCELES = "isosceles"
    SCALENE = "scalene"


def is_valid_triangle(a: float, b: float, c: float) -> bool:
    """Return True iff sides can form a triangle (positive and triangle inequality)."""
    if a <= 0 or b <= 0 or c <= 0:
        return False
    return a + b > c and a + c > b and b + c > a


def classify_triangle(a: float, b: float, c: float) -> TriangleType:
    """
    Classify a valid triangle. Caller should ensure is_valid_triangle first.
    """
    if a == b == c:
        return TriangleType.EQUILATERAL
    if a == b or b == c or a == c:
        return TriangleType.ISOCELES
    return TriangleType.SCALENE


def triangle_problem(a: float, b: float, c: float) -> str:
    """
    Main entry: return a human-readable result for the triangle problem.

    Returns one of:
    - "invalid" if not a triangle
    - "equilateral" / "isosceles" / "scalene" for valid triangles
    """
    if not is_valid_triangle(a, b, c):
        return "invalid"
    return classify_triangle(a, b, c).value


if __name__ == "__main__":
    tests = [
        (3, 3, 3),
        (3, 4, 4),
        (3, 4, 5),
        (1, 2, 3),
        (-1, 2, 2),
    ]
    for x, y, z in tests:
        print(f"sides=({x}, {y}, {z}) -> {triangle_problem(x, y, z)}")
