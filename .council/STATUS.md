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
**Active branch:** `codex/integrity-conversion-sprint` (unpublished working branch).
**Current release gate:** `origin/main` through PR #322 has been reconciled with
the local integrity sprint on `codex/integrity-conversion-sprint`. The Chairman's
6 August in-session direction authorises this reconciliation and site audit as
local work. No push, pull request, deployment or publication-status claim is
authorised unless separately requested and verified. Evidence:
`.council/sessions/2026-08-06-main-reconciliation-site-audit.md`.

## Chairman picks (2026-05-08)

The Chairman has signed off on the following decisions, opening the
Council and setting the design direction. Each pick supersedes the
prior default in the named source document.

### 1. UX direction — **Quiet Ledger** (Direction B) — **SUPERSEDED 2026-05-08-bis**

Initially adopted on 2026-05-08; **overridden later the same day** by
the TPG-inspired pivot (see Pick 3 below). Quiet Ledger's foundational
work (palette retune, `.dp-*` rule rewrites, homepage 4-section spec)
shipped on PRs #17, #23, #24 and lives on `main`. Those PRs are not
rolled back — the next visual rebuild lands on top of them.

Original brief: `.council/research/2026-05/ux-redesign-brief.md`.

### 3. UX direction — **TPG-inspired** (override of Pick 1)

- **Brief:** `.council/research/2026-05/tpg-redesign-brief.md`
  (in progress; Head of Research dispatched 2026-05-08).
- **Dossier:** `.council/research/2026-05/tpg-design-dossier.md`
  (in progress).
- **Session document:** `.council/sessions/2026-05-08-tpg-pivot.md`.
- **Reference site:** <https://thepointsguy.com>.
- **Editorial fence:** the visual pivot does NOT touch the Charter's
  editorial non-negotiables (AED-first, no advertorial recommendations,
  Chairman publish gate, Firecrawl exclusive to Research, deterministic
  regex for typed numerics, HfP-dry voice). Visual TPG, voice HfP-dry.
- **Doc churn pending Chairman sign-off:** `BRAND_NOTES.md`,
  `EDITORIAL.md`, `SITE_ARCHITECTURE.md`, `CLAUDE.md` Part I,
  `.council/04_content_taxonomy.md`. Specifics come back with the
  Head of Research brief.
- **Implementation order:** `global.css` → homepage → card review →
  directory pages → trust pages → salary-transfer → valuations. Each
  chunk own branch, own PR, Chairman gate.

### 2. Council convened — agents, commands, and policy in force

- 14 sub-agents at `.claude/agents/*.md` are routable via `Task` and
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

### B. Live-site and monitor verification

The 5 August refresh verified the working repository and production artefact,
not the deployed site or the external health of Firecrawl monitors. Those
states require a separate live check before publication or a monitoring-health
claim.

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

1. Close and record the 6 August reconciliation audit; retain the branch
   locally unless the Chairman separately directs a push or deployment.
2. Configure a verified Buttondown public username and consent settings before
   enabling the newsletter form; the unconfigured site retains an email
   fallback.
3. Complete the two unresolved salary-transfer searches: Standard Chartered
   and Emirates Islamic. Five banks have current source-backed offers; five
   more were checked without a current live banded offer.
4. Resolve the remaining substantive `needs-review` card fields and four
   unpriced welcome bonuses without guessing values.

The phased plan is at
`.council/sessions/2026-05-08-rollout.md`.

## Amendment log for this file

