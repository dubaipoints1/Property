# Claude Design rollout — phased migration plan

**Status:** Draft for Chairman sign-off.
**Branch:** `claude/implement-templates-html-hPy5l` (this PR carries
the spike + 5 homepage iterations; rollout phases below land as
follow-on PRs).
**Source of truth:** Claude Design handoff bundle —
- Polished landing page: `dubaipoints/project/Homepage.html`
- Wireframe canvas (every other page): `dubaipoints/project/Templates.html`
- Conversation: `dubaipoints/chats/chat4.md`

---

## Lock-in

The Chairman has confirmed: **the old layout is gone.** The Claude
Design output supersedes:
- The TPG-adapted spec at `tpg-redesign-brief.md`
- Every layout under `src/layouts/*.astro` shipped against that spec
- The homepage built against PR #23 (Quiet Ledger) and re-themed in
  the TPG pivot

The polished bundle is the design system. Everything migrates to it.
No more parallel-universe styling.

---

## Goal

Make `dubaipoints.ae` render as the polished Claude Design across
every page a reader can land on. End-state checklist:

1. Header carries the wireframe wordmark (`DubaiPoints` + green dot),
   the 3-item rotating tracker strip, and a clean nav row. Mobile
   drawer survives.
2. Footer is the wireframe footer (navy-deep band, four-column grid,
   tagline, disclaimer line).
3. Every section index page (`/cards/`, `/banks/`, `/airlines/`,
   `/guides/`, `/deals/`, `/news/`) uses the wireframe `SectionIndex`
   pattern: page-head, filter pills, featured grid (1 hero + 2 medium
   + 4 small), pull-quote, numbered feed, pagination.
4. Card review pages use the wireframe `CardReview` pattern: navy
   hero with card mock + verdict chip, sticky specs sidebar, drop-cap
   prose, three spec cards in the sidebar.
5. Salary-transfer tracker uses the wireframe `Tracker` pattern:
   page-head with stats, filter toolbar, sortable bank table with
   delta column, methodology footer.
6. Article/guide/news pages use the wireframe `Article` pattern: deck,
   byline, drop-cap prose, sticky TOC sidebar, related sidebar.
7. Bank hub + airline programme pages use the wireframe `TopicHub`
   pattern: hub head with stats grid, filter chips, list rows.
8. Tools (Compare, Calculator, Salary-transfer history) use the
   wireframe tool patterns.
9. Editorial pages (About, Editorial Policy, How We Make Money, Team,
   Newsletter) use the wireframe `Editorial` + `FridayBrief` patterns.
10. Trust pages (Methodology, Corrections, Tip Line) use the
    wireframe equivalents.
11. New routes — `/best-of/`, `/brief/`, `/authors/<slug>/`,
    `/search/`, `/glossary/`, `/press/`, `/partnerships/`,
    `/archive/2025/`, `/feeds/` — exist as live pages, not just
    wireframe artboards.

---

## Approach

**Phased migration, one PR per phase, each phase independently
shippable and rollback-safe.** No phase removes the previous phase's
work; each builds on the last. After every phase the build is green,
schema validates, mobile renders, and Pagefind indexes correctly.

**Class-system decision (load-bearing):** the polished bundle's
`Homepage.html` already uses `.dp-*` classes — the same prefix the
existing site uses. The wireframe canvas (`Templates.html`) uses
`.wf-*` classes scoped to the spike. **Production migrates to the
polished `.dp-*` system, not the wireframe `.wf-*`.** The wireframe
artboards are reference for IA/markup; the polished homepage is
reference for tokens/typography/component classes.

This means: existing `.dp-*` rules in `src/styles/global.css` get
*replaced* (not extended) with the polished bundle's rules where they
diverge. The `.wf-*` styles stay scoped to `/design-spike/` for
editorial review.

---

## Phases

Each phase below is a separate PR. Order matters — earlier phases
unblock later ones. Ranges given are estimates assuming careful work.

### Phase 0 — Foundations · ~2 hours

**Scope:** the global pieces every other phase depends on.

**Files:**
- `src/styles/global.css` — replace `.dp-*` rules with the polished
  bundle's. Keep design tokens (`--paper`, `--navy`, `--green`, etc.)
  identical; they already match.
