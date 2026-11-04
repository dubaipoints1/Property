# DubaiPoints decision-tools upgrade

**Objective:** make DubaiPoints the place to compare what a UAE reader can actually receive, under which conditions, and against which issuer source. Keep the current homepage and responsive templates. Treat the live audit as a sample, not assurance over every offer or claim.

## 1. Correctness and trust

- Separate ranking from eligibility. Distinguish an estimate matching the inputs, an estimate with warnings, conditions that still need confirmation, and a mismatch. Never award an unverified conditional amount or imply bank approval.
- Use the same source-bound campaign identifiers and account-only split in the tracker and calculator. Cover the live examples: Emirates Islamic account and card components, DIB card or qualifying finance, Emirates NBD card requirement, FAB savings or spend, HSBC Premier transactions and Mashreq conditional uplift. When the tool lacks the needed input, show the bank conditions rather than infer eligibility or reward.
- Remove the unsupported blanket WPS minimum. Align published valuation copy with the valuation registry, leave unidentified points unpriced, and separate published cost basis from illustrative redemption value.
- Validate issuer sources and programme examples before wider editorial changes. Add tests for salary-band edges, missing/changed sources, unavailable components, conditional products and ranked output. Review every live campaign when terms change; uncertain cases are unranked until modelled.

## 2. Make tools easier to use

- Put salary and reward preference before advanced filters in Card Finder. Keep shareable filter URLs, accessible controls, reset, and side-by-side comparison.
- Pilot direct issuer-source links and dated card records beside the key claims in the lounge guide. Extend this pattern to other decision guides only where the exact source supports the claim; link the specific issuer terms where available.
- Next iteration: model verified card/spend periods and finance criteria as typed inputs with explicit source provenance. Add positive and negative browser cases. Do not model lender approval, nationality, employer status, net fees, or overlapping bank promos without data and validation.

## 3. Search and measurement

- Establish the baseline in the owner's Search Console: indexed vs submitted URLs, UAE queries and landing pages, clicks and impressions, mobile field data where available. Use existing canonical and sitemap coverage; do not infer indexation from the sitemap.
- Improve query-to-page fit and internal links on the highest-value pages first. Review programme structured data and dated editorial claims against the applicable Google and issuer documentation. Do not promise rich results.
- Measure whether readers progress from guide to Finder/Tracker and then Compare or issuer terms. Begin with existing read-only data; retain bot-exclusion policy. Do not add event tracking, collect salary values, or connect accounts without separate permission.

## Release gates

Node 22 checks, production build, focused unit tests, 320/390/721/1440px and keyboard interaction checks. Verify original audit scenarios and shared Finder links in a browser, plus ranked output and issuer link destinations. Prepare a scoped PR for Council review; no merge or deploy without separate release direction. After any release, repeat the scenarios on Cloudflare production and record the exact release commit and checks.

## Local handoff

The first correctness release, mobile Finder changes, and lounge-guide source pilot are implemented on `codex/decision-tools-upgrade` from production baseline `1d6cd3c`. Astro check and the production build passed; 20,125 internal links resolved. All 64 targeted tests passed. Chromium checked 313 built routes at seven widths and passed the calculator, Finder, source links, and existing tracker interactions. The full local suite passed 578 of 579, with the known automation-state failure under macOS Bash 3.2. No account settings or production changes.
