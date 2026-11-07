---
slug: home-style-delivery
convened-by: technical-lead
tier: T3
status: held-performance-and-device-gates
---

# Appearance-preserving homepage CSS delivery — 2026-11-06

Owner approved the focused loading-path pass with “Yea do it”, after the
held 9d9208a candidate scored 86 mobile performance against a 95 target. This is
not a waiver of remaining device/runtime, budget, Council or exact-head gates.

## Implemented and reviewed

Only scripts/build/home-style-delivery.mjs and the package postbuild command
change behaviour. All three compiled homepage stylesheet links are replaced
in place by exact CSS bodies. No raw CSS, font identity/face/preload, content,
image, theme/analytics/CSP setting or dependency change. External CSS remains
available and all interior HTML is outside the write scope. Theme script
order stays intact. No async/onload trick or JavaScript styling dependency.

Builder: aperture_production_build. Independent Technical reviewer:
release_technical_review, owning adversarial tests. Editorial reviewer:
release_council_editorial, applying source-integrity/SEO/Standards/Section
rubrics, not claiming a runtime/performance pass. Root owns rendered evidence,
check/build/full tests and hosted verification.

Guards validate safe local hashed assets, link semantics, UTF8, real paths,
symlink exclusions, complete CSS, relative/external URLs, imports, source maps,
raw-text terminators and verified idempotence markers. Review found escaped
CSS at-keyword/function and image-set string-URL gaps; both were corrected
and regression-tested. Current Tailwind selector escapes are retained exactly.
All validation/reads precede the single generated-index write. No protected
source, asset or interior file is writable through the runner.

## Actual local evidence

- Check: 197 files, 0 errors, 0 warnings and 4 existing hints. Final
  build/Pagefind/CSP/link check pass: 322 indexed pages, 9,434 words,
  17 script hashes and a 1,319-character CSP. 22,740 resolved links versus
  22,743 before is exactly three removed CSS hrefs.
- Final full local suite: 757 executed, 756 pass, 1 failure, no skips or
  cancellations. The failure is the unchanged macOS Bash 3 automation-state
  test (`parent_args[@]: unbound variable`); it is not waived. Exact-head
  Linux CI must execute successfully.
- Actual 3 inline CSS bodies equal retained asset bytes and SHA markers in
  the same order; non-stylesheet HTML is byte-identical. CSS: 178,123 B;
  home HTML: 81,768 → 260,161 B. Fingerprint:
 `b2116ed852549b6435db1e81585d3641da0239c1ee83feed74de584fbfa4b81c`.
- Static baseline: 322 routes / 19 families; zero metadata/schema/previous-anchor
  issues. Unselected/internal pages remain pruned, noindex and sitemap-excluded.
- Ten actual before/after browser states: 390×844, 430×932, 844×390, 1440×687,
  1440×900 in light/dark. All measured geometry/type/styles/actions match.
  9/10 full fingerprints match; sole difference is browser-selected existing
  960 versus 1200 WebP in light landscape, not a CSS/layout change. No overflow
  or resize-triggered video source. Four screenshot pairs differ by 0.4101%,
  0.2109%, 0.0222%, 0.1724% of pixels above 8 RGB levels; not a pixel-identical claim.
- Actual phone 390×844 no-JS after embedding: 3 inline styles, Newsreader 500,
  complete H1/deck, 48 px #tools/#latest actions, no overflow, static poster and
  no video source. JavaScript restored afterwards; enhancement returns without
  attaching media. Independent 31 focused tests passed (delivery 11, CSP 13, hero 7).
- Official 21st scan of the MJS helper reviewed 0 files; its 0 findings are NOT a
  review pass. Source/unit/browser checks are the relevant evidence here.

## Trade-off and unclosed gates

Embedding complete CSS removes three blocking requests but increases the
repeat-home HTML transfer (~31.4 KB gzip in the source experiment) and cannot
reuse shared-file cache for those embedded bytes. Combined cold HTML+CSS
payload is similar; no speed uplift is presumed before hosted measurement.
Other pages retain their cached external stylesheets. Observe an interior
hop and measure actual transfer weight, not raw 260 KB HTML alone.

