# Programme hub — independent review, 2026-11-10

Reviewer: Codex AI delegate `release10_exact_head_review`, independent of
root's hub implementation. These are actual review lenses, not separate
human editor identities. This reviewer authored the separate measurement
readiness tool and is **recused from approving that implementation**.
Only this report is edited during the hub review.

**Current disposition: scoped source/UX PASS after corrections, 2026-11-10;
overall Technical release remains pending performance evidence.** Both
initial holds are resolved; their original findings remain below as review
history. The later focus/performance section qualifies the scoped passes.
Final exact-head/release gates are still separate.

## Initial disposition: HOLD for two corrections

1. **Mobile reading flow — UX HOLD.**
   `src/components/ProgrammeHub.astro:27`, `:65` and `:83` place a fully
   expanded desk above the full guide. At 390px, the reviewed Skywards hub
   screenshot is approximately 1,473px tall; the otherwise empty Hyatt hub
   adds approximately 758px. Four explanatory task rows, three news rows,
   three guide rows and empty-offer copy precede Skywards' essential guide
   and contents. Even Hyatt's empty sections displace its guide substantially.
   Desktop looks coherent, but this phone composition works against the
   owner's requested reduction in text-heavy subpage flow. A top skip link
   helps navigation, not the initial information hierarchy.

   Required correction: compact the task navigation and stage secondary
   coverage/reading/offers in a native disclosure, or place the extended
   desk after the essential introduction. Preserve useful news visibility,
   honest empty states, no-JavaScript operation, keyboard/focus behaviour
   and all destination anchors. Review new phone screenshots and actual
   hub/guide geometry, not merely zero overflow or an axe score.

2. **UTC news expiry edge case — Technical HOLD.**
   `src/lib/programmeHub.ts:37` adds 24 hours to the raw `staleAfter`
   timestamp while its documented contract is inclusion through that UTC
   calendar day. The content schema admits coerced timestamps, not only
   midnight dates. Independently executed a synthetic post with
   `staleAfter:2026-11-10T12:00:00Z`: the helper still selects it at
   `2026-11-11T06:00:00Z`. Normalise to the UTC day boundary, or establish
   and enforce a different explicit contract. Add intraday timestamp and
   exact-boundary negative tests. This is a reproducible helper edge case,
   not a claim that an existing public article presently has that value.

Minor cue: the task links all use an outward arrow, including same-page
anchors. Prefer a direction consistent with the destination. This is not
the release blocker above.

## Scope and method

Read the current Charter and inherited operating authority, feature brief,
editorial workflow/taxonomy, `.21st/design.json` and `.21st/DESIGN.md`, the
SEO/Standards/Travel/Managing/UX/Technical mandates and the complete house
web-design guidelines. Reviewed:

- `src/lib/programmeHub.ts`;
- `src/components/ProgrammeHub.astro`;
- `src/layouts/AirlineProgramLayout.astro`;
- programme route/content schema and existing `NewsStoryRow`;
- `tests/content/programme-hub.test.ts`;
- `scripts/audit/programme-hubs.mjs`;
- root's supplied first `audit-output/programme-hubs/evidence.json` and
  actual Skywards light390/1440 and Hyatt dark390 screenshots.

Executed the installed 21st local review on `ProgrammeHub.astro`: zero
files reviewed and zero findings. Astro is unsupported by that scan; this
is **not a UI pass**. No download, provider generation or paid call was
made. The supplied local build is adequate for this scoped SEO/template
review; no paid crawl, live search-ranking or Search Console claim is made.

Independently executed all six selection tests successfully, and the
additional synthetic expiry reproduction above. Root owns check/build and
browser execution. The supplied initial browser summary reports ten
programme routes, 160 theme/viewport overflow records, zero scoped axe
violations and no-JavaScript guide navigation. Source inspection shows axe
runs after returning to 390px; do not relabel this as axe coverage at every
viewport. The initial JSON does not preserve the collected axe incomplete
items. They should be retained in the final receipt/manual-review limits.
The `privateDraftsImported:false` summary is a source-scope assertion, not
a dedicated runtime detection implemented by the initial harness.

