---
status: closed — ruled 12 June 2026
tier: T3
raised-by: travel-experiences-editor (5 June 2026 per-page editorial pass) — surfaced via fact-checker referral on PR #220
owner: chairman (valuation methodology) → standards-editor (cross-page consistency) → travel-experiences-editor (downstream rewrites)
chairman-status: approved (keep 2-fils cost basis) — 12 June 2026
---

# Brief — Skywards Mile baseline valuation methodology reconciliation

**Date:** 2026-06-06
**Tier:** T3 (publication-wide valuation methodology change — every UAE Skywards co-brand review derives break-even math from the published baseline)

## Background

`programs/skywards.mdx` publishes a valuation table at line 105–113
treating a Skywards Mile as worth **2 fils per Mile** baseline (range
0.8–3.5 fils across redemption types). The travel-experiences-editor
audit found that:

1. The DXB → LHR worked example on the same page (lines 140–145) was
   arithmetically broken — claimed "AED 22,000 cash equivalent /
   102,500 miles = 2.1 fils per mile" when the math gives 21.5 fils.
   A misplaced decimal that lived for ~3 weeks. **Fixed in PR #221**:
   rewritten to "AED 19,000 of value extracted, ~9× multiple over the
   2 fils baseline."

2. `guides/skywards-business-class-redemptions-2026.mdx` derives
   **12–16 fils per Mile** on the same routes (LHR 16, JFK 15, NRT 12,
   BKK 15) and explicitly notes "well above the 2.0–2.5 fils-per-Mile
   valuation we publish for the programme." The guide is internally
   consistent and acknowledges its methodology.

3. The methodology gap is real, not a typo: the programmes page uses a
   **cost-basis** valuation (what miles cost to earn / pay-with-Miles
   floor), while the redemptions guide uses a **cash-fare-avoidance**
   valuation (cash ticket avoided). Both are defensible. Different
   industry publications choose one or the other:

   - HfP, OMAAT, TPG generally use cash-fare-avoidance for headline
     "best use" math and a separate cost-basis figure for break-even.
   - Industry consensus on Skywards is ~1.0–1.4 US cents per mile
     (~3.7–5.1 fils) — between our two figures.

PR #221 added a methodology note after the valuation table pointing
readers to the redemptions guide for cash-fare math and explaining when
to reach for each. That note is the editorial bandaid; **the underlying
methodology choice belongs to the Chairman**.

## What's at stake

Every UAE Skywards co-brand review on the site uses the **2 fils
baseline** to evaluate welcome bonuses. Examples (read from
`src/content/cards/emirates-nbd-skywards-*.mdx` and
`fab-etihad-guest-infinite.mdx`):

- A 100,000-mile welcome bonus is valued at **AED 2,000** in
  break-even math (100,000 × 2 fils)
- A 250,000-mile Skywards Infinite welcome is valued at **AED 5,000**
- The Infinite's AED 1,575 annual fee is recovered "in roughly one
  welcome bonus" — math depends on the 2-fil baseline

If the Chairman ratifies a shift to ~5 fils (industry consensus) or
~12 fils (cash-fare-avoidance), the same welcome bonuses revalue:

| Bonus size | At 2 fils | At 5 fils | At 12 fils |
|---|---|---|---|
| 100,000 Miles | AED 2,000 | AED 5,000 | AED 12,000 |
| 250,000 Miles | AED 5,000 | AED 12,500 | AED 30,000 |

The Skywards Infinite's "welcome bonus recovers the annual fee in one
cycle" claim is true at 2 fils but becomes ridiculous at 12 fils
("welcome bonus covers the annual fee 7× over"). Conversely at 12 fils
the Etihad Guest cards' apparent value rises sharply — Etihad Guest
miles also redeem against cash fares, not just pay-with-Miles floors.

Cross-page consistency requires one answer.

## Options

### Option A — keep 2 fils cost-basis baseline

The current published baseline is the conservative figure. It values
miles at what they cost to earn (welcome-bonus context) and at the
pay-with-Miles floor (everyday redemption context). Co-brand
recommendations stay as-is.

**Pros:** Existing co-brand math holds. Welcome-bonus economics read
honest — no "look at this huge return" marketing inflation. The
methodology note from PR #221 explains why per-redemption rates in the
guides read higher (cash-fare avoidance).

**Cons:** Below industry consensus. Reads conservative compared to
HfP / OMAAT / TPG. Some readers will treat the math as missing the
upside of a well-redeemed mile.

