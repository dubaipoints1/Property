# CBD scrape notes

- Rollout order #6 per the scrape-accuracy brief: modest range, clean
  website.
- CBD One is a subscription-plan card ("One Plan"): the annual fee is
  Free and there is no per-category earn engine in L2 (earnRates is
  empty by design).
- VERIFIED BEHAVIOUR (fixture-locked, 2 July 2026): the KFS's dense
  fee table trips the C6 multi-tier heuristic, so annualFee and fxFee
  short-circuit to needs-editor-confirmation instead of guessing —
  expect every weekly run to surface "Multi-tier SOF page" warnings
  with the raw rows under _scraped_freetext. That refusal is the
  contract, not a fetch failure. FX (3.5%) and min salary are the
  volatile fields worth eyeballing in each proposed diff.
- KFS PDF verified current at 17 December 2025 edition (2 July 2026
  fact-check sweep).