## SEO / linking lens — scoped PASS, subject to final corrections

- Explicit `relatedPrograms` and deal `program` references drive the join;
  no title matching, bank adjacency, assumed programme relationship or
  invented new editorial article is used.
- Data comes only from the existing public news, guide and deal
  collections. No `.council` draft import, new route, changed canonical,
  robots setting, headline/H1 or structured-author assertion is introduced.
- News keeps publication chronology. Guides display their own update dates
  separately; an update is not relabelled as a new news publication.
- Links use the current programme/canonical collection routes, real
  contextual transfer direction and existing card/calculator anchors.
  The supplied anchor probe requires unique destination IDs. Complete
  build/internal-link resolution still belongs to the final Technical gate.
- Empty coverage is not concealed with unrelated filler. The offer message
  explicitly distinguishes an unlisted offer from the absence of offers
  in the market. No indexing, CTR, ranking or traffic gain is inferred.

## Standards / Travel Section lens — scoped PASS

New strings are plain, practical and British-English compatible. There are
no fabricated fees, rates, award availability, first-hand experience,
commercial endorsements, reviewer identities or new source-verification
dates. The existing real/manifest-backed imagery and row components are
reused rather than inventing documentary pictures. The selection model
does not certify underlying current product/programme terms by repeating
existing headlines or showing a build-date-filtered offer. It is a curated
navigation layer, not a source refresh or new financial recommendation.

Programme/currency names and original article dates are retained; source
expiry edge case above must be fixed before calling this new curation safe
under its declared contract. No existing article's factual acceptance is
reopened or substituted by this layout review.

## Managing Editor / governance lens — scoped PASS

The feature brief correctly distinguishes authorisation to implement and
conditionally release from completed gates. Owner preview, genuine Council,
exact-head CI and production verification remain. News volume is not padded
or capped, and private article contributor/final-copy/COI holds remain. No
outreach, account/settings changes, provider spend or automated article
publication is introduced by the hub. The earlier concurrent PR530 merge
and advisory-parser limitation are recorded rather than reconstructed as
a successful prior gate.

## Technical / UX evidence limits

The helper filters invalid/future dates, archive flags and unmatched
references; sorting occurs after filtering, preserving input arrays. Unit
tests cover explicit relations, limits/ties/deduplication, empty states and
invalid dates. The new hub has no client framework/dependency, carousel,
fetch or animation. Native links, house tokens, visible focus rules and
responsive grid fallbacks are used. Those strengths do not waive the
reproducible expiry bug or observed mobile density.

Final root check/build/full tests, corrected source and browser receipts,
reviewed light/dark previews and actual release checks remain. This report
does not certify whole-site WCAG, physical iPhone Safari, VoiceOver,
real-reader task success, live deployment or traffic/revenue improvement.

Initial snapshot pins (before requested corrections):

- helper: `14b1c8633d225d5175235963d79b655e758d3eeca62c8c1c3d370c21bebd9780`;
- hub: `6e8c7a6fc991e8efa99b945b08bef5b627b32c4956474049d55527e038394bbf`;
- audit: `5e52069c661cc424f0828940ded015cf1526f6f595bd70331220242ff2254ff3`;
- supplied evidence: `86035a2a2ced781c6f2f9578f680a745d26718b5ca18241c1057678a234961f2`;
- Skywards light390 screenshot: `dc70035660613e85fbb566052cdd977c52bac3597624df8b6afdafab71106646`;
- Hyatt dark390 screenshot: `a92039559212cac0c158220ee60999c716e3e4e57d52a4c909e61f15771f08d1`.

State: return to root for the two corrections and final supplied receipts;
no Chairman or production approval supplied by this initial assessment.

