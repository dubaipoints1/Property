# Session-end handoff — 5–10 June 2026 (the "finish it all" session)

**Read this first in a new session.** It is the durable memory of the
longest sprint to date: 17 PRs (#218–#233, plus #235 closed-not-merged),
four multi-agent audits, and the competitor content-gap dossier. The site
is **launch-ready**; what remains is owner actions, Chairman decisions,
and content production — not engineering.

---

## 1. What shipped (PRs #218–#233, all merged to main)

| PR | What |
|---|---|
| #218 | Eligibility `needs-review` provenance threaded through 8 chrome surfaces ("Pending"/"—" instead of leaking unverified AED figures) |
| #219 | 7 geographically-wrong stock photos removed (Philippine pesos as AED, Bangkok rider as Dubai, etc.) + `.dp-prose` reading-rhythm tune |
| #220 | Per-page editorial pass: 42 MDX files, −277 net lines; "Is it worth it?"+"Bottom line" merged everywhere; Manchester United deepened 68→132 lines |
| #221 | Skywards fils-per-mile arithmetic fix + methodology note; Head-of-UX layout pass; Standards 16 microcopy fixes; cards/index H1 |
| #222 | `.dp-prose table` rules — markdown tables in guides/programmes were rendering unstyled (the "tables not aligned" complaint) |
| #224 | Defensive `.dp-prose` rules for hr/img/figure/pre/dl/nested lists |
| #225 | Scrape `isPlausibleWelcomeBonus()` guard — blocks the ENBD banner-contamination class; 7 tests pin PR #207's garbage strings |
| #226+#228 | Weekly scrape merged; #228 fixed its fallout (present-with-null `loyaltyProgram` broke the build; merge contract hardened + regression test) |
| #227 | Three Council briefs filed (see §3) |
| #229 | 4-agent sweep: 3 §10 expired-cycle fixes (FAB Cashback/HSBC Live+/RAKBANK World), 36 SEO title fixes, crumb→bank-hub anchor (+54 links), 12 alt-text honesty fixes |
| #230 | dnata-world voice fix |
| #231 | A2 "Value to me: AED X" pilot (fab-cashback + skywards-infinite); B10 homepage trust-stack (3 tiles); breadcrumbs anchored across 6 layouts |
| #232 | A2 cascade wave 1+2 — **12/55 cards** now carry the convention; SOP ratified at `.council/sops/value-to-me-convention.md` |
| #233 | 3-agent audit (missing/inaccurate/looks-weird): content-gap dossier, 55 stale "(May 2026)" titles now computed, ADCB fee-contradiction cluster fixed, archived-offer leak fixed, invitation-only ladder unified, 10 looks-weird fixes |

Tests: 185/185. `npm run check` clean. Build 158 pages clean.

## 2. Owner actions (sandbox cannot do these)

1. **Cloudflare Web Analytics token** — Pages dashboard → env var
   `PUBLIC_CF_BEACON_TOKEN`. Code already gated correctly (BaseLayout).
2. **Delete 10 stale branches** (git proxy blocks ref deletion from
   sandbox; GitHub web UI → Branches → trash). Until deleted,
   `auto-pr.yml` can re-open stale conflicting PRs — it did exactly that
   with #235 (closed 10 June with explanation; merging it would have
   reverted #229's image work). List:
   `claude/card-hero-welcome-bonus-fix`, `claude/check-firecrawl-status-QqRQp-RTouq`,
   `claude/jumpsection-and-meta-rebuild`, `claude/prose-element-fallbacks`,
   `claude/site-audit-june-10`, `scrape/weekly-2026-05-08-055159`,
   `scrape/weekly-2026-05-10-154218`, `scrape/weekly-2026-05-10-161234`,
   `scrape/weekly-2026-05-31-184319`, `scrape/weekly-2026-06-02-125543`.
   **None carry unmerged work — verified by content. Never merge them.**
3. **Three §10 workstation walks** (issuer hosts 403 from sandbox):
   - ADCB TouchPoints Titanium Gold base earn — 0.5 or 1 TP per AED?
     (`adcb.com/.../touchpoint-tg-cc.aspx`)
   - ENBD Skywards Infinite + Signature: reconcile legacy
     `welcomeBonusValue` (40k/25k) vs typed `welcomeBonus.amount`
     (100k/40k) — two fields disagree on the same cards
   - FAB Etihad Guest Infinite: type the welcomeBonus into L2 from the
     L3 prose (55k + 55k spend bonus to 30 June)
4. **Logo placeholders** for 6 banks (emirates-nbd, dib, adib, cbd,
   emirates-islamic, rakbank) — Wikimedia 403 from sandbox; workstation
   or `seed-logos.yml` Actions run. Charter posture: text-marks
   preferred over mis-attributed marks.

## 3. Chairman decisions pending (briefs in `.council/briefs/`)

- `2026-06-06-editor-confirmed-null-sentinel.md` — T3. 5th provenance
  value so deliberate nulls survive scrapes. Recommends Option A.
- `2026-06-06-skywards-valuation-baseline-reconciliation.md` — T3.
  Cost-basis 2 fils vs cash-fare 12–16 fils. Recommends keep 2 fils +
  formalised footnote (already live on programmes page).
- `2026-06-06-competitor-pattern-adoption-audit.md` — adoption ledger
  (9 shipped / 4 partial / 2 open / 5 avoided). B15 "No AI prose"
  Charter stance still needs a ruling.

## 4. Diary (time-triggered, check on session start)

- **13 June 2026** — Mashreq cashback rate cut takes effect: ~8
  future-tense passages flip to past (mashreq-cashback.mdx,
  expat-starter, news post, cards.json ~5074). KFS cited "effective to
  12 June 2026" — verify live.
- **19 June 2026** — 32 cards stamped `lastVerified: 2026-05-20` cross
  the 30-day verification window.
- **30 June 2026** — expiry cluster: ENBD Skywards deal, FAB Etihad
  Guest 55k spend bonus, EI Switch welcome, ENBD bonus-interest cycle,
  RAKBANK Q2 + ADCB H1 salary offers. All need past-tensing or
  re-population 1 July.
- **Weekly (Sun 23:00 UTC)** — scrape PR auto-opens. Guards
  (`isPlausibleWelcomeBonus`, absent→null skip) catch the structural
  classes; a human still verifies figures against the cited issuer URLs.
  Never auto-merge (Charter).

## 5. Autonomous-safe work queue (next session can pick up)

**Content production (the real gap — see
`.council/research/2026-06/content-gap-analysis.md`):**
1. News cadence: 5 posts total vs competitors' 3–10/day
2. The 3 promised best-of roundups (`/best-of/` has 0 real articles;
   recipe exists in Phase 2a.5; 55 reviews supply material)
3. Hilton Honors + Accor ALL programme pages (taxonomy commits to them)
4. Deals cadence (1 post; Eid + summer promos imminent)
5. DXB lounge review series (needs owner site-visit budget decision)

**A2 cascade continues:** 12/55 cards done. Audit query:
`grep -L "Value to me" src/content/cards/*.mdx`. SOP (with corrected
programme valuations — Bonvoy is 2.5 fils, NOT 4) at
`.council/sops/value-to-me-convention.md`.

**Flagged-not-fixed (small, scoped):**
- "— vs —" rows in CardComparison — fenced by
  `tests/cards/card-comparison.test.ts` contract; Tech Lead to decide
- "Entertainment 0.0125×" earn rate on go4it-platinum — reader-hostile
  L2 value; BRE editor
- Scrape normaliser artefacts in perks ("**1 points** for every  400
  spend") — `scripts/scrape/_normaliser.ts`
- 200k-mile string appears 5× on etihad-guest-elevate page — section
  editor
- "88k average welcome bonus" homepage stat averages miles and AED
  units together — Fact-Checker
- `corrections.astro` says "None yet" despite the logged 29 May ADCB
  FX-fee correction — editorial call
- Homepage now says "Daily" tracker refresh (was "Monthly") to match
  other surfaces — true cadence unverified (scrape cron is weekly,
  tracker manual)

## 6. Load-bearing facts learned this session (don't re-derive)

- **Squash-merges leave branches behind**; the auto-PR workflow then
  re-opens PRs from them. Close + delete, never merge stale branches.
- **The git proxy in this sandbox cannot delete remote refs** (both
  `--delete` and colon-refspec fail). GitHub MCP has no delete-branch
  tool either.
- **`z.string().optional()` rejects present-with-null** — the scraper
  must never write `field: null` onto a card that lacked the key
  (PR #226 broke main this way; guard now in `mergeDraft`).
- Network allowlist 403s: wikimedia, issuer sites (ADCB/ENBD/FAB),
  unsplash/pexels — workstation-only fetches. GitHub Actions runners
  are NOT blocked (seed-images / seed-logos / scrape workflows work).
- Card meta titles compute month from `lastVerified` now — never
  hardcode "(Month YYYY)" in titles again.
- `getOffersForBank` now filters archived+expired (same predicate as
  `getLiveOffers`) — all consumers present results as "current".
- The bulk PR-list `merged` flag from the GitHub MCP is unreliable;
  verify by content (`git cherry`, grep main) before acting.
- Standards/Fact-Checker/SEO agents have no Bash (Charter tool
  minimisation) — a consolidating session must run check/test for them.

— Session closed 10 June 2026. 17 PRs. Site launch-ready.
