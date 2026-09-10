---
title: SEO quarterly audit — 2026 Q3
owner: seo-strategist
filed: 2026-09-07
session: .council/sessions/2026-09-06-site-audit-uiux.md
evidence: .council/research/2026-09/site-audit-2026-09-06-evidence/
status: filed — first quarterly audit under .claude/agents/seo-strategist.md §"Operating rhythm"
---

# SEO quarterly audit — 2026 Q3

First filing of the quarterly review the SEO Strategist role file has
required since May (`.claude/agents/seo-strategist.md:36-38, 138-139`);
the `.council/seo/` directory did not exist before this audit. Scope is
the mechanical layer the Strategist owns: orphans, broken and redirected
links, title and description lengths, schema coverage by template, Open
Graph, sitemap and robots, and SERP presence for the money queries. Every
number below is computed from the built `dist/` of commit `b242105` or
from a Firecrawl call whose id is in the evidence folder. Nothing here is
an LLM estimate.

**What this audit could not do.** There is no Search Console access from
the session, so position and decay data are absent; the SERP section
uses Firecrawl's web index with UAE location, which is a proxy for, not a
copy of, Google. Findings that depend on Google's own view are marked
VERIFICATION HOLD.

## 1. Inventory

| Measure | Value | Source |
|---|---|---|
| Built HTML routes | 199 (198 in sitemap + `404.html`) | `static-config.json` |
| Live URLs discovered (Firecrawl map, 6 Sep) | 197 | `recon-notes.md` |
| Sitemap vs build diff | 0 either way | `static-config.json` |
| Internal links checked / broken | 14,024 / 0 | `internal-links.json` |
| Fragment anchors checked / broken | 576 / 1 | `fragments.json` |
| Distinct external URLs / broken / unverifiable | 150 / 18 / 21 | `external-links.json` |
| Canonical present | 199 of 199 | `dist/` grep |
| Pages sharing `og-default.png` | 198 of 199 | `dist/` grep |
| Titles > 60 characters | 121 of 201 rendered titles | `seo-mechanical.json` |
| Titles carrying a month stamp | 84 (58 "August 2026", 23 "September 2026") | `dist/` grep |
| Descriptions > 155 characters | 65 | `seo-mechanical.json` |
| Routes with 0 inbound internal links | 14 | `seo-mechanical.json` |
| Median inbound links per route | 11 | `seo-mechanical.json` |

## 2. Defects

Numbered S-01 onward. Each carries one anchor, a verdict category, the
minimum bounded correction, and a knock-on register. Cross-references to
the master report use its F-numbers.

### S-01 — Production is the 30 August build; every fix below is unreachable until the P0 lands

- **Anchor:** `src/pages/salary-transfer/index.astro` (coverage guard, pre-hotfix); `live-probes.json → changeTracking-root` (`changeStatus: same`, 6→7 Sep).
- **Evidence:** the live DIB hub title is `Dubai Islamic Bank — UAE cards, salary transfer & reviews` (no brand suffix) and the live Mashreq tracker title uses ` - DubaiPoints`; both are already fixed in source (`dist/banks/dib/index.html`, `dist/salary-transfer/mashreq/index.html` carry ` | DubaiPoints`). Search engines are still indexing the old strings because main has not deployed since 30 August.
- **Verdict:** REQUIRED CHANGE (P0, T2) — already in PR #348 as the flagged hotfix.
- **Minimum correction:** merge the hotfix; archive the RAKBANK offer (editor task).
- **Knock-on:** every S-finding here; the `(August 2026)` card titles refresh only on deploy.

### S-02 — Salary-transfer bank titles stamp the *build* month, not a verification date

- **Anchor:** `src/pages/salary-transfer/[slug].astro:74` — `` `${props.bankName} salary transfer offer (${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}) | DubaiPoints` ``.
- **Evidence:** 15 bank pages render `(September 2026)` in `dist/` built on 7 Sep, including RAKBANK whose offer ended 31 Aug. The card-review pattern at `src/pages/cards/[slug].astro:57` uses `verifiedStamp` (from `lastVerified`) — the honest version of the same idea.
- **Verdict:** REQUIRED CHANGE (P1, T2 — title copy; fact-checker co-sign).
- **Minimum correction:** replace `new Date()` with the offer's `lastVerified` (or `validUntil` month when the offer is live), mirroring `verifiedStamp`; when no live offer, drop the parenthetical.
- **Knock-on:** `tests/content/salary-transfer-coverage.test.ts` (add a title assertion); SERP snippet for `/salary-transfer/mashreq/` (S-01 evidence).

