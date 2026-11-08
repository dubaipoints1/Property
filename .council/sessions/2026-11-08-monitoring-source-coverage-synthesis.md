# Council session synthesis: monitoring and card-source maintenance

## What each agent recommended

- `monitor_reliability` implemented health/read/partial-result handling and
  pending-only state. Its 54 focused mock-API tests pass. Root independently
  reviewed the production reader and regressions, requiring already-seen
  partial failures to remain visible and bank hand-offs to match acknowledged
  checks, not merely emitted findings. Both corrections are applied.
- Root implemented the workflow delivery transaction and 18 regressions.
  `article_briefs` independently found a real `.urls.json` bank-name defect;
  it was fixed, fixtures now use production files, and the second review passes
  all 14 bank slugs plus 26 delivery/digest tests. Preview state reads were
  exercised against isolated repositories: no bootstrap, push or changed HEAD.
- `card_coverage` audited all 75 profiles: 58 configured scraper routes,
  17 manual-primary routes, 32 missing dedicated document routes, one HSBC
  product-URL inventory difference, and 75 profiles retaining at least one
  needs-review field. No source record exceeds the existing 90-day threshold
  on 8 November. Root and `monitor_reliability` independently reproduced the
  report and reviewed the guard; 10 new / 14 combined coverage tests pass.
- `article_briefs` prepared three original, unpublished salary-switch,
  matched-hotel-rate and real-flight-quotation commissions. Root reviewed all
  three; `card_coverage` cross-reviewed editorial/SEO/UX/Growth/section mandates,
  requiring correct hotel-guide ownership and the airline desk's format and
  section countersign. Corrections are applied and the independent brief-only
  review passes; the future draft countersign remains pending.

## Trade-offs explicit

An alert can repeat after a failed delivery/dispatch/save; losing a financial
change is worse. An incomplete check enumeration or detail cannot initiate
an unacknowledged paid hand-off. History is bounded to 100 checks per query:
saturation is an explicit recovery gap, not invented pagination or a false
exhaustive claim. Neither a historical successful check nor today's 987-credit
balance proves current collection. A fresh read-only workflow preview remains
part of the release check; it must not create issues, save state or run scrapes.

The inventory validates configuration and recorded evidence identity offline,
not current reachability, field correctness or whole-card acceptance. No source
dates or pending holds were advanced. Dedicated document routes and the HSBC
URL need editorial reconciliation before any separately authorised target
change. No site UI, financial model, public content, tracker or dependency was
changed. No paid provider was executed. Alexandria demand/price capabilities
were inspected for future research only; no new service or cadence was enabled.

## Substantive T3 review record

Four collaborating agents are not ten independent people. Roles below describe
the actual bounded reviews, with implementation authors separated from their
cross-reviewer. These are approvals of this maintenance/brief-preparation
release, not approvals of three future articles or current issuer facts.

| Role | Actual review and limit |
|---|---|
| Head of Research | Root: issuer/source hierarchy, provenance and offline evidence limits; fresh source acquisition remains pending for articles. |
| SEO Strategist | `card_coverage`: provisional brief metadata, relevant existing internal targets, no indexed/public route additions. |
| Fact-Checker | Root: deterministic counts/pins, no financial/source-date changes, pending fields retained, no invented quotations or source readings. |
| Standards Editor | `card_coverage`: dry evidence-led briefs, scoped claims and explicit assumptions; no live copy approved by these briefs. |
| Head of UX | `card_coverage`: reader-decision flow and reuse of existing interactions, mobile/no-JavaScript acceptance plans; no physical-device certification. |
| Technical Lead | Root reviews poller/coverage; `article_briefs` independently reviews delivery/workflow; `monitor_reliability` independently reviews coverage. Exact-head Linux CI remains mandatory. |
| Growth-Analytics-Lead | `card_coverage`: existing bot-filtered T+30/T+90 evaluation only; no new tracking, paid research or traffic/uplift claim. |
| Relevant Section Editors | Root and `card_coverage`: card-maintenance ownership and salary/hotel/airline commission boundaries; future article checks remain pending. |
| Managing Editor | Root: one source-coverage owner, three distinct commissions, no automatic article publication or expanded paid scope. |
| Chairman | Mostafa's direction approves this scoped release only after tests and Council; no bypass or future article approval. |

## Verification and release state

Local check/build pass: zero errors/warnings, seven existing hints; 337 pages
indexed and 23,690 internal links resolved. Research/API-key guard passes.
The complete local suite has 1,083 passes and one inherited macOS Bash 3
empty-array failure after updating the existing hand-off shape test. It is not waived: the
unmodified automation-state integration must genuinely pass on Linux CI.
Source candidate `3bdfbedd` subsequently passed genuine Linux run42491211753:
all1,084 tests, zero failures/skips; source guard, check and build executed.
Real-API preview42491187415 read existing state and all configured histories,
then correctly returned unhealthy: four latest checks remain credit-skipped,
with21 diagnostic entries including historical failures. No list/detail
request failed and no100-check window saturated. The preview delivered no
issues, saved no state and dispatched no scrape; its helper and diagnostic
retention steps succeeded. This validates observability, NOT fresh collection
or recovery. Final-head checks, normal merge and production deployment remain
release gates. No source content/dates or provider state were changed.

## Decision questions for the user

None block this expressly directed maintenance release. Paid quote retrieval,
additional monitor targets, history recovery requiring new collection and the
three article publications are not authorised by preparation; return with
specific evidence, costs and approval requests if those steps are proposed.
