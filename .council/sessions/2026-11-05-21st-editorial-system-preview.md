# 21st editorial system owner preview

Date: 2026-11-05. Coordinator: Codex. Tier: T3. State: implemented and
checked for owner preview; not approved for production.

## Authority and protected scope

Mostafa directed “Do it all” after the dedicated 21st resource research.
His earlier requirement to see light/dark previews before release remains.
Base `651fb0506cc03f5821e0d28659043c57eee76062`, refreshed against main
before saving the candidate. Work is isolated on
`codex/21st-editorial-system`; the original shared checkout was not edited.

No changes to the homepage hero/reel source, financial data, rankings,
calculators, editorial MDX, imagery/credit manifests, dependencies,
newsletter or analytics configuration. Shared header keyboard behaviour is
refined, so “the entire homepage is byte-identical” would be too broad.
The interior-only stylesheet does not load on the homepage.

## Actual resource adoption

These are in-house adaptations of ordinary native patterns, not copied or
installed React/shadcn components. No paid code retrieval, hosted generation
or new site runtime was used. Official 21st CLI 1.18.0 ran locally from the
npm cache, with the old pasted secret explicitly unset; it is not a site
dependency. `.21st` records the actual Astro/Preact design context.

| Original shortlist reference | Actual treatment |
|---|---|
| Origin Button | Existing `.dp-ui-*` state vocabulary refined in `editorial-system.css`; theme tokens, focus, disabled/busy/invalid states. |
| Origin Button with Title | Descriptive real anchors in `NextStepLinks`, stable labels and decorative arrows. |
| ReUI Navigation Menu | Existing grouped native disclosures; exact-current sublinks, ArrowDown entry, Escape/focus retention and Cmd/Ctrl-K. |
| Origin Command | Real Pagefind index grouped by section; loading/empty/failure/retry and lazy batches. All real heading matches retained behind native per-result disclosures. |
| Origin Native Select | Existing labelled native selectors retained/refined, not replaced with a custom combobox library. |
| Origin Tabs | Semantic reference only: links remain navigation, pressed controls remain filters; no false tab panels. |
| Origin Radio Group | Finder's existing single-choice controls refined. Tracker remains one salary band or all, with independent checkbox filters. |
| Hirael Contents | Shared `ReadingContents`, one `reading.ts` controller for articles/programmes, native anchors/details and current-section semantics. |
| Oliver Feature Comparison | Fees / Eligibility / Earn / Benefits groups retaining every canonical measure/value/winner; exhaustive all-card-pairs guard. |
| Origin Table with Images | Larger contained real card identity in Finder/Compare, lazy/deferred delivery and visible manifest-source credits; table semantics retained. |
| Ravi Offer Carousel | Native manual `EditorialRail` on Airlines/Deals, no autoplay; existing ending-soon data appears once and filters reset the new shortlist horizontally. |
| Origin Pagination | Numbered pagination withheld: native chronological News archive gains date range/open state and return anchors rather than invented pages. |
| Editorial Collage Hero | Native `EditorialHubHero` on Airlines/Hotels from existing licensed photos, credited and with a desktop-only supporting image. Guides tiles become image-first. |
| Magic UI Interactive Hover Button | Concept only: 2px decorative-arrow feedback with keyboard/reduced-motion equivalence; no label morphing or runtime. |
| Cnippet Scroll Reveal | New reveal withheld; existing native reading/calculator aids retained. No generic hidden-content or motion-library rollout. |

The original report's “multi-band” wording was wrong: source inspection
confirms `band: number | null`, not a multi-band model. This pass preserves
that state. Only cash/no-card/Sharia boolean filters become checkboxes.

## Coverage and static invariants

All 322 post-prune HTML routes match the baseline route set. The existing
coverage audit reports zero metadata/structured-data/previous-heading-anchor
issues. All 22,739 internal links resolve. Pagefind indexes all 322 pages.
The generated CSP is 1,373 characters with 18 executable hashes; no inline
script relaxation was introduced. Source diffs confirm no protected data,
content, asset or dependency changes.

