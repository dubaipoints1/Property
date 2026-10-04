---
name: design-references
description: Ten DESIGN.md analyses of premium sites (Stripe, Wise, Revolut, Mastercard, Wired, The Verge, Apple, Airbnb, Vercel, Linear) for pattern reference during the dubaipoints.ae redesign — type scales, spacing, numeric treatment, component patterns. Use when designing or restyling a page, choosing a layout pattern, or asked "how does <site> handle X". Never to copy a brand's identity.
---

# Design references (DESIGN.md set)

Vendored from `VoltAgent/awesome-design-md` at `f6961238` (21 September
2026, MIT, see `LICENSE`), installed on Chairman direction 4 October 2026
("Awesome claude design"). Ten of the 73 files, chosen for the two halves
of the A+B direction: fintech ledgers (Stripe, Wise, Revolut, Mastercard,
Vercel, Linear) and editorial broadsheets (Wired, The Verge, Apple, Airbnb).

## How to use them — and the line not to cross

The 2026-10-04 Charter amendment permits these as **inspiration**: type
scale, spacing rhythm, layout and numeric treatment, component patterns.
It forbids taking another company's **logo or wordmark, proprietary
typefaces, or a signature identity element** a reader would recognise as
theirs (Stripe's gradient mesh, Apple's product-tile system as a whole).
The result has to read as DubaiPoints.

Practical rules:

1. Read a file for *how* a pattern is built (ratios, weights, hairlines,
   number alignment), then rebuild it with the house tokens
   (`--font-display`, `--font-ui`, `--navy`, `--gold`, `--gold-lift`…) and
   `.dp-*` classes. Never paste a token value from a reference into
   `global.css`.
2. Fonts named in these files (Sohne, SF Pro, Wired Display, Inter…) are
   not available and not wanted; the house pair is Newsreader + Geist.
3. Colours in these files are a third hue by definition; the no-third-hue
   rule (2026-07-25, R1 2026-09-10) still applies.
4. Cite the reference in the PR body ("spacing after wise.DESIGN.md §…")
   so the Head of UX can check the translation.

Files: `systems/<site>.DESIGN.md`. Full set and updates:
https://github.com/VoltAgent/awesome-design-md
