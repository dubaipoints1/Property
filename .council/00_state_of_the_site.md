# State of the Site — May 2026

_Author: Council foundation memo. Compiled from in-repo audit; live-site
and competitor sections marked **TO-BACKFILL** pending Firecrawl access._

This memo is the factual ground the Dubai Points Council operates on.
Every Council decision should trace back to a concrete fact in this
document or supersede it explicitly.

---

## 1. The publication, in one paragraph

dubaipoints.ae is a UAE-focused points-and-miles publication run by a
solo operator. Tone is HfP-dry, evidence-led; differentiation is
AED-first pricing, UAE eligibility front-loaded on every card review,
salary-transfer tracker as a live product, and full coverage of regional
loyalty programmes (Skywards, Etihad Guest, Qatar Privilege Club, Saudia
Alfursan). It does not run advertorial-driven recommendations at launch.
The site is in late Phase 1 / early Phase 2 of `PLAN.md`'s five-phase
roadmap.

## 2. Stack — verified from source

- **Astro 5** static output (`output: "static"`), built with the MDX +
  Preact integrations and `@tailwindcss/vite`.
- **TypeScript strict** (`extends: astro/tsconfigs/strict`); JSX is
  `react-jsx` with `jsxImportSource: "preact"`. Path alias `~/*` →
  `src/*`.
- **Tailwind 4** is CSS-first — config lives inside
  `src/styles/global.css`; there is no `tailwind.config.js`.
- **Pagefind** runs as `postbuild` on `dist/`; the index lives at
  `dist/pagefind/`.
- **Cloudflare Pages** auto-deploys on push to `main`; there is no
  separate deploy workflow.
- **Cloudflare Web Analytics** is wired in `BaseLayout.astro` but the
  token is still the placeholder string `REPLACE_WITH_CLOUDFLARE_WEB_
  ANALYTICS_TOKEN` — real analytics is not flowing yet.
- **Node 20** (`.nvmrc`).

## 3. Content architecture — verified from source

Eight collections declared in `src/content.config.ts` via the Astro
Content Layer (`glob` loader):

| Collection | Purpose | Notes |
|---|---|---|
| `banks` | Bank metadata (logo, customer service, card list) | references `cards` |
| `cards` | Editorial layer (L3) only — pros/cons/`editorTake`/`verifiedBy` | joined to L2 by slug |
| `programs` | Loyalty programmes — currency, transfer partners, sweet spots | |
| `deals` | Time-bound offers | references `banks`; `expiresOn` is required |
| `guides` | Evergreen long-form | references `cards` and `programs` |
| `salaryTransferOffers` | Live tracker entries | shares `SalaryTransferOfferShape` with history |
| `salaryTransferOfferHistory` | Archived offers | `archived: true` literal + optional `archivedReason` |
| `bankReputation` | Bank-level reputation signals | references `banks` |

The card system is the most non-obvious thing in the repo. Cards live
in **two files joined by slug at render time**:

- **L2 — `src/data/cards.json`** — canonical machine-readable
  attributes (fees, earn rates, eligibility, perks, sources, typed
  `_features` discriminated union over 14 perk types). Loaded and
  Zod-validated at module load by `src/lib/cardsData.ts`; module load
  fails fast on schema drift.
- **L3 — `src/content/cards/<slug>.mdx`** — editorial prose only.
  Frontmatter is intentionally tiny.

Every L2 entry carries a `_provenance` map per top-level field with
values `scraped | editor-confirmed | editor-corrected | needs-review`.
Editor-confirmed and editor-corrected fields are **never** overwritten
by a scrape. Typed editor fields (`welcomeBonus`, `annualFeeWaiver`,
`_features`) are not written by the scraper at all — the scraper
produces free-text equivalents under `_scraped_freetext.*` for the
editor to type up by hand.

## 4. Routes — verified from source

24 routes in `src/pages/`:

- Top-level: `index.astro`, `about.astro`, `team.astro`,
  `editorial-policy.astro`, `how-we-make-money.astro`,
  `dev/calculator-tests.astro`, `design-spike.astro` (new — the
  Quiet Ledger spike landed in this branch).