| Family | Routes | Treatment |
|---|---:|---|
| Homepage | 1 | Hero/reel protected; shared navigation behaviour only. |
| Recovery | 2 | New grouped Search; retained 404 with shared controls. |
| Reference tool | 6 | Shared field/button/disclosure rhythm; existing calculations retained. |
| Topic directory | 2 | Shared action/state vocabulary; existing content retained. |
| Trust/reference | 10 | Shared controls/footer; existing About surprise and disclosures retained. |
| Salary Tracker | 6 | Native independent filters and clearer hierarchy; one-band-or-all retained. |
| Salary offer | 15 | Shared controls; context/terms/timelines retained. |
| Salary history | 15 | Shared controls; archived status/chronology retained. |
| Salary calculator | 1 | Shared controls; calculations and context retained. |
| Editorial directory | 6 | News archive, image-first Guides, deduplicated manual Deals rail. |
| Editorial article | 146 | Shared native reading contents/current section and next-action states. |
| Programme directory | 2 | Image-led hub composition and manual programme rail. |
| Programme guide | 10 | One shared contents controller; existing reference order/anchors retained. |
| Card discovery | 14 | Shared control/table rhythm; shortlist data retained. |
| Card review | 58 | Shared action/reading idiom; financial content retained. |
| Card decision tool | 2 | Finder/Compare identity art, states and four-card limit feedback. |
| Card matchup | 10 | Canonical comparison rows grouped with contained art and credits. |
| Bank directory | 1 | Shared action/state vocabulary; existing directory retained. |
| Bank hub | 15 | Shared control/action states; issuer facts and journeys retained. |

This is inherited implementation coverage, not 322 bespoke redesigns or
322 individually observed usability tests.

## Executed checks

- `astro check`: zero errors/warnings, four existing hints.
- Build, Pagefind, CSP and internal-link checks: pass.
- Full local tests: 721 executed, 720 pass, one known macOS Bash 3 failure
  in unchanged `automation-state.sh` (`parent_args[@]: unbound variable`).
  No test skipped or waived. Genuine Linux exact-head CI is separate.
- Scoped official 21st deterministic scan: five supported files, zero
  errors/warnings, four pre-existing issuer-logo colour suggestions.
  Astro files are not analysed by this CLI; its empty Astro output is not
  certification. New Astro source was checked by Astro/compiler/build.
- Chrome: 19 representative page families × 390 portrait / 844 landscape /
  1024 tablet-laptop / 1440 desktop × light/dark = 152 measured layout
  states, zero document-level horizontal overflows. No visible failed
  decoded imagery was found; a hidden transparent supporting-image
  fallback is excluded from the visible-image assertion.
- Actual screenshots: six key surfaces, both themes, desktop and fresh
  phone loads (24 files), plus comparison/search/review evidence.
- Native menu ArrowDown, Escape and focus return; combined Tracker
  checkboxes and URL context; comparison fourth-choice limit and recovery
  after deselection; contained artwork at 320px; real search/show-more/
  no-match/clear/heading links and safe anchored landing: checked.
- Genuine Pagefind first-import 503 fixture initially exposed the browser
  module-map cache bug. Corrected bounded import keys recovered 140 real
  results on retry. After three failed imports, the UI offers a native
  document reload rather than falsely promising another cached retry.
- Independent review found an archive anchor offset, filtered rail position,
  lost search subresults and future measure omission risk; all addressed.
- Keyboard rail end initially lost focus when Next became disabled. The
  corrected browser run reached its end with focus on Previous. Six new
  helper/source regressions also cover symmetric/resize/no-focus-theft cases.
- Homepage fresh load: no video source/currentSrc at scrollY 0. A native
  Down key to scrollY 40 activated the existing video. Hero source unchanged.
- Phone archive return target begins at the sticky header's lower edge;
  current-edition content is not covered.

Evidence directory: `/private/tmp/dubaipoints-21st-ui.BHfq6d/`. Baseline
build retained separately there. The final route audit is in
`static-coverage-final5/`; `browser-family-evidence.json` contains the
measured sample, not a full-site pixel census.

Owner preview: `/dev/21st-ui-review/` on the local dev server. This private
development tree is pruned before production/Pagefind. The standalone local
HTML gallery has 24 actual screenshots and a resource table; its file URL
could not be browser-rendered under the tool's URL policy, so only its
structure/assets are checked. The interactive site preview was observed.

## Independent review and remaining release work

`21st_resource_research` independently reviewed catalogue adoption/licence/
dependency boundaries and identified the two search/measure risks above.
`21st_navigation_search_build` reviewed the editorial tranche independently
of its own code and identified the anchor/filter issues. `21st_editorial_build`
reviewed tools independently, checked all 53 current image-source URLs and
ran 74 focused tests. Source approvals are bounded; they are not a full
Council or physical-device certification.

Do not merge or enable auto-merge from this preview record. Remaining:
owner light/dark review; full T3 Council sign-off with actual specialist
reviews and Chairman approval; genuine successful exact-head CI; executed
JavaScript-disabled/reduced-motion browser checks; physical iPhone Safari
and eventual production verification. No deployment occurred in this pass.
