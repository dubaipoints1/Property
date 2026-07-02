# Standard Chartered scrape notes

- Rollout order #9 per the scrape-accuracy brief: product pages are
  JS-heavy and the flakiest of the set — expect intermittent empty
  fetches; the price-guide PDF is the reliable source.
- The price guide is versioned in the URL (…-v3.pdf); when SC bumps the
  version the old URL may 404 rather than redirect. A run where the KFS
  fetch fails outright is the signal to hunt the new version, not a
  parser problem.
