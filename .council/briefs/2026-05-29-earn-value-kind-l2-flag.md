---
status: open
tier: T3
raised-by: Chairman, at the fix-earn-unit-mislabel gate (29 May 2026)
owner: Technical Lead + business-realestate-editor
chairman-status: pending
---

# Brief — explicit `earnValueKind` flag in L2 (retire the earnUnit heuristic)

**Date:** 2026-05-29
**Tier:** T3 (schema change on the cards L2 layer)

## Background

The 29 May `fix-earn-unit-mislabel` PR added `earnIsPercentage(earnUnit,
categories)` + `formatEarnValue()` to render cashback earn as "5%" and
points earn as "5×". The percentage/multiplier decision is inferred from
the free-text `earnUnit` string ("% cashback" / "...per AED 1 spent").

The Chairman's ruling at the gate: this heuristic is sound for the ~25
unambiguous cards but **structurally incapable** of disambiguating cases
where one earnUnit string covers cards of both kinds. The exemplar is the
three FAB cards, all carrying `earnUnit: "FAB Rewards per AED 1 spent"`:

- `fab-cashback` — `earnRates {dining: 5, shopping: 5}` are **percentages**
  (prose: "5% cashback... direct percent, not points").
- `fab-world-elite` — `earnRates {international: 10}` is **points** (10%
  on all international spend is not credible; 10 FAB Rewards/AED is).

Inferring a typed numeric's unit from a free-text label is the same class
of error as the ADCB FX-fee parse (29 May §10 correction).

## What needs to happen

1. Add an explicit, provenance-tracked field to the L2 cards schema:
   `earnValueKind: "percentage" | "multiplier"` (in `src/lib/cardsData.ts`).
2. Backfill it per card against the primary source — not the earnUnit
   string. Where earnUnit and the values disagree (the FAB three), the
   primary source decides and the earnUnit string is corrected too.
3. Retire `earnIsPercentage`'s string-sniff to a **fallback** only:
   `formatEarnValue` should read `earnValueKind` first, fall back to the
   heuristic when the field is absent (so nothing regresses mid-backfill).
4. Regression tests already exist in `tests/cards/card-comparison.test.ts`
   for the render polarity; extend them to assert `earnValueKind` drives
   the output once the field lands.

## Why deferred, not done now

The render-correctness fix shipped (25 cashback cards now correct). The
schema change + per-card primary-source backfill is a larger, council-
gated piece and collides with the FAB reconciliation ticket
(`2026-05-29-fab-rewards-earn-reconciliation.md`) — do them together.