## Superseding corrected-source and runtime review — 2026-11-10

**Both initial holds are resolved.** Re-read the full revised helper,
component, tests and audit source; read the fresh supplied evidence JSON;
viewed actual Skywards and Hyatt closed-phone screenshots in light/dark,
plus the desktop expanded Skywards composition. Independently re-ran all
six selection tests: six pass, zero failures/skips. The news test now also
executes the formerly missing timestamp/boundary cases; its test-count
number remains six because the cases were added to the existing test.

### 1. Mobile density — resolved

The duplicate “Understand the programme” action was removed. Up to three
remaining task links use two phone columns. One latest story stays visible;
earlier stories, separately dated guides and programme offers sit inside
an initially closed native “More from this programme” disclosure at all
widths. There is no scripted breakpoint toggle, hydration trick, forced
animation or automatic reopening. Entirely empty coverage avoids rendering
three empty sections. The outward-arrow cue is now a plain direction arrow.

The new actual supplied 390px records show the following **closed hub
height**, identically in both themes:

| Programme | Initial reviewed screenshot | Corrected measured hub |
|---|---:|---:|
| Emirates Skywards | approximately 1,473px | 755px |
| World of Hyatt | approximately 758px | 538px |

These are hub-element heights, not the full page's guide-start coordinate,
above-fold claims, a reader success rate or a physical-iPhone measurement.
The corrected phone screenshots confirm the materially shorter decision
surface and visible native disclosure. The guide skip action is retained.
Additional content is available by choice without requiring JavaScript.
This resolves the specific pre-guide wall-of-content finding; it does not
certify the whole existing programme article as a five-second reader test.

### 2. UTC timestamp expiry — resolved

`endOfUtcDay` now uses the source date's UTC year, month and day to compute
the next UTC midnight. It no longer adds 24 hours to the arbitrary time of
day. The corrected test uses `2026-11-10T12:00:00Z` and confirms inclusion
at 10 November 23:59:59 UTC and exclusion at 11 November 00:00:00 UTC. Existing
invalid/future/expired, original-date, explicit-relation, no-input-mutation,
archive, ordering, deduplication and empty-state checks still pass. Deal
selection retains the existing exact `expiresOn` instant contract.

### Metadata-only Hyatt joins — independently checked

Read both complete existing public article files and their actual diff:

- `world-of-hyatt-3000-bonus-points-every-three-nights-15-december.mdx`;
- `world-of-hyatt-new-hotels-double-points-25000-cap.mdx`.

Each is unambiguously about World of Hyatt and now adds only the explicit
`relatedPrograms: [world-of-hyatt]` relationship. Titles, prose, source URLs,
publication/stale dates and numerical wording are unchanged. This is
classification and recirculation, not a newly published story, fresh source
reading or acceptance of those historical terms as verified today. The
original 1/13 October dates remain visible in the hub, with the current-term
caution. In particular, the second article's secondary-source attribution
and unread-primary qualification were not silently removed.

### Actual supplied browser scope, without inflating it

The corrected `evidence.json` contains ten routes, two themes and 160
overflow/resize records at the stated phone, landscape, tablet and desktop
sizes. Every stored documentOverflow is false. It separately preserves
20 **390px expanded-hub** axe states, all reporting zero violations, and
the **color-contrast incomplete item in all 20 states**. Those incomplete
items remain manual-review limitations; there is no all-contrast or
whole-site WCAG certificate. Axe was not run at every one of 160 viewports.

The actual audit source now asserts initial closed disclosure state and
compact phone height, native Space open/close, unique anchor targets,
calculator deep-link opening, full-guide navigation, no-JavaScript native
extended coverage and zero collected page errors. Root executed those
browser checks; this reviewer reconciled the supplied final record and
viewed the selected images, not a second independent browser run or
physical Safari/VoiceOver session. `privateDraftsImported:false` still has
its narrower source-scope basis rather than a dedicated runtime detector;
the component imports only the public collections.