- `src/components/Header.astro` — adopt the wireframe wordmark,
  tracker strip, rotating ticker. Keep mobile drawer (rebuild if
  needed). Add desktop nav matching wireframe order
  (Cards / Banks / Airlines / Guides / Deals / News).
- `src/components/Footer.astro` — port the wireframe footer
  wholesale (navy-deep, 4-column grid, tagline, bottom line).
- `src/layouts/BaseLayout.astro` — verify Header/Footer wiring; add
  any new global typographic resets the polished bundle requires.

**Risks:**
- Mobile drawer is shipped UX. Don't break it. Rebuild as a
  full-screen overlay matching the wireframe `MobileMenu` pattern if
  the existing checkbox-drawer can't carry the new visual.
- Sticky positioning. Header height affects scroll-margin throughout.

**Verification:**
- `npm run check` clean.
- `npm run build` clean, all 80+ pages render.
- Mobile drawer opens/closes (test at 390 / 768 / 1280px).
- Sticky header doesn't overlap heading anchors.

**Definition of done:** every existing page on the site shows the new
header + footer. Body content of inner pages may still be old — those
get migrated in later phases.

### Phase 1 — Homepage · DONE

5 iterations applied. Already on this branch.

### Phase 2 — Card review · ~2 hours

**Scope:** the single most-inherited template.

**Files:**
- `src/layouts/CardReviewLayout.astro` — rewrite to wireframe
  `CardReview` markup: navy hero with `wf-card-mock` (rebadged
  `dp-card-art`), verdict chip with score, sidebar with three
  `wf-spec-card` blocks (`At a glance`, `Earn rates by category`,
  `Editor's call` on navy), drop-cap prose. Bind to existing card
  data. Preserve schema.org `CreditCard` JSON-LD. Preserve
  `Disclaimer.astro` placement.

**Verification:**
- Schema validator passes (Google Rich Results Test).
- Sticky sidebar holds on scroll at ≥1024px.
- Affiliate links flagged with disclosure inline above the fold.
- AED rendered on every fee/salary value.

**Definition of done:** every `/cards/<slug>/` page renders with the
new layout, real data, no schema regressions.

### Phase 3 — Salary-transfer tracker · ~1.5 hours

**Files:**
- `src/layouts/SalaryTransferTrackerLayout.astro` — wireframe `Tracker`.
- `src/pages/salary-transfer/index.astro` — page header + stats line
  ("Banks tracked: 14 · Last refresh: 2 hours ago · Changes 30d: +5/-2").

**Bind to existing offer data:**
- `getLiveOffers()` from `src/lib/offerAdapter.ts`
- `bankReputation` collection
- 30-day delta computed from `salaryTransferOfferHistory`

**Verification:**
- Sortable table works (or static sort by current default).
- Methodology footer links to `/methodology/`.
- "Submit a correction" link works.

### Phase 4 — Section indexes · ~3 hours

**Scope:** six routes share one pattern.

**Files:** new layout `src/layouts/SectionIndexLayout.astro` plus
edits to:
- `src/pages/cards/index.astro`
- `src/pages/banks/index.astro`
- `src/pages/airlines/index.astro`
- `src/pages/guides/index.astro`
- `src/pages/deals/index.astro`
- `src/pages/news/index.astro`

Wireframe `SectionIndex`: page-head + filter pills + featured grid
(1+2+4) + pull-quote + numbered feed + pagination.

**Risks:**
- Each section has different filter dimensions (cards by type, banks
  by tier, airlines by region). Filter pill destinations need careful
  wiring.
- Pagination — Astro static-output means each page is a route. May
  need to generate `[page].astro` dynamic routes per section.

**Verification:** all six routes render with the same chrome,
different data.

### Phase 5 — Article + Guide + News long-form · ~2 hours

**Files:**
- `src/layouts/ArticleLayout.astro` — wireframe `Article`.
- `src/layouts/GuideLayout.astro` — same template, different category
  on the eyebrow.
- (News uses `ArticleLayout`.)

Wireframe `Article`: page-head with crumb + h1 + dek, byline strip
with share/save/print links, hero illustration, drop-cap prose,
sticky TOC sidebar with numbered chapters, related-articles sidebar,
reading-progress bar.

