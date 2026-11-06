---
slug: home-style-delivery
vertical: travel-experiences
assigned-editor: travel-experiences-editor
tier: T3
draft-status: implementation
tech-status: pending
chairman-status: approved
---

# Homepage stylesheet delivery — appearance-preserving experiment

## Authority

On 2026-11-06 Mostafa answered “Yea do it” to a focused CSS/font-loading
performance pass before merging PR518. Current baseline9d9208a is pushed,
not merged. Hosted mobile Lighthouse scored86 against95 target, with100
accessibility/100 best-practices; preview indexing is intentionally blocked.

## Bounded implementation

Postprocess ONLY built index.html after internal pruning, before Pagefind
and CSP. Replace eligible compiled local stylesheet links at their exact
positions with the complete same CSS bytes. Keep all external CSS assets,
all interior HTML, metadata/body/scripts, theme order and fonts unchanged.
Fail closed on unsupported links/paths/semantics or unsafe/unhandled CSS;
no async/onload styling, extraction/pruning, CSP change or new dependency.

Three current CSS requests total178,123 raw bytes. Inlining changes current
home HTML from81,768B/gzip14,463 to about259,748B/gzip45,909. Cold combined
HTML+CSS bytes are similar, with fewer blocking round trips; repeat-home
HTML grows and cannot amortise that embedded CSS through shared-file cache.
This trade-off requires actual hosted testing, not a promised score uplift.

## Acceptance

- Exact CSS content/cascade and non-style HTML remain identical; every other
  public page is unchanged by the transform. Asset URLs resolve and CSP stays.
- Unit adversarial/idempotence/path/URL/order guards; check/build/full tests,
  all322-route metadata/schema/previous-anchor invariants and exact-head CI.
- Actual light/dark/phone/laptop/short-window, noJS, theme/focus and scroll-only
  video checks; retained selected composition and provenance.
- Repeated clean-profile hosted mobile Lighthouse,95 target and200KB
  above-fold transfer budget (not raw HTML size); one interior hop observed.
- Existing physical Safari/native-scrollbar and other runtime holds remain
  independent. This approval does not waive them or permit admin bypass.

## Review allocation

aperture_production_build owns the build transform and package hook;
release_technical_review independently owns adversarial tests/review;
release_council_editorial applies SEO/Standards/factual integrity rubrics;
root owns builds, browser/performance evidence and release coordination.

No financial data/formulas/rankings, editorial facts, palette/type identity,
assets/manifests, analytics, credentials, paid calls or commercial activation.
