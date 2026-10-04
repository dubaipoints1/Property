---
name: web-design-guidelines
description: Review dubaipoints.ae UI code (Astro pages, layouts, components, Preact islands, global.css) against a pinned copy of Vercel's Web Interface Guidelines plus selected anti-slop rules, with house overrides applied. Use for Head of UX Stage 5.5 code review, any new layout or component, "review this page's UI / accessibility / UX", or the quarterly site-wide audit.
argument-hint: <file-or-pattern>
---

# Web design guidelines (house edition)

Review the named files for compliance with the rules below. If no files
are named, ask which ones.

This is a **code checklist**. It complements, and does not replace, the
Head of UX kill-list in `.claude/agents/head-of-ux.md` (scannability,
five-second test) or the rendered probes in `scripts/audit/`
(`npm run audit:render`, `audit:lighthouse`). It reads source; those read
the built page.

## Precedence — read this first

Where a rule below conflicts with the house, the house wins:

1. `CLAUDE.md` Part I and its Amendments (palette, no-third-hue rule,
   honest-nav, AI-imagery labelling, §6 numerics).
2. `.council/01_editorial_standards.md` and `EDITORIAL.md`.
3. The `.dp-*` idiom and colour tokens in `src/styles/global.css`.
4. This file.

Never "fix" a finding by introducing a Tailwind palette utility, a new
hue, a new font, or a stock component library. Fixes use the existing
tokens (`--ink`, `--green`, `--gold`, `--navy-lift`, …) and `.dp-*`
classes.

### House overrides to the upstream rules

These upstream rules are **not** applied, or are applied in amended form:

- **Title Case headings/buttons — not applied.** House headings follow
  the editorial standards, not Chicago title case.
- **"Second person; avoid first person" — not applied.** The
  publication speaks as "we" ("Our take"). Copy-voice findings go to the
  Standards Editor, not this review.
- **`&` over "and" — not applied.**
- **Hardcoded date formats → `Intl.*` — amended.** Body dates are
  `2 March 2026` per editorial standards §3, and date ranges use an
  en dash. Flag only formats that break that rule, or client-side code
  that formats dates or numbers by hand where `Intl` would avoid a bug.
  AED amounts follow the house AED format.
- **Curly quotes / `…` — applies to rendered copy only**, never to code,
  frontmatter keys or JSON.
- **React/Next-specific items** (`nuqs`, `priority`, `suppressHydrationWarning`,
  `onChange` on controlled inputs) — apply only to Preact islands in
  `src/components/islands/`; elsewhere read them as their static-HTML
  equivalent (`fetchpriority="high"`, plain links, no hydration).
- **"Focus ring: `focus-visible:ring-*`"** — read as "a visible
  `:focus-visible` style using house tokens". `global.css` already
  suppresses the ring only for `:focus:not(:focus-visible)`; an
  `outline: none` on an element is a finding only if neither that
  element nor its wrapper (`:focus-within`) shows focus another way.
- **Virtualise lists > 50 items — amended.** Pages are static HTML; a
  long directory or table is fine. Flag only islands that render large
  lists on the client.

## Rules — Vercel Web Interface Guidelines

Pinned from `vercel-labs/web-interface-guidelines` `command.md` at commit
`e3d624b` (17 August 2026), MIT — see `LICENSES.md`. Pinned rather than
fetched live because Head of UX has no `WebFetch` and a review should be
reproducible against a known rule set. Re-sync deliberately, in its own PR.

### Accessibility

- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements need keyboard handlers (`onKeyDown`/`onKeyUp`)
- `<button>` for actions, `<a>` for navigation (not `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates (toasts, validation) need `aria-live="polite"`
- Use semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`) before ARIA
- Headings hierarchical `<h1>`–`<h6>`; include skip link for main content
- `scroll-margin-top` on heading anchors
- Meaningful media needs captions, transcripts, or descriptions as applicable
- Media controls need keyboard support; decorative media needs assistive-tech hiding

### Focus states

- Interactive elements need visible focus (see override above)
- Never `outline: none` without focus replacement
- Use `:focus-visible` over `:focus` (avoid focus ring on click)
- Group focus with `:focus-within` for compound controls
- Sticky headers/footers/overlays must not cover the focused element

### Forms

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault`)
- Labels clickable (`for` or wrapping control)
- Disable spellcheck on emails, codes, usernames
- Checkboxes/radios: label + control share single hit target (no dead zones)
- Submit button stays enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- `autocomplete="off"` on non-auth fields to avoid password manager triggers
- Warn before navigation with unsaved changes

### Animation

- Honor `prefers-reduced-motion` (provide reduced variant or disable)
- Animate `transform`/`opacity` only (compositor-friendly)
- Never `transition: all` — list properties explicitly
- Set correct `transform-origin`
- SVG: transforms on `<g>` wrapper with `transform-box: fill-box; transform-origin: center`
- Animations interruptible — respond to user input mid-animation
- Autoplay motion > 5 seconds alongside other content needs pause, stop, or hide controls
- Muted decorative loops must stop under `prefers-reduced-motion`

### Typography

- `…` not `...` (rendered copy)
- Curly quotes `“` `”` not straight `"` (rendered copy)
- Non-breaking spaces: `AED&nbsp;500`, `10&nbsp;MB`, brand names
- Loading states end with `…`: "Loading…", "Saving…"
- `font-variant-numeric: tabular-nums` for number columns/comparisons —
  fee tables, earn-rate tables, AED breakdowns
- Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)

### Content handling