**Verification:**
- Drop-cap renders correctly (Fraunces 700, ~54px first letter).
- Reading-progress bar tracks scroll.
- TOC anchors work.
- `Article` schema.org JSON-LD preserved.

### Phase 6 — Bank hub + Airline programme · ~2 hours

**Files:**
- `src/layouts/BankHubLayout.astro` → wireframe `TopicHub`.
- `src/layouts/AirlineProgramLayout.astro` → wireframe `TopicHub`
  with airline-specific stats (DP value, partner count, routes).

Wireframe `TopicHub`: hub head with crumb + h1 + intro + 4-cell stats
grid + meta sidebar with Follow CTA, filter chips by format and
product, list of articles with cat/date/title/excerpt/byline.

**Verification:**
- Stats are computed from real data.
- Follow CTA links to topic-specific RSS feed (Phase 9 wires the
  feed; this phase links to a placeholder that 404s gracefully).

### Phase 7 — Tools · ~2 hours

**Files:**
- `src/layouts/ComparisonTableLayout.astro` → wireframe `Compare`.
- `src/layouts/SalaryTransferCalculatorLayout.astro` → wireframe
  decision-tool / calculator hybrid.
- `src/layouts/SalaryTransferHistoryLayout.astro` → tracker with
  archived-offer flag.

Compare: 3-column card-mock head + section-row groupings (Eligibility
/ Earn rates / Benefits / DP verdict / Score) + "Add up to 4 cards"
foot.

Calculator: 3-step decision form chrome (already half-built in
`src/lib/salaryTransfer.ts`), styled per wireframe `KeepCardTool`
pattern with progress bar + step card + verdict preview.

### Phase 8 — Editorial pages · ~1.5 hours

**Files (5 pages):**
- `src/pages/about.astro`
- `src/pages/editorial-policy.astro`
- `src/pages/how-we-make-money.astro`
- `src/pages/team.astro`
- `src/pages/newsletter.astro`

About / policy / money: wireframe `Editorial` pattern (single column,
760px max width, lede italic, label + body two-column rows).

Newsletter: wireframe `FridayBrief` (centred hero with subscribe form,
trust line, two-column body with archive list + sidebar cards).

Team: hybrid — `Editorial` wrapper with a per-author card grid using
the `AuthorPage` head pattern miniaturised.

### Phase 9 — Trust + new routes · ~3 hours

**Trust pages (existing routes):**
- `src/layouts/TrustPageLayout.astro` → wireframe `Methodology`.

**New routes (currently only in spike):**
- `/best-of/2026/` (and `/best-of/<year>/` index) — wireframe `BestOf`
- `/brief/` — wireframe `FridayBrief`
- `/authors/<slug>/` — wireframe `AuthorPage`, dynamic by author
- `/search/` — wireframe `SearchResults`, wired to Pagefind
- `/glossary/` — wireframe `Glossary`, MD content collection
- `/press/` — wireframe `Press` page
- `/partnerships/` — wireframe `Partnership` page
- `/archive/2025/` — wireframe `AnnualArchive`
- `/feeds/` — wireframe `RSSPage`
- `/corrections/` — wireframe `Corrections` log
- `/tip/` — wireframe `TipLine`
- `/methodology/` — wireframe `Methodology` (canonical home)
- `/topics/` — wireframe `TagIndex`

**Risks:** each new route needs a content source (collection, MDX,
or generated). Where data doesn't exist yet, ship the page with
empty-state copy ("Building the archive…") rather than fake content.

### Phase 10 — Polish + QA · ~2 hours

**Scope:** site-wide review with no new code.

- Run `npm run check` and `npm run build` clean.
- Schema validation across the 10 highest-traffic pages.
- Lighthouse mobile + desktop on homepage, card review, tracker.
- Accessibility audit: focus states, prefers-reduced-motion,
  contrast ratios.
- Pagefind: every published page indexed; spike + WIP pages excluded.
- 404 page renders the wireframe `ErrorStates` 404 panel.
- robots.txt + sitemap.xml regenerated.

---

## Cross-cutting concerns (apply to every phase)

