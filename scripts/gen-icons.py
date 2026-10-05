#!/usr/bin/env python3
"""Generate the committed raster icons and the OG card background.

Run after changing the nice-city palette; the outputs are committed so the
build never needs Python or Pillow:

    python3 scripts/gen-icons.py

Shapes only — a block cursor on the screen colour inside the border colour.
No Commodore logo, no C= glyph (CLAUDE.md 1).
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BORDER = (31, 30, 92)      # --p-nice-city-border #1f1e5c
SCREEN = (43, 42, 127)     # --p-nice-city-screen #2b2a7f
BRIGHT = (244, 242, 255)   # --p-nice-city-bright #f4f2ff


def icon(size: int, out: Path) -> None:
    frame = max(1, round(size / 16))
    img = Image.new("RGB", (size, size), BORDER)
    d = ImageDraw.Draw(img)
    d.rectangle((frame, frame, size - frame - 1, size - frame - 1), fill=SCREEN)
    # The 8x8 cell, scaled: a 3x4 cell block cursor, centred.
    cw, ch = round(size * 0.3), round(size * 0.42)
    x, y = (size - cw) // 2, (size - ch) // 2
    d.rectangle((x, y, x + cw - 1, y + ch - 1), fill=BRIGHT)
    img.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  {size}x{size}  {out.stat().st_size} B")


def og_base(out: Path) -> None:
    w, h = 1200, 630
    frame = 32
    img = Image.new("RGB", (w, h), BORDER)
    d = ImageDraw.Draw(img)
    d.rectangle((frame, frame, w - frame - 1, h - frame - 1), fill=SCREEN)
    img.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  {w}x{h}  {out.stat().st_size} B")


if __name__ == "__main__":
    icon(180, ROOT / "static" / "apple-touch-icon.png")
    icon(48, ROOT / "static" / "icon-48.png")
    og_base(ROOT / "assets" / "images" / "og-base.png")
