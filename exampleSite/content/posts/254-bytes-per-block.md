+++
title = "254 bytes per block"
date = 2026-06-14
tags = ["1541", "c64"]
+++

A 1541 sector holds 256 bytes. Two of them are the track and sector of the
next block in the chain, which leaves 254 bytes of your file per block. That
is why the directory listing beside this post counts in 254s: the numbers are
computed from the real length of each page, not decorated.

## Why 664

A freshly formatted disk reports `664 BLOCKS FREE.` — 683 sectors on 35
tracks, minus the 18 the directory track keeps for itself, minus one for the
BAM. The number on this site is 664 less whatever the pages actually occupy.

## The chain

Each block points at the next, so a file is a linked list laid out across the
surface. Fragmentation is not a performance problem on a drive that seeks this
slowly; it is the normal state of affairs.

| Field | Bytes |
|---|---|
| Next track | 1 |
| Next sector | 1 |
| Data | 254 |
