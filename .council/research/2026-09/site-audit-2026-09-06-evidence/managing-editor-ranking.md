# Managing Editor — ranking note, 2026-09-06 site-wide UI/UX audit

**Date:** 2026-09-07
**Input:** `scratchpad/audit/findings-compact.json` — 72 verified findings, F-001…F-072. Verdict categories are taken as given and not altered here.
**Prior context cited:** `.council/research/2026-08/site-audit-2026-08-29.md` §2 (deferred queue, items 1–8); `CLAUDE.md` §"Tiered review".

## Conventions used in this note

- **Sprint values.** `now` = this week (w/c 7 Sep). `next` = the following two sprints (to ~28 Sep). `later` = after that, or no action.
- **Decisions and holds.** For a DECISION REQUIRED or VERIFICATION HOLD item, `now` means the ruling or check is requested this week; the resulting change lands in the sprint noted against it.
- **T3 gating.** Per the Charter tier table, T3 work needs a full council via `/council` before it can be scheduled. No T3 item is marked `now`. Two council sessions are proposed (§2.4).
- **Load caps.** Technical Lead holds 19 findings; their `now` list is capped at six. Head of UX holds 18; the same cap is applied for parity.
- **F-001 gates everything.** Main has not built since 1 September, so nothing reaches readers until the hotfix merges. Every deploy-dependent row lists F-001 in `dependsOn`, even where a nearer dependency (usually F-002) is also listed. Decisions, ops checks and SOP notes do not list it.

---

## 1. Ranked list, P0 → P3, with dependencies

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

### 1.1 Critical path

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

## 2. Sprint plan

### 2.1 Now — this week (27 items)

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

### 2.2 Next — following two sprints (26 items)

F-005, F-006, F-008, F-010, F-013, F-014, F-018, F-019, F-020, F-026, F-027, F-029, F-031, F-034, F-037, F-038, F-039, F-040, F-042, F-046, F-047, F-050, F-054, F-055, F-061.

Grouped: tracker PR series (F-014/F-013, then F-019/F-008/F-006, then F-038); header wave 2 (F-042, F-031, F-029, F-037, then F-026); finder PR (F-027/F-039); F-054 hero pilot; F-034 title backfill; F-018 outcome from Council A; F-010 and F-020 after Council B.

### 2.3 Later (19 items)

F-030, F-035, F-041, F-051, F-056, F-057, F-058, F-059, F-060, F-062, F-063, F-064, F-065, F-066, F-067, F-068, F-069, F-070, F-071, F-072.

Of these, F-059, F-068, F-071, F-072 are closed with no action. F-064–F-069 are a single homepage copy sweep for Standards once the header settles.

### 2.4 Council sessions required (T3)

- **Council A — this week:** F-018 valuations table. Fact-Checker + Chairman minimum, full council per tier table. Hard dates: baselines cross 90 days on 8 Sep; the Q3 methodology promise expires 30 Sep. This was already #1 on the 29 Aug deferred queue and has slipped a week.
- **Council B — first sprint of `next`:** the audit T3 bundle. F-010 (image derivatives pipeline), F-020 (monitor budget, after the plan-tier check), F-030 (`/programmes/` rename), F-035 (§9 schema spec), F-041 (`public/_headers`), F-060 (self-monitor, contingent on F-020). One session, one synthesis, so TL does not sit through six.

### 2.5 Chairman decisions memo — this week

| Item | Question | ME recommendation |
|---|---|---|
| F-005, F-006 | Value-bar and tracker palette: restyle into navy/gold, or log a data-vis exemption under Amendments | Restyle. The 25 Jul no-third-hue rule was explicit; an exemption a month later weakens it. |
| F-012 | Launch the Buttondown list, or hide/gate the 'Join brief' CTA | Launch if it can be configured this week; otherwise hide the pill until it exists. A primary CTA to a 'not launched' page is the worst of the three states. |
| F-033 | Document the shipped eight-band homepage or revert to the four-section spec | Document, as a dated Amendments entry; it was your direction. |
| F-052 | H1 wording 'Fly further. On a Dubai salary.' | Adopt; it keeps the two-beat composition and gives the only H1 a noun. |
| F-047 | Deals desk: commit to ≥6 live deals pre-DSF, or drop the nav slot | Lifestyle editor answers first; if no cadence, drop the slot under honest-nav. |
| F-032 | Calculators: merge or keep both | Keep both, relabel now, revisit in Q4 with F-048 data. My call unless you object. |
| F-020 | Firecrawl plan tier and monitor ownership | Account-owner check; nothing else on the monitor side moves until answered. |

