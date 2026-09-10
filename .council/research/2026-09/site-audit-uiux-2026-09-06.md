---
title: Site-wide UI/UX, links and SEO audit — 6–7 September 2026
type: audit (Head of UX quarterly + SEO quarterly + A1 link audit, combined)
filed: 2026-09-07
session: .council/sessions/2026-09-06-site-audit-uiux.md
synthesis: .council/sessions/2026-09-06-site-audit-uiux-synthesis.md
evidence: .council/research/2026-09/site-audit-2026-09-06-evidence/
companions: .council/audits/2026-09-06-link-audit.md · .council/seo/audit-2026-Q3.md
harness: scripts/audit/README.md (npm run audit:all)
commit-audited: b242105 (source) · production as deployed 30 Aug 2026 (live captures 6–7 Sep)
findings: 72 (46 defects · 26 observations) — P0 2 · P1 21 · P2 30 · P3 19
verdicts: REQUIRED CHANGE 40 · DECISION REQUIRED 12 · VERIFICATION HOLD 2 · SETTLE 18
verdict: FAIL — two P0 defects live; site otherwise structurally sound (see §13)
---

# Site-wide UI/UX, links and SEO audit — 2026-09-06

**Chairman's brief (in-session, 6 Sep 2026):** "full audit including main links and sublinks … identify where we can improve especially on the UI/UX side … utilise all capabilities … use all of the latest tools in Firecrawl." Scope decisions taken in-session: report plus a committed, reproducible probe harness; no content or chrome changes in the PR except the flagged P0 hotfix; Firecrawl ceiling 1,000 credits; self-monitor proposed, not created; benchmark sets moneyluna/HfP/TPG and a UAE set.

**How to read this file.** §1 is the verdict and the ten numbers that matter. §2 is what was examined and how, including what could not be done. §3 lists **defects** (something is wrong) and §4 lists **observations** (a pattern or an opportunity) — they never mix. Every finding carries one exact anchor, a verdict category — **SETTLE** (accept, no action) / **REQUIRED CHANGE** (bounded fix, owner named) / **VERIFICATION HOLD** (a fact or a workstation check is needed first) / **DECISION REQUIRED** (Chairman ruling; never defaulted here) — the minimum bounded correction, and a knock-on register. §5 scores every template on the Head of UX rubric. §6–§9 are the mechanical layers (performance, accessibility, links, SEO, Firecrawl). §10 frames the Chairman's decisions, §11 is the ranked backlog, §12 the status of the 29 August deferred queue, §13 the binary verdict, and the appendix records deviations and the anchor spot-check.

## 1. Verdict and headline numbers

**FAIL.** Two P0 defects were live throughout the audit window: main has not built since 1 September, so production is the 30 August artefact (F-001), and that artefact tells readers a salary-transfer offer that ended 31 August is live — on the tracker, the homepage and the calculator (F-002). The hotfix for F-001 is in PR #348, flagged separately; F-002 is an editor's archive action that the hotfix only warns about. Below the P0s the site is structurally sound — zero broken internal links across 14,024, no page-level horizontal overflow at any width, one h1 per page, reduced motion honoured, a real 404 — and the defects cluster in four places: **contrast** (both themes), **keyboard access** to the menu, **mobile density** on the flagship tracker, and **navigation honesty** in the chrome.

| Measure | Value | Where |
|---|---|---|
| Routes examined (built · live) | 199 · 201 captures | probes-summary.json · crawl-index.json |
| Widths | 360 / 390 / 768 / 1024 / 1280 / 1440, light + dark | render-probe |
| Findings | 72 — 46 defects, 26 observations | findings.json |
| P0 / P1 / P2 / P3 | 2 / 21 / 30 / 19 | findings.json |
| Internal links checked / broken | 14,024 / 0 | internal-links.json |
| In-page anchors checked / broken | 576 / 1 | fragments.json |
| External URLs / broken / unverifiable / cross-host | 150 / 18 / 21 / 3 | external-links.json |
| axe colour-contrast failures (routes: light / dark) | 83 / 87 (346 / 510 nodes) | probes-summary.json |
| Hamburger keyboard-operable | 0 of 199 routes | probes-summary.json → menu |
| Above-fold bytes over 200 KB budget | 156 of 199 routes (median 415 KB) | probes-summary.json |
| Lighthouse mobile performance < 95 | 12 of 20 sampled routes | lighthouse.json |
| Titles > 60 chars · descriptions > 155 | 121 · 65 | seo-mechanical.json |
| Routes with zero inbound links | 14 | seo-mechanical.json |
| Chrome links inventoried · mystery labels · cut list | 232 · 12 · 10 | nav-a1.json |
| Firecrawl credits used | 486 of 1000 | credits-log.json |

## 2. Scope, method and what could not be done

**Source of truth.** Two states were audited and they differ: the **source** at commit `b242105` (this branch, which carries the P0 hotfix) built locally into `dist/`, and **production** as deployed on 30 August, captured live through Firecrawl on 6–7 September. Where a defect is already fixed in source but still live, the finding says so.

**Local layer (free, reproducible — `npm run audit:all`).** Playwright 1.56.1 on Chromium 141 rendered every built route at six widths in both themes, recording overflow and offenders, heading structure, image attributes, link text, tap targets (44 px and the WCAG 2.2 24 px floor), a Tab-walk focus-visibility check, the hamburger keyboard probe, console and network errors, LCP / CLS / DOM / bytes, fonts, reduced-motion animation counts and axe-core 4.13 (WCAG 2.x A/AA + best-practice; contrast in dark). Lighthouse 13.4 ran mobile + desktop on 20 template representatives against the Technical Lead budget (mobile ≥ 95, above-fold ≤ 200 KB); the local server is uncompressed so byte and LCP figures are pessimistic relative to Cloudflare Pages. Internal links (`check-links`), in-page anchors and form actions (`check-fragments`), `_redirects`, the absent `_headers`, and sitemap-vs-build were validated offline. The external-link sweep ran in GitHub Actions (run 34098558459) because the session's egress allowlist blocks nearly every issuer host.

**Live layer (Firecrawl, 486 credits).** `map` (197 URLs), chunked `crawl` for markdown/links/summary of 201 pages, full-page mobile screenshots of every page plus 34 desktop template captures, `branding` on four templates, `search` with UAE location for six money queries plus `site:`, `changeTracking` and `query` (direct quotes only — no LLM-extracted numerics, §6) on the homepage and valuations, five `interact` sessions (search, dark-mode, salary calculator, card finder, compare; the mobile-nav session timed out three times and is covered by the local keyboard probe), two `agent` benchmark jobs (pattern reference only, per the 29 Aug §3 ruling), monitor list/check reads, and `developer_search` for the headers baseline. `parse`, `research_*` and audio have no application here.

**Council layer — deviation recorded.** The plan convened the Council as a Workflow (12 page groups × 3 specialist lenses, cross-cutting passes, three-lens verification, dry rounds, synthesis). It failed three times on the account session limit (14:30 and 21:20 UTC on 6 Sep; 12:30 UTC on 7 Sep), and the runtime ran at most two agents concurrently, so a clean run would have taken five to six hours. Two finders completed before the last cut — **Homepage × standards-editor** (15 findings) and **Homepage × head-of-ux** (14 findings + the rubric score) — and are merged verbatim, credited on each finding. Every other lens was applied by the audit session directly from the evidence files, with the lens named on the finding. Two Council agents were then run one at a time on the finished findings list: the **Managing Editor** (ranking, sprints, knock-on register — §11) and the **Chairman** (decision questions and the publish gate — §10). Loop-until-dry rounds did not run. Verification was by anchor: every anchor below was opened before filing and ten were re-checked at random after (Appendix B).