- Cards: `cards/index.astro`, `cards/[slug].astro`, `cards/compare.astro`,
  `cards/cashback.astro`, `cards/islamic.astro`, `cards/miles.astro`.
- Banks: `banks/index.astro`, `banks/[slug].astro`.
- Airlines: `airlines/index.astro`, `airlines/[slug].astro`.
- Guides: `guides/index.astro`, `guides/[slug].astro`.
- Salary transfer: `salary-transfer/index.astro`,
  `salary-transfer/calculator.astro`, `salary-transfer/[slug].astro`,
  `salary-transfer/history/[bank].astro`.
- Valuations: `valuations/index.astro`, `valuations/methodology.astro`.

Two Preact islands are hydrated client-side:
`src/components/islands/SalaryTransferTracker.tsx` and
`src/components/islands/SalaryTransferCalculator.tsx`.

## 5. Card coverage — verified from source

13 cards in `src/data/cards.json`:

- 9 Emirates NBD entries (pre-seeded; provenance mixed —
  `editor-confirmed` on the structural fields).
- 4 First Abu Dhabi Bank entries (scraped via `scripts/scrape/fab.ts`).
- 0 cards from the other 9 priority banks (ADCB, Mashreq, HSBC, Citi,
  Standard Chartered, RAKBank, CBD, DIB, ADIB, Emirates Islamic).

`PLAN.md` Phase 5 targets 30+ cards across 11 priority banks within 60
days of launch. We are short.

## 6. Scrape pipeline — verified from source

- One scraper exists: `scripts/scrape/fab.ts` reading
  `scripts/scrape/banks/fab.urls.json`. The other 10 banks have neither
  scraper nor URL config.
- Shared library at `scripts/scrape/_lib.ts` is highly reusable —
  `parseAED`, `parsePercent`, `parseMinSalary`, `parseEarnRate`,
  `parseSalaryTransferRequired`, the Firecrawl wrapper, and
  `loadFixture` are language-agnostic.
- `scripts/scrape/_normaliser.ts` has FAB-specific perk-filter regex
  baked in around line 130 (matches `fabonline`, `fabe?access`,
  `ibanking.bankfab.com`). Adding ENBD or ADCB requires either
  generalising this or per-bank overrides.
- `scripts/scrape/propose-changes.ts` enforces the provenance contract.
  `SCRAPED_FIELDS` no longer includes `welcomeBonus` (removed in
  e291a87) — so even with a structured parser landing in `_normaliser.ts`
  (this branch), the typed object will not flow into `cards.json` until
  `SCRAPED_FIELDS` is amended.
- `.github/workflows/scrape.yml` is hard-coded to `npm run scrape:fab`
  on a Sunday 23:00 UTC cron. It always commits `LATEST_RUN.log` and
  `LATEST_SCRAPE.md` to main for outside-runner debugging, then opens
  a PR if `src/data/cards.json` changed. Never auto-merges.
- Test coverage: one file (`tests/scrape/_normaliser.test.ts`), 15
  tests, 2 fixtures (`fab-cashback.html`,
  `welcome-bonus-samples.html`).

## 7. Visual idiom — verified from source

The `.dp-*` class system in `src/styles/global.css` is the single
editorial idiom. Major components: `.dp-article`, `.dp-article-head`,
`.dp-stats`, `.dp-take`, `.dp-data-table`, `.dp-dir-grid`,
`.dp-dir-tile`, `.dp-tracker-*`, `.dp-proscons`. CSS custom properties
(`--ink`, `--ink-soft`, `--bg`, `--paper`, `--line`, `--brand`,
`--brand-deep`, `--brand-soft`, `--gold`, `--gold-soft`, `--red`,
`--green`) are the palette — Tailwind slate utilities are explicitly
banned in long-form pages and layouts.

Type pairing: Fraunces (serif) for headlines, eyebrows, "Our take";
DM Sans for body and UI.

Two-accent system: `--brand` electric blue `#1e6bd6` is primary,
`--gold` `#b8842a` is secondary trust signal (Verified chip, "Our take"
callout, affiliate asterisk). Each colour does one job.

## 8. Active pain points — verified from source

