# C64 Boot — a Hugo theme

[![ci](https://github.com/FPGArtktic/hugo-theme-c64-boot/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/FPGArtktic/hugo-theme-c64-boot/actions/workflows/ci.yml)
[![hugo extended 0.146.0 or newer](https://img.shields.io/badge/hugo-extended%20%E2%89%A5%200.146.0-ff4088?logo=hugo&logoColor=white)](https://gohugo.io/)
[![licence MIT plus OFL 1.1](https://img.shields.io/badge/licence-MIT%20%2B%20OFL%201.1-8fd3d8)](#licences)
[![javascript optional](https://img.shields.io/badge/javascript-optional-e3a0d5)](#what-it-does)
[![no external requests](https://img.shields.io/badge/external%20requests-none-9ad284)](#what-it-does)

A Commodore 64 that has just been switched on. The site *is* the screen,
navigation *is* the 1541 disk directory, and errors *are* BASIC errors.

Written from scratch — not a fork. No Node, no npm, no Sass, no bundler, and
**no request leaves the origin at runtime**: fonts, CSS and JavaScript are all
self-hosted.

![The default palette, nice-city](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/screenshot.png)

- **Demo:** <https://fpgartktic.github.io/hugo-theme-c64-boot/>
- **Hugo:** extended, 0.146.0 or newer (new template layout)
- **Licence:** theme code MIT, bundled fonts SIL OFL 1.1 — see [Licences](#licences)

## Compatibility

**Hugo extended is required** — the theme builds its CSS and JavaScript with
Hugo Pipes. Nothing else is: no Go toolchain, no Node, no npm, no Sass.

| Hugo | What CI does with it |
|---|---|
| extended **0.146.0** — the declared minimum | built on every push; a break here fails the build |
| extended **latest** | built on every push, allowed to fail so a new release cannot block a merge |

0.146.0 is the floor because this theme uses the template layout introduced
there: `layouts/baseof.html`, `layouts/_partials/`, `layouts/_shortcodes/`.

Checked on every push, on the pinned Hugo:

| Check | Result |
|---|---|
| Font integrity (`sha256sum -c fonts.sha256`) | every bundled file pinned |
| External requests in `public/` | none beyond links written in content |
| Contrast, all 8 palettes | every meaning-carrying token ≥ 4.5:1 |
| axe-core, WCAG 2.2 A + AA, every page of the build | 0 violations, normal and reduced motion |
| html-validate, stylelint, eslint, prettier | 0 errors |
| Internal links and fragments | 0 broken |
| Lighthouse (pull requests) | performance, a11y, best-practices, SEO **100**; CLS **0** |
| Home page, transferred | ≈ 42 KB including the font |

---

## Palettes

Eight palettes, grouped the way a reader actually chooses: by time of day.
Every token that carries meaning clears WCAG AA (4.5:1) in every one of them,
and `scripts/contrast.py` fails the build if that ever stops being true.

### Day

| | |
|---|---|
| **`nice-city`** — the default. Blue screen, pink text, saturation pulled back until it is readable. | ![nice-city](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-nice-city.png) |
| **`c64`** — the real machine, in Colodore values. | ![c64](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-c64.png) |
| **`paper`** — the printed Programmer's Reference Guide. Also what `@media print` forces. | ![paper](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-paper.png) |

### Night

| | |
|---|---|
| **`nice-night`** — the default after dark: the same identity on near-black navy. | ![nice-night](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-nice-night.png) |
| **`oled`** — `POKE 53280,0 : POKE 53281,0 : POKE 646,15`. True black. | ![oled](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-oled.png) |
| **`scene`** — `POKE 53280,6 : POKE 53281,0`. Blue border, black screen. | ![scene](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-scene.png) |
| **`green`** — monochrome P1 phosphor. | ![green](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-green.png) |
| **`amber`** — monochrome P3 phosphor. | ![amber](https://raw.githubusercontent.com/FPGArtktic/hugo-theme-c64-boot/main/images/palette-amber.png) |

### Choosing one

`params.palette` pins a palette. `params.paletteAuto = true` (the default)
follows the operating system instead, using `params.paletteLight` and
`params.paletteDark`. That switch is pure CSS, so it works with JavaScript
disabled; a palette the reader picks from the footer is remembered in
`localStorage` and always wins.

### Adding one

Edit `assets/css/00-tokens.css` and nothing else. Add a value pool next to the
others, then bind it in the two mapping blocks (the manual/day one and the one
inside `@media (prefers-color-scheme: dark)`). Then run `python3
scripts/contrast.py`, which fails if any meaning-carrying token is below AA.

---

## Install

The theme is consumed as a git submodule, so a checkout works offline:

```sh
git submodule add https://github.com/FPGArtktic/hugo-theme-c64-boot.git themes/hugo-theme-c64-boot
git submodule update --init --recursive
```

Minimal `hugo.toml`:

```toml
theme = "hugo-theme-c64-boot"
baseURL = "https://example.org/"
title = "YOUR SITE"

[[menu.main]]
  name = "ABOUT ME"
  pageRef = "/about"
  weight = 10
```

That is enough. Everything below has a working default.

### Configuration

```toml
[params]
  palette = "nice-city"      # day: nice-city | c64 | paper
                             # night: nice-night | oled | scene | green | amber
  paletteSwitcher = true     # the DAY / NIGHT switcher in the footer
  paletteAuto = true         # follow prefers-color-scheme
  paletteDark = "nice-night" # used when paletteAuto and the OS is dark
  paletteLight = "nice-city" # used when paletteAuto and the OS is light
  columns = 80               # 80 | 40 — the C64 was 40, and it suits a phone
  uppercaseChrome = true     # upper-case menus and prompts in CSS, not content

  [params.boot]
    enabled = true
    once = "session"         # session | always | never
    program = "YOUR SITE"    # the LOAD"...",8,1 filename, 16 characters

  [params.dir]
    diskName = "YOUR SITE"   # the 16-character disk name in the header line
    diskId = "2A"
    fakeFree = false         # true prints a pristine 664 BLOCKS FREE.

  [params.prompt]
    enabled = true
    hotkey = "`"

  [params.crt]
    mode = "off"             # off | subtle | full — scanlines and vignette

  [params.fonts]
    body = "pixel"           # pixel (Press Start 2P) | mono (JetBrains Mono)
    code = "mono"            # mono | pixel
    c64pro = false           # see "Optional: C64 Pro" below
```

Menus come from `menu.main`; `menu.footer` is rendered as the footer line.
`exampleSite/` is a complete working site, and `demo.yml` publishes it.

---

## What it does

Every feature degrades to a static page. **The site is fully usable with
JavaScript disabled**, and every animation stops under
`prefers-reduced-motion: reduce`. Nothing in this theme flashes above 3 Hz.

### The boot sequence — `params.boot.enabled = false`

On the home page, the machine switches on: the KERNAL banner, `READY.`, then
`LOAD"NAME",8,1` typed at about 40 ms a character, `SEARCHING FOR`, `LOADING`
with the fast-loader stripes scrolling up the border, and `RUN`. It takes
2.6 seconds, it runs once per session (`params.boot.once`), any key or tap
skips it, and there is a focusable `[SKIP]` link. The whole sequence is static
markup that JavaScript only reveals — without JavaScript the page is simply
ready.

### The directory is the navigation

```
0 "FPGARTKTIC      " 2A 2A
2    "ABOUT ME"           PRG
6    "LICENSING"          PRG
4    "254 BYTES PER BL"   SEQ   2026-06-14
636 BLOCKS FREE.
```

The block counts are real: a 1541 stores 254 data bytes per block, so each
entry is `ceil(len(content) / 254)`, and `BLOCKS FREE` is 664 — an empty
disk — minus what the site actually occupies. `PRG` is a page or section,
`SEQ` a post, `REL` a taxonomy, `DEL` a draft. Hovering reverse-videos the
whole line, arrow keys walk the listing once it has focus, and Pagination is
printed as `LIST 1-8`, `LIST 9-16`, `LIST 17-`.

### 404 — always on

```
LOAD"/NO/SUCH/PATH",8
SEARCHING FOR /NO/SUCH/PATH
?FILE NOT FOUND  ERROR
READY.
```

The path is written in with `textContent`, never `innerHTML`. Without
JavaScript the page still says `LOAD"$",8` and prints the same error, and the
directory underneath it is a real way out.

### The BASIC prompt — `params.prompt.enabled = false`

Backtick, or the cursor in the footer, opens a one-line console. Escape closes
it and focus goes back where it came from.

| Command | Effect |
|---|---|
| `LIST`, `LOAD"$",8` | Print the site directory. |
| `LOAD"ABOUT",8,1` | Go to that page, matching on the first 16 characters. |
| `RUN` | Go home. |
| `POKE 53280,n` / `POKE 53281,n` | Border / screen colour from the C64 ramp, `n` = 0–15. Remembered. |
| `POKE 646,n` | Text colour. Refused with `?ILLEGAL QUANTITY  ERROR` if it would drop body text below 4.5:1. |
| `SYS 64738` | Reset: forget every custom colour and replay the boot. |
| `PRINT "HI"` / `PRINT 2+2` | Echo, and integer arithmetic — parsed, never evaluated. |
| `NEW` | Clear the output. |
| `10 PRINT CHR$(205.5+RND(1)); : GOTO 10` then `RUN` | The maze. |
| anything else | `?SYNTAX  ERROR` |

There is no `eval` anywhere in this theme, and no `innerHTML` is ever given
anything derived from the URL or from what a reader typed.

### Shortcodes

| | |
|---|---|
| `{{< basic >}}` | A BASIC listing: line numbers in their own column, keywords and strings coloured. |
| `{{< petscii alt="..." >}}` | PETSCII art, in the one face that has block glyphs. |
| `{{< dir >}}` | A directory listing written by hand. |
| `{{< hr >}}` | The PETSCII rule. `solid="true"` for the unbroken one. |

### The browser tab

The tab is part of the screen: the favicon is a block cursor that follows the
palette, `theme-color` hands the C64 border colour to the browser chrome so
the frame carries on past the page, and while the tab is in the background the
title alternates `READY.█` / `READY. ` — the machine is waiting for you. All
three are progressive enhancement; under reduced motion the title just reads
`READY.`.

---

## Development

`hugo` alone builds the site. Everything below is optional and never a build
dependency.

```sh
make serve     # hugo server on exampleSite
make build     # hugo --gc --minify --panicOnWarning
make check     # build + integrity + external-request guard + contrast + lint
make shots     # regenerate images/ from exampleSite (needs a headless browser)
```

`make check` runs exactly what CI runs, so air-gapped work never depends on
GitHub. The linters are fetched with `npx --yes` and nothing is installed into
the repository.

---

## Licences

Two licences, and they do not overlap.

### Theme code — MIT

Templates, CSS, JavaScript and scripts: [MIT](LICENSE).

### Fonts — SIL OFL 1.1, separate from the MIT licence

The font files in `static/fonts/` and `assets/fonts/` are **not** covered by
the MIT licence. Full text and per-family notes:
[LICENSE-FONT.txt](LICENSE-FONT.txt) and
[LICENSE-FONT-CODE.txt](LICENSE-FONT-CODE.txt).

| Font | Used for | Notes |
|---|---|---|
| **Press Start 2P** | body and UI | OFL 1.1, Reserved Font Name "Press Start 2P". Repackaged from the upstream TTF to WOFF2 and nothing else. **Never subset** — subsetting is modification, and the Reserved Font Name could then no longer be used. |
| **Sixtyfour** | `{{< petscii >}}` only | OFL 1.1. It has the block and box-drawing glyphs Press Start 2P does not, which is why cursors, rules and frames in this theme are drawn in CSS rather than typed. |
| **JetBrains Mono** | code blocks | OFL 1.1, variable weight. |

`fonts.sha256` pins every file; `sha256sum -c fonts.sha256` is part of
`make check`.

### Optional: C64 Pro — not included

`params.fonts.c64pro = true` switches the pixel face to C64 Pro. **This theme
does not ship that font and never links to it for download.** The site owner
downloads the package from <https://style64.org/c64-truetype> and places
`C64_Pro-STYLE.woff2` in its own `static/fonts/`.

Doing so puts the Style64 licence on *the site*: the file must stay
unmodified, keep its original filename, must not be fingerprinted or subset,
must not be offered for download, and the licence text must appear on the
site's licensing page. The full text is in
[LICENSE-FONT.txt](LICENSE-FONT.txt), section 3. C64 Pro has no Polish
diacritics, so Press Start 2P stays in the stack behind it.

---

## Trademarks

"Commodore" and "Commodore 64" appear here as plain-text homage only. This
theme contains no Commodore logo, no rainbow badge and no C= glyph, and uses
no third-party game names, logos or artwork anywhere — including in the
palette names. **This project is not affiliated with, endorsed by or connected
to Commodore or any of its successors.**

## Credits

- C64 colour values from the [Colodore](https://www.colodore.com/) palette
  (Pepto / Colodore).
- [Style64](https://style64.org/c64-truetype) for the C64 TrueType package,
  which this theme supports but does not distribute.
- Press Start 2P by CodeMan38, Sixtyfour by the Sixtyfour project authors,
  JetBrains Mono by JetBrains — all under the SIL Open Font License 1.1.
