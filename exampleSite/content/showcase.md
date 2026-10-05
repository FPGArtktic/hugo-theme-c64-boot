+++
title = "Showcase"
date = 2026-08-01
tags = ["theme"]
+++

Every element this theme renders, on one page, so a change can be seen.

## Headings

### Third level

#### Fourth level

## Prose

Body text keeps mixed case, because an article has to be readable. Chrome —
menus, prompts, headings — is upper-cased in CSS, which is a presentation
choice and not baked into the content. Here is **strong**, *emphasis*,
`inline code`, a <kbd>RUN STOP</kbd> key, and a [link](/about/).

> A quotation, indented with a rule rather than a quote glyph.

## Lists

* First file
* Second file
  * A nested one
* Third file

1. Load
2. Run
3. Stop

{{< hr >}}

## A rule, solid

{{< hr solid="true" >}}

## Code

```python
def blocks(size: int) -> int:
    """A 1541 block holds 254 data bytes; the other two are the chain."""
    return max(1, -(-size // 254))
```

## BASIC listing

{{< basic >}}
10 REM COLOUR THE BORDER AND THE SCREEN
20 POKE 53280,6 : POKE 53281,0
30 PRINT "READY."
40 END
{{< /basic >}}

## PETSCII art

{{< petscii alt="A disk drive, drawn in block glyphs" >}}
████████████████
█▒▒▒▒▒▒▒▒▒▒▒▒▒▒█
█▒████████████▒█
█▒▒▒▒▒▒▒▒▒▒▒▒▒▒█
████████████████
{{< /petscii >}}

## A hand-written directory

{{< dir >}}
12  ABOUT ME     PRG
34  PROJECTS     PRG
3   HELLO WORLD  SEQ
{{< /dir >}}

## Table

| Register | Address | What it sets |
|---|---|---|
| Border | 53280 | Frame colour |
| Background | 53281 | Screen colour |
| Cursor | 646 | Text colour |

## Image

A photo stays smooth; art with the `pixel` class keeps its grid.
