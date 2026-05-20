---
slug: phase-2a-2-card-review-visual-rebuild
vertical: business-realestate
assigned-editor: business-realestate-editor
predecessor-brief: phase-2a-0-schema-additions
parent-programme: phase-2a-uae-banks-expansion
research-status: in-progress (Head of UX audit dispatched 2026-05-20)
seo-status: n/a (no URL changes; same templates)
draft-status: pending
tech-status: pending
ux-stage-5-5-status: in-progress
factcheck-status: n/a (no data changes; structure-only)
standards-status: pending
chairman-status: pending
target-publish: 2026-05-25
tier: T2
type: visual-rebuild (templating-only)
---

# Phase 2a.2 — Card-review page visual rebuild

## The reader problem

A reader on `/cards/emirates-nbd-skywards-infinite/` on a 375px-wide mobile sees:

- A "Skywards Infinite vs Skywards Signature" comparison rendered as a 3-column markdown table where the row labels wrap mid-word ("Annual fee (year 2+)" breaks across two lines; "Dining / travel earn" wraps; "Lounge access" cell breaks).
- An "Earn rates" section that's a plain two-column markdown table — Dining 2.5, Travel 2.5, Groceries 1, Fuel 1, Everything else 1. Nothing draws the eye to the headline rate (2.5×).
- A "Fee summary" markdown table where the labels wrap (every row), no AED figure is visually prominent, and the year-one-waived / year-two-onwards distinction reads as two equal-weight rows instead of a primary value with a footnote.

Operator-flagged on 2026-05-20: *"these pages look messed up on mobile … can we tabularise it or highlight it or make some content more prominent? Once we get one right we can apply it on the other pages."*

The fix is to replace markdown tables with the component library Phase 1 already shipped — `FeeBlock`, `EarnRateTable`, `WelcomeBonusCallout` — and add one new component (`CardComparison`) for the vs-tables that every card review carries.

## Why now

1. **Phase 1 component library is in production.** `FeeBlock` (28px Fraunces AED headline), `EarnRateTable` (top-row navy bold), `WelcomeBonusCallout` (navy-rule callout), `EligibilityChips` (salary-primary block + qualifier chips) all render correctly on mobile, all on the 8px grid, all in the editorial idiom. They just aren't wired into the card-review MDX files yet.
2. **Phase 2a.0 schema additions** (joiningFee, welcomeBonus.headline) materially improve the data fed to those components.
3. **Phase 2a per-bank passes** start 2026-05-27 — the new bank reviews should ship with the new visual idiom, not the legacy markdown tables.
4. **One reference page, then propagate.** The operator's mental model: *"get one right then apply it on the other pages."* Right.

## Out of scope

- **No data changes.** `src/data/cards.json` untouched.
- **No new card-review MDX files.** Phase 2a per-bank briefs handle those.
- **No SEO restructure.** Meta titles, slugs, internal links unchanged.
- **No template change** to `src/pages/cards/[slug].astro`. Components are imported inside the MDX, not added to the page wrapper.
- **No design-token additions.** Components use existing `--ink`, `--paper`, `--line`, `--green`, `--gold`.
- **No section-editor prose pass.** This is structure-only. The prose stays; only the tables are swapped for components.

## Done when

1. **One new MDX-callable component**: `src/components/cards/CardComparison.astro`. Renders a 2-card vs-table (Skywards Infinite vs Signature is the reference case). Props: `cards: Array<{ slug, name, …extracted fields }>` or `cards: CardData[]`. On desktop renders 2 columns side-by-side; on mobile stacks to single-column with each card surfaced as its own block. Each row surfaces the *winner* in navy + 700 weight (same idiom as `EarnRateTable.is-top`).
2. **MDX wrappers / re-exports** so the section editor's MDX stays readable:
   - `<FeeBlock card={...} />` — wrapper that pulls the fee, fx, waiver, joiningFee from the cards.json entry by slug instead of inline props.
   - `<EarnRateTable card={...} />` — same pattern.
   - `<WelcomeBonusCallout card={...} />` — same.
3. **Skywards Infinite MDX** (`src/content/cards/emirates-nbd-skywards-infinite.mdx`) rebuilt as the **reference page**:
   - "Fee summary" markdown table → `<FeeBlock card="emirates-nbd-skywards-infinite" />`.
   - "Earn rates" markdown table → `<EarnRateTable card="emirates-nbd-skywards-infinite" />`.
   - "Skywards Infinite vs Skywards Signature" markdown table → `<CardComparison cards={["emirates-nbd-skywards-infinite", "emirates-nbd-skywards-signature"]} />`.
   - "Welcome" prose paragraph wrapped in `<WelcomeBonusCallout card="emirates-nbd-skywards-infinite" />` where structurally appropriate.
   - Prose between the components is unchanged.
4. **Mobile review** on 375px: every component renders without horizontal scroll, no text wraps mid-word, the headline figure on `FeeBlock` and the top-rate row on `EarnRateTable` are visually loudest.
5. **Build, check, tests** all green. Pagefind re-indexes correctly.
6. **Operator approves the rebuilt Skywards Infinite page** in browser before the section editor propagates to the other 29 card reviews. The propagation is a follow-up brief (`phase-2a-2.1-card-review-mdx-migration`) that opens after this brief lands.

## Stages

- **Stage 3 (Research, Head of UX)** — *currently in flight*. Auditing the current Skywards Infinite MDX rendered output; identifying which markdown tables map to which components; writing the per-row layout spec for `CardComparison`. Output: `.council/research/2026-05/card-review-page-visual-audit.md`.
- **Stage 5 (Section Editor)** — n/a for this brief (no prose changes). The propagation brief will engage the section editor.
- **Stage 7 (Tech Lead)** — builds `CardComparison.astro`, adds the MDX wrappers, rebuilds the Skywards Infinite MDX as the reference, runs the CI gates.
- **Stage 5.5 (Head of UX)** — sanity-pass on the rebuilt page (one card surface, mobile + desktop).
- **Stage 6 (Fact-check)** — n/a (no data changes).
- **Stage 6.5 (Standards Editor)** — sanity-pass on any MDX-callable microcopy the new component introduces.
- **Stage 7 (Chairman)** — gates the visual idiom. If the Chairman approves, the propagation brief opens immediately.

## Acceptance for the Chairman gate

The Chairman will refuse if:

- The rebuilt Skywards Infinite page fails any of the brief's "Done when" criteria on mobile.
- Any of the existing card-review pages (the other 29 that don't use the new components yet) regress visually as a side-effect of the change.
- The component library grows beyond what's spec'd (no new design tokens; no new components other than `CardComparison`).
- The Lighthouse Performance score on `/cards/emirates-nbd-skywards-infinite/` drops more than 3 points vs. the Phase 1 baseline.

---

_Brief opened 2026-05-20 on operator request. Sits behind Phase 2a.0
(schema additions, just landed) and in front of Phase 2a per-bank
sprints (Mashreq onwards). Target Chairman gate: 2026-05-25._
