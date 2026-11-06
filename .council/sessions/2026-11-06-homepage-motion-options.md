# Homepage motion options — private review handover

Date: 2026-11-06. Coordinator: Codex. State: local candidate, not live.
Owner likes the existing animated journey and requested stronger 21st-inspired
motion. Journey Aperture was selected for staging on 2026-11-06; production
release remains unauthorised.

## Selection and fresh readiness review — 2026-11-06

Mostafa answered “Yes. Is that the best. All happy?” to taking Journey
Aperture forward. Selection is limited to this motion direction, not the
separate full-page composition, palette/type changes or live release.

Fresh independent source review supports Aperture as the strongest fit
among these three, not a proven conversion improvement. No further private
preview blocker was found. Scrollbar-only initiation is unsupported by the
current trusted wheel/touch/key gate and must be resolved/tested before
release. The runtime/physical Safari/performance gates below, actual
homepage integration, exact-head remote CI and T3 approval remain open.
This turn records selection only; no functional site change, push or release.

## Implemented

`src/pages/dev/homepage-motion/[direction].astro` produces:
- `/dev/homepage-motion/aperture/`: inset/rounded frame expands around the
  existing compressed reel — recommended evolution of the current hero.
- `/dev/homepage-motion/mosaic/`: three existing licensed real travel photos
  recompose with scroll; no video element.
- `/dev/homepage-motion/cinema/`: shorter letterbox-to-tall cinematic framing
  around the same reel.

All use native scroll, actual reporting below, visible direct news/tool links,
current fonts and house tokens. The preview-only static checkbox shares the
system-reduced-motion cancellation path. Video starts with no src/source-child
and preload none; trusted wheel/touch/key intent plus within-hero scroll is
required. Anchor/history/resize revoke intent. No play(), autoplay rail or
idle interpolation loop. Short or crowded windows use normal-height static
flow after measuring actual copy/actions/padding, not just a width breakpoint.

Private review navigation was linked from both earlier whole-site review
pages. Those earlier options remain unselected. Public homepage, BaseLayout,
card/financial data, image/video manifests, package files and analytics are
unchanged. No source/dependency/demo-asset import or new media generation.

## Research and review

The dedicated research agent freshly read five focused primary references.
Main operated the public expansion preview and gallery bundle at desktop,
observing the inset frame expansion and photographic frame reposition/scale.
That is bounded interaction evidence, not full original-demo accessibility QA.
The brief records links, observed licence labels, dependencies, non-selections
and why simply adding scroll scrub would duplicate the existing homepage.
The official cached CLI search reported not signed in; no credential file or
key was read. CLI review was attempted against the Astro file and directory
but returned filesReviewed=0; its zero findings are NOT treated as a pass.

Independent source review identified undefined tokens, absent explicit preload,
short-wide stage clipping risk, focused-link keyboard-scroll exclusion and
sub-44px review targets. These were corrected. Final independent source review
found no further blocker to PRIVATE owner review. No Chairman/release approval.

## Actual verification

Final Chrome geometry: 3 routes ×7 sizes ×2 themes =42 states. Sizes:
320×880,390×844,430×932,844×390,1024×600,1440×500,1440×900. No measured root
horizontal overflow, clipped hero actions, completed broken images or source
attachment from resize alone. The short windows correctly used static flow.
All four review links/checkbox-label targets measured44px on phone.

Actual native-scroll desktop checks:
- Aperture at p0.5105 sought5.149732s; Cinema p0.7469 sought7.533868s, both
  paused rather than playing independently. Mosaic changed panel geometry
  with no video.
- A paused idle check remained6.684766s across observations.
- Direct initial #reporting and Enter on Read the latest left src absent.
- PageDown while the hero link was focused loaded/scrubbed the reel and kept
  a visible focus indicator. Ordinary continuation reached reporting.
- Manual static mode removed src, cancelled enhancement and paused; turning
  it off did not itself reattach video.
- Phone390 used the720 encode: forward p0.6905 /6.965172s, then backward
  p0.2760 /2.784416s. This verifies bidirectional seeking in Chrome, not Safari.
- Desktop/phone stills inspected; a continuous Mosaic scrim corrected white
  deck text crossing into a bright secondary photo. Source/credits retained.
- Browser error log empty. Final preview retained at default1440×687, light,
  source absent. Baseline/research tabs closed; temporary preview override reset.

Evidence: `/private/tmp/dubaipoints-home-motion.TJcKeY/geometry-final.json`,
`runtime.json`, and animated screenshots. Owner stills in workspace
visualisations: `dubaipoints-journey-aperture-start.jpg`,
`dubaipoints-journey-aperture-motion.jpg`, `dubaipoints-journey-aperture-phone.jpg`.

Final Astro check:195 files, zero errors/warnings, four existing hints.
Final build/postbuild pass:322 public indexed pages,22,743 resolved internal
links,18 CSP hashes /1,373-character header. /dev is pruned before indexing.
Four new source-contract guards pass; eight including whole-site review guards.
Full local suite:737 executed,736 pass, one unchanged macOS Bash3 automation-
state compatibility failure; zero skipped/cancelled. Not wholly green.

## Limits and next action

Native scrollbar-drag initiation is unverified under the trusted input gate.
Physical iPhone Safari decoding/orientation/buffering, true OS reduced-motion
changes, hidden-tab/offscreen cancellation, no-JavaScript runtime and formal
contrast/performance/zoom/CLS checks remain separate release gates. Manual
static simulation and source support are not certification of those cases.

Owner operates the previews and selects a direction. No remote push, merge,
deployment, paid request, generated asset or analytics change by this tranche.
