---
slug: 2026-05-09-design-handoff
convened-by: chairman
topic: Implement the Claude Design handoff — authoritative templates spec
convened: 2026-05-09
participants: technical-lead (lead), seo-strategist, fact-checker, business-realestate-editor, travel-experiences-editor, lifestyle-culture-editor, chairman
deliverable-shape: bite-size sequenced PRs, ~12-15 over 2-4 weeks
status: open
supersedes: .council/sessions/2026-05-08-tpg-pivot.md (visual scope)
authoritative-source: Claude Design bundle "JVW6dPIKTdYcvhrGrNtGfg" (2026-05-09)
---

# Council session: Claude Design handoff implementation

## Why convened

Chairman directive on 2026-05-09: "This comprehensive design and layout
and everything there is, is what i want implemented and my website to
look like. I did spend time iterating with claude design to get to this.
So this is the authoritarian model. Plan with the council whether we
should break it down to bite size changes so it doesn't break, without
missing anything." Plus: "go with the design palette changes."

The Claude Design handoff bundle (extracted to `/tmp/design2-extract/`)
contains:
- `dubaipoints/README.md` — handoff instructions ("read chats first,
  read Templates.html in full, follow imports").
- `dubaipoints/chats/` — 4 chat transcripts (1100 lines) showing the
  full iteration. Final state: palette **A · Editorial green** (warm
  paper + navy band + deep green accent) chosen over palette
  experiments B–K.
- `dubaipoints/project/Templates.html` — the design canvas (204
  lines) wrapping 18 sections / ~30 artboards.
- `dubaipoints/project/templates/*.{jsx,css}` — the implementation
  source (~3000 lines).
- `dubaipoints/project/{Brand Guidelines, Homepage, Logo Concepts}
  .html` — reference; superseded by the iterations in chat 4.

The Chairman has confirmed:
1. **Authoritative**. This handoff supersedes the TPG-pivot lock from
   `.council/research/2026-05/tpg-redesign-brief.md`. Where they
   conflict, the design wins.
2. **Palette change adopted**. Locked palette below.

## Current state on `main` (relevant)

The user pre-staged a **spike route** before this council session
opened. Already on `main`:
- `src/components/spike/{WfHeader,WfFooter,WfBoard}.astro` — small
  Wf*-prefixed components that mirror the design's chrome.
- `src/pages/design-spike/templates.astro` — 2561-line Astro page
  that lifts the entire Templates.html canvas as a viewable spike
  at `/design-spike/templates/`.
- `src/styles/spike/wireframes.css` — 997-line CSS file consolidating
  the design's `templates/{styles,extras,missing,missing2}.css`,
  scoped to `.dp-spike-canvas` so it cannot leak.

This is **a wireframe reference route**, not the production
implementation. It stays visible at `/design-spike/templates/` as the
ground truth while the council promotes pieces to production.

## Authoritative palette — locked

```css
/* Design-handoff palette — locked 2026-05-09 (supersedes TPG pivot).
   Warm-paper editorial system: deep ink, deep green accent, teal-navy
   band, link blue interactive only. Five-tone surface rotation via
   shade-1 / shade-2 / paper / bg / navy. */
:root {
  /* Surfaces — warm, layered */
  --bg:        #fbfaf6;     /* default page surround (warm) */
  --paper:     #fdfcf8;     /* cards, callouts (slightly warmer) */
  --shade-1:   #f1eee7;     /* hover wash, page-head gradient stop */
  --shade-2:   #e0dccf;     /* deeper shade, byline avatar bg */

  /* Dark band identity */
  --navy:      #1f3a4d;     /* primary dark band — feature card, hero */
  --navy-deep: #0f1f2e;     /* footer / very dark band */

  /* Type — warm near-black, NOT royal navy */
  --ink:       #1f2328;
  --ink-soft:  #56606b;
  --muted:     #9aa0a6;

  /* Lines — warm */
  --line:      #dad6cd;
  --line-soft: #ece9e1;

  /* Accent — deep editorial green */
  --green:     #2d6a52;     /* eyebrows, pull-quote mark, CTAs */
  --green-band:#1d6b54;     /* legacy from TPG pivot — newsletter band */

  /* Interactive — link only, never display type */
  --link:      #1a5fc6;
  --link-deep: #154fa3;
  --link-soft: #eef3fb;

  /* Signal — live / expiry / warnings only */
  --red:       #c8412d;

  /* Legacy — defined for backward compat, not used in new UI */
  --gold:      #b8842a;
  --gold-soft: #f3ead6;
  --brand:     #1a5fc6;
  --brand-deep:#154fa3;
  --brand-soft:#eef3fb;
  --cool:      #f4f5f7;
  --cream:     #f8f0e0;
}
```

## Authoritative type — locked (from `templates/styles.css`)

- **Display:** Fraunces serif, weight **700–800**. Tight tracking
  (-0.4 to -1.4px depending on size). Clamp scales unchanged from
  TPG-pivot lock.
- **Body:** DM Sans sans, **16px / 1.72 line-height** (was 1.55).
  Drop-cap on first paragraph in `.dp-prose`: Fraunces 700 / 54px.
- **Eyebrows:** 10–11px / 700 / 2.5px tracking / uppercase /
  `--green` on white. White on dark backgrounds.
- **Body line-height bump** is a real perceptible change — every
  long-form page breathes more.

## Implementation sequence — bite-size, in order

Each chunk = one PR, own branch, own Chairman gate, own verification
(npm run check + build + test). Per the Chairman's instruction:
"so it doesn't break, without missing anything."

### Phase A — Foundation (3 PRs)

**A1. Palette retune.** Update `src/styles/global.css` `:root` with
the locked palette above. All `.dp-*` rules cascade. No component
code touched. Adds `--shade-1` / `--shade-2` as new tokens.
*Risk: low.* Visual change everywhere, structural change nowhere.
*Branch: `claude/design-handoff-foundation`. **Starting now.***

**A2. Header rewrite.** Replace `src/components/Header.astro` with
the design's chrome: wordmark `DubaiPoints.` (with `--green` dot),
nav row (Cards / Banks / Airlines / Guides / Deals / News), tracker
strip with green live-dot beneath. Keep the existing hamburger
drawer at `<1024px` — don't lose mobile working state. Reference:
`templates/chrome.jsx::Header` and `src/components/spike/WfHeader.
astro`.
*Risk: medium.* Header renders on every page.

**A3. Footer rewrite.** Replace `src/components/Footer.astro` with
the design's footer: dark `--navy-deep` band, 4-column grid
(brand / Publication / Content / Tools), bottom strip. Reference:
`templates/chrome.jsx::Footer` and `src/components/spike/WfFooter.
astro`.
*Risk: low.* Same as A2, but footer has less visible state.

### Phase B — Core templates (3 PRs)

**B1. Section-index template.** New layout consumed by
`/cards/`, `/banks/`, `/airlines/`, `/guides/`, `/deals/`, `/news/`.
Page-head with crumb + h1 + lede + gradient (`--shade-1` →
`--paper`). Filter pills + sort dropdown. Featured grid (1 hero +
2 medium + 4 small). Pull-quote separator with green oversized
mark. Feed list with hover wash. Pagination. Reference:
`templates/chrome.jsx::SectionIndex`.
*Risk: medium.* Replaces 6 existing index pages. Build per route
adapts existing collection queries.

**B2. Article template (long-form: guides, news, deals).** Replace
`src/layouts/ArticleLayout.astro`. Page-head + sticky right rail
(In this guide / Related). Body: byline with avatar, deck (italic
Fraunces), drop-cap, prose, blockquote, pullbox. Reading progress
bar at top. Reference: `templates/article.jsx::Article`.
*Risk: medium.* Affects every guide / news / deal page.

**B3. Card review template.** Replace `src/layouts/CardReviewLayout
.astro`. Navy hero band with card mock (1.586:1 ratio, navy gradient,
bank/name/network printed on card art, no real photo). Verdict pill
with 0–5 score. Sticky sidebar with three spec cards: At a glance /
Earn rates / Editor's call (navy-bg variant). Reference:
`templates/article.jsx::CardReview`.
*Risk: medium-high.* Affects every card review page (33 cards on
file). Care: editor-confirmed `_provenance` on `cards.json` is
preserved; no schema change.

### Phase C — Tools (3 PRs)

**C1. Salary-transfer tracker (page).** Replace `/salary-transfer/
index.astro`. Page-head + toolbar (search input, min-salary select,
type select, status select, reset pill) + sortable table with
bank-mark / tier / min-salary / bonus AED / Δ-30d / status / drill-
down. Methodology footer. The Preact island
`SalaryTransferTracker.tsx` keeps its existing data binding;
chrome around it adapts. Reference: `templates/tools.jsx::Tracker`.

**C2. Valuations (page).** New `/valuations/` page (currently
empty). Same chrome as tracker: page-head + toolbar + table with
programme / floor / ceiling / DP value / distribution bar / Δ-90d
/ status. Methodology footer. Reference:
`templates/tools.jsx::Valuations`. **Blocker: methodology copy is
a Q3 2026 artifact per `EDITORIAL.md`** — design ships the layout,
methodology landing page added in Phase E.

**C3. Compare (page).** New `/cards/compare/` page. Toolbar +
side-by-side comparison table grouped by section (Eligibility /
Earn rates / Benefits / DP verdict / Score). Reference:
`templates/tools.jsx::Compare`.

### Phase D — Editorial pages (1 PR)

**D1. Trust pages restyle.** Update `TrustPageLayout.astro` to the
design's `.wf-editorial` pattern: max-width 760px, h1 56px Fraunces
800, lede italic Fraunces 22px, two-column editorial grid
(`200px 1fr`). The four trust pages (about / team /
editorial-policy / how-we-make-money) inherit. Reference:
`templates/chrome.jsx::Editorial`.

### Phase E — Secondary surfaces (5–7 PRs)

After reading `extras.jsx`, `menus.jsx`, `missing.jsx`,
`missing2.jsx` and their CSS:

**E1. Mobile drawer + desktop mega-menu.** Reference: `menus.jsx`.
Replaces / extends current Header drawer.

**E2. Best-of hub + Friday Brief + Author page.** Three new
templates from `extras.jsx`. Best-of hub anchors a
`/cards/best-2026/` route; Friday Brief lives at `/newsletter/`
(replacing the placeholder); Author page at `/team/<author>/`.

**E3. Search & reference.** Search results (Pagefind UI),
methodology master page, glossary. From `missing.jsx`. Replaces
current empty `/search/` (route doesn't exist yet).

**E4. Authority surfaces.** Press / cited-in, partnership, annual
archive, RSS feeds page. From `missing.jsx`. New routes.

**E5. Empty / error states.** 404 / no-results / paywall.
Cloudflare Pages 404 needs a `_redirects` rule; Astro `404.astro`
landing page. From `missing.jsx`.

**E6. Mobile views audit.** From `missing.jsx`. Sweeping check at
390px against the design's three reference screens.

**E7. Topic hubs + tag index.** From `missing2.jsx`. New routes
`/topics/<slug>/` (e.g. `/topics/fab/`), `/tags/`.

### Phase F — Interactive tools (2-3 PRs)

**F1. "Should I keep this card?" decision tool.** From
`missing2.jsx`. Q&A flow → verdict.

**F2. Points calculator.** From `missing2.jsx`. Programme +
points → AED-value redemption suggestions.

**F3. Comparison picker.** Empty-state for `/cards/compare/` —
chooser before the table loads. From `missing2.jsx`.

### Phase G — Trust + craft (2 PRs)

**G1. Tip line + corrections log.** From `missing2.jsx`. New routes
`/tips/`, `/corrections/`.

**G2. Per-issuer card-art system + OG image generator + style
guide.** From `missing2.jsx`. Affects existing `.dp-card-tile`
rules in `global.css` (per-bank accent stripe + monogram), adds
`/og/<slug>.png` generator, internal `/style-guide/` route.

## Total scope

**~17 chunks** sequenced over an estimated 3–4 weeks at the
existing bite-size cadence (one chunk per session, sometimes two).

## Editorial fence — re-stated unchanged

The visual handoff does NOT touch the Charter's editorial non-
negotiables. They carry forward verbatim:

- AED-first pricing on every page
- No advertorial-driven recommendations at launch
- Affiliate disclosure inline above the fold (when affiliates land)
- Chairman publish gate
- Firecrawl exclusive to Head of Research
- LLM-extraction policy — `editorTake` only; typed numerics via
  deterministic regex
- HfP-dry voice in prose
- No Tailwind utilities in long-form pages

The Brand Guidelines.html in the bundle (early v1, navy + gold +
Sora typography) is **superseded** by the chat-4 iterations — chat
1 was the early branding work, the user iterated past it. Don't
re-introduce gold or Sora.

## Data layer — protected

The existing scrape pipeline and content collections are unaffected
by this work:
- `src/data/cards.json` — 33 cards. **No schema change.** Editor-
  confirmed provenance preserved.
- `src/lib/cardsData.ts` — Zod L2 schema unchanged.
- `scripts/scrape/*` — pipeline unchanged.
- `.github/workflows/scrape.yml` — monthly cron unchanged.

If a chunk needs a schema field that doesn't exist (e.g. card-score
0–5, `cardArtUrl`, per-issuer accent), it's added as an optional
field with a Chairman-gated migration commit. None are required for
Phase A–D.

## Spike route — preserved

`/design-spike/templates/` (the 2561-line wireframe page) stays
visible as the ground truth throughout the rollout. Once Phase G
ships, the spike route can be deleted as a housekeeping commit.

## Synthesis owner

**Managing Editor.** Routes per-chunk progress to STATUS.md after
each merge. Escalates blockers to the Chairman.

## Amendment log

| Date | Editor | Note |
|---|---|---|
| 2026-05-09 | managing-editor | Session opened. Claude Design handoff is the authoritative spec; TPG pivot superseded on the visual axis. 17-chunk plan sequenced; Phase A1 (palette retune) starts immediately on `claude/design-handoff-foundation`. |
