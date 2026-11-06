---
slug: home-style-delivery
convened-by: technical-lead
tier: T3
status: candidate-pending-hosted-performance
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
