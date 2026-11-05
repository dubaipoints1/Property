# Measurement baseline and decision protocol

State: existing Cloudflare access verified read-only on 2026-11-05. GA4 is
prepared for review only. No tag, property, event collector, automation or
commercial tracking was activated. This document contains no private
traffic totals; the detailed owner report stays outside the public repo.

## Access and period

The existing authorised Safari session opened the DubaiPoints Cloudflare
Web Analytics dashboard. No token value or password was retrieved. The
dashboard's **Exclude bots = Yes** filter was visibly retained for both
global and UAE views. This reports the available bot-filtered measurement,
not a certification that every unidentified bot has been removed.

The baseline is the complete calendar month 2026-10-01 00:00 through
2026-10-31 23:59 GST (Asia/Dubai), not a partial current-month comparison.
Dashboard values were rounded; no exact unsampled export was obtained.
Country and device rows are separate scoped views, not independent people.

Search Console opened at its welcome/add-property screen under a different
Google account. The owner was asked to switch that tab to the account
which owns DubaiPoints. No account switch, property creation, ownership
verification, DNS write or query/CTR/indexing retrieval was performed.
Search Console remains pending until that access is actually observed.

## Keep these measures separate

| Measure | Meaning and permitted use | Do not claim |
|---|---|---|
| Cloudflare visits | Available dashboard visit metric, labelled with period, country scope and bot filter | Exact monthly people or interchangeable GA4 sessions/users |
| Cloudflare page views | Repeated viewed pages; helps identify heavily read routes and device mix | Unique visitors, individual intent or task completion |
| Search Console clicks / impressions / CTR / position | Search performance for an actually accessible verified property and selected search scope | All traffic, user satisfaction or a technical cause from a ranking alone |
| Future GA4 Total users | Proposed consented production browser/device-based estimate for one whole calendar month in Asia/Dubai | Active users, all visitors, unique natural persons, or the sum of daily/page user rows |
| Future outbound clicks | Only a separately approved fixed event and allowlisted placement definition | Submitted applications, bank approvals, commission or received income |
| Partner outcomes / settlement | Contract-specific reconciled statuses and accounting evidence | Revenue inferred from site clicks or pending applications |

Cloudflare documents visits and page views as separate high-level metrics.
Use the original names rather than renaming either as monthly unique
people. [Cloudflare definitions](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/).
Search Console's performance report can break out queries and pages, but
this sprint has not read the owner's property.
[Google performance report](https://support.google.com/webmasters/answer/10268906).

## What the current baseline can inform

Prioritise the salary-transfer and card-selection journeys, the frequently
read product reviews and benefits guides. Check prominent eligibility,
fees, qualification and payout conditions before adding more decorative
content. Follow the observed UAE mobile share with real iPhone task tests,
not a desktop-only judgement. Specific private route counts are in the
owner report, not this public document.

These are prioritisation inferences from page popularity and task risk.
They do not prove a page is good, that a low-view article is poor, that a
reader applied, or that the latest design increased traffic. Search-query
intent, real usability observations and partner outcomes remain missing.
The 24-hour performance sample spans different release states; no layout
causation or traffic uplift is attributed to PR #515.

## Review cadence — planned, not scheduled

- 2026-11-12: manual seven-day observation of affected pages and owner
  iPhone findings. Label it a partial-window check, not monthly growth.
- 2026-12-05: compare complete November and October views with identical
  timezone, country and bot filters. Separate source corrections, new
  articles, seasonality and sampling from any UX hypothesis.
- If Search Console access becomes available, record property, date range,
  search type and filters before mapping queries to pages. Separate missing
  data from zero. Look for high-impression/low-CTR pages, wrong-intent
  landing pages and indexing exclusions; do not change titles or claim an
  SEO defect from a metric without inspecting the page and search result.
- Read the first five actual usability sessions qualitatively; record
  unassisted/helped/incomplete results without turning five people into a
  site-wide success rate. No sessions were run by writing the test pack.

No recurring worker, publishing job, reminder or recruitment was started.

## GA4 review boundary

The separate [GA4 proposal](2026-11-05-ga4-review.md) and local-only
`/dev/analytics-consent-review/` demonstrate data minimisation and simulated
choices, not an installed consent controller. The demonstration is pruned
from production. No monthly unique-user number can be reconstructed for
past months from an uninstalled tag. Owner approval of account/property,
privacy/data flows, retention, bot limitations, traffic filters and a real
network/storage-tested implementation remains necessary before activation.

## Cost and record

Existing signed-in dashboard and free official-source browsing only; no
paid crawl, media generation or analytics subscription was initiated.
Private totals are neither committed nor attached to the PR. The release
handoff records tests and any newly observed access state separately.
