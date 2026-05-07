# Workflow — Brief to Publish

_The operational pipeline. Every published piece follows these ten
stages. No skipping. The Chairman is the only person who can collapse
stages, and only with explicit written justification logged at the top
of the brief._

---

## Pipeline

```
1. INTAKE        Topic lands
2. BRIEF         Managing Editor opens, assigns, sets deadline
3. RESEARCH      Head of Research delivers dossier
4. SEO PASS      SEO Strategist sets keyword + structure spec
5. DRAFT         Section editor writes
6. FACT-CHECK    Fact-Checker verifies every claim
7. TECH PASS     Technical Lead validates schema, links, images
8. CHAIRMAN      Read-through, gate (publish or kick back)
9. PUBLISH       Technical Lead deploys
10. POST-MORTEM  Growth & Analytics tracks performance
```

---

## Stage 1 — INTAKE

**Owner:** anyone. Topics arrive from the user (operator), the
Chairman (strategic), the Growth & Analytics Lead (refresh queue), or
the Head of Research (intelligence-driven).

**Output:** a one-line topic landing in the Managing Editor's queue.
Format: `<vertical>: <plain-language topic>`. Example:
`business-realestate: Golden Visa for tech founders, 2026 update`.

---

## Stage 2 — BRIEF

**Owner:** Managing Editor.

**Trigger:** any topic in the queue, or `/brief <topic>` invoked.

**Action:**
1. Open a new file at `.council/briefs/YYYY-MM-DD-<slug>.md`.
2. Fill the brief template (see below).
3. Assign one section editor (Travel & Experiences, Business & Real
   Estate, or Lifestyle & Culture).
4. Set a target publish date.
5. Open the dossier slot for the Head of Research.

**Brief template:**

```markdown
---
slug: <kebab-case>
vertical: travel-experiences | business-realestate | lifestyle-culture
assigned-editor: <slug>
research-status: pending
seo-status: pending
draft-status: pending
factcheck-status: pending
tech-status: pending
chairman-status: pending
target-publish: YYYY-MM-DD
sources-required: 3
---

# <Working title>

## The reader question
One paragraph in plain language: what is the reader trying to find out?
What decision are they about to make?

## Why now
Why is this brief opening this week, not last week, not next month?

## Out of scope
What this piece is explicitly not.

## Done when
Three to five concrete acceptance criteria.
```

**Done when:** the brief file exists, the section editor has
acknowledged in the brief footer, and the Head of Research has been
tasked.

**SLA:** brief opens within 24 hours of intake.

---

## Stage 3 — RESEARCH

**Owner:** Head of Research.

**Tools:** Firecrawl (exclusive to this role), `WebFetch`, `Read`,
`Write`, `Glob`, `Grep`.

**Action:**
1. Read the brief.
2. Pull primary sources via Firecrawl: bank pages, government
   portals, official loyalty terms, official PDFs.
3. Pull secondary sources for context: competitor coverage of the
   same topic, news coverage, regulatory commentary.
4. Verify every numerical claim has at least one primary source.
5. Save the dossier at
   `.council/research/YYYY-MM/<slug>-dossier.md`.

**Dossier template:**

```markdown
# Research dossier: <slug>

## Primary sources
- [Source name](url) — accessed YYYY-MM-DD — what it tells us
- ...

## Secondary sources
- [Source name](url) — what they got right / wrong

## Current AED pricing
| Item | Price | Source | Verified |

## Competitor coverage
- HfP / TPG / PMB / DearestDubai — what they published, when

## Open questions for the editor
- Things the dossier could not answer; flag for live verification

## Last verified
YYYY-MM-DD
```

**Done when:** every numerical claim in the brief has a primary-source
URL, the dossier file exists, and `research-status: complete` is set
in the brief frontmatter.

**SLA:** dossier delivered within 3 business days of brief assignment
for daily content; within 7 business days for guides.

**Escalation:** if a primary source can't be found, flag to Managing
Editor — the brief may need to descope or the piece may need to be
killed.

---

## Stage 4 — SEO PASS

**Owner:** SEO Strategist.

**Tools:** `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`. (No
Firecrawl — route SERP scraping requests to Head of Research via the
`Task` tool.)

**Action:**
1. Read brief and dossier.
2. Determine primary keyword + 3–5 semantic variants.
3. Classify SERP intent: informational / commercial / navigational /
   transactional.
4. Run a top-10 SERP scan via Head of Research; receive a back-from-
   Research note on word-count band and structural tropes.
5. Draft the SEO spec at the bottom of the brief.

**SEO spec template** (appended to brief):

```markdown
## SEO spec

- Primary keyword: <keyword>
- Semantic variants: <variant1>, <variant2>, ...
- SERP intent: <classification>
- Target word-count band: <min>–<max>
- Meta title pattern: <see editorial standards §9>
- Meta description: <write the actual description, ≤155 chars>
- H2 outline (5–8 headings, keyword-natural): ...
- FAQ candidates (3–5 questions): ...
- Internal link targets within dubaipoints.ae: <three slugs>
- Schema.org types: <Article | Review | FAQPage | Offer | ...>
- Slug: <final-kebab-case>
```

**Done when:** the SEO spec is filled, internal link targets exist on
the live site (no broken-link inventory at draft-time), and
`seo-status: complete` is set.

**SLA:** SEO spec delivered within 1 business day of dossier landing.

---

