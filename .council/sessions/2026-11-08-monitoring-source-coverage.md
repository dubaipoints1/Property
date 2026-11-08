---
slug: monitoring-source-coverage
tier: T3
convened-by: technical-lead
topic: Reliable monitoring, complete card maintenance coverage and three unpublished reader-decision briefs
convened: 2026-11-08
participants: root, monitor_reliability, card_coverage, article_briefs
deliverable-shape: full-implementation
status: reviewed-pending-release
---

# Council session: monitoring reliability and source coverage

## Why convened

Mostafa directs: “Ok do it all. Fix the monitoring failures, check every card’s
source coverage and prepare the three article briefs. Test everything and get
Council sign-off before making it live.” SkyNet was freshly read in order:
index, README, status and decisions. The prior release is live; this is a new
implementation, not a remerge of superseded #518 or #510.

The owned clean checkout starts from main `5cf4125`, preserving #520's later
deal/news expiry corrections. The original shared checkout is untouched.

## Scope

- Make skipped/failed/unread monitor checks visible without equating polling
  with successful collection. Preserve usable partial-check evidence.
- Deliver salary-transfer alerts; retain alert-only financial-content fences.
- Do not acknowledge findings as handled before required delivery succeeds;
  make failed targeted-refresh dispatch visible and recoverable.
- Audit all current card slugs against explicit automated or manual-primary
  maintenance routes and known source/pin/ownership/currency limitations.
- Prepare salary-bonus, hotel-promotion and cash-versus-miles article briefs,
  original and practical, with one relevant existing interactive tool each.
- Run regression/full checks, substantive independent T3 review, genuine
  protected CI, normal merge/deployment and scoped production read-back.

## Out of scope

No credit purchase, paid scrape/research job, new paid monitor or expanded target
provisioning; no cadence/budget increase; no credentials/account/privacy change;
no changes to canonical financial values or verification dates; no automatic
article publication; no article MDX routes; no homepage/UI redesign. Existing
monitor and scrape mechanisms must not gain new spending authority as a side
effect of the repair. A source inventory or successful HTTP response is not
whole-card verification. A fresh free API read on 8 November now reports 987
credits, matching the supplied dashboard, rather than the prior deficit.
This balance change does not prove that a scheduled collection has recovered;
the latest actual check status and its coverage must establish that separately.

## Agent assignments

- `monitor_reliability`: monitor poller/routing and focused tests only; root
  owns workflow delivery/acknowledgement wiring. Technical author, not its own
  independent approver.
- `card_coverage`: deterministic all-card source/maintenance coverage checker,
  finite report and focused tests. No canonical card/source dates, bank URL
  target expansion or provisioning edits.
  Managing Editor assigns `business-realestate-editor` as maintenance owner for
  this inventory on 8 November. That assignment is not a record of fresh source
  reading. Review due uses the existing strict 90-day source-record age rule
  in `src/lib/verification.ts`, not a new whole-card validity or scrape cadence.
- `article_briefs`: three unpublished briefs with source requirements, SEO/UX
  structure and editorial gates. No external paid retrieval or new public copy.
- Root: workflow integration, tests/build/remote CI, independent code review,
  source and production verification, release and controlled SkyNet update.

## Synthesis owner

Root, acting as Managing Editor and Council convenor, writes one synthesis.
Cross-review must distinguish people from roles and authors from independent
reviewers. Research/Fact-Check/SEO/Standards/UX/Growth/Section scope is bounded to
maintenance/source/brief semantics and unchanged public output, not a fresh
whole-market investigation or physical-iPhone certificate.

## Decision questions and resolved scope

Implementation, all-card coverage, three briefs, testing and gated release are
expressly directed. The article briefs remain preparation, not permission to
publish the articles. Any paid recovery or expanded monitoring requires a
separate explicit budget decision. No unresolved brand or publication-policy
choice is inferred from this task.

## Evidence and review

Implementation and independent review are complete; see the single synthesis.
Source candidate `3bdfbedd` has genuine Linux validation: 1,084 tests, no
failures/skips. Real-API preview 42491187415 returned health warnings rather
than falsely green polling: four latest monitor checks are credit-skipped.
No queries failed and no history window saturated; issue/state/scrape side
effects were suppressed. Final-head checks and normal deployment remain
pending. Green advisory Council CI is not substantive sign-off; external
collection is not yet certified recovered.
