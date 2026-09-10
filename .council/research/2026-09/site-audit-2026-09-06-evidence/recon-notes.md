# Recon notes — established facts for the 2026-09-06 site audit (orchestrating session)

These are facts the orchestrating session verified directly. Cite them as `recon-notes.md §n`.

## 1. Build / deploy
- `npm run build` on main HEAD `d8743c7` (merged PR #343, 30 Aug 2026) FAILS on 6 Sep 2026: `Caught error rendering /salary-transfer: Error: Salary-transfer coverage classification has 14 banks; expected 15.` (`src/pages/salary-transfer/index.astro:51`, pre-fix line numbers).
- Cause: `src/content/salaryTransferOffers/rakbank-cash-reward-2026.mdx` has `validUntil: 2026-08-31`, `archived: false`; `getLiveOffers()` (`src/lib/offerAdapter.ts:42-48`) filters by `validUntil >= Date.now()`, so RAKBANK left the "tracked" set on 1 Sep while the page's hard-coded classification still expected it → the all-or-nothing assertion throws. Main has therefore been unbuildable and undeployable since 1 Sep 2026; the live site is the 30 Aug artefact.
- Hotfix applied on the audit branch: `src/lib/salaryTransferCoverage.ts` (pure `classifyCoverage` + `coverageGuardError`), `getLapsedUnarchivedOffers()` in `offerAdapter.ts`, tracker page renders a data-driven dated sentence for lapsed offers and warns at build; 5 unit tests in `tests/content/salary-transfer-coverage.test.ts`. RAKBANK offer still needs archiving by the business-realestate editor (content task, not done here).

## 2. Network / channels
- `https://dubaipoints.ae` is NOT reachable from the web session (`curl: (56) CONNECT tunnel failed, response 403`). Firecrawl reaches it; Firecrawl screenshot URLs (storage.googleapis.com) ARE downloadable from the session.
- Workflow sub-agents CAN call Firecrawl MCP tools (probe: scrape of /about/ returned 200, 1 credit, 14,313 chars markdown). This contradicts CLAUDE.md:460-466 ("MCP tools are available to the main session only; sub-agents ... do not inherit them") — a doc correction is due.
- `firecrawl_crawl` via MCP timed out at 60 s for a 220-page crawl (job continues server-side with no retrievable id); per-page `firecrawl_scrape` fan-out was used instead.
- Playwright 1.56.1 + pre-installed Chromium 141.0.7390.37 (build 1194) launch in-session with `--no-sandbox`; Google Fonts and the Cloudflare beacon are 403 from the sandbox.

## 3. Firecrawl account and monitors (see monitor/health.json)
- 42 monitors on the key; 37 belong to another project (AI-governance search monitors). Sum of API `estimatedCreditsPerMonth` = 20,920 vs the documented 5,000 Hobby plan. The 5 dubaipoints monitors alone estimate 2,590/month vs the 1,154 design estimate.
- automation-state `state.json` reports dubaipoints monitor credits: 3,704 in 2026-08, 693 in 2026-09 (to 6 Sep).
- fee-docs bills ≈99 actual vs 20 estimated per daily check; one check failed 4 Sep ("exceeded the running timeout"). product-pages and salary-transfer checks on 30 Aug carry `billingStatus: failed`.
- product-pages reports 36–45 of 55 pages "changed" every week; offers 4–9 of 12 daily — the judge `goal` is not suppressing dynamic-content noise.

## 4. Live homepage first look (Firecrawl scrape 01a07616-5401-702c-bb59-bc47d0e170f2, 1280×800)
- Header: Credit cards ▾ · Banks · Earn miles ▾ · Guides · Deals · News · [Search cards, guides…] · theme toggle · "JOIN BRIEF" button whose label wraps onto two lines at 1280 px.
- Quick-links strip: SALARY OFFERS · CARD DEALS · LATEST NEWS.
- Hero: "Fly further. Pay less." + featured read "Dubai Shopping Festival 2026: the card-stacking playbook · Guide · Updated 22 Aug"; note "The Friday brief is preparing for launch — sign-up is by email until the automated list opens."; stat line "57 CARDS · 15 BANKS | AED-FIRST | NO PAID PLACEMENTS".
- Firecrawl `branding` extraction of the homepage: primary #8FD3B3, secondary #241C0A, accent #235F46, link #235F46, background #FBFAF6, textPrimary #1F2328; fonts DM Sans (body) / Fraunces (heading); h1 71.68px, h2 40px, body 17px; buttons pill radius 999px; primary button bg #1F2328. Charter palette is navy (#1f3a4d family) + gold (#b8842a); `src/styles/global.css` also defines `--mint #5fb88a` / `--mint-soft #e6f1ea`.

## 5. Firecrawl `site:dubaipoints.ae` search (2 credits)
- Only 7 results in Firecrawl's index. Titles seen: "Mashreq salary transfer offer (August 2026) - DubaiPoints" (hyphen separator, month stamp), others use " | DubaiPoints". Salary-transfer snippet shows the tracker table rendering "AED4,000" with no space (Standards kill-list #10 format).

## 6. Route sets (live map vs built dist before hotfix)
- Firecrawl map: 199 paths (incl. /friday-brief redirect). dist on main HEAD: 191 (partial build). In map but not dist: /, /friday-brief/, /salary-transfer/, /search/, /team/, /tip/, /topics/, /valuations/, /valuations/methodology/ (all downstream of the build failure). In dist but not map: /design-spike/ (pruned only by postbuild).

## 7. SkyNet vault
- `SkyNet/dubaipoints/status.md` last updated 2026-08-15 by ChatGPT: says PR #323 milestone unverified; repo is at merged PR #343. `_INDEX.md` (2026-09-05) still says "PR #323 milestone recorded from memory".
