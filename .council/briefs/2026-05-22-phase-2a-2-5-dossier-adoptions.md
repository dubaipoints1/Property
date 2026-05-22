# Phase 2a.2.5 — Card-review template, dossier-informed adoptions

**Status:** open · **Tier:** T2 (chrome / copy / layout) · **Opened:** 2026-05-22
**Brief author:** Head of Research (parent session, sub-agent tool-inheritance gap noted in dossier)
**Source dossier:** `.council/research/2026-05/competitor-teardown.md` (merged in PR #127)
**chairman-status:** _pending_

## Why

The competitor teardown identified twenty-three patterns across TPG, UP, HfP,
and OMAAT and ranked thirteen of them as Tier A — adopt now, low engineering
cost. This brief takes the subset that is **purely additive content or a
modest extension of an existing component** and ships them on the two
reference card-review pages (Skywards Infinite + Skywards Signature) so the
eventual Phase 2a.2.1 propagation across the remaining 29 MDX files has one
source of truth.

Larger Tier A and Tier B adoptions — `GreatCardIf` component, Jump-to-Section
sticky chrome, structured `Value to me` schema field, homepage trust-stack —
are explicitly **out of scope** for this brief. Each requires its own brief.
This brief is the minimum viable application of the dossier to the reference
pages.

## What ships in this brief

### 1. `AtAGlance` — fourth tile

`src/components/cards/AtAGlance.astro` extended to render a **Welcome bonus**
tile (compact-formatted amount + unit label, e.g. `100k Skywards Miles`,
`40k Skywards Miles`) when `welcomeBonus.amount > 0` in `cards.json`.

Layout:

- 2 tiles → 2 columns at all sizes (unchanged)
- 3 tiles → 3 columns at all sizes (unchanged)
- 4 tiles → 4 columns desktop, 2×2 grid on mobile (≤719.98px), with
  proper interior border handling so the grid lines read as a single
  table

Format helpers added inline to the component:

- `formatCompactBonus(n)` — `100000 → "100k"`, `40000 → "40k"`,
  `1500000 → "1.5M"`
- `UNIT_LABELS` map — `"skywards_miles" → "Skywards Miles"`,
  `"etihad_miles" → "Etihad Guest Miles"`, `"qatar_avios" → "Avios"`, etc.
  Falls back to `unit.replace(/_/g, " ")` for units not in the map.

Spec authority: dossier Tier A #1 (top-of-article fact-tile strip — UP + TPG
canonical pattern). Charter §1 (AED-native, headline numbers first).

### 2. `Is it worth it?` + `Bottom line` H2 verdict sections

Both reference MDX files (`emirates-nbd-skywards-infinite.mdx` +
`emirates-nbd-skywards-signature.mdx`) gain two new H2 sections appended
**after** "Watch out for":

- `## Is it worth it?` — 2–3 paragraphs of personal-math walkthrough.
  Names the break-even spend, the welcome-bonus offset, and a one-sentence
  rule the reader can apply to their own circumstances. Format follows
  OMAAT's prose-math pattern (no table) while keeping HfP's editorial
  honesty (named tradeoffs, no false certainty).
- `## Bottom line` — 1 short paragraph, **must contain an explicit
  `**Apply**` or `**Skip**` token** so the verdict is unambiguous.

Spec authority: dossier Tier A #6 (statement-H2 spine with question-H2
verdict — OMAAT model with our voice). Charter §1 (Dubai-first, AED-native).
Charter §10 (no advertorial-driven recommendations — the explicit Apply/Skip
token is the editorial honesty signal).

## What does NOT ship in this brief

Held back for follow-on briefs:

- **`GreatCardIf` mirrored-list block** (dossier Tier A #3) — needs a new
  `.astro` component using existing `applyIf` + `skipIf` frontmatter. T2
  template change; separate brief.
- **Per-image inline caption discipline across all body images** (dossier
  Tier A #4) — current MDX images already use the `<SectionBreak>` caption
  prop, but adding inline captions to MDX body images requires a small
  `<Figure>` component. Separate brief.
- **Repeated special-offer callout** (dossier Tier A #7) — typography
  convention; no time-limited offer currently live on either reference
  page. Specify in Standards Editor style guide when the first live offer
  lands.
- **Signature component density upgrade** — bringing `emirates-nbd-skywards-signature.mdx`
  up to the Infinite's component density (`EarnRateTable`, `FeeBlock`,
  `WelcomeBonusCallout`, `CardComparison` replacing the current markdown
  tables) is a T2 chrome change with its own visual-review requirement.
  Separate brief; recommended priority **after** Phase 2a.2.5 ships and
  before Phase 2a.2.1 propagation.
- **Value to me: AED X** per-benefit annotation (dossier Tier A #2) —
  pure MDX convention, but needs a Standards Editor pass on the
  convention (markdown form, exact label, AED formatting) before it ships
  on a reference page. Separate brief.
- **Jump-to-Section sticky chrome** (dossier Tier B #8) — T3, new island
  component, separate brief.

## Verification

- `npm run check` — must pass with no TypeScript errors or content-collection
  Zod validation failures.
- Visual check on `/cards/emirates-nbd-skywards-infinite/` and
  `/cards/emirates-nbd-skywards-signature/`:
  - AtAGlance renders 4 tiles, both cards
  - Welcome-bonus tile shows `100k Skywards Miles` (Infinite) and
    `40k Skywards Miles` (Signature)
  - Mobile (≤719.98px) renders 2×2 grid with correct interior borders
  - "Is it worth it?" + "Bottom line" H2s appear at the foot of both
    articles, after "Watch out for"
  - The verdict contains a visible `**Apply**` or `**Skip**` token in
    bold

## Council sign-off

**Tier:** T2

| Role | Status | Notes |
|---|---|---|
| Section editor (travel-experiences) | _pending_ | reviews voice of new H2 sections |
| Head of UX (Stage 5.5) | _pending_ | reviews 4-tile mobile layout |
| Standards Editor (Stage 6.5) | _pending_ | reviews `Apply` / `Skip` token convention, "Is it worth it?" / "Bottom line" copy |
| Fact-Checker (Stage 6) | n/a | no new factual claims added beyond what was already on each page |
| Technical Lead | pass | AtAGlance change is additive; no schema change; no migration |
| Chairman (Stage 7) | _pending_ | publish gate |

End.