| Concern | What to do | Phase ownership |
|---|---|---|
| **Design tokens** | `--paper`, `--navy`, `--green`, `--link`, `--ink`, `--ink-soft`, `--muted`, `--line` are locked. Any new colours go through Chairman. | Phase 0 fixes; later phases consume only. |
| **AED-first** | Every fee, salary, value rendered in AED. Never USD. | Every phase. |
| **Schema.org JSON-LD** | `CreditCard`, `Article`, `BreadcrumbList`, `Organization` blocks preserved through markup changes. | Phases 2, 5, 6 specifically. |
| **Affiliate disclosure** | `Disclaimer.astro` inline, above the fold, on every card review and tool. | Phases 2, 3, 7. |
| **Mobile UX** | Every layout works at 390px wide. Drawer for nav. Stacked compare table on mobile. | Every phase. |
| **Pagefind indexing** | Production pages indexed; `data-pagefind-ignore` only on spike + admin. | Phase 0 + spot checks. |
| **Reduced motion** | Ticker + animations honour `prefers-reduced-motion`. | Phase 0 (header ticker) + Phase 5 (reading progress). |
| **Sitemap + canonical URLs** | Don't rename slugs. New routes added to `astro.config.mjs` if needed. | Phase 9 (new routes). |
| **Slug discipline** | New routes use lower-case-kebab-case. SEO Strategist signs off. | Phase 9. |
| **Editorial fences** | No advertorial language anywhere. No "Apply now". No score-for-pay. | Phase 9 (partnership page wording). |

---

## Sign-off checkpoints

The Chairman signs off **before** each phase starts. After each phase
the Chairman signs off the resulting PR. Phase 0 is the only one that
*requires* the next phase to be planned alongside, because the global
chrome change is visually load-bearing.

| Checkpoint | What's needed |
|---|---|
| **Pre-Phase 0** | Confirm class-system decision (`.dp-*` adopted, `.wf-*` stays in spike). Confirm header & footer markup direction. |
| **Post-Phase 0** | Visual diff review on three breakpoints (mobile / tablet / desktop). |
| **Pre-Phase 4** | Confirm filter dimensions per section (cards-by-type, banks-by-tier, etc.). |
| **Pre-Phase 9** | Confirm which new routes ship with empty-state copy vs. real content. |
| **Post-Phase 10** | Full-site walkthrough before merging the rollout to `main`. |

---

## Estimated total

**~16–19 hours of focused engineering work**, spread across 5–7
sessions of 2–4 hours each. The work fits naturally into a
2-week sprint at one phase per workday.

PR strategy: each phase is its own PR, all branched off
`claude/implement-templates-html-hPy5l` after that PR merges. The
spike branch stays the long-lived integration branch until rollout
is complete.

---

## What this plan does NOT cover

- **Content scraping with Firecrawl.** Out of scope here — that's the
  Head of Research's beat (CLAUDE.md Part I §"Non-negotiables" #2 +
  the existing scrape pipeline). The user mentioned this as the
  *follow-on* to the design rollout. Plan that as a separate dossier
  once Phase 10 ships.
- **Per-bank card-art SVGs / photography.** The wireframes use
  printed placeholders. Once design ships and licensing budget is
  clear, swap to real card art. Not on the critical path.
- **Schema audits beyond rich-results validation.** A full
  schema-graph review is a separate task best run after Phase 10.

---

## Open questions for the Chairman

1. **Mobile drawer pattern:** rebuild as the wireframe `MobileMenu`
   full-screen overlay (3 expandable sections + tools + publication
   block) or keep the existing slim left-drawer pattern restyled to
   wireframe colours? *Recommendation: rebuild — the wireframe
   pattern is what the user signed off on.*
2. **New-route content:** for `/best-of/2026/`, `/authors/<slug>/`,
   `/glossary/` — do we ship with placeholder content (`/best-of/`
   with 3 categories filled, the rest "coming soon") or wait until
   real content exists for each? *Recommendation: ship the chrome,
   stub the content; readers see the architecture immediately.*
3. **`/search/` route:** wire to Pagefind in Phase 9 or punt to a
   later session? *Recommendation: wire it — Pagefind is already
   running in `postbuild`; we just need a search results page.*

Once the Chairman answers these and approves the phasing, execution
starts at Phase 0.
