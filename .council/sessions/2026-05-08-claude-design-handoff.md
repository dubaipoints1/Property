# 2026-05-08 · Claude Design handoff — implementation pass 1

**Branch:** `claude/implement-templates-html-hPy5l`
**Status:** Ready to merge. Spike + 5 homepage iterations live behind it.

---

## What shipped tonight

### 1. Wireframe canvas at `/design-spike/templates/`
A single Astro page recreating every artboard from the Claude Design
handoff (Templates.html), so the editorial team can review the IA + layouts
in-context. Eighteen sections, 24 artboards. Carries `noindex,nofollow` +
`data-pagefind-ignore` so the spike is invisible to search and the
in-site Pagefind index. Files:

- `src/pages/design-spike/templates.astro`
- `src/styles/spike/wireframes.css`
- `src/components/spike/{WfHeader,WfFooter,WfBoard}.astro`

Source: `dubaipoints/project/Templates.html` from the handoff bundle.

### 2. Five homepage iterations applied to live `/`
Per chat 4 of the design transcript ("All five iterations are in:"),
applied to `src/pages/index.astro` + `src/styles/global.css`:

1. **Per-bank card-art differentiation.** `.dp-card-tile` now carries a
   bank modifier class (`is-fab`, `is-enbd`, `is-mashreq`, `is-hsbc`,
   `is-adcb`, `is-dib`, `is-rak`, `is-cbd`) that drives a top-stripe
   accent + tinted radial wash. Each tile also renders a 2-letter ghost
   monogram bleeding off the bottom-right corner. Falls back to navy
   when the bank isn't in the map.
2. **Feature card DP ghost.** Giant `clamp(260px, 58vw, 520px)` "DP"
   ghost on `.hp-feature-section .dp-feature-card::before`, bleeds off
   the left edge.
3. **Numbered hero index.** `.hp-latest-list` uses a CSS counter to
   render decimal-leading-zero counters (`01`, `02`, …) in front of
   each row, in monospace tabular-nums DM Sans.
4. **Rotating tracker headline.** `.hp-masthead-live` now contains a
   3-item ticker (`hp-ticker-wrap`) on a 12-second loop. Honours
   `prefers-reduced-motion` (shows item 1 only).
5. **Newsletter wave.** Five-line SVG wave path along the bottom of the
   green band, behind the form (z-indexed so the form stays clickable).

### Verification
- `npm run check` → 60 files · 0 errors · 0 warnings · 0 hints
- `npm run build` → 81 pages built, postbuild Pagefind clean
- Iteration markers grep-confirmed in `dist/index.html`:
  `hp-ticker-item`, `art-monogram`, `hp-newsletter-wave`, `is-fab`,
  `is-enbd` all present.

---

## What did NOT ship — and why

The user asked for "all 12 layouts live" overnight. I deliberately did
not do this. Reasons, ranked by severity:

1. **The wireframes use `.wf-*` CSS, the production site uses `.dp-*`.**
   Lifting wireframe markup wholesale into live layouts means swapping
   the global stylesheet — 80-page blast radius, Chairman gate per
   CLAUDE.md Part I §"Non-negotiables" #3.
2. **Header (`Header.astro`, 380 lines) carries the mobile drawer.** The
   wireframe header is desktop-only flat chrome. A naive swap would
   break mobile UX for ≥70% of traffic.
3. **`CardReviewLayout` and `SalaryTransferTrackerLayout` are shipped
   and feed schema.org structured data.** Replacing the markup without
   a daylight schema audit risks dropping rich-result eligibility.
4. **The wireframes are explicitly a wireframe pass.** Per the design
   post-it: "Layout & IA only — colour and richer brand decoration land
   in the polish pass."

---

## Punch-list for the next session

In priority order (highest editorial visibility first):

| # | Layout | Live route(s) | Notes |
|---|---|---|---|
| 1 | `HomepageLayout` (unused — delete?) | — | `index.astro` is the live homepage; layout file is legacy. Confirm and remove. |
| 2 | `Header.astro` | every page | Adopt wireframe wordmark + green dot + tracker strip. Keep the mobile drawer. |
| 3 | `Footer.astro` | every page | Direct port of the wireframe footer. Low risk. |
| 4 | `CardReviewLayout` | `/cards/<slug>/` | Wireframe `CardReview` artboard. Preserve `Disclaimer` + schema. |
| 5 | `SalaryTransferTrackerLayout` | `/salary-transfer/` | Wireframe `Tracker`. Existing offer data wires straight in. |
| 6 | Section indexes | `/cards/`, `/banks/`, `/airlines/`, `/guides/`, `/deals/`, `/news/` | Wireframe `SectionIndex`. Featured grid + numbered feed. |
| 7 | `ArticleLayout` + `GuideLayout` | `/guides/<slug>/`, `/news/<slug>/` | Wireframe `Article`. |
| 8 | `BankHubLayout` + `AirlineProgramLayout` | `/banks/<slug>/`, `/airlines/<slug>/` | Adapt the wireframe `TopicHub` pattern. |
| 9 | `ComparisonTableLayout` + `SalaryTransferCalculatorLayout` + `SalaryTransferHistoryLayout` | tools | Wireframe `Compare` + `PointsCalculator` + tracker (history variant). |
| 10 | Editorial pages | `/about/`, `/editorial-policy/`, `/how-we-make-money/`, `/team/`, `/newsletter/` | Wireframe `Editorial` + `FridayBrief`. |
| 11 | `TrustPageLayout` | trust pages | Adapt wireframe `Methodology` + `Corrections` + `TipLine`. |

### Things to watch for during each migration

- **Schema preservation.** Each card review and bank hub emits JSON-LD —
  preserve it through the markup change. Run a schema validator on the
  built HTML before merging.
- **Sitemap + canonical URLs.** Astro generates these from `Astro.url`
  + `astro.config.mjs site`. Don't rename slugs without a redirect.
- **Pagefind body markers.** The spike uses `data-pagefind-ignore`. New
  production pages should NOT carry that attribute.
- **Affiliate disclosure.** Editorial standards §"Non-negotiables" #5:
  affiliate disclosure inline, above the fold. The wireframes reference
  this (Methodology disclosure block) but the live `Disclaimer.astro`
  component is the source of truth.
- **AED-first.** Every figure stays in AED. The wireframes are already
  AED-native; just don't introduce USD anywhere during the swap.

### What "make it live" looks like end-state

1. Every page on `dubaipoints.ae` reads as the polished bundle's
   `Homepage.html` design (green dot wordmark, warm paper feel, Fraunces
   display type, navy feature bands, emerald newsletter band).
2. Section index pages use the 4-column featured grid + numbered list.
3. Tools (tracker, valuations, compare) use one shared chrome —
   page-head + filter toolbar + sortable table + methodology footer.
4. Card art has per-issuer differentiation, not the same navy everywhere.
5. The Friday Brief, best-of hub, author pages, and topic hubs exist as
   live routes (currently they only exist in the spike canvas).

Estimated remaining work: 8–14 hours of careful migration across 2–3
sessions, depending on how aggressively existing layouts get rewritten
vs. progressively patched.

---

## Source

- Handoff bundle: `https://api.anthropic.com/v1/design/h/8RxmMqLxm-xFsXwLK5xCrQ`
- Polished homepage: `dubaipoints/project/Homepage.html`
- Wireframe canvas: `dubaipoints/project/Templates.html`
- Conversation: `dubaipoints/chats/chat4.md`
