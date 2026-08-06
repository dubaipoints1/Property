# AGENTS.md

Entry point for any coding agent working in this repository — Codex,
Claude Code, or anything else.

**`CLAUDE.md` is the authority. Read it before you change anything.** It
carries the Dubai Points Council Charter (governance) and the engineering
manual (architecture, scrape pipeline, monitoring, imagery, conventions).
This file exists because not every agent loads `CLAUDE.md` by default, and
working in this repo without it is how the rules below get broken by
accident.

This file is a **pointer plus a short list of things that fail silently**.
It is deliberately not a summary of the Charter — a second copy would
drift from the first, and then nobody would know which was true.

---

## The rules that cause real damage if you don't know them

Most of what keeps this site correct is convention, not code. Some things
fail loudly: `src/lib/cardsData.ts` and `src/lib/stockManifest.ts` are
Zod-validated at module load and fail the build on schema drift, and
`npm test` guards a few invariants. **Everything below will pass CI while
being wrong.**

### 1. Never use an LLM to extract a typed number

Charter §6. Fees, salary bands, earn rates, amounts — every numeric on
this site comes from a deterministic regex parser in
`scripts/scrape/_lib.ts` or `scripts/scrape/_normaliser.ts`, so each value
has a traceable source line. LLM extraction (Firecrawl `/extract` and
similar) is permitted for *prose* drafts only.

This is the single load-bearing rule behind the publication's trust
posture. An LLM-extracted fee that happens to be right is still a
violation, because the provenance is unreproducible.

### 2. No merge to `main` without a Council sign-off block

Charter §7. Every PR body needs a `## Council sign-off` section naming
which specialists reviewed it, with the Chairman's line marked
`approved`. The required set scales by tier (T1/T2/T3 — see the Charter's
tiered-review table).

**This one IS enforced**, by the `council-signoff` workflow. Expect the
check to be red until the Chairman's status cell reads `approved` — that
is the gate, not a bug.

It triggers on **`push`** (and fetches the PR body via the API), because
`pull_request` alone did not fire while the PR was a draft — and most work
here starts as a draft PR. If you approve in the body and no run appears,
re-run the job or push a commit.

**Adding any new PR-gating workflow here? Give it a `push` trigger.** A
`pull_request`-only workflow can sit silently dead, which is worse than
having no gate at all — branch protection reports green from a check that
never evaluated anything. Confirm a new gate has actually run before
trusting it.

What CI cannot check is whether the named specialists actually reviewed
anything. Do not treat a green tick as a substitute for the review.

### 3. Logos and imagery are licence-governed, not taste-governed

Charter §10 and its amendments.

- **Issuer marks** (banks, airlines, programmes) come only from Wikimedia
  Commons `{{PD-textlogo}}` or the issuer's own published brand kit. This
  is why `banks/adib`, `banks/dib`, `banks/cbd`, `banks/emirates-islamic`
  and `banks/rakbank` are still **text placeholders**. They are not
  missing work. Do not "fix" them by pulling a logo off the bank's
  website or Wikipedia — Wikipedia's non-free/fair-use uploads are
  explicitly rejected.
- **Non-issuer marks** (a company named or recommended in a guide) go in
  `public/logos/partners/`, fetched via
  `.github/workflows/fetch-partner-logo.yml`. Weaker licence basis,
  deliberately kept in a separate directory.
- **No AI-generated brand marks, ever.** AI illustration is permitted but
  may never depict a real, verifiable thing — no card art, no named
  carrier's cabin, no real document, no real person. See the 2026-07-29
  amendment and `.council/sops/ai-illustration-art-direction.md`.
- Every image is a row in `data/stock/manifest.json` with full
  provenance. Every logo is logged in `public/logos/LICENSES.md` in the
  same commit as the asset.

### 4. The card data model is two files joined by slug

- **L2 — `src/data/cards.json`**: machine-readable attributes (fees, earn
  rates, eligibility, sources).
- **L3 — `src/content/cards/<slug>.mdx`**: editorial prose only. Do not
  duplicate L2 fields here.

Each L2 field carries a `_provenance` entry. **Fields marked
`editor-confirmed`, `editor-corrected` or `editor-confirmed-null` are
never overwritten by a scrape** — only `lastVerified` always refreshes
(`ALWAYS_REFRESHABLE` in `scripts/scrape/propose-changes.ts`). Typed
editor fields (`welcomeBonus`, `annualFeeWaiver`, `_features`) are never
written by the scraper at all; it emits free text under
`_scraped_freetext.*` for an editor to type up.

