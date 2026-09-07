# Council session synthesis: site-wide UI/UX, navigation and link audit

**Outcome: FAIL on the audited state; structurally sound underneath.** Two P0
defects were live for the whole audit window — main has not built since
1 September, so production is the 30 August artefact, and that artefact
presents a salary-transfer offer that ended 31 August as live on the tracker,
the homepage and the calculator. The hotfix for the build is in PR #348,
flagged as its own T2 item; archiving the RAKBANK offer is an editor's action
the hotfix only warns about. Below the P0s: 72 findings (46 defects,
26 observations), of which 40 are REQUIRED CHANGE, 12 DECISION REQUIRED,
2 VERIFICATION HOLD and 18 SETTLE. Master report:
`.council/research/2026-09/site-audit-uiux-2026-09-06.md`.

## What each agent recommended

The Council convened as a workflow and lost 54 of 56 agents to the account
session limit (see the session file). The table records what each lens
returned — two of them as completed Council agents, the rest as the same
rubric applied by the audit session from the evidence — and what each would
have the Chairman do first.

| Role / lens | Verdict on its surface | First ask |
|---|---|---|
| Head of UX (Council agent, homepage; session, all other templates) | pass-with-edits on 13 of 18 templates; pass on 5; the tracker fails the five-second test at 390 | Fix the two contrast token defects (F-003, F-004), the hamburger keyboard handling (F-007) and the tracker's coverage paragraph (F-019) before any visual polish. |
| Standards Editor (Council agent, homepage; session, chrome) | fail on header actions and quick links; pass-with-edits elsewhere | One `href` (F-011), one deleted span (F-028), two canonical nouns for the salary-transfer product (F-031), and a ruling on the "Join brief" promise (F-012). |
| SEO Strategist (session) | FAIL on mechanical hygiene this quarter | Stop stamping the build month into titles (F-014); fix the five misdirected search forms (F-015); link the eight orphaned tracker pages (F-013). Filed at `.council/seo/audit-2026-Q3.md`. |
| Technical Lead (session) | pass-with-edits; one P0 (build) | Merge the hotfix; then the image derivative pipeline (F-010) — the only change that moves mobile Lighthouse across the board — and the landmark fixes (F-009, F-024). |
| Fact-Checker (session) | fail — a false live statement about a financial offer | Archive RAKBANK (F-002); bump or archive the 31-August stories (F-017); resolve the valuations Q3 promise before 30 September (F-018); browser-verify the 14 timeouts and network errors before declaring citations dead (F-016). |
| Growth & Analytics Lead (session) | hold | Decide the newsletter: launch the list or demote the CTA (F-012); read Search Console before treating SERP absence as fact (F-048). |
| Business & Real Estate Editor (session) | pass-with-edits | Tracker orphan links and history links (F-013), calculator result headings (F-038), title stamps (F-014). |
| Lifestyle & Culture Editor (session) | hold on the deals slot | Commit the desk to a cadence or fold the slot (F-047); heading fix (F-045). |
| Airline / Hotel News Editors (session) | fail on freshness | The 31-August cliff is live (F-017); the fix cannot deploy until the P0 lands. |
| Charter conformance (session) | two open questions | Third hues in the value bar (F-005) and the tracker's mint (F-006) need a ruling under the 2026-07-25 rule; the homepage record and page disagree (F-033). |
| Managing Editor (Council agent) | ranking filed | `managing-editor-ranking.md` in the evidence folder; reproduced in the master report §11. |
| Chairman (Council agent) | decision questions framed | `chairman-decision-questions.md` in the evidence folder; reproduced in the master report §10. |

## Trade-offs explicit

1. **Deploy now versus deploy clean.** The hotfix makes main build and turns
   the lapsed RAKBANK row into a dated "ended" sentence. Shipping it today
   removes a false statement within hours; it also ships 121 long titles, the
   contrast failures and the stale news leads unchanged. Waiting for the
   "now" sprint ships cleaner but leaves the false statement live longer. The
   Fact-Checker lens weighs a false financial statement above every cosmetic
   defect.
2. **Tokens versus a palette pass.** F-003 and F-004 are fixable with two new
   tokens (a text-weight gold, a dark surface for the navy family). F-005 and
   F-006 cannot be fixed without a ruling, because the no-third-hue rule
   requires one. Doing the tokens first fixes 83 + 87 routes of contrast this
   week and leaves the palette question intact for the Chairman.
3. **Council fidelity versus delivery.** The multi-agent review the plan
   called for could not complete in this account's limits. The session
   applied the rubrics itself and says so on every finding; the alternative
   was a fourth attempt at a five-hour workflow with no guarantee of
   finishing. The cost is that the A1 ratings and the template scores carry
   the session's judgement pending specialist sign-off, not the specialists'.
4. **Harness in the PR versus a separate PR.** The audit tooling (opt-in
   `audit:*` scripts, 29 tests, the Monday link sweep) is T3 and travels with
   the audit so the numbers are reproducible on review; it adds
   devDependencies only and touches no shipped byte. Splitting it out would
   make the audit's numbers unverifiable until the second PR merged.

## Decision questions for the user

Framed, not defaulted. The Chairman agent's fuller note (options, Charter
references, publish-blocking list) is in the master report §10.

1. **Palette (F-005, F-006).** Are the AED value-bar's green/terracotta and
   the tracker's mint exempted data-visualisation colours, to be logged as an
   amendment, or do they migrate to navy tints and gold under the
   2026-07-25 rule?
2. **Newsletter (F-012, F-042, F-043).** Launch the Friday brief list now
   (Buttondown configured), or gate every "Join brief" CTA on the launch
   state until it exists?
3. **Second calculator (F-032, F-021).** Merge `/calculator/` into
   `/salary-transfer/calculator/` with a mode switch, or keep both and give
   `/calculator/` an honest name and a nav slot?
4. **Hotel programmes under `/airlines/` (F-030).** Rename to `/programmes/`
   with redirects (T3), or accept the URL and remove the nav's apology
   sub-labels?
5. **Schema spec (F-035).** Ratify what ships (`Product`/`FinancialProduct`,
   `Organization`/`FinancialService`) and rewrite §9, or bring the layouts to
   §9's `Article + Review / FAQPage / Offer`?
6. **Security headers (F-041).** Add `public/_headers` with the report-only
   CSP baseline as a T3 production change now, or defer?
7. **Homepage record (F-033, F-052).** Log the 29 August photo-hero direction
   as an amendment and correct `SITE_ARCHITECTURE.md`, or return the page to
   the ratified four-section spec? Does the h1 gain a topical noun?
8. **Deals desk (F-047).** Commit to a cadence before DSF, or fold the slot
   until the desk has volume?
9. **Valuations (F-018).** Land floor/ceiling for ten programmes by
   30 September, or cut the three columns and re-date the promise?
10. **Self-monitor (F-060) and Firecrawl plan (F-020).** Create the proposed
    52-credit self-monitor? Upgrade the plan, or prune the fee-docs monitor
    once the 37 other monitors on the key are accounted for?

— Synthesis owner: the audit session, 7 September 2026.
