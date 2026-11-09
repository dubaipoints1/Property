# Speed follow-up — distinguish production from local delivery diagnostics

Date: 2026-11-09  
State: bounded Tracker delivery and responsive-focus candidate; independent review and exact-head release checks remain required. No production speed improvement is certified by this report.

## Evidence that changed the decision

The initial local, **uncompressed** three-run Lighthouse sample selected a Finder run scoring 59 with LCP 7,579ms and about 1,322KiB transferred. The six default results were accompanied by the complete hidden markup for the rest of the 73-card catalogue. That is a genuine byte/DOM cost, but is not proof of a slow production experience.

Root then read the live Google PageSpeed report in the browser: **Finder performance 98, LCP/FCP 1.4s, TBT 40ms, CLS 0, Speed Index 4.1s**, dated 9 November 2026, 17:36 Dubai. Accessibility was 97; best practices and SEO were 100. This is one production **lab** report, not CrUX field data, a guarantee for every reader, or a current after-release measurement. [Observed Google PageSpeed report](https://pagespeed.web.dev/analysis/https-dubaipoints-ae-cards-finder/mueh9te0x4?form_factor=mobile).

Accordingly, the proposed asynchronous Finder catalogue was **stopped before any implementation**. No Finder page/controller/selection/value code, build integration, static fragment, dependency or route was created or changed by this speed task. Introducing first-filter loading/error/race behaviour solely to improve an uncompressed local proxy is not justified by a production score of 98. A proposal is not a deployed feature.

The local audit helper selects the median **performance-score run**, not the numeric median of every metric. Finder's raw LCPs were approximately 7,579 / 7,806 / 7,957ms; 7,806ms is the numeric LCP median. Keep selected-run and metric-median wording distinct.

## Offline bottleneck analysis

From `/private/tmp/dubaipoints-operations.hAVNh3/final-lighthouse/`, representative selected runs:

| Local uncompressed transferred bytes | Finder | Salary Tracker |
|---|---:|---:|
| HTML | 938,699 | 170,359 |
| Stylesheets | 186,250 | 171,045 |
| Fonts | 73,026 | 73,026 |
| JavaScript | 34,726 | 51,512 |
| Images | 119,619 | 82,811 |

Both reported LCP elements were text. Finder's 67 hidden card tiles occupied about 720KB of decoded HTML. JavaScript CPU was not the demonstrated bottleneck: TBT was zero in all three Finder runs and zero or 1ms for Tracker. Source minification was already enabled (`compressHTML: true`); an in-document `<template>` would retain transfer bytes. No card art was deleted, no analytics timing was changed and no hydration work was hidden to manufacture a score.

The live Finder report instead identified approximately 55.7KiB of compressed render-blocking CSS and an estimated 840ms opportunity. Those are **estimates**, not guaranteed savings. They do not justify a blind purge of selectors needed by menus, filters, themes and other responsive states. CSS delivery remains unchanged in this task.

The audit helper's 200KB “above-fold” figure is a documented historical proxy: requests completed before the modelled LCP using recorded local timings. It is not a literal viewport census, compressed production wire weight or field metric. The production 95-point target and this local byte proxy must not be conflated. No budget or release gate was silently waived or rewritten.

## Narrow Tracker prototype retained for review

`SalaryTransferTracker.tsx` rendered the complete `<Detail>` content twice per closed offer, once for desktop and once for mobile. The two changed expressions now render `<Detail>` only while `isOpen`. Existing controlled wrappers, IDs, `hidden`, `aria-controls`, `aria-expanded`, disclosure buttons and source-linked individual offer destinations remain present.

The same public offer properties are still serialised in the island; opening needs no new network call. No fee, reward, salary, eligibility, source date, ranking or query rule changed.

Matched isolated builds in `/private/tmp/dubaipoints-speed-followup.BI5N4X/`:

| Route | Before HTML bytes | Candidate HTML bytes |
|---|---:|---:|
| `/salary-transfer/` | 170,020 | 116,304 |
| `/salary-transfer/aed-5000-to-8000/` | 137,286 | 102,193 |
| `/salary-transfer/aed-15000-to-30000/` | 170,695 | 116,980 |

The main Tracker removes **53,716 raw bytes (31.6%)**. Local compression models give smaller savings: gzip level 6, 31,979→23,153 bytes; Brotli default, 20,587→19,230 bytes. These are deterministic file-compression experiments, **not measured Cloudflare wire transfers or live speed improvements**.

The final candidate also adds a scoped native focus-recovery helper (`src/scripts/trackerResponsiveFocus.mjs`), mounted with a cleanup-returning Tracker effect. That increases the Tracker JavaScript bundle from 15,353 to 17,955 raw bytes (+2,602); local gzip level 6 increases by 972 bytes and Brotli by 867 bytes. Count that cost against the HTML saving. Initial document elements fall from 1,637 to 967. The homepage CSS bundle remains exactly 100,537 bytes against this pre-speed baseline; names that accidentally triggered unused Tailwind utility generation were removed before final verification.

## Actual local verification

`tracker-runtime.mjs` and `tracker-runtime.json` retain the executed harness and results. External hosts were blocked; browser was local Chromium 156.

- **168 route states**: before/after × three Tracker routes × seven widths (320–1920) × light/dark × JavaScript/no-JavaScript. No document overflow or page error; visible row text hashes and source-linked bank destinations match. Source offer-props hashes match for every route.
- **24 offer interactions**: before/after × six actual offers × light/dark. Saved `st_offer` opens the matching detail; desktop/mobile opening, closing and Enter activation work; expanded detail text remains identical across 390↔1440 resizing.
- **14 final-candidate focus cases**, plus both-direction focus assertions in the six-offer matrix, use actual keyboard modality/Space/Enter actions. They confirm the exact expanded offer follows mobile→desktop→mobile and a focused detail link follows its matching counterpart. Initial programmatic focus, pointer use, deliberate body/outside focus, deliberate blur and a closed offer are not migrated.
- Four initial viewport screenshot pairs (390/1440, light/dark) are byte-identical before/after. Actual candidate light-phone and dark-desktop captures were visually inspected. No appearance claim is inferred only from a successful build.
- Main route retains all 12 controls and 12 controlled containers even when closed. Initially rendered fine-print blocks fall from 24 to zero; opening restores source-backed detail content. No-JavaScript readers retain the same visible summary rows and individual offer-detail links; no claim is made that the existing JavaScript disclosure buttons become functional without JavaScript.
- Two new delivery-source guards, nine executed focus-helper tests and the relevant existing bands/images/tools checks passed **30/30**. The helper cases include both directions, descendant matching, Chromium's hidden-before-focusout ordering, negative focus-stealing cases, absent counterpart/unsupported observer and listener/observer/frame cleanup. Astro check reported zero errors, zero warnings and seven existing hints. Both isolated Astro builds passed, each emitting 350 routes before normal internal-page pruning. Full combined-head tests remain root's separate release responsibility.

### Inherited focus loss reproduced, then repaired narrowly

The initial comparison found that hiding a focused mobile disclosure by resizing moved focus to `BODY` in both the baseline and the two-line delivery prototype. That was inherited, not introduced by deferred detail content. Root authorised a bounded repair rather than silently claiming focus preservation.

The final helper starts without keyboard ownership. Actual keyboard input enables it; pointer input, outside/body focus, visible deliberate blur, window blur and hidden-document transitions clear ownership. It migrates only a focused open offer whose original responsive control becomes hidden, and only to that exact offer's visible expanded counterpart. Matching descendants retain tag/href and position, with the equivalent disclosure as the conservative fallback. Focus uses `preventScroll`; no initial autofocus, telemetry, state mutation or new dependency is introduced. Cleanup removes every observer/listener and queued frame.

One genuine browser return-path failure was diagnosed before acceptance: Chromium could hide the old control before emitting `focusout`, while a queued keyboard frame discarded its ownership. A visibility guard on that queued recheck and a deterministic real-order regression fixed that bounded ordering problem. The final complete browser run passes; the failed prototype was not waived or described as passing. Baseline still records `BODY`; final candidate records the matching offer control in both directions. This is selected local Chromium evidence, not universal device certification.

### Strategy preview correction

Earlier tall element screenshots misleadingly cropped right-hand strategy text. A separate read-only check used normal 390×920 viewport captures and actual text-range rectangles before/after in both themes. Programme/stat text stays inside section x20–370px; the guide title wraps onto two lines with maximum right edge 366.53px. There was no reproduced text-containment defect and no CSS change was made for it. Prefer `strategy-candidate-{light,dark}-390-{rows,aside}-viewport.png` and `strategy-containment.json` under the private evidence directory to the earlier tall crops.

## Independent work and boundaries

- The child offline analysis read actual LHR payloads and source/HTML offsets. It made no edits, browser/network calls or paid requests. Its Finder extraction assignment was stopped before any file was created.
- Root's separate `VerifiedStamp.astro` contrast correction was independently source-reviewed here: only pending/stale text changes from decorative `--gold` to the existing `--gold-ink`; decorative dot, words, dates and condition logic are unchanged. Its source guard passed 1/1. Computed contrast/axe proof is root's separate runtime check, not inferred from this source review.
- 21st review/build and accessibility checklists informed the use of existing tokens/native states. The CLI is unavailable; no installation, hosted generation or new catalogue result is claimed.
- No physical Safari, VoiceOver, real-reader study, paid provider, account setting, article publication, email, worker, merge or Drive action was performed by this task.

Next: independently review the small Tracker candidate and final focus evidence, verify root's contrast runtime evidence, and run genuine exact-head combined release checks. Obtain owner preview where the visible candidate differs; never label this report itself as release approval.

## Homepage audit modernisation — later gate follow-up, 2026-11-09

The registered `scripts/audit/homepage-reel.mjs` still targeted the pre-Aperture `data-reel-*` DOM and failed before testing the current hero. Its assumptions also expected a programmatic 12px scroll to initiate media, omitted the sticky-header offset from scrub geometry, and expected a media-element error after a fetch failure that the current controller handles without ever attaching a source.

Only that audit and `tests/audit/homepage-reel-contract.test.ts` changed. No production hero, controller, CSS, media, source, analytics or preference setting changed. The audit now uses the existing Journey Aperture probes, actual header-adjusted progress, trusted touch/keyboard input, and the current blob/failure/static contracts. Content-fit eligibility is checked against the eligible enhanced height, not a natural-height fallback that could incorrectly certify itself.

An independent read-only review identified and then re-reviewed three audit-only gaps: content-fit eligibility, missing positive frame visibility, and deduplication hiding repeated downloads. All were corrected before the final run. The strengthened audit checks initial video opacity zero, positive `.is-ready` plus video opacity one after decoded seeking, and exactly one correct responsive MP4 request before and after scrubbing. The reviewer independently reran **21/21** tests (six audit helpers/contracts plus fifteen existing controller tests), with none skipped; import does not launch a browser.

The final registered browser command ran against the current built `dist/` and supplied base `/private/tmp/dubaipoints-reader-followup.H9H2Tt/baseline-dist`, with external hosts blocked. **Exit 0**:

- Five opening-stage comparisons: 360×844, 390×844, 390×920, 1440×900 and 1920×1000; every comparison reported **0.000%** pixels differing by more than eight RGB levels.
- No initial/timer-triggered media; touch-down alone does not fetch. Trusted touch or keyboard scrolling fetches exactly the owned 720/default/2560 version, assigns only the completed blob, displays the decoded frame, scrubs both ways and permits ordinary scrolling out of the hero. Both enhanced phone and desktop cases must execute; static guards cannot skip every motion case.
- A held/failed fetch retains poster, headline and working tool action. A direct tool-anchor jump does not fetch video. Scripted 12px scrolling does not fetch; subsequent trusted scrolling does.
- Reduced motion and JavaScript-off modes retain the poster/native action without video downloads.

Raw output: `/private/tmp/dubaipoints-speed-followup.BI5N4X/homepage-reel.log`. Command, start/end times, exit status and before/after hashes of the unchanged production hero/controller: `homepage-reel-result.json` in the same directory. This is bounded local Chromium evidence, not physical iPhone Safari, native-scrollbar certification, production deployment or release approval. Source/tests are frozen for root's final combined gates.
