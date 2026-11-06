---
slug: speed-coverage-utility
tier: T3
status: implementation-phase-1
---

# Ordered implementation — 2026-11-06

Owner authorises loading speed, card refresh/expansion, then five native
21st-inspired utilities, with testing before release. Brief:
`.council/briefs/2026-11-06-speed-coverage-utility.md`.

New owned branch `codex/speed-coverage-utility` starts at 252c836, based on
current main 651fb05. Original shared checkout and held PR #518 remain
unchanged. Full CLAUDE blob is unchanged from the authority already read.

Frozen pre-change built site copied to
`/private/tmp/dubaipoints-implementation.UQUeSa/baseline-dist`, served at
http://127.0.0.1:8100/ for actual before/after checks. This is the held
candidate's build, not a claim it is live. Prior live report remains separate.

Phase 1 ownership: CSS agent owns BaseLayout/global and new CSS delivery;
font agent owns new font proof/artifacts/CSS/URL module, coordinating layout
integration with CSS agent; root owns image/media delivery and all builds /
browser actions. Source preparation only runs concurrently for Phase 2.

Pending owner choices: GA loading timing (maximum three-second delay versus
immediate) and prevention of merge-triggered paid full-bank refresh. No answer
or silence is treated as permission to make either change.

No new tests, build, preview, data refresh, code push, merge or live deployment
has yet been claimed by this session. Append actual evidence as work proceeds.

## First implementation checkpoint — 2026-11-06

The first loading build/check passes. Cached homepage shared CSS is 44,093 B
instead of the full 124,755 B bundle, at the same cascade position; the two
other stylesheet links remain. The compiled asset has no unresolved Tailwind
directives. The rejected blanket inline path is no longer the active CLI.
Full interior CSS remains byte-identical to the frozen baseline; the route
transform touches only the homepage. Shared font preloads legitimately change
on interiors too, so do not claim all interior HTML bytes are unchanged.

Same-axis, same-name variable-font subsets save 27,052 raw bytes:
152,004 → 124,952 B. Original Fontsource faces remain the Unicode fallback.
Real HarfBuzz comparison covers 90,656 strings / 13,303,418 glyphs over the
recorded 322-page corpus, every-page representative windows and listed weights
and features. Canonical-composition/bidi closure is retained; the naive
composition mismatch was fixed, not waived. The private regeneration and
exact `--check` succeed. Existing public OFL notices ship byte-identically;
an independent review's premature missing-notice finding was corrected after
checking `public/licenses/fonts/`, and a regression guard now covers it.

Root's first actual Chrome before/after heading geometry matches at 390/768/
1440 widths, with no measured root overflow or initial video source. Tiny
under-0.5px card-image aspect-ratio rounding changes are recorded separately.
The desktop menu opens/dismisses by Escape; direct Latest jump leaves video
source absent. A subsequent PageDown/Up loads and reverses the decoded reel.
These bounded observations do not close native-scrollbar, physical Safari,
whole-site, no-JS, contrast/zoom or media lifecycle acceptance.

First matched **uncompressed local** Incognito mobile Lighthouse pair:
baseline 86, LCP 3,605 ms, proxy 485.6 KiB; candidate 91, LCP 3,163 ms,
proxy 367.4 KiB. Both accessibility/best-practices/SEO 100; TBT zero.
Candidate CLS 0.021 versus baseline 0.013. These are single local observations,
not repeated CDN/production-tag acceptance or proof that the 95/200 KiB
targets pass. Raw JSON and geometry/screenshots are in the session directory.

Responsive card delivery uses existing approved art, actual 360/720/original
widths and truthful grid-slot sizes. Smaller originals are not upscaled into
invented resolution. ADCB365's 299px and FAB Etihad Infinite's 254px originals
still need genuinely higher-resolution issuer assets separately. Save-Data,
where supported, now opts into the complete static hero and detaches video;
it is not Safari Low Data Mode certification or a universal reel byte budget.
AVIF poster delivery is an additional same-source progressive format, before
unchanged WebP/JPEG fallback; final build/runtime checks are still pending.

