---
slug: phase-2a-2-0-pros-cons-verdict-amendment
vertical: business-realestate
assigned-editor: technical-lead
predecessor-brief: phase-2a-2-card-review-visual-rebuild
gate-cleared: phase-1-chairman-approval (2026-05-20)
parent-programme: phase-2a-uae-banks-expansion
research-status: in-progress (Head of UX spec dispatched 2026-05-20)
seo-status: n/a
draft-status: n/a (no prose changes)
tech-status: pending
factcheck-status: n/a (no data changes)
standards-status: pending
chairman-status: pending
target-publish: 2026-05-23
tier: T2
type: visual-pattern-amendment
---

# Phase 2a.2.0 — Pros/cons + verdict amendment to the card-review template

> Amends `phase-2a-2` **before** propagation (`phase-2a-2.1`) runs, so the
> 29 remaining card-review MDX files migrate to the full template in one
> pass rather than two.

## The reader problem

Operator-flagged on 2026-05-20 with TPG (`thepointsguy.com/credit-cards/marriott/`) as the reference. Two gaps in the Phase 2a.2 reference page:

1. **The pros/cons arrays in card frontmatter are invisible** on the rendered page. They're defined in `src/content.config.ts` (lines 3-15 on the Skywards Infinite MDX show the structure) but the page template doesn't surface them. TPG renders pros with a green ✓ and cons with a red ✗ — readers parse the structure in under a second without reading.
2. **The `editorTake` field is buried in frontmatter**. The publication's verdict on the card never reaches the surface as a prominent block; the reader has to scroll through Earn Rates / Fee Summary / etc. before encountering anything close to a recommendation. The existing "## Best for" prose section is too late in the page flow.

Both gaps undermine the "comes back" criterion the operator set for the site. Mobile readers on second-language English need visual anchors and a clear verdict above the fold.

## The amendment (lands before propagation)

Two new MDX-callable components plus two new design tokens.

### 1. `<ProsCons card="<slug>" />`

Reads `pros[]` and `cons[]` from the card's MDX frontmatter (via Astro's content collection). Renders:

- Two-column grid on desktop (≥720px): pros left, cons right, both with same internal padding.
- Stacked on mobile (<720px): pros block first (positive-first reading order), cons below. A hairline rule between.
- Each row: an inline-flex with a circular icon (16px) carrying ✓ or ✗, then the pro/con text in DM Sans 14/400.
- Pros use the new `--positive` token for the icon background + white glyph; cons use the new `--negative` token + white glyph.

### 2. `<EditorVerdict card="<slug>" />`

Reads `editorTake` from frontmatter. Renders a navy-rule callout block:

- Eyebrow row: "Our take" in DM Sans 11/700/uppercase/letter-spacing 2.5px (same as the new `WelcomeBonusCallout` eyebrow).
- Body: the full `editorTake` paragraph in **Fraunces 18px italic, 1.4 line-height, max-width 52ch, text-wrap balance**. Same idiom as the `SpecCard` tagline + the existing `.dp-take` editorial-verdict block.
- 3px left rule in `--green` (navy); `--paper` background; `--line` border on the other three sides; 14×18 padding.

Both components sit **above** the "Earn rates" section on every card-review page. Reading order on the rebuilt Skywards Infinite MDX:

1. Page title (`# Skywards Infinite Credit Card`) — from the slug-routed page template
2. Lead paragraph (existing prose)
3. `<EditorVerdict card="..." />` — *the publication's read of the card*
4. `<ProsCons card="..." />` — *the at-a-glance summary*
5. `## Earn rates` + `<EarnRateTable card="..." />` — existing
6. `## Fee summary` + `<FeeBlock card="..." />` — existing
7. `## Welcome bonus breakdown` — existing
8. `## Key conditions to know` — existing
9. `## Skywards Infinite vs Skywards Signature` + `<CardComparison cards={[...]} />` — existing
10. `## Best for` — existing (keep; this is the long-form variant of the verdict)
11. `## Watch out for` — existing

The reader's first 5 seconds on the page now answer the three questions Phase 1's brief named: *what does this card pay back, can I get it, what does the publication think.* Today they only get the first.

### 3. Two new design tokens (Chairman-scoped to this use)

- `--positive: #2d6a52` — deep editorial green (the previous `--green` value before the 2026-05-16 directive moved primary to navy). Reserved site-wide to the `ProsCons` ✓ icon.
- `--negative: #b54a2c` — muted brick red. Reserved site-wide to the `ProsCons` ✗ icon.

Both tokens declared next to `--gold` in `global.css` with the same "legacy / single-use" doc comment that the gold token carries. No leak into general UI; every other accent in the site stays `--green` (navy) + `--gold`.

## Migration

Two MDX files in this brief; the other 28 are the follow-up `phase-2a-2.1` propagation brief.

1. **`src/content/cards/emirates-nbd-skywards-infinite.mdx`** — insert `<EditorVerdict />` + `<ProsCons />` immediately after the lead paragraph (between line 34 and `## Earn rates`).
2. **`src/content/cards/emirates-nbd-skywards-signature.mdx`** — same insertion point (for consistency when the operator clicks through the comparison).

## Done when

1. `<ProsCons.astro>` and `<EditorVerdict.astro>` exist in `src/components/cards/`.
2. Two new tokens (`--positive`, `--negative`) declared in `global.css` with single-use doc comments.
3. Skywards Infinite + Signature MDX both surface the verdict + pros/cons above the Earn Rates section.
4. Tests: snapshot the rendered HTML of both components for the Skywards Infinite frontmatter; assert pros count = 5, cons count = 5; assert the verdict eyebrow + body render in the expected order.
5. `npm run check` / `npm run build` / `npm test` all green.
6. CardComparison + the existing Phase 1 components untouched (no regression).
7. Council sign-off: Tech Lead + Chairman (the two new tokens are a brand-voice call; Chairman scopes the use).

## Out of scope

- The other 28 card-review MDX files — `phase-2a-2.1` propagation brief picks them up once this amendment is approved.
- Changes to `src/pages/cards/[slug].astro` — components are imported in the MDX, not added to the page wrapper.
- Per-card pros/cons editing — the operator may want the section editor to do a copy pass on every card's pros/cons array, but that's a separate prose-refresh brief.
- Frontmatter schema changes — `pros[]`, `cons[]`, `editorTake` already exist in `src/content.config.ts`. No new fields.

## Acceptance for the Chairman gate

The Chairman will refuse if:

- The two new tokens leak into any UI surface other than the ✓/✗ icons.
- The verdict block competes visually with the page-title hierarchy.
- The pros/cons component breaks the existing `.dp-article` long-form layout on mobile.
- Lighthouse Performance score drops more than 3 points on `/cards/emirates-nbd-skywards-infinite/`.

---

_Brief opens 2026-05-20 on operator feedback after the Phase 2a.2 reference-page merge. Sits between 2a.2 (reference page, done) and 2a.2.1 (propagation, pending). Tech Lead implements; Standards Editor reviews the "Our take" microcopy; Chairman scopes the two new tokens. Target Chairman gate: 2026-05-23._
