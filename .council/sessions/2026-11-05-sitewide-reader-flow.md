# Site-wide reader flow — implementation and QA, 2026-11-05

Owner direction: “Yes do all for all pages and subpages then qa that is
what was done”. T3 brief: `../briefs/2026-11-05-sitewide-reader-flow.md`.
Baseline: `8f8fa53af031c6fcc2690fdd11f56ab840d3fc16` (PR #514).
Release candidate: PR #515, `codex/sitewide-reader-flow`.

Status at this record: implementation and local QA complete; final-head
Linux/Council/Cloudflare gates and canonical production verification remain
separate. This record does not assert that the candidate is live.

## What changed and where

| Family | Routes | Applied treatment |
|---|---:|---|
| Homepage | 1 | Hero, reel and content composition retained; shared menu places the salary calculator with bank tools. |
| Recovery | 2 | Open paper canvas; search/404 recovery retained, no irrelevant continuation. |
| Trust/reference | 10 | Shared open reading rhythm; legal and disclosure text retained. |
| Programme guides | 10 | One contents control; cards, redemption examples and policy facts placed beside the relevant prose; one true ending. |
| Programme directories | 2 | Retained licensed features/rail, open discovery canvas. |
| Bank hubs | 15 | Cards first; offer, rewards and reference material follow; related reading/contact at the end. |
| Bank directory | 1 | Quieter preview/rail framing, bank-tool destinations retained. |
| Topic directories | 2 | Lighter separators and retained destinations. |
| Reference tools | 6 | Open tool/reference rhythm; inputs, methodologies and native tables retained. |
| Card reviews | 58 | Same-profile Finder/review/Compare return links; evidence and financial details retained. |
| Card discovery | 14 | Retained computed shortlists/fee tables; shared rhythm without hiding qualifying terms. |
| Card matchups | 10 | Visible heading/lede hierarchy and open verdict; aligned table values and verdict wording retained exactly. |
| Card decision tools | 2 | Compact Finder summaries, native full-detail disclosure and bounded shared spending/shortlist context. |
| Editorial articles | 143 | Topic-related continuation and explainers; 132 contextual, 11 explicitly labelled chronological fallbacks. |
| Editorial directories | 6 | Lighter preview/rail framing; Deals lead labelled “Ending first”, excluded from urgency-rail duplicates. |
| Salary offer details | 15 | Context-preserving calculator and same-shortlist return links; terms retained. |
| Salary trackers/bands | 6 | Bounded band/filter/open-offer context in links. |
| Salary calculator | 1 | Explicit entered-salary basis, context return and readable warning/ineligible states. |
| Salary histories | 15 | Archive chronology/expired labels retained, shared reference rhythm. |

All 319 emitted routes are listed in
`2026-11-05-reader-flow-route-inventory.md`. Inherited changes are not a
claim that each route received a bespoke redesign.

## Defects caught and corrected during QA

- Scoped component CSS initially defeated the open takeaway styling.
  The final programme audit asserts the computed transparent, zero-radius
  treatment rather than trusting source selectors alone.
- Finder fee rendering now resolves the existing card record, retaining
  VAT/FX provenance and fee conditions. Full rates remain keyboard/native
  disclosure content, not removed information.
- A salary band is not treated as an entered exact salary. Band-only,
  all-band, invalid, decimal and cleared inputs are exercised; clearing an
  input hides stale estimates and removes its exact-salary query value.
- Salary-calculator status text was too faint. Ineligible rows no longer
  fade their explanatory text; warning text uses the existing readable
  gold-ink token. Fresh light/dark scans found no violations on those states.
- Ten older head-to-head headers lacked the shared typography classes.
  They now use the existing title/lede/eyebrow hierarchy and an open verdict.
  Every rendered verdict and comparison-table cell matches the baseline.
- The broad regression's old tab/query assumptions were updated to test
  the new native disclosure sequence and the explicit shared-spend value.
  Keyboard and query assertions were strengthened, not skipped.

## Verification actually performed

- Final production build: 319 post-prune HTML routes; 21,911 internal links
  resolve. Static coverage preserves route sets, metadata, canonical/robots,
  JSON-LD, existing heading anchors and exactly one H1: 319 routes, 19
  families, zero issues. Existing fragment and sitemap checks passed.
- Final Astro check: 177 files, zero errors, zero warnings, four existing
  hints. The known local macOS Bash 3.2 automation-state failure is not
  waived; executed final-head Linux tests remain a release requirement.
- Final two-theme census: 5,742 same-document measurements across all 319
  routes at 320–2560px, including phone landscape and return-to-phone;
  zero affected routes, missing local responses or uncaught script errors.
- Final broad regression exited 0: all 319 routes at seven widths, local
  image delivery variants, menus, keyboard, tools and reading interactions.
- Card/salary journey audit exited 0 in light and dark: Finder → review →
  same-profile Compare → same-filter Finder; Tracker → offer → band-only
  calculator → entered decimal salary → restored shortlist. Invalid/cleared
  states, no-JavaScript defaults and resizing passed.
- All ten programmes: 140 light/dark resize states; one navigation,
  preserved targets, reference ordering, short-desktop focus reachability,
  embedded calculator actions, no-JavaScript fallback and image credits.
- Articles: all 143 continuation strategies inventoried; independent
  72-state rendered audit of six representative articles passed source
  ordering, actual destinations, keyboard and no-JavaScript behaviour.
- Whole-document axe: 18 genuine representative routes, light/dark at
  390/1280px, zero violations after correction. A mistyped history URL was
  rejected from the count; `/salary-transfer/history/dib/` was separately
  checked with HTTP 200. Ten final matchup routes additionally have saved
  light/dark axe/reflow/heading records with zero findings and 40 screenshots.
  The matchup runner lingered in shutdown; those results were independently
  aggregated from its completed per-route records, not inferred from exit.
- Visual review: 120 captures across 30 representative routes cover all
  19 families at 390/1440px in light/dark; the final matchup correction was
  separately inspected on desktop-light and mobile-dark plus computed
  32/52px title and 22/30px section-heading checks. Family visual sampling
  is separate from the full 319-route automated census.
- Homepage reel audit exited 0 on the final build: initial hero has 0.000%
  differing pixels against baseline under the test threshold at
  360/390/1440/1920px. No video request before scroll; touch/keyboard scroll,
  bidirectional seeking, failure/stall, reduced-motion and no-JS states pass.
  Full homepage HTML is not byte-identical because the shared hidden menu
  grouping changed; its hero/reel and source composition are preserved.

Repeatable commands live in `scripts/audit/reader-flow-*.mjs`,
`route-census.mjs`, `responsive-regression.mjs`, `homepage-reel.mjs` and
`render-probe.mjs`; see the audit README. Local evidence folders are kept
outside the repository beside the isolated working clone.

## Bounded Council review

Head of Research, SEO, Fact-Checker, Standards, UX, Technical, Growth,
Section Editor and Managing review covered the actual source and evidence
above; corrections were closed before release review. Programme, tools
and independent article/matchup reviews were separate. Chairman direction
is recorded in the brief and PR body. Final exact-head CI/preview must run
successfully before a normal merge, with no admin bypass.

No financial dataset, ranking/calculation module, schema, valuation baseline,
asset source/licence, dependency, workflow or analytics configuration changed.
Query choices are explicit bounded URL state, not a stored profile; visible
notices warn readers before sharing. No new event tracking or browser storage
was added. No 21st credential, paid provider or generation was used.

This is not physical iPhone Safari verification, site-wide WCAG certification,
fresh issuer-fact recertification or evidence of improved traffic/conversion.
Production deployment and canonical live-browser results belong in the PR
and the subsequent SkyNet status/decision entry.
