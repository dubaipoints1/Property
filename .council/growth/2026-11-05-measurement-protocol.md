# Measurement baseline and decision protocol

## Superseding verified operating state — 2026-11-09

The preparation-only GA4 descriptions below are historical, not the current
installation state. GA4 is already installed and receiving production data.
Read-only Chrome verified the existing **Dubaipoints** property, its UAE
GMT+04:00 reporting timezone and AED display currency. The User acquisition
report genuinely exposes **Total users**; Pages and screens defaults to
**Active users**. They are not interchangeable. Current private observations
and route totals remain outside this public repository.

The scoped sample is 5–8 November, not a calendar month; the installation
day may itself be partial. Do not extrapolate it into a monthly unique-user
count, reconstruct the days before tagging, sum daily/page user rows or add
new and returning users. Google automatically excludes **known** bots; this
does not certify that unknown automation, owner visits or browser-based QA
have been excluded. In particular, unusually long tool engagement is not
proof of reader satisfaction or confusion in this small mixed sample.
[Google user metric definitions](https://support.google.com/analytics/answer/12253918?hl=en)
and [known-bot exclusion](https://support.google.com/analytics/answer/9888366?hl=en),
read 2026-11-09. No filter/account/Enhanced Measurement setting was changed.

Cloudflare's full October period was reselected and visibly verified as
**1 October 00:00–31 October 23:59 GST**, with **Exclude bots = Yes**.
Its rounded visits/page views are a separate baseline, not GA4 users or an
exact count of human visitors. Its page-load summary is not LCP/INP and spans
earlier releases; do not attribute it to the current layout.

Search Console in the signed-in DubaiPoints account still shows
**Welcome / Add a website**. No accessible verified property, search-query,
click, impression or indexing report was obtained. This is missing access
or setup, not zero search traffic. No account switch, property creation,
ownership verification or DNS change was attempted. Ask the owner to
identify the property/account or approve a specific verification route.

### Query-privacy finding — decision still required

The live scheduler in `src/lib/deferredGoogleTag.mjs` retains the owner's
standard `gtag('config', id)`; it does **not** use the minimised parameters
in the separate, uninstalled `analyticsReview.ts` planner. The reader-state
code can put fictional or real salary/spend inputs in query parameters
(`salary`, `cv_spend`, `st_salary`), and the tracker/calculator can update
history. Google's documented default page location includes the URL query;
Enhanced Measurement may also send history page views independently of
`send_page_view: false`. Therefore there is a plausible financial-input
collection risk. This is a source/code inference, not a capture of a real
visitor's transmitted values or proof of a past disclosure.
[Google default page-view and history behaviour](https://developers.google.com/analytics/devguides/collection/ga4/views),
read 2026-11-09. Do not present the planner's safe-URL tests as proof of the
live standard tag's behaviour.

The owner previously directed leaving Google settings unchanged. This
operating pass does not reverse that instruction. No tag, Enhanced
Measurement, data-redaction, consent or history behaviour was changed.
Prepare an exact minimisation configuration and fictional-value network
test for explicit owner review before implementation; a partial URL override
must not be represented as controlling independent automatic events.

### Page-to-action working matrix

These are hypotheses from observed page interest and decision risk, not
observed search queries or conversions. Populate real queries only after
Search Console access is established.

| Reader task / observed surface | Evidence-supported next check | Missing evidence / permitted conclusion |
|---|---|---|
| Find and compare cards: Finder, Compare, product reviews | Test fee/eligibility visibility, preserved profile/spend basis, review-to-comparison journey | No application/approval/commission event verified; do not rename navigation as a conversion |
| Salary-transfer eligibility and payout: tracker and offer pages | Check prominent exclusions, payout sequence and calculator clear state | A page view does not establish an actual switch, qualified salary or payout |
| Lounge access: guide and benefit hub | Confirm current qualifying spend, visits, guests and issuer-source freshness | Search intent and failed tasks remain unobserved; no unsupported title rewrite |
| Read current news and deals | Distinguish publication from guide-update dates and archive discovery; test the new news edition | Current short sample precedes/spans releases; no claim that PR525 increased readership |

### Comparable windows and remaining decisions

- Compare complete November with October in Cloudflare after month-end using
  the same site, GST scope and bot filter; retain rounded/sampling limits.
- GA4's November coverage begins with installation, so label it partial.
  The first whole calendar month after installation is December; review it
  after processing in January. A complete later rolling window may be used
  if explicitly labelled, but never relabelled a full calendar month.
- Verify hostname/internal/developer traffic and query privacy before treating
  GA4 as a clean audience baseline. Review proposed changes separately;
  the owner previously declined changing Enhanced Measurement.
- Complete neutral reader/device tasks and actual Search Console access.
  Do not activate event tags, affiliate conversion tracking, recruitment,
  analytics tasks or newsletters as a side effect of this read-only report.

State: existing measurement verified and actionable baseline prepared; no
exact bot-free monthly people count, completed search-intent analysis or
revenue attribution is claimed. The historical preparation record follows.

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
