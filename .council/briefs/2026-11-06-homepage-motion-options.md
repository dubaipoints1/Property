# Homepage motion: evolve the existing journey

Date: 2026-11-06. Tier: T3 exploration. Coordinator: Codex.
State: unselected local previews; no production release authority.

## Owner direction

“Ok i want some animation like i like what we have in the home page but we
can do possibly better using the 21st dev i saw some cool ones”.

Preserve the appeal of the existing card → aircraft window → Dubai journey.
Explore stronger spatial choreography instead of treating calm layout studies
as a sufficient response to the request for animation. The owner has not
selected a replacement or authorised deployment.

## Existing behaviour, not new features

The actual homepage already has a sticky native-scroll video scrub, responsive
video encodes, poster-first loading, headline fade/blur, subtle scale, closing
tagline and night-to-day bridge. Do not sell those as a new 21st adoption.
On this turn's local Chrome baseline at 390×844, initial source was absent;
native Down at 40px attached the 720 encode; further native scroll sought the
reel. The 1586px track and 742px stage were measured, not performance targets.

## Grounded references

1. [Scroll media expansion hero](https://21st.dev/@arunachalam/components/scroll-expansion-hero),
   Arunachalam: inset image/video expands with scroll. Public usage and MIT
   label read; React/Next/Framer dependencies listed. Main also visually
   operated its public preview: the inset scene expanded while scrolling.
   Do not copy demo resets, text blending, source or imagery.
2. [Hero Gallery Scroll Animation](https://21st.dev/@youcefbnm/components/hero-gallery-scroll-animation),
   YoucefBnm: public usage shows three/four/five photographic cells in a
   sticky 350vh setup; Motion and class-variance-authority, MIT displayed.
   Main opened its public interactive bundle and observed photo frames
   expanding/repositioning after a native scroll. That is one desktop
   observation, not keyboard/mobile/reduced-motion certification. Adapt
   spatial layering, not its lengthy compulsory sequence.
3. [Hero Scroll Video Pin Reveal](https://21st.dev/@ajith66310/components/hero-scroll-video-pin-reveal),
   Ajith k v: listing describes expanding cinema imagery and kinetic type;
   GSAP listed, MIT displayed. Timing/composition reference only, not a
   reason to restore global GSAP or split every heading into words.
4. [Hero Scrub](https://21st.dev/@jean.duthil13/components/hero-scrub),
   Jean Duthil: usage specifies a 300-frame canvas sequence; no item licence
   observed. Not selected: unnecessary request/decoding complexity compared
   with the existing compressed reel. Listing's mobile/a11y claims unverified.
5. [Scroll-Locked Video Hero](https://21st.dev/@gughigug/components/scroll-locked-video-hero),
   Guglielmo Giannattasio: a documented earlier influence on the current
   homepage. Keep our native-scroll adaptation, never its body lock.

Dedicated research used free public primary listings/usage after the cached
official CLI reported not signed in. No credentials or secret files read,
no paid retrieval/generation, no source/dependency/demo-asset installation.
Listing licences do not clear bundled media or certify integration quality.

## Three comparable motion directions

| Direction | Composition and choreography | Media / hierarchy | Risk and best fit |
|---|---|---|---|
| Journey Aperture — recommended | Inset rounded window opens to cinematic full bleed while the reader scrolls | Same existing reel/story; clean handover directly to real reporting | Best evolution of what owner likes; first screen changes and seeking/mobile framing need actual QA |
| Travel Mosaic | Layered licensed travel photographs separate and consolidate into a scene | Photo-only, with source credits; newsroom immediately below | More editorial and less video-heavy; phone composition must not become tiny scattered tiles |
| Cinema Cut | Wide letterbox opens vertically around the existing journey | Same reel, shorter film-like choreography and quieter text; reporting next | Bolder cinematic challenger; short landscape must still expose useful content and actions |

Paths: `/dev/homepage-motion/aperture/`, `/mosaic/`, `/cinema/` under the
same prefix. These are functioning homepage candidates, not production.
One H1 and compact review navigation; no giant review introduction before
the hero. Real news titles/descriptions/dates/URLs below, no demo metrics.

## Fixed contracts

- Native scroll, direct skip/reporting/tool links and normal keyboard focus.
- Existing local video/provenance only; no source/source-child at initial
  load; attach video only after genuine user scroll within this hero.
- Direct jumps beyond the hero and resize alone must not initiate video.
- Reduced-motion/no-JS: complete poster, headline and links; no video.
  Live preference changes cancel work; tab hidden pauses; no idle RAF loop.
- Small-phone, short-landscape and wide desktop light/dark, dynamic resize,
  backwards scrolling and fast forward jumps are separate test cases.
- Original AI journey remains identified through its existing provenance
  and policy; licensed Mosaic photos retain visible credits. No new imagery.
- Current fonts/tokens, no decorative gold or unrelated palette change.
- `/dev/` noindex, sitemap exclusion and postbuild pruning retained.
- No facts, calculations, analytics settings, public homepage, dependencies
  or manifests change. Keep options local until selection/release gates.

## Acceptance and decisions

Root records observed progress/frame/source states and screenshots, not just
source-level support. Source guards/check/build are separate from browser
inspection. Desktop Chrome does not certify physical iPhone Safari. Owner
chooses after operating the real preview; no option is presumed accepted.
