# dubaipoints.ae — multi-phase build plan

This document is the source of truth for the dubaipoints.ae build across
sessions. Each phase below has clear in-scope and out-of-scope items.

## Vision

A UAE-focused points and miles publication. Tone and density inspired by Head
for Points; visual hierarchy and comparison tables inspired by The Points Guy.
Differentiation: **UAE-specific** — every figure in AED, every card checked
against UAE eligibility rules (minimum salary, salary transfer requirements,
residency), full coverage of regional programmes (Skywards, Etihad Guest, Qatar
Privilege Club, Saudia Alfursan), and DXB / AUH airport content.

## Stack

- **Astro 5** with TypeScript (strict)
- **Tailwind 4** via `@tailwindcss/vite` (CSS-first config)
- **MDX** for long-form content
- **Astro Content Layer API** with **Zod** schemas for typed content collections
- **Pagefind** for static client-side search
- **Cloudflare Pages** for hosting (auto-deploy on push to `main`)
- **Cloudflare Web Analytics** for traffic measurement
- **Firecrawl** + GitHub Actions cron for bank product scraping (Phase 2)

## Repo layout

```
src/
  content/           # MDX content, validated by Zod
    banks/
    cards/
    programs/
    deals/
    guides/
  layouts/           # BaseLayout etc.
  components/        # Shared UI
  pages/             # Routes
  styles/            # global.css (Tailwind 4 + theme tokens)
  content.config.ts  # Zod schemas (Astro 5 Content Layer)
scripts/scrape/      # Firecrawl scrapers (Phase 2)
data/scraped/        # Raw scraper output, gitignored except .gitkeep
.github/workflows/   # CI: scrape cron, deploy
```

## Phase 1 — scaffold + schemas (current)

- Astro 5 + TypeScript strict + Tailwind 4 + MDX scaffolded
- Pagefind wired as `postbuild` (will need a search UI in Phase 3)
- Cloudflare Web Analytics snippet in `BaseLayout` (token placeholder until Phase 4)
- Zod schemas defined for all five collections in `src/content.config.ts`
- One example MDX entry per collection so every Zod field is exercised
- `PLAN.md` (this file) committed at repo root
- Stop here for schema review

**Done when:** `npm run build` succeeds with all five example entries passing
Zod validation, and the landing page renders collection counts.

## Phase 2 — content + scraping pipeline

**Bank target priority (highest first):**

1. Emirates NBD
2. First Abu Dhabi Bank (FAB)
3. Abu Dhabi Commercial Bank (ADCB)
4. Mashreq
5. HSBC UAE
6. Citi UAE
7. Standard Chartered UAE
8. RAKBank
9. Commercial Bank of Dubai (CBD)
10. Dubai Islamic Bank (DIB)
11. ADIB

**Scraper architecture:**

- One TypeScript script per bank in `scripts/scrape/<bank>.ts`, all sharing a
  `scripts/scrape/_lib.ts` for Firecrawl client setup, normalisation, and
  diffing.
- Scripts call Firecrawl on the bank's published card pages, normalise the
  output to the Card Zod shape, and write to `data/scraped/<bank>/<timestamp>.json`.
- A separate `scripts/scrape/propose-changes.ts` reads the latest scrape per
  bank, diffs against `src/content/cards/`, and emits draft MDX with frontmatter
  changes in a working branch.

**GitHub Actions:**

- `.github/workflows/scrape.yml` runs weekly via cron, executes the scrape +
  propose pipeline, and opens a PR titled `scrape: weekly card refresh
  (YYYY-MM-DD)` with diffs against `src/content/cards/`. **Never auto-merges.**
- Secrets: `FIRECRAWL_API_KEY` stored in repo secrets.
- A separate `deploy.yml` is **not** needed — Cloudflare Pages deploys on push.

**Out of scope for Phase 2:** card detail pages, comparison tables, search UI.

## Phase 3 — site UX

- **Card detail page** (`src/pages/cards/[...slug].astro`): full Zod data
  rendered with HfP-style density, including earn-rate table, eligibility
  block, perks list, transfer-partner chips, and dated "last verified" footer.
- **Bank index** (`src/pages/banks/index.astro`) and **bank detail**.
- **Programme index** and **programme detail** with sweet spots.
- **Comparison tables** — TPG-inspired, sortable, AED-priced.
- **Deals feed** with expiry sorting and filtering.
- **Guides template** with related cards / programmes sidebar.
- **Pagefind search box** wired to `/pagefind/pagefind.js` from `BaseLayout`.
- **SEO:** sitemap (`@astrojs/sitemap`), RSS for deals + guides, OG image
  generation.
- **Performance:** Lighthouse mobile score ≥ 95; image optimisation via
  `astro:assets`.

## Phase 4 — deploy

- Connect repo to Cloudflare Pages, build command `npm run build`, output dir
  `dist`, Node 20.
- Add Cloudflare Web Analytics token to `BaseLayout` (replace the placeholder
  from Phase 1).
- Configure `dubaipoints.ae` apex + `www` redirect.
- Smoke-test deploy: every collection page builds, search works, sitemap and
  RSS resolve, no 404s on internal links.

## Phase 5 — iteration

- Expand content: aim for 30+ cards across the 11 priority banks within 60 days
  of launch.
- Establish editorial cadence for deals (weekly) and guides (bi-weekly).
- RSS subscribers and an optional newsletter via Buttondown or similar.
- Optional: signup wall for premium guides; affiliate links with full
  disclosure.
- Monitor scraper accuracy and refine per-bank selectors.

## Editorial principles (apply across phases)

- **Every figure in AED** unless explicitly noted; never USD by default.
- **Cite sources** on every card — minimum one URL, ideally the bank's own page
  plus the schedule of charges PDF.
- **Date-stamp** every card with `lastVerified`; flag in the UI when older than
  90 days.
- **No affiliate-driven recommendations.** If we add affiliate links, they are
  disclosed inline and never change the recommendation.
- **UAE eligibility front and centre.** A card recommendation is incomplete
  without minimum salary, salary-transfer status, and residency requirement.