Independent source reviews: `release_council_editorial` reviewed font notices,
identity, source/provenance, unchanged financial/content boundaries and CSS
section equality; `release_technical_review` independently reviewed route CSS,
card delivery and Save-Data after implementing the separate font work. Their
passes are bounded source reviews, not approval of their own implementations
or production performance. Incremental AVIF review remains separately pending.

Local full suite checkpoint: 788 tests, 787 pass, one unchanged macOS Bash3
`automation-state.sh` empty-array failure, no skips/cancellations. Later AVIF
focused checks pass 19/19; exact final-head full Linux CI remains required.
Official local 21st review: controller 1 supported file / zero findings;
Astro 0 supported files is not a pass. An initial `--help` invocation actually
scanned the whole project (185 files / 373 findings, including fixture strings
and token definitions); it is not represented as a clean full-site certificate.

## Source preparation and utility plan — not data/UI publication

The manual public-source reader gains an explicit off-by-default archive
option: bounded decoded response bytes, full deterministic extraction, hashes,
parser dependency identity, timestamps/status/redirects, separate transport /
extraction / usability flags, and seven-day Actions evidence. No paid API,
canonical data write, repository write, scheduled activation or form submission.
Independent review found compressed-IPv6 classification, partial206, JS-shell
usability and parser-identity gaps; these were fixed and independently rechecked.
Reader/archive tests pass 22/22. Real issuer transport/capture is not yet tested.

Private source pack: 58 existing records, 56 uniquely named intake candidates,
181 distinct HTTPS source URLs in max-ten batches. Candidate is not verified
or a published addition. Amex charge/currency and relationship-only eligibility
must not be forced into required AED/numeric fields with invented zeros.
Private Phase3 plan maps the five native utilities and the existing explicit-
selection overwrite/URL-parser collision; no Phase3 production UI is written.

Both owner choices remain pending. Analytics and paid scrape-on-main trigger
are unchanged. No new push, remote CI, preview, merge or live deployment is
claimed by this checkpoint. Keep the release held; production is unchanged.

## Frozen loading draft ready for protected CI — 2026-11-06

Final AVIF build/postbuild succeeds: 320 requested local derivatives, 322
indexed public HTML pages, 22,743 resolved internal links, unchanged 17 CSP
hashes / 1,319-character header, same 44,093 B cached home CSS. Native Chrome
at 390×844 actually selects the 1200w AVIF and decodes it; both themes retain
the opening geometry and absent video source. Mobile menu opens/closes and
theme switching leaves video source absent. Forty-eight additional bounded
render states across eight interior families, phone/landscape/desktop and both
themes show no measured document overflow, completed broken image or home-only
delivery marker. This is a family smoke check, not complete-site task QA.

Independent incremental AVIF source review passes. The copy is lossy, not
pixel-identical; same-source composition, fallback and rights are preserved.
Actual hosted MIME/cache, high-density requests, repeated performance and
physical Safari remain open. Root's preliminary single-frame FFmpeg SSIM
trial reported 0.989840 but warned about mismatched timebases; it is NOT an
accepted visual-quality certificate.

Font evidence is regenerated and exact-checked against the final stable
current 322-page dist. Binary/licence bytes and mtimes stay unchanged; only
the manifest's UI-source fingerprint advances to f8cd5b85674cc4f442aa35c2540d175054bad3aff18dd2813553b0366f0da87e.
Nine focused font checks pass. Private proof: `/private/tmp/dubaipoints-font-final.7yq6A2`.

Next: push this draft for genuine Linux CI, hosted preview and the separately
reviewed bounded manual source capture. Do not merge, enable auto-merge or
activate the paid scrape pipeline. Stage2 canonical data and Stage3 UI remain
unimplemented pending loading acceptance. Owner GA/cost choices are still open.

