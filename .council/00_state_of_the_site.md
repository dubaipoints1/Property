# State of the Site — 5 August 2026

_Author: Council foundation memo, refreshed from the working repository on
5 August 2026. This is a source-state record, not confirmation that the same
state is deployed._

This memo is the factual ground the Dubai Points Council operates on.
Every Council decision should trace back to a concrete fact in this
document or supersede it explicitly.

---

## 1. The publication, in one paragraph

dubaipoints.ae is a UAE-focused points-and-miles publication run by a
solo operator. Tone is HfP-dry, evidence-led; differentiation is
AED-first pricing, UAE eligibility front-loaded on every card review,
salary-transfer tracker as a live product, and coverage of selected regional
and hotel loyalty programmes. It does not run advertorial-driven
recommendations at launch.
The repository is a pre-publication content build. `PLAN.md` is retained as
historical roadmap context; it no longer describes the present phase.

## 2. Stack — verified from source

- **Astro 7** static output (`output: "static"`), built with the MDX +
  Preact integrations and `@tailwindcss/vite`.
- **TypeScript strict** (`extends: astro/tsconfigs/strict`); JSX is
  `react-jsx` with `jsxImportSource: "preact"`. Path alias `~/*` →
  `src/*`.
- **Tailwind 4** is CSS-first — config lives inside
  `src/styles/global.css`; there is no `tailwind.config.js`.
- **Pagefind** runs as `postbuild` on `dist/`; the index lives at
  `dist/pagefind/`.
- The repository has no explicit deploy workflow and is configured for
  Cloudflare Pages; source inspection does not prove the current auto-deploy
  state.
- **Cloudflare Web Analytics** renders only when
  `PUBLIC_CF_BEACON_TOKEN` is configured; source inspection does
  not establish whether production analytics is flowing.
- **Node 22.20.0** (`.nvmrc`).
- **Dependency audit:** zero known npm advisories after the 5 August 2026
  Astro 7 migration and esbuild override.

## 3. Content architecture — verified from source

Nine collections declared in `src/content.config.ts` via the Astro
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
| `news` | Time-sensitive newsroom coverage | optional bank, card and programme references |

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
Editor-confirmed and editor-corrected values are protected from scrape
overwrites. `propose-changes.ts` admits only its explicit field allowlist and
retains relevant raw captures under `_scraped_freetext.*` for audit.

## 4. Routes — verified from source

The route set now includes cards, card finder and comparison, banks, airline
programmes, guides, deals, news beats and RSS feeds, salary-transfer tracking,
valuations, search, newsletter and trust pages. The source-only
`/dev/calculator-tests/`, `/design-spike/` and `/style-guide/` routes are
removed from `dist/` before Pagefind builds its production index.

## 5. Card coverage — verified from source

`src/data/cards.json` contains 55 card records spanning all 12 listed banks.
That is inventory, not a statement that every record is fully editorially
complete. Provenance remains field-level; substantive `needs-review` fields and
unpriced bonuses stay unresolved until primary-source review is complete.

## 6. Scrape pipeline — verified from source

- `scripts/scrape/banks.registry.json` lists 12 active bank scrapers; each has
  a TypeScript entry point and URL configuration.
- Shared parsing and normalisation remain centralised in `_lib.ts` and
  `_normaliser.ts`; `propose-changes.ts` enforces the field-level provenance
  contract before changes reach `cards.json`.
- `.github/workflows/scrape.yml` runs a quarterly full sweep, accepts a
  single-bank manual or monitor-triggered dispatch, persists diagnostics and
  opens a PR when card data changes. It does not auto-merge product changes.
- Firecrawl monitors are described in the workflow as the primary change
  trigger; the scheduled sweep is the backstop. Source inspection alone does
  not confirm the external monitors are currently healthy.

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

Two-accent system: `--brand` blue `#1a5fc6` is primary,
`--gold` `#b8842a` is secondary trust signal (Verified chip, "Our take"
callout, affiliate asterisk). Each colour does one job.

## 8. Active pain points — verified from source

1. **Newsletter activation.** The Buttondown integration remains disabled
   until a verified public username and consent configuration are supplied.
2. **Salary-transfer coverage.** Three of twelve listed banks have a live
   offer; missing coverage requires one primary-source dossier per bank.
3. **Editorial data gates.** Two card records carry three substantive
   `needs-review` fields, and four welcome bonuses remain unpriced; the
   production code deliberately does not infer values.
4. **Publication gate.** The 5 August integrity sprint is implemented on a
   working branch. All nine required non-Chairman Council roles pass; it
   remains unpublished pending the Chairman gate.

## 9. Live site & competitors — historical research, live state unverified

The 5 August source refresh did not independently verify the deployed site.
The May competitor observations below remain historical research, not current
claims about those sites:

- **dubaipoints.ae (production).** Current deployment, redirects, sitemap,
  analytics and search behaviour remain to be confirmed independently.
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

## 10. Editorial cadence — verified from source

`EDITORIAL.md` documents the planned cadence template:

| Day | Slot | Output |
|---|---|---|
| Mon | Bank / salary transfer | One news post or offer update |
| Tue | Deal / lifestyle | One deal or merchant promo |
| Wed | Card or airline programme | Review, refresh, or sweet-spot piece |
| Thu | Lifestyle deal roundup or news | One light editorial post |
| Fri | Weekly recap | "This week on DubaiPoints" + newsletter send |

Saturdays and Sundays are reserved for planning, verification, and quarterly
artefacts. This is a planning target; the source refresh does not claim the
cadence or newsletter is already operating publicly.

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
