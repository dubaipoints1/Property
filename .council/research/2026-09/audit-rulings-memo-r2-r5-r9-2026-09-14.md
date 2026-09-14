# Decision memo — the six open rulings from the 6–7 September audit

**To:** Chairman
**From:** session `session_01FxJEYtsa6JogidXHeAd3XU`, acting for Managing Editor
**Date:** 14 September 2026
**Source:** `site-audit-uiux-2026-09-06.md` §10. R1, R3, R4 and R10 were ruled on 10 September (CLAUDE.md Amendments). R2 and R5–R9 remain open. Each question below is reproduced in one line, followed by a recommended option, what it costs, and the one sentence you would need to say for a session to act on it under the 2026-08-06 amendment.

This memo recommends. It rules nothing. A session that acts on a row without your word on it is committing the discipline failure the amendment names.

---

## R2 — Homepage: which page is ratified, and what does the H1 say?

**Question.** Does the record catch up to the shipped eight-band homepage (photo hero, boxed idiom, gold band exception, italic two-beat H1) by a dated Amendment, or does the page return toward the four-section Quiet Ledger spec? And does the H1 gain a topical noun?

**Recommendation: (a) ratify the shipped page**, by a dated Amendment written from the 29 August direction that currently lives only in an `index.astro` code comment; update `SITE_ARCHITECTURE.md:343` and carve the §5.4 italic rule out for the H1 only.

**Why.** The page is nine days old on your own direction, three later fix sprints have built on it (F-021, F-032, F-047 all have their surfaces there), and the four-section spec would discard all of that for a design the record says shipped as something else anyway. Option (c), pruning, is a T3 council on a page that has just been audited; nothing in the findings says a band is failing readers, only that the record is wrong.

**H1 sub-ruling. Recommendation: (i) keep "Fly further. Pay less." and fix the announcement bug (F-040) now.** Option (ii), "Fly further. *On a Dubai salary.*", is the better sentence for the site's stated differentiation and would carry the topical noun F-052 asks for. It is your sentence; the memo puts it in front of you rather than choosing it.

**Cost.** T1 doc change; zero code beyond the F-040 fix. The 2026-05-08 Quiet Ledger homepage decision is formally reversed.

**Your word, if you agree:** "Ratify the homepage as shipped; keep the H1; fix the space bug."

---

## R5 — Hotel programmes: do they keep living under `/airlines/`?

**Question.** Move Marriott Bonvoy, Hilton Honors and Accor ALL out of `/airlines/` (rename everything to `/programmes/`, or split hotels to `/hotels/`), or keep the URLs and make the nav label honest?

**Recommendation: (c) now, (b) later behind a brief.** Fix the nav row label and give `/airlines/` a "Hotel programmes" sub-heading this month (T2). Move the three hotel pages to `/hotels/` with three 301s when the hotel desk has real programme briefs to put there, per the 2026-07-27 ruling that de-scoped hotel rows return only behind real briefs.

**Why.** Option (a) puts the SEO equity of six programme URLs at risk to fix three pages. Option (b) is right in principle, since currency governs and `/news/hotels/` already exists, but SITE_ARCHITECTURE says no new top-level destinations, and opening one for three thin pages inverts the honest-nav rule. Option (c) costs a label and a heading, and lets the URL question ride with the content that would justify it.

**Cost.** (c) is a T2 afternoon. (b) later is T3: redirects, sitemap, breadcrumbs, footer column.

**Your word, if you agree:** "Label fix now; hotels move to /hotels/ when their briefs exist."

---

## R6 — Schema: which §9 is canonical?

**Question.** Is the written §9 structured-data spec the standard, or is what ships the standard, or is a reconciled spec drafted first?

**Recommendation: (c) reconcile first.** Technical Lead and SEO Strategist draft one §9 within a week; you ratify; implementation follows as T3 with a schema-per-template test so it cannot drift again.

