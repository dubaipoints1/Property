# Findings brief — L2 (cards.json) vs L3 (card MDX) data divergence

**Date:** 2026-05-26
**Raised by:** Tier-A component rollout (competitor-pattern migration)
**Owner needed:** Fact-Checker (Stage 6) reconciliation against issuer primary sources, then Technical Lead to migrate.
**Status:** open — blocks the legacy-card component migration.

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