| Date | Editor | Note |
|---|---|---|
| 2026-05-08 | managing-editor | Council declared operational; Chairman picks recorded; design-doc amendments propagated. |
| 2026-05-08 | managing-editor | Q-A resolved: `welcomeBonus` restored to `SCRAPED_FIELDS`; freetext stash remapped to source from `welcomeBonusFreetext`. Contract tests added. Phase A homepage rebuild approved per technical judgement; Phase B routes trickle per editor beat; Phase C cadence revised to seed-then-watch (initial bulk across priority banks, then weekly cron handles deltas). |
| 2026-05-08 | managing-editor | Cron cadence further revised to **monthly** (`0 23 1 * *`, 1st of month 23:00 UTC) per Chairman: weekly is overkill for UAE bank update cycles. `workflow_dispatch` available for between-cron runs. Firecrawl API key provisioned by Chairman; GitHub repo setting "Allow GitHub Actions to create and approve pull requests" still needs to be ticked (one-time admin) for `gh pr create` to succeed. |
| 2026-05-08-bis | managing-editor | **Quiet Ledger SUPERSEDED**. Chairman overrode the visual direction in favour of TPG-inspired (`https://thepointsguy.com`) after seeing PRs #23 (homepage) and #24 (trust pages) merged. Head of Research dispatched to scrape TPG and produce `.council/research/2026-05/tpg-design-dossier.md` + `tpg-redesign-brief.md`. Editorial non-negotiables stay in force; visual scope only. Implementation will land in bite-size per-route PRs after Chairman locks the new spec. |
| 2026-05-09 | managing-editor | **TPG pivot SUPERSEDED on the visual axis** by the Claude Design handoff bundle (handle `JVW6dPIKTdYcvhrGrNtGfg`). The Chairman iterated for ~10 days in claude.ai across 4 chats and produced 18 sections / ~30 artboards of locked-in templates. This is the authoritative spec going forward. Session document: `.council/sessions/2026-05-09-design-handoff.md`. Palette shifts to warm-paper / deep-green / teal-navy (full values in the session doc). Editorial non-negotiables unchanged; data layer protected. 17-chunk implementation plan sequenced. Phase A1 (palette retune) starts immediately on `claude/design-handoff-foundation`. |
| 2026-05-08-bis | managing-editor | TPG spec **locked** by Chairman after 8 mobile screenshots verified the dossier against primary source. Three blocking questions resolved: (Q1) screenshots replace recall flags — emerald not gold/yellow, hero is typographic; (Q2) card-art = CSS placeholder until bank permission lands; (Q3) **no "Apply now" CTAs anywhere** — DP is a "review blog hack vibe", not transactional. |
| 2026-05-08-bis | technical-lead | Chunk 1 (PR #25, merged): `global.css` token retune — palette, type weights, body 15→16px, eyebrow `--ink → --green`. Cascades to every `.dp-*` component automatically. Bonus data repair: `cards.json` enum violations from my ENBD URL scaffold (real-estate / premium / online / Diners-Club-International) all corrected. NETWORK enum expansion for proper Diners Club support queued as fenced follow-up. |
| 2026-05-08-bis | technical-lead | Chunk 2 (PR #27, merged): TPG homepage rebuild — typographic hero / feature card / latest with tabs / favourite cards (filter pills + card-tile grid) / newsletter band. 6 reusable component classes added to `global.css` (`.dp-band-*`, `.dp-feature-card`, `.dp-tabs`, `.dp-filter-pills`, `.dp-card-tile`, `.dp-valuation-row`). Chunks 3–7 consume these without duplication. |
| 2026-05-08-bis | managing-editor | **Pre-content foundation** queued ahead of chunks 3–7 to unblock "start putting stories and news": (a) `news` content collection + `/news/` index + slug route; (b) 20 MDX stubs for ENBD cards merged into `cards.json` by PR #22 — frontmatter-only "review-in-progress" placeholders so the pages don't render half-broken; (c) `/newsletter/` stub + `/rss.xml` endpoint to fix the homepage CTAs that pointed to 404s; (d) `/design-spike/` route deleted (Quiet Ledger spike was superseded). Doc amendments to `BRAND_NOTES`, `EDITORIAL`, `SITE_ARCHITECTURE`, `CLAUDE.md` Part I queued as separate PR. |
| 2026-08-05 | technical-lead | Integrity and conversion sprint opened on `codex/integrity-conversion-sprint`: earn-rate unit integrity, claim-force corrections, configuration-gated Buttondown form, internal-route pruning, Astro 7/Node 22 baseline and production verification. Publication remains gated. |
| 2026-08-05 | standards-editor | Chairman selected the narrow `DubaiPoints Editorial` organisational-byline exception for a one-editor publication; named contributors still require real-name attribution and trust schema remains `Organization`-only until a named profile exists. |
| 2026-08-05 | managing-editor | Renewed review complete: all nine required non-Chairman roles pass and route the exact working tree to the Chairman gate. No commit, PR, publication or deployment is authorised yet. |
| 2026-08-06 | managing-editor | Reconciled the integrity sprint onto `origin/main` through PR #322. Chairman in-session direction authorises the local reconciliation and audit. Salary tracker is 5 current offers, 5 checked without a current live banded offer, and 2 unresolved. Push, deployment and live-publication state remain separate. |
