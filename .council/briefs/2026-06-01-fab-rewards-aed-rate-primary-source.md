---
status: open
tier: T2
raised-by: 1 June 2026 fab-cashback live re-scrape (Firecrawl markdown)
owner: head-of-research (cross-check) → business-realestate-editor (L3 prose corrections)
chairman-status: pending
---

# Brief — FAB Rewards → AED conversion rate: L3 prose overstates by ~67%

**Date:** 2026-06-01
**Tier:** T2 (L3 prose correction across multiple FAB card reviews; no
L2 typed-numeric change because the figure is not in L2)

## The finding

PR #188's reconciliation brief
(`.council/briefs/2026-05-29-fab-rewards-earn-reconciliation.md`,
§"FAB Rewards programme terms (cross-card)") flagged the FAB Rewards →
AED conversion rate as **`unresolved-after-primary-source`**:

> The L3 prose asserts "roughly AED 0.50 per 100 points at the app's
> prevailing rate" (= AED 0.005/point). **Not confirmed by primary
> source in the 2026-05-10 archive.**

A 1 June 2026 Firecrawl markdown scrape of
`https://www.bankfab.com/en-ae/personal/credit-cards/cashback-credit-card`
now provides the primary source. The bank's own published cashback
table (verbatim):

| Category | Cashback | FAB Rewards |
|---|---|---|
| Supermarket / Fashion / Dining (5%) | AED 0.05 per AED 1 spent | **17 FAB Rewards per AED 1 spent** |
| All other spending (1%) | AED 0.01 per AED 1 spent | **3.5 FAB Rewards per AED 1 spent** |
| Select categories (0.15%) | AED 0.0015 per AED 1 spent | **0.5 FAB Rewards per AED 1 spent** |
| Non-AED spending (3%) | AED 0.03 per AED 1 spent | **10 FAB Rewards per AED 1 spent** |

The bank publishes the equivalence both ways — explicitly tying X% cashback
to a specific FAB Rewards count per AED 1 spent. This is a closed-form
primary source for the conversion rate.

### The arithmetic

Each row gives `AED cashback ÷ FAB Rewards` = AED-per-Reward:

- 5% row: AED 0.05 ÷ 17 = **AED 0.00294 / Reward** → AED 0.294 per 100 Rewards
- 1% row: AED 0.01 ÷ 3.5 = **AED 0.00286 / Reward** → AED 0.286 per 100 Rewards
- 3% row: AED 0.03 ÷ 10 = **AED 0.003 / Reward** → AED 0.300 per 100 Rewards
- 0.15% row: AED 0.0015 ÷ 0.5 = **AED 0.003 / Reward** → AED 0.300 per 100 Rewards

The four rows converge on **AED 0.30 ± 0.01 per 100 FAB Rewards**, or
**~AED 0.003 per Reward**. The variance is rounding noise in the
issuer's table (17 is rounded from 17.0167; 3.5 is rounded from 3.5034).

### The L3 prose claim

`src/content/cards/fab-cashback.mdx:103` (last verified 2026-05-28):
> "Cashback pays as **FAB Rewards** redeemable inside the FAB Mobile app —
> **roughly AED 0.50 per 100 points** at the app's prevailing rate."

**AED 0.50 per 100 points = AED 0.005/Reward.** The primary source says
**AED 0.30 per 100 points = AED 0.003/Reward**. The L3 prose **overstates
the redemption value by ~67%**.

Note: the bank's table ties the ratio to the cashback redemption flow.
The FAB Mobile app may offer different rates for catalogue redemptions
(merchandise, vouchers, partner conversions). The L3 may have derived
its figure from an in-app screenshot of one of those flows. The cashback
flow rate (AED 0.003/Reward), however, is the **floor** — anything
worse than the published cashback conversion would make the cashback
redemption flow dominant.

For the editorial use case in `fab-cashback.mdx` (a cashback card whose
primary redemption is the cashback flow), the published table is the
canonical rate.

## Cards affected

Three FAB cards with FAB Rewards earn whose L3 prose carries a
points-to-AED math claim worth re-checking against the primary source:

