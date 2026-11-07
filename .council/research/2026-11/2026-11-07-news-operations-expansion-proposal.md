# News operations: bounded reliability tranche and expansion proposal

Last updated: 2026-11-07 (by ChatGPT)

Status: source implementation, 31 focused tests and bounded independent
re-review pass; real-runner preview and release pending. Proposed cadence/SLA changes below
are NOT ratified policy. No article, feed activation, monitor provisioning,
paid call, newsletter, account, new worker or publication is authorised here.

## Later owner ruling — no numerical news ceiling

On7November2026 the Chairman answered the proposed volume pilot:
"There should be no limit." The dated Charter amendment now removes the
prior2–3airline/1–2hotel weekly ceiling and rejects a replacement5/3pilot
cap. Quality, full-source reading, original UAE relevance and all existing
publication gates remain. No volume quota, automatic publication, paid
activation or additional account/worker permission follows from this ruling.

The earlier pilot proposal below is retained as decision history, not
current policy. The useful next step is uncapped, quality-led editorial
triage, with recorded dispositions and actual capacity/turnaround measures;
the suggested SLAs below remain proposals, not promises.

## Current state, not an absent automation claim

The free news monitor already polls seven feeds twice daily at 05:07 and
13:07 UTC: flydubai, Hilton and Hyatt primary newsrooms; Head for Points,
One Mile at a Time, Live From A Lounge and The Points Guy aggregators.
The root reviewer checked run 42283838379: seven successful reads and one
new lead. Separate paid press-room/programme monitors also exist. A small
digest does not prove a broken monitor or an empty news market.

The source-defined intake window remains the first 25 items per feed, in
existing order, with 300 seen URLs per feed. It is bounded discovery, not
whole-feed/history coverage. Canonical operational state belongs on
automation-state; the main-branch state file is a frozen migration seed.

Authority: CLAUDE.md, 27 July, 27 September and 1 October 2026 amendments;
`.council/02_workflow.md`; `.council/briefs/2026-10-14-newsletter-removed.md`.
Before the later7November ruling, the weekly ceiling was2–3airline and
1–2hotel stories; those historical limits are now superseded.
Secondary news facts may be used after full reading, with named inline
attribution, primary-first sourcing when readable, original wording and an
explicit statement of what the issuer has not confirmed. Cards, guides,
salary-transfer data and typed numerics retain their stronger standards.

## Implemented tranche — not yet released

- Distinguish healthy/no-new, degraded coverage, failed transport, invalid
  feed and empty feed; zero usable feeds exits non-zero after diagnostics.
- Bound decoded response bytes to 4 MiB, requests to 20 seconds, same-host
  redirects to three, article URLs to public HTTPS and titles to 500 characters.
  No article bodies are fetched. One bounded structure-aware scan rejects
  common malformed/HTML/truncated/entity-declaration bodies and ignores
  comment/CDATA markup as elements; the same scan supplies counts and
  metadata, without raw regex reparsing or a full RSS semantic/completeness claim.
- Remove only explicit tracking query keys for deduplication. Preserve
  unknown identity/query parameters and fragments. Accept legacy raw seen
  URLs without resetting history. One lead may retain multiple feed sources,
  tiers, reported links and reported dates; this is not corroboration.
- Emit latest-health.json and latest-triage.json as overwritten
  public-metadata-only snapshots. Every queue row is discovered-unread,
  verified=false, with a suggested desk, source/date/link and relevance reason.
  The queue is NOT a managed backlog and confers no editorial approval.
- Match supported global Hilton Honors, World of Hyatt, IHG and Accor
  programme-action titles without treating global property openings,
  corporate results or corporate awards as automatically relevant.
  UAE-resident/property eligibility remains unconfirmed. An incident-title
  tripwire passes over obvious prohibited leads; it is not a semantic safety
  classifier and does not replace editorial scope checks.
- Escape feed text/links for the human digest. Keep a rolling issue, alert
  on new leads or coverage change/recovery, and suppress repeated comments
  for an unchanged outage. Persist current diagnostics on failed live runs;
  retain seven-day Actions artifacts, gated by a fresh run-ID output marker.
  Canonical seen and prior health advance only when no digest delivery was
  required or its issue delivery succeeded; failed delivery retains the old
  canonical state for a subsequent human-alert retry. Fresh artifacts remain.