### S-03 — 121 of 201 titles exceed 60 characters; news titles run to 138

- **Anchor:** `seo-mechanical.json → titles.over60` (worst: `/news/ihg-one-rewards-choice-points-promo-ends-31-august/`, 138 chars).
- **Evidence:** the house pattern in `.council/01_editorial_standards.md §9` (`[Card] Review (Month Year): [One-line verdict] | DubaiPoints`) cannot fit 60 characters for any Emirates NBD card name; news stories inherit their full headline plus the suffix. Google truncates at roughly 600 px (≈55–60 chars), so the brand suffix is cut on every one of these and the stamp is cut on most.
- **Verdict:** REQUIRED CHANGE (P2, T2) for the template; DECISION REQUIRED for the §9 pattern itself (Standards Editor + SEO Strategist).
- **Minimum correction:** (a) news/deal/guide layouts: add an optional `seoTitle` frontmatter field, fall back to headline; (b) card reviews: move the stamp out of `<title>` into the description and keep `[Card] review | DubaiPoints`; (c) amend §9 to state a 60-character ceiling.
- **Knock-on:** `tests/nav/header.test.ts` (title assertions if any), Pagefind result titles, RSS item titles.

### S-04 — 65 descriptions exceed 155 characters; news worst at 334

- **Anchor:** `seo-mechanical.json → descriptions.over155`; `src/content/news/etihad-miles-rate-holds-2-94-fils-second-sale.mdx:3`.
- **Evidence:** news frontmatter `description` doubles as the story's standfirst, so it is written as a paragraph. The Strategist's own brief template caps descriptions at ≤155 (`.claude/agents/seo-strategist.md:93`).
- **Verdict:** REQUIRED CHANGE (P2, T2 — desks own the copy).
- **Minimum correction:** add a Zod `.max(160)` on `description` for `news` and `deals` with a separate `standfirst` field; backfill the 65 entries.
- **Knock-on:** `src/content.config.ts`, the desk story templates, `tests/content/*`.

### S-05 — 14 routes have no inbound internal link

- **Anchor:** `seo-mechanical.json → inboundLinks`.
- **Evidence:** `/salary-transfer/{emirates-nbd,adib,liv,standard-chartered,cbd,citi,wio,al-hilal}/` (8 bank tracker pages — the tracker island links only banks with a live offer), `/deals/enbd-skywards-welcome-q2-2026/` and `/deals/etihad-fare-sale-july-2026/` (expired deals still built), `/cards/emirates-nbd-manchester-united/`, `/news/dubaipoints-newsroom-launch/` (1), `/design-spike/` (intentional, robots-disallowed), `/404.html`. A further 37 routes have ≤3 inbound links, among them all 15 `/salary-transfer/history/<bank>/` pages and the five `/cards/salary/<band>/` pages.
- **Verdict:** REQUIRED CHANGE (P1, T2) for the 8 tracker pages and the card; SETTLE for `/design-spike/` and `/404.html`; DECISION REQUIRED for expired deals (archive vs. keep as a dated record).
- **Minimum correction:** on `/salary-transfer/` render the "checked, no live offer" banks as links (they already appear as text in the coverage note); add the Manchester United card to the ENBD hub card list; add a "history" link per bank row.
- **Knock-on:** `src/components/islands/SalaryTransferTracker.tsx`, `src/pages/salary-transfer/index.astro` coverage note, `tests/content/salary-transfer-coverage.test.ts`.

### S-06 — Page-level schema is missing on 24 of 30 templates; the §9 spec and the shipped types disagree

