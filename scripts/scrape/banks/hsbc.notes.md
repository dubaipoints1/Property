# HSBC scrape notes

- Rollout order #4 per the scrape-accuracy brief.
- The /credit-cards/products/live-plus/ page is JS-heavy and scrapes
  unreliably; the /credit-cards/compare/live-plus-credit-card page
  renders the same pricing, earn table and eligibility statically
  (verified in the 2 July 2026 fact-check sweep) — use it as the
  product source.
- "kfs" points at the charges explainer page (carries the 2% FX line).
  The true Schedule of Services & Tariffs PDF is 1.8MB and covers all
  retail products; onboard it later if the explainer page drifts.
- Eligibility nuance: AED 5,000 min salary applies only at
  HSBC-approved employers, AED 12,500 otherwise. L2 carries 5,000
  editor-confirmed with the split documented in L3 — the scraper's
  parseMinSalary will see both numbers; do not auto-overwrite.
