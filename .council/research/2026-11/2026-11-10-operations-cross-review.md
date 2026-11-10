# Independent operations cross-review

Date: 2026-11-10. Reviewer: `card10_source_repair`, Codex AI delegate applying Technical, Standards, Growth/Analytics and Managing-Editor lenses. These are actual review lenses, not four independent people. I authored the separate HSBC age candidate and **do not independently approve that work here**. The monitoring and measurement implementations reviewed below were authored by other delegates; root made the selector corrections requested during this review.

## Verdict

**PASS after root corrections, within the bounded operations scope.** The initial tagged-fallback identity defect and the subsequent quoting regression were found, reported, corrected and independently re-tested. No remaining release-blocking defect was established in these two implementations. This is not full-site QA, a provider recovery, an analytics connection, a fresh visitor report or Chairman release approval.

## Reviewed material

- `scripts/ci/post-digest.sh`, `tests/ci/post-digest.test.ts`, `tests/ci/deliver-monitor.test.ts` and `2026-11-10-monitor-repair.md`.
- `scripts/analytics/readiness.mjs`, `tests/analytics/readiness.test.ts`, the existing Google-tag/deferred-tag/review tests, actual fixed source wiring and `2026-11-10-measurement-readiness-and-merge-observations.md`.
- Current Charter/workflow and the Technical/Standards/Growth/Managing role mandates. No public-page copy or programme-hub implementation was approved by this review.

## Findings and actual resolution sequence

1. **Original fallback marker defect:** `contains(marker)` could select an unrelated unlabelled Actions issue merely quoting the channel marker, or another channel's issue containing it later. I reported this to root and the monitoring author. Root changed the tagged lane to require the exact canonical leading marker plus its two-newline separator, and added quoted/embedded, wrong-leading-channel and missing-separator negatives. The narrow legacy health-alert migration lane remains separate.
2. **Correction regression, not waived:** root's first prefix edit placed the newline escapes outside the jq string. My independent six-file run returned **60 pass / 4 fail**, with every positive fallback-reuse case creating a new issue instead of commenting. This exposed a jq parse failure being safely handled as lookup failure, not an excuse to call the code correct. I stopped approval and reported it. Root corrected the shell/jq quoting. I read the current production selector and negatives again, then re-ran the same six files: **64 pass / 0 fail / 0 skip**. The failed intermediate run remains part of this record; it was not a flaky-test waiver.

Final production selector requires an OPEN, unlabelled issue authored by `app/github-actions` with `is_bot: true`, then either the exact leading channel marker and separator or the narrow monitor-health legacy title/heading/scope combination. It reads at most 100 open issues without using search indexing; a saturated response, tied newest timestamps or failed lookup cannot silently choose an arbitrary candidate. Different-timestamp exact duplicates choose the newest with a warning; older issues are left open and unchanged. Failure to find/comment still falls through labelled creation, unlabelled creation, then a nonzero failure. A title-edit failure warns only after a comment has actually succeeded.

I independently read actual issue532 through `gh issue view --json`: OPEN, no labels, `author.is_bot: true`, `author.login: app/github-actions`, matching the exact legacy title, heading and scope sentence. This verifies the mock's relevant real GitHub shape. I did not comment, edit, relabel or close that issue. The tests execute the production jq over realistic JSON and reject unknown CLI shapes; they do not simply return a convenient issue number.

The digest source file remains unmodified; only a temporary copied body is tagged for issue creation. Fatal delivery text no longer claims a successful remote state commit that the caller has not yet performed. Transaction tests retain failed-alert/dispatch/save behaviour, no seen-state advancement on a fatal poll, preview suppression, path/symlink/run-marker/bank guards and salary alert-only routing.

## Measurement, privacy and metric review

The readiness implementation genuinely reads only seven named repository files, reports recognisable source patterns and unresolved external evidence, and does not execute the sources or read credential/environment values, fetch accounts, send events or write a report. I executed the actual JSON CLI. Its output retains `audienceReportRetrieved: false`, `liveDeliveryVerified: false`, `accountSettingsInspected: false`, `trackingSettingsChanged: false` and `botFreeMonthlyPeopleCountSupported: false`.

Independent additional loader checks created disposable test inputs and verified that an outside-root symlink and a fixed source larger than 512,000 bytes are refused. The underlying production analytics/layout/journey files and workflows have no diff in this workspace; no privacy/consent/filter/history collection setting or live tag was changed by this operations candidate.