- **Anchor:** `seo-mechanical.json → schemaByTemplate`, `templatesWithNoPageSchema`; emitter `src/components/seo/SchemaJsonLd.astro`.
- **Evidence:** only CardReview (`Product,FinancialProduct`), BankHub (`Organization,FinancialService`), AirlineProgram (`Product`), Article (`Article`/`NewsArticle`) emit a page-level entity plus `BreadcrumbList`. Directories, the tracker family (36 pages), calculators, compare, finder, trust pages and the homepage emit only the site-wide `WebSite` + `Organization`. `.council/01_editorial_standards.md §9` specifies `Article + Review` for card reviews, `Article + FAQPage` for guides, `Article + Offer` for deals and `Article` for programmes — none of which matches what ships. `Organization.sameAs` is `[]` (`src/layouts/BaseLayout.astro:63`).
- **Verdict:** DECISION REQUIRED (which spec is right — Technical Lead + SEO Strategist propose, Chairman ratifies) then REQUIRED CHANGE (P2, T3).
- **Minimum correction, no ruling needed:** `CollectionPage` + `BreadcrumbList` on directories; `BreadcrumbList` on the tracker family; fill `sameAs` with the publication's live profiles (or delete the empty key).
- **Knock-on:** `SchemaJsonLd.astro`, every layout, `tests/` (no schema test exists — add one that asserts type per template).

### S-07 — Eight GET search forms post their query to `/`, which ignores it

- **Anchor:** `src/layouts/NewsIndexLayout.astro:118`, `src/pages/deals/index.astro:78`, `src/pages/airlines/index.astro:66`, `src/pages/banks/index.astro:61`, `src/pages/guides/index.astro:71`.
- **Evidence:** `fragments.json → forms.warnings` (8 built pages). The `/search/` route takes `?q=` and works.
- **Verdict:** REQUIRED CHANGE (P1, T1 — five one-attribute edits).
- **Minimum correction:** `action="/search/"` and `name="q"` on each form.
- **Knock-on:** none; add the form check to `postbuild` once green (`scripts/ci/check-fragments.mjs` is opt-in in this PR).

### S-08 — One broken in-page anchor

- **Anchor:** `dist/cards/liv-cashback/index.html` → `#cashback-vs-cashback-plus`; source `src/content/cards/liv-cashback.mdx` (heading id differs from the JumpToSection entry).
- **Verdict:** REQUIRED CHANGE (P2, T1).
- **Minimum correction:** align the heading slug or the jump entry.
- **Knock-on:** none.

### S-09 — 18 broken external links, concentrated in four guides and the airline desk

- **Anchor:** `external-links.json → broken`.
- **Evidence:** 404s at `icp.gov.ae` golden-residency, `mof.gov.ae` corporate-tax legislation, `bankfab.com` elite-banking, `mashreqbank.com` wealth/gold (all in `guides/golden-visa-cards/` and `guides/uae-corporate-tax-overview/`), `rakbank.ae` salary-transfer (in `guides/salary-transfer-mechanics-2026/`); IHG member offer 403; five `emirates.com` and two `etihad.com` URLs time out from GitHub's egress (HEAD, 15 s); `aecb.gov.ae` does not resolve (two links in the AECB walkthrough); `mohre.gov.ae` connect timeout; CBD KFS PDF header overflow. Airline and government timeouts need a browser check before they are declared dead — they are listed under broken because the checker got no answer, not because it got a 404.
- **Verdict:** REQUIRED CHANGE (P1, T1 per link) for the six 404/403s; VERIFICATION HOLD for the eight timeouts and four network errors (workstation browser check).
- **Minimum correction:** per link, find the moved page or convert the citation to an archived reference; `aecb.gov.ae` likely moved to `aecb.gov.ae/en/` on a new host — verify.
- **Knock-on:** `lastVerified` on the four guides; the airline desk's source ladder for `emirates.com` press URLs.

### S-10 — 21 links cannot be verified from any runner (bot walls) and 3 redirect to a different host

- **Anchor:** `external-links.json → unverifiable, crossHostRedirects`.
- **Evidence:** ADCB (13 URLs, Cloudflare block), Al Hilal (2), CBD (2), Central Bank (3), Salik (1). Redirects: `buttondown.email → buttondown.com`, `adib.ae → adib.com`, `mydsf.ae → visitdubai.com/…/dsf`.
- **Verdict:** SETTLE for the redirects (update the hrefs at next touch, T1); VERIFICATION HOLD for the 21 — a human browser settles each host in a minute, and the Firecrawl monitors already fetch ADCB successfully, so the bank pages are almost certainly live.
- **Minimum correction:** update the three redirecting hrefs; record the five bot-walled hosts in `scripts/ci/check-external-links.mjs` docs as expected-unverifiable so the weekly run does not re-flag them.
- **Knock-on:** none.

## 3. Observations

