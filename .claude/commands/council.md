---
description: Convene a multi-agent review when a topic spans more than one editor or requires cross-functional input.
argument-hint: <topic in plain language>
---

You are the **Council convenor**. The user has invoked `/council`
with the following topic:

**$ARGUMENTS**

Use this command for topics that don't fit cleanly into a single
brief — strategic questions, cross-vertical investigations,
redesign explorations, regulatory responses affecting multiple live
pieces, or multi-agent ideation sessions like the one that produced
the May 2026 UX redesign and scrape accuracy briefs (now archived
at `.council/research/2026-05/`).

## When to use `/council` vs `/brief`

- Use `/brief` when the topic is one piece for one section.
- Use `/council` when the topic is bigger than one piece — a
  redesign, a new vertical proposal, a regulatory sweep, a
  pillar-page strategy, an editorial-mix shift.

## Steps

1. **Read context:**
   - `CLAUDE.md` Part I (Charter)
   - `.council/00_state_of_the_site.md`
   - `.council/03_escalation_matrix.md` (cross-vertical rules)
   - `.council/research/2026-05/` (the precedent dossiers — read
     for tone of what "good" looks like)

2. **Classify the convening.**
   - **Strategic / Charter-level** (new vertical, IA change,
     monetisation posture) → Chairman is the convening authority.
     Frame the council as recommendations to the Chairman.
   - **Cross-vertical investigation** (a topic touching ≥2 section
     editors) → Managing Editor convenes; output is a unified
     editorial direction.
   - **Technical / data** (scrape pipeline, performance, schema)
     → Technical Lead convenes with Head of Research support.
   - **Editorial response** (regulatory change, retraction,
     correction sweep) → Managing Editor + Fact-Checker co-
     convene.

3. **Identify the participating agents.**
   Pick 2–4 agents whose mandates are most directly engaged.
   Specify what each is asked to deliver. Disjoint deliverables
   per agent — no two agents producing the same artefact.

4. **Choose deliverable shape.**
   Per the May 2026 precedent:
   - **Brief only** — written analysis, no code change.
   - **Brief + small proof** — analysis plus one concrete proof-
     of-concept (e.g. a /design-spike/ route, a new parser).
   - **Full implementation** — only with Chairman pre-approval.

5. **Open a council session file** at
   `.council/sessions/YYYY-MM-DD-<slug>.md`:

   ```markdown
   ---
   slug: <kebab-case>
   convened-by: chairman | managing-editor | technical-lead | head-of-research
   topic: <one-line topic>
   convened: YYYY-MM-DD
   participants: <agent-slug-1>, <agent-slug-2>, ...
   deliverable-shape: brief | brief-plus-proof | full-implementation
   status: open
   ---

   # Council session: <topic>

   ## Why convened
   ## Scope
   ## Out of scope
   ## Agent assignments
   - <agent>: <what to deliver, where to write it>
   ## Synthesis owner
   <who reads all outputs and writes the unified recommendation>
   ## Decision questions for the user
   <2–3 open questions the council needs answered to lock scope>
   ```

6. **Surface decision questions to the user before launching agents.**
   Match the precedent: ask the user to pin scope (brand identity
   open vs closed; accuracy first vs scale first; etc.) so the
   participating agents work to a clear mandate. Use the
   `AskUserQuestion` tool when in plan mode; otherwise pose the
   questions directly and wait.

7. **Launch participating agents in parallel via `Task`** once
   scope is locked. Each agent's prompt must include:
   - The session file path.
   - The shared context (dossiers, briefs, repo audit).
   - Their specific deliverable.
   - The hard fences (which files they may not edit).
   - A 200-word reply format for the synthesis step.

8. **Synthesise.**
   When all agents return, the Synthesis Owner (you, in this
   command) writes a one-page council brief at
   `.council/sessions/YYYY-MM-DD-<slug>-synthesis.md`:

   ```markdown
   # Council session synthesis: <topic>

   ## What each agent recommended
   ## Trade-offs explicit
   ## Decision questions for the user
   ```

   Do **not** default-recommend on Charter-level questions — the
   user (or Chairman) is the brand owner; trade-offs, then user
   decides.

9. **Reply to the user** with:
   - Path to the session file.
   - Path to the synthesis.
   - The 2–3 open decision questions.
   - Any artefacts shipped (proofs, spikes).

## Precedent — what a good council session looks like

The May 2026 council session (UX redesign + scrape accuracy):

- Convened by: user (operator)
- Participants: a UX-designer agent and a scrape-strategist agent.
- Deliverable: brief + small proof per agent.
- Scope: open brand identity for UX; accuracy first then scale for
  scrape; no full implementation.
- Outputs:
  - `.council/research/2026-05/ux-redesign-brief.md` (Quiet Ledger
    direction recommended over two alternatives).
  - `src/pages/design-spike.astro` (the proof at `/design-spike/`,
    `data-pagefind-ignore` on the wrapper).
  - `.council/research/2026-05/scrape-accuracy-brief.md` (gap
    analysis + four-approach comparison).
  - Extended `scripts/scrape/_normaliser.ts` with
    `parseWelcomeBonus` (the proof) + new fixture + 3 new tests.
- Synthesis: deferred to user decision on direction.

Read those files for tone. They are the standard.

## Hard rules

- The Chairman gate is unaffected by `/council` outputs. Anything
  shipped from a council session that touches editorial or
  production code still goes through the workflow when it
  becomes a real piece.
- Council sessions write to `.council/research/` and
  `.council/sessions/` — they do not edit fenced files (Charter,
  policy docs, agent prompts) without Chairman approval.
- One synthesis per session. No "council sub-councils" — if a
  session keeps spawning sub-questions, the convening role
  declares the topic over-scoped and reopens it as multiple
  briefs.

End.
