#!/usr/bin/env python3
"""Crop the raw browser captures to the sizes the README and the gallery want.

Called by scripts/screenshots.sh:

    crop-screenshots.py <work-dir> <out-dir> <palette> [<palette> ...]

The gallery is strict: images/screenshot.png at 1500x1000 and images/tn.png at
900x600, both exactly 3:2 (CLAUDE.md 17.1). The per-palette README shots are
1280x800. A headless capture is full-page, so everything is cropped from the
top of the page and then scaled.
"""

import sys
from pathlib import Path

from PIL import Image

README_SIZE = (1280, 800)
GALLERY_SIZE = (1500, 1000)
THUMB_SIZE = (900, 600)
DEFAULT = "nice-city"


def crop_to(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Take the top of the page at exactly the target size.

    The capture is made at the target width, so this only ever trims the
    full-page height. Nothing is resampled: scaling an 8x8 pixel face is the
    one thing a screenshot of this theme must not do.
    """
    width, height = size
    if img.width != width:
        raise SystemExit(f"capture is {img.width}px wide, expected {width}px")
    if img.height < height:
        raise SystemExit(f"capture is {img.height}px tall, expected {height}px")
    return img.crop((0, 0, width, height))


def main(argv: list[str]) -> int:
    if len(argv) < 4:
        print(__doc__)
        return 2
    work, out, palettes = Path(argv[1]), Path(argv[2]), argv[3:]
    out.mkdir(parents=True, exist_ok=True)
    def write(src: Path, dst: Path, size: tuple[int, int]) -> None:
        if not src.exists():
            raise SystemExit(f"missing capture: {src}")
        crop_to(Image.open(src).convert("RGB"), size).save(dst, optimize=True)
        print(f"{dst.name}  {size[0]}x{size[1]}  {dst.stat().st_size} B")

    for palette in palettes:
        write(work / f"{palette}-1280.png", out / f"palette-{palette}.png", README_SIZE)
        if palette == DEFAULT:
            write(work / f"{palette}-1500.png", out / "screenshot.png", GALLERY_SIZE)
            write(work / f"{palette}-900.png", out / "tn.png", THUMB_SIZE)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