Element screenshots of a long expanded section may include the sticky
site header across the captured element after automated scrolling. Do not
mistake such a composite for a proven new live overlap defect or use it
as a clean whole-page owner preview. The closed phone views were directly
viewed and are suitable for showing this compact decision surface.

### Final scoped role conclusions

| Actual reviewer lens | Conclusion and limits |
|---|---|
| SEO Strategist | PASS: explicit reference joins, canonical existing destinations and preserved original metadata/dates; no ranking/indexing/traffic claim |
| Standards Editor | PASS: practical labels, honest current-term/empty-state language and no invented author, source-freshness or commercial claim |
| Travel Section | PASS for navigation/classification: Hyatt subjects match the two explicit references; no new financial/content acceptance |
| Managing Editor | PASS: private article/source/COI holds and no-outreach/no-paid/account-setting boundaries retained; genuine final release gates remain |
| Technical Lead | PASS for reviewed hub source/helper and the actual supplied local build/browser evidence; final full-suite/committed-head CI/deployment remain root-owned |
| Head of UX | PASS after edits within the viewed light/dark phone/desktop composition and supplied native/responsive checks; retain manual contrast/device/reader limitations |

This is substantive independent hub review by one named AI delegate, not
six human specialists, human editorial acceptance or Chairman approval.
This reviewer is still recused from independently approving the authored
measurement readiness tool, and has not reviewed the other delegate's
card-source or rolling-monitor implementation as part of this hub pass.

Corrected snapshot SHA-256 pins:

- helper: `b6899e8a1dabe996bbaaa036441d3c770260ccd20603caa7f71a3bc09f264cdf`;
- hub: `1f2a3ad7a4f08c7ab06898d520c8d0a92043a85b17d5a0f1b5cd7b43b79c0488`;
- audit: `64f4c52ca5ad57b75fd6eb06cb654bac07706027379d69972d9f8d5a69180639`;
- supplied evidence: `0071977e54bf0e193105e27cfb1efd8780665e5507ffd45a11db6630b184f85f`.

State: no blocking hub defect remains identified in this corrected scope.
Owner previews, final combined tests, exact-head validation/approved-body
Council, normal protected merge and actual canonical production checks
remain separate. No public file, external state or setting was edited by
this review; only this report was updated with preserved finding history.

## Programme-contents focus delta and performance gate — 2026-11-10

Independently reviewed the one-line post-review delta in
`src/components/ReadingContents.astro`:

```css
.dp-programme-contents a { scroll-margin-block: 8px; }
```

The `programme` variant alone assigns `.dp-programme-contents`; article
contents do not receive that class. No HTML, labels, destinations, event
handler, general article selector, focus-ring rule or breakpoint changed.
The actual built Skywards HTML contains the scoped 8px rule, not merely
unbuilt source. This is a narrow native focus-scroll correction, not a
new scripted scroll controller.

Root reported the earlier short-desktop failure: at 1440×390, the last
focused link ended at 390.468px. That failure is retained rather than waved
through with a tolerance. Read the actual registered
`reader-flow-programme.mjs`: its source has no diff from the inherited
audit and still demands the focused last link's entire bounding box be
within the viewport, with no fractional allowance. The supplied fresh
`programme-flow-evidence.json` reports successful completion across ten
programme routes, two themes and 140 resize states. The unchanged source
performs the short-height focus assertion in each route/theme, checks one
contents control, all target IDs, photo decoding/credits, native/no-JS
navigation, programme ordering and calculator disclosure opening.

This reviewer reconciled the actual source, compiled rule and supplied
receipt; root executed the browser run. The focused-link bounds are tested
by the audit but are not separately stored per record in that JSON. Do not
describe this as a second independent browser run, physical Safari or
universal keyboard/focus certification.

