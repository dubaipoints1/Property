# Site audit + competitor analysis — 22 August 2026

Chairman-directed ("Can you audit my www.dubaipoints.ae website? do
competitor analysis and recommend what changes? update the articles").
Companion dossier: `salary-transfer-sweep-2026-08-22.md` (same date).
Sections 1–3 are findings; §4 is the recommendation list with owners;
§5 records what was fixed the same day.

## 1. State of the site (as found this morning)

**The pipeline is healthy; the newsroom is asleep.** Every one of the 55
cards in L2 carries `lastVerified: 2026-08-06±2` (the weekly scrape PR
#327, merged today, reset the clock). But zero content commits landed
between 7 and 22 August. Consequences, worst first:

1. **Homepage advertised an expired deal for a week.** The Etihad "Last
   chance for summer" deal (`expiresOn: 2026-08-15`) had no
   `archived: true`, so it rendered as live on `/` and `/deals/` through
   22 August, and the Tuesday `deal-expiry` CI sweep has been failing
   red. For a publication whose differentiation is dated verification,
   an expired offer on the homepage is the single most damaging class of
   defect. *(Fixed today.)*
2. **The salary-transfer tracker fell behind the market.** Mashreq
   restructured its offer on 1 August (new early-bird component; ceiling
   AED 2,500 → 4,000) — unnoticed because the entry was last verified 30
   June. Emirates Islamic launched a banded campaign on 1 June (to 30
   Sep) — one of the two "unresolved" hand searches that stayed parked.
   *(Both fixed today; tracker is now 6 of 12 with zero unresolved.)*
3. **News desks idle.** Airline desk: 18 days silent (ceiling 2–3/wk).
   Hotel desk: one story ever, 26 days silent (ceiling 1–2/wk). Three
   published stories describe promo windows that close 30–31 August
   without an update pass. There is no news-expiry CI sweep the way
   deals have one.
4. **Guides aging in place.** 19 of 21 guides untouched since 11 June or
   earlier. Ramadan guide still frames Ramadan 2026 (ended March) as
   current; DSF guide still says 2026 dates "not yet published" as of a
   29 May check; several cards describe the "31 May welcome cycle" with
   no successor note.
5. **Reader-facing verification dates lag the data layer.** MDX
   `verifiedBy:` lines mostly read May–June while L2 says 6 August. Five
   cards have undated `verifiedBy`. The trust signal readers actually
   see is weaker than the data justifies.
6. **RAKBANK cliff in 9 days.** The tracker's flagship no-card cash
   offer ends 31 August; the two prior RAKBANK cycles 404'd after close.
   Expect the monitor to fire; have the archive + successor decision
   ready.

Indexation: the site is indexed (site: query returns homepage, tracker,
bank hubs, guides) but **absent from the top 10 for every money query
checked**. Structural SEO gaps: one shared `og-default.svg` for all
pages; no per-salary-band landing pages; thin `/press/` and calculator
routes shipping publicly; hotel programmes navigated under `/airlines/`.

## 2. Competitor landscape (who actually ranks, 22 Aug SERPs, Dubai locale)

**"best credit card UAE 2026"** — rankers: yallacompare (aggregator,
200+ cards), Emirates NBD/HSBC/EI/ADIB bank pages, **uaeexperthub.com**
(editorial, 200+ cards "rated & compared", per-category tables with
ratings out of 5), **stashaway.ae** blog (exhaustive cashback tables
incl. Islamic + co-brand splits), **kredit.ae** (per-salary-band pages —
"Best cards for AED 8,000 salary"), YouTube. DubaiPoints: absent.

**"salary transfer offers UAE"** — rankers: Al Hilal (bank, #1),
**moneyluna.com** (an independent tracker in exactly our format: banded
tables, "updated monthly", salary-only vs salary+card split), bank
pages (Mashreq, ADIB, FAB, EI, ADCB), reddit r/UAEcreditcards threads.
DubaiPoints: absent despite the tracker being our flagship product.

What the rankers do that we don't:

| Pattern | Who | Assessment |
|---|---|---|
| Coverage breadth: Liv, Wio, Dubai First, Al Hilal, SIB, Ajman Bank, CBD | uaeexperthub, stashaway, kredit | Real gap — 6+ issuers our readers hold that we can't answer for. Wio & Liv are the digital-first defaults for new arrivals. |
| Per-salary-band pages ("best cards for AED 8k salary") | kredit.ae | High-intent, low-competition query family; maps 1:1 onto data we already hold (minSalary in L2). |
| Numeric ratings (4.5/5) per card | uaeexperthub | Charter-compatible only via the precedent-setting review score the 2026-05-25 amendment reserved to the Chairman. |
| "Updated monthly" freshness labels on comparison content | moneyluna | We have better per-offer dates but don't say the cadence out loud. |
| Salary-only vs salary+card offer split | moneyluna | Good reader-first split; our tracker filters by rewardType but not by card-required. Cheap win. |

**Positioning read.** Nobody in the UAE market combines primary-source
verification + per-field provenance + a live tracker the way we do; the
rankers win on breadth and query targeting, not on trust. The moat is
real but invisible to search. The play is not to out-breadth yallacompare
— it is to close the six-issuer gap that matters (Liv, Wio, Al Hilal
first), own the salary-band query family, and keep the freshness promise
we already make visibly true (which items 1–3 above briefly broke).

## 3. What competitor analysis says about the tracker specifically

The tracker is the most defensible asset: moneyluna updates monthly;
banks' own pages are the only fresher source. With today's additions we
list 6 live banded offers + 4 documented absences + SC's
advertised-without-terms state — no competitor distinguishes those three
states. RAKBANK's 31 Aug close and EI's 30 Sep close both land inside
the next five weeks: two tracker news moments the desks should cover
rather than let pass silently.

## 4. Recommendations (decision needed where marked ⚖)

**Freshness ops (Managing Editor, this week)**
1. Add a news-expiry sweep mirroring `deal-expiry.yml`: flag published
   news whose stated promo window has passed without an `updatedAt`
   touch. (Tech Lead, small.)
2. Wake the desks with the three expiring-window stories (Skywards
   Season of Rewards ends 31 Aug; DSS redemption push milestones; Bonvoy
   x Skywards window closes 30 Sep) plus the two tracker moments above.
3. Rolling verification: stagger card re-verification across weeks
   instead of one bulk sweep date, so the corpus never goes amber at
   once. (Tech Lead + section editors.)
4. Propagate data-layer verification into reader-facing `verifiedBy`
   lines, and date the five undated ones. Mechanical, 55 files; do it
   with the next sweep so the two layers stamp together.

**Content debt (section editors, next two weeks)**
5. Reframe the Ramadan guide as evergreen-with-a-season ("Ramadan 2027
   planning" once dates firm) or park it out of nav until January.
6. DSF guide: pull the DET calendar and publish actual dates (opens
   mid-December; competitors will have date pages up by October).
7. Cards describing the closed 31 May welcome cycle (fab-cashback,
   hsbc-live-plus, rakbank-world + best-entry-level guide): one pass to
   confirm successor cycles from L2 `_scraped_freetext` and reframe.
8. `bankReputation` is 1 of 12 banks — either fill a bank per week or
   unship the surface; an 8%-complete trust feature reads worse than
   none.

**Growth (SEO Strategist brief, ⚖ Chairman priority call)**
9. Per-salary-band pages ("Best UAE cards at AED 5k/8k/12k/20k/30k
   salary") generated from L2 minSalary data — the kredit.ae pattern
   with our provenance. T3 (new route family).
10. Split the tracker view by "no card required" vs "card required" —
    reader-first filter moneyluna already offers. T2.
11. Per-page OG images (even text-on-brand-navy cards) to replace
    og-default.svg. T2.
12. ⚖ Coverage expansion: add Liv, Wio, Al Hilal (in that order —
    digital-first defaults + the #1-ranking salary campaign). Each is a
    new bank hub + cards + scrape config = T3 each, roughly one bank per
    week of editorial effort. The alternative — staying at 12 legacy
    banks — concedes the fastest-growing segment. Chairman decides
    scope and order.
13. ⚖ The Chairman-reserved first review score (2026-05-25 amendment):
    competitors all publish ratings; if we ever adopt one, the
    methodology page must land first. No recommendation either way —
    flagging that the market default has shifted.

**Housekeeping (Tech Lead, T1s)**
14. `emirates-nbd-ongoing-2026` sits `archived: true` inside the live
    offers collection — move to `salaryTransferOfferHistory` with an
    `archivedReason`.
15. `enbd-skywards-welcome-q2-2026` has `publishedAt` 3+ weeks after its
    `expiresOn` — RSS pubDate is misleading; correct or annotate.
16. Retire `/design-spike/`, `/dev/calculator-tests/`, `/style-guide/`
    from public builds (or gate behind `import.meta.env.DEV`).
17. Two calculator routes exist (`/calculator/` and
    `/salary-transfer/calculator/`); pick the canonical one and redirect.

## 5. Shipped same-day (this PR)

- Etihad summer deal archived (clears the red `deal-expiry` check; homepage
  no longer shows an expired offer).
- Emirates Islamic June–Sep banded offer added to the tracker (fills one
  of the two outstanding hand searches) — tracker to **6 of 12**, zero
  unresolved banks.
- Mashreq entry rebuilt for the 1 August restructure (early-bird
  component, AED 4,000 ceiling, 12-instalment payout, FAQ discrepancy
  flagged).
- RAKBANK re-verified 22 Aug; 31 Aug countdown surfaced in the entry.
- Standard Chartered resolved from "unresolved" to "advertised without
  current published terms" (Priority-only, AED 2,000 at 30k+, linked T&C
  is the expired Q2 doc) — recorded on the tracker page.
- ADCB Back-to-School (education-sector TouchPoints tiers) and ADIB
  (still draw-only) recorded as coverage-note findings.
- Stale prose fixed: ENBD Elevate welcome "running to 30 June" reframed;
  salary-transfer mechanics guide's ENBD/RAKBANK/EI sections rewritten to
  current cycles; FAB/ADCB bank-hub card counts re-anchored to August.
- Weekly scrape PR #327 merged (54 cards' `lastVerified` → 6 Aug);
  superseded scrape PRs #300/#302/#307 closed.

## 6. Shipped same-day, second wave (Chairman: "implement all the fixes")

- **Coverage expansion to 15 banks**: Liv, Wio and Al Hilal hubs live;
  Liv's two cards fully in L2/L3 (fees and tiers primary-sourced); Wio
  and Al Hilal card entries deliberately held back — their fee documents
  defeated every fetch channel, so hubs defer to the linked KFS/SoF
  rather than print unverified numbers (dossier:
  `coverage-expansion-dossier-2026-08-22.md`). Workstation follow-up
  queued for both documents.
- **Per-salary-band pages** at `/cards/salary/{5000,8000,12000,20000,
  30000}/` + directory, derived from L2 minimums at build time,
  "newly in reach at this band" called out per page; linked from the
  cards mega-panel. Cards with unverified minimums are excluded, not
  guessed.
- **News desks woken**: five stories filed 22 Aug — RAKBANK close
  (31 Aug), Al Hilal campaign quietly ended, EI banded cashback live to
  30 Sep, Skywards Season of Rewards final week (airline). Hotel desk
  still has no sourced story — deliberate: nothing verifiable surfaced
  today; the desk's backlog stands.
- **News-expiry CI sweep** (`check-news-expiry.mjs` + weekly workflow +
  15 tests): optional `staleAfter` on news; three campaign stories
  backfilled; >60-day untouched stories warn.
- **Seasonal guides**: DSF guide re-checked 22 Aug (32nd-edition dates
  still unannounced — stated, with the 31st edition as anchor); Ramadan
  guide reframed forward to 2027 with 2026 evidence preserved.
- **Housekeeping**: ENBD archived offer moved to the history
  collection; `verifiedBy` date suffixes stripped (L2 `lastVerified` is
  the single displayed date); dev test route unrouted; the
  "Award vs cash calculator" nav label corrected to "Salary-offer
  calculator" (it ranks salary offers); tracker's no-card filter
  confirmed already shipped.
- Validation at ship: astro check 0 errors · 323/323 tests · build
  green · deal + news expiry sweeps clean.
