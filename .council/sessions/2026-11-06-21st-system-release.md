---
slug: 21st-system-release
convened-by: managing-editor
topic: Authorised native editorial system and Journey Aperture release
convened: 2026-11-06
participants: aperture_production_build, release_technical_review, release_council_editorial, root
deliverable-shape: full-implementation
status: release-checks-open
---

# Council release session — 2026-11-06

## Authority and scope

Mostafa selected Journey Aperture, then directed “Ok merge it all”. Chairman
approval applies to the pending PR #518 native editorial/UI tranche and
selected hero, not unselected homepage compositions or palette/type changes.
This does not waive specialist or technical gates. See the release brief.

Source base remains origin/main `651fb05`; the original shared checkout is
untouched. Work is in the isolated clone on `codex/21st-editorial-system`.

## Actual specialist review

One independent editorial reviewer (`release_council_editorial`) applied
each named Research, SEO, Fact-Checker, Standards and relevant Business/Travel
Section rubric. This is not five separate people or five independent agents.

| Role | Actual conclusion | Evidence / boundary |
|---|---|---|
| Head of Research | pass | Native adaptations, no catalogue source/media or dependency import; existing licensed/provenance assets retained. CLI metadata refresh was not signed in; no credentials/paid calls. |
| SEO Strategist | pass for source/static scope | URLs, metadata/schema/anchors preserved; root's fresh baseline comparison:322 routes/19 families, zero issues; /dev pruned before Pagefind. |
| Fact-Checker | pass for diff integrity | Protected typed data, financial formulas/rankings, MDX and provenance unchanged. Not re-verification of every existing issuer claim. |
| Standards Editor | pass | Real descriptive copy/CTAs, exact existing H1/deck/tagline, no invented uplift/audience or product claims. |
| Relevant Section Editor | pass for source scope | Eligibility/offer conditions, financial presentation, programme destinations and contained/credited real issuer art preserved. |
| Technical Lead | source/unit pass; release pending | Independent `release_technical_review`; seven production guards execute a mocked controller, not native-scrollbar/Safari certification. |
| Head of UX | pending | Root's actual browser evidence below; remaining runtime/device/performance acceptance is not closed. |
| Growth-Analytics-Lead | pass for diff scope | Root inspected unchanged telemetry/config/rankings; no new tag/event, paid activation, bot/unique-visitor or uplift claim. |
| Managing Editor | hold | Root coordinated actual reviews; never treat advisory Council CI as substantive approval. |
| Chairman | approved directed scope | Mostafa's explicit selected direction and “Ok merge it all”; no technical waiver. |

## Implemented selected hero

`HomeJourneyHero.astro` and `homeJourney.ts` replace only the old hero markup,
controller and hero CSS in index. Independent comparison confirms below-hero
HTML, motion script and CSS are byte-identical to origin/main. The hero keeps
the exact H1/deck, #tools/#latest, existing reel/poster and provenance. No new
assets/dependencies/analytics or financial changes.

Native scroll only; no initial src/source child, preload none; actual scroll
after wheel/touch/key or scrollbar-edge intent attaches a responsive encode.
Click/hash/history/resize invalidate intent; live reduced motion detaches;
hidden/offscreen cancels seek work. No play/autoplay or idle RAF loop. Native
scrollbar delivery remains a runtime check, not proven by these source paths.

## Fresh verification

- Astro check:197 files; zero errors/warnings, four existing hints.
- Build/postbuild:322 indexed public pages,22,743 resolved links,17 CSP hashes,
  1,319-character CSP header. Internal routes removed before indexing.
- Static baseline comparison:322 routes/19 families; no metadata/schema/prior
  heading-anchor issues.
- Full local suite:744 executed,743 pass, one unchanged macOS Bash3
  automation-state failure, zero skips/cancellations. An initial additional
  failure was a stale audit source line after extraction; every homepage
  source pointer was corrected without weakening the test or marking old
  findings resolved. Linux exact-head CI still required.
- Official 21st review of the new TS controller:1 supported file, zero
  findings. Astro remains outside that scanner's coverage.
- Actual built-home geometry:8 sizes in both themes =16 states.320×880,
  390×844,430×932,844×390,1024×600,1440×687,1440×743,1440×900. No measured
  root overflow, clipped hero actions or source attachment from resize alone.
  Initial normal-laptop static fallback was corrected with height-responsive
  type/spacing; normal laptops now enhance, very short landscape stays static.
- Actual Chrome keyboard forward/backwards seeking and idle pause observed.
  Phone390 selected720 encode only after input; both hero CTAs remain48px.
- Actual no-JavaScript test via Chrome DevTools: static complete H1/deck/
  #tools/#latest, source absent, no root overflow. JS restored afterwards.
- Actual live prefers-reduced-motion emulation removed an attached source
  and enhancement; clearing emulation restored enhancement without loading.
  This is browser media-query execution, not a physical OS/iPhone certificate.
- Clean Incognito mobile Lighthouse13.4.1 / Chromium155 / simulated Moto G
  Power / Slow4G against uncompressed localhost:performance81, accessibility100,
  best-practices100, SEO100; FCP2.9s,LCP4.1s,TBT0,CLS0. BELOW95 performance
  target. Check the hosted compressed preview before declaring that gate
  passed. Original profile storage was not cleared; clean test window closed.

Evidence directory:`/private/tmp/dubaipoints-release-518.zNaItC`.

## Open release gates

Native scrollbar-only runtime, physical iPhone Safari, remaining hidden-tab/
offscreen/zoom/contrast checks, performance acceptance and exact-head genuine
Linux CI remain separate gates. No merge/auto-merge/admin bypass while open.
No live deployment claimed. Earlier broad-audit findings remain separate work.