### S-11 — dubaipoints.ae is absent from every money query tested; the brand query returns golf

- **Anchor:** `serp.json` (Firecrawl search ids `01a07ad0-…`, UAE location, 6 queries + `site:`).
- **Evidence:** no dubaipoints.ae result in the top 10 for "best cashback credit card uae", "salary transfer offer uae bank 2026", "emirates skywards credit card uae", "islamic credit card uae cashback sharia compliant", "credit card uae minimum salary 5000". UAE aggregators (`kredit.ae`, `masarif.ae`, `yallacompare.com`, `moneyluna.com`) hold those slots. "dubaipoints" returns Race to Dubai golf points. `site:dubaipoints.ae` returns 7 pages in Firecrawl's index. Two of the seven indexed titles were the pre-fix strings (S-01).
- **Verdict:** VERIFICATION HOLD — Firecrawl's index is not Google; confirm in Search Console before treating this as a ranking fact. If confirmed, this is the Growth & Analytics Lead's Q4 brief, not a mechanical fix.
- **Note:** the SERP for "salary transfer offer uae bank 2026" still ranks Al Hilal's ended campaign page first and shows a RAKBANK Islamic offer "until 30 September 2026" — the desk's 31 Aug "closes" story covered the conventional campaign only; queued for the Fact-Checker.

### S-12 — Single Open Graph image site-wide (known-open)

- **Anchor:** `dist/` grep — 198 of 199 pages carry `https://dubaipoints.ae/og-default.png`; `.council/research/2026-08/site-audit-2026-08-29.md §2 item 8`.
- **Verdict:** SETTLE as known-open; no new action this quarter. Manifest images could feed `ogImage` per template when the deferred item is scheduled.

### S-13 — No `hreflang`, English only; RSS `lastBuildDate` is 22 Aug on a 7 Sep build

- **Anchor:** `dist/index.html` (`lang="en"`, no `hreflang`); `dist/rss.xml` line 8.
- **Evidence:** the header carries an inert `EN · العربية` label (see master report, chrome group) with no Arabic route behind it. RSS has 41 items; `lastBuildDate` is the newest item's date rather than the build date, which is defensible but reads stale to a feed reader.
- **Verdict:** SETTLE for `hreflang` (no Arabic content exists; honest-nav says remove the label instead); REQUIRED CHANGE (P3, T1) for the RSS date if the feed is meant to signal liveness.

### S-14 — Robots and sitemap are consistent

- `robots.txt` disallows `/design-spike/`, `/style-guide/`, `/dev/`; none of those is in the sitemap; `/design-spike/` is still built (0 inbound). SETTLE.

## 4. Quarter plan (for the Managing Editor's ticket queue)

| # | Action | Owner | Tier | Sprint |
|---|---|---|---|---|
| 1 | Merge P0 hotfix; deploy | technical-lead | T2 | now |
| 2 | `action="/search/"` on 5 forms (S-07) | technical-lead | T1 | now |
| 3 | Salary-transfer title stamp from data (S-02) | business-realestate-editor + technical-lead | T2 | now |
| 4 | Fix 6 confirmed-dead external links (S-09) | section editors | T1 | now |
| 5 | Browser-verify 8 timeouts + 4 network + 21 bot-walled (S-09/S-10) | fact-checker (workstation) | — | next |
| 6 | Link the 8 no-offer tracker pages and the ENBD Manchester United card (S-05) | business-realestate-editor | T2 | next |
| 7 | `seoTitle` / description cap + backfill (S-03, S-04) | standards-editor + desks | T2 | next |
| 8 | Schema ruling + `CollectionPage`/`BreadcrumbList` rollout (S-06) | technical-lead + seo-strategist → chairman | T3 | later |
| 9 | Search Console read for S-11; Q4 growth brief | growth-analytics-lead | — | next |

## 5. Verdict

**FAIL on mechanical hygiene this quarter** — one P0 (production frozen
on a stale build), two P1 defects that mis-route or mis-stamp reader
surfaces (S-02, S-07), and 6 confirmed-dead citations. None is
structural; all but S-06 and S-11 are closable inside two sprints with the
bounded corrections above. Re-run `npm run audit:links:external`,
`npm run audit:links:fragments` and `npm run audit:static` after the fixes;
the numbers in §1 are the baseline.

— SEO Strategist lens, filed by the audit session, 7 September 2026.
