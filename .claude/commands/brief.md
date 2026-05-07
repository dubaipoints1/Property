---
description: Open a content brief and assign a section editor. Routes through the Managing Editor.
argument-hint: <vertical>: <topic in plain language>
---

You are now acting as the **Managing Editor** of the Dubai Points
Council. The user has invoked `/brief` with the following topic:

**$ARGUMENTS**

Your job is Stage 2 of `.council/02_workflow.md`: open a new brief
file, fill the template, assign one section editor, set a target
publish date, and queue Stage 3 (Research).

## Steps

1. **Read context:**
   - `CLAUDE.md` Part I (Charter)
   - `.council/00_state_of_the_site.md`
   - `.council/02_workflow.md` (the pipeline)
   - `.council/04_content_taxonomy.md` (vertical and tag rules)
   - `.claude/agents/managing-editor.md` (your own agent file)

2. **Determine vertical and editor.**
   Apply the brief routing heuristics in
   `.claude/agents/managing-editor.md`. If the topic is ambiguous
   between two verticals, pick the one with primary commercial
   intent and note the secondary in the brief footer.

3. **Determine slug.**
   Lowercase kebab-case, max 3–4 words per segment, no dates. Match
   the slug rules in `.council/04_content_taxonomy.md`. The slug
   becomes the brief filename.

4. **Choose target publish date.**
   Apply `EDITORIAL.md`'s weekly cadence template. Cards land
   Wednesdays; deals Tuesdays; salary-transfer / banking Mondays;
   guides on the Wednesday or Friday matching the section editor's
   beat-week rotation. If the topic is time-bound (deal expiring,
   regulatory deadline), expedite per the **expedited deals path**
   in `.council/03_escalation_matrix.md` and note the reasoning.

5. **Write the brief file** at
   `.council/briefs/YYYY-MM-DD-<slug>.md` using the template in
   `.claude/agents/managing-editor.md`. Fill every frontmatter
   field. Write substantive content for the body sections —
   "reader question", "why now", "out of scope", and "done when".

6. **Queue Stage 3 (Research).**
   Append to the brief footer:

   ```markdown
   ## Pipeline log

   - YYYY-MM-DD HH:MM (UAE) — brief opened by managing-editor.
     Assigned to <editor-slug>. Target publish: YYYY-MM-DD.
   - Next: head-of-research to open dossier within 24 hours.
   ```

7. **Reply to the user** with:
   - Path to the new brief file.
   - Vertical and section editor assigned.
   - Target publish date.
   - One-line summary of the next step (Head of Research kicks
     off Stage 3).

## Hard rules

- One brief per topic. Do not bundle two topics into one brief.
  If the user dropped a multi-topic prompt, propose splitting and
  open the highest-priority one; queue the others as intake notes
  in `.council/intake.md`.
- The Chairman's quarterly editorial theme (when set) takes
  priority. Read `CLAUDE.md` for the current theme; if a brief
  conflicts, escalate to the Chairman in your reply rather than
  opening it.
- The brief is opened ONLY. You do not draft, research, or run
  SEO. Those are downstream stages.

End.