The report correctly treats the salary/spend URL keys plus standard tag as a plausible source risk, not observed real-visitor transmission. It does not represent the separate uninstalled planner as protecting the live bootstrap. Unknown source patterns remain manual-review holds. Its recognisers are deliberately source-pattern checks, not a complete JavaScript semantic or privacy analyser.

I separately read Google's current primary documentation during this review:

- [Known-bot exclusion](https://support.google.com/analytics/answer/9888366?hl=en): known bots/spiders are automatically excluded; that is not all automation or exact natural-person deduplication.
- [User metrics](https://support.google.com/analytics/answer/12253918?hl=en): Total users and Active users have different event/engagement definitions.
- [Pageview behaviour](https://developers.google.com/analytics/devguides/collection/ga4/views): default page location uses the URL without its fragment, and Enhanced Measurement history events can occur independently of `send_page_view: false`.

The tool retains query/history risk, unverified internal/browser-QA exclusion, unqueried Search Console access and distinct GA4/Cloudflare metrics. It does not equate navigation with applications, approvals or money, sum daily users into monthly people, reconstruct pre-installation history or call missing access zero traffic. The report's claims are proportionate to this evidence. No private audience totals or source inputs are echoed.

## Editorial/operating boundaries

The monitoring report separates actual collection, poll, delivery and acknowledgement evidence. Its two credit-skipped due collections remain held; a passing delivery repair is not paid collection recovery. RSS leads remain discovery metadata, not full-source reading, fact-checking or publication. The concurrent-merge note explicitly distinguishes actual earlier merge chronology from later approval records rather than backdating a gate. These are appropriate Standards and Managing-Editor distinctions.

No new worker, feed, target, cadence, quota, provider spend, newsletter, applicant-data collection, email/outreach, article publication or account change is implemented or approved by this review. The owner still controls analytics settings and any later evidence/permission expansion. Source-collection holds, article-specific acceptance and financial-data holds are not waived.

## Executed checks and frozen identity

Final independent command used Node22.20 with the actual local jq/Bash:

`node --import tsx --test tests/ci/post-digest.test.ts tests/ci/deliver-monitor.test.ts tests/analytics/readiness.test.ts tests/analytics/google-tag.test.ts tests/analytics/deferred-google-tag.test.ts tests/analytics/review.test.ts`

Result: **64 pass, 0 fail, 0 skipped**. `bash -n scripts/ci/post-digest.sh` and `git diff --check` also passed. Actual readiness JSON CLI and the two independent loader-boundary probes passed. No live digest dispatch, issue mutation, provider call or analytics network test was used.

| Reviewed implementation/test | SHA-256 at final read-back |
|---|---|
| `scripts/ci/post-digest.sh` | `9ef45471f81c98d50a8c642e4e12eaaef56f33a2fec5072b602c44663132d34f` |
| `tests/ci/post-digest.test.ts` | `61a6449c9e3b303e27d9c0553175ee2fa376863ab32c3c8747adfdd4a32f49a9` |
| `scripts/analytics/readiness.mjs` | `37a2f02e52f2ee703991be28268e30955abb0aeb59239641d7ed4398a2d26793` |
| `tests/analytics/readiness.test.ts` | `b196c140f18abc4b071c50821b337222b23707e05d4a2193ad693ead1f8819be` |

Role conclusions: **Technical pass after edits; Standards pass; Growth/Analytics pass for readiness/limits only; Managing Editor pass for bounded operational controls.** Root still owns full combined tests/rendering, independent review of my own age candidate, exact-head Council/Chairman and protected release/deployment verification. No approval can be inferred for a later changed implementation without reviewing its delta.

## Later independent review: programme-only exact CSS delivery

Reviewer: the same `card10_source_repair` delegate; implementation author is root, not this reviewer. Verdict: **source/code Technical pass within the tested contract; performance release HOLD is not lifted**. This review made no implementation edit, push, account change or browser certification.

Read the new `scripts/build/programme-style-delivery.mjs`, the actual shared-transform diff in `home-style-delivery.mjs`, the package postbuild change and all eight new tests. The shared helper refactor adds only a private scope parameter and two public wrappers: the historical homepage transform retains its `home` marker, while programme output uses its own marker. The existing active homepage routing/bundling CLI is unchanged. The new runner explicitly lists ten programme routes, verifies each route's expected canonical/hub marker, decodes HTML/CSS with fatal UTF-8 handling and validates all routes/assets before its write loop. A further exact-byte drift re-read precedes that loop. Individual I/O write failure is still a build failure, not a claim of an atomic multi-file transaction.

The pure transform reuses the existing strict CSS/link validator. Exact CSS remains at each original cascade position, including stylesheets separated by scripts; root-absolute/data resource URLs retain their base. Unknown link attributes, traversal/external/relative resources, imports, image-set, escaped functions and raw HTML terminators fail closed rather than being guessed or rewritten. Per-style fingerprints support deterministic idempotence and detect inline tampering. Body bytes, executable-script inventory, shared asset bytes, homepage and unlisted outputs are preserved by the focused fixture checks. Regular-file/realpath checks reject symlinked programme ancestors, HTML, CSS, `_astro` and direct dist links. Missing/unsafe/non-UTF-8 later inputs leave earlier route files unchanged in the tested preflight cases.

The canonical/hub identity preflight is intentionally literal-presence recognition of known Astro output, not a general HTML DOM identity validator; an expected string embedded in a comment/script is outside its demonstrated identity guarantee. I flagged that hardening consideration to root. Final actual rendered canonical/hub verification remains root's responsibility; do not describe these source guards as a universal HTML security parser.

Postbuild runs programme delivery after the separate homepage pass and before Pagefind, CSP and internal-link validation, retaining every existing gate. I independently ran:

`node --import tsx --test tests/build/programme-style-delivery.test.ts tests/build/home-style-delivery.test.ts tests/build/home-style-route.test.ts tests/build/home-style-bundle.test.ts tests/build/csp-hashes.test.ts`

Result: **45 pass, zero failures/skips**, including all eight new programme tests and homepage/CSP regressions. An actual diff read shows no change in homepage source, BaseLayout, existing CSP policy, headers or Google tag/settings wiring for this optimisation.

Trade-off: inlining removes external stylesheet request dependencies but repeats CSS in each HTML response and gives up separate stylesheet cache reuse on these routes. It does not purge selectors or reduce the CSS rule payload. Any speed improvement is still an experiment until comparable rendered/hosted measurements and the required budget pass; the earlier 88–95 samples and above-fold budget failures are not erased by this code review. No 95+ performance, whole-site accessibility, physical-iPhone or live-deployment claim follows from these tests.

| Later reviewed file | SHA-256 |
|---|---|
| `scripts/build/programme-style-delivery.mjs` | `4ea1e44ae0bf0ccd757acd0559bc873e934ca24830e3b04c792f1b71742777ca` |
| `scripts/build/home-style-delivery.mjs` | `17b7ea7064828b7c9e5a55d852ea1aec3dc7d540bbdbd2d0926c7e6f83063ebb` |
| `tests/build/programme-style-delivery.test.ts` | `a04c2fcfb87d198cfc74e90fc98a76b4884fd3af6172c5877ce10640abdcfaf9` |
| `package.json` | `97e883b5601d8b0428ee30d1788ccbd6ac4268f9de70a09cd267f95e83b6cca4` |

### Superseding identity hardening read-back

Root subsequently replaced the literal-presence identity check described above with token-aware checking that consumes HTML comments and complete raw script/style elements before considering actual link/section tags. I independently read the revised helper and its five added negative variants: expected canonical only inside a comment or script, duplicate actual canonicals, and expected programme section only inside a comment or script. The helper now requires exactly one actual canonical token with the exact expected route and exactly one actual section carrying that route's programme identifier. The earlier comment/script-spoofing hardening consideration is therefore **resolved for these explicit generated-output cases**, not left open or silently omitted. This remains a bounded generated-Astro HTML check, not a universal browser parser.

I re-ran the same five-file focused suite after that change: **45 tests passed, zero failures/skips**, including the eight programme tests with all five new identity negatives and the homepage/CSP regressions. No implementation edits or Chrome launch by this reviewer. **Source/code PASS is reaffirmed; comparable hosted performance/budget evidence, final combined Council and exact-head release/production checks remain pending and are not waived.** The cache/HTML-size trade-off and previous failed lab observations remain as recorded above. Root's separately reported compiled-homepage byte comparison is not represented as my own browser observation.

Updated frozen identities, superseding the two corresponding rows above: `scripts/build/programme-style-delivery.mjs` SHA-256 `c0c36e0694bbe810a30c4b66161eb61f7d894b765be7fe2ced341899370b40e8`; `tests/build/programme-style-delivery.test.ts` SHA-256 `150618a5ffabd3fad54a648f38409332234c66061c5c168a639daa4d48ab5434`. Shared home helper and package hashes remain unchanged from the preceding table.
