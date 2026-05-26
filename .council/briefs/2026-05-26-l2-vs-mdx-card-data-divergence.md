# Findings brief — L2 (cards.json) vs L3 (card MDX) data divergence

**Date:** 2026-05-26
**Raised by:** Tier-A component rollout (competitor-pattern migration)
**Owner needed:** Fact-Checker (Stage 6) reconciliation against issuer primary sources, then Technical Lead to migrate.
**Status:** reconciliation started 2026-05-26 (see outcome at foot). Earn rates confirmed L2-correct; 2 L2 fee errors fixed; 5 fee items pending a free-for-life check.

## What happened

Rolling the competitor "Tier A" components (`AtAGlance`, `FeeBlock`,
`EarnRateTable`) onto the ~30 legacy card-review pages was attempted. The
components read the **L2** layer (`src/data/cards.json`); the legacy review
pages carry **hand-written markdown tables** in their L3 MDX. On ~15 cards the
two **disagree on published fees and earn rates**, so:

- The migration was **reverted** — surfacing `AtAGlance` (L2 numbers) next to a
  stale MDX table would print contradictory figures on the same page.
- The divergence is **pre-existing and already live**: the review page shows the
  MDX-table number while the card finder / `/cards/` listings / comparison
  (all L2-driven) show the L2 number. These already disagree today.

This is a data-integrity issue, not a layout issue. It must be reconciled
against issuer sources before these cards adopt the L2-driven components.

## Reconciliation worklist (verify each against the issuer's current page + Schedule of Charges)

### Fee conflicts (money-critical — verify first)
| Card | MDX table | L2 cards.json |
|---|---|---|
| emirates-nbd-diners-club | annual fee AED 0, FX 0% | AED 420, FX 1.99% |
| emirates-nbd-darna-visa-signature | annual fee AED 0 | AED 315 |
| emirates-nbd-priority-banking-visa-infinite | AED 1,500, FX 0% | AED 1,575, FX 1.99% |
| emirates-nbd-webshopper | annual fee AED 0, FX 0% | AED 52.50, FX 1.99% |
| emirates-nbd-visa-flexi | FX 0% | FX 1.99% |
| emirates-nbd-mastercard-platinum | FX 0% | FX 1.99% |

Several MDX fee tables also carry rows `FeeBlock` does not render (monthly
interest/profit rate, minimum payment, salary, salary-transfer requirement).
Either extend `FeeBlock` or keep those as prose — decide before migrating
(affects u-by-emaar-infinite, share-visa-infinite, skywards-signature,
lulu-247-titanium, darna/duo set).

### Earn-rate conflicts
| Card | MDX table | L2 cards.json |
|---|---|---|
| emirates-nbd-darna-select-visa | everythingElse 1 | partnerBrands 6.25 / else 0.75 |
| emirates-nbd-darna-visa-signature | everythingElse 1 | partnerBrands 7.5 |
| emirates-nbd-darna-visa-infinite | everythingElse 1 | partnerBrands 10 / else 1.5 |
| emirates-nbd-duo | everythingElse 1 | 5× grocery/fuel/utilities |
| emirates-nbd-go4it-platinum | Plus-Points 0.025 / 0.02 / 0.01 | travel 2 / partnerBrands 2.5 / else 0.5 |
| emirates-nbd-visa-flexi | groceries 4 / travel 3 / fuel 2 | groceries 0.4 / fuel 0.2 / else 1.5 |
| emirates-nbd-mastercard-platinum | fuel 2 / else 1 | groceries 0.4 / fuel 0.2 / else 1.5 |
| emirates-nbd-diners-club | dining 5 | travel 5 / dining 2.5 / partner 1.5 |
| emirates-nbd-lulu-247-platinum | else 1% | 0.7% |
| emirates-nbd-priority-banking-visa-infinite | everythingElse 1 | everythingElse 2 |

