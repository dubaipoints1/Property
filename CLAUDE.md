# CLAUDE.md

This file is the **Dubai Points Council Charter** plus the engineering
reference for `dubaipoints.ae`. The top half is governance; the bottom
half is the technical operating manual. Both are load-bearing for any
Claude Code instance — or human contributor — working in this repo.

---

# Part I — Council Charter

## Identity

**dubaipoints.ae** is a UAE-focused points-and-miles publication. Tone
is HfP-dry, evidence-led; differentiation is AED-first pricing, UAE
eligibility front-loaded, salary-transfer tracker as a live product,
full coverage of regional loyalty programmes (Skywards, Etihad Guest,
Qatar Privilege Club, Saudia Alfursan).

The publication is operated by a **Council of ten specialist roles**
implemented as Claude Code sub-agents under `.claude/agents/*.md`. The
Council is convened automatically by the workflow defined in
`.council/02_workflow.md` and on-demand via the slash commands in
`.claude/commands/`.

## Non-negotiables

1. **Dubai-first voice.** AED-native pricing on every page. UAE proper
   nouns spelled per RTA / DLD / DET / DHA convention. Ramadan, DSF,
   and National Day enter the editorial calendar by default.
2. **Firecrawl is exclusive to the Research arm.** Other agents read
   briefs and dossiers; they do not scrape. SEO Strategist routes
   SERP-scraping requests to Head of Research via the `Task` tool.
3. **Chairman is the only publish gate.** No piece ships without
   `chairman-status: approved` in the brief frontmatter. The
   `/publish` slash command halts at this gate by design.
4. **Tool minimisation.** Each sub-agent gets only the tools its
   mandate requires. Writers do not get `Bash` except a narrow
   `npm run check:*, npm run dev:*` allowlist for schema validation.
5. **No advertorial-driven recommendations.** Affiliate disclosure,
   when introduced, is inline above the fold — never buried.
6. **LLM-extraction policy.** Firecrawl `/extract` and similar
   LLM-based extraction may be used by Head of Research for prose
   first drafts (e.g. seeding `editorTake` paragraphs). It is
   **off-limits for typed numerics** (fees, salary bands, earn rates,
   amounts) — those require deterministic regex parsers in
   `scripts/scrape/_lib.ts` so each value has a traceable source line.

## Authority

```
                CHAIRMAN
                   │
            MANAGING EDITOR
                   │
   ┌──────────┬────┴────┬────────────┬─────────────┬───────────┐
   │          │         │            │             │           │
HEAD OF      SEO    FACT-CHECK   STANDARDS   TECH LEAD   GROWTH&ANALYTICS
RESEARCH STRATEGIST                EDITOR                (lateral, reports up)
   │          │
   └─SECTION EDITORS──┐
       travel-experiences
       business-realestate
       lifestyle-culture
```

The Standards Editor sits between Fact-Check and the Chairman gate
(Stage 6.5 of `02_workflow.md`). Fact-check polices what is true;
the Standards Editor polices how it reads.

Decision rights, escalation triggers, and cross-vertical dispute
resolution are in `.council/03_escalation_matrix.md`. Conflict of
interest disclosures are mandatory per the same file.

## The Council, at a glance

| Slug | Role | Tools (summary) |
|---|---|---|
| `chairman` | Editor-in-Chief; final publish gate; brand voice owner | All |
| `managing-editor` | Newsroom ops; brief routing; calendar | Read, Write, Edit, Glob, Grep, Task |
| `head-of-research` | Firecrawl-driven dossiers; source archive | Read, Write, Glob, Grep, WebFetch + Firecrawl |
| `seo-strategist` | Keyword spec; internal linking; schema | Read, Write, Edit, Glob, Grep, WebFetch |
| `travel-experiences-editor` | Skywards/Etihad/hotel + Dubai experiences | Read, Write, Edit, Glob, Grep, narrow Bash |
| `business-realestate-editor` | Banks, salary-transfer, Golden Visa, freezones | Read, Write, Edit, Glob, Grep, narrow Bash |
| `lifestyle-culture-editor` | Dining, DSF, Ramadan, expat onboarding | Read, Write, Edit, Glob, Grep, narrow Bash |
| `technical-lead` | Schema, sitemap, perf, deploy | Read, Write, Edit, Bash, Glob, Grep |
| `fact-checker` | Verifies every claim against primary source | Read, Edit, Glob, Grep, WebFetch |
| `standards-editor` | House voice, copy chief, kill-list, microcopy review | Read, Edit, Glob, Grep |
| `growth-analytics-lead` | Traffic memo, decay watch, refresh queue | Read, Write, Edit, Glob, Grep, WebFetch |