## Stage 5 — DRAFT

**Owner:** assigned section editor.

**Tools:** `Read`, `Write`, `Edit`, `Glob`, `Grep`, plus narrow
`Bash(npm run check:*, npm run dev:*)`.

**Action:**
1. Read brief, dossier, SEO spec.
2. Write the draft as MDX in the right collection
   (`src/content/cards/<slug>.mdx`,
   `src/content/guides/<slug>.mdx`,
   `src/content/deals/<slug>.mdx`).
3. Run `npm run check` to validate Zod schema before declaring
   draft complete.
4. Update `draft-status: complete` in the brief.

**Done when:** `npm run check` passes; the article reads cleanly
end-to-end; every claim from the dossier is sourced inline; word count
is inside the SEO band; H2 outline matches the SEO spec or has a
documented justification for divergence.

**SLA:** 2–3 business days for cards/deals; 5–7 for guides.

**Escalation:** any new fact discovered during drafting that wasn't in
the dossier triggers a back-to-Research loop, not editor freelance
sourcing. Managing Editor logs the loopback.

---

## Stage 6 — FACT-CHECK

**Owner:** Fact-Checker.

**Tools:** `Read`, `Edit`, `Glob`, `Grep`, `WebFetch`.

**Action:**
1. Read draft and dossier side-by-side.
2. Verify every numerical claim, every regulation citation, every
   transit time, every visa rule against the dossier's primary
   source. If the source contradicts the draft, redline.
3. Verify `lastVerified` date is within 30 days for any
   externally-controlled fact (price, fee, regulation).
4. Verify affiliate / sponsored disclosure is above the fold per
   editorial standards §5.
5. Apply the kill-list checks from editorial standards §10.

**Done when:** every flagged item is either corrected in-draft by the
editor or escalated to the Chairman with reasoning; the draft has a
Fact-Checker sign-off line near the top
(`<!-- factchecked: <name> YYYY-MM-DD -->`).

**SLA:** 1 business day per piece.

**Escalation:** any unresolved factual dispute goes straight to the
Chairman; the section editor may not overrule the Fact-Checker.

---

## Stage 7 — TECH PASS

**Owner:** Technical Lead.

**Tools:** `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`.

**Action:**
1. Run `npm run check` and `npm run build` against the branch.
2. Validate JSON-LD schema emission for the page type (per editorial
   standards §9).
3. Validate internal links resolve.
4. Validate images: explicit `width` and `height`; `loading="lazy"`
   below fold; `astro:assets` for in-repo images.
5. Validate the `lastVerified` field is set on cards and offers.
6. Validate Pagefind doesn't index drafts that should be hidden
   (e.g. spike routes carry `data-pagefind-ignore`).

**Done when:** `npm run build` is green; Lighthouse mobile score ≥ 95
on the affected page; JSON-LD validates against the relevant schema
spec.

**SLA:** 1 business day.

---

## Stage 8 — CHAIRMAN

**Owner:** Chairman (Editor-in-Chief).

**Tools:** all.

**Action:**
1. Read the published-ready piece end-to-end.
2. Apply the brand-voice judgement (HfP-dry, evidence-led, no
   orientalism, no marketing fluff).
3. Decide:
   - **Publish** — sign off in the brief frontmatter
     (`chairman-status: approved`) and add a one-line note.
   - **Kick back** — annotate the draft with redlines, set
     `chairman-status: rework`, and route back to the section editor
     via Managing Editor.
   - **Kill** — set `chairman-status: killed` and record the reason.

**Done when:** the brief frontmatter shows `chairman-status: approved`
with a date.

**Hard rule:** no piece is published without an approved chairman
status. The `/publish` slash command halts at this gate by design.

---

## Stage 9 — PUBLISH

**Owner:** Technical Lead.

**Action:**
1. Merge the branch to `main`.
2. Confirm Cloudflare Pages deploys cleanly (no build errors in the
   Pages dashboard).
3. Confirm the page is live at the canonical URL.
4. Confirm Pagefind has indexed the page (rebuild postbuild ran).
5. Submit the URL to Search Console for indexing if it's a pillar
   page.

**Done when:** the URL returns 200, the canonical link in `<head>`
matches, and the sitemap includes it.

**SLA:** within 24 hours of Chairman approval.

---

## Stage 10 — POST-MORTEM

**Owner:** Growth & Analytics Lead.

**Action:**
1. Add the page to the tracking dashboard.
2. At T+30 days: log impressions, clicks, average position, top query.
3. At T+90 days: re-run the position check; if dropped >5 positions,
   add to the refresh queue and notify the Managing Editor.
4. Monthly: aggregate into the traffic memo, archived at
   `.council/research/YYYY-MM/traffic-memo.md`.

**Refresh queue feeds back into Stage 1 — the loop closes.**

---

## Workflow rules summary

- One piece, one brief, one slug. No "multi-part series" without
  Chairman pre-approval at Stage 2.
- Every stage advances the brief frontmatter. No silent advances.
- Section editors do not skip the dossier. The Fact-Checker rejects
  drafts whose claims aren't traceable to the dossier.
- The Chairman gate (Stage 8) is the only role that may waive any
  preceding stage, and only with a logged reason.
- Time-sensitive deals may use the **expedited deals path**: Stages
  3–7 collapse into a 4-hour combined pass with the Managing Editor
  acting as the Fact-Checker. Chairman gate still applies.

End.
