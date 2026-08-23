# Liv — scraper notes

- Liv is Emirates NBD's digital brand; both cards share one product page
  (`liv.me/en/liv-credit-card`) and one fees page (`liv.me/en/charges`).
- The earn model is **tier-by-total-monthly-spend**, not per-category —
  the normaliser's category regexes will find nothing and default the
  base rate; that is expected. The tier ladders live in the feature T&C
  (`/en/important-information/features/liv-credit-card-feature`) and are
  editor-typed in L2 freetext. Treat any scraped earn-rate change as a
  prompt to re-read that page, not as a value to merge.
- The charges page carries both cards in one table (annual fee, FX,
  interest); the fee parser may attribute the first column to both
  slugs. Annual fee and fxFee are editor-confirmed in L2 — the merge
  guard preserves them.
- No published salary minimum — `_provenance.eligibility` is
  `needs-review` deliberately. Do not let a scrape "confirm" a minimum
  that no Liv document states.
- KFS PDFs on liv.me are served directly (no viewer); the Contentful
  trick needed for Wio does not apply here.
