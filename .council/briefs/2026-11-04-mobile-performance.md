---
slug: mobile-performance
tier: T3
vertical: cross-section
chairman-status: approved
chairman-direction: '"Yes." — in-session approval of mobile image, logo and font optimisation following the Editorial Utility release, 4 November 2026.'
---

# Lighter first loads for Editorial Utility

Reader question: can I reach the same information on a slower mobile connection without downloading an oversized photo, logo or font?

Baseline: the protected production merge of PR #511. Compare mobile runs at the same Chrome preset, compression and local serving conditions. The 200 KB initial-transfer target is a lab proxy, not a claim about production visitors or field performance.

- Supply right-sized build derivatives of the same approved pictures and marks. Keep original files, manifest entries, source/issuer attribution and fallback. Do not crop brands or use generated substitutions.
- Keep Newsreader and Geist. Deliver the lighter installed Newsreader files with their original language coverage and OFL licences. Reuse the UI font for the short Finder result descriptions and offer summaries. Start default mobile filters closed in the markup to avoid shifting the result list; keep desktop, shared filters and the no-JavaScript disclosure usable. No ranking or financial data changes.
- Preserve published URLs, structured data, editorial layouts, the homepage hero and interactive behaviour. No new provider, scraping, advertising, analytics or Cloudflare configuration.

Verification: compare matched mobile weights and performance; inspect photos and marks at phone and desktop sizes, including high-density screens; test the Finder defaults and shared link. Build and check all internal links, asset requests and reflow. Require actual Council, Linux PR and preview checks before protected merge, then verify Cloudflare production and representative live pages.