**Focus correction: PASS within those states; initial audit failure
resolved by a production CSS fix, not a relaxed test.** Earlier hub
selection, metadata, source/UX and editorial lens passes remain scoped.

### Overall Technical release remains PENDING

Root reports a current combined full-suite result of 1,213 passes. That does
not waive the separate performance gate. Root's local uncompressed lab
observations were 88/90 for the candidate and 90/90 for actual main; the main
sample ran concurrently with another browser audit. These observations do
not establish a causal regression, a controlled like-for-like comparison
or real-user performance. Both reported uncompressed above-fold weights
exceed 200KB; no transferred-byte budget closure is supplied by this review.

Stage as a **draft** only. A genuine current Cloudflare preview lab run
meeting the programme's 95+ mobile requirement, and an evidence-bounded
resolution of the relevant performance/weight checks, remain necessary
before overall Technical release approval. Older production 99 scores, the
passing source suite and successful hosting badges cannot replace that
current evidence. Owner preview, exact-head CI/approved-body Council,
protected merge and actual production verification also remain separate.
This reviewer does not clear those gates, measurements, spend or settings.

Post-review snapshot SHA-256:

- `ReadingContents.astro`: `2809014d0313d871831a1c47b56741c7c15c91a7fd2c22b30011b383fa594017`;
- unchanged registered audit: `7949246e363fec2e89dd0dafb80cecae5ffee5a6c1f21d2c8cfab360557125df`;
- supplied flow receipt: `f2db7b1d478e5c94dc4cef111b3fe012f4495a503e25e0f30b89213b83eb197a`.

Only this report changed during this delta review. Measurement recusal,
other delegates' source/monitor ownership and all prior manual/device,
article and no-contact/no-paid limitations remain.

## Superseding exact-style delivery and actual hosted Technical result — 2026-11-10

**The specific hosted programme performance HOLD is resolved for tested
candidate `a30c5a9a036a062ed8c8b48c370f0a5bef9b56ff`.** This section supersedes
the earlier pending performance disposition; it does not remove the earlier
failed measurements or certify production, every route's performance,
Chairman approval, owner acceptance or exact-head release gates.

### Independent production-source review and execution

Read the complete new `scripts/build/programme-style-delivery.mjs`, shared
pure-transform refactor, postbuild ordering and new tests. No blocking
source defect identified. The runner is restricted to ten explicit
programme routes, requires one actual canonical and matching programme
hub identity, consumes comments/raw-text before identity matching, rejects
invalid UTF-8, symlinked HTML/ancestors/assets/dist and paths outside the
real build, and detects input drift before beginning writes. All ten route
transformations and asset validations complete before any output write.
An output I/O failure still fails the build; this is not an atomic rollback
guarantee against a concurrently hostile process.

The shared validator preserves every complete compiled stylesheet at its
original cascade position. It rejects unsupported stylesheet attributes,
imports, namespace declarations, relative/external URL bases, unsafe raw
HTML, source maps and unreviewed escaped CSS syntax. Fonts, colour rules,
images, scripts, content and reusable CSS assets are not rewritten or
purged. The homepage's public helper contract is retained. Pagefind, CSP
and internal-link gates remain after delivery in the normal build chain.

Independently executed the eight new programme tests plus the eighteen
inherited homepage-delivery tests: **26 pass, zero failure or skipped**.
These include exact reverse/cascade/body/script equality, idempotence,
marker tamper, final-route identity failure before earlier writes, comment/
script/duplicate canonical traps, missing/invalid assets and symlinked
ancestors. Independently read fresh compiled output for all ten programmes:
each has exactly seven inline blocks, each byte-for-byte equal to its
corresponding retained compiled CSS asset and correct SHA-256 marker.
Root separately reports the fresh full suite of 1,221 passes, 338-page
build and 160 hub plus 140 reader-flow states; those are supplied execution
receipts, not a second independent full-suite/browser run by this reviewer.

