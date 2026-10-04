---
title: Motion audit — site motion layer
date: 2026-10-04
auditor: design-motion-principles skill (AUDIT mode, house preamble), run by the session
scope: src/styles/global.css motion blocks, src/layouts/BaseLayout.astro module, src/pages/index.astro hero/CTA/picks, src/components/Header.astro overlay
status: filed; all six FIX items and eight of nine CONSIDER items applied the same day (see "Disposition")
---

# Disposition (session, 4 October 2026)

Applied in the follow-up to PR #426, same branch:

| # | Verdict | Action |
|---|---|---|
| 1 | FIX | Reveal is opt-in: `[data-reveal]` on the eight homepage bands plus the tile/tool/featured-article classes. No prose `<section>` is hidden on any page. |
| 2 | FIX | Stagger index computed per IntersectionObserver batch, capped at 3 × 60 ms. |
| 3 | CONSIDER | Targets inside another reveal are skipped; reveal shortened to 0.5 s. |
| 4 | CONSIDER | Ticker kept (Chairman asked for the 21st.dev idioms); shortened to 600 ms and started 750 ms after load so none of it runs behind the hero fade. |
| 5 | FIX | Spotlight drawn by a `::after` moved with `transform`; no `background-image` repaint. |
| 6 | CONSIDER | Lift declared once in the motion layer for `.dp-dir-tile, .dp-tool, .hp-pick`; the copy in `index.astro` removed. |
| 7, 8 | FIX / CONSIDER | Hover sweep deleted. The CTA keeps the once-only shimmer and the 1 px lift. |
| 9 | CONSIDER | `h1 em` rise removed; the h1 carries the word. |
| 10 | CONSIDER | Hero media fade 0.4 s, no delay. |
| 11 | CONSIDER | Card-review drift is a 4.5 s translate-only variant (`dp-drift-soft`); the 14 s drift stays on the homepage hero only, rationale in the brief. Comment fixed. |
| 12 | FIX | Mobile-menu stagger deleted. |
| 13 | FIX | Backdrop uses `visibility`, fade 0.15 s; `backdrop-filter` removed. |
| 14 | CONSIDER | Slide declared once in `Header.astro` (0.28 s house curve), exit 0.2 s; global override removed. |
| 15 | CONSIDER | `--dp-ease` / `--dp-ease-hover` tokens on `:root`, used across the layer; carousel button gains `:active { scale(0.96) }`. |

Not applied: nothing. The homepage 14 s drift is the one item kept against the audit's letter, and only on the surface the preamble licenses.

# Report, verbatim

# Motion audit — dubaipoints.ae working tree, 4 October 2026

Skill: `design-motion-principles` AUDIT mode, under the house preamble (Emil primary, Jakub secondary, Jhey only for the homepage hero and the footer wordmark; no library; markdown output). Read-only; no files changed, no HTML report written. Every line reference below was checked against the current bytes.

## Project read and weighting

dubaipoints.ae is an editorial finance/comparison publication: reading pages (card reviews, bank hubs, guides, salary-transfer tracker) that a reader opens several times a day, with one marketing-shaped surface (the homepage) and a mobile nav used on every visit. By the skill's mapping that is "Banking/serious UI" plus "editorial": **Emil primary** (should this animate at all; under 300 ms; nothing on navigation or keyboard-initiated actions; frequency gate), **Jakub secondary** (one polished effect per element, exits subtler than enters, consistent easing), **Jhey only on the homepage hero band and the footer outlined wordmark**, as the preamble sets. The motion layer as written is consistent in its curve (`cubic-bezier(0.22, 1, 0.36, 1)`) and in its guards (everything inside `prefers-reduced-motion: no-preference`, the `.dp-motion` class gate so nothing hides before the module runs, WCAG 2.2.2 already applied to drift and shimmer) — those are not re-reported. What remains is mostly *scope*: effects built for the homepage are attached to site-wide selectors (`main section`, `.dp-cr-hero`, the mobile nav), and three of the homepage effects stack two or three motions on one element.

## Findings

### Scroll reveal — `src/layouts/BaseLayout.astro` module (lines 195–219) + `.dp-motion .dp-reveal` (`global.css` 3843–3852)

