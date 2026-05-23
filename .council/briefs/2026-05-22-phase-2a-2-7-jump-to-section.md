# Phase 2a.2.7 — Jump-to-Section sticky chrome

**Status:** open · **Tier:** T2 (chrome / layout) · **Opened:** 2026-05-22
**Brief author:** Head of Research (continuation of the dossier-adoption line)
**Source dossier:** `.council/research/2026-05/competitor-teardown.md` Tier B #8
**Predecessors:** Phase 2a.2.5 (PR #129 merged) + Phase 2a.2.6 (PR #130 merged)
**chairman-status:** _pending_

## Why

Both card-review reference pages now run 6–8 H2s of substantive content
(earn rates → fee summary → welcome bonus → conditions → comparison →
watch out for → is it worth it → bottom line). On mobile that is ~7
screens of scrolling before a reader who wants the verdict reaches it.
The dossier named TPG's **Jump-to-Section** sticky chrome as the
canonical fix; the handoff named it as a wanted Phase 2a.2.5 feature
(deferred to a separate brief because it has new engineering, not
just MDX/component additions).

This brief ships it.

## What ships

### 1. `rehype-slug` integrated into the MDX pipeline

`astro.config.mjs` adds the plugin to the MDX integration. Every H2/H3
gains a deterministic `id` attribute derived from its text content
(`"## Earn rates"` → `<h2 id="earn-rates">Earn rates</h2>`). Astro's
`getHeadings()` already emits matching slugs in the headings array; the
plugin just makes the DOM match so `<a href="#earn-rates">` resolves.

### 2. `[slug].astro` extracts headings

```ts
const rendered = editorial ? await render(editorial) : null;
const Content = rendered?.Content ?? null;
const headings = rendered?.headings ?? [];
```

Headings array passed to `<CardReviewLayout headings={headings}>`.

### 3. `CardReviewLayout.astro` accepts `headings` and renders the rail

- Props interface gains `headings?: { depth: number; slug: string; text: string }[]`.
- `Astro.props as Props` cast required (an interaction with Astro's
  auto-inference: adding the new prop confused the implicit typing,
  causing pre-existing destructured props to fall to `any`. Explicit
  cast restores inference cleanly. Logged in the commit message.).
- `<JumpToSection headings={headings} variant="mobile" />` rendered
  above the editorial prose slot.
- `<JumpToSection headings={headings} variant="rail" />` rendered at
  the top of the desktop sticky aside.

### 4. New component `src/components/cards/JumpToSection.astro`

- Reads headings prop, filters to `depth === 2` (H2s only — H3 nesting
  would clutter the rail).
- Two visual variants via the `variant` prop:
  - **`mobile`** — `<details><summary>Jump to section</summary>…</details>`.
    Collapsible disclosure pill above the article body. Hidden on
    `min-width: 1024px` via the component's own media queries.
  - **`rail`** — sticky right-rail TOC inside the desktop aside.
    `position: sticky; top: 80px` so it follows the reader as they
    scroll. Hidden on `<1024px`.
- Both variants share a numbered list shape: `01 → 02 → …` left-padded
  numerals in the muted token, anchor in `--ink-soft`, hover `--green`.
- Pure SSR, no JS hydration.

### 5. Global smooth-scroll + scroll-margin

`<style is:global>` block on `JumpToSection.astro`:

```css
html { scroll-behavior: smooth; }
.dp-prose h2[id] { scroll-margin-top: 80px; }
```

`scroll-margin-top` keeps the jumped-to H2 from sitting under the
sticky site header. `is:global` is required because `html` is outside
Astro's component-scoped CSS.

## What does NOT ship in this brief

- **Active-section highlighting** (scrollspy / IntersectionObserver
  driven `aria-current` on the rail item that's currently in view).
  Polish, not foundation. Defer to a follow-on phase if reader
  testing surfaces it.
- **Inline `# anchor` icons next to H2s** (`rehype-autolink-headings`
  pattern). Visual chrome; the rail and the URL fragment already cover
  the use case.
- **Propagation to non-card pages.** Guide, deal, salary-transfer, and
  bank-hub pages use other layouts and will need their own integration
  briefs.

## Verification

- `npm run check` — 0 errors, 0 warnings, 0 hints (93 files)
- `npm test` — 169 / 169 pass
- Visual check on `/cards/emirates-nbd-skywards-infinite/`:
  - Mobile (≤719.98px): collapsible "Jump to section" pill above the
    article body; opens to a numbered list of all H2s
  - Desktop (≥1024px): sticky right-rail TOC at the top of the aside,
    follows scroll
  - Clicking an entry scrolls smoothly to the H2; the H2 sits 80px
    below the viewport top (not hidden behind sticky header)
- Same on `/cards/emirates-nbd-skywards-signature/`

## Council sign-off

**Tier:** T2

| Role | Status | Notes |
|---|---|---|
| Section editor | n/a | no editorial copy changes |
| Head of UX (Stage 5.5) | pending | reviews sticky behaviour on desktop + disclosure interaction on mobile |
| Standards Editor (Stage 6.5) | pending | "Jump to section" microcopy is the only new string |
| Fact-Checker (Stage 6) | n/a | no new factual claims |
| Technical Lead | pass | rehype-slug + Astro headings API; no schema migration; layout typing handled via explicit `as Props` cast |
| Chairman (Stage 7) | pending | publish gate |

End.
