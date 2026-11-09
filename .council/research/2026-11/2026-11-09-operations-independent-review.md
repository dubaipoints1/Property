# Publication operations — independent bounded review

Reviewed 2026-11-09 by Codex delegate `ops_independent_review`, separate from
the implementation authors `root`, `card_coverage`, `article_briefs` and
`monitor_reliability`. These are AI delegate identities and actual review
lenses, not named human journalists or an independent organisation.

Base: main `4cd884a41176c6ffeecd2eaf4395dfe8262a04c1`.
Candidate: uncommitted `codex/publication-operations` working tree at review.
This review changed only this record. No push, merge, deployment, article
publication, task/settings update, paid retrieval or outreach was performed.
CLAUDE.md was read completely, followed by the site-state memo (historical),
editorial standards, workflow and current publication-operations brief. Root's
fresh SkyNet authority read is the project-state hand-off; this delegate did
not independently download or mutate Drive records.

## Disposition

**PASS for the scoped seven-field acceptance, evidence representation/schema
fix and Bash bootstrap repair.** Operating documents/queue preserve the
source, privacy, no-outreach and publication boundaries reviewed below.
One non-blocking documentary clarification remains recommended: the brief's
old issuer-enquiry bullet should be explicitly labelled historical/closed,
so it cannot be misread below the controlling no-outreach ruling.

This is not a whole-card refresh, paid-collection recovery, human editorial
acceptance, UX/runtime sign-off, exact-head Linux check or live-release claim.
The actual release gates and all separate article holds remain required.

## Seven financial fields — independently reproduced

Read the retained full ENBD KFS text, including named joining and renewal
tables on lines 1–42. Independently rehashed all five retained PDF bodies and
full `pdftotext-layout` texts from the capture receipt, checked `%PDF-`, exact
requested/final issuer URLs, successful PDF/complete/readable metadata, and
ran `validateRawDocument` and `reviewBankDocumentSources`. All five identities
passed. This validates the **8 November capture**, not a fresh 9 November
issuer response or current whole-card guarantee.

Private receipt archive:
`/private/tmp/dubaipoints-source-recovery.yVRvx2/bank-evidence/public-source-evidence-42496136382-1/manifest.json`.
Primary document:
[ENBD KFS, version 08/2026](https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf).
Full text hash: `2a59c7a950a88e2568381753ab6fc3cf40ca4791ab5ab549f44a39ce613fbc30`.
PDF body hash: `32a0c9a99210039fa0f9a49fb6437d5465a3e97d0cee4c1962a4b37db42bf241`.
Capture: `2026-11-08T15:42:28.252Z`.

`parseEnbdKfsFees` reproduces exactly one **literal Free → AED 0** joining
cell per selected product. No absent token is converted to zero. Exact
headers/counts and the joining/renewal section distinction were checked;
the three exact-product variant holds remain outside this acceptance.

| Canonical slug suffix (`emirates-nbd-`) | Source product / zero-based column | Full-text lines | Accepted field only |
|---|---|---|---|
| `darna-select-visa` | Darna Select / 3 | 15–16 | joiningFee AED 0 |
| `lulu-247-titanium` | Lulu 247 Titanium / 4 | 15–16 | joiningFee AED 0 |
| `noon-one` | noon One / 5 | 15–16 | joiningFee AED 0 |
| `priority-banking-visa-infinite` | Priority Banking Infinite / 0 | 12–13 | joiningFee AED 0 |
| `share-visa-signature` | SHARE Signature / 6 | 12–13 | joiningFee AED 0 |
| `u-by-emaar-family` | UBE Family / 0 | 18–19 | joiningFee AED 0 |
| `voyager-world` | Voyager World / 2 | 12–13 | joiningFee AED 0 |

Compared each accepted evidence record against the full text, including
literal source token, named column, first/last line, raw-text SHA-256,
full-source hashes/timestamp and exact UTF-8 start/end bytes. The stored
byte slice is identical to its rawText. An explicit zero does not require
a positive-fee VAT inference. Existing renewal, product waiver and
eligibility qualifications remain; in particular Priority's AED 1,575
renewal/first-year waiver and Voyager's distinct promotional treatment were
not replaced by a standard tariff.

Whole-file invariants:

- Baseline cards.json SHA-256:
  `b259eba28c58b699068bd0af0c3506f6bbece286e708108925ca72ed4710aae8`.
- Reviewed candidate SHA-256:
  `772cb1ace98a0ba7b89c30b519b2b03edf686f4612f2678691be7c477728d0d7`.
- Exactly the seven slugs changed. Each previously lacked joiningFee and its
  field provenance/evidence; no protected joining value was overwritten.
