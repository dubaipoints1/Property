---
owner: standards-editor
status: ratified
ratified-at: 2026-06-10
ratified-by: Chairman (via PR #231 pilot precedent)
applies-to: every card review MDX in `src/content/cards/`
---

# SOP — "Value to me: AED X" convention

## What it is

The HfP signature convention: every meaningful card benefit (perk,
welcome bonus, status, earn rate) carries an explicit AED figure for
what it's worth to a UAE reader, with the assumption visible inline so
the reader can re-do the math with their own inputs.

The pattern was identified as Tier A #2 in the 2026-05-21 competitor
teardown (`.council/research/2026-05/competitor-teardown.md` lines
207–215, "highest reader-decision aid value, low engineering cost").
It was ratified site-wide by the Chairman on 2026-06-10 via the pilot
precedent set in PR #231 (`fab-cashback.mdx` + `emirates-nbd-skywards-
infinite.mdx`).

## When to apply it

Every card review with a Perks / Benefits / "What you get" section.
Cards with structural value beyond the headline earn rate (lounge,
status, hotel perks, vouchers, statement credits, BOGO discounts) gain
the most.

Plain cashback cards with no meaningful side-perks (e.g. a clean 1%
cashback card) don't need it — the earn rate IS the value, already
articulated in the earn-rate section.

## How to apply it

**Structure.** Within the Perks / Benefits / "What you get" section,
break each significant benefit into its own H3. Each H3 should end with
a bolded `**Value to me: AED X/year**` line followed by the explicit
reasoning behind the figure.

Close the section with a one-paragraph sum: "Total package: ~AED X/year
against AED Y fee" (or "AED X for year one with fee waived" if a
year-one waiver applies).

**Per-benefit calculation patterns.** The table below covers the
common cases. Each assumes a "realistic UAE-reader" baseline and
states the assumption alongside the figure.

| Benefit type | AED math | Example |
|---|---|---|
| Lounge access (visits/year) | AED 200 walk-in equivalent × cardholder visits × utilisation | "8 cardholder + 6 guest visits at AED 200 each; four trips with a guest = **AED 1,600/year**." |
| BOGO cinema / dining | (Retail price − BOGO price) × utilisation per month × 12 | "Reel Cinemas AED 40 ticket → AED 20 paid; 4 visits/month × AED 20 saving × 12 = **AED 960/year** at full utilisation." |
| Cashback at a category | Cashback rate × realistic monthly spend × 12 | "5% on AED 3,000/month dining = AED 150/month × 12 = **AED 1,800/year**." |
| Voucher / credit | Face value of the voucher | "AED 500 noon credit = **AED 500/year**." |
| Hotel free nights | Cash equivalent of an average paid room × free nights | "1 free Bonvoy night at AED 1,000 cash equivalent = **AED 1,000/year**." |
| Status / tier (annual) | Per-trip value of the perk × annual trips | "Skywards Silver: extra checked bag at AED 100 + priority check-in at AED 50; four trips = **AED 600/year**. Lost from year two unless re-qualified." |
| Welcome bonus (cycle) | Programme valuation × points/miles | "100,000 Skywards Miles at the 2-fil baseline = **AED 2,000**, one-time, year-one only." |
| Earn-rate yield (annual) | Earn rate × realistic monthly card spend × 12 × programme valuation | "1.5 miles per AED 1 × AED 100,000/year × 2 fils = **AED 3,000/year**." |
| Free transfers / fee waivers | Per-occurrence value × occurrences/year | "Free same-day Carrefour delivery 4x/month (worth AED 25 each) = **AED 1,200/year**." |
| Express / multiplier add-ons | (Extra earn × monthly spend × valuation) − (monthly add-on fee × 12) | Net break-even or net positive/negative; state explicitly. |

## Voice + rules

- **AED-first.** No `$`, no `Dhs`, no `AED5000`.
- **State the assumption** alongside every figure. Two ranges (light vs
  heavy utilisation) is fine and often more honest than a single point.
- **No marketing creep.** "Value to me" is analytical. Don't write
  "incredible value" or "unmatched". Stay dry.
- **Be willing to write small numbers.** "Value to me: AED 0–200" is
  acceptable when a benefit rarely delivers — that's honest.
- **Programme valuations** for points/miles come from the published
  programme overview, not the editor's gut. The current published
  baselines (10 June 2026):
  - Skywards: 2 fils per Mile (see `programs/skywards.mdx`)
  - Etihad Guest: 2 fils per Mile (per `programs/etihad-guest.mdx`)
  - Marriott Bonvoy: 2.5 fils per point (per `programs/marriott-bonvoy.mdx`)
  - Qatar Privilege Club (Avios): ~3 fils per Avios
  - Hilton Honors: 1.5 fils per point
  - dnata: 2 fils per point
  - SHARE Points: 10 fils per point (1 AED per 10 points)
  - LuLu Points: 1 fil per point
  - U Points: 2 fils per point

  When in doubt: open the relevant `programs/<programme>.mdx` and use
  the figure published there. Don't guess — the travel-experiences-editor
  flagged a Bonvoy mismatch on the 10 June 2026 cascade where the
  earlier draft of this SOP had 4 fils instead of the 2.5 published
  in the programme overview.
- **Reference the methodology** at the bottom of long-form value
  sections — for Skywards, link to `/airlines/skywards/` so readers can
  see the cost-basis vs cash-fare-avoidance footnote.
- **The total package line** at the end should sum the figures you've
  stated. If you can't sum cleanly (because some perks are mutually
  exclusive or stack-dependent), say so.

## What NOT to do

- Don't invent figures. Every assumption stated, every figure traceable
  to L2 or the published programme valuation.
- Don't pad. If a benefit is genuinely worth AED 0 to most readers, say
  AED 0 or "depends" — both are more honest than padding the sum.
- Don't restructure existing structured frontmatter (`kicker`, `tier`,
  `scores`, `applyIf`, `skipIf`, `keyTakeaways`, `pros`, `cons`,
  `editorTake`) when adding Value-to-me. Those fields surface across
  multiple chrome surfaces; changes need separate review.
- Don't apply the convention site-wide without piloting per card-
  category first. Cashback / travel / status cards each have different
  benefit weights and a one-size pattern reads forced.
- Don't quote `welcomeBonusValue` (legacy field) as the welcome bonus
  AED total. Use the structured `welcomeBonus.amount × programme
  baseline`. Several cards carry stale `welcomeBonusValue` figures
  (audit dossier 6 June 2026 finding 5).

## Pilot precedent files

Two files set the precedent in PR #231; reference them before adding
the convention to a new card:

- `src/content/cards/fab-cashback.mdx` — cashback card pattern with
  lifestyle perk stack (lounge / BOGO / vouchers)
- `src/content/cards/emirates-nbd-skywards-infinite.mdx` — travel card
  pattern with welcome bonus / lounge / status / earn-rate yield

## Cascade tracking

This SOP applies as the convention spreads. Cards carry the convention
when their Perks / Benefits / "What you get" section follows the H3
+ Value-to-me pattern. Audit query for cards still pending:

```bash
grep -L "Value to me" src/content/cards/*.mdx
```

When every active card carries the convention, this SOP closes the A2
item from the competitor-pattern adoption brief.

End.