**1. FIX — reveal is attached to every `main section` on every page.** `document.querySelectorAll("main section, .dp-dir-tile, .dp-tool, .dp-featured-band article")` (BaseLayout.astro:199–200) hides and fades in the plain `<section>`s of reading templates: `BankHubLayout.astro` 132–153, `CardReviewLayout.astro` 465/485, `AirlineProgramLayout.astro` 135–183, 30 page files in `src/pages`. Content a reader scrolls to on a review or bank hub starts at `opacity: 0; translateY(18px)` and takes 0.6 s to arrive. Lens: Emil — motion-on-mount for static content; frequency gate (every scroll of every page). Change: replace `main section` with an opt-in — `[data-reveal]` on the homepage bands, plus `.dp-dir-grid > .dp-dir-tile`, `.dp-tool`, `.dp-featured-band article` — so no prose section is ever hidden.

**2. FIX — stagger delay is the DOM sibling index, not the reveal batch.** `const i = Math.min(siblings.indexOf(el), 6); style.setProperty("--dp-i", …)` (BaseLayout.astro:214–216) with `transition-delay: calc(var(--dp-i, 0) * 60ms)` (global.css:3849). A section that scrolls into view alone waits up to 360 ms because of its position in `<main>` — on the homepage `hp-news` (eighth child) arrives ~0.96 s after it enters the viewport. Lens: Emil — speed; a delay that encodes nothing. Change: compute the index inside the IntersectionObserver callback over the intersecting entries of that batch (`entries.filter(e => e.isIntersecting).forEach((e, i) => …)`), and only for grid children; cap at 3 × 60 ms.