Hosted repeated mobile 95, 200 KB above-fold transfer budget, exact-head Linux
CI and physical Safari/native-scrollbar/remaining runtime checks are not
closed by these local results. PR #518 remains draft / auto-merge off until actual
release gates close. No admin bypass, merge or production deployment here.

Evidence: `/private/tmp/dubaipoints-css-delivery.WNh994`.

## Hosted result — release held

Functional candidate `9b2e2db0c6902a5b12c5a940e9e7100744150a24` passed
genuine executed Linux validation run 42195793007: check, build and all 757
tests pass, zero failures/skips/cancellations. Council workflows also execute
successfully but remain advisory; Technical/UX/Managing Editor acceptance is
not granted by a green workflow.

Cloudflare's first deployment a353d409 failed after successful build/upload
with `Failed to publish your Function ... Unknown internal error occurred`.
One dashboard retry recovered on the same head. Successful preview:
https://7f7823ce.dubaipoints.pages.dev/ (deployment
7f7823ce-be29-47e3-8a66-fd051d30395b). This is not production.

Three native DevTools Incognito mobile navigation reports, Lighthouse 13.4.1
/ Chromium 155, Moto G Power / simulated Slow 4G, storage reset enabled:

| Run | Performance | FCP | LCP | CLS | Pre-LCP transfer proxy |
|---|---:|---:|---:|---:|---:|
| 1 | 89 | 2,414 ms | 3,296 ms | 0.030 | 290.7 KiB |
| 2 | 95 | 1,978 ms | 2,573 ms | 0 | 290.8 KiB |
| 3 | 94 | 2,030 ms | 2,839 ms | 0.013 | 290.7 KiB |

Median performance is 94, below 95. Transfer exceeds 200 KiB in every run.
Timing values above are rounded from saved raw JSON. TBT is zero in all three. All score
100 accessibility and best practices, 69 SEO from intentional preview noindex.
Do not remove preview exclusion or describe those automated scores as a
complete accessibility audit. Existing audit helpers compute this transfer
proxy from requests completed before modelled LCP; it is not an exact
viewport census or field measurement. Production analytics are absent on
preview, so this cannot certify production with its tags.

The LCP element is the poster. The raw report has no remaining render-blocking
CSS items. In run 1, fonts transfer 156,971 B (52.7% of 297,715 B), homepage
document 49,174 B, three below-fold cards 49,218 B, poster 32,544 B, scripts
7,667 B and other 2,141 B. Cards already use native lazy loading; Chrome's
prefetch distance explains their early fetch. Replacing them with JS-only
placeholders is not accepted as a way to manipulate the proxy. An actual
home-to-News hop retained external CSS, no homepage markers, no measured
root overflow and no broken completed images. Cache-transfer timing for that
hop was not separately quantified. JS was restored and viewport reset.

Private font feasibility (not site integration): current Fontsource OFL files
declare no Reserved Font Names; modified copies still require applicable
copyright/licence retention. Three same-axis variable WOFF2 subsets reduce
152,004 raw font bytes to 95,392 (saving 56,612 B), insufficient for the
92,915 B run-1 gap. Private glyph/weight comparisons found no outline changes,
but complete shaping equivalence is not certified. Static italic 400 plus
two variable subsets saves 82,324 B, still 10,591 B short and fails some name/
raw-metric invariants. Reject that option. No font assets, source/dependency
or production changes from the experiment. Report/commands/hashes:
`/private/tmp/dubaipoints-font-subset.NLNM3x/report.json`.

The prior single-run 86 is not a matched repeated baseline; no causal eight-
point uplift or conversion effect is claimed. Retain draft / auto-merge off.
Performance, production-tag impact, physical Safari/native-scrollbar and
remaining runtime/contrast/zoom gates remain open. The next pass needs a
combined, visually verified payload plan, not a typography substitution or
budget waiver. This entry records a failed acceptance gate, not a live release.
