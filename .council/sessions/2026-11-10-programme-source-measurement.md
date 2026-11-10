# Council session — programme, source and measurement follow-on

Date: 2026-11-10. State: reviewed preview; final release gates due, not live.
Owner directed the scope and conditional release after tests and Council.
The current base mainc8e309c contains the concurrently merged PR530; its
actual gate chronology is retained separately, not rewritten as compliant.

## Changes actually implemented

- Ten existing programme routes: source-reference joins to published news,
  guides and non-expired programme offers; contextual guide/card/transfer/
  calculator actions; one visible report and a native closed more-coverage
  disclosure to avoid another mobile wall. No new library, imagery, financial
  assertions or public article. Two existing Hyatt reports gain only an
  explicit programme relationship, retaining all prose, dates and figures.
- Deterministic timestamp/UTC-day news expiry with exact-boundary negatives;
  original publication and guide-update dates kept separate; future/expired,
  unrelated and duplicate entries excluded; honest empty states.
- HSBC Live+ age only: two deterministic exact-product facts from a complete
  fresh public HTML capture, independently rehashed/re-extracted/reparsed.
  Other74cards, all financial fields and source/scrape dates preserved;
  salary, rates, reward and variant holds remain. No inference from absence.
- Missing-label rolling-alert identity repaired without external label/state
  changes. Independent review found and corrected embedded-marker selection
  and root's initial jq quoting regression; positive and negative tests now
  pass. Credit-skipped collection is still not called recovered.
- Offline measurement readiness report only. Owner again selected tracking
  unchanged; no tag/event/filter/redaction/consent/account/property/DNS change.
  Query privacy, QA exclusion, Search Console access and human-user counting
  limits remain explicit; no private traffic totals enter the repository.

## Actual author/reviewer separation

These are named AI delegates applying lenses, not invented human editors.

| Scope | Author | Independent review |
|---|---|---|
| Hubs/helper/audit, later scroll margin | root | release10_exact_head_review: SEO, Standards, Travel, Managing and scoped UX/Technical; final performance gate retained |
| HSBC age parser/candidate | card10_source_repair | monitor10_repair: complete authentic source, Fact-Check, Section, Technical/preservation |
| Rolling-alert implementation | monitor10_repair; two root corrections | card10_source_repair: actual selector/GH shape, positive/negative tests, Technical/Standards/Managing |
| Readiness tool | release10_exact_head_review | card10_source_repair and root: no settings/telemetry, bounded recognition, Growth/Standards/Technical |
| Integration/release records | root | distinct delegates' reports; final release approval-record review still required |

Independent reports in `.council/research/2026-11/`:
`2026-11-10-programme-hub-independent-review.md`,
`2026-11-10-card-source-independent-review.md`,
`2026-11-10-operations-cross-review.md`.

## Executed local evidence

- Full suite:1,213pass,0fail/skip. Focused source and operations negatives
  separately executed; no failed intermediate result is waived.
- Check:0errors/0warnings,7existinghints. Build/Pagefind338indexedpages,
  23,769 internal links at the later build (exact final log remains source).
- Offline75-card source-route guard:58configured+17manual,0structural errors/
  document-route gaps; not75fullyverifiedcards. Stale-offer sweep193files clean.
- New hub audit:10routes,160resize/theme states with no reported document
  overflow;20expanded390px scoped axe states report0violations with contrast
  incomplete items retained. Native more-coverage and guide actions work
  without JavaScript. Closed mobile heights:755pxSkywards/538pxHyatt.
- Existing programme flow:140resize/theme states, one contents, target
  resolution, original reference ordering, short-screen focused last link,
  native/noJS and calculator actions pass after a programme-only scroll margin.
- Homepage/layout/analytics/global palette sources have no diff. Owner saw
  light/dark hub previews in this conversation. No physical-iPhone result,
  whole-site WCAG certificate or traffic/revenue uplift is asserted.

## Performance gate remains open

Uncompressed local lab sample: candidateSkywards88/Hyatt90; actual-main
baseline90/90, both beyond the local200KB above-fold budget. The baseline
ran alongside a browser regression and cannot establish a causal2-point
change. These failures are retained, not a release pass. No production
performance gain is claimed. Obtain clean comparable and/or actual hosting
preview mobile evidence, investigate regressions and complete Technical
approval before protected merge. Branch preview is not production.

