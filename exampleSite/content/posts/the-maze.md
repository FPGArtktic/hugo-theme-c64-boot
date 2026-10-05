+++
title = "The maze"
date = 2026-07-02
tags = ["basic"]
+++

Two characters, one random choice, and an endless corridor:

{{< basic >}}
10 PRINT CHR$(205.5+RND(1)); : GOTO 10
{{< /basic >}}

`CHR$(205)` and `CHR$(206)` are the two diagonal PETSCII glyphs. Adding a
random fraction to 205.5 lands on one or the other, and BASIC truncates. Type
it into the prompt on this site — backtick opens it — and it runs there too.
