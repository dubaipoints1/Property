---
status: open
tier: T3
raised-by: fact-checker site-wide audit — 1 June 2026
owner: technical-lead → standards-editor → chairman
chairman-status: pending
---

# Brief — provenance-aware rendering for L2 typed numerics

**Date:** 2026-06-03
**Tier:** T3 (cross-component rendering pattern; same shape as the
2026-05-29 §10 ADCB FX-fee kill-list amendment)

## The class of bug

PR #210 fixed two specific provenance leaks (FX-fee row on
`FeeBlock.astro` + `CardReviewLayout.astro` sidebar) and added
provenance-aware "—" placeholders for `_provenance.fxFee:
"needs-review"`. The Fact-Checker audit (1 June 2026) flagged a
**broader latent risk**:

> **No component in `src/components/cards/` reads `card._provenance`
> before rendering. The Charter §6 + 2026-05-29 ADCB amendment
> establish provenance as load-bearing; every render of `fxFee`,
> `annualFee.amount`, `eligibility.minSalary` and `earnRates` treats
> `scraped` / `needs-review` values identically to `editor-confirmed`.
> Not a render-mismatch bug today, but the very class of failure the
> FAB-cashback FX bug exploited. Worth a Tier-3 brief to thread a
> provenance-aware wrapper into AtAGlance / FeeBlock / EligibilityChips
> before the next weekly scrape window.**

The two PRs we already shipped (#210 FX + the original 2026-05-29
emergency amendment) addressed instances. This brief proposes the
pattern.

## Why T3

A provenance-aware wrapper that gates rendering of every L2 typed
numeric crosses multiple concerns:

1. **Schema**: read `_provenance` on every prop binding (and on the
   bifurcated welcomeBonus / annualFeeWaiver shapes)
2. **UX**: the "—" placeholder design needs a consistent treatment
   across AtAGlance, FeeBlock, EarnRateTable, EligibilityChips,
   SpecCard, CardReviewLayout sidebar, listing tiles
3. **Editorial**: decide what each provenance state means at the
   reader-facing surface — `scraped` (unconfirmed but probably
   correct) versus `needs-review` (explicitly flagged unverified)
   versus `editor-confirmed` (default trust) versus `editor-corrected`
   (corrected after a scrape error)
4. **Performance**: a wrapper pattern that reads provenance on every
   render shouldn't add measurable runtime cost (Astro is SSR-static
   so it's not, but the auditing for the right pattern still applies)

Per Charter §"Tiered review", a cross-component rendering pattern
that touches schema + UX + editorial = T3 full council convene.

## Current provenance distribution

Snapshot from `src/data/cards.json` (as of 2 June 2026):

| Provenance state | Field-level count across all 55 cards |
|---|---|
| `editor-confirmed` | ~600 (canonical default) |
| `editor-corrected` | 181 (after the 2026-05-29 §10 sweep) |
| `scraped` | 131 (all on 11 ADCB cards — stable identifying fields like `bank`, `name`, `network`, `categories` that never need editor confirmation) |
| `needs-review` | 55 (`partnerBrands` backlog) + 3 (earnRates) + 2 (fxFee) + 1 (interestRate) + 1 (welcomeBonus) + 1 (eligibility) |

Of the 55 `needs-review` partnerBrands flags, they don't reach the
reader (partnerBrands is `optional`, used in `_features` typed
discriminated union which the editor backfills by hand). Of the 8
other `needs-review` fields, two (`fxFee`) are now provenance-aware
in PR #210; the remaining six (earnRates × 3, interestRate × 1,
welcomeBonus × 1, eligibility × 1) still render as if confirmed.

The six unaddressed `needs-review` fields are on:

- `sc-platinum-x` (interestRate, earnRates)
- `cbd-one` (earnRates)
- `adib-cashback-visa` (fxFee — addressed)
- `emirates-islamic-switch-cashback` (fxFee — addressed, plus
  eligibility still flagged)
- `rakbank-world` (earnRates flag flipped to editor-corrected in
  PR #193 + welcomeBonus still flagged as that's the cycle-end
  Charter-pending decision)

## Proposed approach (Chairman picks the path)

**Option A — Per-component provenance prop threading.** Mirror PR
#210's pattern: every consumer component that reads a typed numeric
takes an optional `<field>Provenance?: string` prop, gates the render
on it, and the page (`[slug].astro` / hub / listing) threads it from
`data._provenance` once per card. Pros: explicit; each component
self-documents which fields it reads provenance for. Cons: O(N×M)
prop threading across N components and M fields. Easy to drift.

**Option B — Single `<L2Value>` wrapper component.** New shared
component that takes `value` + `provenance` + `formatter` and
renders provenance-aware. Every typed-numeric render goes through
it. Pros: one place to evolve the design (placeholder copy, hover
explainer, optional tooltip). Cons: new component shape, all
consumers refactored to use it, retains some prop-threading because
the page still has to extract the right `_provenance` field.

**Option C — Provenance-aware getter on `getCardData()`.** Add an
optional second return shape from `getCardData(slug, { withProvenance: true })`
that bundles each typed numeric with its provenance. Consumers
destructure as `const { fxFee } = data; const { fxFee: fxProv } =
data._provenance;` directly. Pros: no new component shape; data
shape is opt-in per call site. Cons: still doesn't enforce the
read at the render site — leaves it as discipline, not
infrastructure.

**Option D — Defer the broader pattern.** Address provenance leaks
case-by-case as PR #210 did (fxFee). Wait for the next reader-
visible regression to trigger a per-field fix. Pros: zero
engineering cost now. Cons: same shape of bug class as the
2026-05-29 §10 amendment is still latent.

Head of UX preliminary recommendation: **Option B** (the `<L2Value>`
wrapper). The provenance-aware design needs ONE consistent treatment
across surfaces (sidebar, AtAGlance tile, FeeBlock, comparison rows)
or it'll feel inconsistent. A wrapper component is the easiest place
to evolve that single treatment.

Fact-Checker preliminary recommendation: **Option B or A, defer
on D.** The cost of even Option B is modest (1 component + 5
consumer refactors); the cost of another reader-visible kill-list
incident is high.

Technical Lead deferred — needs to size the Option B implementation
against the scrape pipeline's data flow before committing.

## Recommended sequence (if not D)

1. Tech Lead spikes the `<L2Value>` component shape on a single
   surface (recommend `AtAGlance.astro` — the canonical fact-tile
   strip on 55/55 cards). T2 spike PR.
2. Standards Editor + Head of UX review the spike's visual
   treatment (placeholder copy, tooltip behaviour, screen-reader
   announcement).
3. Roll out to FeeBlock + EarnRateTable + EligibilityChips + SpecCard
   + listing tiles. Per-surface T2 PRs.
4. Add a regression test that loops every card × every provenance-
   bearing field and asserts no `needs-review` value reaches the
   rendered string in a published HTML page.

## Chairman decision needed

- Pick A / B / C / D
- If A or B or C: assign Tech Lead to spike the chosen pattern
- If D: explicit accept-the-risk, with a follow-up review trigger
  (e.g. "any future scrape-pipeline bug touching typed numerics
  re-opens this brief")

## One-line summary

**Provenance-leak class is the same shape as the 2026-05-29 §10 ADCB
kill-list amendment. PR #210 closed two instances (fxFee); 6 other
needs-review fields still render as if confirmed across 5 cards.
Four pattern options proposed; Chairman picks the path.**
