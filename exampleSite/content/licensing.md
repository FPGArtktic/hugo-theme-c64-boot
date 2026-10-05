+++
title = "Licensing"
date = 2026-01-05
+++

## Theme code — MIT

The `hugo-theme-c64-boot` templates, CSS and JavaScript are MIT-licensed.

## Fonts — SIL OFL 1.1, separately

The bundled fonts are **not** covered by the MIT licence:

* **Press Start 2P** — SIL OFL 1.1, Reserved Font Name "Press Start 2P".
  Shipped as a WOFF2 repackaged from the upstream TTF with no other change,
  and never subset.
* **Sixtyfour** — SIL OFL 1.1. Used only by the PETSCII shortcode, for the
  block glyphs Press Start 2P does not have.
* **JetBrains Mono** — SIL OFL 1.1. Code blocks.

## C64 Pro — not included

`params.fonts.c64pro` switches the pixel face to C64 Pro, which the site owner
downloads from Style64 and places in its own `static/fonts/`. The theme never
ships that file and never links to it for download. A site that opts in must
serve it unmodified, under its original filename, without fingerprinting or
subsetting, and must reproduce the Style64 licence on this page.

## Trademarks

"Commodore" and "Commodore 64" are used here as plain-text homage only. No
Commodore logo, rainbow badge or C= glyph appears anywhere in this theme, and
this site is not affiliated with, endorsed by, or connected to Commodore or
any of its successors.

## Credits

C64 colour values from the Colodore palette (Pepto / Colodore). C64 TrueType
by Style64.
