# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**dubaipoints.ae** — UAE-focused points/miles publication (credit cards, loyalty programmes, salary-transfer offers, lifestyle deals). Static Astro site deployed to Cloudflare Pages.

Source-of-truth design docs (read before substantial changes): `PLAN.md` (multi-phase build plan), `SITE_ARCHITECTURE.md` (IA + mobile rules), `EDITORIAL.md` (cadence + visual idiom), `BRAND_NOTES.md` (logo/colour/tone decisions), `CONTENT_ROADMAP.md` (launch content priorities).

## Commands

Node 20 (see `.nvmrc`). All commands run from repo root.

```bash
npm install
npm run dev            # astro dev — http://localhost:4321
npm run build          # astro build → dist/, then postbuild runs pagefind
npm run check          # astro check — TS + content-collection Zod validation (run before pushing)
npm test               # node --test on tests/**/*.test.ts via tsx (no Vitest)

# Phase 2 scrapers (require FIRECRAWL_API_KEY; use "skip" for a dry run)
FIRECRAWL_API_KEY=skip npm run scrape:fab
npm run scrape:propose # merges latest data/scraped/<bank>/*.json into src/data/cards.json + writes PR_BODY.md
```

Run a single test file: `node --import tsx --test tests/scrape/_normaliser.test.ts`.

## Architecture — the three-layer card model

The card system is the most non-obvious thing in the repo. Cards live in **two files** that are joined by slug at render time:

- **L2 — `src/data/cards.json`** — canonical machine-readable card attributes (fees, earn rates, eligibility, perks, sources). Loaded and Zod-validated at module load by `src/lib/cardsData.ts`; module load **fails fast** on schema drift.
- **L3 — `src/content/cards/<slug>.mdx`** — editorial prose only. Frontmatter is intentionally tiny (`slug`, `pros`, `cons`, `editorTake`, `verifiedBy`); see `src/content.config.ts`. Do not duplicate L2 fields here.

Pages join L2 + L3 by slug. When adding a card, the slug must match between `src/data/cards.json` and `src/content/cards/<slug>.mdx`.

### Provenance & the scrape merge contract

`cards.json` entries carry a `_provenance` map per top-level field with values `scraped | editor-confirmed | editor-corrected | needs-review`. The merge rules in `scripts/scrape/propose-changes.ts` are load-bearing:

- Editor-confirmed / editor-corrected fields are **never** overwritten by a scrape.
- Typed editor fields (`welcomeBonus`, `annualFeeWaiver`, `_features`) are **never written by the scraper**. The scraper produces free-text equivalents that land under `_scraped_freetext.*` for the editor to type up by hand. Provenance for `_features` is always `editor-confirmed`.
- `_features` is a Zod discriminated union (14 typed perk types — lounge access, cinema BOGO, hotel discount, etc.) defined in `src/lib/cardsData.ts`. The matcher reads only this; free-text `perks[]` is a fallback.

When editing card data: if you confirm a scraped value, flip its `_provenance` entry from `scraped` to `editor-confirmed` so the next weekly scrape preserves it.

## Scrape pipeline (Phase 2)

```
scripts/scrape/<bank>.ts      # entry point per bank — reads banks/<bank>.urls.json
scripts/scrape/_lib.ts        # Firecrawl client + pure parsers (parseAED, parseMinSalary, ...)
scripts/scrape/_normaliser.ts # raw markdown → cards.json shape
scripts/scrape/propose-changes.ts # merges latest scrape into cards.json, writes PR_BODY.md
data/scraped/<bank>/<ts>.json # scraper output (gitignored except .gitkeep)
.github/workflows/scrape.yml  # weekly cron (Sun 23:00 UTC) — opens a PR, never auto-merges
```

`FIRECRAWL_API_KEY=skip` short-circuits all network calls and returns `status: "fail"` from `firecrawlFetch` — useful for wiring tests without burning quota. The workflow always commits `LATEST_RUN.log` and `LATEST_SCRAPE.md` to main for outside-runner debugging.

`scripts/` and `tests/` are excluded from `tsconfig.json` (they run via `tsx`), so type checks there happen at runtime in tests, not via `astro check`.

## Content collections

Eight collections are declared in `src/content.config.ts` using the Astro Content Layer (`glob` loader): `banks`, `cards`, `programs`, `deals`, `guides`, `salaryTransferOffers`, `salaryTransferOfferHistory`, `bankReputation`. They use `reference()` for cross-collection links (e.g. a `deal` references a `bank`, a `card`'s editorial layer is joined to L2 by slug).

Salary-transfer offers and their history share the same Zod shape (`SalaryTransferOfferShape`); the history variant just pins `archived: true` and adds an optional `archivedReason`.

## Editorial conventions baked into the UI

These come from `EDITORIAL.md` and are enforced by visual-design code, not lint rules — match them when adding pages:

- **One visual idiom.** Use the `.dp-*` classes defined in `src/styles/global.css` (`.dp-article`, `.dp-article-head`, `.dp-stats`, `.dp-take`, `.dp-data-table`, `.dp-dir-grid`, etc.). **Do not** introduce Tailwind slate utilities in long-form pages or layouts. Colours come from CSS custom properties (`--ink`, `--brand`, `--gold`, ...), not Tailwind palette utilities.
- **Two-accent system.** `--brand` (electric blue `#1e6bd6`) is the primary; `--gold` (`#b8842a`) is the secondary trust-signal accent (Verified chip, "Our take" callout, affiliate asterisk). Each colour has a single job — don't mix them in one element.
- **Type.** Fraunces (serif) for headlines / eyebrows / "Our take" labels; DM Sans for body and UI.
- **Long-form page skeleton.** `BaseLayout` with `fullWidth`, then `<article class="dp-article">`, then `.dp-article-head` + sections. **Directory pages:** `<article class="dp-article is-wide">` + `.dp-dir-grid` of `.dp-dir-tile` children.
- **Editorial guarantees.** Every figure in AED. Every card has ≥1 source URL and a `lastVerified` date — UI flags entries older than 90 days. No affiliate-driven recommendations at launch.

## Stack notes

- **Astro 5** static output (`output: "static"` in `astro.config.mjs`). MDX and Preact integrations are enabled; Preact is excluded from Vite's optimizeDeps. Hydrate `.tsx` islands (currently in `src/components/islands/`) with `client:*` directives.
- **TypeScript strict** (`extends: astro/tsconfigs/strict`). JSX is `react-jsx` with `jsxImportSource: "preact"`. Path alias `~/*` → `src/*`.
- **Tailwind 4** is wired via `@tailwindcss/vite` with CSS-first config inside `src/styles/global.css` (no `tailwind.config.js`).
- **Pagefind** runs as `postbuild` on `dist/`. The `pagefind/` output directory is gitignored.
- **Cloudflare Pages** auto-deploys on push to `main`; there is no separate deploy workflow. The Web Analytics token in `BaseLayout.astro` is currently a placeholder (`REPLACE_WITH_CLOUDFLARE_WEB_ANALYTICS_TOKEN`) — do not commit a real token without coordinating.

## Branch & commit conventions

- Cards-data PRs from the scrape workflow: branch `scrape/weekly-<timestamp>`, title `scrape: weekly card refresh (YYYY-MM-DD)`. Never auto-merge.
- `PR_BODY.md` is auto-generated by the propose script and is `.gitignore`d.
