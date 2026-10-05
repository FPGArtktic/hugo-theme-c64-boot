#!/usr/bin/env python3
"""WCAG 2.2 contrast gate for assets/css/00-tokens.css.

Parses the palette blocks, computes the WCAG 2.x relative-luminance ratio of
every foreground token against its own palette's --c-screen, and fails if a
token that carries meaning drops below 4.5:1 (AA, normal text).

Decorative tokens are listed in DECORATIVE and only reported, never enforced:
they must not be the sole carrier of information (CLAUDE.md 2.4).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "assets" / "css" / "00-tokens.css"

# Foreground tokens that carry meaning -> must reach AA against --c-screen.
ENFORCED = ("--c-text", "--c-dim", "--c-accent", "--c-accent-2", "--c-ok", "--c-err")
# Frame/ornament only. Never the sole carrier of information.
DECORATIVE = ("--c-border", "--c-deco")
AA = 4.5

VALUE_RE = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")
PALETTE_SEL_RE = re.compile(r'\[data-palette(?:-light|-dark)?="([\w-]+)"\]')
HEX_RE = re.compile(r"#([0-9a-fA-F]{6})\b")
COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def rules(css: str):
    """Yield (selector, body) for every declaration block, at any nesting."""
    sel_start = 0
    i = 0
    while i < len(css):
        ch = css[i]
        if ch == "{":
            selector = css[sel_start:i].strip()
            close = i + 1
            depth = 1
            while close < len(css) and depth:
                if css[close] == "{":
                    depth += 1
                elif css[close] == "}":
                    depth -= 1
                close += 1
            body = css[i + 1 : close - 1]
            if "{" in body:            # at-rule: recurse into it
                yield from rules(body)
            else:
                yield selector, body
            i = close
            sel_start = i
            continue
        if ch == "}":
            sel_start = i + 1
        i += 1


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex6: str) -> float:
    r, g, b = (int(hex6[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return (
        0.2126 * srgb_to_linear(r)
        + 0.7152 * srgb_to_linear(g)
        + 0.0722 * srgb_to_linear(b)
    )


def ratio(fg: str, bg: str) -> float:
    a, b = luminance(fg), luminance(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def resolve(raw: str, pool: dict[str, str]) -> str | None:
    """Return a 6-digit hex for a token value, following one var() hop."""
    raw = raw.strip()
    direct = HEX_RE.search(raw)
    if direct:
        return direct.group(1)
    ref = re.search(r"var\(\s*(--[\w-]+)", raw)
    if ref and ref.group(1) in pool:
        return resolve(pool[ref.group(1)], pool)
    return None


def main() -> int:
    css = COMMENT_RE.sub("", TOKENS.read_text(encoding="utf-8"))

    pool: dict[str, str] = {}
    palettes: dict[str, dict[str, str]] = {}
    for selector, body in rules(css):
        decls = {m.group(1): m.group(2) for m in VALUE_RE.finditer(body)}
        names = set(PALETTE_SEL_RE.findall(selector))
        if names:
            for name in names:
                palettes.setdefault(name, {}).update(decls)
        elif selector.strip() == ":root":
            # The --c64-* ramp and every palette's raw values live here.
            pool.update(decls)

    if not palettes:
        print("contrast: no palette blocks found in 00-tokens.css", file=sys.stderr)
        return 2

    failures = 0
    for name in sorted(palettes):
        tokens = palettes[name]
        screen = resolve(tokens.get("--c-screen", ""), pool)
        if not screen:
            print(f"contrast: {name}: no --c-screen", file=sys.stderr)
            failures += 1
            continue
        print(f"\n{name}  (screen #{screen})")
        for token in ENFORCED + DECORATIVE:
            if token not in tokens:
                if token in ENFORCED:
                    print(f"  {token:14} MISSING")
                    failures += 1
                continue
            fg = resolve(tokens[token], pool)
            if not fg:
                print(f"  {token:14} unresolved: {tokens[token].strip()}")
                failures += 1
                continue
            r = ratio(fg, screen)
            if token in DECORATIVE:
                print(f"  {token:14} #{fg}  {r:5.2f}  decorative")
            elif r >= AA:
                print(f"  {token:14} #{fg}  {r:5.2f}  AA")
            else:
                print(f"  {token:14} #{fg}  {r:5.2f}  FAIL (< {AA})")
                failures += 1

    print(f"\n{len(palettes)} palettes checked, {failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