Final local frozen check: zero errors/warnings, four pre-existing hints.
Full 792-test run: 791 pass, one unchanged Bash3 automation-state failure,
zero skips/cancellations. This is not a full-suite pass; Linux CI must execute
the same test on the pushed head. No canonical data/content/dependency/paid-
scrape trigger diff is present.

Before first push, the cached-diff check caught four new files with an extra
EOF blank line, which an earlier unstaged-only check had not covered. The
unpublished first commit4689852 was followed by a narrow corrective commit,
not represented as a clean first check. All four now end with one LF; README
also distinguishes generated font assets from manifest-derived CSS/module.
Generator behaviour/binaries/manifest are unchanged. Focused font/CSS27checks
and exact private font `--check` pass. Full staged and main-diff whitespace
checks must pass before the push.

## Verified held handoff — 2026-11-07

Functional/remote head: a1a3436ba6edda53dc1e8776ebad5c65d4f5e932, draft
PR https://github.com/dubaipoints1/Property/pull/519 . Auto-merge is off;
main read-back remains 651fb0506cc03f5821e0d28659043c57eee76062. No merge or
production mutation. Push and PR Linux runs 42282486089 / 42282622587 both
genuinely execute check/build/tests successfully. Exact push log: 792 tests,
792 pass, zero failures/skips/cancellations. Council jobs execute but remain
advisory; substantive final acceptance is not closed.

Cloudflare preview https://ab89c54e.dubaipoints.pages.dev/ deploys successfully.
Root observes both themes, actual AVIF decoding, no initial video source and
no production-tag scripts. Chrome viewport override is reset; held preview
tab is retained. Proof image `hosted-desktop-light.png` is shown in commentary.
Physical Safari, native scrollbar and full final task/accessibility/media
acceptance are NOT certified.

The full local geometry census now has 322 routes × 3 sizes × 2 themes =
1,932 records. No measured root overflow, visible completed broken image,
missing headline or wrong homepage-only CSS marker. An initial hidden
desktop-only transparent placeholder finding was explicitly rechecked as
display:none / zero rectangle and retained as a reclassification, not erased.
This is geometry/completed-image smoke coverage, not all interaction states.

Two clean hosted mobile runs score 93 / 93, LCP 2,865 / 2,864 ms, TBT 0,
CLS 0.031, transfer proxy 235.8 KiB each. Targets 95 / 200 KiB still fail.
Both accessibility/best-practices 100; preview SEO 69 is intentional noindex.
No GA/CF tag requests appear. Do not call this live performance or claim a
three-run median; production analytics cost remains unaccepted. Raw files:
`hosted-mobile-01.json`, `hosted-mobile-02.json`, `phase1-census.json` under
`/private/tmp/dubaipoints-implementation.UQUeSa`.

Source runs 42282685935 / 42283892186 capture twenty bounded public documents.
All sixty evidence files match manifest bytes/SHA; nineteen have readable
output. ADCB365 product403 is incomplete. No canonical card values/dates,
card count, MDX, monitor/scraper registry or new utility production UI changed.
The private deterministic diagnostic and reconciliation plan remain separate
from accepted data changes. Conditional eligibility, unit/VAT/table attribution,
malformed numbers and protected values must fail closed. Fifty-six candidate
names and 181 planned URLs are not a finished refresh or market census.

SkyNet status and decisions updated on 2026-11-07, raw read-back verified with
same IDs/names/text-markdown MIME/parents and all original history/Claude QA.
Status: 108,032 B / 487 LF / SHA256
26d9093120a1c4ba160aca7cbd504464ecaf1d63faf7e6c567571ab1febc80eb.
Decisions: 79,041 B / 453 LF / SHA256
654940114a7cd3475897bf5352fabc8e359f26a3c55aa4c83817c43f7499f94f.

Next action: owner answers the two pending GA-timing / paid merge-trigger
choices. Both controls remain unchanged; no paid calls or worker activation.
Continue optimisation and source-backed data/UI stages only within authority;
do not merge on the advisory green job. This handoff is a local records-only
follow-up; it does not invalidate the separate exact functional-head evidence
and is not itself a fresh hosted performance certification.