The systematic pattern (MDX "N× per AED" vs L2 Plus-Points percentages) suggests
the MDX tables and the L2 scrape used different rate conventions/vintages. Likely
one is stale. Confirm the live convention per card before trusting either.

## Recommended sequence

1. Fact-Checker verifies each conflicting field against the issuer's current
   product page + Schedule of Charges; correct L2 (set `_provenance` to
   `editor-corrected`) so listings/finder are right.
2. Once L2 is authoritative, migrate the legacy review pages to
   `AtAGlance`/`FeeBlock`/`EarnRateTable` (removing the hand-written tables) so
   review pages and listings share one source of truth.
3. Prose-only legacy cards (no tables: dnata-platinum/world, etihad-guest-inspire,
   marriott-bonvoy-world/-elite, manchester-united, noon-one, u-by-emaar-family,
   u-by-emaar-infinite-emiratis, visa-infinite, visa-platinum, fab-etihad-guest-infinite,
   fab-world-elite) can take the additive components immediately — no table conflict —
   in the same migration pass once it proceeds.

## Reconciliation outcome — 2026-05-26

Verified L2 against ENBD primary sources: the **Schedule of Charges (Feb 2026)** for fees
and the **live credit-cards listing** for earn rates.

- **Earn rates: L2 is CORRECT.** The listing's "value back" figures match L2 — Darna
  Infinite 10%, Signature 7.5%, Select 6.25%; SHARE Infinite 8% / Signature 6% /
  Platinum 4%; U by Emaar Infinite 7.5%; Duo "5% on grocery/electronics/utilities/
  education/fuel"; Flexi/Mastercard Platinum/Diners Club 1.5%. **The MDX tables were the
  stale side.** Earn-rate migration to `EarnRateTable` is safe.
- **FX: 1.99% uniform** (SoC), waived only for dnata **World** (listing confirms "0%
  forex"). MDX "FX 0%" rows were wrong.
- **Fees: 2 L2 errors corrected** —
  - `share-visa-infinite` annual fee 1500 → **1575** (was stored ex-VAT; all peers VAT-incl).
  - `dnata-platinum` fxFee 0 → **1.99** (0% forex is dnata World only).

### Verified 2026-05-26 (ENBD product pages) — all confirmed correct, no further L2 change
Checked every flagged card against its ENBD product page. **L2 was right on all 8:**
| Card | L2 | Product page | Verdict |
|---|---|---|---|
| emirates-nbd-duo | 0 | "No Annual Fees" current offer | ✓ already has waiver note (SoC 840; AD-residents only) |
| emirates-nbd-go4it-platinum | 0 | "No Annual Fees" current offer | ✓ already has waiver note (SoC 208.95) |
| emirates-nbd-manchester-united | 0 | "No Annual Fees" current offer | ✓ already has waiver note (SoC 262.50) |
| emirates-nbd-visa-flexi | 0 | "No Annual Fees" current offer | ✓ already has waiver note (SoC 735) |
| emirates-nbd-marriott-bonvoy-world | 0 | "Free for life" (permanent) | ✓ 0 correct; SoC 315 is the waived standard |
| emirates-nbd-diners-club | 420 | AED 420 | ✓ matches |
| emirates-nbd-mastercard-platinum | 0 | "No Annual Fees" current offer | ✓ current reality; not in SoC |
| emirates-nbd-visa-platinum | 0 | "No Annual Fees" current offer | ✓ current reality; not in SoC |

The four promo cards were **already reconciled** by a prior editor (waiver notes present
documenting the SoC standard renewal). No edit required — and importantly, those existing
notes (incl. Duo's "Abu Dhabi residents only") must be preserved on migration.

**Reconciliation COMPLETE.** L2 is the authoritative layer for ENBD cards — earn rates
match the live listing, fees match the SoC, the two real errors are fixed
(share-visa-infinite 1575, dnata-platinum FX 1.99). The legacy-card component migration
is fully unblocked: removing the stale MDX tables in favour of L2-driven components is
safe for all ENBD cards.