### Later clean and hosted measurements — 16:51 UTC checkpoint

The clean actual-main local baseline repeats90/90 across three runs per
route, uncompressed and above the byte budget. Actual Cloudflare branch
preview95af517a gives Skywards90/92/91 (median91, medianLCP2706ms,
187.7KBabove-fold) and Hyatt95/88/88 (median88, medianLCP3149ms,
194.3KBabove-fold). CLS0; accessibility/best-practices100. These are
retained failures, not a95+ clearance or field-speed measurement. Preview
SEO69 is not yet diagnosed and is not asserted to be a production defect.

Read-only Technical diagnosis finds both existing hero images already
eager/high-priority/discoverable. Seven stylesheets block rendering; the
largest full-site bundle is124,993raw/26,288transferredbytes. Estimated
600–750ms render-blocking savings are an optimisation hypothesis, not a
verified gain. A disposable exact-CSS delivery comparison is underway;
production source, release approval and merge remain held meanwhile.

### Exact-style hosted experiment candidate — later checkpoint

Added a ten-route-only postbuild delivery helper for a hosted comparison.
It reuses the existing fail-closed exact-CSS validator, substitutes each
complete stylesheet at its own original cascade position and retains all
rules, asset URLs, fonts, body markup and executable scripts. No asynchronous
style loader or new dependency. All ten route/asset identities, symlinks,
UTF-8 and drift checks complete before writes; input failure fails build.
The existing homepage transform's API/output remain unchanged. Root tightened
literal identity checks after independent review: comment/script examples
and duplicate canonicals cannot stand in for the actual route identity.

The disposable compressed A/B records99median for both routes in both
variants, with simulatedLCP2104/2103→1951ms, not a field-speed promise.
Inlining adds roughly31KBcompressedHTML and loses shared stylesheet caching;
the modest cold-visit benefit alone does not clear the hosted HOLD.
The older local Hyatt HTML lacked the two late explicit news relationships,
whereas the identified hosted preview includes them. Thus that A/B describes
its exact older local content only, not final-content visual equality.

A fresh final-content build now includes those relationships. Check passes
0errors/0warnings/7hints; full suite1,221pass/0fail/skip. The first full-suite
attempt lacked local-server permission and failed29EPERM tests; it was not
waived, and the permitted complete rerun passed. Build/Pagefind338pages;
23,695internal links resolve,70fewer than priorCI because seven stylesheet
links on each of ten routes become inline styles, not lost reader links.
New45test focused delivery/home/CSP suite passes; independent source review
is recorded separately, with final identity-hardening read-back still due.

Fresh programme-hub audit again passes160resize/theme states and20scoped
expanded axe states (contrast incompletes retained); existing programme-flow
audit passes140states. Current mobile closed heights755pxSkywards/538pxHyatt.
New Hyatt light-mobile/dark-desktop screenshots show genuine published
coverage and were supplied to the owner. Actual compiled homepage index is
byte-identical to its pre-style-change baseline. Exact hosted-variant
performance, independent final review and release approval remain pending.

Subsequent independent identity read-back bycard10_source_repair passes
all45focusedtests after the five new comment/script/duplicate negatives.
Final full suite again passes1,221/0fail/skip; rebuilt338indexedpages and
23,695internal links pass. Homepage actual byte comparison still passes.
This clears source/code review, not the hosted speed or Chairman gates.

## External and publication holds

Actual10November monitoring supersedes the morning no-run snapshot: today
RSS7/7feeds with3unreadmetadata leads delivered; latest due offers and press
rooms completed, salary-transfer/weeklypress still credit-skipped. No paid
provider call, forced check, target/cadence change or collection activation.
No automatic scrapePR533merge. Source conflicts remain field-level holds.

Cloudflare is currently signed out in Chrome and Safari; owner was asked to
sign in for production/alias verification. Canonical Skywards desktop menu
opens/dismisses, no measured document overflow, footer targets44/46px; this
is not exact-hosting SHA verification or physical Safari. Tracking settings
remain unchanged by owner choice. Search Console property/access uncertain;
no verification or new permission inferred. Project-record retry permission
was requested; no new Drive write yet. All private article contributor/COI/
copy gates, incident/Syria exclusions and no-outreach remain.