### 2.6 Escalations under the escalation matrix

- **Regulatory touch:** none of the 72 touches an active NMC/AECB/TDRA/DET matter. F-016 includes the AECB credit-report walkthrough's dead citation — a link fix, not a regulatory question.
- **Repeat Fact-Checker fails:** none arising; F-002 is a freshness lapse, not a factual error.
- **Brand voice:** F-052 escalated above.

---

## 3. By-owner ticket list (priority order)

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

## 4. Knock-on register — schedule together

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

## 5. Themes

1. **Deploy and freshness** — A build broken by one lapsed offer kept every fix off production for a week, and the same freshness gap shows up in news, titles and the valuations table. F-001, F-002, F-014, F-017, F-018, F-049, F-050, F-058.
2. **Accessibility: contrast and keyboard** — Two token-level contrast failures and a handful of structural mistakes (inoperable hamburger, nested `<main>`, misplaced `aria-expanded`) account for most axe output and are cheap to fix. F-003, F-004, F-007, F-008, F-009, F-024, F-025, F-046.
3. **Charter and palette drift** — Three places where the site diverged from a ratified rule (no-third-hue, four-section homepage) without an Amendments entry; each needs a ruling, not a patch. F-005, F-006, F-033.
4. **Navigation and IA** — Chrome that promises things that do not exist or exist elsewhere: wrong hrefs, unlaunched CTA, orphan routes, duplicate menu rows, seven names for one product, two calculators, a deals slot with three deals. F-011, F-012, F-013, F-015, F-028, F-029, F-030, F-031, F-032, F-047.
5. **Homepage** — The 29 Aug rebuild shipped with a cluster of copy, fold and mobile issues concentrated in `index.astro`; most are one-line and should go in two PRs. F-021, F-022, F-023, F-040, F-042, F-043, F-044, F-052, F-053, F-054, F-055, F-063, F-064, F-065, F-066, F-067, F-068, F-069, F-070.
6. **Performance and mobile** — Unsized hero imagery breaks the byte budget on 156 routes, the finder shifts after hydration, and small tap targets and a 15-line coverage note hurt the tracker at 390px. F-010, F-019, F-026, F-027, F-056, F-071.
7. **SEO plumbing** — Titles and descriptions over length, missing structured data on 24 of 30 templates, snippets built from menu text, and a visibility question that only Search Console can answer. F-034, F-035, F-037, F-048, F-057.
8. **Content, tools and operations** — Dead citations, one broken anchor, tool-output polish, trust-page scannability, and the infrastructure items (monitor budget, security headers, unused files) that need council time rather than editor time. F-016, F-036, F-045, F-038, F-039, F-059, F-051, F-020, F-041, F-060, F-061, F-062, F-072.

---

## 6. Summary for the Chairman

Main has not built since 1 September; production is the 30 August artefact. The hotfix on the branch merges first; the real fix — archiving the lapsed RAKBANK offer — is a one-file editor task the same day. Behind that sit 21 P1s: contrast failures on 83 and 44 routes, an inoperable mobile menu, a header CTA leading to an unlaunched newsletter, 14 orphan routes, and build-month stamps in titles. Seven items are T3 and need a council before scheduling; the valuations ruling must land before 30 September. Technical Lead and Head of UX are each capped at six items this week. You have seven rulings to make: palette exemption, newsletter launch, homepage spec, H1 wording, deals cadence, calculators, and the Firecrawl plan tier.

— Managing Editor, 7 September 2026.
