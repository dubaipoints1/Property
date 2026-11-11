---
title: First-card guide mobile stylesheet delivery
tier: T3
technical-status: pending-hosted
chairman-status: pending
---

# First-card guide mobile stylesheet delivery

The owner authorised a separate performance PR for the first-card guide and a later Starting Points release only after mobile reaches 95 and Council signs off. The existing homepage hero is protected; Trip.com stays pending.

On the prior Starting Points preview the first-card guide measured a three-run Lighthouse mobile median of 90 (86/90/96); the then-current production guide measured 84 (82/85/84). Lighthouse identified the introductory paragraph as LCP and seven render-blocking stylesheet requests. These are lab results on different hosts, not field speed or a causal before/after comparison.

This change targets only `/guides/expat-starter-first-credit-card/`. The postbuild pass reuses the existing exact compiled-CSS validator and programme runner's file checks. It substitutes each complete stylesheet in place without editing rules, relocating preloads, or touching body, images, tracking, metadata, CSP policy, shared assets, any other route, or the homepage. The existing programme allowlist is unchanged. Larger compressed HTML can cost more on repeat visits with a warm stylesheet cache; removing requests is not a field-speed claim.

Release evidence required: deterministic exact-route and fail-closed tests, full build and test suite, reversible body/metadata/script and retained-output equality, responsive light/dark visual parity, exact hosted mobile score ≥95 and initial transfer ≤200 KiB, executed exact-head CI and Council. After protected merge, verify the production deployment and canonical guide. Reconcile and verify Starting Points separately on the resulting base.