### Later external-state verification — 16:51 UTC checkpoint

The signed-out observation above is superseded after Mostafa confirmed
sign-in. Authenticated Chrome independently verifies Cloudflare Production /
main / c8e309c1e5069da689b637b69125476dfd291c0e / success, deployment
cf96cb99-08c6-4391-aea6-326b822034ae, displayed20:04Dubai10November with
both dubaipoints.ae and www.dubaipoints.ae aliases. This verifies the earlier
PR530 deployment only; PR534's new hubs are preview-only, not live.

Mostafa also explicitly authorised one fresh verified attempt to update
DubaiPoints' status/decision records, preserving Claude QA and history.
Complete raw index/README/status/decisions have been fetched and compared
with the earlier complete copies; no Drive write yet. Final record content
will state the actual release outcome, not a promised merge.

GitHub main is stillc8e309c and PR534 is draft at ea97cd3e. Exact-head
validation42856823750 genuinely executes and passes1,213tests with0fail/
skip, check/build successful and23,765resolvedinternal links (the local
build above had23,769; retain each environment's actual receipt). Council
42856823964 is advisory green but its executed parser rejects pending;
this is not approval. WioPR533 closed16:08:53UTC without merge; no data
acceptance inferred. Monitoring/RSS actual runs remain42818765529 and
42824186681, with the same two credit-held collections and three delivered
unread discovery leads. No forced collection or publication was initiated.

## Release procedure

Draft PR and actual branch preview first. No merge until all final exact-head
checks genuinely execute successfully, every T3 review is complete and the
current-body Council parser accepts actual Chairman approval. Use ordinary
protected exact-head merge, never admin bypass. Then independently verify
actual production and canonical hub/card behaviour before saying live.

## Superseding final hosted review and bounded feature approval

The earlier performance HOLD is closed for the reviewed exacta30c5a9
production source, not erased. Actual identified Cloudflare preview
57b1c153-cbf4-492f-ba9b-7a36a0a72108 succeeded with that exact commit;
authenticated dashboard independently confirms Preview environment, source
branch/SHA and actual URLhttps://57b1c153.dubaipoints.pages.dev. Its GitHub
hosting status lagged; dashboard success, not a stale badge, established it.

Independent Technical reviewerrelease10_exact_head_review ran the unchanged
registered hosted mobile sampler, three runs per route, assertions95/200KiB:
Skywards96/95/99,Hyatt97/97/98; medians96/97, all individual scores≥95.
The chosen-run initial-transfer proxies118/181KiB and every full-request
total are below200KiB. These are lab measurements, not field or whole-site
speed certification; one delayed-paint state, smallCLS≤0.0012, a183msTBT
outlier and inline HTML/shared-cache trade-offs remain explicit. Earlier
"medianLCP" labels describe the chosen median-performance report, not a
mathematical median of LCP. The independent report gives both correctly.

Both actual hosted route bodies equal their earlier hosted baseline and
fresh local build. Independently reversing only the seven inline CSS blocks
reproduces the entire original hosted HTML; complete CSS order/bytes match
all actual assets. The earlier stale-local-Hyatt gap is thus resolved for
final hosted content. Preview SEO69 is solely its actual noindex header;
production indexing remains a post-merge check, not presumed.

Root's connected Chrome independently verifies actual hosted Skywards
desktop Cards menu opens/Escape dismisses;390px light programme disclosure
opens/closes and full-guide anchor reaches exactly one target; actual Hyatt
390pxlight and1440pxdark show correct reporting/real hero, seven inline
styles, original canonical and no measured document overflow. Original
dark preference restored and viewport override reset. These are bounded
Chrome observations, not physical Safari. Light/dark previews were supplied.

Record Mostafa's expressly conditional10November feature-release direction
as Stage7approved now the substantive conditions pass, under the current
in-session feature amendment. Independent named AI reviewers are not human
signatures; no article contributor/COI/final-copy/byline or new spend/account/
outreach authority is inferred. Technical and Chairman feature cells are
complete/approved; exact final-head executed validation and a genuinely
accepting current-body Council parser remain mandatory before normal merge.
Only release/review records follow reviewed production heada30c5a9. Actual
production deployment and canonical verification remain separate later gates.