Full prompts, decision rights, and output formats per agent are in
`.claude/agents/<slug>.md`.

## Slash commands

Available in `.claude/commands/`:

- `/brief <topic>` — Managing Editor opens a content brief and
  assigns a section editor.
- `/research <slug>` — Head of Research begins a dossier on an open
  brief.
- `/publish <slug>` — orchestrates the full pipeline (Stages 3–9 of
  `02_workflow.md`); halts at the Chairman gate.
- `/council <topic>` — convenes a multi-agent review when a topic
  spans more than one editor or requires cross-functional input.

## How to read this Charter

A new contributor (Claude or human) gets to working level in two
hours by reading, in order:

1. This file (Part I, top to bottom).
2. `.council/00_state_of_the_site.md` — what is actually shipped.
3. `.council/01_editorial_standards.md` — the house style.
4. `.council/02_workflow.md` — how a piece moves from intake to
   publish.
5. `.council/03_escalation_matrix.md` — who decides what.
6. `.council/04_content_taxonomy.md` — categories, tags, pillar
   pages.
7. The relevant `.claude/agents/<your-role>.md`.
8. `.council/research/2026-05/` — the first archived dossiers,
   for tone of what "good" looks like.

## Charter amendment

Anything in Part I changes only by Chairman decision, logged with
date and reasoning in a `## Amendments` section appended to this
file. Operating documents under `.council/` and agent prompts under
`.claude/agents/` are amendable by the role owner with Chairman
sign-off; commit messages must reference the policy file changed.

---

# Part II — Engineering reference

This section is the technical operating manual. Future Claude Code
instances making code changes (not editorial decisions) start here.

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

The card system is the most non-obvious thing in the repo. Cards live
in **two files** that are joined by slug at render time:

- **L2 — `src/data/cards.json`** — canonical machine-readable card
  attributes (fees, earn rates, eligibility, perks, sources). Loaded
  and Zod-validated at module load by `src/lib/cardsData.ts`; module
  load **fails fast** on schema drift.
- **L3 — `src/content/cards/<slug>.mdx`** — editorial prose only.
  Frontmatter is intentionally tiny (`slug`, `pros`, `cons`,
  `editorTake`, `verifiedBy`); see `src/content.config.ts`. Do not
  duplicate L2 fields here.

Pages join L2 + L3 by slug. When adding a card, the slug must match
between `src/data/cards.json` and `src/content/cards/<slug>.mdx`.

### Provenance & the scrape merge contract

`cards.json` entries carry a `_provenance` map per top-level field
with values `scraped | editor-confirmed | editor-corrected |
needs-review`. The merge rules in
`scripts/scrape/propose-changes.ts` are load-bearing:

- Editor-confirmed / editor-corrected fields are **never**
  overwritten by a scrape.
- Typed editor fields (`welcomeBonus`, `annualFeeWaiver`,
  `_features`) are not written by the scraper directly. The
  scraper produces free-text equivalents that land under
  `_scraped_freetext.*` for the editor to type up by hand.
- As of the Council spike (May 2026), `scripts/scrape/_normaliser.ts`
  also emits a structured `welcomeBonus` object via
  `parseWelcomeBonus()` when parseable. **`SCRAPED_FIELDS` does not
  yet include `welcomeBonus`** (removed in `e291a87`); adding it
  back is a fenced contract change requiring Chairman approval.
- `_features` is a Zod discriminated union (14 typed perk types —
  lounge access, cinema BOGO, hotel discount, etc.) defined in
  `src/lib/cardsData.ts`. The matcher reads only this; free-text
  `perks[]` is a fallback.

When editing card data: if you confirm a scraped value, flip its
`_provenance` entry from `scraped` to `editor-confirmed` so the next
weekly scrape preserves it.

## Scrape pipeline (Phase 2)

```
scripts/scrape/<bank>.ts      # entry point per bank — reads banks/<bank>.urls.json
scripts/scrape/_lib.ts        # Firecrawl client + pure parsers (parseAED, parseMinSalary, ...)
scripts/scrape/_normaliser.ts # raw markdown → cards.json shape + parseWelcomeBonus
scripts/scrape/propose-changes.ts # merges latest scrape into cards.json, writes PR_BODY.md
data/scraped/<bank>/<ts>.json # scraper output (gitignored except .gitkeep)
.github/workflows/scrape.yml  # weekly cron (Sun 23:00 UTC) — opens a PR, never auto-merges
```

