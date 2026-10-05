+++
title = "Eight palettes"
date = 2026-07-20
tags = ["theme", "c64"]
+++

Three day palettes and five night ones, all of them AA for every token that
carries meaning. The switcher in the footer is a BASIC line, not a row of
swatches, and the prompt accepts the real thing:

{{< basic >}}
10 POKE 53280,14 : POKE 53281,6
20 POKE 646,1
{{< /basic >}}

`POKE 646,n` is refused when the colour it asks for would put body text below
4.5:1 on the current screen — the machine answers `?ILLEGAL QUANTITY  ERROR`,
which is the error it would really have used for a value out of range.