- Text containers handle long content: truncation, line-clamp, or `overflow-wrap`
- Flex children need `min-width: 0` to allow text truncation
- Handle empty states — don't render broken UI for empty strings/arrays
  (e.g. a card with no `_features`, a bank with no live offer)
- Anticipate short, average, and very long inputs (card names, bank names)

### Images

- `<img>` needs explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images: `fetchpriority="high"`

### Performance

- Large client-rendered lists: virtualise or `content-visibility: auto` (see override)
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)
- Batch DOM reads/writes; avoid interleaving
- Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke
- Add `<link rel="preconnect">` for CDN/asset domains
- Critical fonts: `<link rel="preload" as="font">` with `font-display: swap`
- Prefer `<video autoplay muted loop playsinline>` over animated GIF; provide a still alternative

### Navigation & state

- URL reflects state — filters, tabs, pagination, expanded panels in query params
- Links use `<a>` (Cmd/Ctrl+click, middle-click support)
- Deep-link stateful island UI
- Destructive actions need confirmation or undo — never immediate

### Touch & interaction

- `touch-action: manipulation` (prevents double-tap zoom delay)
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals/drawers/sheets (mobile nav overlay)
- Drag/swipe gestures need tap/click and keyboard alternatives
- `autofocus` sparingly — desktop only, single primary input; avoid on mobile

### Safe areas & layout

- Full-bleed layouts need `env(safe-area-inset-*)` for notches
- Avoid unwanted horizontal scroll; fix content overflow at 360px
- Flex/grid over JS measurement for layout

### Dark mode & theming

- `color-scheme: dark` on `<html>` for the dark theme (fixes scrollbar, inputs)
- `<meta name="theme-color">` matches page background (both themes)
- Native `<select>`: explicit `background-color` and `color`

### Locale & i18n

- See the date/number override above
- Brand names, programme names, code tokens: `translate="no"` where
  auto-translation would garble them (Skywards, Etihad Guest, RAKBANK)

### Hydration safety (Preact islands only)

- Inputs with `value` need `onInput`/`onChange` (or `defaultValue`)
- Date/time rendering: guard against build-time vs client mismatch

### Hover & interactive states

- Buttons/links need a hover state
- Interactive states increase contrast: hover/active/focus more prominent than rest

### Content & copy (flag, route to Standards Editor)

- Active voice
- Numerals for counts: "8 cards" not "eight"
- Specific button labels: "Compare cards" not "Continue"
- Error messages include the fix or next step, not just the problem

### Anti-patterns (always flag)

- `user-scalable=no` or `maximum-scale=1` disabling zoom
- `onPaste` with `preventDefault`
- `transition: all`
- `outline: none` without focus-visible replacement
- Inline `onclick` navigation without `<a>`
- `<div>` or `<span>` with click handlers (should be `<button>`)
- Images without dimensions
- Form inputs without labels
- Icon buttons without `aria-label`
- `autofocus` without clear justification
- Animated GIF when compressed video is suitable
- Gesture-only action without tap/click and keyboard alternative

## Rules — adopted from taste-skill

A narrow selection from `Leonxlnx/taste-skill` (commit `ce26fc2`, MIT —
see `LICENSES.md`). Most of that skill is landing-page art direction that
would fight a publication with a ratified design system, so only these
rules are adopted. **Not adopted, on purpose:** its em-dash ban (house
date ranges use an en dash), eyebrow rationing (eyebrows are a house
pattern), font and palette defaults, icon-library and `picsum` advice,
and its hero/bento composition rules.

**Redesign preservation** (taste-skill §11.C, §11.F). Never change
without explicit Chairman approval: URL slugs and anchor IDs, primary nav
labels, form field names, the logo/wordmark, and legal or disclosure
copy. Do not regress existing focus states, alt text, keyboard nav or
contrast.

**AI tells** (taste-skill §9). Flag:

- Pure black `#000` — use `--ink`.
- Gradient text on headings; neon or outer glows; custom mouse cursors.
- `<div>`-built fake screenshots or fake product UI (a fake card face or
  fake app screen also breaks the 2026-07-29 documentation ban).
- Pills or labels overlaid on photographs — caption below, outside the image.
- Decorative coloured status dots. A dot is allowed only for real state
  (the tracker's urgent/warning signals).
- "Scroll" cues, decorative hairline grids, rotated vertical text.
- Filler verbs in UI copy: elevate, seamless, unleash, next-gen,
  revolutionise. Route to Standards Editor.
- Placeholder data surviving into a page (Jane Doe names, round fake
  figures). Under §6 every figure must trace to L2 or a dossier; a
  placeholder figure is a fact-check kill, not a style note.

**Z-index restraint** (taste-skill §6.F). Use z-index only for systemic
layers (sticky header, mobile overlay, modals). Flag ad-hoc high values.

**Explicit mobile collapse** (taste-skill §4.7). Every multi-column grid
declares its < 768px fallback in the same file.

## Output format

Group by file. `file:line` format. Terse findings. Mark each finding
with the owner when it is not the reviewer's own call: `[Standards]`
for copy, `[Tech Lead]` for build or performance, `[Chairman]` for
anything touching slugs, nav labels or palette.

```text
## src/components/Example.astro

src/components/Example.astro:42 - icon button missing aria-label
src/components/Example.astro:55 - animation missing prefers-reduced-motion
src/components/Example.astro:67 - transition: all → list properties
src/components/Example.astro:80 - "Unleash your points" [Standards]

## src/layouts/Other.astro

✓ pass
```

State the issue and location. Skip explanation unless the fix is
non-obvious. No preamble.