| Card | L3 prose excerpt referencing AED-per-FAB-Reward | Action |
|---|---|---|
| `fab-cashback.mdx:103` | "roughly AED 0.50 per 100 points" | **Correct to AED 0.30 per 100 points** |
| `fab-elite.mdx` | (verify line by line for points-valuation math) | Check + reconcile |
| `fab-world-elite.mdx:33-35` | "2.49% FX fee knocks roughly a quarter off the AED-per-dirham value of the 10× international earn" | Recompute against AED 0.003/Reward |

PR #188's brief observed about `fab-world-elite`:
> Material because without it the L3 "2.49% FX fee knocks roughly a
> quarter off the AED-per-dirham value of the 10× international earn"
> claim … is not arithmetically traceable to a primary source.

With AED 0.003/Reward:
- 10 FAB Rewards on AED 1 international = AED 0.03 raw value (3%)
- Minus 2.49% FX fee = 0.51% net
- "knocks roughly a quarter off" suggests 75% retention → would need 7.5
  FAB Rewards/AED net, i.e. AED 0.0225 net. That's 2.25%, not 0.51%
- **The "roughly a quarter off" claim significantly understates the FX
  impact.** Actual hit is ~5/6 of the raw value, not 1/4.

This is a separate L3 correctness issue surfaced by the conversion-rate
finding.

## Why this is editorial, not autonomous

The mechanical arithmetic from the table → AED 0.003/Reward is
deterministic and §6-compliant (verbatim issuer numerics, no LLM
extraction). But applying that figure to L3 prose requires editorial
judgment per card:

- `fab-cashback`: the value-prop framing ("a 5% card whose redemption
  rate is AED 0.30 per 100 points") may want recomputation of any
  Value-to-me arithmetic against the new rate
- `fab-elite`: the points-vs-cashback editorial argument may shift
  materially if the underlying redemption rate is 67% worse than
  previously asserted
- `fab-world-elite`: the FX-net-value math needs full recalculation,
  not just a number swap. "A quarter off" is qualitatively wrong; the
  honest framing is closer to "the 2.49% FX fee eats most of the 3%
  notional value of the 10× international earn"

Standards Editor + Section editor + Fact-Checker need to convene on
the L3 rewrites.

## Recommended sequence

1. **Head of Research** cross-checks the AED 0.003/Reward figure against
   the FAB Rewards programme T&Cs PDF
   (`https://www.bankfab.com/-/media/.../fab-rewards-terms-and-conditions-en.pdf`)
   to confirm the cashback-flow rate is the canonical redemption rate
   for the cards in question, and to document any tiered rates for
   catalogue / partner-conversion redemptions.
2. **business-realestate-editor** rewrites L3 prose on the three FAB
   cards:
   - `fab-cashback.mdx`: "AED 0.50 per 100 points" → "AED 0.30 per 100 points"
   - `fab-elite.mdx`: audit + reconcile any point-valuation math
   - `fab-world-elite.mdx`: rewrite the FX-net-value paragraph
     (lines 33–35) using the correct ratio
3. **Standards Editor** reviews tone on the FX-impact rewrite —
   "eats most of" vs "knocks roughly a quarter off" is a sharper
   editorial framing.
4. **Chairman** publish gate.

## Channel-status footnote

The 1 June 2026 Firecrawl markdown scrape returned 200 OK from
`www.bankfab.com` (production-side egress works via Firecrawl despite
the WebFetch 403 documented in CLAUDE.md). The verbatim cashback table
is in the scrape archive at the Firecrawl scrapeId
`019e832a-ea95-72da-b4eb-f690a6c90000` (1 June 2026).

The bank's product page **still advertises the Amazon Gift Card welcome
"until 31 May 2026"** as of the 1 June scrape — they haven't refreshed
the page despite the cycle ending the day before. This means
`fab-cashback.welcomeBonus` in L2 is **temporarily aligned with the
issuer's still-stale page**; both will need to update together once FAB
launches the next cycle.

## One-line summary

**The FAB Rewards → AED conversion is now primary-source-verified at
~AED 0.003/Reward (AED 0.30 per 100 points). L3 prose on fab-cashback
(line 103) overstates by 67%; fab-world-elite (lines 33–35) materially
under-states the FX-fee impact on the 10× international earn. Three
cards to rewrite, no L2 typed-numeric change.**
