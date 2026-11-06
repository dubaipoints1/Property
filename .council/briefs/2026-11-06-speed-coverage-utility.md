---
slug: speed-coverage-utility
vertical: business-realestate
assigned-editor: business-realestate-editor
tier: T3
research-status: in-progress
seo-status: pending
draft-status: implementation
factcheck-status: pending
tech-status: pending
chairman-status: approved
target-publish: pending-acceptance
---

# Loading speed, sourced card coverage and decision utilities

## Authority and sequence

Mostafa, 2026-11-06: “Ok do it all. Fix the loading speed first, refresh and
expand the card coverage, then add those 21st improvements. Test everything
before making it live.” This approves implementation and eventual normal
protected release after evidence, not bypassing Council, data, browser or
performance gates. Retain the selected Journey Aperture / Cool Editorial
identity, Newsreader/Geist, copy, ordinary scrolling and light/dark behaviour.

Work is on `codex/speed-coverage-utility`, based on held PR #518 head
252c836 and rebased on main 651fb05. Original shared checkout is untouched.
Earlier release histories and rejected experiments remain intact.

1. Loading-path implementation and measured acceptance first.
2. Reconcile/reverify existing card data and add qualified new products.
3. Implement the selected native 21st-inspired utilities.
4. Combined regression, data/Council review, owner previews and protected
   release. Source preparation may run in parallel; data/UI changes do not
   silently leapfrog the loading pass.

## Current evidence

Fresh live homepage lab run (one Incognito mobile navigation, not field data):
70 performance, 6,135 ms LCP, 540,010 B completed-request-before-modelled-LCP
proxy. Google tag 180,962 B; fonts 157,458 B; JPEG poster 90,927 B; three
blocking CSS responses. Prior preview median 94 omitted production tags and
does not certify live performance. Raw evidence:
`/private/tmp/dubaipoints-coverage-speed.E8Ls6j/live-home-mobile.json`.

Current inventory is 58 records / 57 active, not a market census: ENBD 30,
ADCB 11, FAB 4, Liv 2, ten other issuer/brand buckets one each. Existing
fixed-URL refresh is not new-product discovery. Source-read and recorded
editorial-review dates need separate reconciliation; old dates do not prove
no recent human activity. No fee/rate/salary may be LLM-extracted.

## Loading scope and constraints

- Smaller synchronous cached homepage CSS assembled from explicit semantic
  source sections; preserve cascade and complete no-JS styling. Replace the
  failed blanket-inlining experiment, not with async CSS or generic selector
  pruning. Interiors retain complete delivery until separately verified.
- Same-axis variable font subsetting only with source/output identity,
  licence, glyph, shaping, hinting and metric evidence; original faces remain
  fallbacks outside the exact subset ranges. Rejected static italic is not
  an accepted shortcut. No new font family, optional display or dependency.
- Responsive delivery from existing approved image originals, retaining
  ratio/credits/provenance. No invented issuer art or JS-only placeholders.
- Separate scroll-video data/seek budget from initial load. Retain source-
  absent initial state, actual-scroll initiation, reduced-motion and static
  fallbacks. No new footage, paid generation or browser scroll hijacking.
- Analytics stays unchanged pending the owner's explicit timing choice.
  Proposed after-critical-content load, maximum three-second delay, still
  without requiring scroll; very short-visit measurement trade-off disclosed.
  No Google account, consent or other service-setting change inferred.

## Card scope and cost gate

Prepare free direct primary captures using the existing `fetch-sources`
reader, retaining source URL/time/raw bytes or text/hash and traceable regex
evidence. Reconcile protected values only through an explicitly reviewed
field-level change; do not blindly override provenance or just bump dates.
Keep L2 financial attributes and L3 editorial prose separate.

Qualify active UAE products, closed/invitation-only status, product/brand versus
legal issuer and charge versus credit cards. Expand under-covered existing
issuers, then missing brands using product, KFS, fee and reward terms. No
invented values, inflated duplicate counts or unlicensed imagery. No arbitrary
market-total promise; declare captured/reviewed/blocked coverage explicitly.

Current scraper/config edits trigger a paid full-bank run on merge. Do not
activate it or paid Firecrawl/monitor provisioning without authority. Owner
has been asked whether to remove only that merge-triggered paid run while
retaining manual/monitor/scheduled refreshes. Until answered, source prep is
free and those controls are unchanged.

## Utility UI scope

Adapt the already-researched interaction patterns in the existing native
Astro/Preact/house-token idiom; no unresolved-licence source copying or new
React/Framer/Radix runtime solely for these controls:

- Reader-selected comparison tray for up to four cards.
- Differences-only view preserving unknowns, VAT/units and comparability.
- Removable applied-filter summaries.
- Mobile filter drawer with real no-JS access, focus/escape/scroll ownership.
- Optional guided Finder with editable steps and a direct full-controls path;
  no forced signup or new sensitive-data telemetry.

Reuse existing Pagefind, manual rails, reading aids and motion primitives.
Reference listings: Spec Sheet, Leads Data Table selected-row action bar,
Filter Token Bar, Drawer and Multi-Step Form. Metadata was researched; it is
not original-code/runtime/licence clearance. New light/dark previews are shown
before release. No unselected palette or full-homepage redesign.

## Acceptance

- Check, full tests and production build/postbuild plus genuine exact-head
  CI with executed steps. No skipped/outage-cancelled green substitute.
- Real rendered route-family checks, responsive/short-window light/dark,
  keyboard/touch/focus, no-JS, reduced-motion, 200% zoom/contrast and media
  lifecycle tests; clearly qualify unavailable physical Safari checks.
- Repeated matched mobile Lighthouse with actual production-tag cost covered,
  95 target / 200 KiB historical proxy; disclose full transfer and analytics
  timing, not just a score or raw HTML size. No promise of causal uplift.
- Numeric source/parser evidence, editorial/provenance reconciliation,
  source coverage, artwork rights, metadata/schema/link invariants and truthful
  coverage/freshness wording. No false “all cards refreshed” claim.
- Substantive T3 review and normal protected merge only after required gates.
  Existing device/scrollbar ambiguities are not silently marked passed.

## Allocation

Root coordinates source authority, imagery/media, browser/build/performance,
GitHub/release and SkyNet. `aperture_production_build` owns CSS delivery then
scoped UI work. `release_technical_review` owns font proof/artifacts before
independent cross-review. `release_council_editorial` prepares primary-source
intake; later review allocations must be recorded honestly. An implementer
does not independently approve their own work.

Evidence/workspace journal: `/private/tmp/dubaipoints-implementation.UQUeSa`.
All incomplete gates remain pending; Chairman scope approval is not QA closure.