**3. CONSIDER — nested reveals compound.** A `.dp-dir-tile` inside a revealed `section` runs its own 0→1 opacity transition while the parent runs its own, so the tile is effectively invisible until both finish (0.6 s + the tile's own `--dp-i` delay). Lens: Jakub — one effect per element; Emil — 600 ms is twice the UI ceiling. Change: skip any target with a `.dp-reveal` ancestor (`if (el.parentElement?.closest(".dp-reveal")) return;`), and set the tile transition to `0.4s` / `translateY(10px)`. Mostly resolved by #1.

### Number ticker — `BaseLayout.astro` 221–239, `[data-count]` in `index.astro:402`

**4. CONSIDER — the ticker paints figures that are not true for 900 ms, partly while invisible.** "N cards · M banks" counts from 1 to the real value (`dur = 900`); its parent `.hp-hero-trust` is `.hp-hero-text > :nth-child(5)` with `animation-delay: 0.32s` (global.css:3833), so the first third of the count runs at opacity 0 and the reader sees a number still rising. Lens: Emil — "should this animate at all?" on a trust-first site whose preamble says motion orients, never performs. Change: remove the ticker block and the `[data-count]` rule (global.css:3892); if kept, start it on the hero's `animationend` and shorten to 500 ms.

### Cursor spotlight — `BaseLayout.astro` 242–257, `global.css` 3883–3890

**5. FIX — per-pointermove CSS-variable writes repaint a `background-image`.** `tile.style.setProperty("--dp-mx", …)` on every `pointermove` drives `radial-gradient(220px circle at var(--dp-mx) var(--dp-my), …)` — a paint-property update each event, not transform/opacity, which contradicts the layer's own header rule (global.css:3822) and Emil's "direct style updates, not CSS variables, for frequent updates". Change: give the tile a `::after` (220 px circle, fixed gradient, `opacity: 0`, `transition: opacity .15s`) and set `after.style.transform = translate(${x}px, ${y}px)` directly — compositor only. Or drop the spotlight: the tile already lifts and gains a shadow (#6).

**6. CONSIDER — two hover effects on the same tiles, and the lift is repeated three times.** `.dp-dir-tile:hover, .dp-tool:hover { transform: translateY(-2px); box-shadow … }` (global.css:3856–3862) and the byte-identical rule on `.hp-pick:hover` (index.astro:953–964), plus the spotlight gradient on the first two. Lens: anti-checklist "hover-lift-on-everything" (≥3 components, identical values); Jakub — one effect. Change: declare the lift once in global.css as `.dp-lift` (or extend the selector to `.hp-pick`) and remove the copy in `index.astro`; keep lift + border-colour, drop the spotlight or confine it to `.dp-tool`.

### Primary hero CTA — `global.css` 3865–3878 and 3973–3981, `index.astro` 841–850

**7. FIX — the hover shine sweeps back on mouse-out.** `.hp-hero-cta:not(.is-ghost)::after { transform: translateX(-120%); transition: transform 0.7s ease; }` lives on the base state, so leaving the button animates the glint from `120%` back to `-120%` across the face — a visible reverse shine. Lens: Jakub — exits subtler than enters; Emil — 700 ms on a hover. Change: move the transition onto `.hp-hero-cta:not(.is-ghost):hover::after { transition: transform .45s cubic-bezier(0.22,1,0.36,1); }` so the base state snaps back off-button, or drop the sweep (see #8).

**8. CONSIDER — three motions on one button.** Load shimmer `::before` (2.4 s, once), hover sweep `::after` (0.7 s), and `.hp-hero-cta:hover { transform: translateY(-1px) }` with `transition: background 0.15s, transform 0.15s` (default `ease`). Lens: Jakub — "nice animation!" is the failure signal; Emil — one purpose per element. Change: keep the once-only shimmer and the 1 px lift; delete the `::after` sweep rules (3865–3878).

### Hero entrance — `global.css` 3828–3841, `index.astro` 390–401

**9. CONSIDER — the `em` rises inside an `h1` that is already rising.** `.hp-hero-text > :nth-child(2) { animation-delay: 0.08s }` (the h1) and `.hp-hero h1 em { animation: dp-rise 0.8s … 0.35s both }` compound: "Pay less." travels 28 px with multiplied opacity, and the sequence ends at ~1.15 s. Jhey-permitted on this band, but Jakub asks for one movement. Change: remove the `h1 em` animation rule (3836–3839) and let the h1 carry the word, or leave the em and exclude the h1 from the parent stagger.

**10. CONSIDER — the LCP image is held transparent.** `.hp-hero-media { animation: dp-fade 1s ease-out 0.2s both }` (3840–3841) wraps the `loading="eager" fetchpriority="high"` feature image (index.astro:411–416): 200 ms at opacity 0, then a 1 s fade, which pushes the paint Chrome counts as LCP. Lens: Emil — speed is perceived performance. Change: `dp-fade 0.4s` with no delay, or exclude the `<img>` from the fade and fade only the caption.

### Hero drift — `global.css` 3969–3971, 3999–4002; `.dp-cr-hero::before` 2899–2904

**11. CONSIDER — the drift plays on every card review, and it zooms.** `.hp-hero::before, .dp-cr-hero::before { animation: dp-drift 14s ease-out 1 forwards; }` with `scale(1) → scale(1.12)`. The Jhey licence covers the homepage hero; a reader who opens five reviews in a session watches 14 s of background movement behind the headline five times, and the accessibility checklist asks for care with zoom. The comment above it still reads "(18s loop)" against `14s … 1 forwards`. Change: drop `.dp-cr-hero::before` from the selector (the static gradients at 2899–2904 stay), or give it a shorter, flatter variant (`8s`, translate only, `scale(1.04)`); fix the comment.

### Mobile overlay — `src/components/Header.astro` 793–818, 414–438; `global.css` 3983–3998, 4000

**12. FIX — staggered row entrance on the navigation.** `.dp-nav-toggle:checked ~ .dp-nav-overlay .dp-nav-overlay-body > :not(input) { animation: dp-rise 0.45s … both }` with `nth-child` delays to 0.28 s (global.css:3985–3996). The nav is a daily utility; the rows rise on Y while the panel slides on X (two axes at once); and the script at Header.astro:426–428 opens the menu on Enter/Space, so the stagger also runs keyboard-initiated. The arithmetic also collapses: with children `a, input, label, panel, a, input, label, panel, input, label, panel, div, div, div` (Header.astro:316–412), the visible rows get 0 / 0.08 / 0.16 / 0.24 s and Travel, tools, publication and footer blocks (children 10–14) all land together at 0.28 s. Lens: Emil — never animate navigation entrance or keyboard-initiated actions; anti-checklist stagger-spam. Change: delete lines 3983–3996; the panel slide is the orientation cue.

**13. FIX — the backdrop's fade is dead and its blur is paid for during the slide.** `.dp-nav-backdrop { opacity: 0; display: none; transition: opacity 0.2s ease }` → `:checked ~ .dp-nav-backdrop { opacity: 1; display: block }` (Header.astro:793–815): a `display` flip in the same rule means the opacity transition never runs in either direction. Meanwhile `.dp-nav-backdrop { backdrop-filter: blur(6px) }` (global.css:4000, outside any media guard) blurs the full viewport on a layer the paper overlay (`inset: 0`, z 201) fully covers 0.32 s later — a paint cost on mobile for a surface that is only glimpsed, and not transform/opacity. Change: replace the `display` toggle with `visibility: hidden` / `visible` (keep `pointer-events`), shorten the fade to 0.15 s, and delete the `backdrop-filter` line.

**14. CONSIDER — the slide is declared twice, and the exit equals the enter.** Header.astro:808 `transition: transform 0.25s cubic-bezier(.2,.7,.3,1)` versus global.css:3997 `.dp-nav-overlay { transition-duration: 0.32s; transition-timing-function: cubic-bezier(0.22,1,0.36,1) }`. Astro scopes the component rule with `:where()`, so both have equal specificity and bundle order decides which the reader gets. Lens: Jakub — exits faster than enters; one source of truth. Change: delete the global.css override, set Header.astro:808 to `transform .28s cubic-bezier(0.22,1,0.36,1)`, and add `.dp-nav-toggle:not(:checked) ~ .dp-nav-overlay { transition-duration: .2s; }`.

### Easing and dead declarations — across the four files

**15. CONSIDER — the house curve is not the only curve.** `cubic-bezier(0.22,1,0.36,1)` carries the entrances, but hover lift (`transform 0.2s ease`, global.css:3857), sweep (`0.7s ease`, 3872), `dp-fade … ease-out` (3840), peek (`dp-rise 0.22s ease-out`, 3964), drift (`ease-out`), shimmer (`ease-in-out`), CTA (`transition: background 0.15s, transform 0.15s`, index.astro:849) and the overlay (`cubic-bezier(.2,.7,.3,1)`, Header.astro:808) each pick their own. `.dp-carousel-btn { transition: … transform 0.15s }` (global.css:3940) transitions a property no rule changes. Lens: Emil — custom, consistent easing; consistent timing across related motion. Change: `--dp-ease: cubic-bezier(0.22,1,0.36,1)` and `--dp-ease-hover: cubic-bezier(0.2,0,0,1)` on `:root`, used everywhere; on the carousel button either add `:active { transform: scale(0.97) }` (Emil tip 1) or drop `transform` from the transition.

## Keep as is

- The guards: every Phase 1/3 effect sits inside `@media (prefers-reduced-motion: no-preference)`, `html, html * { transition: none !important }` under `reduce` (global.css:3811–3815), the module exits early on `reduced`, and nothing is hidden until `.dp-motion` is on `<html>` — a no-JS reader sees the full page.
- Drift plays once with `forwards`; the shimmer's `background-size: 250%` with `120% → -120%` positions puts the highlight off the button at both ends (verified), so the once-only play leaves no residue.
- Carousel: CSS scroll-snap works with no JS, the prev/next buttons stay `hidden` until wired, `scrollBy` honours `reduced` with `behavior: "auto"`, and `sync()` disables the buttons at the ends.
- Hover peek: `display` toggle on hover/focus-visible only under `(hover: hover)`, 0.22 s rise, `aria-hidden` and `pointer-events: none` — fast, pointer-only, decorative with the facts duplicated on the target page.
- `.dp-nav-panel` accordion snaps `display: none → block` with no transition: correct for a frequent utility (Emil), not a motion gap. `.dp-nav-expand-arrow` rotates in 0.2 s.
- Back-to-top: 0.2 s opacity + 8 px translate with a `visibility 0s linear 0.2s` hand-off, reset under `reduce`, smooth scroll honours `reduced`.
- Header: `.dp-icon-btn:active { transform: scale(0.96) }` (Emil's press feedback), 0.15 s colour hovers, mega-panel enters from `translateY(-6px)` (origin-aware) with a 50 ms intent delay, scroll-timeline frosting over a 64 px range and disabled in dark mode.
- Footer: `.dp-footer:hover .dp-footer-mark` fills the outlined wordmark over 0.6 s via a transition (interruptible, transform-free) — the one Jhey moment the preamble licenses outside the hero, and it is quiet.
- `[data-count] { font-variant-numeric: tabular-nums }` and the "never paint 0 over the server figure" guard, if the ticker survives #4.

Totals: 15 findings (6 fix, 9 consider)
