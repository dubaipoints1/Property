# Council STATUS

_The operational ledger for the Dubai Points Council. Updated by
Managing Editor on every state change. Cross-checks against
`.council/00_state_of_the_site.md` for ground truth and
`CLAUDE.md` Part I for charter authority._

---

## Current state

**Status:** OPERATIONAL.
**Convened:** 2026-05-08 by the publication owner (Chairman).
**Charter:** `CLAUDE.md` Part I.
**Active branch:** `claude/council-spike` (PR #17 → `main`).

## Chairman picks (2026-05-08)

The Chairman has signed off on the following decisions, opening the
Council and setting the design direction. Each pick supersedes the
prior default in the named source document.

### 1. UX direction — **Quiet Ledger** (Direction B)

- **Brief:** `.council/research/2026-05/ux-redesign-brief.md`.
- **Spike:** `/design-spike/` (route at
  `src/pages/design-spike.astro`).
- **Rationale:** smallest doc-churn move; closest to what
  `EDITORIAL.md` already wants; addresses all three audited pain
  points without inventing a fourth; needs no new visual assets we
  do not have.
- **Doc churn applied 2026-05-08:**
  - `BRAND_NOTES.md` — Amendments §1 (blue is interactive only;
    gold sunsets as a UI accent).
  - `EDITORIAL.md` — Amendments §"Visual standard" rewrites; tone
    amplifications (no `!`, numerical numbers, pull-numbers, single-
    paragraph Friday recap).
  - `SITE_ARCHITECTURE.md` — Amendments to §4 (4-section homepage),
    §5.3 (hamburger correction + continuous logo scale), §5.4
    (italic display sunset).
- **Code applied 2026-05-08:**
  - `src/styles/global.css` — palette retune; `.dp-article-eyebrow`
    to ink; `.dp-article-title em` flattened; `.dp-byline-avatar`
    flat-ink; `.dp-take` hairline-on-paper; `.dp-proscons` glyphs;
    `.dp-prose blockquote` ink; verified-chip ink-bordered;
    `.dp-bullet-list` glyph in ink.
  - `src/components/Header.astro` — continuous logo scale 36/44/52.
  - `src/layouts/ArticleLayout.astro` — rewritten to `.dp-*` idiom
    (was unused; kept as primitive against future regression).

### 2. Council convened — agents, commands, and policy in force

- 10 sub-agents at `.claude/agents/*.md` are routable via `Task` and
  via the slash commands.
- 4 slash commands at `.claude/commands/*.md` are live: `/brief`,
  `/research`, `/publish`, `/council`.
- 5 policy files at `.council/00_…04_….md` are normative.
- Tool minimisation per Charter is enforced by the agent
  frontmatter `tools:` allowlists.

## Open questions

### A. `SCRAPED_FIELDS` amendment for `welcomeBonus` — **RESOLVED 2026-05-08**

Chairman approved the contract change. `welcomeBonus` is back in
`SCRAPED_FIELDS` so the structured `parseWelcomeBonus()` output reaches
`cards.json`. `_scraped_freetext.welcomeBonus` is now sourced from the
normaliser's `welcomeBonusFreetext` field so editors can audit the
parsed object against the raw bank copy.

Contract tests at `tests/scrape/propose-changes.test.ts` cover:
- structured object routes to top-level
- raw copy stashes under `_scraped_freetext.welcomeBonus`
- editor-confirmed entries are never overwritten by a scrape
- string fallback still routes when normaliser couldn't parse

### B. Live-site backfill via Firecrawl

`.council/00_state_of_the_site.md` §9 carries TO-BACKFILL markers on
the live-site and competitor sections. They will fill in once
Firecrawl access is wired (MCP server connected, or
`FIRECRAWL_API_KEY` provisioned and the existing HTTP client used).

**Recommendation:** Owner provisions Firecrawl access; Head of
Research runs the backfill scrape on first session post-access and
publishes as
`.council/research/2026-05/state-of-site-backfill.md`.

## Operating cadence in force

Per `EDITORIAL.md` (carried forward unamended):

| Day | Slot |
|---|---|
| Mon | Bank / salary transfer |
| Tue | Deal / lifestyle |
| Wed | Card or airline programme |
| Thu | Lifestyle deal roundup or news |
| Fri | Weekly recap + newsletter send |

## Next milestones (sequenced)

1. **Homepage rebuild** to the 4-section Quiet Ledger spec
   (`src/pages/index.astro`). Highest visible impact; touched only
   when prepared with browser preview.
2. **Structure expansion** per `.council/04_content_taxonomy.md`:
   per-band salary-transfer landing pages, `/cards/best/`,
   `/news/`, `/newsletter/`, `/search/`.
3. **Weekly Firecrawl cadence** for the 10 remaining banks. Order
   per the May 2026 scrape brief: ENBD first.

The phased plan is at
`.council/sessions/2026-05-08-rollout.md`.

## Amendment log for this file

| Date | Editor | Note |
|---|---|---|
| 2026-05-08 | managing-editor | Council declared operational; Chairman picks recorded; design-doc amendments propagated. |
| 2026-05-08 | managing-editor | Q-A resolved: `welcomeBonus` restored to `SCRAPED_FIELDS`; freetext stash remapped to source from `welcomeBonusFreetext`. Contract tests added. Phase A homepage rebuild approved per technical judgement; Phase B routes trickle per editor beat; Phase C cadence revised to seed-then-watch (initial bulk across priority banks, then weekly cron handles deltas). |
| 2026-05-08 | managing-editor | Cron cadence further revised to **monthly** (`0 23 1 * *`, 1st of month 23:00 UTC) per Chairman: weekly is overkill for UAE bank update cycles. `workflow_dispatch` available for between-cron runs. Firecrawl API key provisioned by Chairman; GitHub repo setting "Allow GitHub Actions to create and approve pull requests" still needs to be ticked (one-time admin) for `gh pr create` to succeed. |
