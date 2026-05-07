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

## Open questions still awaiting Chairman

The following were flagged by the May 2026 spike and have **not** been
resolved on this branch. Each requires explicit Chairman go before a
change lands.

### A. `SCRAPED_FIELDS` amendment for `welcomeBonus`

The structured `parseWelcomeBonus()` parser ships in
`scripts/scrape/_normaliser.ts`, but `welcomeBonus` was removed from
`SCRAPED_FIELDS` in commit `e291a87`. Until it moves back, the
parser's output cannot land in `cards.json` — it parses and never
ships. This is a fenced contract change.

**Recommendation:** approve, restore to `SCRAPED_FIELDS`. The
existing provenance contract still protects editor-confirmed entries
from overwrite.

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