- Manual dispatch defaults to preview dry-run and checks out the selected
  feature ref. It does not restore/bootstrap state, write seen state or
  archived digests, post issues or publish. It labels its frozen-seed basis.
  Scheduled and explicitly live manual runs retain main checkout; only a
  preview may check out its dispatched feature ref.

Focused tests: `node --import tsx --test tests/news-monitor/*.test.ts`:
31 pass, zero fail/skip/cancel on 7 November 2026. Includes actual CLI
all-failure output/non-zero behaviour, preview non-mutation, stale-output
marker suppression, legacy deduplication, bounds and workflow guards.
Independent review's alert-loss, commented-item and synchronous-parser
holds were reproduced by failing-before regressions, then corrected.
Fresh-checkout CLI tests cover failed delivery followed by retry and
successful acknowledgement, both for new leads and coverage-only outages;
healthy/no-digest and acknowledged unchanged-outage saves remain covered.
The 350 KB CDATA markup-bait case now completes within its 3-second child
timeout (about 32 ms in the local focused run), not a whole-input performance SLA.
This is local focused verification, not Linux Actions/production acceptance.

Root independently read the complete scanner, pipeline, feed definitions,
CLI and workflow and reproduced all31 focused tests. The separate reviewer
re-ran the three original failure cases and additional malformed/deep/DTD
envelopes without an open blocker in that bounded scope. These source/test
passes do not certify real host availability or publication readiness.

## Accor: observed candidate rejected for this tranche

