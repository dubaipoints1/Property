---
slug: site-audit-uiux
convened-by: chairman
topic: Site-wide UI/UX, navigation and link audit with a reproducible probe harness
convened: 2026-09-06
participants: head-of-ux, standards-editor, seo-strategist, technical-lead, fact-checker, growth-analytics-lead, business-realestate-editor, travel-experiences-editor, lifestyle-culture-editor, airline-news-editor, hotel-news-editor, managing-editor, chairman
deliverable-shape: brief-plus-proof
status: filed — 2026-09-07 (synthesis: 2026-09-06-site-audit-uiux-synthesis.md)
---

# Council session: site-wide UI/UX, navigation and link audit

## Why convened

Chairman direction in-session, 6 September 2026: "full audit including main
links and sublinks and identify where we can improve especially on the UI/UX
side, utilise all capabilities, also need to use all of the latest tools in
Firecrawl." Three standing obligations were open at the time and are closed
by this session rather than re-invented:

- Agenda item A1 (`agenda-next.md:10-105`) — the Chairman's link-by-link menu
  audit, commissioned in May, never delivered; its table format is used
  verbatim in `.council/audits/2026-09-06-link-audit.md`.
- The SEO Strategist's quarterly site review (`seo-strategist.md:36-38`),
  never filed; first filing at `.council/seo/audit-2026-Q3.md`.
- The Head of UX quarterly site-wide audit (`head-of-ux.md:126-133`), with
  P0–P3 remediation.

## Scope

- Every shipped route (198 after prune) at 360 / 390 / 768 / 1024 / 1280 /
  1440 px, light and dark, from a local build of the current source; every
  live page as deployed (Firecrawl scrape: markdown, links, summary, full-page
  mobile screenshot; desktop screenshots of 24 template pages).
- Header, mega-menus, mobile overlay, quick-links, footer, homepage chrome:
  clarity / content / purpose per A1.
- Titles, descriptions, schema, canonical, OG, sitemap, SERP presence (UAE
  location), internal links, fragment anchors, external links (GitHub Actions
  egress), redirects and headers.
- Accessibility (axe-core, focus, tap targets, contrast in both themes),
  performance (Lighthouse sample against the Technical Lead budget), island
  hydration, motion.
- Freshness and truth of what a reader sees on 6 September 2026.
- Infrastructure: build health, Firecrawl account and monitor health.
- Competitor UX patterns (Firecrawl agent, pattern reference only per the
  29 August §3 ruling).

## Out of scope

- Content rewrites, chrome or layout changes (fixes go to the ranked backlog).
  One exception, ruled in-session: the P0 build fix for the salary-transfer
  coverage classification (main unbuildable since 1 September).
- Re-litigating imagery rulings recorded in
  `site-audit-2026-08-29.md §1.4`.
- Creating the proposed self-monitor on dubaipoints.ae (spec only).
- Any typed numeric taken from an LLM summary (§6): figures are quoted from
  pages, never extracted.

## Agent assignments

Evidence was gathered by the orchestrating session (Firecrawl, per the
2026-05 precedent for the Research arm; local probes via the new harness).
Review ran as a workflow of Council sub-agents reading that evidence:

- head-of-ux: five-second test, ten-fence kill-list and seven-criterion
  scores for every page group; A1 tables for every chrome link.
- standards-editor: voice kill-list on chrome and page heads, two
  alternative wordings per flagged label; A1 cross-check.
- seo-strategist: titles, descriptions, schema, IA, orphans, SERP evidence;
  A1 IA cross-check; quarterly filing.
- technical-lead: probe and Lighthouse readings, hydration, headers, build
  and monitor infrastructure; the harness itself.
- fact-checker: staleness and truth as of 6 September.
- growth-analytics-lead: conversion and retention paths.
- business-realestate-editor, travel-experiences-editor,
  lifestyle-culture-editor, airline-news-editor, hotel-news-editor: their own
  surfaces.
- Charter-conformance lens: no-third-hue, honest-nav, AED format, byline and
  logo rules, documentation drift.
- Verification: three independent lenses per finding (reproduce from
  evidence; prior-ruling/duplicate check; severity and tier calibration); a
  finding survives only if reproduced and not previously ruled.
- managing-editor: ranking, themes, knock-on register, sprints.
- chairman: decision questions and publish-blocking list only.

Outputs: `.council/research/2026-09/site-audit-uiux-2026-09-06.md` (master),
`.council/audits/2026-09-06-link-audit.md` (A1),
`.council/seo/audit-2026-Q3.md`, evidence JSON under
`.council/research/2026-09/site-audit-2026-09-06-evidence/`, and the harness
under `scripts/audit/`, `scripts/ci/`, `.github/workflows/link-audit.yml`.

## How the review actually ran (recorded 2026-09-07)

The Council workflow above failed three times on the account session limit
(14:30 and 21:20 UTC on 6 September; 12:30 UTC on 7 September) and the
runtime ran at most two agents concurrently. Two finders completed before
the last cut — Homepage × standards-editor and Homepage × head-of-ux — and
their findings are merged verbatim and credited in the master report. Every
other lens was applied by the orchestrating session directly from the
evidence, with the lens named on each finding; the Managing Editor and the
Chairman then ran as single agents, one at a time, on the finished findings
list. Dry rounds did not run. The three-lens verification was replaced by
anchor verification at filing and a random re-check (master report,
Appendix B). Sign-off by the named specialists on the A1 tables and the
template scores is pending review of PR #348 — the ratings are the
session's, and the file headers say so.

## Synthesis owner

The orchestrating session, writing as QA reviewer, in
`.council/sessions/2026-09-06-site-audit-uiux-synthesis.md`.

## Decision questions for the user

Recorded in the synthesis and the master report; none defaulted. Headline
set: the palette (a third hue in the live extraction and in `global.css`
tokens), calculator consolidation (open since 22 August), security headers as
a production change, the self-monitor, Firecrawl plan tier versus monitor
load, hotel programmes living under `/airlines/`, and the homepage section
count versus the ratified four-section spec.
