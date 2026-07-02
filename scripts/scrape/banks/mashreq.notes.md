# Mashreq scrape notes

- Rollout order #3 per the scrape-accuracy brief: cleanest second-tier
  product pages; "Welcome offer" sub-heads anchor the regex reliably.
- The KFS is a single consolidated PDF (.ashx) covering all Mashreq
  cards — same multi-card-document pattern as FAB. Fee rows are per-card
  ("Cashback | Free for life"); the normaliser's fee parser must match
  the card row, not the first fee in the document.
- KNOWN LAG: the KFS updates slower than campaign notices. The 13 June
  2026 fuel-rate cut (0.33% -> 0.15%) appeared in a published notice
  weeks before any KFS refresh. Fields already editor-corrected from a
  notice must not be "refreshed" backwards by a stale KFS — the merge
  contract's editor-confirmed guard handles this, but flag any proposed
  DOWNGRADE-to-older-value in PR review.
