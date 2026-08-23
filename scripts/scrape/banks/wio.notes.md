# Wio — scraper notes

- Wio's `/file/*.pdf` routes serve a **JS viewer**, not the PDF — a
  direct fetch parses nothing. The real assets live on Contentful
  (`assets.ctfassets.net/l65m9bcr2nac/...`); the KFS URL in
  `wio.urls.json` is the resolved asset for KFS v5 (August 2026).
  **When Wio publishes a new KFS version this asset URL goes stale**:
  fetch the viewer page's rawHtml and grep for the new
  `assets.ctfassets.net` URL (how v5 was found on 2026-08-22), then
  update `wio.urls.json`. The canonical human-facing links are
  `wio.io/file/wio-personal-credit-KFS-version-<n>(...).pdf` and
  `wio.io/personal-fees.pdf` (Schedule of Fees Retail).
- One credit product ("Wio Credit", Mastercard World), no annual card
  fee — pricing is the plan subscription, which the annual-fee parser
  cannot see. `annualFee` is editor-confirmed at 0; do not merge a
  scraped fee.
- Cashback is plan-gated (none on Standard) and the flat 2% is not a
  category rate — expect the earn-rate parser to default the base and
  warn; the L2 figures are editor-typed from the KFS.
- No published salary minimum for credit; `_provenance.eligibility` is
  `needs-review` deliberately (the Salary *plan* needs AED 15,000 —
  that is a plan condition, not card eligibility).