- Removing those seven field/provenance/evidence additions and restoring
  their selected-field `_lastReviewed` dates reproduces the **baseline bytes
  exactly**. All 75 records/slugs, `lastVerified`, `_lastScraped`, other
  financial fields, sources, issues and existing evidence remain unchanged.
- The seven `_lastReviewed` dates are selected-field editorial reviews on
  9 November, not source-capture or whole-card verification dates. The
  source-age guard still uses lastVerified; the acceptance does not clear
  other needs-review fields or claim seven new cards.

## Representation and schema

Reviewed `_bank-document-review.ts`, `_bank-parsers.ts`, `cardsData.ts` and
their tests. HSBC's retained PDF text now explicitly carries
`pdftotext-layout` / `public-http-reader`, rather than silently inheriting
the HTML/decoded-response default. The schema admits this named
representation with a retained body hash and rejects PDF+DOM-method,
PDF+snapshot and incompatible extraction combinations. Existing HTML and
DOM positive cases remain. The four HSBC numeric observations and their
capture hashes/dates are unchanged; none is accepted as a financial
correction by this metadata repair.

Deep-compared both registries to base: **only four parser-hash values**
changed (one document registry, three manual-primary registry entries).
Every route, URL, owner, cadence and policy is identical. The new parser
hash is `3b61cfa728718cf8a333da48d3e3ae6a9fcb0fccdec43d496dfada5cb4aa8214`.
No live paid scraper/monitor imports or automatic acceptance paths were added.

The new joining-fee guards are source-driven, not only hard-coded expected
zeros: they hash/decode the curated excerpt, run the existing named parser,
check exact products/columns/Free tokens and compare accepted evidence.
Negative parser tests retain unsupported/missing/reordered/malformed-column
holds. The separate full-capture comparison above supplies the authentic
body identity that synthetic schema/transport tests explicitly do not prove.

## Automation-state bootstrap

Reviewed the narrow `build_commit` change in
`scripts/ci/automation-state.sh:56`: explicit parent and orphan calls replace
the empty `parent_args` expansion that fails under macOS Bash 3.2 + `set -u`.
Strict mode, temporary index isolation, `--ignore-removal`, non-fast-forward
handling, branch/path scope and existing state preservation remain unchanged.

The strengthened test drives the actual script against a disposable local
bare origin: the first state commit has no parent, a later save has exactly
one state parent, both runs' digests survive, rewritten state is retained,
and caller main/index are untouched. Independently passed on system Bash
`3.2.57(1)-release`; this is local mock-origin evidence, not an external push
or proof of live provider collection.

## Daily hand-off, article gates and contact boundary