### Actual hosted candidate and all six mobile runs

Root's authenticated Cloudflare inspection identified successful preview
deployment `57b1c153-cbf4-492f-ba9b-7a36a0a72108` for the exact candidate,
with actual URL `https://57b1c153.dubaipoints.pages.dev`. The GitHub hosting
check was still stale-pending when inspected; that pending badge was not
invented into a success. This reviewer independently read the actual
returned preview pages and ran the unchanged registered Lighthouse sampler
against that URL, after root finished its browser inspection and stopped
competing browser/build/CPU work.

Command parameters: the two reference routes, `--presets mobile --runs 3
--assert`, unchanged mobile performance minimum 95 and initial-transfer
maximum 200 KiB. Lighthouse 13.4.1, Chrome 157.0.0.0, default simulated
mobile configuration. Six navigations completed in 51.2 seconds; receipt
generated `2026-11-10T17:13:24.721Z`; exit status **0**. No run was discarded.

| Route / run | Performance | Simulated FCP / LCP / Speed Index | TBT | CLS |
|---|---:|---|---:|---:|
| Skywards 1 | 96 | 1,140 / 1,860 / 2,935 ms | 183 ms | 0.001164 |
| Skywards 2 | 95 | 1,618 / 2,285 / 4,455 ms | 7 ms | 0 |
| Skywards 3 | 99 | 1,567 / 2,116 / 1,567 ms | 0 ms | 0 |
| Hyatt 1 | 97 | 1,479 / 2,501 / 2,020 ms | 15 ms | 0.000530 |
| Hyatt 2 | 97 | 1,445 / 2,503 / 1,445 ms | 10 ms | 0.000530 |
| Hyatt 3 | 98 | 1,434 / 2,363 / 1,434 ms | 0 ms | 0 |

All six individual performance scores meet 95. Median performance is
**96 Skywards / 97 Hyatt**, compared with preserved earlier hosted baseline
90/92/91 (median 91) and 95/88/88 (median 88). This is a source-isolated
before/after hosted comparison, not randomised field evidence: hostnames,
network timings and test times differ. It does not establish a future
user's score or a site-wide traffic/conversion benefit.

The registered summary selects the middle run **by performance score**;
its associated LCP is 1,860 ms for Skywards and 2,503 ms for Hyatt, not the
median of the three LCP numbers. Their mathematical median LCP values are
2,116 and 2,501 ms. Selected initial-transfer proxies are **118 / 181 KiB**;
all full-request transfer totals are also below 200 KiB (Skywards about
174.6 KiB, Hyatt about 181.0 KiB). The smaller 118 KiB proxy excludes
resources finishing after the selected LCP; it is not a literal first-screen
asset census. Every LCP node remains the existing programme hero image.
No failed network request was reported. Accessibility and best-practices
categories score 100 in all six runs; this is not whole-site WCAG proof.

Seven CSS fetches per route are removed; total observed requests are nine
Skywards/eight Hyatt. Exact inline styles add around 31 KiB of compressed
HTML compared with separate documents, and repeat those bytes rather than
reusing warm shared-CSS cache across programme visits. This trade-off is
retained, not claimed away by the cold-load lab result. No font/hero/palette
or tracking setting was changed to obtain the score.

The delayed-paint anomaly is not fully eliminated: Skywards run 2 still has
observed FCP/LCP 2,694 ms despite load at 1,236 ms. Other observed LCPs were
1,858/495 ms for Skywards and 1,121/593/366 ms for Hyatt. Therefore this review
does not assert a proven cause or cure for every earlier delayed-paint
state. Passing the declared hosted lab gate is the bounded conclusion.

### Hosted content/CSS identity and the earlier stale local Hyatt build

After the speed run, independently fetched both actual baseline and
candidate pages plus all seven baseline CSS assets. For both routes:

- candidate body bytes equal the actual hosted baseline and fresh local
  built body;
