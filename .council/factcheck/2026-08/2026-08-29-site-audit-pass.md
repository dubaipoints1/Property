# Fact-check log — 29 Aug 2026 site-audit pass (Stage 6)

**Scope:** valuations single-sourcing (`src/lib/valuations.ts` + header),
welcome-cycle prose rewrites (fab-cashback / hsbc-live-plus /
rakbank-world), rebuilt homepage figures, Etihad fare-sale `staleAfter`
backfill.
**Verdict:** pass-with-redline. Filed by the session on the
Fact-Checker's behalf (review agent had no Write tool).

## Redlines found and corrected

1. **`src/pages/glossary.astro`** — still carried the retracted Skywards
   3.5-fils worked example (11 June redline); corrected to the 2-fil
   baseline (100,000 Miles ≈ AED 2,000), provable from
   `src/content/programs/skywards.mdx`.
2. **`src/pages/index.astro`** — salary-transfer tile claimed "verified
   weekly"; the six live offers' `lastVerified` dates (2026-08-06 ×3,
   2026-08-22 ×3) disprove it. What is weekly is the alert-only source
   watch. Corrected to "sources watched weekly, every entry dated";
   `Header.astro` tracker sub "Scheduled weekly" corrected to "Sources
   watched weekly" in the same pass.

## Verified pass

- Baselines: Skywards 2.0, Etihad Guest 2.0, Bonvoy 2.5, Hilton 1.5 —
  each traced to its programme overview page. Qatar Avios traces to the
  value-to-me SOP as **~3 fils**; the nav now renders "~3.0 fils · DP
  value" (`approx` flag added to the valuations module) rather than an
  unqualified exact figure.
- Welcome-cycle rewrites match L2 (`welcomeBonus: null` on all three)
  and the May cycle-end record; the rakbank 750-vs-1,500 discrepancy is
  reported, not smoothed. Per the reviewer's recommendation, fab and
  hsbc `_provenance.welcomeBonus` flipped to the ratified
  `editor-confirmed-null` sentinel (both were already merge-protected).
- Homepage stats/live-desk derivations sound; deals expiry filter and
  honest-emptiness intact.
- Etihad fare-sale backfill consistent with the sweep contract
  (touched ≥ staleAfter passes) and the story's past-tense reframing;
  2.94 fils arithmetic re-verified.

## Open notes (section editors)

- fab-cashback: "refresh quarterly" is firmer than the sourced "usually
  quarterly or biannual".
- hsbc-live-plus: inherited "up to AED 1,500" vs parts summing 1,600 —
  faithful to the May record, flag for next re-verification.
- Etihad fare-sale line ~69 retains forward-looking "book before
  31 July" advice under a closed window — self-dating, but past tense
  would be cleaner at next touch.