**Not possible from the session.** dubaipoints.ae, the Cloudflare preview and most issuer hosts are unreachable from the web sandbox (403 CONNECT); Search Console is not connected, so SERP presence is a proxy (Firecrawl's index) and is held at VERIFICATION HOLD; Google Fonts and the analytics beacon were blocked during local probes (`externalMode: block`), which under-counts fonts but does not affect layout metrics.

## 3. Defects (46)

Ordered by severity, then by the order the evidence surfaced them. A defect is something that is wrong on the page, in the data, or in the record.

### F-001 — Main has been unbuildable since 1 September; production is the 30 August artefact

- **Severity · tier · owner:** P0 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `*`
- **Anchor:** src/pages/salary-transfer/index.astro (coverage guard, pre-hotfix) · live-probes.json → changeTracking-root
- **Evidence:** Build on main HEAD fails: `Salary-transfer coverage classification has 14 banks; expected 15` — the RAKBANK offer (validUntil 2026-08-31, never archived) dropped out of getLiveOffers(). Firecrawl changeTracking on the homepage reports `same` between 6 Sep 16:35 and 7 Sep 07:4x UTC; live titles still carry strings fixed in source on 30 Aug.
- **Impact:** Every fix in this audit is unreachable by readers until a deploy succeeds; the site has served a lapsed offer as live for a week.
- **Verdict:** **REQUIRED CHANGE** (fixed in PR #348 (flagged P0 hotfix)) · sprint: now
- **Minimum bounded correction:** Merge the hotfix already on this branch (src/lib/salaryTransferCoverage.ts, getLapsedUnarchivedOffers(), 5 tests); then archive the RAKBANK offer (editor task, see next finding).
- **Knock-on register:** Cloudflare Pages deploy; every other finding

### F-002 — RAKBANK salary-transfer offer (ended 31 Aug) still shown as live on the tracker, the homepage live desk and the calculator

- **Severity · tier · owner:** P0 · T1 · `business-realestate-editor` — lens: fact-checker (audit session); confidence high
- **Routes:** `/salary-transfer/`, `/`, `/salary-transfer/calculator/`, `/salary-transfer/rakbank/`
- **Anchor:** interact-log.md → salary-calculator ("#2RAKBANK — Salary Transfer Cash Reward (July–August 2026)") · live-probes.json root-markdown :35-36 · src/content/salaryTransferOffers/
- **Evidence:** On 7 Sep the production calculator ranks the July–August RAKBANK offer second for a 12,000 salary; the homepage live desk lists 'RAKBANK up to AED 4,000 cash · 4 bands' as live. The offer's own validUntil is 2026-08-31.
- **Impact:** A reader transferring a salary on the strength of the tracker earns nothing — the exact failure the 22 Aug Al Hilal story criticised in a bank.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Move the RAKBANK entry from salaryTransferOffers to salaryTransferOfferHistory with archived: true and archivedReason 'campaign ended 31 Aug 2026'; the hotfix already renders a dated 'ended' sentence and warns at build until this is done.
- **Knock-on register:** tests/content/salary-transfer-coverage.test.ts; homepage live desk row; /salary-transfer/history/rakbank/

### F-003 — Dark mode: the article newsletter rail is white text on light navy (1.8–2.2:1) across 44 routes

- **Severity · tier · owner:** P1 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/guides/*`, `/news/*`, `/deals/*`
- **Anchor:** src/styles/global.css:2535-2570 (.dp-aside-newsletter uses background: var(--green)) · :3684 (dark --green: #8fb3cc)
- **Evidence:** axe color-contrast, dark theme: `.dp-aside-newsletter > .dp-rail-heading` #ffffff on #8fb3cc = 2.21:1; `> p` 2.03:1; `> .eyebrow` 1.84:1 — 44 routes, 132 nodes. The same token drives `.cta` on /airlines/ (51 nodes, 2.21:1) and `.eyebrow` on 7 routes.
- **Impact:** WCAG 2.2 AA 1.4.3 failure on every long-form page for dark-mode readers; the block is the newsletter conversion path.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** In the dark override block give the rail its own surface: `[data-theme="dark"] .dp-aside-newsletter { background: #1f3a4d; }` (brand navy, inside the permitted family) and keep text white; audit the other `background: var(--green)` call sites (`grep -n 'background: var(--green)' src/styles/global.css`).
- **Knock-on register:** ArticleLayout.astro:274 aside; /airlines/ directory .cta; dark-mode fold screenshots in audit-output/render/screens/*/dark-*

### F-004 — Light mode: small gold and muted labels fall below 4.5:1 on 83 routes (346 nodes)

- **Severity · tier · owner:** P1 · T2 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `/cards/*`, `/banks/*`, `/airlines/*`
- **Anchor:** probes-summary.json axeLight color-contrast · src/components/cards/AEDValueBreakdown.astro (dpvb-* muted #72818b) · src/styles/global.css (.eyebrow, .dp-bank-callout .label, .dp-expiry-block .label, .dp-bank-card-cta)
- **Evidence:** `.eyebrow` #b8842a on #f8f5ee at 11px = 3.02:1 (44 card reviews); `.dp-bank-callout > .label` #b8842a on #f3ead6 = 2.75:1 (15 hubs); `.dp-expiry-block > .label` 3.21:1 at 10px (6 programme pages); AEDValueBreakdown `.dpvb-axis span`, `.dpvb-eyebrow`, `.dpvb-bluf-label`, `.dpvb-bar-gross`, `.unit`, `.kind` #72818b on #faf6ef = 3.72:1 (11 cashback reviews, 5 selectors each); `.dp-bank-card-cta` #83919a on #fdfcf8 = 3.15:1 (15 hubs).
- **Impact:** Eyebrows and value-bar axes are the scanning layer the five-second test depends on; at 10–11px they are the first thing a low-vision reader loses.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Introduce a text-weight gold token (`--gold-ink: #8a6118`, ≥ 4.6:1 on paper) for labels ≤ 14px and keep `--gold` for chips, rules and the Verified badge; raise the muted-text token used by AEDValueBreakdown and `.dp-bank-card-cta` to `--ink-soft` (#5f6d77-class). Two-token change, no layout change.
- **Knock-on register:** Charter two-accent rule (gold keeps one job: trust signal; the ink variant is a shade, not a new hue); dark theme equivalents; tests: none exist — add an axe contrast assertion to tests/audit/

### F-005 — AED value-breakdown bars use two colours outside the navy/gold families (#3f9068 green, #b46a55 terracotta)

- **Severity · tier · owner:** P1 · T2 · `head-of-ux` — lens: charter-conformance (audit session); confidence high
- **Routes:** `/cards/adcb-365-cashback/`, `/cards/*cashback*`, `/cards/cbd-one/`, `/cards/rakbank-world/`, `/cards/sc-platinum-x/`
- **Anchor:** src/components/cards/AEDValueBreakdown.astro:239 (--dpvb-seg-2: #3f9068) · :243 (--dpvb-fee: #b46a55) · CLAUDE.md amendment 2026-07-25 §2
- **Evidence:** The no-third-hue rule (25 Jul 2026) says every accent in every theme derives from navy #1f3a4d or gold #b8842a and that any other colour needs an explicit Chairman ruling before merge. No ruling is logged for these two; both also fail contrast with their white value labels (3.88:1 and 4.09:1 — `.s-val`). The component appears on 11 cashback reviews.
- **Impact:** Charter conformance; also the only place on the site where a third and fourth hue appear.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: now
- **Minimum bounded correction:** Map segment 2 to a navy tint (`#5b7d93`) and the fee bar to `--ink-soft` with a diagonal hatch (keeps the polarity without a hue); or obtain the Chairman ruling that the value bar is an exempted data-visualisation palette and log it under Amendments.
- **Knock-on register:** legend copy in AEDValueBreakdown.astro; dark theme rule for the same component; branding extraction baseline (branding-summary.md)

### F-006 — Live branding extraction resolves the site's primary to mint (#8FD3B3) and green (#235F46) from the tracker block

- **Severity · tier · owner:** P1 · T2 · `head-of-ux` — lens: charter-conformance (audit session); confidence high
- **Routes:** `/salary-transfer/`, `/salary-transfer/*`
- **Anchor:** branding-summary.md · src/styles/global.css:292, :324, :431 (.dpst block) · light --mint #5fb88a
- **Evidence:** Firecrawl branding on four live pages returns primary #8FD3B3 / accent #235F46 for the tracker family; both trace to the `.dpst` tracker styles rather than the ratified navy/gold tokens. Light theme still declares `--mint: #5fb88a` and dark `--mint: #8fb3cc` (global.css:3686 — already navy-derived).
- **Impact:** The most-linked product on the site is the one page that reads off-brand to an automated brand extractor and to a reader arriving from the homepage.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: now
- **Minimum bounded correction:** Retire `--mint` in the light theme in favour of a navy tint (the dark theme already did this on 25 Jul), and restyle the `.dpst` status chips to navy/gold so the tracker reads as the same publication as the rest of the site.
- **Knock-on register:** SalaryTransferTracker.tsx chip classes; homepage live-desk mirror styles (global.css:1325-1368)

### F-007 — Mobile hamburger is focusable but not keyboard-operable on all 199 routes

- **Severity · tier · owner:** P1 · T2 · `technical-lead` — lens: head-of-ux (audit session + Council finder: head-of-ux); confidence high
- **Routes:** `*`
- **Anchor:** src/components/Header.astro:131 (label[for=dp-nav-toggle] role=button tabindex=0) · probes-summary.json menu {enterOpens:false, spaceOpens:false, escapeCloses:false} ×199
- **Evidence:** The CSS-only menu is a <label> for a hidden checkbox; Enter and Space do nothing (labels do not activate on keydown), Escape does not close. The Firecrawl form census also exposes the three accordion checkboxes as unlabeled controls ('Cards ▾', 'Points + Miles ▾', 'Travel ▾').
- **Impact:** Keyboard and switch users cannot open site navigation on a phone-width viewport.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Add an 8-line inline script: on keydown Enter/Space on `label[for="dp-nav-toggle"]` → preventDefault, toggle the checkbox, mirror `aria-expanded`; on Escape → uncheck and refocus the label. Give the accordion inputs `aria-hidden="true" tabindex="-1"` like the nav toggle.
- **Knock-on register:** tests/nav/header.test.ts; interact-log.md mobile-nav (re-run after fix)

### F-008 — Tracker rows carry aria-expanded on role=row inside a table (axe aria-conditional-attr, serious) on 6 routes

- **Severity · tier · owner:** P1 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/salary-transfer/`, `/salary-transfer/aed-*`
- **Anchor:** src/components/islands/SalaryTransferTracker.tsx:417, :537 · probes-summary.json axeLight aria-conditional-attr (29 nodes)
- **Evidence:** `.dpst-row` sets aria-expanded; the attribute is valid on treegrid rows, not table rows, so screen readers ignore or mis-announce the expandable state.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Move `aria-expanded={isOpen}` (and `aria-controls`) onto the toggle <button> inside the row; leave the <tr> without it.
- **Knock-on register:** tracker keyboard test (none exists); band pages inherit the island

### F-009 — Directory templates nest a second <main> inside the page main (landmark violations on 8–10 routes)

- **Severity · tier · owner:** P1 · T1 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/airlines/`, `/banks/`, `/deals/`, `/guides/`, `/news/`, `/news/airlines/`, `/news/banking/`, `/news/hotels/`
- **Anchor:** src/layouts/NewsIndexLayout.astro:142 · src/pages/airlines/index.astro:87 · banks/index.astro:82 · deals/index.astro:99 · guides/index.astro:93 (<main class="intel-main">)
- **Evidence:** axe: landmark-no-duplicate-main (8 routes), landmark-main-is-top-level (8), landmark-unique (10). BaseLayout already renders <main class="dp-main">.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Change `<main class="intel-main">` to `<div class="intel-main">` in the five files (CSS targets the class, not the element).
- **Knock-on register:** none — five one-word edits

### F-010 — Above-fold bytes exceed the 200 KB budget on 156 of 199 routes; mobile performance 76–82 on the templates that carry hero photography

- **Severity · tier · owner:** P1 · T3 · `technical-lead` — lens: technical-lead (audit session + Council finder: head-of-ux); confidence high
- **Routes:** `/`, `/guides/`, `/news/*`, `/airlines/*`, `/banks/*`, `/calculator/`
- **Anchor:** lighthouse.md (20 routes) · probes-summary.json metrics.aboveFoldBytes (median 425 KB, max 2.9 MB on /deals/etihad-fare-sale-july-2026/) · src/pages/index.astro:368 (hero img: sizes but no srcset)
- **Evidence:** Lighthouse mobile (uncompressed local serve, so pessimistic): / 77, /guides/ 76, /news/<story> 77, /airlines/accor-all/ 78, /banks/adcb/ 81, /news/ 82, /calculator/ 82 against the Technical Lead budget of ≥ 95. LCP element is the hero image (`img.article-hero-image` 37 routes, `img.dp-hub-hero` 21); the homepage hero is an 1,880px/380 KB JPEG in a 342px slot. Desktop scores 96–100 throughout; text-only templates (tracker, history, compare, trust) meet budget on both presets.
- **Impact:** Mobile is the primary audience (Charter); LCP 3–6.6 s locally on story and hub pages.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Generate 640/960/1280 derivatives for every manifest hero (`data/stock/manifest.json` is already the single registry) and emit `srcset` + `sizes` from StockImage.astro; `fetchpriority="high"` on the LCP image only, `loading="lazy"` on everything else. Re-run `npm run audit:lighthouse --base https://dubaipoints.ae` from Actions for the compressed truth.
- **Knock-on register:** StockImage.astro; fetch-stock.ts (write derivatives at seed time); tests/images/*; og image per page (known-open) can reuse the derivatives

### F-011 — Header quick-link 'Card deals' goes to the card-review index, not the deals desk

- **Severity · tier · owner:** P1 · T1 · `standards-editor` — lens: standards-editor (audit session + Council finder: standards-editor + Council finder: head-of-ux); confidence high
- **Routes:** `*`
- **Anchor:** src/components/Header.astro:242 (<a href="/cards/" class="dp-quicklink">Card deals</a>)
- **Evidence:** The tracker strip's three quick links read Salary offers · Card deals · Latest news; the middle one lands on /cards/ (57 reviews) while /deals/ exists. Both completed Council finders flagged it independently.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Change the href to `/deals/` — or, if the card index is intended, relabel to 'Cards'.
- **Alternative wordings:** “Card deals → /deals/” / “Cards → /cards/”

### F-012 — Primary chrome CTA 'Join brief' (header, first mobile-overlay row, footer, homepage band) lands on a page that says the brief has not launched

- **Severity · tier · owner:** P1 · T2 · `growth-analytics-lead` — lens: growth-analytics-lead (audit session + Council finder: standards-editor); confidence high
- **Routes:** `/newsletter/`, `*`
- **Anchor:** src/components/Header.astro:224 · live/pages/newsletter.md ("The Friday brief is preparing for launch… Join the launch list while automated sign-up is being configured") · src/components/NewsletterSignup.astro:40-46 (mailto fallback)
- **Evidence:** Live on 7 Sep: the only always-visible call to action on the site promises a newsletter; the destination offers a mailto with a subject line. The copy gate (`PUBLIC_BUTTONDOWN_USERNAME`, 29 Aug) works, but the CTA label does not follow the gate.
- **Impact:** Honest-nav (27 Jul 2026): chrome may only promise content types that exist.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: now
- **Minimum bounded correction:** Until Buttondown is configured: gate the CTA label on the same env var — 'Join brief' when live, 'Launch list' (or hide the pill) when not — and underline the fallback mailto (1.33:1 link-in-text-block, see Council finding). Decision for the Chairman: launch the list now, or demote the CTA until it exists.
- **Alternative wordings:** “Launch list” / “Newsletter”
- **Knock-on register:** Header.astro:224; Footer.astro brand CTA; index.astro:352-357 hero micro block (Council: delete); NewsletterSignup.astro

### F-013 — 14 routes have no inbound internal link; 37 more have three or fewer

- **Severity · tier · owner:** P1 · T2 · `business-realestate-editor` — lens: seo-strategist (audit session); confidence high
- **Routes:** `/salary-transfer/emirates-nbd/`, `/salary-transfer/adib/`, `/salary-transfer/liv/`, `/salary-transfer/standard-chartered/`, `/salary-transfer/cbd/`, `/salary-transfer/citi/`, `/salary-transfer/wio/`, `/salary-transfer/al-hilal/`, `/cards/emirates-nbd-manchester-united/`, `/deals/enbd-skywards-welcome-q2-2026/`, `/deals/etihad-fare-sale-july-2026/`, `/news/dubaipoints-newsroom-launch/`
- **Anchor:** seo-mechanical.json → inboundLinks · src/components/islands/SalaryTransferTracker.tsx:424,495 (links only offers with a live row) · src/pages/salary-transfer/index.astro:142
- **Evidence:** Eight bank tracker pages are unreachable because the tracker links only banks with a live offer; the Manchester United card is missing from the ENBD hub card list; two expired deals are still built but delisted; all 15 history pages and the five salary-band pages have a single inbound link each.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Render the 'checked, no live offer' banks in the coverage note as links; add the missing card to the ENBD hub; add a per-row 'History' link in the tracker; decide whether expired deals are archived (301 to /deals/) or kept as dated records with an 'Ended' banner.
- **Knock-on register:** tests/content/salary-transfer-coverage.test.ts; check-links sweep count

### F-014 — Salary-transfer bank pages, the cards index and the comparison pages stamp the build month into titles and headings, not a verification date

- **Severity · tier · owner:** P1 · T2 · `business-realestate-editor` — lens: seo-strategist (audit session); confidence high
- **Routes:** `/salary-transfer/<bank>/ (15)`
- **Anchor:** src/pages/salary-transfer/[slug].astro:74 · src/pages/cards/index.astro:124 · cards/cashback.astro:39-40 · cards/miles.astro:34 (+ islamic, salary bands) — all `new Date().toLocaleDateString(...)`; contrast src/pages/cards/[slug].astro:53-57 (`verifiedStamp` from lastVerified)
- **Evidence:** Fifteen tracker titles and the nine cards-directory/comparison titles (and their visible h1s) read '(September 2026)' on a 7 Sep build — including RAKBANK whose offer ended 31 Aug and comparison tables whose newest row was verified 22 Aug. The card-review pattern derives the same stamp from lastVerified; the SERP already shows the mismatch (live 'Mashreq salary transfer offer (August 2026)').
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Derive the stamp from data: the offer's lastVerified on tracker pages, the newest card lastVerified on directory/comparison pages; drop the parenthetical when no live offer exists.
- **Knock-on register:** tests/content/salary-transfer-coverage.test.ts (title assertion); ComparisonTableLayout heading prop; SERP snippets

### F-015 — Eight directory search forms post their query to '/', which ignores it

- **Severity · tier · owner:** P1 · T1 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/airlines/`, `/banks/`, `/deals/`, `/guides/`, `/news/`, `/news/airlines/`, `/news/banking/`, `/news/hotels/`
- **Anchor:** src/layouts/NewsIndexLayout.astro:118 · src/pages/deals/index.astro:78 · airlines/index.astro:66 · banks/index.astro:61 · guides/index.astro:71 (action="/" method="get") · fragments.json forms.warnings
- **Evidence:** Submitting the in-page search on any directory reloads the homepage with `?q=` in the URL and no results. /search/?q= works.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** `action="/search/"` and `name="q"` on the five forms (five one-attribute edits); then add `check-fragments` to postbuild.
- **Knock-on register:** scripts/ci/check-fragments.mjs wired into postbuild once green

### F-016 — 18 external citations return 4xx or no answer; 21 more cannot be verified from any runner; 3 redirect to another host

- **Severity · tier · owner:** P1 · T1 · `fact-checker` — lens: fact-checker (audit session); confidence high
- **Routes:** `/guides/golden-visa-cards/`, `/guides/uae-corporate-tax-overview/`, `/guides/salary-transfer-mechanics-2026/`, `/guides/aecb-credit-report-walkthrough/`, `/guides/choosing-first-uae-bank/`, `/news/*skywards*`, `/airlines/etihad-guest/`, `/cards/cbd-one/`
- **Anchor:** external-links.json (Actions run 34098558459)
- **Evidence:** Confirmed dead: icp.gov.ae golden-residency (404), mof.gov.ae corporate-tax-legislation (404), bankfab.com elite-banking (404), mashreqbank.com wealth/gold (404), rakbank.ae salary-transfer (404), ihg.com member offer (403). No answer: five emirates.com and two etihad.com URLs (HEAD timeout), malloftheemirates.com, mohre.gov.ae (connect timeout), aecb.gov.ae (does not resolve, two links), CBD KFS PDF (header overflow). Bot-walled: ADCB ×13, Central Bank ×3, Al Hilal ×2, CBD ×2, Salik. Redirects: buttondown.email→.com, adib.ae→adib.com, mydsf.ae→visitdubai.com.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Six 404/403s: find the moved page or convert to an archived citation (T1 each). Timeouts and network errors: workstation browser check before declaring dead (VERIFICATION HOLD). Update the three redirecting hrefs at next touch.
- **Knock-on register:** lastVerified on the four guides; airline desk source ladder for emirates.com press URLs; scripts/ci/check-external-links.mjs expected-unverifiable host list

### F-017 — News index still leads with stories whose windows closed 31 August, written in the future tense

- **Severity · tier · owner:** P1 · T1 · `airline-news-editor` — lens: airline-news-editor (audit session); confidence high
- **Routes:** `/news/`, `/news/hotels/`, `/news/airlines/`
- **Anchor:** live/pages/news.md:136-138 ("IHG's pick-your-points promotion ends 31 August — nine days to register") · .council/research/2026-08/site-audit-2026-08-29.md §2 item 2
- **Evidence:** On 7 Sep the live index presents 'nine days to register' for a promotion that ended a week ago; the Skywards Season of Rewards 'final week' story is in the same state. The expiry sweep cannot deploy because main does not build (P0).
- **Verdict:** **REQUIRED CHANGE** (known-open — 2026-08-29 §2 item 2) · sprint: now
- **Minimum bounded correction:** Desks bump or archive the four 31-Aug stories (staleAfter already set); the fix reaches readers only after the P0 deploy.
- **Knock-on register:** hotel-news-editor (IHG story); news-expiry workflow

### F-018 — Valuations table: three of seven columns are dashes on every row; the Q3 methodology promise expires 30 September; baselines cross 90 days on 8 September

- **Severity · tier · owner:** P1 · T3 · `fact-checker` — lens: fact-checker (audit session); confidence high
- **Routes:** `/valuations/`, `/valuations/methodology/`
- **Anchor:** live/pages/valuations.md:126-130 · live-probes.json query-valuations ("Baselines confirmed: 10 June 2026"; "Floor/ceiling ranges land with the methodology page, Q3 2026") · .council/research/2026-08/site-audit-2026-08-29.md §2 item 1
- **Evidence:** Known-open since 29 Aug; the dates now make it urgent: the public commitment has 23 days left and the site's own 90-day freshness rule trips tomorrow.
- **Verdict:** **DECISION REQUIRED** (known-open — 2026-08-29 §2 item 1) · sprint: now
- **Minimum bounded correction:** Either land floor/ceiling for the ten programmes this month or cut the three columns and re-date the promise. Fact-Checker + Chairman.

### F-019 — Tracker page at 390px: a 15-line 'Coverage status' paragraph sits between the page head and the table

- **Severity · tier · owner:** P1 · T2 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `/salary-transfer/`
- **Anchor:** audit-output/render/screens/salary-transfer/light-390-fold.png · src/pages/salary-transfer/index.astro (coverage note block, gold callout) · live/screens/salary-transfer-mobile-full.png
- **Evidence:** At 390×844 the reader sees the h1, a four-line intro, two stat lines and then a gold callout of prose naming eight banks and their non-qualifying campaigns; the tracker table — the product — starts below the fold. The five-second test fails at this width (what: yes; verdict/next action: not visible). The hotfix in this PR adds a further dated sentence per lapsed offer to the same block.
- **Impact:** The most-linked product page fails the publication's own scannability rule on the primary device.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Render the coverage note as a collapsed `<details>` with the summary 'Coverage: 5 of 15 banks have a live offer — why the others are not listed', placed after the table on ≤ 768px and in the rail on desktop; keep the prose verbatim inside.
- **Knock-on register:** src/pages/salary-transfer/index.astro coverage block (hotfix sentence lives here); band pages ([slug].astro) reuse the note

### F-020 — Firecrawl key carries 42 monitors with an API-estimated 20,920 credits/month against a documented 5,000-credit Hobby plan; the fee-docs monitor bills ≈5× its estimate

- **Severity · tier · owner:** P1 · T3 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `ops`
- **Anchor:** monitor-health.json (account.sumEstimatedCreditsPerMonth 20920; dubaipoints 2590; fee-docs actualCredits 99/day vs 20 estimated; 2026-08-30 product-pages billingStatus failed) · origin/automation-state data/monitor/state.json (3,704 credits in Aug)
- **Evidence:** 37 of the 42 monitors belong to other projects on the same key. The five dubaipoints monitors alone exceed the design estimate of 1,154/month by 2.2×; fee-docs bills per PDF page (the risk setup.mjs names). A failed billing status on 30 Aug means checks may silently stop.
- **Verdict:** **VERIFICATION HOLD** (new) · sprint: now
- **Minimum bounded correction:** Verification hold: confirm the plan tier and whose monitors the other 37 are. Then either upgrade or (a) drop fee-docs to weekly, (b) split PDFs into their own monitor with a page cap, (c) raise MAX_ESTIMATED_CREDITS only after the numbers are known.
- **Knock-on register:** CLAUDE.md §Monitoring budget paragraph; scripts/monitor/setup.mjs MAX_ESTIMATED_CREDITS; monitor.yml alerting on billingStatus

### F-021 — "Welcome-bonus calculator" tile sends readers to a spend-ROI calculator that states it does not score welcome bonuses

- **Severity · tier · owner:** P1 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:422
- **Evidence:** index.astro:422-423: `<span class="title">Welcome-bonus calculator</span>` / `<span class="go">See which welcome offer pays back first</span>`, href="/calculator/"; repeated in the strategy panel at :272-275 ("See which welcome offer pays back first" / "Welcome-bonus calculator →"). The destination's live <title> is "UAE credit-card spend-ROI calculator | DubaiPoints" (calculator.meta.json:5), its h1 is "Which UAE card pays you back the most on your spend?" (calculator.md:114) and its methodology says verbatim: "We do not score welcome bonuses." (calculator.md:274).
- **Impact:** The label promises the one function the tool disclaims; a reader arriving for welcome-offer break-even finds a spend calculator and leaves.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Relabel :422 to "Spend-return calculator" and :423 to "See which card pays back most on your monthly spend"; apply the same two strings at :274-275. A welcome-offer break-even tool, if wanted, is a new brief.
- **Alternative wordings:** “Spend-return calculator — See which card pays back most on your monthly spend (longer-formal)” / “Spend calculator — Which card pays you back most (shorter-direct)”
- **Knock-on register:** index.astro:272-275 (strategy 'Welcome bonus' tab tool tile — its stat is welcome value, so the section editor may prefer pointing it at /guides/best-premium-cards-2026/ or /cards/finder/); 29 Aug audit §2.4 calculator consolidation — known-open; this label was introduced by the rebuild that gave /calculator/ its first nav link

### F-022 — Newsletter fallback mailto link is indistinguishable from surrounding text (axe link-in-text-block, 1.33:1, no underline)

- **Severity · tier · owner:** P1 · T2 · `head-of-ux` — lens: standards-editor (Council finder: standards-editor + Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/components/NewsletterSignup.astro:43
- **Evidence:** audit-output/render/routes/root.json → axe.light.violations[0] (link-in-text-block, impact serious): "The link has insufficient color contrast of 1.33:1 with the surrounding text. (Minimum contrast is 3:1, link text: #1f3a4d, surrounding text: #1f2328) / The link has no styling (such as underline)", target `a[data-astro-cid-sornssq2]`. dist/index.html resolves that node to `<a href="mailto:info@dubaipoints.ae?subject=Join%20the%20Friday%20brief" data-astro-cid-sornssq2>info@dubaipoints.ae</a>` inside `.dp-newsletter-fallback`. The component's <style> (NewsletterSignup.astro:49-104) sets no rule on `a`.
- **Impact:** WCAG 1.4.1 failure on the only actionable element in the newsletter band while sign-up is email-only.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** Add `.dp-newsletter-fallback a { text-decoration: underline; text-underline-offset: 2px; }` to the component style block.
- **Knock-on register:** /newsletter/ renders the same component; Re-check in dark theme (root.json axe.dark had 0 violations but 14 incomplete contrast nodes)

### F-023 — Live-desk salary rows show a Verified date but no end date, so a lapsed offer looks identical to a live one

- **Severity · tier · owner:** P1 · T2 · `head-of-ux` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:464
- **Evidence:** index.astro:464 renders `<span class="chip">Verified {r.verified}</span>` and the offerRows mapper (lines 300-309) drops `validUntil` even though `SalaryTransferOffer` carries it (src/lib/offerAdapter.ts:17, src/lib/salaryTransfer.ts:27). The adjacent Deals column shows `Ends {r.ends}` per row. Live page today (live/pages/root.md, crop m1.png): 'RAKBANK up to AED 4,000 cash · 4 bands · from AED 5,000+ salary Verified 22 Aug 2026' under the h2 'What's live right now.' while src/content/salaryTransferOffers/rakbank-cash-reward-2026.mdx has `validUntil: 2026-08-31`, `archived: false`. The live symptom is known-open (recon-notes.md §1: build broken since 1 Sep, live site is the 30 Aug artefact; archival is a content task). The design gap is new: honesty of a band titled 'live right now' rests entirely on a build-time filter, with nothing reader-visible to catch a stale deploy.
- **Impact:** A reader can act on a salary-transfer offer that has ended and earn nothing — the same failure class the 22 Aug audit called 'the single most damaging'.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: now
- **Minimum bounded correction:** In offerRows add `ends: fmtShort(new Date(o.validUntil))` and change line 464 to `<span class="chip">Verified {r.verified} · to {r.ends}</span>` (or a second `chip is-ends` span to match the deals column).
- **Alternative wordings:** “Rename the h2 to 'Offers we track' so the copy stops claiming real-time status”
- **Knock-on register:** business-realestate-editor archives rakbank-cash-reward-2026.mdx (known-open); global.css:1329-1370 `.dp-live-desk .row` grid at ≤640px — chip column is `auto`, verify the longer chip does not wrap awkwardly; Consider the same end-date chip on /salary-transfer/ tracker rows for consistency

### F-024 — Header chrome sits outside any landmark on every route (axe region, 1,194 nodes)

- **Severity · tier · owner:** P2 · T2 · `technical-lead` — lens: technical-lead (audit session + Council finder: head-of-ux); confidence high
- **Routes:** `*`
- **Anchor:** src/components/Header.astro:128 (<div class="dp-header">) · :238 (.dp-tracker-strip) · probes-summary.json axeLight region ×199
- **Evidence:** The wordmark, primary nav, actions, quick-link strip and mobile overlay are wrapped in <div>s; the only landmarks are <main> and <footer>. Screen-reader users cannot jump to navigation.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** `<div class="dp-header">` → `<header class="dp-header">`; wrap `.dp-header-nav` in `<nav aria-label="Primary">`, the tracker strip in `<nav aria-label="Quick links">`, and the overlay body in `<nav aria-label="Menu">`. Selectors are class-based so CSS is untouched.
- **Knock-on register:** tests/nav/header.test.ts (selectors); Pagefind data-pagefind-ignore stays on the wrapper

### F-025 — Directory search inputs and the Pagefind clear button have no visible focus ring

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `/airlines/`, `/banks/`, `/deals/`, `/search/`
- **Anchor:** probes-summary.json focusFailures: input#airlines-search-input, input#banks-search-input, input#deals-search-input (desktop stop 15) · /search/ button.pagefind-ui__search-clear (invisible while focused)
- **Evidence:** The Tab-walk reached each `.intel-search` input with no outline and no border change; on /search/ the Pagefind 'Clear' button receives focus while hidden. axe also flags `label-title-only` on the Pagefind input.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Add `.intel-search input:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }`; on /search/ set `.pagefind-ui__search-clear[hidden], .pagefind-ui__search-clear:not(.pagefind-ui__suppressed) { … }` per Pagefind's docs or hide it with `display:none` until a query exists.
- **Knock-on register:** the same forms are the ones posting to "/" (see IA finding) — fix together

### F-026 — Tap targets: 13,038 of 18,963 interactive elements at 360px are under 44px; 4,975 are under the WCAG 2.2 24px floor

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (audit session + Council finder: head-of-ux); confidence high
- **Routes:** `*`, `/cards/compare/ (121)`, `/`
- **Anchor:** probes-summary.json tapTargets360 · Header.astro:477 (.dp-quicklink 17px tall) · index.astro strategy radios 13×13 (input#dps-*)
- **Evidence:** Median 64 sub-44px targets per route; the quick-link strip links are 106×17; the homepage strategy-tab radios are 13×13; comparison-table links and tracker chips make up the rest.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Give inline chrome links a 34–44px hit area via padding/`min-height` (`.dp-quicklink`, `.dp-nav-sub`, `.dp-footer-col a`); enlarge the strategy-tab radios' labels to wrap the whole tab. Do not change type sizes.
- **Knock-on register:** header height at 360 (check tracker strip wrap); ComparisonTableLayout row height

### F-027 — /cards/finder/ shifts layout after hydration (CLS 0.258) and renders 3,603 DOM nodes

- **Severity · tier · owner:** P2 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/cards/finder/`
- **Anchor:** lighthouse.md (/cards/finder/ desktop CLS 0.258, perf 87) · probes-summary.json domNodes 3603 · src/pages/cards/finder/index.astro (inline script)
- **Evidence:** Only route above the 0.1 CLS threshold; the result list re-renders on load and the page also carries the largest DOM on the site.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Reserve the result region's height (`min-height` from the SSR'd default list) and paginate or virtualise beyond the first 12 tiles.

### F-028 — Inert 'EN · العربية' language switch in the mobile overlay foot

- **Severity · tier · owner:** P2 · T1 · `standards-editor` — lens: standards-editor (audit session); confidence high
- **Routes:** `*`
- **Anchor:** src/components/Header.astro:381 (<span>EN · العربية</span>) · dist: no hreflang, no Arabic route
- **Evidence:** A language toggle that is a <span> with no href promises an Arabic edition that does not exist.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Delete the span (T1). If an Arabic edition is planned, it returns behind a brief with real routes.

### F-029 — Mega-menus and the Travel panel repeat the same destination under different labels (18 duplicate rows)

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `*`
- **Anchor:** src/components/Header.astro:26-123 (cardsPanel, pointsPanel, travelPanel) · chrome-inventory.json
- **Evidence:** /cards/ is reached from 'Best overall UAE cards', 'All cards' and 'All co-branded cards' (there is no co-branded filter); /airlines/ from 'Airline programmes', 'All airline programmes', 'Hotel programmes' and 'All hotel programmes'; /news/airlines/ from 'Airline news' and 'All airline stories'; /news/hotels/ from 'Hotel news' and 'All hotel stories'; /banks/ from 'All issuers' and 'All bank programmes'. The Travel panel has 7 rows for 4 destinations.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Cut one row per duplicate pair (keep the label that names the reader job); replace 'All co-branded cards' with a real filter or remove it; collapse the Travel panel to four rows.
- **Knock-on register:** mobile overlay mirrors the panels (same arrays); .council/audits/2026-09-06-link-audit.md aggregate counts

### F-030 — Hotel programmes live under /airlines/ and are labelled 'In the programme directory' in the nav

- **Severity · tier · owner:** P2 · T3 · `seo-strategist` — lens: seo-strategist (audit session); confidence high
- **Routes:** `/airlines/marriott-bonvoy/`, `/airlines/hilton-honors/`, `/airlines/accor-all/`, `/airlines/`
- **Anchor:** src/pages/airlines/[slug].astro (programs collection) · Header.astro pointsPanel "Hotel programmes" rows
- **Evidence:** Three hotel programmes share the airline route prefix; the nav compensates with a sub-label. Title tags read correctly but the URL and breadcrumb say airlines.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: later
- **Minimum bounded correction:** Rename the route to /programmes/ (or /loyalty/) with 301s in public/_redirects for the six current URLs; update the programs collection base path and the header arrays.
- **Knock-on register:** public/_redirects; sitemap; BreadcrumbList schema; Footer "Programmes" column; internal links (check-links sweep)

### F-031 — One salary-transfer product, seven different labels across the chrome and homepage

- **Severity · tier · owner:** P2 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`, `*`
- **Anchor:** src/pages/index.astro:430 · Header.astro toolRows/pointsPanel/cardsPanel · Footer.astro column 1
- **Evidence:** Links to /salary-transfer/ read 'Salary offers', 'Salary-transfer tracker', 'Salary transfer explained', 'Live tracker', 'Full tracker →', 'Salary tracker'; links to the calculator read 'Salary-offer calculator' and 'Calculator'.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Two canonical nouns — 'Salary-transfer tracker' for /salary-transfer/ and 'Salary-transfer calculator' for /salary-transfer/calculator/ — applied at every anchor (seven edits).
- **Alternative wordings:** “Salary-transfer tracker” / “Salary offers (tracker)”

### F-032 — /calculator/ and /salary-transfer/calculator/ remain two calculators with overlapping names (open since 22 Aug)

- **Severity · tier · owner:** P2 · T2 · `managing-editor` — lens: managing-editor (audit session + Council finder: standards-editor); confidence high
- **Routes:** `/calculator/`, `/salary-transfer/calculator/`
- **Anchor:** .council/research/2026-08/site-audit-2026-08-29.md §2 item 4 · src/pages/index.astro:422 ("Welcome-bonus calculator" tile → /calculator/, which states it does not score welcome bonuses)
- **Evidence:** /calculator/ has one inbound link (homepage tool strip) and no header or footer presence; the homepage labels it 'Welcome-bonus calculator' although the page describes a spend-return model. Known-open from 29 Aug; the label defect is new (Council standards-editor).
- **Verdict:** **DECISION REQUIRED** (known-open — 2026-08-29 §2 item 4) · sprint: next
- **Minimum bounded correction:** Now: relabel index.astro:422-423 to 'Spend-return calculator / See which card pays back most on your monthly spend'. Decision: merge under /salary-transfer/calculator/ with a mode switch, or keep both and give /calculator/ a nav slot.

### F-033 — Homepage: shipped page has eight bands against a ratified four-section spec; the overriding direction lives only in a code comment

- **Severity · tier · owner:** P2 · T1 · `managing-editor` — lens: managing-editor (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** SITE_ARCHITECTURE.md:281-300 (4-section Quiet Ledger spec) · :343 (status cell: "applied 2026-08-29 (as 5 sections… typographic hero, no photo)") · src/pages/index.astro:337-670 (hero with photo, tools, live desk, latest, strategy tabs, start here, trust, newsletter)
- **Evidence:** The status table says five sections and a typographic hero with no photo; the page ships eight bands and a photo hero (29 Aug v0 direction). The record and the page disagree.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: next
- **Minimum bounded correction:** Update SITE_ARCHITECTURE.md:343 to describe the shipped page and log the 29 Aug direction (photo hero, boxed idiom, gold band exception) as a dated Amendments entry, or bring the page back to the ratified spec. Chairman decides which.

### F-034 — 121 of 201 titles exceed 60 characters (news up to 138); 65 descriptions exceed 155 (up to 334)

- **Severity · tier · owner:** P2 · T2 · `seo-strategist` — lens: seo-strategist (audit session); confidence high
- **Routes:** `/news/*`, `/cards/*`, `/guides/*`, `/deals/*`
- **Anchor:** seo-mechanical.json titles.over60 / descriptions.over155 · .council/01_editorial_standards.md §9 (title patterns) · src/content/news/etihad-miles-rate-holds-2-94-fils-second-sale.mdx:3
- **Evidence:** The §9 card pattern cannot fit 60 characters for any Emirates NBD card; news stories use the full headline; news `description` doubles as the standfirst.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Optional `seoTitle` frontmatter (fallback: headline); move the card-review stamp into the description; Zod `.max(160)` on `description` for news and deals with a separate `standfirst`; amend §9 with a 60-character ceiling.
- **Knock-on register:** src/content.config.ts; desk templates; 65 news/deal entries to backfill; RSS item titles

### F-035 — Page-level structured data is absent on 24 of 30 templates and the §9 schema spec does not match what ships

- **Severity · tier · owner:** P2 · T3 · `technical-lead` — lens: seo-strategist (audit session); confidence high
- **Routes:** `/`, `/cards/`, `/salary-transfer/*`, `/cards/compare/`, `/cards/finder/`, `trust pages`
- **Anchor:** seo-mechanical.json schemaByTemplate · src/components/seo/SchemaJsonLd.astro · src/layouts/BaseLayout.astro:63 (Organization.sameAs: []) · .council/01_editorial_standards.md §9
- **Evidence:** Only card reviews (Product,FinancialProduct), bank hubs, programme pages and articles emit a page entity; directories, the 36-page tracker family, calculators, compare, finder and trust pages emit WebSite + Organization only. §9 specifies Article+Review / Article+FAQPage / Article+Offer, none of which ships. sameAs is empty.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: later
- **Minimum bounded correction:** No ruling needed: CollectionPage + BreadcrumbList on directories, BreadcrumbList on the tracker family, fill or delete sameAs. Ruling needed: which spec is canonical (Technical Lead + SEO Strategist propose; Chairman ratifies §9).
- **Knock-on register:** every layout; a schema-per-template test (none exists)

### F-036 — One broken in-page anchor: #cashback-vs-cashback-plus on the Liv Cashback review

- **Severity · tier · owner:** P2 · T1 · `business-realestate-editor` — lens: business-realestate-editor (audit session); confidence high
- **Routes:** `/cards/liv-cashback/`
- **Anchor:** src/content/cards/liv-cashback.mdx:58 (jump entry id "cashback-vs-cashback-plus") vs :146 heading "## Cashback vs Cashback+" (rendered id cashback-vs-cashback)
- **Evidence:** The slugger drops the trailing '+', so the JumpToSection link targets an id that does not exist.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Change the jump entry id to `cashback-vs-cashback`.

### F-037 — Search-engine snippets for the homepage are built from mega-menu text, not the meta description

- **Severity · tier · owner:** P2 · T1 · `technical-lead` — lens: seo-strategist (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** serp.json site: result 3 (description = "Best overall UAE cards Editor's pick Best travel cards Miles & lounge access …") · src/components/Header.astro:161, :185, :238
- **Evidence:** The indexed description is the Cards mega-menu's labels concatenated.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** `data-nosnippet` on the two `.dp-megapanel` wrappers and the tracker strip.

### F-038 — Salary calculator results repeat the bank name twice and glue the rank to it ('#1First Abu Dhabi Bank — First Abu Dhabi Bank — 20% …')

- **Severity · tier · owner:** P2 · T2 · `business-realestate-editor` — lens: business-realestate-editor (audit session); confidence high
- **Routes:** `/salary-transfer/calculator/`
- **Anchor:** src/components/islands/SalaryTransferCalculator.tsx:198-199 (`<span class="dpsc-rank">#{idx + 1}</span>{r.offer.bankName} — {r.offer.name}`) · interact-log.md salary-calculator
- **Evidence:** Offer names already begin with the bank name, so the heading reads 'First Abu Dhabi Bank — First Abu Dhabi Bank — 20% Salary Transfer Campaign 2026'; the rank span has no trailing space so the accessible name is '#1First'. The salary field is pre-filled with 20000 rather than empty.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Render `{r.offer.name}` only when it does not start with bankName, add a space (or `aria-label`) after the rank, and start the salary input empty with a placeholder.

### F-039 — Card finder: URL parameters filter the results but the controls do not reflect them

- **Severity · tier · owner:** P2 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/cards/finder/`
- **Anchor:** interact-log.md card-finder (?spend=travel&prefer=miles → 6 travel/miles cards ranked while "General / mixed" and "No preference" radios show checked) · src/pages/cards/finder/index.astro inline script
- **Evidence:** A reader arriving from the homepage 'Tool' links sees controls that contradict the list. Card names render uppercase via text-transform, so accessible names are all-caps; every tile link reads 'Read review' (generic, repeated six times).
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Initialise the radio/select state from URLSearchParams before rendering; add `aria-label="Read review: {card name}"`; drop text-transform from the h3 (use font-variant caps if the look is wanted).

### F-040 — Homepage h1 is announced as 'Fly further. Payless.'

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (audit session + Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:342 (`<h1>Fly further. <em>Pay&nbsp;less.</em></h1>`) · interact-log.md dark-mode (accessibility tree)
- **Evidence:** The non-breaking space inside the <em> is read as part of one token by the tree Firecrawl exposed; screen readers hear 'Payless'. The Council standards-editor separately notes the slogan carries no topical noun.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Use a normal space with `white-space: nowrap` on the <em>, or re-word per the Standards Editor's proposal ('Fly further. On a Dubai salary.') — the composition is a Chairman direction, so wording escalates.

### F-041 — No public/_headers: the site ships without X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options, HSTS or a report-only CSP

- **Severity · tier · owner:** P2 · T3 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `*`
- **Anchor:** static-config.json headers.present=false · scripts/audit/check-headers-redirects.mjs RECOMMENDED_HEADERS (printed by npm run audit:static)
- **Evidence:** Cloudflare Pages reads `public/_headers`; none exists. `audit:static` prints a starter with a report-only CSP so nothing breaks on day one.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: next
- **Minimum bounded correction:** Add `public/_headers` from the printed recommendation (T3 production change: Chairman + Technical Lead); observe CSP reports for two weeks before enforcing.

### F-042 — "Join brief" header CTA is a mystery label and wraps to two lines at 1280 px

- **Severity · tier · owner:** P2 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor + Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/components/Header.astro:224
- **Evidence:** Header.astro:224: `<a href="/newsletter/" class="dp-header-subscribe">Join brief</a>`. The live 1280 px capture (scratchpad/audit/live/screens/root-desktop-full.png, top-right) and the render fold (audit-output/render/screens/root/dark-1280-fold.png) both show the pill breaking as "JOIN / BRIEF" on two lines; `.dp-header-subscribe` (Header.astro:686-701) sets `text-transform: uppercase` but no `white-space: nowrap`, unlike the sibling `.dp-search-pill` (:675). "Brief" is not defined for the reader until the gold band at the foot of the page (index.astro:674). Firecrawl's branding pass read it as the page's primary CTA (branding/root.json → __llm_button_reasoning.primary).
- **Impact:** The single most prominent button on every page is an in-house shorthand that a first-time UAE reader cannot parse, and it renders broken at the audited desktop width.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Relabel to "Newsletter" and add `white-space: nowrap;` to `.dp-header-subscribe`.
- **Alternative wordings:** “Friday brief (longer-formal — matches the product name on /newsletter/)” / “Newsletter (shorter-direct — self-explaining, one word, cannot wrap)”
- **Knock-on register:** Header.astro:17 mobileTop label "Join brief"; Footer.astro:27 "Join the Friday brief"; newsletter.meta.json title "Join the Friday brief | DubaiPoints"

### F-043 — Launch-pending status is stated three times on one page while two chrome CTAs still say "Join"

- **Severity · tier · owner:** P2 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:352-357
- **Evidence:** Hero micro-line (:354-355): "The Friday brief is preparing for launch — sign-up is by email until the automated list opens." Gold band H2 (:674): "The Friday brief is preparing for launch." NewsletterSignup fallback (NewsletterSignup.astro:42-44): "Automated sign-up is not enabled yet. To join the launch list, email info@dubaipoints.ae…". Live: root-markdown.md lines 122-130 render all three. Meanwhile the header reads "Join brief" (Header.astro:224) and the footer "Join the Friday brief →" (Footer.astro:27) — verbs promising an action the page says is not available.
- **Impact:** Kill-list #6 (empty signposting) by repetition; the page apologises for the newsletter three times and the reader's takeaway is that the product is not ready.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Delete the hero micro block (index.astro:352-357). The gold band H2 and the fallback already carry the state; keep those two.
- **Alternative wordings:** “The Friday brief opens for automated sign-up shortly; until then, join by email. (longer-formal, for the band H2 at :674)” / “The Friday brief. Sign-up by email for now. (shorter-direct, for the band H2 at :674)”
- **Knock-on register:** None functional — the `newsletterLive` flag (:66-68) still gates the band copy

### F-044 — Featured-read play card overlaps the 'DXB ✦ AED-FIRST' stamp on mobile

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:780
- **Evidence:** crops/m0.png (live 360px capture) shows the stamp reduced to 'DXB' and 'ST' — the play card covers 'AED-FIR'. `.hp-hero-stamp` (index.astro:780-796) is `position:absolute; top:20px; right:20px` and `.hp-hero-play` (797-807, 808 at ≤899px `left:12px`) is `bottom:26px; max-width:min(320px,78%)`; with a three-line Fraunces title the card rises into the stamp's box on a 342px-wide 4:3 photo (~257px tall).
- **Impact:** The first visual on the page looks mis-rendered to every mobile reader.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Add `@media (max-width: 899px) { .hp-hero-stamp { display: none; } }` next to the existing 899px rule at index.astro:808 — the stamp is `aria-hidden` decoration.
- **Alternative wordings:** “Move the stamp to `top:12px; left:12px` and the play card to the right edge on mobile”
- **Knock-on register:** If the stamp is kept, re-test with the longest current guide title in the manifest

### F-045 — Heading order skips a level on the paint-protection-film guide

- **Severity · tier · owner:** P3 · T1 · `lifestyle-culture-editor` — lens: lifestyle-culture-editor (audit session); confidence high
- **Routes:** `/guides/paint-protection-film-dubai/`
- **Anchor:** probes-summary.json headingSkips · src/content/guides/paint-protection-film-dubai.mdx (h4 after h2)
- **Evidence:** The only heading-order violation on the site (axe heading-order, 1 node).
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: later
- **Minimum bounded correction:** Promote the h4 to h3.

### F-046 — Footer bank rows announce the fallback text mark before the bank name

- **Severity · tier · owner:** P3 · T1 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `*`
- **Anchor:** chrome-inventory.json → "Footer — Banks" labels ("AD Abu Dhabi Commercial Bank", "SC Standard Chartered") · src/components/Footer.astro:39-52 · BankLogo fallback
- **Evidence:** Six issuers render as text-mark placeholders (2026-05-29 ruling); the placeholder initials are not aria-hidden, so the accessible name is 'AD Abu Dhabi Commercial Bank'. The Firecrawl accessibility tree also shows '<Bank> logo <Bank>' where an SVG exists (alt duplicates the visible name).
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: later
- **Minimum bounded correction:** `aria-hidden="true"` on `.dp-bank-logo-fallback`; empty alt on decorative logos beside a visible name.


## 4. Observations (26)

Patterns, opportunities and things checked and found sound. Observations never carry a P0.

### F-047 — /deals/ holds three live deals yet occupies a primary nav slot, a homepage directory tile ('3 live') and a Travel-panel row

- **Severity · tier · owner:** P2 · T2 · `lifestyle-culture-editor` — lens: lifestyle-culture-editor (audit session); confidence high
- **Routes:** `/deals/`
- **Anchor:** chrome-inventory.json (Deals → thin, 127 words, 3 children) · dist/deals/index.html
- **Evidence:** The deals desk is the thinnest top-level section on the site (three items, two of which are salary-transfer offers already on the tracker).
- **Verdict:** **DECISION REQUIRED** (new) · sprint: next
- **Minimum bounded correction:** Decision: either commit the lifestyle desk to a cadence (≥ 6 live deals) before the DSF season, or fold deals into the tracker/news surfaces and drop the nav slot until the desk has volume.

### F-048 — dubaipoints.ae is absent from every UAE money query tested; the brand query returns golf

- **Severity · tier · owner:** P2 · T2 · `growth-analytics-lead` — lens: seo-strategist (audit session); confidence high
- **Routes:** `*`
- **Anchor:** serp.json (Firecrawl search, UAE location: 6 queries + site:)
- **Evidence:** No top-10 result for best-cashback, salary-transfer-2026, Skywards-card, Islamic-cashback or minimum-salary-5000 queries; kredit.ae, masarif.ae, yallacompare and moneyluna hold those slots; `site:` returns 7 indexed pages in Firecrawl's index.
- **Verdict:** **VERIFICATION HOLD** (new) · sprint: next
- **Minimum bounded correction:** Confirm in Search Console (Firecrawl's index is not Google); if confirmed, the Growth & Analytics Lead opens a Q4 visibility brief rather than a mechanical fix.

### F-049 — Card verification ages: 58 cards in cards.json; 0 past 90 days, 0 between 60 and 90 days (oldest emirates-nbd-priority-banking-visa-infinite at 34 days).

- **Severity · tier · owner:** P2 · T1 · `fact-checker` — lens: fact-checker (audit session); confidence high
- **Routes:** `/cards/*`
- **Anchor:** src/data/cards.json lastVerified (computed 7 Sep) · SpecCard.astro 90-day amber chip
- **Evidence:** The quarterly scrape backstop (CLAUDE.md) and the fee-docs monitor refresh lastVerified only when a source moves; the amber chip is the reader-facing consequence.
- **Verdict:** **SETTLE** (new) · sprint: next
- **Minimum bounded correction:** Schedule the quarterly scrape dispatch for the cohort entering the 60–90 window; no copy change.

### F-050 — 13 of 21 guides are past 90 days, including the four expat-starter guides promoted in both mega-menus

- **Severity · tier · owner:** P2 · T2 · `lifestyle-culture-editor` — lens: lifestyle-culture-editor (audit session); confidence high
- **Routes:** `/guides/expat-starter*`, `/guides/*`
- **Anchor:** .council/research/2026-08/site-audit-2026-08-29.md §2 item 3 · Header.astro cardsPanel/pointsPanel "Beginner's guide" rows
- **Evidence:** Known-open; unchanged since 29 Aug.
- **Verdict:** **SETTLE** (known-open — 2026-08-29 §2 item 3) · sprint: next
- **Minimum bounded correction:** Refresh queue per the 29 Aug order; no new action here.

### F-051 — Trust pages open with two long paragraphs and no scannable structure above the fold

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `/about/`, `/editorial-policy/`, `/how-we-make-money/`, `/team/`
- **Anchor:** audit-output/render/screens/about/light-390-fold.png · src/layouts/TrustPageLayout.astro
- **Evidence:** At 390px /about/ shows a kicker, h1, a 'Last updated' line and then ten lines of body copy with no sub-heading, list or pull-fact before the fold. The 5-second answer to 'what is this' is there; 'why should I trust it' is not.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Add a three-item fact strip under the head on TrustPageLayout (single editor · verification dates on every review · public corrections log) fed from existing copy; no new claims.

### F-052 — H1 "Fly further. Pay less." is a slogan with no topical noun — the only H1 on the route carries none of the title's terms

- **Severity · tier · owner:** P2 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:342
- **Evidence:** index.astro:342: `<h1>Fly further. <em>Pay&nbsp;less.</em></h1>`; render probe headings.texts[0] = "Fly further. Pay less." while <title> is "DubaiPoints — UAE miles, deals and banking, AED-first" (root.meta.json:5). The topical work is done by a span kicker (:341 "Independent UAE points & miles publication") and the lede (:344-346). "Pay less" is a promise, not a verifiable claim (kill-list #2); "Fly" is not the most important word for a page whose live desk is salary-transfer cash and cards (kill-list #8). The italic two-beat composition was Chairman-directed on 29 Aug (index.astro:18-25); the wording itself is not recorded as ratified in the 29 Aug audit §1.3.
- **Impact:** SEO: h1/title mismatch with zero keyword overlap on the root. Voice: reads as ad copy on an HfP-dry publication.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: next
- **Minimum bounded correction:** Keep the ratified italic two-beat and add the noun: `Fly further. <em>On a Dubai salary.</em>` — escalate wording to the Chairman since the composition was his direction.
- **Alternative wordings:** “UAE miles and cards, priced in AED. (longer-formal, descriptive)” / “Fly further. On a Dubai salary. (shorter-direct, keeps the ratified italic beat)”
- **Knock-on register:** Chairman ratification (29 Aug v0 direction); SITE_ARCHITECTURE.md §4 homepage note

### F-053 — At 390×844 the hero's featured story and photo fall below the fold behind a six-block text stack

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** audit-output/render/screens/root/light-390-fold.png
- **Evidence:** light-390-fold.png: kicker wraps to two lines, h1, 24-word lede (5 lines), 'Start with a tool ↗' and 'Read the latest →' stacked on separate rows (they do not fit side by side at 342px; `.hp-hero-ctas` flex-wrap, `.hp-hero-cta` padding 14px 24px — index.astro:735-737), the 17-word 'The Friday brief is preparing for launch…' micro line (index.astro:353), then the trust strip; the photo's top edge appears at ~y=730 and the 'FEATURED READ' label is cut by the 844px fold. Fence 1 and 3 technically pass (lede ≤30 words, stats strip present), so P2 not P1. The micro line duplicates the gold band's h2 (line 674) and the fallback note (line 681).
- **Impact:** Mobile readers see prose and two anchors but not the page's one editorial pick before scrolling.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Remove the `.hp-hero-micro` paragraph (index.astro:353-356) and reduce `.hp-hero-cta` padding to `14px 18px` so both CTAs share one row — roughly 115px reclaimed, enough to bring the play-card title into the first viewport.
- **Alternative wordings:** “Order the photo first on <900px via `order:-1` on `.hp-hero-media` (pushes the CTA down — less preferred)”
- **Knock-on register:** Standards Editor to concur on dropping the hero micro copy (message survives in the gold band); Re-check 360px CTA row after padding change

### F-054 — Hero image has `sizes` but no `srcset`: 1880px / 380 KB JPEG served to a 342px slot, and it is the LCP element

- **Severity · tier · owner:** P2 · T2 · `technical-lead` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:368
- **Evidence:** index.astro:368-377: bare `<img src=… width={featureImg.width} height={…} loading="eager" fetchpriority="high" sizes="(max-width: 899px) 100vw, 46vw">` with no `srcset` (sizes is inert without one). data/stock/manifest.json: guide-dubai-shopping-festival-2026.jpg 1880×1253, 380,180 bytes on disk. Probe metrics: lcpElement `header.dp-pagehead.hp-hero > … > img`, aboveFoldBytes 970,625, transferredBytes 1,606,886, requests 25. StockImage.astro (lines 74, 95) also forwards `sizes` without `srcset`, so this is a site pattern; the hero is where it costs most. Joint call with Technical Lead per role; fast trumps pretty.
- **Impact:** Roughly 250–300 KB of avoidable download on the LCP image for the 70% mobile audience on transit connections.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Generate a ~940w derivative of the hero file and add `srcset="/images/stock/…-940.jpg 940w, /images/stock/….jpg 1880w"` to the hero <img> (index.astro:368-377).
- **Alternative wordings:** “Migrate the hero to astro:assets <Image> with widths=[480,940,1880]”
- **Knock-on register:** If generalised, StockImage.astro and scripts/images fetch pipeline need a resize step (T3); manifest schema if derivative paths are recorded

### F-055 — Boxed tool tiles collapse to ~85px text columns at 360px

- **Severity · tier · owner:** P2 · T2 · `head-of-ux` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/styles/global.css:1188
- **Evidence:** crops/m0.png: tool descriptions wrap to 4–5 lines ('Rank 57 / cards / against your / spending', 'See which / welcome / offer pays / back first') and titles to 3 lines ('Welcome- / bonus / calculator'). Cause: 2-up grid inside a 312px strip, `.dp-tool-strip.is-boxed .dp-tool { padding: 26px 24px 22px }` (global.css:1188-1193) plus `.go { padding-right: 22px }` to clear the corner arrow (1216-1219) leaves ~85px for 13px text. index.astro is the only consumer of `.is-boxed`.
- **Impact:** The primary 'next action' surface is the hardest-to-read band on the page for phone readers.
- **Verdict:** **REQUIRED CHANGE** (new) · sprint: next
- **Minimum bounded correction:** Add `@media (max-width: 480px) { .dp-tool-strip.is-boxed { grid-template-columns: 1fr; } .dp-tool-strip.is-boxed .dp-tool:nth-child(even) { border-left: 0; } .dp-tool-strip.is-boxed .dp-tool + .dp-tool { border-top: 1px solid var(--line); } }` in global.css after line 1203.
- **Alternative wordings:** “Keep 2-up but cut padding to 18px/16px and hide `.arrow` below 480px”
- **Knock-on register:** Seam comment at global.css:1195-1198 should be updated to describe the 1-col case

### F-056 — All four islands hydrate with client:load; a universal `html * { transition }` rule repaints every element on theme change

- **Severity · tier · owner:** P3 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `/salary-transfer/*`, `/calculator/`, `/salary-transfer/calculator/`
- **Anchor:** src/pages/salary-transfer/index.astro:131, [slug].astro:64, calculator.astro:14, src/pages/calculator.astro:60 · src/styles/global.css:3659-3661
- **Evidence:** `client:load` is correct for the tracker (above the fold) but the calculators sit below a full page head; the universal transition rule (background/border/color 0.2s on every element) is the kind of rule that costs on low-end phones and is unnecessary once the tokens animate on <html>.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** `client:visible` on the two calculator islands; scope the transition rule to `.dp-header, .dp-footer, main` or remove it (html-level transition at :3656 already covers the theme swap).

### F-057 — Single Open Graph image site-wide; RSS lastBuildDate is the newest item's date

- **Severity · tier · owner:** P3 · T2 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `*`
- **Anchor:** dist grep: 198 of 199 pages carry /og-default.png · dist/rss.xml:8 (22 Aug on a 7 Sep build) · .council/research/2026-08/site-audit-2026-08-29.md §2 item 8
- **Evidence:** Known-open (per-page OG). The RSS date is defensible but reads stale to a feed reader.
- **Verdict:** **SETTLE** (known-open — 2026-08-29 §2 item 8) · sprint: later
- **Minimum bounded correction:** Feed `ogImage` from the manifest per template when the deferred item is scheduled; set lastBuildDate to the build time.

### F-058 — Trust-page stamps /press/ and /tip/ still read 9 May 2026

- **Severity · tier · owner:** P3 · T1 · `standards-editor` — lens: standards-editor (audit session); confidence high
- **Routes:** `/press/`, `/tip/`
- **Anchor:** .council/research/2026-08/site-audit-2026-08-29.md §2 item 5
- **Evidence:** Known-open.
- **Verdict:** **SETTLE** (known-open — 2026-08-29 §2 item 5) · sprint: later
- **Minimum bounded correction:** Bump when the pages are next touched.

### F-059 — Compare page: the default side-by-side is three articles, not a table, and the picker is collapsed behind a disclosure

- **Severity · tier · owner:** P3 · T2 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `/cards/compare/`
- **Anchor:** interact-log.md compare · src/pages/cards/compare.astro
- **Evidence:** Works as designed (defaults to the three highest welcome-bonus cards). Observation only: the disclosure label 'Pick cards to compare Up to 4 cards · grouped by bank ▾' is the longest button name on the site.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** None required; consider opening the picker by default above 1024px.

### F-060 — Proposed (not created) self-monitor for dubaipoints.ae

- **Severity · tier · owner:** P3 · T3 · `head-of-research` — lens: head-of-research (audit session); confidence high
- **Routes:** `ops`
- **Anchor:** monitor-health.json · CLAUDE.md §Monitoring (§6 boundary)
- **Evidence:** No monitor watches the publication's own output. A markdown-mode monitor on 12 routes (home, tracker, calculator, /cards/, one card review, one guide, /news/, one story, /valuations/, /about/, /404-probe/, sitemap-index) weekly, goal 'a section disappeared, a build marker appeared, a figure changed', would cost ≈52 credits/month and would have caught the 30 Aug freeze within a week.
- **Verdict:** **DECISION REQUIRED** (new) · sprint: later
- **Minimum bounded correction:** Create only on Chairman direction (the user chose propose-only); spec above is complete enough to provision with scripts/monitor/setup.mjs.

### F-061 — Firecrawl tool applicability for this publication (method note)

- **Severity · tier · owner:** P3 · T1 · `head-of-research` — lens: head-of-research (audit session); confidence high
- **Routes:** `ops`
- **Anchor:** credits-log.json (486 of 1,000) · interact-log.md README · agent-benchmark.json
- **Evidence:** Used: map, scrape (markdown/links/summary/screenshot/branding/changeTracking/query directQuote), crawl (chunked ≤ 40 pages inside the 60-second MCP transport limit), search (UAE location), interact (short single-action prompts only; long prompts time out), agent ×2 (benchmarks; creditsUsed not reported), monitor reads, developer_search. Not applicable: parse, research_*, audio. Sub-agents can hold the MCP tools (CLAUDE.md corrected).
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Record in the Head of Research SOP: chunk crawls, keep interact prompts to one action, log agent credits from the dashboard.

### F-062 — Unused components and an unratified breakpoint set

- **Severity · tier · owner:** P3 · T1 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `src`
- **Anchor:** src/components/{KeyTakeaways,ProgrammeLogo,AffiliateLink}.astro (0 imports) · global.css/layouts breakpoints: 640×20, 1024×17, 768×10, 900×8, 760×8, 719.98×7, 480×5, 1080×5, 1040×3, 720×3
- **Evidence:** Three components have no call site; the responsive rules use eleven distinct widths.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Delete the three files (T1); adopt four canonical breakpoints (480 / 768 / 1024 / 1280) at the next layout pass.

### F-063 — Deal titles end with the expiry date the "Ends" chip already carries

- **Severity · tier · owner:** P3 · T2 · `lifestyle-culture-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/content/deals/fab-amazon-10pct-monthly.mdx:2
- **Evidence:** Titles: "Amazon.ae — 10% off once a month with a FAB Mastercard, through 31 December" (fab-amazon-10pct-monthly.mdx:2), "FAB salary transfer — up to AED 9,000 cashback over 12 months, no lock-in, runs to 31 December" (fab-salary-cashback-2026.mdx:2), "HSBC Advance — AED 750 cashback for opening the account in-app, by 31 December" (hsbc-advance-750-cashback.mdx:2). The homepage row renders `{r.title}` then a chip `Ends {r.ends}` (index.astro:483-484), so the live page reads "…through 31 DecemberEnds 31 Dec" (root-markdown.md:44-46).
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Cut the trailing date clause from the three titles; `expiresOn` (line 6 of each) already drives the chip.
- **Alternative wordings:** “Amazon.ae — 10% off one order a month with a FAB Mastercard (longer-formal)” / “Amazon.ae — 10% off monthly with a FAB Mastercard (shorter-direct)”
- **Knock-on register:** Deal page H1 and <title>; /deals/ index cards; rss.xml item titles

### F-064 — Two different search prompts on one page for the same /search/ route

- **Severity · tier · owner:** P3 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:510
- **Evidence:** S4 pill: "Search cards, miles, banks…" (index.astro:510). Header pill: "Search cards, guides…" (Header.astro:221, aria-label "Search cards, guides" at :215). Both href="/search/".
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Make :510 match the header string exactly.
- **Alternative wordings:** “Search cards, guides, banks… (longer-formal)” / “Search DubaiPoints… (shorter-direct)”
- **Knock-on register:** If the header string changes instead, Header.astro:215 aria-label must still begin with the visible text (WCAG 2.5.3 note at :213-214)

### F-065 — "Verified" stamp appears with and without the year on the same page

- **Severity · tier · owner:** P3 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:112
- **Evidence:** Card-review meta uses fmtShort → "Verified 22 Aug" (index.astro:112; live root-markdown.md:64), while live-desk chips use fmtVerified with year → "Verified 22 Aug 2026" (index.astro:296-297, :308; live root-markdown.md:28). Guides read "Updated 22 Aug", news "Filed 22 Aug".
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Pick one: pass fmtVerified at :112, or drop `year` from fmtVerified at :297.
- **Alternative wordings:** “Verified 22 Aug 2026 (longer-formal — year on every stamp)” / “Verified 22 Aug (shorter-direct — matches Updated/Filed)”
- **Knock-on register:** index.astro:98, :124 if the year is added everywhere

### F-066 — "Start here" labels the sixth band, after the hero and tools band have already said "Start with a tool"

- **Severity · tier · owner:** P3 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:596
- **Evidence:** Eyebrow "Start here" + meta "Everything on dubaipoints.ae" (index.astro:596-598) open the directory after Tools, Live desk, Fresh and Strategy; the hero CTA (:349) and S2 H2 (:397) already read "Start with a tool". On the live mobile capture (root-mobile-full.png, 360×10988) the band sits roughly two-thirds of the way down.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Relabel the eyebrow; the meta line already says what the band is.
- **Alternative wordings:** “Browse by section (longer-formal)” / “Everything on the site (shorter-direct; then drop the duplicate meta at :598)”

### F-067 — Hero CTA pair uses two arrow glyphs for two in-page anchors; ↗ (outbound convention) marks internal links only on this page

- **Severity · tier · owner:** P3 · T2 · `standards-editor` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:349
- **Evidence:** "Start with a tool ↗" (href="#tools") beside "Read the latest →" (href="#latest") at index.astro:349-350. ↗ recurs on the hero play-card (:385) and the four tool tiles (:408, :416, :424, :432), all internal; elsewhere the site uses → for internal links (index.astro:453, :476, :503; Footer.astro:28). Grep: ↗ occurs only in index.astro (6) and CardComparison.astro (2).
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Use → at :349; reserve ↗, if kept at all, for genuinely external links.
- **Alternative wordings:** “Start with a tool → (longer-formal, matches its pair)” / “Open the tools → (shorter-direct)”
- **Knock-on register:** index.astro:385, :408, :416, :424, :432; src/components/cards/CardComparison.astro

### F-068 — Homepage <title> is brand-first with an em dash; every other route and the house pattern end "| DubaiPoints"

- **Severity · tier · owner:** P3 · T2 · `seo-strategist` — lens: standards-editor (Council finder: standards-editor); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:333
- **Evidence:** Live <title>: "DubaiPoints — UAE miles, deals and banking, AED-first" (root.meta.json:5; 54 chars, no month stamp; description 147 chars, og:title identical). Sampled siblings all end " | DubaiPoints": about, cards, news, guides, deals, newsletter, calculator, salary-transfer (each meta.json:5). House meta-title patterns (01_editorial_standards.md:160-165) all end "| DubaiPoints". JSON-LD on the route is the default WebSite + Organization graph (BaseLayout.astro:44-66); canonical, og-default.png 1200×630 and twitter card present; "/" is line 1 of the live sitemap.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** None required for a root page; if uniformity is wanted, swap the separator: "DubaiPoints | UAE miles, deals and banking, AED-first".
- **Alternative wordings:** “UAE miles, cards and salary-transfer offers, AED-first | DubaiPoints (longer-formal, keyword-first)” / “DubaiPoints | UAE miles, deals and banking, AED-first (shorter-direct, same words, house separator)”
- **Knock-on register:** BaseLayout og:title / twitter:title follow automatically

### F-069 — Trust tiles truncate mid-sentence at 360px because `.dp-dir-tile .desc` is clamped to 3 lines

- **Severity · tier · owner:** P3 · T2 · `standards-editor` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/pages/index.astro:650
- **Evidence:** crops/m4.png: 'Reviews carry dated verification and…' and 'Figures older th…'. index.astro:650 and 655 carry 20- and 22-word descriptions; global.css:1128-1135 `.dp-dir-tile .desc { -webkit-line-clamp: 3; overflow: hidden }`. The trust row is the page's accountability statement and is the only place the clamp bites.
- **Impact:** The trust statement is cut off precisely where it makes its claim, on the majority device.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Cut each trust desc at index.astro:650/655 to ≤14 words (e.g. 'Single-editor, UAE-resident publication; every review carries a verification date and sources.'), or add `.hp-trust .dp-dir-tile .desc { -webkit-line-clamp: unset; }` in the page styles.
- **Knock-on register:** /team/ and /editorial-policy/ deck copy if the shortened lines are reused

### F-070 — Live-desk column head 'SALARY-TRANSFER OFFERS' breaks over three lines at 360px

- **Severity · tier · owner:** P3 · T2 · `head-of-ux` — lens: head-of-ux (Council finder: head-of-ux); confidence high
- **Routes:** `/`
- **Anchor:** src/styles/global.css:1308
- **Evidence:** crops/m1.png: h3 renders 'SALARY- / TRANSFER / OFFERS' beside 'Full tracker →'. global.css:1308-1317 `.dp-live-desk .col-head { display:flex; justify-content:space-between; gap:16px }` with a 13px, 1.5px-tracked uppercase h3 in a ~262px box (section padding 24px + col padding 24px).
- **Impact:** Section label reads as broken type at the top of the page's most valuable band.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** Add `@media (max-width: 480px) { .dp-live-desk .col-head { flex-wrap: wrap; gap: 4px 12px; } }` after global.css:1312.
- **Alternative wordings:** “Reduce `.col-head h3` letter-spacing to 1px below 480px”

### F-071 — No page-level horizontal overflow at 360 / 390 / 768 / 1024 / 1280 / 1440 on any route

- **Severity · tier · owner:** P3 · T1 · `head-of-ux` — lens: head-of-ux (audit session); confidence high
- **Routes:** `*`
- **Anchor:** probes-summary.json overflow (document scrollWidth = innerWidth on 199 routes × 6 widths) · route JSON offenders
- **Evidence:** 33 routes contain intentional horizontal scroll regions (AED value bars, comparison tables, tracker tables, `.dp-prose table` at global.css:923 with overflow-x:auto); the document never scrolls sideways.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** None.

### F-072 — Reduced motion is honoured; no console errors; every route has exactly one h1; internal links 14,024 / 0 broken; sitemap = build

- **Severity · tier · owner:** P3 · T1 · `technical-lead` — lens: technical-lead (audit session); confidence high
- **Routes:** `*`
- **Anchor:** probes-summary.json (motion.animationsReduced 0 ×199; consoleErrors 0; h1Count 1 ×199) · internal-links.json · static-config.json sitemap.diff
- **Evidence:** Baseline hygiene the harness will keep asserting.
- **Verdict:** **SETTLE** (new) · sprint: later
- **Minimum bounded correction:** None.


## 5. Template scorecards — Head of UX rubric

Seven criteria, 1–5 (scannability · hierarchy · density · accent discipline · type discipline · mobile-first · "would I come back"), rated from the 390 and 1280 fold captures and the probe data. The Homepage row is the Council head-of-ux finder's own score; the rest were rated by the audit session against the same rubric and are marked for the Head of UX to confirm. `ux-status` follows the Stage 5.5 vocabulary.

| Route | Template | Scan | Hier | Dens | Accent | Type | Mobile | Back | ux-status | Five-second test |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Homepage | 4 | 4 | 3 | 3 | 4 | 3 | 3 | **pass-with-edits** | What: independent UAE points-and-miles publication (kicker + h1). Who: UAE residents stretching a Dubai paycheque (lede). Next: 'Start with a tool'. Featured story and photo fall below the 390 fold. |
| `/cards/adcb-365-cashback/` | CardReviewLayout | 5 | 5 | 4 | 3 | 4 | 4 | 4 | **pass-with-edits** | What: ADCB 365 Cashback review, dated. Verdict: welcome-bonus BLUF above the fold on navy. Next: read on / jump to section. All three answered at 390. |
| `/guides/best-premium-cards-2026/` | ArticleLayout (guide) | 4 | 4 | 3 | 4 | 4 | 4 | 4 | **pass** | What: best premium cards at AED 30k+ (h1). Who: the salary band is in the title. Next: jump to section. Five-line italic deck is at the limit. |
| `/news/adcb-365-cashback-earn-table-rebalance-2026/` | ArticleLayout (news) | 3 | 4 | 2 | 4 | 4 | 3 | 3 | **pass-with-edits** | What: ADCB earn-table change (kicker + h1). Verdict: in the deck. Next: none visible — a four-line h1 plus a seven-line italic deck fill the 390 fold; the image and body start below it. |
| `/airlines/accor-all/` | AirlineProgramLayout | 4 | 4 | 4 | 3 | 4 | 4 | 3 | **pass-with-edits** | What: Accor ALL programme page. Who: implicit. Verdict: none — the fact strip leads with '4 documented sweet spots' and '0 UAE cards earn into this' but no one-line take. Next: jump to section. |
| `/banks/adcb/` | BankHubLayout | 4 | 4 | 4 | 3 | 4 | 4 | 3 | **pass-with-edits** | What: ADCB hub (h1 + deck). Verdict: '11 cards covered · last verified 7 Aug'. Next: the gold 'Current salary transfer offer' callout — which says there is none. |
| `/salary-transfer/` | SalaryTransferTrackerLayout | 2 | 3 | 1 | 2 | 4 | 2 | 4 | **pass-with-edits** | At 390: what = the tracker (h1); verdict/next = not visible — a 15-line coverage paragraph fills the fold and the table starts below it (fails at 390, passes at 1280 where the table is in view). |
| `/salary-transfer/calculator/` | SalaryTransferCalculatorLayout | 4 | 4 | 3 | 4 | 4 | 4 | 3 | **pass-with-edits** | What: 'What's your salary transfer actually worth?' Next: the form is in view at 390. Verdict arrives after input. |
| `/cards/cashback/` | ComparisonTableLayout | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **pass-with-edits** | What: best cashback cards, stamped. Verdict: first card's four specs in view. Next: scroll. Cards stack as spec cards at 390; the table scrolls inside its wrapper at 768. |
| `/cards/` | Directory (cards) | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **pass** | What: best UAE credit cards. Verdict: 'Top picks this month — the two cards we'd open first'. Next: the first pick with welcome bonus and fee in view. |
| `/cards/compare/` | Compare | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **pass** | What: compare cards. Verdict: 'Showing 3 top welcome-bonus cards'. Next: 'Pick cards to compare' disclosure, then the first card's fee in view. |
| `/cards/finder/` | Card finder | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **pass-with-edits** | What: find your card. Next: the filter panel opens in view with salary and spend category. Verdict after input. |
| `/salary-transfer/history/adcb/` | SalaryTransferHistoryLayout | 4 | 4 | 4 | 4 | 4 | 4 | 2 | **pass** | What: ADCB offer history. Next: the timeline starts in view. |
| `/news/` | NewsIndexLayout | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **pass-with-edits** | What: the news desk. Next: desk filter pills + RSS + search, lead story in view. |
| `/guides/` | Directory (guides) | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **pass-with-edits** | What: all guides. Next: topic pills, featured guide in view. |
| `/airlines/` | Directory (programmes) | 4 | 4 | 4 | 3 | 4 | 4 | 3 | **pass-with-edits** | What: airlines & loyalty. Next: 'All programmes / Valuations method' pills, Skywards tile in view. |
| `/about/` | TrustPageLayout | 3 | 3 | 2 | 4 | 4 | 3 | 2 | **pass-with-edits** | What: why DubaiPoints exists. Why trust it: not answered above the fold — two paragraphs of body copy, no fact strip. |
| `/404.html` | 404 | 5 | 5 | 5 | 4 | 4 | 5 | 3 | **pass** | What: page not found, plainly. Next: six section tiles. Real 404 status on the live host. |

**Notes per template**

- `/` — Two P1 a11y defects (hamburger keyboard, colour-only link); salary rows lack an end date; gold carries five jobs on one page (known-open May 2026). _(rated by council:head-of-ux)_
- `/cards/adcb-365-cashback/` — Strongest template on the site. Edits: 11px gold eyebrows at 3.02:1 (F-004); value-breakdown third hues and contained horizontal scroll at 360/390 (F-005); title length (F-034). _(rated by orchestrator)_
- `/guides/best-premium-cards-2026/` — Byline + image + jump nav above the fold; prose tables scroll inside .dp-prose. Dark-mode newsletter rail fails contrast (F-003). _(rated by orchestrator)_
- `/news/adcb-365-cashback-earn-table-rebalance-2026/` — Text-heavy above the fold (kill-list fence 1). Titles run to 138 chars and descriptions to 334 (F-034). 31-Aug stories still lead the live index (F-017). _(rated by orchestrator)_
- `/airlines/accor-all/` — Fact-tile strip works; the 10px gold expiry label is 3.21:1 (F-004); hotel programmes sit under /airlines/ (F-030). _(rated by orchestrator)_
- `/banks/adcb/` — A gold trust callout used for an empty state; its label is 2.75:1 (F-004) and the empty-state text 2.07:1 in dark mode. Footer/hub card CTAs 3.15:1. _(rated by orchestrator)_
- `/salary-transfer/` — Flagship product, weakest mobile fold on the site (F-019). Mint/green chip palette outside navy/gold (F-006); aria-expanded on table rows (F-008); eight bank pages orphaned by the island (F-013). _(rated by orchestrator)_
- `/salary-transfer/calculator/` — Salary pre-filled with 20000; result headings repeat the bank name and glue the rank (F-038); ranked the lapsed RAKBANK offer #2 live (F-002). _(rated by orchestrator)_
- `/cards/cashback/` — Title stamp is the build month (extends F-014); 8 of 121 long titles are these pages. _(rated by orchestrator)_
- `/cards/` — Centered head is the only centred page head on the site (idiom drift, cosmetic). _(rated by orchestrator)_
- `/cards/compare/` — 121 sub-44px targets at 360 (F-026). _(rated by orchestrator)_
- `/cards/finder/` — URL params not reflected in the controls; CLS 0.258; largest DOM (F-039, F-027). _(rated by orchestrator)_
- `/salary-transfer/history/adcb/` — One inbound link each (F-013); Lighthouse 100/100. _(rated by orchestrator)_
- `/news/` — Nested <main> (F-009); search form posts to / (F-015); stale 31-Aug leads live (F-017). _(rated by orchestrator)_
- `/guides/` — Mobile Lighthouse 76 — 1.4 MB above the fold (F-010); nested <main>. _(rated by orchestrator)_
- `/airlines/` — Directory .cta 2.21:1 in dark mode (F-003); hotel programmes filed here (F-030); 161 words for six tiles. _(rated by orchestrator)_
- `/about/` — F-051; Lighthouse 100/100. _(rated by orchestrator)_
- `/404.html` — Model page for the rest of the site's density. _(rated by orchestrator)_

Weakest three by scannability + hierarchy + density + mobile-first: `/salary-transfer/`, `/about/`, `/news/adcb-365-cashback-earn-table-rebalance-2026/` — these are the templates the plan's dry rounds would have revisited; they are where the Head of UX's next pass should start.


## 6. Performance (Lighthouse 13.4, local uncompressed serve — pessimistic)

| Route | Preset | Perf | A11y | BP | SEO | LCP ms | CLS | Above-fold KB |
|---|---|---|---|---|---|---|---|---|
| `/` | desktop | 97 ⚠ | 96 | 96 | 100 | 1326 | 0.006 | 1486.2 |
| `/` | mobile | 77 ⚠ | 97 | 96 | 100 | 5856 | 0 | 948 |
| `/404.html` | desktop | 100 ⚠ | 100 | 96 | 100 | 383 | 0.006 | 247.4 |
| `/404.html` | mobile | 100 | 100 | 96 | 100 | 1503 | 0 | 197.4 |
| `/about/` | desktop | 100 | 100 | 96 | 100 | 372 | 0.001 | 164.8 |
| `/about/` | mobile | 100 | 100 | 96 | 100 | 1503 | 0 | 164.8 |
| `/airlines/accor-all/` | desktop | 98 ⚠ | 96 | 96 | 100 | 1046 | 0.006 | 910.4 |
| `/airlines/accor-all/` | mobile | 78 ⚠ | 96 | 96 | 100 | 5557 | 0 | 910.4 |
| `/banks/adcb/` | desktop | 99 ⚠ | 96 | 96 | 100 | 922 | 0.006 | 806.7 |
| `/banks/adcb/` | mobile | 81 ⚠ | 97 | 96 | 100 | 4956 | 0 | 806.7 |
| `/calculator/` | desktop | 99 ⚠ | 96 | 96 | 100 | 735 | 0.005 | 536.9 |
| `/calculator/` | mobile | 82 ⚠ | 97 | 96 | 100 | 3756 | 0 | 536.9 |
| `/cards/` | desktop | 100 ⚠ | 100 | 96 | 100 | 733 | 0.006 | 2213.1 |
| `/cards/` | mobile | 92 ⚠ | 100 | 96 | 100 | 3078 | 0 | 848.3 |
| `/cards/adcb-365-cashback/` | desktop | 100 ⚠ | 97 | 96 | 100 | 764 | 0.006 | 580.9 |
| `/cards/adcb-365-cashback/` | mobile | 92 ⚠ | 97 | 96 | 100 | 3152 | 0 | 398.1 |
| `/cards/cashback/` | desktop | 100 | 100 | 96 | 100 | 375 | 0 | 177.8 |
| `/cards/cashback/` | mobile | 100 | 100 | 96 | 100 | 1503 | 0 | 177.8 |
| `/cards/compare/` | desktop | 100 ⚠ | 100 | 96 | 100 | 412 | 0.006 | 236.7 |
| `/cards/compare/` | mobile | 98 ⚠ | 100 | 96 | 100 | 1957 | 0 | 203.7 |
| `/cards/finder/` | desktop | 87 ⚠ | 97 | 96 | 100 | 564 | 0.258 | 475 |
| `/cards/finder/` | mobile | 89 ⚠ | 97 | 96 | 100 | 3003 | 0 | 424.3 |
| `/deals/` | desktop | 100 ⚠ | 97 | 96 | 100 | 664 | 0.006 | 425.3 |
| `/deals/` | mobile | 95 ⚠ | 97 | 96 | 100 | 2781 | 0 | 350.5 |
| `/guides/` | desktop | 96 ⚠ | 100 | 96 | 100 | 1369 | 0 | 2351.3 |
| `/guides/` | mobile | 76 ⚠ | 100 | 96 | 100 | 6460 | 0 | 1375.5 |
| `/guides/best-premium-cards-2026/` | desktop | 100 ⚠ | 100 | 96 | 100 | 643 | 0 | 477.6 |
| `/guides/best-premium-cards-2026/` | mobile | 92 ⚠ | 100 | 96 | 100 | 3303 | 0 | 477.6 |
| `/news/` | desktop | 99 ⚠ | 100 | 96 | 100 | 989 | 0.006 | 1267.7 |
| `/news/` | mobile | 82 ⚠ | 100 | 96 | 100 | 4653 | 0 | 882.8 |
| `/news/adcb-365-cashback-earn-table-rebalance-2026/` | desktop | 98 ⚠ | 100 | 96 | 100 | 1163 | 0 | 1100.2 |
| `/news/adcb-365-cashback-earn-table-rebalance-2026/` | mobile | 77 ⚠ | 100 | 96 | 100 | 6602 | 0 | 1100.2 |
| `/salary-transfer/` | desktop | 100 ⚠ | 96 | 96 | 100 | 493 | 0.001 | 261.9 |
| `/salary-transfer/` | mobile | 98 ⚠ | 100 | 96 | 100 | 1803 | 0 | 261.9 |
| `/salary-transfer/calculator/` | desktop | 100 ⚠ | 96 | 96 | 100 | 444 | 0.006 | 220.8 |
| `/salary-transfer/calculator/` | mobile | 99 ⚠ | 96 | 96 | 100 | 1653 | 0 | 220.8 |
| `/salary-transfer/history/adcb/` | desktop | 100 ⚠ | 100 | 96 | 100 | 454 | 0 | 249.8 |
| `/salary-transfer/history/adcb/` | mobile | 100 ⚠ | 100 | 96 | 100 | 1520 | 0 | 249.2 |
| `/search/?q=cashback` | desktop | 100 ⚠ | 96 | 96 | 100 | 535 | 0.018 | 379.2 |
| `/search/?q=cashback` | mobile | 94 ⚠ | 96 | 96 | 100 | 2453 | 0.029 | 379.2 |

Reading: desktop is 96–100 everywhere; mobile falls to 76–82 exactly on the templates that ship a hero photograph (home, guides index, story, programme, hub, calculator) and stays 92–100 on text-first templates. The Technical Lead's 200 KB above-fold budget is exceeded on 156 of 199 routes (probe measurement; median 415 KB, maximum 2.8 MB on `/deals/etihad-fare-sale-july-2026/`). One route exceeds CLS 0.1 (`/cards/finder/`, 0.258). The remedy is a single pipeline change (F-010), not per-page work. Run `npm run audit:lighthouse -- --base https://dubaipoints.ae` from Actions or a workstation for compressed figures before setting targets.

## 7. Accessibility (axe-core 4.13, WCAG 2.x A/AA + best-practice; 199 routes)

| Rule | Impact | Routes (light) | Nodes (light) | Routes (dark, contrast only) | Nodes (dark) | Finding |
|---|---|---|---|---|---|---|
| `region` | moderate | 199 | 1194 | — | — | F-024 |
| `color-contrast` | serious | 83 | 346 | 87 | 510 | F-003, F-004 |
| `landmark-unique` | moderate | 10 | 10 | — | — | F-009 |
| `landmark-main-is-top-level` | moderate | 8 | 8 | — | — | F-009 |
| `landmark-no-duplicate-main` | moderate | 8 | 8 | — | — | F-009 |
| `aria-conditional-attr` | serious | 6 | 29 | — | — | F-008 |
| `link-in-text-block` | serious | 2 | 2 | — | — | F-022 |
| `heading-order` | moderate | 1 | 1 | — | — | F-045 |
| `label-title-only` | serious | 1 | 1 | — | — | F-025 |

Beyond axe: the hamburger fails Enter / Space / Escape on every route (F-007); four directory search inputs and the Pagefind clear button have no visible focus (F-025); 13,038 of 18,963 interactive elements at 360 px are under 44 px and 4,975 under the WCAG 2.2 24 px floor (F-026); the homepage h1 is announced as one word (F-040); footer bank rows read their fallback initials (F-046). Everything else the Tab-walk recorded showed a visible ring, and no route reported console errors, missing alt text or a missing h1.

## 8. Links, anchors, forms, static config

- **Internal:** 14,024 root-relative hrefs, 0 broken (`scripts/ci/check-links.mjs`, runs on every build).
- **In-page anchors:** 576 checked, 1 broken — `#cashback-vs-cashback-plus` on `cards/liv-cashback/index.html` (F-036). **Forms:** 8 GET search forms post to `/` (F-015).
- **External (Actions run 34098558459):** 150 distinct URLs — ok 108, broken 18 (client-error 6, timeout 8, network 4), unverifiable 21 (ADCB 13, Central Bank 3, Al Hilal 2, CBD 2, Salik 1), cross-host redirects 3 (F-016). Full tables in `external-links.md`.
- **Redirects:** 2 rules, 0 problems. **Headers:** no `public/_headers` — six recommended headers absent (F-041). **Sitemap:** 198 URLs, identical to the build; `robots.txt` disallows `/design-spike/`, `/style-guide/`, `/dev/`, none of which is in the sitemap.
- **Chrome (A1):** 232 rows across 14 surfaces; 12 mystery labels, 1 empty destination, 15 thin destinations, 18 pages reached by three or more different labels, 10 rows recommended for cutting — `.council/audits/2026-09-06-link-audit.md`.

## 9. SEO and Firecrawl tooling

**SEO.** Filed in full as the first quarterly audit at `.council/seo/audit-2026-Q3.md` (S-01…S-14). In one line: mechanical hygiene fails this quarter on title stamps generated from the build date (F-014), title and description lengths (F-034), orphaned tracker pages (F-013), misdirected search forms (F-015), six dead citations (F-016) and the schema spec/shipped mismatch (F-035); dubaipoints.ae is absent from all six UAE money queries in Firecrawl's index (F-048, VERIFICATION HOLD pending Search Console).

**Firecrawl — what was used, what it cost, what it revealed.**

| Tool | Use in this audit | Credits |
|---|---|---|
| map dubaipoints.ae | — | 1 |
| homepage probe scrape (branding+links+screenshot) | — | 1 |
| sub-agent MCP probe scrape /about/ | — | 1 |
| fleet scrapes before session-limit cuts (18 pages, mobile full-page) | — | 18 |
| desktop template screenshots (34) | — | 34 |
| branding ×4 | — | 4 |
| searches: site: + 6 money/brand queries (2 each) | — | 14 |
| developer_search ×2 | — | 0 |
| agent benchmark jobs ×2 (reported creditsUsed 0) | — | 0 |
| crawl chunks markdown/links/summary c1–c10 (+3 single-page misfires) | — | 204 |
| probes: 404, redirect, changeTracking, query directQuote (5) | — | 8 |
| screenshot crawls mobile full-page (8 chunks) | — | 201 |
| interact sessions (5 completed, 5 timed out) — no creditsUsed reported by the tool | — | 0 |
| monitor list/checks reads | — | 0 |
| **Total** | | **486 of 1000** |

Notes for the Head of Research SOP (F-061): `crawl` through the MCP transport must be chunked (≤ 40 pages per call, hub start URL + `crawlEntireDomain`) to fit the 60-second limit; `interact` completes only with single-action prompts; `agent` and `interact` do not report `creditsUsed`, so the dashboard is the only record of their cost; sub-agents can hold the MCP tools (CLAUDE.md corrected in this PR).

**Monitor health (F-020).** 42 monitors on the key (5 dubaipoints, 37 other projects); API-estimated 20,920 credits/month in total and 2,590 for dubaipoints against a documented 5,000-credit Hobby plan and a design estimate of 1,154; automation-state recorded 3,704 credits in August. The fee-docs monitor bills ≈99 credits per daily check against an estimate of 20 (PDF pages bill individually — the risk `setup.mjs` names); the 30 August product-pages check carries `billingStatus: failed`.

**Proposed self-monitor (F-060, not created).** Markdown-mode monitor, weekly, on twelve routes (home, tracker, salary calculator, /cards/, one card review, one guide, /news/, one story, /valuations/, /about/, a 404 probe URL, sitemap-index); goal text "a section disappeared, a build or deploy marker appeared, a headline figure changed"; ≈ 52 credits/month; provisioned through `scripts/monitor/setup.mjs` on Chairman direction only.

**Playground features.** No change to the 29 Aug §3 ruling; none were used.

**Competitor pattern benchmarks (agent jobs; reference only, never a data source).** `agent-benchmark.json` records how moneyluna, Head for Points and The Points Guy — and the UAE aggregators — handle navigation IA, comparison tables, calculators, mobile patterns and trust signals. Two patterns recur across all of them and are absent here: a persistent search field on every width, and per-page social images. Both already appear in this report as F-025/F-057-class items; nothing else in the benchmark warranted a new finding.

## 10. Decision questions for the Chairman

Written by the Chairman agent from the finished findings list (Council synthesis, run one agent at a time after the session-limit reset). Reproduced verbatim; the source file is kept with the evidence as `chairman-decision-questions.md`.

### Chairman — decision questions and gate note

**Audit:** 2026-09-06 site-wide UI/UX audit, 72 verified findings (F-001…F-072).
**Date:** 7 September 2026.
**Scope of this note:** the twelve `DECISION REQUIRED` findings, grouped into ten
rulings; the publish-blocking set for the next deploy; a five-line same-day
gate note.

Standing rule for everything in §1: these are Charter-level or
Chairman-sole-authority items. They are framed, not defaulted. A session that
picks an option here without a direction it can quote is committing the
discipline failure the 2026-08-06 amendment names.

On the approval mechanism: this note becomes Stage 7 approval for the hotfix
scope in §2 only when the Chairman says so in-session (2026-08-06 amendment).
The sign-off cell is filled on that word, with the mechanism and date in Notes;
the session does not fill it on the strength of this document. Per the
2026-08-07 amendment CI will not block a PR that omits the block — that makes
the block more, not less, mandatory.

---

#### 1. Rulings required

##### R1 — Palette: is a third hue ever permitted, and where? (F-005, F-006)

**Question.** Does the no-third-hue rule admit a data-visualisation exemption
for the AED value-breakdown bars, and does the light-theme tracker retire its
mint/green survivors — or is the rule absolute and both are remapped into the
navy and gold families?

**What the audit found.** `AEDValueBreakdown.astro` encodes polarity with
`#3f9068` green and `#b46a55` terracotta (F-005). The salary-transfer tracker
block still carries a light-theme `--mint` (`#8FD3B3`) and a `#235F46` green,
strong enough that a live branding extraction resolves the *site's* primary to
mint rather than navy (F-006). The dark theme already retired its teal on
25 July; the light theme did not follow. `#235F46` sits close to the
2026-05-09 "deep editorial green" that the 2026-05-16 navy directive
superseded — the tracker looks like a pre-16-May survivor, not a design choice.

**Options.**

- **(a) Enforce the rule as written.** Segment 2 → navy tint (`#5b7d93`), fee
  bar → `--ink-soft` with a diagonal hatch; retire `--mint`; restyle `.dpst`
  chips navy/gold. T2 (Standards + UX + section editor + Chairman). No Charter
  text changes. Cost: polarity in the value bar is carried by pattern and
  label rather than hue — which is also the accessible answer, since colour
  alone was never a compliant encoding.
- **(b) Narrow exemption for the value bar only, logged as an Amendment.**
  The bar keeps a two-hue positive/negative encoding as a declared
  data-visualisation palette; `--mint` and the tracker chips still go navy/gold.
  T2 for the code + a Chairman-authored Amendments entry. Cost: the "closed"
  two-family system acquires its first named exception; every future chart
  will cite it.
- **(c) Broader exemption for status semantics.** Value bar *and* tracker
  status chips (live / ended / paused) may use a traffic-light encoding. T2 +
  Amendment. Cost: the tracker stays visually a different publication from the
  rest of the site, which is precisely what F-006 measured.

**Charter refs.** Amendments 2026-07-25 ruling 2 ("Any future colour outside
these two families … requires an explicit Chairman ruling before merge");
Part II "Two-accent system" (each colour has a single job); Amendments
2026-05-09 and 2026-05-16 (palette history); Chairman mandate — authorises
any change to the design idiom in `src/styles/global.css`.

**Adjacent, not a ruling.** F-004's proposed `--gold-ink` (`#8a6118`) is a
darker shade of the gold family for ≤14px labels, not a new hue. It proceeds
inside its T2 PR unless the Chairman wishes to reserve the token name.

**Why not defaulted.** The 25 July amendment reserves this question to the
Chairman in terms. Option (a) is the only one a session could ship without
touching the Charter, but shipping it silently would also foreclose (b) and
(c) without the Chairman having seen the trade.

---

##### R2 — Homepage: which page is the ratified one, and what does the H1 say? (F-033, F-052; F-040 wording)

**Question.** Does the record catch up to the shipped eight-band homepage
(photo hero, boxed idiom, gold band exception, italic two-beat H1) by a dated
Amendment, or does the page return toward the ratified four-section Quiet
Ledger spec — and, either way, does the H1 gain a topical noun?

**What the audit found.** The record contradicts itself three times over.
SITE_ARCHITECTURE.md:281-301 ratifies a four-section homepage with "no images,
no hero photography". The implementation-status row at :343 says the 29 Aug
rebuild shipped "as 5 sections … typographic hero, no photo". The live page has
eight bands and a photo hero. The overriding 29 Aug direction exists only as a
code comment in `index.astro` (F-033). Separately, SITE_ARCHITECTURE §5.4
(2026-05-08 append) removed italic display words site-wide, and the H1 uses an
italic `<em>`; F-040 also reports the `<em>` is announced as "Payless" because
of how the space is set. The H1 "Fly further. Pay less." carries none of the
title's terms and no topical noun (F-052).

**Options.**

- **(a) Ratify the shipped page.** Supersede SITE_ARCHITECTURE §4 with a
  description of the eight bands; log the 29 Aug direction (photo hero, boxed
  idiom, gold band exception, italic em) as a dated CLAUDE.md Amendment. T1 doc
  change, Chairman-authored; zero code. Cost: the 2026-05-08 Quiet Ledger
  homepage decision is formally reversed and the §5.4 italic rule needs a
  carve-out.
- **(b) Return to the four-section spec.** T3 — new homepage sections are full
  council; the tools band, start-here directory and trust close go. Cost:
  large rebuild; F-021/F-032/F-047 lose their surfaces and would need
  re-framing; it discards direction the Chairman gave nine days ago.
- **(c) Ratify with pruning.** Keep hero + live desk + latest analysis + trust
  / newsletter close as the spine; direct Head of UX + Standards to fold the
  remaining bands (the audit's F-053, F-066 observations point where). T3
  because it changes sections above and below the fold; Amendment as in (a).

**H1 sub-ruling** (composition was the Chairman's 29 Aug direction, so wording
escalates):

- (i) keep "Fly further. Pay less."; fix only the space/nowrap bug (F-040). T2.
- (ii) "Fly further. *On a Dubai salary.*" — keeps the two-beat, adds the
  noun. T2 (Standards + UX + Chairman).
- (iii) another line of the Chairman's choosing.

**Charter refs.** Chairman mandate — "Own the homepage and any pillar-page IA
change"; tier-escalation trigger "anything that changes the homepage above the
fold"; Amendments 2026-05-25 (layout amendment, palette unchanged); Amendments
2026-07-25 ruling 3 (v0 output is a mockup; placeholder copy must not survive
translation); SITE_ARCHITECTURE.md:281-301 and :343; SITE_ARCHITECTURE §5.4
append (italic display words removed).

**Why not defaulted.** The homepage is the one page the Charter names as the
Chairman's own. Only he can say whether 29 Aug superseded 8 May. The H1 is his
sentence. Writing SITE_ARCHITECTURE to match the page without a ruling would
launder a code comment into policy.

---

##### R3 — Newsletter: launch it, or stop the chrome from promising it? (F-012; F-042, F-043)

**Question.** Does the Friday brief launch now (Buttondown configured, list
live), or does every "Join brief" CTA in the header, first mobile-overlay row,
footer and homepage band come down or change state until it does — and what is
the product called in chrome?

**What the audit found.** The primary chrome CTA on every route lands on
`/newsletter/`, which says the brief has not launched (F-012). "Join brief" is
a mystery label that wraps at 1280px (F-042). The homepage states launch-pending
three times while two CTAs still say "Join" (F-043). The fallback mailto is
indistinguishable from body text (F-022, proceeds regardless).

**Options.**

- **(a) Launch.** Configure the Buttondown env var; Technical Lead confirms
  double opt-in and the privacy page describes the processing; Growth &
  Analytics owns the list. Chrome then tells the truth with a label change
  only. T2 chrome + a privacy-posture check (a Technical Lead escalation item).
  Cost: commits the Chairman to the weekly Friday send named in his own
  operating rhythm — an editorial obligation, not a config change.
- **(b) Hold launch; make chrome honest.** Gate label and visibility on
  `newsletterLive`: hide the header pill and footer CTA until live; keep
  `/newsletter/` as a pre-launch page with the underlined mailto. Delete the
  hero micro block (F-043). T2 (Standards + UX + Chairman — header is above
  the fold on every route). Cost: loses the one acquisition CTA the site has,
  though it currently acquires nothing.
- **(c) Hold launch; keep a visible CTA, relabelled.** "Newsletter" or
  "Newsletter — launching soon". T2. Cost: still routes readers to a dead end;
  the honest-nav rule exists for exactly this.

**Label sub-ruling.** "Join brief" (product-name-first, needs the reader to
know what the brief is) versus "Newsletter" (job-first). Standards Editor
recommends "Newsletter"; the Chairman may want "Friday brief" kept as the
product name on the page and "Newsletter" in chrome.

**Charter refs.** Amendments 2026-07-27 ruling 4 (honest-nav: navigation may
only link to content that exists); Chairman mandate — homepage above the fold;
escalation paths — Growth & Analytics; Technical Lead → privacy/cookie posture;
Chairman operating rhythm ("read the Friday recap before it sends").

**Why not defaulted.** Launching a subscriber list creates a data-processing
obligation and a weekly editorial commitment. Taking the CTA down changes the
header on 199 routes. Neither is a session's call; the mechanical parts
(F-043 hero block deletion, F-042 `nowrap`, F-022 underline) are, and they
proceed.

---

##### R4 — Calculators: one tool or two? (F-032; F-021)

**Question.** Do `/calculator/` (spend-return) and
`/salary-transfer/calculator/` (salary-transfer reward) stay two tools with
honest names and a nav slot each, or merge under `/salary-transfer/calculator/`
behind a mode switch?

**What the audit found.** Open since 22 August and still open on 29 August
(two sessions have deferred it). The 29 Aug rebuild gave `/calculator/` its
first nav link and mislabelled it "Welcome-bonus calculator" — a tool that
states on its own page it does not score welcome bonuses (F-021). One
salary-transfer product carries seven different labels across chrome (F-031,
proceeds regardless).

**Options.**

- **(a) Keep both; relabel; give `/calculator/` an honest nav slot.**
  "Spend-return calculator / See which card pays back most on your monthly
  spend" at index.astro:422-423 and :274-275; a nav row of the same name. T2.
- **(b) Merge.** One island under `/salary-transfer/calculator/` with a
  spend / salary mode switch; 301 `/calculator/`. T3 — route removal, redirect
  map, island rework. Cost: a slug rename after publish (Chairman-only) and a
  salary-transfer URL hosting a tool that has nothing to do with salary
  transfer.
- **(c) Keep both; relabel; no new nav slot.** Revisit when a welcome-offer
  break-even tool — a new brief — exists and the tools band has three honest
  entries. T2.

**Charter refs.** Chairman decision rights — slug renames after publish
(redirect map owned by Technical Lead); Amendments 2026-07-27 ruling 4
(honest-nav, applied to labels naming what they link to); 29 Aug audit §2.4
(known-open).

**Why not defaulted.** It has been defaulted twice already; that is why it is
still open and why a false label reached the homepage. The relabel (F-021) is
not contingent and ships this week whichever option is chosen.

---

##### R5 — Hotel programmes: do they keep living under `/airlines/`? (F-030)

**Question.** Do Marriott Bonvoy, Hilton Honors and Accor ALL move out of
`/airlines/` — to a renamed `/programmes/` (all six programme URLs move) or a
new `/hotels/` (three move) — or do the URLs stay and only the nav label
"In the programme directory" is made honest?

**Options.**

- **(a) Rename `/airlines/` → `/programmes/`** (or `/loyalty/`) with 301s for
  all six current URLs in `public/_redirects`; update the programs collection
  base path, header arrays, footer "Programmes" column, sitemap,
  BreadcrumbList. T3. Cost: every programme URL changes; SEO equity on the
  airline set is put at risk to fix three hotel pages.
- **(b) Split by currency.** Airlines stay at `/airlines/`; hotel programmes
  move to `/hotels/` with three 301s. Mirrors the desk boundary ("currency
  governs") and the existing `/news/airlines/` / `/news/hotels/` split. T3,
  smaller blast radius, but it is a new top-level destination.
- **(c) URLs unchanged; fix the label and directory heading.** Nav row reads
  what it links to; `/airlines/` gains a "Hotel programmes" sub-heading. T2.
  Cost: the URL keeps telling readers and search engines that Bonvoy is an
  airline.

**Charter refs.** Chairman decision rights — slug renames after publish;
Chairman mandate — adoption of a new top-level vertical; Amendments 2026-07-27
rulings 1 and 4 (currency governs; honest-nav; de-scoped hotel programme rows
return only behind real briefs); SITE_ARCHITECTURE 2026-05-08 §3 ("no new
top-level destinations").

**Why not defaulted.** Slug renames after publish and new top-level routes are
both enumerated Chairman-only decisions. SEO Strategist proposes; the Chairman
rules; Technical Lead owns the redirect map.

---

##### R6 — Schema: which §9 is canonical? (F-035)

**Question.** Is the written §9 structured-data spec the standard the 24
non-compliant templates must be brought up to, or is what ships the standard
and §9 is rewritten to match — or is a reconciled spec drafted first?

**Options.**

- **(a) Ship is canonical.** Rewrite §9 to describe current output; then add
  the items that need no ruling. T2 for the additions + a standards amendment.
  Cost: ratifies drift as policy.
- **(b) Spec is canonical.** Bring every template up to §9 with a
  schema-per-template test. T3 (touches every layout). Cost: largest
  implementation; some §9 entities may no longer match the site (e.g. author
  data must be `Organization` only under the 2026-08-05 byline exception).
- **(c) Reconcile first.** Technical Lead + SEO Strategist draft a reconciled
  §9 within the week; Chairman ratifies; implementation is T3 behind it.

**Proceeds regardless (no ruling needed, per the finding):** `CollectionPage` +
`BreadcrumbList` on the directories, `BreadcrumbList` on the tracker family,
fill or delete `sameAs`.

**Charter refs.** Chairman "does not freelance" — schema implementation is
Technical Lead's; Council table — SEO Strategist owns schema spec; Amendments
2026-08-05 (§8: structured author data is `Organization` only until a named
contributor is published); §6 (schema numerics come from L2, never
LLM-extracted); Charter amendment procedure.

**Why not defaulted.** §9 is house standard. Two candidate specs disagree, and
silently picking one is exactly how the drift happened.

---

##### R7 — Security headers: does `public/_headers` ship, and with what in it? (F-041)

**Question.** Does the site adopt `public/_headers` now — and if so, the full
printed recommendation including HSTS and a report-only CSP, or a conservative
subset?

**Options.**

- **(a) Full recommendation.** X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy, X-Frame-Options, HSTS, report-only CSP; observe reports
  for two weeks before enforcing. T3 (Chairman + Technical Lead, per Part II).
  Cost: HSTS `max-age` is a commitment that is slow to walk back; a CSP report
  endpoint is a new outbound data flow (privacy posture); inline scripts — the
  theme toggle and F-007's proposed nav script — need hashes or nonces before
  enforcement.
- **(b) Static five, no CSP, short HSTS.** The four content/referrer/frame/
  permissions headers plus HSTS with a short `max-age` and no preload. Still
  T3, materially lower risk; CSP returns as a separate item once the inline
  script inventory is known.
- **(c) Defer to Q4** alongside the F-010 image pipeline work, which also
  touches every page's asset URLs.

**Charter refs.** Part II "Audit harness" ("`public/_headers` is still a
recommendation … adding it is a T3 production change"); Technical Lead
escalation — privacy/cookie posture; Chairman decision rights — changes
materially affecting hosting.

**Why not defaulted.** Named T3 in the Charter. HSTS has lock-in; CSP can
silently break the islands and the theme toggle; a reporting endpoint is a
privacy decision.

---

##### R8 — Self-monitor: should the site watch itself through Firecrawl? (F-060)

**Question.** Is a Firecrawl monitor on dubaipoints.ae provisioned, and if so
before or after the credit-budget verification hold clears?

**Options.**

- **(a) Provision now** via `scripts/monitor/setup.mjs`. T3. Cost: F-020
  reports the key already carries 42 monitors at an API-estimated 20,920
  credits/month against a documented 5,000-credit plan, with fee-docs billing
  ~5× its estimate. Adding a monitor to a budget in verification hold is
  spending money nobody has counted.
- **(b) Defer until F-020 clears** (plan tier confirmed; ownership of the
  other 37 monitors established). Revisit with real numbers.
- **(c) Decline.** The deterministic audit harness (`npm run audit:all` in
  Actions) is the site's self-check at zero credits; a Firecrawl judge
  watching our own pages introduces an LLM opinion loop the §6 boundary was
  built to keep out of the pipeline.

**Charter refs.** Non-negotiable 2 (Firecrawl exclusive to the Research arm);
Part II "Monitoring" — budget paragraph and `MAX_ESTIMATED_CREDITS`; "The §6
boundary is the whole design"; Part II "Audit harness".

**Why not defaulted.** The user chose propose-only. Credits are money; the
budget is unverified; and it is a posture question whether the site should
monitor itself with the same tool it uses on issuers.

---

##### R9 — Deals: does a three-deal desk keep a primary nav slot? (F-047; F-013 sub-question)

**Question.** Does the lifestyle desk commit to a deals cadence sufficient to
justify a primary nav slot, a homepage directory tile and a Travel-panel row
before the DSF season — or does `/deals/` leave the nav until it has volume?

**Options.**

- **(a) Commit the desk to a cadence** (≥ 6 live deals, a ceiling like the
  news desks' 2–3/week) under a brief, before DSF. Resourcing decision, not a
  code change; the nav stays.
- **(b) Drop the nav slot and the Travel row until volume.** The route, the
  homepage live-desk deals column and the RSS band stay. T2 chrome (Standards +
  UX + section editor + Chairman). Cost: the first time the site removes a
  vertical from primary navigation.
- **(c) Keep the slot; make the count honest** ("Deals · 3 live") and let the
  number argue for itself. T2.

**Sub-question (from F-013).** Expired deals: 301 to `/deals/` or keep as
dated records with an "Ended" banner? The house has a precedent — salary-
transfer offers move to a history collection and render a dated "ended"
sentence rather than vanish. The section editor can follow it, but the
Chairman should say so once so it is a rule, not a habit.

**Charter refs.** Chairman decision rights — adoption or removal of a
top-level vertical; Amendments 2026-07-27 rulings 1 and 4 (cadence ceilings;
honest-nav); Non-negotiable 1 (DSF enters the calendar by default).

**Why not defaulted.** Removing a vertical from navigation is Chairman-only;
committing a desk to a cadence is a resourcing decision between Managing
Editor and Chairman. A session can do neither.

---

##### R10 — Valuations: fulfil the Q3 promise or retract it? (F-018)

**Question.** Do floor/ceiling valuations land for the ten programmes before
the 30 September methodology promise expires, or are the three empty columns
cut and the promise re-dated or withdrawn?

**What the audit found.** Three of seven columns are dashes on every row. The
methodology page promises them "in Q3". The ten baselines cross 90 days on
8 September — tomorrow — so the staleness chip goes amber whichever way this
is ruled.

**Options.**

- **(a) Fulfil.** Fact-Checker derives floor/ceiling for all ten under the
  2026-06-12 baseline ruling (cost-basis fils values; cash-fare-avoidance
  figures labelled, never the baseline; every number traceable, no LLM
  extraction). T3 — the first published valuation ranges are precedent-setting
  in the same way the 2026-05-25 amendment treated the first card-review
  score. Cost: three weeks of Fact-Checker time against a hard date.
- **(b) Cut the columns; re-date the promise** to Q4 with one honest sentence
  on why. T2 (Standards + UX + section editor + Chairman). Cost: a public
  commitment slips, visibly.
- **(c) Cut the columns; withdraw the promise;** log it in the corrections
  record. T2. Cost: retraction of a stated commitment — honest, and in keeping
  with the 2026-06-12 ruling 3 posture (claim only what the site can
  demonstrate).

**Regardless of ruling:** Fact-Checker re-verifies the ten baselines this week
(a re-verification, not a re-derivation — T1 `lastVerified` bumps where the
source is unchanged).

**Charter refs.** Amendments 2026-06-12 ruling 2 (baseline) and ruling 3
(trust posture); Non-negotiable 6 (§6 typed numerics); Part II editorial
guarantees (90-day freshness); Chairman "does not freelance" — never overrule
the Fact-Checker without a logged paragraph; Amendments 2026-05-25 (first
score returns to the Chairman).

**Why not defaulted.** A dated public promise is editorial posture; whether the
site keeps, moves or withdraws it is the Chairman's word to readers.
Publishing valuation ranges for the first time sets precedent. And the ruling
has a real deadline: if (a) is to be possible it must be given this week.

---

#### 2. Publish-blocking for the next deploy

**Blocking:** **F-001**, **F-002**.

- **F-001** — main has been unbuildable since 1 September; production is the
  30 August artefact. The fix is already on the branch
  (`src/lib/salaryTransferCoverage.ts`, `getLapsedUnarchivedOffers()`, five
  tests). Everything else in this audit reaches a reader only after this
  merges.
- **F-002** — the RAKBANK salary-transfer offer ended 31 August and is shown
  as live on the tracker, the homepage live desk, the RAKBANK page and — the
  part a reader can act on — ranked in the calculator. A reader could move
  their salary for a reward that no longer exists. That is the false statement
  test met squarely. The archive move (`salaryTransferOffers` →
  `salaryTransferOfferHistory`, `archived: true`, reason "campaign ended
  31 Aug 2026") ships in the same PR as F-001; the build warns until it does.

**Same day, not blocking:** **F-017** (four 31-August news stories in the
future tense). It is a false tense with the date visible, not an actionable
product claim, and holding the P0 for two desks' edits would keep F-002 live
longer. It is the next PR behind the hotfix, today.

**Considered and not blocking:** F-021 (mislabelled tile — reader discovers
the mismatch on the next page, no financial claim); F-014 (build-month stamps
imply verification — see gate line 3, it is first in the week's queue because
the hotfix deploy will restamp pages "September 2026"); F-023 (mooted by
F-002 for now); F-016 (dead citations are not false statements; six 404s go in
the T1 batch, the rest are on verification hold).

**Tier and sign-off for the hotfix PR.** T2, not T1: the hotfix renders a new
dated "ended" sentence, and new chrome strings under-tier a T1 by the
Charter's own rule. Required: business-realestate editor, Head of UX, Standards
Editor, Chairman. Technical Lead lists in the PR body everything merged to main
since 1 September — it all deploys with this and the Chairman should know what
lands.

---

#### 3. Gate note — 7 September 2026 (same-day rubric)

1. **Ships now (P0 hotfix, one PR, T2):** F-001 + F-002 together, build
   warning-free; the PR body lists everything merged since 1 Sept because it
   all deploys; nothing else rides. Approval is on the Chairman's word
   in-session.
2. **Today, next PR behind it (T1 batch, section editors + Chairman):** F-017
   four 31-Aug stories bumped or archived; F-009, F-011, F-015, F-028, F-036,
   F-037, F-045, F-046; F-016's six confirmed 404s.
3. **Within the week (one T2 PR per owner; Standards + UX + section editor +
   Chairman):** F-014 first — this deploy restamps pages "September 2026"
   without re-verifying anything — then F-003, F-004 (gold-ink is a
   within-family shade), F-007, F-008, F-019, F-021 relabel, F-022, F-023,
   F-024, F-025, F-026, F-031, F-043, F-040 spacing only, F-044, F-053,
   F-055; Fact-Checker re-verifies the ten valuation baselines (cross 90 days
   tomorrow).
4. **Verification holds report back by Wednesday 9 Sept before anything
   spends credits:** F-020 (Technical Lead: plan tier, whose 37 monitors,
   fee-docs billing) and F-048 (Growth: Search Console); F-060 does not move
   until F-020 clears.
5. **Waits for rulings R1–R10, due Friday 11 Sept:** F-005/F-006, F-033/F-052
   (+ F-040 wording), F-012 (+ F-042 label), F-032, F-030, F-035, F-041,
   F-047 (+ F-013 archive rule), F-060, F-018 — F-018 cannot slip past Friday
   if fulfilling the 30 Sept promise is to remain an option; T3 work (F-010
   image derivatives, F-034's §9 title ceiling, whatever R2/R5/R6/R7 produce)
   queues behind via `/council`.

— Chairman, 7 September 2026.


## 11. Ranked backlog

Written by the Managing Editor agent from the finished findings list. Reproduced verbatim; the source file is kept with the evidence as `managing-editor-ranking.md`. One orchestrator note: where the ranking says a choice on F-032 (keep both calculators) or F-033 (document rather than revert) has been made, read it as the Managing Editor's recommendation — both remain Chairman rulings in §10.

### Managing Editor — ranking note, 2026-09-06 site-wide UI/UX audit

**Date:** 2026-09-07
**Input:** `scratchpad/audit/findings-compact.json` — 72 verified findings, F-001…F-072. Verdict categories are taken as given and not altered here.
**Prior context cited:** `.council/research/2026-08/site-audit-2026-08-29.md` §2 (deferred queue, items 1–8); `CLAUDE.md` §"Tiered review".

#### Conventions used in this note

- **Sprint values.** `now` = this week (w/c 7 Sep). `next` = the following two sprints (to ~28 Sep). `later` = after that, or no action.
- **Decisions and holds.** For a DECISION REQUIRED or VERIFICATION HOLD item, `now` means the ruling or check is requested this week; the resulting change lands in the sprint noted against it.
- **T3 gating.** Per the Charter tier table, T3 work needs a full council via `/council` before it can be scheduled. No T3 item is marked `now`. Two council sessions are proposed (§2.4).
- **Load caps.** Technical Lead holds 19 findings; their `now` list is capped at six. Head of UX holds 18; the same cap is applied for parity.
- **F-001 gates everything.** Main has not built since 1 September, so nothing reaches readers until the hotfix merges. Every deploy-dependent row lists F-001 in `dependsOn`, even where a nearer dependency (usually F-002) is also listed. Decisions, ops checks and SOP notes do not list it.

---

#### 1. Ranked list, P0 → P3, with dependencies

Within a severity band: defects before observations; REQUIRED CHANGE ahead of decisions and holds; then sequencing by dependency and by file so that shared-file work lands in one PR.

| # | ID | Sev | Tier | Owner | Verdict | Sprint | Depends on | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | F-001 | P0 | T2 | technical-lead | REQUIRED CHANGE | now | — | Hotfix is on the branch (`salaryTransferCoverage.ts`, `getLapsedUnarchivedOffers()`, 5 tests). Merge first; it restores the build and adds the tests the rest of the tracker work needs. It does **not** fix the content. |
| 2 | F-002 | P0 | T1 | business-realestate-editor | REQUIRED CHANGE | now | F-001 | The real fix. Move RAKBANK to `salaryTransferOfferHistory` with `archived: true`, `archivedReason: 'campaign ended 31 Aug 2026'`. Same day as the F-001 merge. Clears the build warning; surfaces `/salary-transfer/history/rakbank/`. |
| 3 | F-017 | P1 | T1 | airline-news-editor | REQUIRED CHANGE | now | F-001 | 29 Aug deferred #2. Four 31-Aug stories bump or archive; hotel-news-editor owns the IHG one. Visible only after the deploy. |
| 4 | F-009 | P1 | T1 | technical-lead | REQUIRED CHANGE | now | F-001 | Five one-word edits (`<main class="intel-main">` → `<div>`). Same PR as F-015. |
| 5 | F-015 | P1 | T1 | technical-lead | REQUIRED CHANGE | now | F-001 | Same five directory files: `action="/search/"`, `name="q"`. Then wire `check-fragments` into postbuild. |
| 6 | F-007 | P1 | T2 | technical-lead | REQUIRED CHANGE | now | F-001 | Header wave 1: keyboard-operable hamburger. Touches `tests/nav/header.test.ts`. |
| 7 | F-003 | P1 | T2 | technical-lead | REQUIRED CHANGE | now | F-001 | One dark-override rule for `.dp-aside-newsletter`; grep the other `background: var(--green)` sites. Lands regardless of the F-012 ruling. |
| 8 | F-004 | P1 | T2 | head-of-ux | REQUIRED CHANGE | now | F-001 | `--gold-ink` text token + `--ink-soft`. 83 routes, 346 nodes — the largest single a11y hit. Add the axe contrast assertion to `tests/audit/`. Carries F-005/F-006 if the Chairman rules in time. |
| 9 | F-022 | P1 | T2 | head-of-ux | REQUIRED CHANGE | now | F-001 | One rule: underline the fallback mailto. Also fixes `/newsletter/`. |
| 10 | F-023 | P1 | T2 | head-of-ux | REQUIRED CHANGE | now | F-001, F-002 | End-date chip on live-desk salary rows. Check `.dp-live-desk .row` grid at ≤640px. |
| 11 | F-011 | P1 | T1 | standards-editor | REQUIRED CHANGE | now | F-001 | 'Card deals' → `/deals/` (or relabel 'Cards'). Rides the header wave-1 PR. |
| 12 | F-021 | P1 | T2 | standards-editor | REQUIRED CHANGE | now | F-001 | Relabel `index.astro:422-423` and `:274-275` to 'Spend-return calculator'. This is also the `now` half of F-032. |
| 13 | F-016 | P1 | T1 | fact-checker | REQUIRED CHANGE | now | F-001 | Six 404/403s: find the moved page or convert to an archived citation, owning editor makes the edit and bumps `lastVerified`. The 21 unverifiable and the timeouts stay on hold — workstation browser check (web-session allowlist blocks these hosts). |
| 14 | F-012 | P1 | T2 | growth-analytics-lead | DECISION REQUIRED | now | F-001 | **Chairman ruling this week:** launch the Buttondown list, or gate/hide the 'Join brief' CTA until it exists. Change lands in header wave 2 with F-042. |
| 15 | F-018 | P1 | T3 | fact-checker | DECISION REQUIRED | next | F-001 | 29 Aug deferred #1. Baselines cross 90 days **8 Sep**; Q3 promise expires **30 Sep**. Council A convened this week (§2.4); outcome ships in `next`. Bound by the 12 Jun 2-fils baseline ruling. |
| 16 | F-008 | P1 | T2 | technical-lead | REQUIRED CHANGE | next | F-001 | Move `aria-expanded`/`aria-controls` onto the row's `<button>` in `SalaryTransferTracker.tsx`. Deliberately sequenced behind F-024 (P2) because F-024 shares F-007's file and test; F-008 rides the tracker PR with F-019. |
| 17 | F-019 | P1 | T2 | head-of-ux | REQUIRED CHANGE | next | F-001, F-002 | Coverage note → collapsed `<details>`. The hotfix sentence lives in this block; do not restructure until F-002 has landed. |
| 18 | F-014 | P1 | T2 | business-realestate-editor | REQUIRED CHANGE | next | F-001, F-002 | Stamp from `lastVerified`, not build month. Changes the title assertion in `salary-transfer-coverage.test.ts` and the `ComparisonTableLayout` heading prop. One test rewrite, shared with F-013. |
| 19 | F-013 | P1 | T2 | business-realestate-editor | REQUIRED CHANGE | next | F-001, F-002 | Link the 'checked, no live offer' banks; add the ENBD card to its hub; per-row History link. The expired-deals sub-question waits on F-047. |
| 20 | F-005 | P1 | T2 | head-of-ux | DECISION REQUIRED | next | F-001, F-004 | **Chairman ruling this week:** navy tint + hatched fee bar, or an exempted data-vis palette logged under Amendments (25 Jul no-third-hue rule). Uses F-004's tokens. |
| 21 | F-006 | P1 | T2 | head-of-ux | DECISION REQUIRED | next | F-001, F-004, F-002 | **Chairman ruling this week:** retire `--mint` in light theme; `.dpst` chips to navy/gold. Rides the tracker PR after F-002. |
| 22 | F-020 | P1 | T3 | technical-lead | VERIFICATION HOLD | next | — | **Hold check this week, escalated to the Chairman as account owner:** confirm plan tier and whose the other 37 monitors are. CLAUDE.md §Monitoring budgeted ≈794–1,154/month; the API says 20,920. Remediation is T3 → Council B. Blocks F-060. |
| 23 | F-010 | P1 | T3 | technical-lead | REQUIRED CHANGE | next | F-001, F-054 | Council B. F-054 (hero `srcset`) is the T2 pilot; F-010 generalises it through `StockImage.astro` and `fetch-stock.ts`. Reuses derivatives for F-057. |
| 24 | F-024 | P2 | T2 | technical-lead | REQUIRED CHANGE | now | F-001, F-007 | Header wave 1 with F-007: same file, same `tests/nav/header.test.ts`. Promoted above P1 F-008 on shared-file grounds; one test rewrite instead of two. |
| 25 | F-028 | P2 | T1 | standards-editor | REQUIRED CHANGE | now | F-001 | Delete the inert 'EN · العربية' span. Header wave 1. |
| 26 | F-043 | P2 | T2 | standards-editor | REQUIRED CHANGE | now | F-001 | Delete `index.astro:352-357` hero micro block. Same lines as F-053 — one edit, two findings. |
| 27 | F-036 | P2 | T1 | business-realestate-editor | REQUIRED CHANGE | now | F-001 | Jump id → `cashback-vs-cashback`. |
| 28 | F-033 | P2 | T1 | managing-editor | DECISION REQUIRED | now | — | **Chairman ruling this week.** My recommendation: document the shipped eight-band page as a dated Amendments entry (the 29 Aug direction was the Chairman's own), update `SITE_ARCHITECTURE.md:343`. Reverting the page is the alternative. |
| 29 | F-032 | P2 | T2 | managing-editor | DECISION REQUIRED | now | F-021 | 29 Aug deferred #4. My decision: relabel now (F-021), keep both calculators through Q4, revisit a merge as a T3 brief once F-048 gives us Search Console data. F-031's canonical nouns follow from this. |
| 30 | F-025 | P2 | T2 | head-of-ux | REQUIRED CHANGE | now | F-001, F-015 | Focus ring on the same five search forms F-015 fixes; Pagefind clear button on `/search/`. |
| 31 | F-044 | P2 | T2 | head-of-ux | REQUIRED CHANGE | now | F-001 | One media query hides the `aria-hidden` stamp <900px. |
| 32 | F-037 | P2 | T1 | technical-lead | REQUIRED CHANGE | next | F-001, F-024 | `data-nosnippet` on the megapanels and tracker strip. Header wave 2. |
| 33 | F-042 | P2 | T2 | standards-editor | REQUIRED CHANGE | next | F-001, F-012 | Label follows the F-012 ruling ('Newsletter' if live; hide/'Launch list' if not). `nowrap` either way. Header wave 2; also `Footer.astro:27`, `newsletter.meta.json`. |
| 34 | F-031 | P2 | T2 | standards-editor | REQUIRED CHANGE | next | F-001, F-032 | Two canonical nouns, seven anchors. Header wave 2. |
| 35 | F-029 | P2 | T2 | head-of-ux | REQUIRED CHANGE | next | F-001, F-024 | Cut 18 duplicate rows; collapse Travel panel to four. Do before F-030 so the rename touches fewer arrays. Header wave 2. |
| 36 | F-026 | P2 | T2 | head-of-ux | REQUIRED CHANGE | next | F-001, F-024, F-029 | Hit areas on `.dp-quicklink`, `.dp-nav-sub`, footer links, strategy-tab labels. After the header structure and row count settle. |
| 37 | F-027 | P2 | T2 | technical-lead | REQUIRED CHANGE | next | F-001 | Finder CLS 0.258 / 3,603 nodes. Same island as F-039 — one PR. |
| 38 | F-039 | P2 | T2 | technical-lead | REQUIRED CHANGE | next | F-001, F-027 | Finder controls from `URLSearchParams`; `aria-label` on review links. |
| 39 | F-038 | P2 | T2 | business-realestate-editor | REQUIRED CHANGE | next | F-001, F-002 | Calculator result rows: de-duplicate bank name, space after rank, empty salary input. |
| 40 | F-034 | P2 | T2 | seo-strategist | REQUIRED CHANGE | next | F-001, F-014 | Optional `seoTitle`; **backfill the 65 entries before** adding Zod `.max(160)` or the build breaks again. Card-review stamp moves into the description (coordinate with F-014). |
| 41 | F-040 | P2 | T2 | head-of-ux | REQUIRED CHANGE | next | F-001, F-052 | 'Payless.' announcement. Fix ships either way; wording waits on the F-052 ruling so the `<em>` is edited once. |
| 42 | F-035 | P2 | T3 | technical-lead | DECISION REQUIRED | later | F-001 | Council B. TL + SEO propose which §9 schema spec is canonical; Chairman ratifies. Add a schema-per-template test. |
| 43 | F-030 | P2 | T3 | seo-strategist | DECISION REQUIRED | later | F-001, F-029, F-035 | Council B. `/airlines/` → `/programmes/` with 301s in `public/_redirects`, sitemap, BreadcrumbList, footer column. |
| 44 | F-041 | P2 | T3 | technical-lead | DECISION REQUIRED | later | F-001 | Council B. `public/_headers` from the `audit:static` recommendation; report-only CSP for two weeks first. |
| 45 | F-053 | P2 | T2 | head-of-ux | REQUIRED CHANGE | now | F-001, F-043 | Same deletion as F-043 plus `.hp-hero-cta` padding. Re-check the 360px CTA row. |
| 46 | F-052 | P2 | T2 | standards-editor | DECISION REQUIRED | now | — | **Chairman ruling this week** on H1 wording ('Fly further. On a Dubai salary.') — the composition was his 29 Aug direction. |
| 47 | F-048 | P2 | T2 | growth-analytics-lead | VERIFICATION HOLD | now | — | Search Console check this week (Firecrawl's index is not Google). If confirmed, a Q4 visibility brief — not a mechanical fix. Feeds the F-032 merge question. |
| 48 | F-049 | P2 | T1 | fact-checker | SETTLE | now | — | Schedule the quarterly scrape dispatch for the cohort entering 60–90 days. No copy change. |
| 49 | F-047 | P2 | T2 | lifestyle-culture-editor | DECISION REQUIRED | next | F-001 | Lifestyle desk states whether it can hold ≥6 live deals before DSF. If not, I will recommend dropping the nav slot under the 27 Jul honest-nav rule; Chairman ratifies. Unblocks the deals half of F-013. |
| 50 | F-050 | P2 | T2 | lifestyle-culture-editor | SETTLE | next | F-001 | 29 Aug deferred #3. Refresh queue as ordered; the four expat-starter guides first (most-promoted, 115+ days). |
| 51 | F-054 | P2 | T2 | technical-lead | REQUIRED CHANGE | next | F-001 | One ~940w hero derivative + `srcset`. Pilot for F-010. |
| 52 | F-055 | P2 | T2 | head-of-ux | REQUIRED CHANGE | next | F-001 | Boxed tool tiles → 1 column ≤480px; update the seam comment at `global.css:1195`. |
| 53 | F-051 | P2 | T2 | head-of-ux | REQUIRED CHANGE | later | F-001 | Three-item fact strip on `TrustPageLayout` from existing copy. No new claims. |
| 54 | F-045 | P3 | T1 | lifestyle-culture-editor | REQUIRED CHANGE | now | F-001 | h4 → h3 on the PPF guide. |
| 55 | F-046 | P3 | T1 | head-of-ux | REQUIRED CHANGE | next | F-001 | `aria-hidden` on `.dp-bank-logo-fallback`. |
| 56 | F-061 | P3 | T1 | head-of-research | SETTLE | next | — | SOP note: chunk crawls, single-action interact prompts, log agent credits. |
| 57 | F-056 | P3 | T2 | technical-lead | SETTLE | later | F-001 | `client:visible` on calculators; scope the `html *` transition. |
| 58 | F-057 | P3 | T2 | technical-lead | SETTLE | later | F-001, F-010 | 29 Aug deferred #8. Per-page `ogImage` from the manifest once derivatives exist; `lastBuildDate` = build time. |
| 59 | F-062 | P3 | T1 | technical-lead | SETTLE | later | — | Delete three unused components; ratify 480/768/1024/1280 at the next layout pass. |
| 60 | F-060 | P3 | T3 | head-of-research | DECISION REQUIRED | later | F-020 | Self-monitor: Chairman direction only, and not before the F-020 credit picture is known. |
| 61 | F-058 | P3 | T1 | standards-editor | SETTLE | later | F-001 | 29 Aug deferred #5. Bump `/press/`, `/tip/` stamps at next touch. |
| 62 | F-063 | P3 | T2 | lifestyle-culture-editor | SETTLE | later | F-001, F-034 | Cut trailing dates from three deal titles — do it inside the F-034 title-length pass. |
| 63 | F-064 | P3 | T2 | standards-editor | SETTLE | later | F-001, F-042 | Match `:510` to the header search string once F-042 settles the header. |
| 64 | F-065 | P3 | T2 | standards-editor | SETTLE | later | F-001 | Homepage copy sweep: one 'Verified' format. |
| 65 | F-066 | P3 | T2 | standards-editor | SETTLE | later | F-001 | Homepage copy sweep: 'Start here' eyebrow. |
| 66 | F-067 | P3 | T2 | standards-editor | SETTLE | later | F-001 | Homepage copy sweep: → not ↗ for internal anchors. |
| 67 | F-069 | P3 | T2 | standards-editor | SETTLE | later | F-001 | Homepage copy sweep: trust descs ≤14 words. |
| 68 | F-070 | P3 | T2 | head-of-ux | SETTLE | later | F-001, F-023 | Live-desk column head wrap ≤480px; same block as F-023. |
| 69 | F-059 | P3 | T2 | head-of-ux | SETTLE | later | — | No action required. Closed. |
| 70 | F-068 | P3 | T2 | seo-strategist | SETTLE | later | — | No action required for a root page. Closed. |
| 71 | F-071 | P3 | T1 | head-of-ux | SETTLE | later | — | Clean. Closed. |
| 72 | F-072 | P3 | T1 | technical-lead | SETTLE | later | — | Clean. Closed. |

##### 1.1 Critical path

```
F-001 (merge hotfix) ──► deploy restored
   └─► F-002 (archive RAKBANK) ──► F-014 + F-013 (BRE tracker PR, one test rewrite)
                                └─► F-019 + F-008 + F-006 (tracker page/island PR)
                                └─► F-023 ──► F-070
F-007 + F-024 + F-011 + F-028  (Header wave 1, this week)
   └─► F-012 ruling ──► F-042 + F-031 + F-029 + F-037  (Header wave 2)
                                └─► F-026 ──► F-030 (Council B)
F-004 (tokens) ──► F-005 / F-006 rulings
F-043 = F-053 (same lines)        F-015 = F-009 (same files) ──► F-025
F-054 (pilot) ──► F-010 (Council B) ──► F-057
F-020 (hold) ──► Council B ──► F-060
F-052 ruling ──► F-040           F-021 ──► F-032 ──► F-031
```

---

#### 2. Sprint plan

##### 2.1 Now — this week (27 items)

F-001, F-002, F-003, F-004, F-007, F-009, F-011, F-012, F-015, F-016, F-017, F-021, F-022, F-023, F-024, F-025, F-028, F-032, F-033, F-036, F-043, F-044, F-045, F-048, F-049, F-052, F-053.

Suggested PR sequence, Monday to Thursday:

1. **PR-0 hotfix** — F-001 (TL). Merge Monday.
2. **PR-1 archive** — F-002 (BRE). Monday, immediately after PR-0. T1: BRE + Chairman.
3. **PR-2 directory templates** — F-009 + F-015 + F-025 (TL, HoUX). T1/T2.
4. **PR-3 header wave 1** — F-007 + F-024 + F-011 + F-028 (TL, Standards). Rewrites `tests/nav/header.test.ts` once. T2.
5. **PR-4 contrast** — F-003 + F-004 + F-022 (TL, HoUX). Adds the axe contrast assertion. T2. Carries F-005/F-006 if ruled by Wednesday.
6. **PR-5 homepage** — F-021 + F-023 + F-043/F-053 + F-044 (Standards, HoUX). T2.
7. **Content** — F-017 (airline + hotel desks), F-016 six dead links (FC → owning editors), F-036 (BRE), F-045 (lifestyle). T1 each.
8. **Ops / decisions** — F-012, F-033, F-032, F-052 to the Chairman in one memo (§2.5); F-048 Search Console; F-049 scrape dispatch.

##### 2.2 Next — following two sprints (26 items)

F-005, F-006, F-008, F-010, F-013, F-014, F-018, F-019, F-020, F-026, F-027, F-029, F-031, F-034, F-037, F-038, F-039, F-040, F-042, F-046, F-047, F-050, F-054, F-055, F-061.

Grouped: tracker PR series (F-014/F-013, then F-019/F-008/F-006, then F-038); header wave 2 (F-042, F-031, F-029, F-037, then F-026); finder PR (F-027/F-039); F-054 hero pilot; F-034 title backfill; F-018 outcome from Council A; F-010 and F-020 after Council B.

##### 2.3 Later (19 items)

F-030, F-035, F-041, F-051, F-056, F-057, F-058, F-059, F-060, F-062, F-063, F-064, F-065, F-066, F-067, F-068, F-069, F-070, F-071, F-072.

Of these, F-059, F-068, F-071, F-072 are closed with no action. F-064–F-069 are a single homepage copy sweep for Standards once the header settles.

##### 2.4 Council sessions required (T3)

- **Council A — this week:** F-018 valuations table. Fact-Checker + Chairman minimum, full council per tier table. Hard dates: baselines cross 90 days on 8 Sep; the Q3 methodology promise expires 30 Sep. This was already #1 on the 29 Aug deferred queue and has slipped a week.
- **Council B — first sprint of `next`:** the audit T3 bundle. F-010 (image derivatives pipeline), F-020 (monitor budget, after the plan-tier check), F-030 (`/programmes/` rename), F-035 (§9 schema spec), F-041 (`public/_headers`), F-060 (self-monitor, contingent on F-020). One session, one synthesis, so TL does not sit through six.

##### 2.5 Chairman decisions memo — this week

| Item | Question | ME recommendation |
|---|---|---|
| F-005, F-006 | Value-bar and tracker palette: restyle into navy/gold, or log a data-vis exemption under Amendments | Restyle. The 25 Jul no-third-hue rule was explicit; an exemption a month later weakens it. |
| F-012 | Launch the Buttondown list, or hide/gate the 'Join brief' CTA | Launch if it can be configured this week; otherwise hide the pill until it exists. A primary CTA to a 'not launched' page is the worst of the three states. |
| F-033 | Document the shipped eight-band homepage or revert to the four-section spec | Document, as a dated Amendments entry; it was your direction. |
| F-052 | H1 wording 'Fly further. On a Dubai salary.' | Adopt; it keeps the two-beat composition and gives the only H1 a noun. |
| F-047 | Deals desk: commit to ≥6 live deals pre-DSF, or drop the nav slot | Lifestyle editor answers first; if no cadence, drop the slot under honest-nav. |
| F-032 | Calculators: merge or keep both | Keep both, relabel now, revisit in Q4 with F-048 data. My call unless you object. |
| F-020 | Firecrawl plan tier and monitor ownership | Account-owner check; nothing else on the monitor side moves until answered. |

##### 2.6 Escalations under the escalation matrix

- **Regulatory touch:** none of the 72 touches an active NMC/AECB/TDRA/DET matter. F-016 includes the AECB credit-report walkthrough's dead citation — a link fix, not a regulatory question.
- **Repeat Fact-Checker fails:** none arising; F-002 is a freshness lapse, not a factual error.
- **Brand voice:** F-052 escalated above.

---

#### 3. By-owner ticket list (priority order)

- **technical-lead (19)** — now: F-001, F-009, F-015, F-007, F-003, F-024 · next: F-008, F-054, F-027, F-039, F-037, F-020, F-010 · later: F-035, F-041, F-056, F-057, F-062, F-072
- **head-of-ux (18)** — now: F-004, F-022, F-023, F-025, F-044, F-053 · next: F-019, F-005, F-006, F-029, F-026, F-040, F-055, F-046 · later: F-051, F-070, F-059, F-071
- **standards-editor (13)** — now: F-011, F-021, F-028, F-043, F-052 · next: F-042, F-031 · later: F-064, F-065, F-066, F-067, F-069, F-058
- **business-realestate-editor (5)** — now: F-002, F-036 · next: F-014, F-013, F-038
- **lifestyle-culture-editor (4)** — now: F-045 · next: F-047, F-050 · later: F-063
- **fact-checker (3)** — now: F-016, F-049 · next: F-018
- **seo-strategist (3)** — next: F-034 · later: F-030, F-068
- **growth-analytics-lead (2)** — now: F-012, F-048
- **managing-editor (2)** — now: F-033, F-032
- **head-of-research (2)** — next: F-061 · later: F-060
- **airline-news-editor (1)** — now: F-017 (copy hotel-news-editor for the IHG story)

Load note: TL and HoUX carry 37 of 72 between them. Where a finding's owner is HoUX but the fix is CSS in a TL-owned file, the HoUX ticket is the spec and review; TL or the section editor can type it. Nothing in this note moves ownership.

---

#### 4. Knock-on register — schedule together

| Group | Shared file / test | IDs | Scheduling |
|---|---|---|---|
| **Header.astro** | `src/components/Header.astro`, `tests/nav/header.test.ts`, mobile overlay arrays | F-007, F-024, F-011, F-028, F-012, F-042, F-031, F-029, F-037, F-026, F-064 | Wave 1 now: F-007, F-024, F-011, F-028. Wave 2 next, after the F-012 ruling: F-042, F-031, F-029, F-037, then F-026. F-064 trails. One test rewrite per wave. |
| **global.css tokens** | `src/styles/global.css` token block and dark override | F-004, F-003, F-005, F-006, F-025, F-055, F-070, F-056, F-062 | F-004 defines `--gold-ink`/`--ink-soft` and F-003 the dark rail — one PR now. F-005/F-006 consume the same tokens once ruled. F-055/F-070/F-056 are same-file media/transition rules; batch with whichever lands nearest. F-062 breakpoints at the next layout pass. |
| **salary-transfer/index.astro + coverage test** | `src/pages/salary-transfer/index.astro`, `tests/content/salary-transfer-coverage.test.ts`, `SalaryTransferTracker.tsx`, `[slug].astro` band pages | F-001, F-002, F-014, F-013, F-019, F-008, F-006, F-023, F-038 | F-001 then F-002 now. Then one BRE PR (F-014 + F-013) so the test's title and link assertions change once. Then one page/island PR (F-019 + F-008 + F-006). F-023 mirrors the tracker chip on the homepage; F-038 is the calculator sibling. |
| **NewsletterSignup / newsletter CTA** | `NewsletterSignup.astro`, `ArticleLayout.astro:274` aside, `Footer.astro`, `index.astro:352-357`, `newsletter.meta.json` | F-012, F-003, F-022, F-042, F-043, F-053 | F-003 and F-022 land now regardless of the ruling. F-043/F-053 delete the same hero block now. F-042 waits on F-012. |
| **ComparisonTableLayout titles** | `ComparisonTableLayout.astro` heading prop, `src/content.config.ts`, desk templates | F-014, F-034, F-026, F-063 | F-014 changes the heading source; F-034 moves the stamp into the description and adds `seoTitle`. Do F-014 first, F-034 in the same sprint. F-063 rides F-034. F-026 touches row height only. |
| **SchemaJsonLd / head** | `SchemaJsonLd`, `BaseLayout` head, `public/_redirects`, sitemap | F-035, F-030, F-057, F-068 | All Council B or later. F-035 fixes the spec; F-030's BreadcrumbList and redirects depend on it; F-057 reuses F-010 derivatives. F-068 closed. |
| **Directory templates (intel-main)** | five directory `.astro` files | F-009, F-015, F-025 | One PR now. |
| **index.astro homepage** | `src/pages/index.astro` | F-021, F-023, F-040, F-043, F-044, F-052, F-053, F-054, F-055, F-064, F-065, F-066, F-067, F-069 | Now: F-021, F-023, F-043/F-053, F-044. Next: F-040 (after F-052), F-054, F-055. Later: one Standards copy sweep for F-064–F-069. |
| **Card finder island** | `src/components/islands/` finder | F-027, F-039 | One PR next. |

---

#### 5. Themes

1. **Deploy and freshness** — A build broken by one lapsed offer kept every fix off production for a week, and the same freshness gap shows up in news, titles and the valuations table. F-001, F-002, F-014, F-017, F-018, F-049, F-050, F-058.
2. **Accessibility: contrast and keyboard** — Two token-level contrast failures and a handful of structural mistakes (inoperable hamburger, nested `<main>`, misplaced `aria-expanded`) account for most axe output and are cheap to fix. F-003, F-004, F-007, F-008, F-009, F-024, F-025, F-046.
3. **Charter and palette drift** — Three places where the site diverged from a ratified rule (no-third-hue, four-section homepage) without an Amendments entry; each needs a ruling, not a patch. F-005, F-006, F-033.
4. **Navigation and IA** — Chrome that promises things that do not exist or exist elsewhere: wrong hrefs, unlaunched CTA, orphan routes, duplicate menu rows, seven names for one product, two calculators, a deals slot with three deals. F-011, F-012, F-013, F-015, F-028, F-029, F-030, F-031, F-032, F-047.
5. **Homepage** — The 29 Aug rebuild shipped with a cluster of copy, fold and mobile issues concentrated in `index.astro`; most are one-line and should go in two PRs. F-021, F-022, F-023, F-040, F-042, F-043, F-044, F-052, F-053, F-054, F-055, F-063, F-064, F-065, F-066, F-067, F-068, F-069, F-070.
6. **Performance and mobile** — Unsized hero imagery breaks the byte budget on 156 routes, the finder shifts after hydration, and small tap targets and a 15-line coverage note hurt the tracker at 390px. F-010, F-019, F-026, F-027, F-056, F-071.
7. **SEO plumbing** — Titles and descriptions over length, missing structured data on 24 of 30 templates, snippets built from menu text, and a visibility question that only Search Console can answer. F-034, F-035, F-037, F-048, F-057.
8. **Content, tools and operations** — Dead citations, one broken anchor, tool-output polish, trust-page scannability, and the infrastructure items (monitor budget, security headers, unused files) that need council time rather than editor time. F-016, F-036, F-045, F-038, F-039, F-059, F-051, F-020, F-041, F-060, F-061, F-062, F-072.

---

#### 6. Summary for the Chairman

Main has not built since 1 September; production is the 30 August artefact. The hotfix on the branch merges first; the real fix — archiving the lapsed RAKBANK offer — is a one-file editor task the same day. Behind that sit 21 P1s: contrast failures on 83 and 44 routes, an inoperable mobile menu, a header CTA leading to an unlaunched newsletter, 14 orphan routes, and build-month stamps in titles. Seven items are T3 and need a council before scheduling; the valuations ruling must land before 30 September. Technical Lead and Head of UX are each capped at six items this week. You have seven rulings to make: palette exemption, newsletter launch, homepage spec, H1 wording, deals cadence, calculators, and the Firecrawl plan tier.

— Managing Editor, 7 September 2026.


### 11.1 Backlog by sprint and owner (derived from findings.json)


**now**

- `technical-lead`: F-001 (P0/T2) Main has been unbuildable since 1 September; production is the 30 Augu…; F-003 (P1/T2) Dark mode: the article newsletter rail is white text on light navy (1.…; F-007 (P1/T2) Mobile hamburger is focusable but not keyboard-operable on all 199 rou…; F-008 (P1/T2) Tracker rows carry aria-expanded on role=row inside a table (axe aria-…; F-009 (P1/T1) Directory templates nest a second <main> inside the page main (landmar…; F-010 (P1/T3) Above-fold bytes exceed the 200 KB budget on 156 of 199 routes; mobile…; F-015 (P1/T1) Eight directory search forms post their query to '/', which ignores it; F-020 (P1/T3) Firecrawl key carries 42 monitors with an API-estimated 20,920 credits…
- `head-of-ux`: F-004 (P1/T2) Light mode: small gold and muted labels fall below 4.5:1 on 83 routes …; F-005 (P1/T2) AED value-breakdown bars use two colours outside the navy/gold familie…; F-006 (P1/T2) Live branding extraction resolves the site's primary to mint (#8FD3B3)…; F-019 (P1/T2) Tracker page at 390px: a 15-line 'Coverage status' paragraph sits betw…; F-022 (P1/T2) Newsletter fallback mailto link is indistinguishable from surrounding …; F-023 (P1/T2) Live-desk salary rows show a Verified date but no end date, so a lapse…
- `business-realestate-editor`: F-002 (P0/T1) RAKBANK salary-transfer offer (ended 31 Aug) still shown as live on th…; F-013 (P1/T2) 14 routes have no inbound internal link; 37 more have three or fewer; F-014 (P1/T2) Salary-transfer bank pages, the cards index and the comparison pages s…
- `standards-editor`: F-011 (P1/T1) Header quick-link 'Card deals' goes to the card-review index, not the …; F-021 (P1/T2) "Welcome-bonus calculator" tile sends readers to a spend-ROI calculato…
- `fact-checker`: F-016 (P1/T1) 18 external citations return 4xx or no answer; 21 more cannot be verif…; F-018 (P1/T3) Valuations table: three of seven columns are dashes on every row; the …
- `growth-analytics-lead`: F-012 (P1/T2) Primary chrome CTA 'Join brief' (header, first mobile-overlay row, foo…
- `airline-news-editor`: F-017 (P1/T1) News index still leads with stories whose windows closed 31 August, wr…

**next**

- `head-of-ux`: F-025 (P2/T2) Directory search inputs and the Pagefind clear button have no visible …; F-026 (P2/T2) Tap targets: 13,038 of 18,963 interactive elements at 360px are under …; F-029 (P2/T2) Mega-menus and the Travel panel repeat the same destination under diff…; F-040 (P2/T2) Homepage h1 is announced as 'Fly further. Payless.'; F-044 (P2/T2) Featured-read play card overlaps the 'DXB ✦ AED-FIRST' stamp on mobile; F-051 (P2/T2) Trust pages open with two long paragraphs and no scannable structure a…; F-053 (P2/T2) At 390×844 the hero's featured story and photo fall below the fold beh…; F-055 (P2/T2) Boxed tool tiles collapse to ~85px text columns at 360px
- `technical-lead`: F-024 (P2/T2) Header chrome sits outside any landmark on every route (axe region, 1,…; F-027 (P2/T2) /cards/finder/ shifts layout after hydration (CLS 0.258) and renders 3…; F-037 (P2/T1) Search-engine snippets for the homepage are built from mega-menu text,…; F-039 (P2/T2) Card finder: URL parameters filter the results but the controls do not…; F-041 (P2/T3) No public/_headers: the site ships without X-Content-Type-Options, Ref…; F-054 (P2/T2) Hero image has `sizes` but no `srcset`: 1880px / 380 KB JPEG served to…
- `standards-editor`: F-028 (P2/T1) Inert 'EN · العربية' language switch in the mobile overlay foot; F-031 (P2/T2) One salary-transfer product, seven different labels across the chrome …; F-042 (P2/T2) "Join brief" header CTA is a mystery label and wraps to two lines at 1…; F-043 (P2/T2) Launch-pending status is stated three times on one page while two chro…; F-052 (P2/T2) H1 "Fly further. Pay less." is a slogan with no topical noun — the onl…
- `managing-editor`: F-032 (P2/T2) /calculator/ and /salary-transfer/calculator/ remain two calculators w…; F-033 (P2/T1) Homepage: shipped page has eight bands against a ratified four-section…
- `business-realestate-editor`: F-036 (P2/T1) One broken in-page anchor: #cashback-vs-cashback-plus on the Liv Cashb…; F-038 (P2/T2) Salary calculator results repeat the bank name twice and glue the rank…
- `seo-strategist`: F-034 (P2/T2) 121 of 201 titles exceed 60 characters (news up to 138); 65 descriptio…
- `lifestyle-culture-editor`: F-047 (P2/T2) /deals/ holds three live deals yet occupies a primary nav slot, a home…
- `growth-analytics-lead`: F-048 (P2/T2) dubaipoints.ae is absent from every UAE money query tested; the brand …

**later**

- `seo-strategist`: F-030 (P2/T3) Hotel programmes live under /airlines/ and are labelled 'In the progra…
- `technical-lead`: F-035 (P2/T3) Page-level structured data is absent on 24 of 30 templates and the §9 …
- `lifestyle-culture-editor`: F-045 (P3/T1) Heading order skips a level on the paint-protection-film guide
- `head-of-ux`: F-046 (P3/T1) Footer bank rows announce the fallback text mark before the bank name
- `head-of-research`: F-060 (P3/T3) Proposed (not created) self-monitor for dubaipoints.ae

### 11.2 Knock-on register (shared files and tests)

| Shared surface | Findings to schedule together |
|---|---|
| src/components/Header.astro | F-007, F-011, F-024, F-028, F-029, F-031, F-042, F-012, F-026 |
| src/styles/global.css tokens (--gold text variant, dark --green surfaces, --mint) | F-003, F-004, F-006, F-005 |
| src/pages/salary-transfer/index.astro + tests/content/salary-transfer-coverage.test.ts | F-001, F-002, F-013, F-019, F-014 |
| src/components/islands/SalaryTransferTracker.tsx | F-008, F-013, F-006 |
| Newsletter CTA path (Header.astro:224, Footer.astro, index.astro:352-357, NewsletterSignup.astro) | F-012, F-022, F-042, F-043 |
| Title generation (salary-transfer/[slug].astro, cards/*.astro, ComparisonTableLayout, content.config.ts) | F-014, F-034 |
| src/components/seo/SchemaJsonLd.astro + every layout | F-035, F-037 |
| Directory templates (NewsIndexLayout, airlines/banks/deals/guides index.astro) | F-009, F-015, F-025 |
| Image pipeline (StockImage.astro, fetch-stock.ts, manifest) | F-010, F-054, F-057 |
| src/pages/index.astro (homepage) | F-021, F-023, F-033, F-040, F-043, F-044, F-052, F-053, F-055, F-064, F-065, F-066, F-067 |

## 12. Status of the 29 August deferred queue

| # | 29 Aug item | Status on 7 Sep | Finding |
|---|---|---|---|
| 1 | Valuations table 3/7 dead columns; Q3 promise | **Open, now urgent** — 23 days to the public deadline; baselines cross 90 days on 8 Sep | F-018 |
| 2 | News 31-Aug expiry cliff | **Open and live** — stories read in the future tense a week after expiry; the sweep cannot deploy (P0) | F-017 |
| 3 | Stale guides corpus (13 of 21) | Open, unchanged | F-050 |
| 4 | Calculator consolidation | Open; the homepage label makes it worse | F-032, F-021 |
| 5 | Trust-page stamps (press, tip) | Open, unchanged | F-058 |
| 6 | /news/banking/ near-orphan | Open (3 inbound) | A1 "add" list |
| 7 | Stock-image age | Not re-examined (imagery rulings not re-litigated per §1.4) | — |
| 8 | Per-page OG images | Open | F-057 |

## 13. Binary verdict

**FAIL — do not consider the site in its audited state acceptable to leave as it is.** The failure is narrow and specific: production is frozen on a build that states a false thing about a live financial offer (F-001, F-002). Once the hotfix deploys and the RAKBANK entry is archived, the remaining defects are ordinary — none blocks a reader from completing a task — and the highest-value fixes are small: two colour tokens (F-003, F-004), eight lines of keyboard handling (F-007), five `action` attributes (F-015), one `href` (F-011), one `<details>` wrapper on the tracker's coverage note (F-019). The twelve DECISION REQUIRED items are genuinely the Chairman's: palette exceptions, the newsletter promise, the second calculator, the hotel-programme route, the schema spec, the security headers, the homepage record, the deals slot, the valuations deadline, the self-monitor and the Firecrawl plan.

Re-run `npm run audit:all` after the "now" sprint; §1's table is the baseline.

## Appendix A — Deviations from the approved plan

1. Council Workflow replaced by session-applied lenses plus two serial synthesis agents, after three session-limit failures (details in §2). Two Council finder results were preserved and merged.
2. Dry rounds (loop-until-dry on the three weakest templates) did not run; §5 names the three templates instead.
3. Three-lens adversarial verification replaced by anchor verification at filing time and the random re-check in Appendix B.
4. The Head of UX / SEO / Standards sign-off on the A1 tables and on the template scores is pending review of this PR; the ratings are the session's.
5. `firecrawl_crawl` could not be run as one job (60-second MCP transport limit); chunked crawls were used. The mobile-nav `interact` session timed out three times and is substituted by the local keyboard probe.
6. The external-link artifact could not be downloaded from the session (blob store unreachable); the tables were reconstructed from the job log, which prints the same markdown.

## Appendix B — Anchor spot-check (10 random file:line anchors, re-opened after filing)

| Finding | Anchor | Line as it reads today |
|---|---|---|
| F-014 | `src/pages/cards/index.astro:124` | `title={`The best UAE credit cards (${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }` |
| F-013 | `src/pages/salary-transfer/index.astro:142` | `<a href={`/salary-transfer/${b.slug}/`} class="dp-dir-tile">` |
| F-031 | `src/pages/index.astro:430` | `<span class="title">Salary-offer calculator</span>` |
| F-014 | `src/pages/salary-transfer/[slug].astro:74` | `title={`${props.bankName} salary transfer offer (${new Date().toLocaleDateString("en-GB", { month: "long", yea` |
| F-064 | `src/pages/index.astro:510` | `<span aria-hidden="true">Search cards, miles, banks…</span>` |
| F-052 | `src/pages/index.astro:342` | `<h1>Fly further. <em>Pay&nbsp;less.</em></h1>` |
| F-014 | `src/pages/cards/[slug].astro:53` | `const verifiedStamp = new Date(data.lastVerified).toLocaleDateString("en-GB", {` |
| F-033 | `src/pages/index.astro:337` | `<!-- ── S1. Hero: masthead + feature story ─────────────────────────── -->` |
| F-015 | `src/layouts/NewsIndexLayout.astro:118` | `<form class="intel-search" action="/" method="get" role="search">` |
| F-037 | `src/components/Header.astro:161` | `<div class="dp-megapanel" role="region" aria-label="Cards menu">` |

## Appendix C — Evidence and reproduction

- Evidence folder: `.council/research/2026-09/site-audit-2026-09-06-evidence/` — `findings.json` (this report's source), `scores.json`, `nav-a1.json`, `chrome-inventory.json` (+ the extractor `chrome-inventory.mjs`), `probes-summary.{json,md}`, `lighthouse.{json,md}`, `internal-links.json`, `fragments.json`, `external-links.{json,md}`, `static-config.json`, `seo-mechanical.json`, `serp.json`, `crawl-index.json`, `route-sets.json`, `branding.json` + `branding-summary.md`, `interact-log.md`, `live-probes.json`, `agent-benchmark.json`, `monitor-health.json`, `credits-log.json`, `recon-notes.md`, `managing-editor-ranking.md`, `chairman-decision-questions.md`. Screenshots (201 live mobile full-page, 34 live desktop, 199 × 4 local fold captures) are not committed; they are regenerated by `npm run audit:render` and the Firecrawl scrape ids in the JSON.
- Reproduce the local layer: `npm ci && npm run build && npm run audit:all` (≈ 25 minutes); the external sweep: dispatch `.github/workflows/link-audit.yml`.
- Session record: `.council/sessions/2026-09-06-site-audit-uiux.md` and `-synthesis.md`.

— Audit session for the Council, 6–7 September 2026. Chairman direction in-session, 6 September 2026.

## 14. Fix sprint 1 — 7 September 2026 (Chairman direction in-session: "make a plan and fix those items with the most important one")

Landed on `claude/website-audit-uiux-k1393i` after PR #348 merged, most important first; nothing under rulings R1–R10 was touched.

| Finding | What changed | Verified by |
|---|---|---|
| F-002 | RAKBANK July–August offer moved to `salaryTransferOfferHistory` (`archived: true`, dated `archivedReason`); RAKBANK added to the tracker's checked-without-live-offer list with the closing date in the coverage note | build has no lapsed-offer warning; tracker, homepage live desk and calculator no longer list it |
| F-003 | Dark-mode surface for the article newsletter rail and the directory "insider" band set to brand navy; `--gold-soft` gets a dark value | axe dark: 0 violations on 9 probed routes |
| F-004 | `--gold-ink` (#8a6118 light / #d9a85a dark) for the 10–11px labels (HotTip eyebrow, bank callout label, programme expiry label); value-bar muted alpha 0.62 → 0.78; hub card CTA opacity 0.55 → 0.85 | axe light: 0 contrast nodes on hubs, programmes, guides, home, tracker; 4 remain on card reviews — the R1 hues (F-005) |
| F-007 | Inline keyboard handler: Enter/Space toggle the menu, Escape closes and returns focus; `aria-expanded` kept in sync on both labels | probe: enter/space/escape true on all 9 routes; live Playwright test |
| F-008 | `aria-expanded` moved from the tracker `<tr>` to the row's fine-print button, which is now focusable | axe: 0 `aria-conditional-attr` on `/salary-transfer/` |
| F-009 | `<main class="intel-main">` → `<div>` on the five directory templates | axe: 0 landmark violations |
| F-011 | Quick-link "Card deals" → `/deals/` | built HTML |
| F-013 (part) | Coverage note links every checked-without-offer bank page and RAKBANK's history | internal links 14,024 → 14,036 |
| F-014 | Title stamps derive from the newest `lastVerified` (cards index, cashback, miles, salary bands, tracker bank pages) instead of the build clock; no stamp when nothing is live | built titles read "(August 2026)"; RAKBANK page carries none |
| F-015 | Five directory search forms post to `/search/`; the search page triggers Pagefind from `?q=` and labels its input | live test: `/airlines/` form → `/search/?q=skywards` with results |
| F-017 | Dated "Update, 7 September 2026" notes on the three 31-August stories; `updatedAt` bumped so the expiry sweep clears | news expiry check |
| F-019 | Coverage note is a `<details>` collapsed below 768px, open above | built HTML |
| F-021 | Homepage tile relabelled "Spend-return calculator / See which card pays back most on your monthly spend" | built HTML |
| F-022 | Newsletter fallback mailto underlined (component and homepage) | CSS |
| F-023 | Live-desk salary rows show "Verified … · to <end date>" | built HTML |
| F-024 | Header is a `<header>`; quick-link strip is a `<nav aria-label="Quick links">` | axe: 0 `region` violations |
| F-025 | Focus ring on directory search inputs; Pagefind's suppressed Clear button removed from the tab order; search tip text raised to `--ink-soft` | probe: 0 focus failures on `/airlines/`, `/banks/`, `/search/` |
| F-028 | Inert `EN · العربية` span removed | built HTML |
| F-036 | Liv Cashback jump anchor id aligned | fragments 576 / 0 broken |
| F-037 | `data-nosnippet` on both mega-menus and the quick-link strip | built HTML |
| F-040 (spacing only) | `Pay&nbsp;less` → `Pay less` with `white-space: nowrap` on the italic | built HTML |
| F-043 | Hero launch-pending micro block removed (the band H2 and the fallback still carry the state) | built HTML |
| F-044 | `.dp-header-subscribe` no longer wraps | CSS |
| F-045 | Guide `<h4>` → `<h3>` | axe heading-order |
| F-046 | `BankLogo` gains `decorative`; footer rows no longer announce "<Bank> logo <Bank>" | built HTML: `aria-hidden="true"` on footer marks |

**Corrections to two findings, for the record.** F-046's evidence line about fallback initials came from the inventory's `textContent`, not the accessible name — the fallback span was already `aria-hidden`; the real duplication was the component's `role="img" aria-label="<Bank> logo"` beside the visible name, which is what the fix addresses. F-007's aside about the overlay's accordion checkboxes is withdrawn: they already carried `aria-hidden` and `tabindex="-1"` in source; only the hamburger label lacked keyboard handling.

Not in this sprint: F-010 (image derivatives, T3), F-016 (dead citations need a browser check per link), F-026 (tap targets), F-029/F-031 (menu row cuts and canonical nouns — one Header pass with the R3 label ruling), F-034/F-035, and everything under R1–R10.

## 15. Fix sprint 2 — 7 September 2026 (Chairman direction in-session: "Yes next go ahead"; band colour; "check anything stale")

| Item | What changed | Verified by |
|---|---|---|
| Homepage newsletter band (Chairman: "this colour doesn't go with the rest of the page") | Full-bleed gold band → brand navy `#1f3a4d` in both themes, white copy, gold-ink eyebrow; gold returns to its single job. The 29 Aug gold-band exception is thereby withdrawn by the Chairman. | element captures light + dark at 390; axe 0 on `/` |
| F-029 | Header rows cut: "All cards", "All co-branded cards", "All bank programmes", "All hotel programmes", "All airline stories", "All hotel stories", "Airline deals" (promised a travel filter); Travel panel is four rows for four pages | built header; internal links 14,231 / 0 broken |
| F-031 | Canonical nouns: "Salary-transfer tracker" / "Salary-transfer calculator" in header panels, tools block, footer and the homepage tile; "Salary transfer explained" → tracker label; "Card reviews methodology" → "How we score cards" → `/editorial-policy/how-we-score/`; "DP valuations methodology" → "Points & miles valuations" | built HTML |
| F-026 (part) | Quick links fill the 34px strip (were 17px); mega-menu rows ≥ 36px | probe tap counts; visual |
| F-016 (part) | Five dead citations replaced with the pages the sources moved to (Firecrawl search, 7 Sep): ICP golden residency guide, MoF tax-legislation hub, FAB Elite, Mashreq Gold, RAKBANK salary-transfer; the IHG offer page is live (its 403 is a bot wall against the Actions runner) | built HTML; next `link-audit.yml` run |
| F-017 (remaining) | The 22 May "Season of Rewards" story, the one story still past `staleAfter`, carries a dated update and `updatedAt` | `check-news-expiry.mjs` clean |
| Dark-mode cards-directory callout | `.cards-callout` used `--ink` as a background, which is the light text colour in dark mode (1.1:1); navy surface + white copy in dark | axe dark on `/cards/`: 0 violations, light 0 |

**Staleness sweep, 7 September 2026.**

| Surface | State | Action |
|---|---|---|
| News | 17 stories; newest filed 22 Aug (16 days). After this sprint no story is past `staleAfter`. Two records without `staleAfter` are >60 days (May welcome cycles, Mashreq rate cut) — evergreen records, confirm or set a date. **No new story has been filed since 22 August** against desk ceilings of 2–3 airline and 1–2 hotel stories a week. | desks: cadence; Managing Editor |
| Deals | 6; 3 expired and archived, 3 live to 31 Dec | none |
| Salary-transfer offers | 5 live, verified 16–32 days ago; Emirates Islamic window closes 30 Sep | re-verify EI before 30 Sep |
| Cards | 58, `lastVerified` 16–34 days, none over 60 | none |
| Guides | 13 of 21 past 90 days (expat-starter set 124 days) — known-open | refresh queue (F-050) |
| Valuations | baselines 10 Jun cross 90 days on 8 Sep; Q3 promise due 30 Sep | ruling R10 (F-018) |
| Trust pages | press, tip stamped 9 May | F-058 |

## 16. Fix sprint 3 — 10 September 2026 (four Chairman rulings, and four new findings)

Landed on `claude/website-audit-uiux-k1393i` after PR #350 merged. PR #351.

### 16.1 The four rulings

| Ruling | Findings | What shipped |
|---|---|---|
| **R1** palette | F-005, F-006 | Value bar is a three-step sequential navy ramp with a gold fee segment; tracker accents are brand navy; `--mint` retired and renamed `--navy-lift`. Three steps because no card renders more than three reward categories, which lifts worst adjacent OKLab ΔE from 6.0 to 10.8. Also cleared four white-on-green labels below 4.5:1 that axe was still flagging after sprint 1. |
| **R3** newsletter | F-012, F-042, F-043 | Header CTA does not render until `PUBLIC_BUTTONDOWN_USERNAME` is set; the brief is an ordinary nav row; footer asks for the launch list. Four independent env checks, with two different validation rules, converge on `src/lib/newsletter.ts`. |
| **R4** calculators | F-021, F-032 | `/calculator/` is the spend-return calculator and gains a header and footer row; it had no nav entry anywhere. |
| **R10** valuations | F-018 | Floor, Ceiling, Distribution and Δ 90d cut. The page claims **no date** for the ranges; `EDITORIAL.md` records that the date is set there first and the columns return second. |

Charter amendment recording all four: `CLAUDE.md`, 2026-09-10.

**Correction to F-018.** The audit named three empty columns. It was four —
`delta90` is a dash on all ten rows too.

### 16.2 Ruling-free findings closed

| Finding | What changed | Verified by |
|---|---|---|
| F-027 (part) | `/cards/finder/` server-renders the six the script picks, in rank order, instead of painting 58 and hiding 52 about 160 ms later | CLS 0.248 → **0.0001** at 1280; 0.0002 at 768; 0 at 390 |
| F-039 | Finder controls sync from the query string; an unrecognised value falls back to the default in both the filter and the control | six-case browser check |
| F-038 | `offerTitle()` strips the bank prefix every offer name repeats; the rank no longer glues to it | 5 unit cases incl. "Citi" vs "Citibank" |
| F-054 | `sizes` removed from ten call sites — there is no `srcset` anywhere in `src/`, so every one was inert. `HeroImage`'s `sizes` used a CSS custom property in a media condition, which never parsed | built HTML |
| F-055 | Boxed tool tiles go single-column below 480px; title width 85px → 270px | element capture at 360 |
| F-004 (part) | One missed 10px `var(--gold)` label on the salary calculator | axe |
| — | Two axe violations on the finder: 58 card tiles each rendered a labelled `<aside>`, so the page shipped 58 landmarks sharing one label; the disclosure link sat at 1.21:1 against its own sentence | axe 0 |
| — | `--red`, `--positive`, `--negative` had **no dark values at all** and failed contrast in dark mode at 3.3:1 and 2.6:1. The "Great card if" eyebrow used `--positive` as copy, which that token's own definition reserves to the ProsCons icons | axe dark 0 |

### 16.3 Four new findings, from the kredit.ae teardown

Filed in full at
`.council/research/2026-09/kredit-ae-teardown-2026-09-10.md` §4. The
teardown's value was not the competitor's content; it was these.

| # | Severity | Finding |
|---|---|---|
| **F-073** | **P0** | `/calculator/` published reward figures up to **100× too high** — "48,300 % cashback ≈ AED 48,300" a month on AED 7,800 of spend. `earnRates` is a bare number and `earnUnit` is prose, so four incompatible denominators (percent, per AED 1, per AED 10, per USD 1) were all multiplied by spend alike. Same class as F-002: a false financial figure served to readers. |
| **F-074** | P1 | The calculator's private valuation table contradicted `/valuations/` — a mile at 4 fils against the published 2.0, hotel points at 0.8 against Bonvoy's 2.5 — while calling them "conservative" and linking the methodology page. Against Chairman ruling 2 of 12 June 2026. Its regex matched "Voyager Miles" on the word *miles* and priced it as Skywards. |
| **F-075** | P1 | The `EarnRates` Zod schema declared 9 categories against the 25 `cards.json` carries, and Zod strips undeclared keys — so `partnerBrands` was **silently deleted on 22 cards**, every co-brand review among them, for sixteen weeks. `EarnRateTable` had a comment from 20 May 2026 saying that row existed so the rate "doesn't silently drop from the table". `utilities` (12) and `insurance` (9) went the same way. |
| **F-076** | P2 | `/cards/compare/?cards=` could never render. The page read `Astro.url.searchParams` in a static build, so the picker returned the same three cards every time and the deck's "the URL is shareable" was untrue. |

All four fixed in the same PR, each with a test that fails on recurrence —
including a per-card assertion that every card's earn-unit wording parses,
so an unfamiliar new card fails the suite rather than earning a wrong number
in silence.

### 16.4 New surfaces

- **Ten head-to-head pages** at `/cards/compare/<a>-vs-<b>/`, curated with a
  written verdict each, reusing `CardComparison.astro`. Verdicts state no
  figures — the spec table beneath carries them, so a rate that moves in L2
  moves on the page. Linked from the compare hub and both cards' reviews.
- **Three perk pages** at `/cards/perks/`, from `getCardsWithFeature()`,
  which had zero call sites. Lounge access, golf and travel insurance only;
  the other eleven perk types cover one to five cards. The eight-card
  threshold is asserted in both directions.

### 16.5 A correction to my own harness reasoning

While investigating F-027 I hypothesised that the render probe's CLS figure
was an artefact of its viewport-resize loop, wrote a fix and a test for it,
and was wrong: metrics are collected before the loop runs. The 0.248 was
real, at desktop widths only. The change was reverted before commit. Noted
because the finding survived and the explanation did not.

### 16.6 F-051 — the trust pages

Closed 10 September, prompted by the kredit.ae teardown's §5a: their operator
publishes no named editor, no corrections log and no provenance, and our
advantage on all three was invisible to a reader who did not read the prose.

`TrustPageLayout` rendered eyebrow, `<h1>`, an optional deck, a "Last
updated" strip, then raw prose — and the six highest-trust pages passed **no
deck at all**. It gains an optional `facts` strip mounting `.dp-stats`, a
primitive defined in `global.css` since the Phase D handoff and used by
nothing until now. Nine pages gain facts; six gain a deck.

**Every figure is computed at build time** from `src/lib/trustFacts.ts` —
none is typed into prose. That constraint is the lesson of R10, which had to
cut four columns this morning because `/valuations/` carried a hand-typed
promise. Today's values: 57 cards, 14 banks, **57 of 57 carrying a source
URL**, 1,008 provenance-tagged fields, 2 corrections across 13 card pages.

The corrections log moves from hardcoded markup to `src/data/corrections.ts`
with machine-readable dates, so the page can state how many corrections exist
and when the last one was — the two facts that make a log evidence rather
than a promise. Both entries migrated verbatim.
`tests/content/corrections.test.ts` fails on a half-written entry, a
correction naming a card we no longer carry, or an entry hardcoded back into
the markup.

Measured after: the facts strip is above the fold at 390px and 1280px on
every page checked. Section headings on trust pages were 20px/500 serif
against 18px/400 sans at mobile, a 1.11 ratio that scanned flat; now 22px/600.

**Not done, deliberately:** no schema.org on these pages. That is F-035,
ruling **R6**, still unmade, and the 2026-08-05 amendment restricts author
markup to `Organization` until a named contributor exists. Adding it here
would pre-empt a Chairman decision.

**One self-inflicted bug, caught and fixed before commit:** the CSS insert
for the facts strip matched both `.dp-trust-meta` rules, so it landed a second
time inside a `max-width: 640px` media query, nesting one media query in
another. Found by measuring the strip's width across three viewports rather
than trusting that it looked right.

### 16.7 Still open after this sprint

Six rulings remain unmade — **R2** (F-033, F-052), **R5** (F-030), **R6**
(F-035), **R7** (F-041), **R8** (F-060), **R9** (F-047). Beyond them:
F-027's filtered-URL half and its 3,582 DOM nodes; F-026, which needs the
probe to model WCAG 2.2 SC 2.5.8's spacing exemption before its count means
anything — what remains is dominated by inline text links at line height;
F-016's remaining citations (`etihad.com/en-ae/offers` was re-verified live
on 10 September and its Actions failure was a bot wall; one archived RAKBANK
`sourceUrl` still points at a moved page); F-034's 116 over-length titles and
65 over-length descriptions, which are editorial copy and were deliberately
not machine-rewritten; F-050's guide refresh queue; and the news cadence gap
— no story filed since 22 August against desk ceilings of two to three
airline and one to two hotel stories a week.

### 16.8 Round two of the kredit.ae teardown

Later on 10 September the Chairman asked for kredit.ae to be reviewed in
full and "what we can use" applied. Fifteen more pages were read for 15
credits (teardown §2a and §6). Seven patterns were taken, every one built
from data the site already held so that a figure moving in L2 moves in the
tool:

- **`/calculator/interest/`** — an interest-and-payoff calculator. Its two
  defaults are computed, not typed: the median published monthly rate across
  the 22 cards that carry one (3.49%) and the modal minimum-payment rule
  across the 8 that publish one, read by a fixed regex per Charter §6, with
  the match counts printed on the page. Picking a card fills its rate in.
- **`/cards/fees/`** — a fee index over the 57 active cards: share free for
  life, first-year waivers, median fees, by bank and by salary tier, an FX
  distribution, and a per-card table. Medians as the headline. Every figure
  from `src/lib/feeIndex.ts`; the page types none.
- **`/calculator/`** gains six named spend profiles, a wallet mode that
  narrows the ranking to held cards and routes each category to the best of
  them, and a fee break-even line on every paid card's tile.
- **`/valuations/`** gains a points-to-AED converter that prices a balance
  only at the published DP baseline; Pending programmes are listed and
  disabled.
- **`/cards/`** gains a computed snapshot line and pills to the salary and
  fee pages, which had no entry there.

Declined, with the clause for each, in teardown §3: the 1–5 ratings and the
percentile ranking, an open dataset under CC BY 4.0 (**decision required**),
the ChatGPT app (**decision required**), the balance-transfer and EMI
calculators, their FX-fee account (**verification hold**), and a
new-to-UAE roadmap the expat-starter guide already carries.

**Three more defects on our side** (teardown §4.5–4.7). The calculator's
methodology had said since May 2026 that typed caps were applied; nothing
applied them, and ADCB 365 showed AED 1,800 a month against a published
ceiling of AED 1,000. Thirteen capped cards are now clamped and tested. The
same page still said utilities were pinned to the base rate after 4.1 had
changed that; corrected. And `fab-elite`'s `_caps` carries keys the schema
strips, arriving as `{}` — the 4.3 class one object deeper, recorded rather
than fixed because a units-denominated cap needs a schema field.

**Verification.** `astro check` 0/0/0; `npm test` 449 passing (29 new across
five files); `npm run build` 214 pages, 16,336 internal links, 0 broken; axe
0 violations in light and dark on `/calculator/`, `/calculator/interest/`,
`/cards/fees/`, `/valuations/` and `/cards/` — after one fix: the new
snapshot line's "fee index" link failed link-in-text-block on the first
probe (1.06:1 against the surrounding grey) and is underlined now. Driven in
a browser at 1280px and 390px: presets set the totals, the wallet narrows
and persists across reload, the ADCB 365 tile reads "capped at AED 1,000",
the interest tool reports 11 years 9 months at the minimum against 2 years
11 months flat, the converter disables five Pending rows, and the fee page
figures match the library's to the dirham. No horizontal overflow at 390px
on any of the four tool routes.