- the seven inline CSS blocks equal the actual baseline's complete CSS
  bytes, SHA-256 pins and original stylesheet order;
- replacing only the programme inline blocks with their original link
  tags reproduces the **entire hosted baseline HTML exactly**.

Skywards body is 81,946 bytes, SHA-256
`857b161ec8ca9facd0b53750a920efdceb63cd4fc947a04273a8cdc85f6d52b4`.
Hyatt body is 68,777 bytes, SHA-256
`69d2d4ad24793eb2673a8d7381bd0341c5ecffcfcbe2b794d5617b0d1b080b0f`.
The two existing Hyatt news joins are present in this final-content build.

The earlier disposable local A/B used an older built Hyatt page with an
empty latest-news state (81,378-byte full HTML versus actual baseline's
86,953). It was mechanically valid for those two disposable copies but
**not final-head Hyatt QA or hosted evidence**. It was not used to clear
this HOLD. The fresh hosted/body equality above closes that identity gap.
Earlier failed hosted measurements remain under their original directory.

### Preview SEO 69 — diagnosed, not a production indexing failure

Direct HTTP reads confirm both preview hosts send `X-Robots-Tag: noindex`.
For both routes and all three new runs, the only weighted failing SEO
audit is `is-crawlable`, naming exactly `x-robots-tag: noindex`; all other
weighted SEO audits pass. Both hosts retain their correct canonical URLs
on `https://dubaipoints.ae/` and a CSP header. The preview-only noindex
explains 69; production indexing/header validation remains part of the
post-merge canonical-domain check and is not certified by a preview.

### Result, receipts and remaining release boundary

**Technical Lead scoped PASS for the reviewed exact-style implementation
and actual hosted reference-route performance gate at a30c5a9.** Earlier
hub/source/editorial/UX conclusions retain their stated manual contrast,
physical-device and real-reader limitations. This is one AI delegate's
substantive review, not human sign-off. Measurement-tool recusal continues.

Owner preview/acceptance where required, genuine final Council/Chairman
approval, executed exact-head PR validation, normal protected merge and
actual production deployment/QA remain root-owned, separate gates. A green
advisory Council parser is not substituted for any substantive approval.
No publication, merge, deployment, paid call, outreach or account setting
change was performed by this reviewer.

Fresh receipt files are under `audit-output/lighthouse-hosted-programme-inline/`:

- `lighthouse.scores.json`: `5ad2a7761276fbc459818b151129a6f89092923b444cc6b02f28f33688647474`;
- `identity-receipt.json`: `a0aa0e4bdeb2707036fb38df5b23b9093a86b01a3b49ae10991e6a9c9688a98b`;
- Skywards runs 1/2/3: `643449c35ab0195acc47c4c09c4ca7bb6c75664acfe5f429878aa8af1eb0332a`,
  `de311dc2b592983572d8df63bb7f029755d2ee3e06f66e95b4f0f844dac11d1e`,
  `f15d732a401361d2d0b2a68b1505602cb17f22f6897cefbd83d50567698b6c8c`;
- Hyatt runs 1/2/3: `45409025fa2a0091d55f01c97e8dc9010c7192c64b4873e88383d8e7ab0c4e86`,
  `10f76671e151cbe5ca24790cf059239e5a40b8d729ffe1aee9e080f6b1485ba8`,
  `e4159896178bb7644f1ad1ce11dd514436f2bc82cee19410980a388c923362a6`.

Reviewed source pins:

- programme runner: `c0c36e0694bbe810a30c4b66161eb61f7d894b765be7fe2ced341899370b40e8`;
- shared/home helper: `17b7ea7064828b7c9e5a55d852ea1aec3dc7d540bbdbd2d0926c7e6f83063ebb`;
- new programme tests: `150618a5ffabd3fad54a648f38409332234c66061c5c168a639daa4d48ab5434`.