The free discovery probe (run 42364338274) found the official newsroom's
declared [Accor feed](https://press.accor.com/feed/). Discovery was not
activation. The root captured its full response once; independent local
hash and metadata parsing found:

- 10,917,586 bytes; SHA-256
  `fa017d829df0e7609ba5c341549f531a74a2a2cd6c9a25250e7f3aadb1c4cfcd`.
- 1,000 items, all linking to press.accor.com; all source dates parse.
  Newest observed: 5 November 2026; oldest: 23 July 2021. Item dates are
  not strictly descending throughout the full feed.
- Channel language says en-US, but the first twelve items visibly mix
  French and English, including translated pairs. A Latin-letter filter
  would not separate them. No item in the first 25 matches the current
  supported title-relevance rules.

It exceeds the 4 MiB cap by approximately 2.6 times. Leave INACTIVE:
no silent cap exception, guessed smaller URL or inferred English-only
endpoint. A later proposal needs an actually observed supported smaller
feed or an explicitly costed/approved bandwidth/window/language exception.
Other probe failures mean unreachable from that runner, not proven dead.

Evidence: root-owned captured response
`/private/tmp/dubaipoints-source-intake.j8vIv1/capture-06/01-27581c5c1d224013.response.bin`;
probe output `/private/tmp/dubaipoints-news-discovery-20261107/discovery-output.txt`.
No raw feed copy is added to the repository or new recurring storage.

## What the five competitor reviews support

These are editorial inferences from the root team's bounded 7 November
reviews, not measured conversion/traffic findings or exhaustive site audits.
LoyaltyLobby evidence is substantially indexed/historical; Head for Points
has selected current browser captures; other visual/interaction gaps remain
as recorded in each report. No competitor figure becomes DubaiPoints data.

| Comparator evidence | Useful delta | Do not duplicate/import |
|---|---|---|
| [Head for Points hotel promotions](https://www.headforpoints.com/best-uk-hotel-points-promotions/) | One monthly booking-oriented hotel brief, from checked existing records: register/book/stay windows, who qualifies, key exclusions and source | Existing hotel desk, expiry/CTA machinery, beginner tools; no newsletter |
| [LoyaltyLobby Hyatt hub](https://loyaltylobby.com/hotel-promotions/hyatt/) and programme recaps in its bounded report | Programme hub → current relevant actions → detailed conditions → official terms; distinguish stay bonus, points purchase, transfer and status offers | No global property firehose, invented UAE applicability, unapproved catalogue scrape or reader-case/first-hand claims |
| [TPG deal roundup](https://thepointsguy.com/deals/points-and-miles-travel-deals) and [monthly benefit checklist](https://thepointsguy.com/credit-cards/credit-cards-monthly-checklist) | Repeatable service publishing and useful cross-links to existing calculators/programme guides; a UAE benefit-use checklist only from verified fields | US fees/eligibility/valuations, another calculator, AI concierge or acquisition funnel |
| [Visit Dubai deals](https://booking.visitdubai.com/en/deals-and-offers) | A coherent local-value journey with exact party/residency/booking/use constraints | Not evidence for universal Access Club membership, a reusable feed/API or authority to add merchant-direct deals without schema review |
| [YallaCompare banking](https://www.yallacompare.com/uae/en/banking-investing/best-banks-in-the-uae/) | Better issuer coverage/identity verification and current source-backed terms | No complete active-card denominator was established; no evidence of superior breaking-news automation; no callback/lead-collection copy |

Private review sources are the five reports under
`/private/tmp/dubaipoints-competitor-{headforpoints,loyaltylobby,thepointsguy,visitdubai,yallacompare}/report.md`.

## Original expansion proposal — volume pilot superseded by the later ruling

1. **Accept reliable intake first.** Run the feature-ref preview, inspect
   actual per-feed outcomes, dates and rejection counts, then independently
   review/release through the existing T3/Council process. Do not raise
   publication volume merely because a feed returned more items.
2. **Measure a two-week baseline within the current ceiling.** Managing
   Editor records useful eligible leads, full-source reads, accepted briefs,
   articles published, discovery-to-triage time, factual corrections and
   expired-offer closures. Latest-run snapshots are not a permanent backlog;
   use the existing rolling issue/brief system for human dispositions.
   Baseline measurement is a proposed operating task, not an activated worker.
3. **Seek a four-week editorial pilot ceiling of up to five airline and
   three hotel stories per week.** This is a maximum, not a quota or
   throughput promise. Monthly hotel/service roundups count within the
   owning desk's ceiling; they are not an extra uncapped channel. Currency
   ownership governs cross-programme stories. No incidents, safety/security
   stories or associated disruptions. Do not amend the Charter until the
   Chairman explicitly rules on ceiling, owner/time capacity and pilot review.
4. **Pilot two repeatable formats, not two more tools.** A concise airline
   change brief (what changed/effective date/UAE consequence/source/next
   check) and one on-site monthly hotel action brief using approved records.
   Programme current-action panels and structured registration/book/stay
   windows are separate T3 integration/schema proposals, not part of this
   monitor implementation. No new newsletter/email/list channel.
5. **Expand source coverage only from confirmed evidence.** Review a
   candidate's whole bounded sample, language, dates, article domain, scope,
   ordering, bandwidth and terms before registry activation. Prefer free
   declared feeds; do not reactivate Accor or move/provision paid monitors
   without exact account-owner authority. A secondary source can supply a
   lead without justifying an automated article rewrite.

### Proposed service levels and stop rules

- Free polling stays twice daily. Detection can lag a publication by about
  twelve hours or longer when a host is unavailable; do not promise a
  breaking-news service from this schedule.
- Ordinary leads: human triage within one working day after discovery.
  An actionable deadline within 72 hours: aim for a four-working-hour
  triage decision after discovery, subject to owner capacity. Neither
  is a publication promise or a rule already in force.
- Triage dispositions: pursue (brief + owner), hold (missing source/
  eligibility), duplicate/link existing, out of UAE scope, incident-excluded,
  expired/no reader action, or reject (reason). Do not label unread as
  verified, or discovered as drafted/approved/published.
- Retain Fact-Checker, attribution, original UAE angle, source date and
  existing Chairman approval for every piece. No time SLA waives a gate.
- If coverage is incomplete, disclose it; if zero feeds are usable, fail
  visibly. If the proposed pilot generates rushed verification, correction
  load or an unmanaged queue, return to the existing cap pending review.
- Review pilot useful-lead yield, rejected/noise ratio, article turnaround,
  correction rate and upkeep time before increasing cadence again. No
  invented audience/traffic benefit or numeric success threshold is claimed.

## Release hand-off / open limits

Root owns independent source review, real Actions preview, whole-site QA,
release, vault/status/decision records and any publication authority.
No build, browser action, commit, push or dispatch was performed by this
implementation agent. No scheduled cadence, paid surface, canonical content,
frozen state seed or policy was changed by this tranche.

Remaining acceptance checks: actual seven-host outcome/redirect/MIME/body
behaviour under the new bounds; source-domain/language/relevance rejection
sampling; GitHub failed-step output handling and fresh-marker gating;
preview proof of no issue/state branch writes; live alert/save ladder on
an expressly authorised run. Unit tests do not establish those live facts.
