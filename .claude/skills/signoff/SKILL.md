---
name: signoff
description: Draft the Council sign-off block for a dubaipoints.ae pull request — pick the tier from the changed files, list the roles that tier requires, and fill the Chairman cell only from a quotable direction. Use before opening or updating any PR, or when asked "what tier is this" / "write the sign-off".
argument-hint: [base-branch]
---

# Council sign-off block

Every PR body needs a `## Council sign-off` section (Charter, Non-negotiable 7).
CI (`scripts/ci/check-signoff.mjs`) checks only that the block exists, a tier is
declared, and the Chairman cell reads `approved`. It cannot check that anyone
reviewed anything — that part is this skill's job to get honest.

## 1. Read the diff

```bash
git diff --stat ${ARGUMENTS:-origin/main}...HEAD
git diff ${ARGUMENTS:-origin/main}...HEAD -- . ':(exclude)package-lock.json' | head -400
```

## 2. Pick the tier — the highest one any file triggers

| Changed | Tier |
|---|---|
| Typo, dead link, source URL, `lastVerified` bump; ≤ 5 lines; no chrome, no prose change beyond the fix | **T1** |
| Microcopy, button/nav label, CTA, kicker, deck, hero quote; restyling a layout component; new pattern in `src/styles/global.css`; trust-page content; AED format strings | **T2** |
| New route under `src/pages/`; new or changed collection in `src/content.config.ts`; new layout in `src/layouts/`; new tool or island; new homepage section; schema in `src/lib/cardsData.ts`; anything in `scripts/scrape/` or `scripts/monitor/`; `package.json` dependency or framework upgrade; regulatory exposure | **T3** |
| `src/data/cards.json` field values | Not named in the Charter table. Treat as **T2** at least and add Fact-Checker; **T3** if the schema or merge contract moves |
| `CLAUDE.md` Part I | Chairman decision under § "Charter amendment" — say so in the Tier line |
| Tooling only (`.claude/`, `.github/`, `tests/`) with no site output change | T2 unless it changes a workflow's gating or the scrape/monitor path (T3) |

When in doubt, go up a tier. Under-tiering is a discipline failure.

## 3. Required roles

- **T1**: Section editor + Chairman.
- **T2**: Standards Editor + Head of UX + Section editor + Chairman.
- **T3**: full council via `/council` — Head of Research, SEO Strategist,
  Fact-Checker, Standards Editor, Head of UX, Technical Lead,
  Growth-Analytics-Lead, Section editor, Managing Editor, Chairman.

A role that did not actually review is `pending`, never `pass`. A role the
tier does not require is `n/a` with a reason.

## 4. The Chairman cell

`approved` only on one of these, named in the Notes cell:

- **In-session direction** (2026-08-06 amendment): quote the Chairman's words
  and the date, and confirm the PR stays inside what was directed. Work the
  session added beyond the direction is not covered.
- A GitHub review, a body edit, or a word in-session approving this PR.

Otherwise write `pending`. Never infer approval. Weekly scrape PRs,
community PRs and automated refreshes always need explicit approval.

## 5. Output

```markdown
## Council sign-off

**Tier**: T2
**Brief**: `<path>` or ad-hoc

| Role | Status | Notes |
|---|---|---|
| Section editor | pass / pass-with-edits / fail / pending / n/a | one line |
| Head of UX (Stage 5.5) | … | one line |
| Fact-Checker (Stage 6) | … | one line |
| Standards Editor (Stage 6.5) | … | one line |
| Technical Lead | … | one line |
| Chairman (Stage 7) | **approved** / pending | mechanism + quote + date |
```

Add the T3 rows (Head of Research, SEO Strategist, Growth-Analytics-Lead,
Managing Editor) when the tier is T3. Then validate the draft locally:

```bash
PR_BODY="$(cat <draft-file>)" node scripts/ci/check-signoff.mjs
```