1. **Homepage size.** `src/pages/index.astro` is 668 lines with ~427
   lines of scoped CSS across 7 sections. Hard to maintain; the
   deal-rail grid bug at ≥1024px (negative `margin-inline: -16px`
   remains after the layout switches off `grid-auto-flow: column`)
   has lived for at least one audit cycle.
2. **Layout duplication.** `src/layouts/ArticleLayout.astro` and
   `src/layouts/CardReviewLayout.astro` both implement the editorial
   header (title + meta + byline) without sharing an abstraction, and
   both still use Tailwind `prose` classes instead of the `.dp-*`
   system. Two competing visual grammars on the site.
3. **Header logo discontinuity.** Desktop wordmark is 54px, mobile is
   32px — a hard 40% jump at the 1024px breakpoint.
4. **Documentation drift.** `SITE_ARCHITECTURE.md` §5.3 describes the
   Header as having no hamburger drawer. The drawer ships and is
   functional. The doc is wrong.
5. **Coverage gap.** 13 cards from 2 banks, against an 11-bank
   priority list and a 30-card 60-day target.
6. **Welcome-bonus data is stranded.** Even with the new
   `parseWelcomeBonus` in this branch, the merge contract won't admit
   the structured form until `SCRAPED_FIELDS` is amended (fenced file
   change, Chairman approval).

## 9. Live site & competitors — TO-BACKFILL via Firecrawl

We chose to skip live scraping for the foundation memo (Council
decision, 2026-05). Predictions to verify when Firecrawl is wired:

- **dubaipoints.ae (production).** Expected to render the 8-section
  homepage from `src/pages/index.astro` over Cloudflare Pages.
  Sitemap, robots.txt, Pagefind index — all to confirm.
- **visitdubai.com.** Government tourism portal, multilingual (en/ar/zh
  at minimum), heavy event-driven calendar. Useful: official
  attractions vocabulary, AED-pricing patterns, JSON-LD usage. Not
  useful: scale, brand tone, monetisation model.
- **timeoutdubai.com.** Lifestyle/events weekly cadence, dining and
  nightlife dominant, advertorial-heavy. Useful: brunch and DSF
  editorial calendar discipline; explicitly reject their disclosure
  patterns.
- **headforpoints.com.** UK-centric daily-cadence points publication.
  Useful: dense card-review structure, comment-driven authority,
  tag-archive depth. Differentiation lever: AED-first, UAE eligibility,
  salary-transfer tracker (none of which HfP does).

Backfill task is owned by Head of Research; assigned date is the day
Firecrawl access lands.

## 10. Editorial cadence — verified from source

`EDITORIAL.md` documents the published cadence template:

| Day | Slot | Output |
|---|---|---|
| Mon | Bank / salary transfer | One news post or offer update |
| Tue | Deal / lifestyle | One deal or merchant promo |
| Wed | Card or airline programme | Review, refresh, or sweet-spot piece |
| Thu | Lifestyle deal roundup or news | One light editorial post |
| Fri | Weekly recap | "This week on DubaiPoints" + newsletter send |

Saturdays and Sundays are reserved for planning, verification, and
quarterly artifacts. The Council adopts this cadence.

## 11. Reading list for new council members

In this order. Two hours of reading puts a new member at the working
level.

1. `CLAUDE.md` (Council Charter, top half) — this Council's authority
   structure and house rules.
2. This memo.
3. `.council/01_editorial_standards.md` — house style.
4. `.council/02_workflow.md` — how a piece gets shipped.
5. `.council/04_content_taxonomy.md` — categories, tags, pillar pages.
6. `PLAN.md` — five-phase build plan (now historical context, not
   forward direction).
7. `EDITORIAL.md` — the cadence and visual standard, baseline before
   any Chairman-approved overrides.
8. `BRAND_NOTES.md` — open brand questions, default-decisions table.
9. `SITE_ARCHITECTURE.md` — IA + mobile rules, with the noted §5.3 doc
   bug.
10. `CONTENT_ROADMAP.md` — launch content priorities.
11. `.council/research/2026-05/` — first archived council dossiers
    (UX redesign brief, scrape accuracy brief). Read for tone of what
    "good" looks like.

End of memo.