**Why.** (a) ratifies drift as policy. (b) implements a spec that already contradicts the 2026-08-05 byline amendment (author data must be `Organization` only). The items that need no ruling proceed regardless: `CollectionPage` and `BreadcrumbList` on the directories, `BreadcrumbList` on the tracker family, fill or delete `sameAs`.

**Cost.** One week of two specialists' time before any template changes.

**Your word, if you agree:** "Reconcile §9 first; the no-ruling items proceed."

---

## R7 — Security headers: does `public/_headers` ship?

**Question.** Adopt `public/_headers` now with the full recommendation (HSTS plus a report-only CSP), a conservative subset, or defer to Q4?

**Recommendation: (b) the static five, short HSTS, no CSP yet.** `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and HSTS with a short `max-age` and no preload. CSP returns as its own item once the inline-script inventory (theme toggle, nav script) is known.

**Why.** The four content headers have no lock-in and no failure mode on a static site. HSTS is safe at a short age. A CSP can silently break the Preact islands and the theme toggle, and a report endpoint is a new outbound data flow the privacy page would have to describe. Deferring everything to Q4 (c) leaves the easy four unshipped for no reason.

**Cost.** Still T3 by Charter wording, but the change is one file. Technical Lead validates on a preview deploy before it reaches main.

**Your word, if you agree:** "Ship the four headers and short HSTS; CSP is a separate item."

---

## R8 — Self-monitor: should the site watch itself through Firecrawl?

**Question.** Provision a Firecrawl monitor on dubaipoints.ae, and before or after the credit-budget hold clears?

**Recommendation: (b) defer until F-020 clears**, and treat (c) as the likely end state. The audit found the key carrying 42 monitors at an API-estimated 20,920 credits a month against a documented 5,000-credit plan. Nothing should be added to that budget until someone has counted it. Once counted, the deterministic audit harness already gives the site a self-check at zero credits, and pointing a Firecrawl judge at our own pages puts an LLM opinion loop where the §6 boundary was built to keep it out.

**Why.** Money first, posture second. Both point the same way.

**Cost.** None now. The F-020 hold is the real task: confirm the plan tier and whose the other 37 monitors are. That is an account-owner action.

**Your word, if you agree:** "No self-monitor until the credit count is done; the harness is our self-check."

---

## R9 — Deals: does a three-deal desk keep a primary nav slot?

**Question.** Commit the lifestyle desk to a deals cadence that justifies the nav slot, the homepage tile and the Travel-panel row before DSF, or pull `/deals/` from the nav until it has volume?

**Recommendation: (c) keep the slot and make the count honest** ("Deals · 3 live"), paired with a dated cadence brief for DSF. Three live deals of six on the day of writing, one expired since 18 August still open in issue #333. Dropping the vertical from navigation (b) would be a first for the site and is Chairman-only; committing the desk (a) is a resourcing decision only you and the Managing Editor can make. (c) changes nothing structural and lets the number argue.

**Sub-question, expired deals. Recommendation: dated records with an "Ended" banner, never a 301.** This is the salary-transfer precedent already in the house (offers move to a history collection and render a dated "ended" sentence). Saying so once makes it a rule.

**Cost.** T2 for the count label. The DSF brief is the real cost and is the Managing Editor's to open.

**Your word, if you agree:** "Keep deals in the nav with an honest count; expired deals stay as dated records; open the DSF brief."

---

## What a session can do the moment you rule

| Ruling | Immediate work if you take the recommendation | Tier |
|---|---|---|
| R2 | Amendment text + SITE_ARCHITECTURE line + F-040 space fix | T1 + T2 |
| R5 | Nav label + directory sub-heading | T2 |
| R6 | Nothing until the reconciled §9 exists; the no-ruling schema items can start | T2 |
| R7 | `public/_headers` with four headers + short HSTS, validated on preview | T3 (one file) |
| R8 | Nothing; F-020 count is the owner's | — |
| R9 | "Deals · N live" label; issue #333 archive; DSF brief opened | T2 |

Rulings can be given one at a time. Each row stands on its own.
