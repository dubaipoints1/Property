# Reader follow-up — standalone touch targets

Date: 2026-11-09  
State: implemented review candidate; independent review, owner preview and protected release remain separate. No deployment or physical-device certification is recorded here.

## Scope and finding

The existing five-route news render probe reported **76 repeated target warnings** at mobile widths 390 and 440. The same probe against a fresh build of base `4cd884a41176c6ffeecd2eaf4395dfe8262a04c1` reproduced all 76.

- Six warnings measured the three invisible 13×13 strategy radio inputs at the two widths. Those inputs remain keyboard-accessible; their associated labels are the actual pointer controls. The probe only substitutes a label rectangle when it contains the input rectangle, so this is an instrumentation limitation, not evidence of a 13px visible button.
- Seventy reported instances were genuine undersized standalone controls: header/footer wordmarks, short footer links, the homepage contact link, three older “more” links, five trust links and the first strategy-label proxy. Direct label measurement additionally confirmed that **all four** strategy labels were about 38px high. These counts are repeated screen instances, not 76 distinct defects.
- Ordinary links within paragraphs were not enlarged or restyled.

The 44×44px threshold is the **house target**, not a claim that every smaller target violates WCAG 2.1 AA. WCAG 2.1 criterion 2.5.5 is AAA and has exceptions. No whole-site accessibility conformance claim follows from this repair.

## Minimal repair

| Surface | Before, representative homepage at 390px | Candidate |
|---|---|---|
| Header home link | 154×22px | Existing native anchor at least 44px high; fixed 56px header and glyph position unchanged |
| Footer brand/contact | 24px / 20px high | Native inline-flex anchors, existing control-height token |
| Footer Banks / Deals / News | About 40 / 36 / 36px wide | At least the existing control token in both axes |
| Older homepage “more” links | About 26px high | One shared target rule for all five “more” links |
| Homepage trust links | About 25px high | Native anchors at least 44px high |
| Four goal labels | About 38px high | Actual labels at least 44px high; native radio/focus/checked behaviour retained |

Only `Header.astro`, `Footer.astro`, `index.astro`, the strategy rule in `global.css` and its required exact copy in `home-global.css` changed. The existing `--dp-ui-control` is reused (44px on the homepage; existing interior treatment can be 46px). No palette, type, content, URL, image, data, calculation, video, animation controller, analytics or dependency change is part of this patch.

Below-fold links and the footer have slightly more vertical space; the desktop homepage footer is taller because its previous 32px link rows now meet the same target as other controls. This visible spacing change requires the owner's preview, not a claim that the whole page is pixel-identical.

## Matched local evidence

Private evidence root: `/private/tmp/dubaipoints-reader-followup.H9H2Tt/`.

- `baseline-dist/` was built before the five-source repair; `candidate-dist/` afterwards. Both used the same Node 22.20.0 runtime and production Astro build, existing internal-page pruning, homepage route/bundle delivery and CSP generation. No canonical `dist/` overwrite or external retrieval was needed. Each Astro build emitted 350 routes before the normal internal-route pruning.
- `runtime.mjs`, `baseline-runtime.json`, `candidate-runtime.json`: **140 route states per build**: homepage, news index, Finder, Salary Tracker and Skywards × seven widths (320, 390, 440, 768, 1024, 1440, 1920) × light/dark × JavaScript/no-JavaScript. The same assertions confirmed every selected native target at least 44px in both axes after the repair, no document overflow or uncaught page error, unchanged main text hashes, and identical header-container and wordmark-glyph rectangles.
- **28 interaction states per build** checked the actual strategy-label top edge, native radio arrow selection, corresponding panel visibility and the existing visible keyboard-focus outline. No hidden input was enlarged or removed to silence the probe.
- Four initial homepage screenshot pairs (390/1440, light/dark) have identical SHA-256 hashes before/after. In each capture the video had no initial `src` or MP4 request. This is initial-state evidence; the unchanged controller's separate tests cover its scroll/data-saving/error gates.
- `baseline-probe/` and `candidate-probe/`: the exact same existing five-news-route probe, widths 390/440/1440, light/dark, external requests blocked. **76 → 6 raw target warnings**; the six remaining warnings are solely the three invisible radios at the two mobile widths. Both runs reported zero overflow, axe, dark-contrast, image, link-name, focus, menu, motion, console/page-error, local failed-request or HTTP-error findings within their selected checks. This does not mean every site route or interaction was audited.
- Clean previews: `candidate-strategy-{light,dark}-{390,1440}.png`, `candidate-trust-{light,dark}-{390,1440}.png`, `candidate-footer-{light,dark}-{390,1440}.png`; matching `baseline-…` images are retained. `previews.mjs` hides fixed header/skip/back-to-top chrome **only for tall element screenshots**, avoiding the stitched fixed-chrome artefact. Actual viewport checks retain normal chrome. `previews.json` records the strategy's unchanged contained column geometry.

## Recurrence and delivery-cost checks

`tests/reader-followup/standalone-targets.test.ts` adds four source-contract guards: header fixed parent/native anchor, real footer targets, all homepage more/trust links, and actual goal-label targets with source/copy parity and native focus/checked selectors. They do not substitute for rendered geometry.

The four new tests plus existing homepage stylesheet delivery, header-interaction, aperture-controller and news-selection guards passed **41/41**, with no skipped tests. Both isolated builds passed. The complete generated JavaScript bundle sets are byte-equivalent: **29 bundles in each build, identical content-hash sets**. The raw cached homepage CSS bundle increased from 100,379 to 100,537 bytes (**158 bytes**); no script, font or media resource was added.

Load-event resource totals in the ad-hoc runtime are intentionally **not used as a speed comparison**: lazy-island/image scheduling can still be in flight at that sampling point. This patch does not claim a faster site, a Lighthouse budget pass or a production Core Web Vitals result. A separately recorded sequential performance run is still needed for those conclusions.

## Limits and next action

- The 21st UI review and accessibility checklists were applied to project tokens, source and rendered states. The `21st` CLI is unavailable on this machine; no CLI result, installation or new catalogue retrieval is claimed.
- This is local Chromium 156 evidence, not physical iPhone Safari, VoiceOver or real-reader research. The owner’s physical-device and five-reader tasks remain open.
- The raw probe's hidden-radio classification was not changed, and no genuine target was exempted to improve the counts.
- These isolated snapshots precede other agents' later financial-data acceptance changes in the shared checkout. They support this bounded UI repair, not the final combined source head. Root owns combined check/build/test/Council review and any eventual release.
- Next: independent source/runtime review, owner light/dark spacing preview, then genuine exact-head release checks. No merge, publication, worker activation, paid call or Drive write was performed by this UI task.

## Later capture qualification, 2026-11-09

The tall strategy element previews above are not reliable evidence of text containment: their right edge misleadingly crops rendered text. The follow-up speed review preserved ordinary 390×920 viewport captures at `/private/tmp/dubaipoints-speed-followup.BI5N4X/strategy-candidate-{light,dark}-390-{rows,aside}-viewport.png`, with matching baseline captures and `strategy-containment.json`. Actual text ranges remain inside x20–370px, including complete programme/stat text and the guide title wrapping onto two lines. No text-range overflow was reproduced and no layout fix was needed. Use these normal viewport captures for owner review of the strategy section; the original footer/trust previews and target measurements retain their stated narrower purpose.
