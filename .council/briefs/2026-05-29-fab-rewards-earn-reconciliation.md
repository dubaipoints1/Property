---
status: open
tier: T2
raised-by: fix-earn-unit-mislabel QA + Chairman gate (29 May 2026)
owner: Head of Research (primary-source) → business-realestate-editor (L2/L3)
chairman-status: pending
---

# Brief — reconcile FAB Rewards earn: percentage vs points (3 cards)

**Date:** 2026-05-29
**Tier:** T2 (data correction once the primary source is in hand; may
escalate if the schema flag from the sibling brief lands first)

## The ambiguity

Three FAB cards carry the identical `earnUnit: "FAB Rewards per AED 1
spent"` in L2, but the stored `earnRates` values mean different things:

| Card | earnRates (sample) | Almost certainly | Renders today |
|---|---|---|---|
| `fab-cashback` | dining 5, shopping 5 | **percentage** — prose says "5% cashback... direct percent, not points" | "5×" (faithful to earnUnit) |
| `fab-elite` | (verify) | unknown — reconcile | per earnUnit |
| `fab-world-elite` | international 10 | **points** — 10% on all intl spend is not credible; 10 FAB Rewards/AED is | "10×" |

Because the earnUnit string is identical, the `earnIsPercentage` heuristic
renders all three as "×". For `fab-world-elite` that is correct; for
`fab-cashback` it is wrong (should be "5%"). The render is currently
**faithful to the data** — the data itself is the problem.

## What needs to happen

1. **Head of Research** pulls the FAB Rewards earn structure from the
   primary source (FAB Schedule of Charges / card product pages / FAB
   Rewards programme terms). Establish for each of the three cards:
   - Is the earn a cashback percentage or a FAB Rewards points multiplier?
   - What is the FAB Rewards → AED conversion (to value the points)?
2. **business-realestate-editor** corrects L2 `earnRates` scale +
   `earnUnit` string per card so they are internally consistent, flips
   `_provenance` to `editor-corrected`, and reconciles the L3 prose
   (fab-cashback prose says "direct percent, not points" — if that's
   right, the earnUnit must change to a "%" form).
3. Coordinate with `2026-05-29-earn-value-kind-l2-flag.md`: if the
   explicit `earnValueKind` field lands first, set it per card here.

## Until reconciled

The cards render faithfully to current L2 (fab-cashback "5×", world-elite
"10×"). No auto-flip — a heuristic guess on a typed numeric is the ADCB
FX-fee failure mode and is not permitted on a recommendation surface.
