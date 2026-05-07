# Escalation Matrix

_Who decides what, when to escalate, when to break the loop. The
Council does not freelance — every decision has an owner; every
escalation has a path._

---

## Authority hierarchy

```
            CHAIRMAN
              │
       MANAGING EDITOR
              │
   ┌──────────┼──────────────┬─────────────┐
   │          │              │             │
HEAD OF      SEO         FACT-CHECKER  TECHNICAL
RESEARCH  STRATEGIST    (compliance)    LEAD
   │          │
   └──── SECTION EDITORS ────┐
         │ travel-experiences │
         │ business-realestate│
         │ lifestyle-culture  │
         └────────────────────┘

GROWTH & ANALYTICS reports laterally to MANAGING EDITOR;
escalates strategy to CHAIRMAN.
```

---

## Decision rights — who decides without escalating

| Decision | Owner | Notes |
|---|---|---|
| Whether to publish a piece | Chairman | The only person with this right. |
| Whether to open a brief on a topic | Managing Editor | Chairman can veto retroactively. |
| Section-editor assignment for a brief | Managing Editor | |
| Choice of primary sources for a dossier | Head of Research | Subject to editorial standards §5. |
| Choice of secondary sources | Head of Research | |
| Primary keyword and SERP intent | SEO Strategist | |
| Word-count band | SEO Strategist | Informed by SERP scan. |
| Internal link targets | SEO Strategist | |
| Schema.org type per page | SEO Strategist + Technical Lead | Must agree. |
| Slug | SEO Strategist | Once set, rename is a Chairman call. |
| Fact-check pass/fail | Fact-Checker | Section editor cannot overrule. |
| Article structure (H2 outline) | Section editor | Within the SEO spec. |
| Tone within house style | Section editor | Chairman has final say on voice. |
| `lastVerified` date update | Section editor | After their own verification call. |
| `_provenance` flips on `cards.json` | Section editor for that bank | `scraped → editor-confirmed` requires verification act. |
| Build / deploy decisions | Technical Lead | |
| Schema markup implementation | Technical Lead | |
| Image optimisation choices | Technical Lead | |
| Adding a new dependency | Technical Lead | Chairman approves anything that affects bundle size > 30KB. |
| Refresh queue prioritisation | Growth & Analytics | Managing Editor approves the weekly cut. |
| Newsletter send schedule | Growth & Analytics | |

---

## Escalation triggers — when to push up

### Section editor → Managing Editor

- Source not findable for a numerical claim → Managing Editor
  decides: kill, descope, or commission a phone call.
- Disagreement with the Fact-Checker → Managing Editor adjudicates;
  if still unresolved, push to Chairman.
- Discovery of a new fact mid-draft that the dossier missed →
  Managing Editor decides whether to loop back to Research or descope.
- Deadline at risk → Managing Editor reslots.

### Section editor → Chairman (direct)

- Brand-voice question that Managing Editor cannot resolve.
- Suspected legal / regulatory exposure (UAE NMC, AECB, TDRA, DET
  guidance).
- Conflict of interest disclosure that affects whether the piece can
  run with the assigned editor.

### Head of Research → Managing Editor

- Source returns 403 / paywall / login wall — escalate; the dossier
  may need to commission a different source.
- Two primary sources contradict — escalate; the Chairman may need
  to weigh in on which to lead with.
- A recently-published piece's source URL has 404'd or substantively
  changed — escalate to add to the refresh queue.

### Head of Research → Chairman (direct)

- Discovery of a regulatory change affecting multiple live pieces →
  Chairman decides on bulk-refresh.
- A bank or property has retracted a public claim we published →
  Chairman decides on correction language and timing.

### SEO Strategist → Managing Editor

- Primary keyword has high competition with no realistic top-10 path
  → Managing Editor decides: descope, pivot keyword, or accept long
  game.
- Internal-link target requested doesn't exist on the live site →
  Managing Editor decides whether to commission the missing piece
  before publishing this one.

### SEO Strategist → Chairman (direct)

- Site-wide IA change recommendation (new top-level category, slug
  pattern shift, redirect map) → Chairman decision.

### Fact-Checker → Managing Editor → Chairman

- Fact-check fail that the section editor disputes — Managing Editor
  first; Chairman if unresolved within 24 hours.
- Repeated fact-check fails by the same editor in 30 days →
  Chairman pattern review.

### Technical Lead → Managing Editor

- Build broken on `main` → first to know, fixes immediately; logs to
  Managing Editor for the daily standup.
- Lighthouse score drops below 90 mobile → Managing Editor decides
  whether to halt new publishes until restored.

### Technical Lead → Chairman (direct)

- Cloudflare Pages outage or persistent deploy failure.
- Decision to add or remove a major dependency (Astro version bump,
  Tailwind major upgrade, swap of CMS or hosting).
- Web Analytics / privacy / cookie-consent posture change.

### Growth & Analytics → Managing Editor

- A piece dropping >10 positions in 7 days → managing-editor decides
  on refresh urgency.
- A new query trending in the dashboard with no existing coverage →
  Managing Editor opens a brief.

### Growth & Analytics → Chairman (direct)

- Quarterly review of editorial mix vs traffic outcomes.
- Recommendation to launch a new vertical based on demand signal.

---

## Cross-vertical disputes

When two section editors both want to claim a topic (e.g. a Skywards
hotel transfer that touches both Travel & Experiences and Business
& Real Estate via property loyalty programmes):

1. Managing Editor proposes a single-owner assignment and writes the
   call into the brief.
2. The non-owning editor may contribute a sidebar but does not get
   the byline.
3. Persistent disputes over more than two briefs in a quarter → the
   Chairman re-draws beat boundaries.

---

## When to break the loop and ship

The pipeline is designed for evergreen and analytical work. For
**time-bound news** (a salary-transfer offer expires Friday, a card
welcome bonus drops Monday), the **expedited deals path** in
`02_workflow.md` collapses Stages 3–7 into a 4-hour combined pass:

- Head of Research and Section Editor pair-source live.
- SEO Strategist provides keyword + slug only — no SERP scan.
- Managing Editor stands in as Fact-Checker.
- Technical Lead does an abbreviated tech pass (build + schema only).
- Chairman gate is unchanged; even time-bound pieces do not skip it.

The expedited path is logged in the brief footer with reasoning.

---

## Conflict of interest

Council members declare standing COIs on their `/team/` profile and at
the top of any brief where the COI is material. Material conflicts:

- Holding the card under review.
- Having the salary transfer at the bank under review.
- Being hosted by the property, airline, or operator under review in
  the past 12 months.
- Affiliate or commercial relationship with the issuer.
- Family member holding a senior role at the institution.

A material COI does not bar coverage; it bars sole authorship. The
Chairman assigns a co-author or transfers the assignment.

---

## Final clause

If any rule above conflicts with editorial standards (`01_editorial_
standards.md`), editorial standards win. If editorial standards conflict
with the Charter (`CLAUDE.md` top section), the Charter wins. If the
Charter is silent and the rule isn't covered, the Chairman decides and
the decision is logged into the next revision of the relevant document.

End.