`FIRECRAWL_API_KEY=skip` short-circuits all network calls and returns
`status: "fail"` from `firecrawlFetch` — useful for wiring tests
without burning quota. The workflow always commits `LATEST_RUN.log`
and `LATEST_SCRAPE.md` to main for outside-runner debugging.

`scripts/` and `tests/` are excluded from `tsconfig.json` (they run
via `tsx`), so type checks there happen at runtime in tests, not via
`astro check`.

The workflow is currently **hard-coded to `npm run scrape:fab`**.
Scaling to the other 10 priority banks is the explicit subject of
`.council/research/2026-05/scrape-accuracy-brief.md`.

## Content collections

Eight collections are declared in `src/content.config.ts` using the
Astro Content Layer (`glob` loader): `banks`, `cards`, `programs`,
`deals`, `guides`, `salaryTransferOffers`,
`salaryTransferOfferHistory`, `bankReputation`. They use
`reference()` for cross-collection links (e.g. a `deal` references a
`bank`, a `card`'s editorial layer is joined to L2 by slug).

Salary-transfer offers and their history share the same Zod shape
(`SalaryTransferOfferShape`); the history variant just pins
`archived: true` and adds an optional `archivedReason`.

## Editorial conventions baked into the UI

These come from `EDITORIAL.md` and are enforced by visual-design
code, not lint rules — match them when adding pages:

- **One visual idiom.** Use the `.dp-*` classes defined in
  `src/styles/global.css` (`.dp-article`, `.dp-article-head`,
  `.dp-stats`, `.dp-take`, `.dp-data-table`, `.dp-dir-grid`, etc.).
  **Do not** introduce Tailwind slate utilities in long-form pages
  or layouts. Colours come from CSS custom properties (`--ink`,
  `--brand`, `--gold`, ...), not Tailwind palette utilities.
- **Two-accent system.** `--brand` (electric blue `#1e6bd6`) is the
  primary; `--gold` (`#b8842a`) is the secondary trust-signal accent
  (Verified chip, "Our take" callout, affiliate asterisk). Each
  colour has a single job — don't mix them in one element.
- **Type.** Fraunces (serif) for headlines / eyebrows / "Our take"
  labels; DM Sans for body and UI.
- **Long-form page skeleton.** `BaseLayout` with `fullWidth`, then
  `<article class="dp-article">`, then `.dp-article-head` +
  sections. **Directory pages:** `<article class="dp-article
  is-wide">` + `.dp-dir-grid` of `.dp-dir-tile` children.
- **Editorial guarantees.** Every figure in AED. Every card has ≥1
  source URL and a `lastVerified` date — UI flags entries older than
  90 days. No affiliate-driven recommendations at launch.

A redesign exploration ("Quiet Ledger") landed in May 2026 at
`/design-spike/`. The brief is at
`.council/research/2026-05/ux-redesign-brief.md`. The visual idiom
above remains in force until the Chairman approves a swap.

## Stack notes

- **Astro 5** static output (`output: "static"` in
  `astro.config.mjs`). MDX and Preact integrations are enabled;
  Preact is excluded from Vite's optimizeDeps. Hydrate `.tsx`
  islands (currently in `src/components/islands/`) with `client:*`
  directives.
- **TypeScript strict** (`extends: astro/tsconfigs/strict`). JSX is
  `react-jsx` with `jsxImportSource: "preact"`. Path alias `~/*` →
  `src/*`.
- **Tailwind 4** is wired via `@tailwindcss/vite` with CSS-first
  config inside `src/styles/global.css` (no `tailwind.config.js`).
- **Pagefind** runs as `postbuild` on `dist/`. The `pagefind/`
  output directory is gitignored. Spike or staging routes that
  shouldn't index carry `data-pagefind-ignore` on the wrapper
  element.
- **Cloudflare Pages** auto-deploys on push to `main`; there is no
  separate deploy workflow. The Web Analytics token in
  `BaseLayout.astro` is currently a placeholder
  (`REPLACE_WITH_CLOUDFLARE_WEB_ANALYTICS_TOKEN`) — do not commit a
  real token without coordinating.

## Branch & commit conventions

- Cards-data PRs from the scrape workflow: branch
  `scrape/weekly-<timestamp>`, title `scrape: weekly card refresh
  (YYYY-MM-DD)`. Never auto-merge.
- Council spike branches: `claude/<scope>-spike` —
  `claude/council-spike` is the May 2026 progenitor.
- `PR_BODY.md` is auto-generated by the propose script and is
  `.gitignore`d.
- Commit messages reference the relevant Council policy file when
  changing one.

End.