### Option B — shift to ~5 fils industry baseline

Match the broader industry consensus. Co-brand math rewrites: every
welcome-bonus value figure roughly 2.5× the current claim.

**Pros:** Reads as informed industry consensus. Easier comparison
against international publications.

**Cons:** Every UAE Skywards co-brand review needs welcome-bonus,
break-even, and ROI math rewritten. Risk: inflating welcome-bonus
value pushes the publication closer to the "look at this huge return"
register the editorial voice avoids.

### Option C — split baselines explicitly

Publish two baselines side by side: cost-basis (~2 fils, conservative)
and cash-fare-avoidance (~12 fils, optimistic). Each co-brand review
shows both figures. Reader picks.

**Pros:** Maximally honest. No methodology hidden.

**Cons:** Every reader has to pick a methodology. Charts and break-
even math becomes harder to communicate at a glance.

## Recommendation

**Option A — keep 2 fils, formalise the methodology footnote.**
PR #221's methodology note becomes the publication-policy footnote
attached to every Skywards co-brand review:

> "Welcome bonus values on this page use our 2 fils per Mile
> cost-basis valuation — see the
> [Skywards programme overview](/airlines/skywards/) for the
> methodology and a comparison with cash-fare-avoidance figures."

This holds the current downstream math (no rewriting 6 ENBD Skywards
co-brand reviews + Fab Etihad Guest Infinite) and surfaces the
methodology question to readers exactly where it matters.

If at any point the Chairman ratifies Option B or C, the same brief
becomes the workplan for cascading the change.

## Owners + sequencing

1. **Chairman** — ratifies methodology (A / B / C)
2. **Standards Editor** — drafts the footnote pattern + applies it
   across `emirates-nbd-skywards-infinite.mdx`,
   `emirates-nbd-skywards-signature.mdx`,
   `emirates-nbd-etihad-guest-elevate.mdx`,
   `emirates-nbd-etihad-guest-inspire.mdx`,
   `fab-etihad-guest-infinite.mdx` (4–5 co-brand reviews)
3. **Travel-experiences-editor** — verifies the math holds in each
4. **Chairman** — Stage 7 publish gate as for any T3

## What blocks this

T3 convene per Charter §"Tiered review". The conservative path
(Option A + footnote) is the lowest-disruption answer; the brief
itself is the convene trigger.

End.

---

## Addendum — 11 June 2026 (consolidating session): Etihad Guest page carried the same error class, live

The travel-experiences-editor flagged during the best-of roundup build
that `src/content/programs/etihad-guest.mdx` published "AED 19,500 of
value against 88,000 miles = roughly 2.2 fils per mile. Squarely in our
baseline range." The arithmetic on its own inputs is **~22 fils** on the
cash-fare-avoidance basis — a factor-of-ten understatement of the same
class as the PR #221 Skywards fix, and the "squarely in our baseline
range" framing laundered cash-fare value into the cost-basis baseline.
The European example (7,300 / 50,000 = 14.6 fils, published as "1.5
fils") had the identical error.

Both prose sentences were corrected on 11 June with explicit
cash-fare-avoidance labelling. **Not corrected:** the page's
"What an Etihad Guest Mile is worth" table — its two rows with on-page
worked examples (transatlantic 1.8–2.3, European 1.5–2.2) are provably
10× understated on the cash-fare basis, but the remaining rows
(GuestSeat 2.5–4.0, GCC 0.8–1.2, peak 1.0–1.5) have no worked examples
to scale from, and the "Why 2 fils as the baseline?" paragraph derives
the baseline from the understated numbers. Rescaling the table is
inseparable from the basis question this brief already puts to the
Chairman — so the table is now additional evidence for this decision,
not a separate fix. Fact-Checker should re-derive every row on whichever
basis the Chairman ratifies.

---

## Ruling — 12 June 2026

**The 2-fils cost-basis baseline stands.** Cash-fare-avoidance figures
may be cited where they help the reader (e.g. "a Business-saver burn
realises AED 8,000–14,000") but must be explicitly labelled and never
presented as the baseline. Per the 11 June addendum, the Etihad Guest
valuation table is re-labelled to the cash-fare basis with its two
provable rows rescaled; the remaining rows are queued for Fact-Checker
re-derivation on the ratified basis. Charter amendment logged in
CLAUDE.md.
