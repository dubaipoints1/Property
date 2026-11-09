# Production speed versus the uncompressed local proxy

Observed 2026-11-09 through the public PageSpeed Insights UI in Chrome.
These are **single production lab runs**, not field-user data, a multi-run
production median or certification of this unmerged candidate. Every report
said **No Data** for real-user experience. Device profile: emulated Moto G
Power, Slow 4G, Lighthouse 13.6.0 / HeadlessChromium 157.

| Live route | Report time GST | Performance | LCP | TBT | CLS | Accessibility | Report |
|---|---|---:|---|---|---|---:|---|
| Homepage | 17:40 | 97 | 2.1s | 60ms | 0 | 100 | [production lab](https://pagespeed.web.dev/analysis/https-dubaipoints-ae/0ivlz4isif?form_factor=mobile) |
| Card Finder | 17:36 | 98 | 1.4s | 40ms | 0 | 97 | [production lab](https://pagespeed.web.dev/analysis/https-dubaipoints-ae-cards-finder/mueh9te0x4?form_factor=mobile) |
| Salary Tracker | 17:40 | 100 | 1.2s | 10ms | 0 | 100 | [production lab](https://pagespeed.web.dev/analysis/https-dubaipoints-ae-salary-transfer/golray3zb5?form_factor=mobile) |
| Skywards | 17:40 | 99 | 2.1s | 0ms | 0 | 100 | [production lab](https://pagespeed.web.dev/analysis/https-dubaipoints-ae-airlines-skywards/u96x714rx0?form_factor=mobile) |

Best Practices and SEO scored100 in all four. Those automated labels do not
prove complete security, accessibility, factual accuracy or search rankings.
The current live release remains PR525/main4cd884a; the candidate is not
credited with these results. No paid service/API, site setting or new event
was used to produce these public-URL reports.

## Why the earlier local results are not a live diagnosis

The existing harness ran three samples per route using Lighthouse13.4.1
against an **uncompressed local http-server** and selected the run with the
median performance score (not an independent median for every metric).
It reported home94, Finder59, tracker81 and Skywards90, with eight breaches
of its95/200KB local budgets. The initial-transfer proxy includes requests
finishing before reportedLCP; it is not strict above-viewport payload or
compressed CDN transfer. Those failures remain recorded, not silently
changed into passes.

The same pre-change4cd Finder under the local settings also scored59
(selectedLCP7806ms /1321.3KB), compared with candidate59
(selectedLCP7579ms /1321.7KB). This does not show a material regression or
improvement from the small tap/data changes. Repeated hidden-card markup is
large when decoded, but production's98/1.4s result is stronger evidence for
the public loading path than the uncompressed59 alone. Do not call all live
pages slow, promise a speed uplift or waive a budget by conflating the two.

## Narrow actionable findings and decisions

Live Finder's contrast failure names the pending source-record text:
`.dp-finder-summary-card > footer > .dp-card-verified > .lbl`.
The candidate changes only that text's decorative`--gold` to the existing
readable trust-text`--gold-ink`; wording, dates, status and decorative dot
remain unchanged. Source/Standards peer review passed; actual final rendered
contrast and regression checks are separate release evidence.

Finder's live render-blocking list totals55.7KiB compressed across the
displayed stylesheet/script rows; the largest listed utility CSS is26.3KiB.
The report estimates840ms render-blocking savings and19KiB unused CSS.
These are model estimates, not an observed saving. Shared CSS splitting
needs source-exact scope and visual regression evidence, not blind pruning.

The proposed asynchronous Finder catalogue rewrite is **not implemented**.
It would add loading/failure/selection complexity to a path that currently
passes the production score floor; reconsider only with a demonstrated
reader/performance benefit and a separate reviewed prototype. No fragments,
new assets, fetches or dependency were added by that proposal.

A separate Tracker candidate avoids rendering two closed detail bodies
until their existing controlled panel opens. It is reviewed as reduced
initial markup, not as a cure for a demonstrated live speed failure or a
guaranteed production speed improvement. Preserve original query restoration,
IDs/focus, open/close and no-JS offer links. Final combined-head CI, runtime,
owner light/dark preview and actual hosting checks remain required.
