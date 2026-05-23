# Phase 2a.2.6 — GreatCardIf mirrored-list block

**Status:** open · **Tier:** T2 (chrome / copy / layout) · **Opened:** 2026-05-22
**Brief author:** Head of Research (continuation of Phase 2a.2.5 line of work)
**Source dossier:** `.council/research/2026-05/competitor-teardown.md` Tier A #3
**Predecessor:** `.council/briefs/2026-05-22-phase-2a-2-5-dossier-adoptions.md` (this brief picks up an item that brief explicitly held back)
**chairman-status:** _pending_

## Why

The competitor teardown identified Upgraded Points' **"Great Card If / Don't Get If"** mirrored-list block as a high-impact, low-cost adoption — a prominent above-the-fold fit/no-fit signal that lets a reader self-qualify in 5 seconds before reading any prose. Charter §1 (mobile-first, scannable in 5 seconds) maps directly to this pattern.

The `applyIf` + `skipIf` frontmatter fields already exist on every card review in the editor-scorecard shape from Phase 2a.2.3 — they currently render only inside `<EditorScorecard>` at the bottom of the article. Surfacing them above the fold as their own block doubles their reader value and matches a competitor pattern that is otherwise missing from our chrome.

## What ships

### New component: `src/components/cards/GreatCardIf.astro`

- Reads the cards content-collection entry by slug (same pattern as `<EditorScorecard>`, `<AtAGlance>`).
- Renders a 2-column block: left = green eyebrow "Great card if" + `applyIf` body; right = ink-soft eyebrow "Skip if" + `skipIf` body.
- Hairline-border chrome, paper background, single-line vertical divider between sides — matches `<AtAGlance>` design family.
- Mobile (≤719.98px): stacks to single column with horizontal divider between sides.
- Renders nothing when neither `applyIf` nor `skipIf` is present.
- Renders single-column when only one is present (`:has(.side:nth-child(1):last-child)` selector).
- Pure SSR, no JS hydration.

Typography:
- Eyebrow: DM Sans 10px, weight 700, letter-spacing 2px, uppercase
- Body: Fraunces 17px (16px mobile), weight 500

Colour tokens:
- "Great card if" eyebrow: `var(--green)` (primary brand accent per Charter §"Two-accent system")
- "Skip if" eyebrow: `var(--ink-soft)` (neutral; intentionally NOT `--gold`, which the Charter reserves for trust signals not editorial caveats)

### MDX wiring on both reference cards

`<GreatCardIf card="…" />` inserted between `<AtAGlance>` and `<EditorVerdict>` in both `emirates-nbd-skywards-infinite.mdx` and `emirates-nbd-skywards-signature.mdx`.

New reader scan path on a card review:
1. Lede paragraph
2. AtAGlance (4 fact tiles — numbers)
3. **GreatCardIf (2 fit-criteria sides — words)** ← new
4. EditorVerdict (kicker prose)
5. ProsCons
6. H2 sections

The reader gets two layers of self-qualification (numbers + criteria) before any prose commits to reading.

## What does NOT ship in this brief

The `applyIf` / `skipIf` qualifier lines remain rendered inside `<EditorScorecard>` at the article foot. That's intentional duplication — the foot-of-article scorecard is a recap; the above-fold block is a pre-read filter. Different positions, different jobs.

No schema change. No frontmatter change. No data migration.

## Verification

- `npm run check` — 0 errors, 0 warnings
- `npm test` — all suites pass
- Visual check on `/cards/emirates-nbd-skywards-infinite/`:
  - GreatCardIf renders between AtAGlance and EditorVerdict
  - Green "Great card if" eyebrow, applyIf text in Fraunces
  - Ink-soft "Skip if" eyebrow, skipIf text in Fraunces
  - Mobile (≤720px) stacks to single column with horizontal divider
- Visual check on `/cards/emirates-nbd-skywards-signature/` — same expectations

## Council sign-off

**Tier:** T2

| Role | Status | Notes |
|---|---|---|
| Section editor (travel-experiences) | pending | the applyIf/skipIf copy is unchanged from Phase 2a.2.3; reviews placement only |
| Head of UX (Stage 5.5) | pending | reviews the 2-column → 1-column mobile collapse, visual rhythm with AtAGlance directly above |
| Standards Editor (Stage 6.5) | pending | reviews the "Great card if" / "Skip if" eyebrow labels (single source of truth — no other place in the chrome uses these strings yet) |
| Fact-Checker (Stage 6) | n/a | no new factual claims |
| Technical Lead | pass | new component is pure SSR + scoped CSS; no JS hydration; reads existing schema fields |
| Chairman (Stage 7) | pending | publish gate |

End.