Read the saved task `dubaipoints-daily-news-desk` TOML: ACTIVE, heartbeat to
the current thread, daily clock 09:30 and explicit Asia/Dubai intent. Its
prompt requires fresh authority/current main, isolated Codex work, existing
queue/dedup dispositions and full relevant source reading; prohibits paid
calls, new feeds/monitors/workers, protected-data overwrites, settings/key
changes, outreach, self-approval, automatic publication/merge/deployment.
No first scheduled run was verified by this delegate. Local operation
requires the computer/app/project access; it is not a 24/7 cloud editor or
a daily-publication guarantee. These limits match the current
[official scheduled-task documentation](https://learn.chatgpt.com/docs/automations),
searched and opened for this review. Review the first runs and the app's
next-run display rather than infer delivery from ACTIVE alone.

Re-ran the actual local report: publicationAuthority remains false; both
Etihad/Accor commissions are blocked despite declared COI, JA remains held
and Thailand passed-over/not-for-publication. Read the owner's explicit
dated "none" record: scoped only to the two named articles, with no invented
experience or human author identity. Their explicit final-copy/byline holds
remain. New factchecked comments identify the actual AI delegate, not a
fabricated journalist. All six original quantitative brief/draft files
are byte-unchanged from base; none of these private article candidates has
been promoted into `src/content`.

The latest owner **no emails/outreach** ruling controls the brief and closed
UNSENT commercial pack. No sender identity is required now, and no email,
form, routing call, recruitment contact, affiliate agreement or tracked
placement is authorised. Clarify the retained enquiry work-list bullet as
historical/closed to avoid a misleading next-action cue; do not reopen it
merely because the older draft remains in history.

## Measurement and actual monitoring

The public measurement protocol contains no private traffic totals. It
separates Total users/Active users/Cloudflare visits, partial installation
coverage from a calendar month, known-bot exclusion from unknown automation
and owner/QA traffic, and missing Search Console access from zero traffic.
The page-to-action matrix is labelled inference, not observed query intent
or applications/revenue. I did not independently access the owner's private
analytics dashboards, and do not claim such access from this source review.

Code review confirms the live standard `gtag('config', id)` is distinct from
the uninstalled minimised planner. Reader state can include salary/spend
query values and update browser history. The documented collection risk is
therefore a supported code/default-behaviour inference, not proof that a
particular visitor transmitted financial information. No analytics/consent
setting or tag was changed in this diff; the owner's prior leave-settings-
unchanged instruction remains. Do not call the privacy finding resolved or
the existing planner tests live network evidence.

Independently read GitHub run **42622142784** at main 4cd884a: poll failed;
**Deliver alerts and acknowledge pending state** and diagnostics genuinely
succeeded. Issues **527, 528 and 529** exist with the matching run titles
and 13:04:01/03/05 UTC creation times. Issue529 is unlabelled: the fallback
delivered it, not silent success without an alert.

Read full saved health at exact automation-state commit
`3827378ee6df4ebd95e0bcaa7933e1d70ee1334c`, asOf13:03:51.986Z, dryRun=false:

- Fee-docs, product-pages and programme-offers: current-complete due slots.
- Salary-transfer, press-rooms and weekly press-rooms: latest due collections
  failed/skipped_no_credits; collection recovery is not established.
- Offers: in-progress at that saved observation, not certified completed or
  failed afterwards. The historical record is not a fresh provider query.

Thus delivery is working while source collection remains partly unhealthy;
neither "everything failed" nor "monitoring fixed" is supported. No monitor
dispatch, source collection, provisioning, label creation or paid repair was
performed by this review. RSS details in the source audit were not separately
re-fetched here and must not be elevated to full article reading/publication.

## Actual verification and Council lenses

Independent command (Node22.20.0, local fixtures/disposable Git only):

`node --import tsx --test tests/cards/enbd-joining-acceptance.test.ts tests/cards/field-evidence-representation.test.ts tests/scrape/bank-document-review.test.ts tests/scrape/enbd-refresh.test.ts tests/ci/card-source-coverage.test.ts tests/cards/schema-2a-0.test.ts tests/ci/automation-state.test.ts`

**51 passed, 0 failed, 0 skipped.** Read-only newsroom preflight passed its
blocked/held disposition checks; git diff whitespace check passed. These
are not the full suite, Astro/build, final-head Linux, browser QA or release.

| Actual independent lens | Scoped conclusion |
|---|---|
| Research / business-card Section / Fact-Check | PASS for exact seven source-bound fields and retained exclusions; no full-card freshness claim |
| Technical | PASS for reviewed metadata/schema/bootstrap changes and focused tests; broader CI/runtime remains separate |
| Standards / Managing Editor | PASS for truthful states, AI delegate identity, scoped COI and no-outreach precedence; clarify the historical enquiry bullet |
| Growth / analytics control | PASS for metric/window/privacy boundaries, not independent dashboard totals, search-query findings or traffic/revenue uplift |
| SEO | No public SEO/content change accepted by this review; article-specific SEO hand-off belongs to its actual reviewer |
| Head of UX / Chairman / publication | Not supplied by this delegate; never inferred from the passes above |

No paid Firecrawl/provider/media request or external mutation was made.
Ordinary official-document browsing and read-only GitHub metadata/state
calls do not establish provider collection, current card terms or delivery
of any article.

## 2026-11-09 — Superseding owner withdrawal and current release hold

This is a later independent read-back by Codex `ops_independent_review`,
not a rewrite of the preceding assessment. Before this append, its first
13,469 bytes / 223 lines had SHA-256
`1011f48b76455013ae9c605705afee9f983a9715d49eec3f22ca26842e07e562`.
The earlier source/data/schema/bootstrap conclusions remain bounded to
their reviewed changes and tests. The earlier Etihad commission/pending
acceptance descriptions are now historical, superseded as follows.

### Owner direction and actual controls read back

- The owner's later direction, "i dont want to mention anything about syria
  so scrap that", is recorded in the new 9 November Charter amendment as
  withdrawal of the Etihad candidate and exclusion of Syria-related active
  commissioning/publication. A wider "do it all" or daily shift must not
  revive it; reopening requires explicit owner direction. This is an
  editorial scope instruction, not a claim about the destination's safety.
- The real queue now records Etihad as `passed-over`, with the owner reason,
  private brief/draft paths, withdrawal hold and no-publish/no-automatic-
  recommission next action. Its source-check history is retained rather than
  erased. The brief's `chairman-status` is `rejected`, and its new top section
  explicitly withdraws it. The private MDX carries a prominent `WITHDRAWN
  BY OWNER 2026-11-09` comment. Earlier pending/review copy is audit history,
  not a live request for approval or an accepted release candidate.
- A case-insensitive search found no `syria` or `damascus` in public
  `src/content`. No public-content diff or diff to the six original
  quantitative brief/draft files was present in this read-back. Private
  retention is consistent with the owner's withdrawal and audit rule;
  no public route or re-publication was authorised by this reviewer.
- The daily SOP's triage exclusion and the actual ACTIVE task
  `dubaipoints-daily-news-desk` prompt both include the new owner exclusion
  and prohibit automatic revival. Read-back still shows the same daily
  09:30 rule and intended Asia/Dubai prompt, existing target chat, no paid
  calls/new feeds/monitors, no outreach, no self-approval and no automatic
  publication/merge/deployment. It remains a local draft/review hand-off,
  not proof of a future successful run or scheduler timezone resolution.
  [Official scheduling documentation](https://learn.chatgpt.com/docs/automations),
  re-read 9 November, supports the local app/computer/access limitation and
  checking early outputs; no task was created or changed by this reviewer.

### Independent preflight and remaining acceptance

Re-ran the real read-only newsroom report for `--as-of 2026-11-09` and
checked its parsed result: `publicationAuthority: false`; Etihad and the
Thailand lead `not-for-publication`; Accor `blocked`; JA `held` and blocked.
Accor's actual blockers remain owner final-copy/organisational-byline
acceptance, pending Technical/UX/Chairman cells and a non-release queue
stage. Its scoped owner COI declaration is not acceptance of the final copy
or permission to publish. No blanket approval is conferred by withdrawing
the other article. The original quantitative evidence holds remain intact.

`node --import tsx --test tests/newsroom/report.test.ts` independently
completed **16 passed, 0 failed, 0 skipped**. These include negative cases
for ready labels bypassing real brief gates, missing COI/evidence, self-
review, incomplete UX/Standards, unsupported schemas and inconsistent
held/passed-over dispositions. The current actual queue additionally
exercises the withdrawal. `git diff --check` passed before this append.

The prior enquiry work-list recommendation is **resolved 2026-11-09**:
the operating brief now labels it `HISTORICAL / CLOSED`, explicitly with
no sender-details or sending-approval request active. The send pack's
superseding UNSENT/no-outreach ruling and task prompt agree. No emails,
forms, routing calls, other contact, paid requests or external mutations
were made by this reviewer.

Non-blocking documentation clarification: the SOP's "explicit local queue"
paragraph describes the initial two commissions/one held/one passed-over
mix without dating the later withdrawal. Add a current-state sentence so
it cannot be mistaken for today's queue: Accor commissioned, JA held,
Etihad withdrawn/passed-over and Thailand passed-over. The real queue,
Charter, prompt and report already enforce that state, so this is not a
reason to invent a new publication gate or reopen a withdrawn story.

### Current release decision

Parent/root supplied a fresh Lighthouse finding of budget breaches on four
routes, including a local Card Finder performance score of 59, with
performance remediation and QA still in progress. That is supplied
Technical evidence, **not an independent Lighthouse run by this delegate**;
no later passing run has been reviewed here. Accordingly the broader
Technical/performance gate is **NOT PASSED / RELEASE HELD**. The earlier
focused metadata/schema/bootstrap PASS must not be reused as a site-wide
performance, UX, exact-head CI or deployment sign-off.

Standards/Managing Editor scope controls PASS for the actual withdrawal,
separate Accor acceptance and no-outreach precedence. Technical release,
Head of UX, owner final-copy/byline acceptance and article-specific
Chairman/publication authority are not supplied by this delegate. No
merge, deployment or article publication is endorsed by this addendum.

## 2026-11-09 — Final small UI source review and speed-diagnosis correction

Later same-day review by the same independent Codex delegate. No production
UI, helper, data or test was authored or changed by this reviewer. Read the
current `.21st/design.json`, Technical Lead and Head of UX mandates, pinned
house web-design checklist, 21st UI-review skill and accessibility guidance
before this focused review. These favour native controls, explicit focus
ownership/cleanup and existing readable trust tokens; they do not authorise
a new visual direction, library installation or whole-site certification.

### Superseding speed diagnosis, not an erased local failure

Root's supplied `.council/research/2026-11/2026-11-09-production-speed-observations.md`
records actual Chrome observations of four public production PageSpeed
lab reports: homepage 97, Finder 98, Tracker 100 and Skywards 99. The report
correctly says these are single live lab runs of existing PR525/main
`4cd884a`, with **No Data** for real-user/CrUX experience; not candidate
results, multi-run production medians or measured reader outcomes. This
delegate reviewed that record, not those browser pages independently.

The same uncompressed local baseline Finder also scored 59. Its selected
run, decoded/local transfer proxy and pre-LCP request metric must not be
treated as compressed production above-fold weight, a metric-by-metric
median or proof of a live regression. Accordingly the earlier addendum's
supplied "live failure" inference is superseded: the local eight budget
breaches remain genuine local diagnostics, but do not independently prove
that the current public site fails its loading floor. No budget was amended
or local failure silently changed to PASS. The asynchronous Finder rewrite
was stopped before implementation; no such production rewrite is accepted
or needed to close this review's source findings.

The new Tracker change is a bounded initial-markup reduction with a small
JavaScript cost, not a demonstrated cure for a live loading problem or a
guaranteed speed improvement. Current production scores do not themselves
certify the unmerged candidate or remove exact-head release requirements.

### Actual source review and independent focused tests

- `SalaryTransferTracker.tsx` retains both native controlled wrappers,
  disclosure IDs, `hidden`, `aria-controls`, `aria-expanded`, query restore
  and individual source-linked offer routes. Only the two closed `Detail`
  bodies are omitted until their existing `isOpen` state is true; there is
  no new fetch, date, financial/ranking rule or non-JavaScript promise.
- `trackerResponsiveFocus.mjs` is installed once through a cleanup-returning
  effect/ref. It starts without keyboard ownership. The matching open offer
  must still exist; its original control must have become invisible and its
  exact opposite-view counterpart must be visible/expanded. Descendant
  recovery checks position, tag and href, otherwise conservatively uses the
  disclosure control. It uses `preventScroll`. Pointer, outside/body focus,
  deliberate visible blur, window blur, hidden-document, closed/removed
  offer and absent counterpart cases do not permit recovery. The queued
  key-frame visibility guard preserves ownership in the tested Chromium
  hidden-before-focusout ordering. Cleanup disconnects the observer,
  unregisters listeners, cancels frames and makes stale callbacks inert.
  This is modality-based recovery, not a universal classifier of all
  possible future programmatic focus; the reported negative is precisely
  **initial programmatic focus**, not every script-driven focus sequence.
- `VerifiedStamp.astro` changes only the pending/stale label text colour
  from decorative `--gold` to existing `--gold-ink`. Trust semantics, dot,
  wording, timestamps and status conditions are unchanged. The change is
  consistent with the design file's readable trust-text token. A source
  test is not proof of the final computed foreground/background contrast.

Independently executed:

`node --import tsx --test tests/reader-followup/tracker-detail-delivery.test.ts tests/reader-followup/tracker-responsive-focus.test.ts tests/reader-followup/verification-contrast.test.ts tests/content/salary-transfer-tracker-images.test.ts tests/content/salary-transfer-tracker-bands.test.ts`

**23 passed, 0 failed, 0 skipped**: two delivery/identity guards, nine actual
helper tests (including negative ownership/cleanup and the ordering race),
one contrast-source guard and eleven existing bands/images checks. The
focus tests invoke the real helper with local event/observer/DOM doubles;
they are deterministic regression evidence, not actual browser, Safari or
assistive-technology testing. No concrete blocking source defect was found.

A cached `@21st-dev/cli` 1.18.0 was available even though `21st` was absent
from PATH. Read-only `review ... --json` via that cached executable reviewed
one Tracker TSX file with zero findings. The Astro stamp invocation reviewed
**zero files**: that is an unsupported-file skip, not a clean Astro audit.
Manual source review covers the stamp above. No CLI installation, hosted
generation, new dependency, catalogue request or paid call occurred.

Reviewed source SHA-256 pins:

- Tracker TSX: `d8608ca2aa8b37ee74eb4ca984ea0ca093f015dabe676727d3f9ae011d48b046`
- Focus helper: `273b66c84f0f9fa9c0bafb1be211e35c3af8333feab576271649926168f951f7`
- Stamp Astro: `498b653f55609ea9c10253b648d562f6f850962376acd847d0746cccc3059cd8`

### Supplied runtime receipts independently reconciled

Read the complete actual `tracker-runtime.mjs` harness and parsed
`/private/tmp/dubaipoints-speed-followup.BI5N4X/tracker-runtime.json`
(SHA-256 `d888a4725ddc72a5a2ed88b3fb4ef37a5b4f70c68e5af23951cc739c0cd023f7`).
Independently asserted 168 before/after route states, 24 all-six-offer/theme
interactions, 14 final focus cases and four matching initial-viewport PNG
hash pairs. Actual receipt checks show no page errors, unchanged visible
fact/link hashes and source island-props hashes, matching expanded detail
hashes, passing recorded focus cases, and retained controls/containers with
closed fine-print blocks reduced from 24 to zero on the main route.

The harness exercises saved-query restoration, Space/Enter, close/open,
both responsive directions and negative focus cases against the built
browser. These are independently reconciled **supplied local Chromium156
receipts**, not a fresh browser execution or image inspection by this
delegate. They do not certify every route, physical iPhone Safari,
VoiceOver, a human five-second task, production behaviour or release.

### Current scoped recommendation and outstanding release proof

Technical implementation/source scope: **PASS** for this small delivery,
focus and token patch, supported by actual focused tests. Head of UX code
and interaction-evidence lens: **PASS within those states**, not a new
palette/homepage redesign or full WCAG/device sign-off. The explicit final
computed contrast/journey evidence and current combined check/build/full
suite were still root-owned pending work at this read-back; no full
Technical release/Chairman authority is supplied by this reviewer.

One existing `combined-journeys.log` ended in a null `cards`-parameter
TypeError at `reader-flow-tools.mjs:26`. Its currency was not established;
root was notified not to treat that receipt as a journey PASS until the
failure is explained and the applicable rerun reviewed. An existing
`final-full-tests.log` of 1,168 passes may precede the new Tracker cases;
it is not asserted here as final combined-head proof. Neither item is
misreported as a proven new UI regression from its filename alone.

The previous minor SOP queue-description recommendation is now **resolved
2026-11-09** by an explicit historical/current-disposition sentence.
Read back the further-narrowed ACTIVE task and SOP: scheduled shifts must
not push branches, open/close issues or PRs, submit forms, email, call or
message anyone. They return private drafts/findings here only. This does
not expand separately directed interactive release authority. Accor is
still private and owner-gated; Etihad remains withdrawn; all original
source/publication holds and the no-outreach rule remain unchanged.

## 2026-11-09 — Frozen combined check/build/test/render receipts

Later read-back of root's current frozen combined receipts under
`/private/tmp/dubaipoints-operations.hAVNh3/`. These replace the older
1,168-test receipt for the following local combined-build claims only;
they are supplied executed evidence, not fresh executions by this reviewer.

- `combined-tests.log`: independently counted **1,181 `ok` test records**,
  zero `not ok`, and the matching final 1,181 pass / 0 fail / 0 cancelled /
  0 skipped / 0 todo summary. Confirmed the new queued-keyboard-order and
  verification-token cases are present, not just an older suite total.
- `combined-check.log`: Astro's final result is **220 files, 0 errors,
  0 warnings, 7 hints**. The log's individual deprecated/unused diagnostics
  are retained; the zero-warning claim refers to Astro's result classification,
  not their absence. The existing unpriced ADCB bonus remains unranked.
- `combined-build.log`: build/postbuild completes, internal routes pruned,
  **338 pages indexed and 23,725 internal links resolved**; CSP and existing
  homepage stylesheet delivery run. This is not new public article content.
- Independently parsed `combined-render/probes.json`, reconciled its summary
  and asserted all **11 routes status `ok`, 0 route errors**, at 390/1280 CSS
  pixels and light/dark. Both recorded overflow modes are false; no axe
  violations, selected focus failures, image/link issues, heading skips,
  console/page/request/HTTP errors, reduced-motion offenders or menu
  Enter/Space/Escape failures. The route set is home, Skywards, Finder,
  Tracker and all seven changed card-detail pages, not all site routes.
- The **56 small-target warnings remain recorded** and were not suppressed
  or waived. Root identifies these as inherited; this combined receipt
  alone does not reproduce every route's baseline. Axe also retains
  `incomplete` manual-review records, including undetermined image/overlap
  contrast and some ARIA/table checks. Zero violations is not a whole-site
  WCAG certification or proof of every foreground/background pair. No
  `dp-card-verified` selector appears in those incomplete records, but final
  computed stamp contrast is still separate, not inferred from that absence.

Receipt SHA-256 pins:

| Receipt | SHA-256 |
|---|---|
| combined-tests.log | `c3391cfa9abcdc1fbc3e98d907c80d64f4e006c19a3748c27ff7c891648beda9` |
| combined-check.log | `0c0dc999f3ccdd28ac94dd1e239da94d8b9c584f39a0404471dde573cf4f00c3` |
| combined-build.log | `06394bb5e8ced96ae744a7dfa506e7898d71c0de25ab945d3eb00b24d2eaad4b` |
| combined-render/probes.json | `c5e787fd2188466e60531e7e041c763fc1b97e28d8b34163e0f8c263807c8dd6` |
| combined-render/summary.md | `b22f6be3811c8d3061131ca6c776437d816cd346e5e88b6ac1d576804e97cb6d` |

The render metadata names commit `4cd884a` (the base checkout identifier)
and local `dist`, generated 2026-11-09T14:06:50.423Z, Chromium156 with
external hosts blocked. It is not a final PR-head receipt, Cloudflare
candidate deployment, physical Safari test or production verification.

**Combined local check/build/full tests and this selected render receipt:
PASS within the stated scope.** Both registered journey/hero audits have
actual failures still being diagnosed/modernised by root and the other
delegate. Neither journey correctness nor the hero audit is passed by
these different checks. No full Technical release, Chairman acceptance,
merge, article publication or deployment approval is given here; preserve
those outstanding gates and existing private/withdrawn/source holds.

## 2026-11-09 — Registered reader-journey audit correction and rerun

Independent review of the subsequent two-file diff:
`scripts/audit/reader-flow-tools.mjs` and
`tests/cards/card-journey-bindings.test.ts`. No production Finder,
CardJourney controller, comparison page or shared journey-state file changed.

The old audit asserted that merely reading a Finder review created a
`cards` selection, then dereferenced its absent value. The actual unchanged
`CardJourney.astro` source deliberately distinguishes explicit reader picks
from suggested comparison destinations. Review links preserve state but
must not manufacture a comparison selection. Root supplied an unchanged-
baseline rerun; its saved `baseline-registered-journeys.log` has the same
line26/null-`cards` exception. This reviewer read that receipt and verified
the production controller has no diff; no independent baseline browser
execution or full baseline receipt provenance is claimed here.

The corrected audit now asserts no invented selection and no visible tray
on that review path. It retains the existing suggested-Compare check and
adds a deliberate second-then-first two-card choice, ordered URLs/review
handoff, explicit curated-review destination ownership, back/tray/Compare
order, restored two checked boxes and clearing selection while preserving
the tested salary/spend state. The Tracker return check now opens the real
options disclosure and checks the native `Cash only` checkbox; it does not
pretend the current checkbox is the older pressed chip/button.

Read the full updated audit and test file plus actual controller. The two
new unit cases transpile and execute that controller's real script with
the actual shared `cardJourneyHref`/`cardJourneyParams` helpers and local
DOM/event doubles. They do not reimplement the expected URL logic as a
test-only substitute. Independently ran the binding file: **7 passed,
0 failed, 0 skipped**, including both new cases and the existing explicit-
destination/reset/result-order contracts. `git diff --check` passed.

Read `current-registered-journeys.log`: both light and dark reach the
Finder→review→Compare→Finder checks, reverse-order selection/curated-
destination/clear path, Tracker→offer→band-only calculator→exact salary→
offer→restored Tracker path, invalid/absent exact-salary checks, native
no-JavaScript shortlist/disclosure and final zero-page-errors assertion.
These are supplied successful local browser results, not this reviewer's
browser run, universal filter/state coverage or physical Safari proof.
The specific clear assertions retain salary and `cv_spend`; do not expand
that into an exhaustive claim about every possible URL parameter.

Source/receipt SHA-256 pins:

- Updated audit: `aa65ee9e8d715f5963e92b21ce1f21a67e5a71dd68a31bf07f0a8ced1e9f48f7`
- Binding tests: `d27bc6fd42ee961e359f40be869f43d5af9b7490891858446fd6f1e52410620e`
- Browser log: `49e7f1b48cfe4be728934af33e3f56ba88505dd4bc830a1c6bff78c1e05858f4`
- Supplied binding log: `36b06661c60e6dd69284409fb8b8debb74ba033f67fded30435837ae091a71a2`

**Updated registered journey audit: PASS within those executed paths.**
This supersedes only the prior registered journey-audit hold. The separate
hero audit remains unresolved at this read-back; owner release authority,
current exact-head checks and production verification are still separate.
The earlier 1,181-test combined suite predates these two new cases and is
not relabelled a final post-edit suite. A draft PR is not merge/publication
approval. Accor remains private/owner-gated, Etihad withdrawn and all
source/no-outreach constraints unchanged. No external mutation or other
file edit was made by this reviewer.

## 2026-11-09 — Final frozen local Technical / UX evidence acceptance

Later independent read-back closes the outstanding **local** hero-audit,
computed stamp-contrast and post-audit full-suite evidence gaps. This is
not Chairman release approval, committed-head CI or live verification.

Read the full strengthened `scripts/audit/homepage-reel.mjs` and its six
new `tests/audit/homepage-reel-contract.test.ts` cases, then checked actual
unchanged `homeJourney.ts` progress/content-fit rules and the hero CSS/probes.
The audit now uses the selected Journey Aperture composition rather than
obsolete selectors; includes the sticky header in geometry; tests eligible
sticky-stage height rather than allowing a natural-height fallback to
certify itself; requires both enhanced phone and desktop cases; confirms
positive decoded frame visibility; and counts exactly one correct owned
responsive video fetch, without a Set masking repeat downloads. The tests
exercise real exported geometry/path/visual-difference helpers, including
changed pixels, dimension mismatch and invalid progress; source guards
complement rather than replace the built-browser checks. Importing the
helpers does not launch the audit.

Independently ran the final audit-contract, journey-binding, responsive-
focus and verification-token test files: **23 passed, 0 failed, 0 skipped**
(6 + 7 + 9 + 1). No browser/media request was made by that unit run.

Read root's full successful `final-homepage-reel.log` and the source author's
separate `homepage-reel-result.json` command/status/timing/hash receipt.
The supplied browser runs cover five opening comparisons (360×844,
390×844, 390×920, 1440×900, 1920×1000), each reporting **0.000%** pixels
differing by more than eight RGB levels. They exercise no initial/timer or
touch-down media download; trusted touch/keyboard input; exactly one owned
720/default/2560 MP4; completed local blob attachment; visible decoded
frame; bidirectional scrubbing and ordinary exit; stalled/failed fetch
poster/title/action; no direct-anchor or scripted-scroll fetch; subsequent
trusted scrolling; reduced motion and JavaScript-off native fallback.
The source author's receipt records exit0 and unchanged before/after hero
and controller hashes, matching the source read here. Root independently
re-ran the registered audit; this reviewer reconciled supplied results,
not a further browser execution or physical iPhone inspection.

Read both JSON lines of `stamp-computed-contrast.log`, six visible labels
per theme, each 12px normal text with the recorded opaque background.
Independently recomputed relative sRGB luminance using the 0.04045 channel
threshold, 2.4 exponent, 0.2126/0.7152/0.0722 weights and
`(lighter + 0.05) / (darker + 0.05)`. All twelve ratios match the receipt:
**7.199089783:1** for RGB(117,80,24) on white and **10.330602794:1** for
RGB(239,208,152) on RGB(23,39,48), above the 4.5:1 normal-text floor.
Computed-colour capture and image inspection are root's supplied browser
evidence; the maths was independently verified here. This closes this
stamp's scoped contrast evidence, not every site contrast/manual item.

The actual final frozen receipts supersede the earlier 1,181-test stage:
independently counted **1,189 passing test records**, zero `not ok`, and
the matching zero-failure/cancelled/skipped/todo summary. New hero helper,
visual-difference and explicit-review journey cases are present. Final
Astro summary remains 220 files / 0 errors / 0 warnings / 7 hints. Final
build indexes 338 pages and resolves 23,725 internal links. Those records
do not certify a future committed PR head by their base-commit metadata.

Final receipt SHA-256 pins:

| Receipt | SHA-256 |
|---|---|
| final-candidate-tests.log | `b5cc008a102cca1d7983887fcb36bf59a24b07d184bb0d583ad45ee35a1dc915` |
| final-candidate-check.log | `c4a8a13f20a4c02de5531b5422d8c276b2cf805628f32513d7aac19d29233d5c` |
| final-candidate-build.log | `24aebbf1bb13e9e9530cf028cc156716579b95a48ec6a7162a99bb5b41da663c` |
| final-homepage-reel.log | `b131f019c9c9b894de7bc8d82155db210e24df7b6fcf04d391033fb5735fed71` |
| stamp-computed-contrast.log | `1ac75d23f8010e8204e5aec95bafcf44ee62b9f3e92ae6cec4e0cf3428947e33` |

Reviewed audit SHA `5f442a81284f50dc64430aa40d7597ee84543551f63b73fb398bbd5ba61a9ed7`;
new test SHA `2aa54b59eeba7df32c6716b7bb34db94c7f6cb427d17a89a64e2b795f0f2874e`.
Production hero/controller have no diff: hero SHA
`06d17b133aa64042d0598d7fb56592cfbb07c079229717043380c88faaf4a0b1`,
controller SHA `a7c84b23b39a9631fa29c0fbd4497797c853320ae3984aad77746879df2def5c`.

**Scoped Technical and Head of UX local acceptance: PASS.** No blocking
source/selected-runtime defect remains identified by this review. Preserve
all 56 recorded small-target warnings and axe incomplete/manual items,
the distinction between live lab/local proxy/field data, physical iPhone
Safari and real-reader limitations, owner preview/release decision,
genuine executed exact-head Council/CI, and eventual production verification.
There is no all-site WCAG, universal device, wire-budget or field speed-gain
claim. A draft PR may record this work with Chairman release pending; this
report does not authorise merge, article publication or deployment.

Accor remains private/owner-gated; Etihad withdrawn; original financial-
source/publication holds and no-outreach rule remain. Root reports the
final controlled SkyNet update stopped after a fresh full decisions fetch
failed, without retry/fallback/upload and with zero writes. This reviewer
read that recorded hold, did not verify Drive independently or mutate it,
and does not treat prepared local records as canonical updates.