`welcomeBonus` is **deliberately absent** from `SCRAPED_FIELDS` (removed
in `e291a87`). Adding it back is a fenced contract change requiring
Chairman approval.

### 5. Monitors detect change; they never write data

Nothing in `scripts/monitor/` writes to `cards.json`. Monitors run in
**markdown mode** — a deterministic diff — never Firecrawl's JSON-mode
change tracking, which is LLM extraction by another name. The offers and
salary-transfer surfaces are alert-only, and `tests/monitor/routing.test.ts`
fails if either is added to `AUTO_SCRAPE`.

### 6. Visual conventions are fixed

Use the `.dp-*` classes in `src/styles/global.css`. **Do not introduce
Tailwind slate utilities in long-form pages or layouts.** Colours come
from CSS custom properties (`--ink`, `--green`, `--gold`), not Tailwind
palette utilities. Two accents, each with exactly one job: `--green` is
the primary editorial accent; `--gold` is the trust signal (Verified chip,
90-day drift flag, coverage disclosure) and must not be borrowed for
anything else.

### 7. The Cloudflare Analytics token comes from the environment

`src/layouts/BaseLayout.astro:69` reads `PUBLIC_CF_BEACON_TOKEN` and only
emits the beacon when it is set **and** the build is production. Leave it
that way — do not inline a token, and do not "fix" the missing beacon in
a dev build by hardcoding one.

(If you are reading an older copy of `CLAUDE.md` that describes a
`REPLACE_WITH_…` placeholder in this file, that is out of date. Verified
6 August 2026.)

---

## Commands

Node 20 (`.nvmrc`). From the repo root:

```bash
npm install
npm run dev      # astro dev — http://localhost:4321
npm run check    # astro check — TS + content-collection Zod validation
npm test         # node --test via tsx
npm run build    # astro build → dist/, then pagefind
```

Run one test file:
`node --import tsx --test tests/scrape/_normaliser.test.ts`

`scripts/` and `tests/` are excluded from `tsconfig.json` — they run via
`tsx`, so type errors there surface at runtime in tests, not in
`astro check`.

---

## Things that will waste your time if nobody tells you

- **`npm run check` passing does not mean the page renders.** Three
  defects in one August 2026 session passed check, all tests and the
  build while the page was visibly broken. Serve `dist/` and look at it.
- **MDX silently emits invalid nested `<p>` tags.** An HTML block split
  across lines gets its bare text re-parsed as markdown and wrapped in a
  second `<p>`. The browser auto-closes the outer tag, children land in
  an unclassed element, and your CSS stops matching — with no warning
  from any tool. Keep such elements on one line.
- **Outbound network is restricted in agent sandboxes.** Third-party
  image hosts, `api.pexels.com`, `fal.run` and `*.pages.dev` all fail.
  **You cannot read the Cloudflare preview deploy** the PR bot links —
  verify against the local `dist/` instead. GitHub Actions runners have
  different egress and are unaffected, which is why the image and logo
  pipelines run there.
- **`refetch-image.yml` works for new slugs**, not just existing ones —
  `fetch-stock.ts` guards `if (existing && !args.replace)`. Don't write
  another one-off `seed-images-eNN.yml`.
- A `workflow_dispatch` workflow can only be dispatched once it exists on
  the **default branch**; before that, dispatch returns a bare 404.

---

## More than one agent works in this repo

Claude Code and Codex both operate here. To avoid clobbering each other:

- **Branch prefixes are per-agent.** Claude Code sessions use
  `claude/*`; use `codex/*` for Codex work. Never push to a branch
  carrying another agent's prefix.
- **Rebase on `origin/main` before starting.** Both agents merge to the
  same trunk.
- **Highest-contention files**: `src/data/cards.json`,
  `data/stock/manifest.json`, `src/styles/global.css`,
  `scripts/monitor/*.registry.json`.
- If a PR bot reports a commit SHA you don't recognise, **check it before
  assuming it is yours.**

---

## Orientation reading, in order

1. `CLAUDE.md` — the Charter and the engineering manual.
2. `.council/00_state_of_the_site.md` — what is actually shipped.
3. `.council/01_editorial_standards.md` — house style, including the §10
   kill-list.
4. `.council/02_workflow.md` — how a piece moves from intake to publish.
5. `.council/sessions/` — most recent session handoff, for open items and
   current gotchas.
