# News sourcing policy — travel news desks

_Author: head-of-research. Council session:
`.council/sessions/2026-07-27-travel-news-desks-strategy.md`._
_Status: draft for synthesis; binding on the airline-news and
hotel-news desks once the Chairman ratifies the session outcome._
_Companion documents: managing-editor's editorial strategy, the
travel-desks spec, and technical-lead's taxonomy/routing memo (same
directory). This file owns sourcing, attribution, and the monitoring
pipeline only._

Charter anchors: §2 (Firecrawl exclusive to Research), §5
(no advertorial), §6 (LLM-extraction off-limits for typed numerics),
§10 kill-list plus the 2026-05-21 imagery amendment and the
2026-05-29 logo amendment. Nothing here amends the Charter; where
this policy proposes kill-list additions (§4 below), they are
recommendations for Chairman ratification.

---

## 1. The sourcing ladder

Three rungs. A story may be **discovered** anywhere; a story may only
be **published** when every material fact stands on rung 1, or —
where rung-1 verification is genuinely impossible before the story
loses value — the unverified fact is explicitly attributed per §2.
The ladder is a hierarchy of *citation authority*, not of usefulness:
rung 3 is where most stories will be found.

### Rung 1 — Primary sources (the only citable fact base)

**What they are:**

- Airline / hotel-group press rooms and media centres (issuer's own
  domain).
- Loyalty-programme pages: earn/redemption charts, award calculators,
  programme T&Cs, member communications the desk has directly
  received (e.g. a Skywards email to our own account).
- Regulator and government notices: GCAA, Dubai Airports / `dxb.com`,
  DET, `visitdubai.com`, ICP/GDRFA visa pages, IATA operational
  notices.
- **Live booking-engine checks**: an award search or cash-fare search
  run by us, screenshotted/archived with date, route, cabin, and
  passenger count. A booking-engine check is a primary source for
  "what the engine prices today" — it is *not* a primary source for
  "the chart has permanently changed" (engines glitch; see rumour
  handling, §4).
- Official schedule filings surfaced through the airline's own
  booking flow or timetable page.
- Issuer social accounts (verified, official) — *primary for the fact
  that the issuer said it*, secondary for the underlying claim until
  a programme page or press release confirms.

**May be used for:** every number, date, route, fee, rate, and quoted
term in a published story; direct quotation (press-release language,
clearly marked as such); archival before/after snapshots for
devaluation coverage; imagery per the §10 2026-05-21 press-library
amendment (credit line + LIBRARY.md entry mandatory).

**May never be used for:** press-release *spin* reprinted as our
analysis. A press release is primary for facts (dates, routes,
numbers) — its adjectives are marketing. The house rewrite strips
them. Also: §6 applies — any typed numeric destined for a data layer
(`cards.json` etc.) still goes through deterministic parsers, never
LLM extraction, even when the source is primary.

### Rung 2 — Official aggregators and trade channels

**What they are:** programme newsletters and member emails received
by the desk; GDS / fare-filing change notices (e.g. via ExpertFlyer
or equivalent, where our access is legitimate); airport-authority and
tourism-board bulletins; IATA/AACO trade communications; reputable
wire copy (Reuters, WAM — the Emirates News Agency, which for UAE
government announcements often *is* effectively primary); major UAE
press (The National, Khaleej Times, Gulf News, Arabian Business).

**May be used for:** discovery; corroboration; timeline evidence
("the change was filed on…"); citation **only when clearly labelled
as the channel** ("per a fare filing seen 27 July", "per WAM"); UAE
press may be cited for on-the-record statements by officials that
appear nowhere else, with the outlet named.

**May never be used for:** substituting for a checkable primary. If
the programme page exists and states the rate, we cite the programme
page, not the newsletter about it. GDS filings may never be reported
as confirmed product ("Emirates is launching X") — only as filings
("Emirates has filed schedules for X; unannounced schedules change").
Login-walled trade content may inform, never be quoted at length.

### Rung 3 — Competitor coverage (discovery + credit only)

**What it is:** headforpoints.com, thepointsguy.com,
onemileatatime.com, and the wider blog/aggregator ecosystem
(LoyaltyLobby, Live and Let's Fly, Secret Flying, etc.), plus
FlyerTalk / Reddit threads.

**May be used for:**

- **Story discovery.** Their headline tells us something happened; we
  then go find out what happened ourselves.
- **Attributed credit** where their reporting contains facts we could
  not independently verify (see §2 — "first reported by…").
- Context on how a story is being read elsewhere ("HfP reads this as
  a soft devaluation") — always named, never absorbed.
- Competitor-sweep intelligence per my standing quarterly mandate.

**May never be used for:**

- The fact base of our story. Not one number in our copy sources to a
  competitor when a primary exists.
- Structure, section order, examples, or comparative framings lifted
  from their piece. (Plagiarism fence, §2.)
- Their original analysis, valuations, or exclusive interviews,
  reproduced with or without credit — credit licenses a *pointer*,
  not a *reprint*.
- Their images, charts, or screenshots. Ever. We make our own
  booking-engine screenshots and our own charts.
- Forum posts (FlyerTalk/Reddit) as a citable fact source — §10
  already bans user-generated forum content as primary. Forums are
  rung-3 discovery, full stop.

**Ladder rule of thumb:** rung 3 tells us *that*; rung 2 tells us
*when and via which channel*; rung 1 tells us *what, exactly* — and
only rung 1 goes in the fact box.

---

## 2. Attribution standard and the plagiarism fence

### When attribution is owed

| Situation | Obligation |
|---|---|
| We discovered the story on a competitor, then verified every fact against primary sources | Attribution is **good manners, not debt** — default to a single credit line when their spotting was non-obvious (e.g. they caught an unannounced chart change): "…, first spotted by One Mile at a Time." Omitting it is permitted when the trigger was a public press release everyone received. |
| Story contains a material fact we could **not** independently verify | Attribution is **mandatory and load-bearing**: the fact is framed as their reporting, not ours, with a link. |
| Their exclusive reporting (interview, leak, insider sourcing) is the story | We either credit prominently in the first two paragraphs and add only our own verified UAE analysis — or we don't run it. |
| We used their piece only to learn a story existed, and our piece shares no unverifiable facts with theirs | No attribution required. |

### Concrete phrasings (house standard)

- Verified, credit for the spot:
  > "Emirates has cut Skywards flex-award availability on the DXB–LHR
  > morning rotations — a change first spotted by One Mile at a Time,
  > and confirmed in our own award searches this morning."
- Unverified fact, attributed:
  > "Head for Points reports, citing a source at the programme, that
  > the change will extend to partner awards in Q4. Emirates has not
  > published this and we could not verify it; the current partner
  > chart is unchanged as of 27 July."
- Filing-stage news:
  > "flydubai has filed schedules for a daily DXB–[city] service from
  > November, per GDS timetable data. The route is unannounced;
  > filed schedules change."
- Correction posture when the credited outlet was wrong:
  > "An earlier version of this story cited [outlet]'s report that X;
  > the programme's published terms show Y. Corrected [date]."

Attribution links are live, direct to the competitor's article, and
not nofollow-stripped out of spite. We link like a publication that
expects to be linked back.

### The plagiarism fence — what "written in our own way" means

"Written in our own way" **must mean all four** of:

1. **Independent fact base.** Every material fact re-derived from
   rung 1 (or explicitly attributed). If, hypothetically, the
   competitor's article vanished, our story would still stand.
2. **Own structure.** Our story spine comes from the house template
   (per the travel-desks spec), not from the shape of their article.
   If their piece runs chart-table → sweet-spots → verdict, we do not
   mirror that order with different words.
3. **Own analysis.** The valuation math, the "who loses" reasoning,
   the verdict — ours, using our published baselines (e.g. the 2-fils
   Skywards cost basis per the 2026-06-12 ruling), never their
   cents-per-point framework restated.
4. **The UAE/AED angle.** Every figure in AED; the story answers
   "what does this mean for a UAE-based reader" — which cards earn
   the affected currency, what the DXB/AUH/SHJ routes are, whether a
   UAE salary-band or residency wrinkle applies. This is additive
   analysis, not a garnish (see §4 on invented angles).

"Written in our own way" **must never mean**:

- Paraphrase-at-sentence-distance of a competitor's piece (synonym
  swapping, clause reordering). That is content laundering whether or
  not a credit line is present.
- Reproducing their worked examples, their specific illustrative
  routes, or their tables with cosmetic changes.
- Running their exclusive through an LLM to "make it ours." An LLM
  rewrite of someone else's reporting is laundering with extra steps
  and is banned outright.
- Aggregating three competitors' takes into a round-up presented as
  original reporting.

**Operational test (the two-window rule):** the writer reads the
discovery source, closes it, and drafts from the dossier/primary
sources only. The competitor tab is reopened solely to write the
credit line and check we haven't accidentally converged on their
structure. The Fact-Checker's Stage 6 pass includes a
side-by-side laundering check on any story whose dossier lists a
rung-3 discovery source.

---

## 3. Monitoring pipeline design

### Architecture principles

- **Channel:** per CLAUDE.md, Firecrawl MCP tools do not inherit into
  sub-agent runtimes, and the web-session network allowlist 403s
  several press hosts (`www.emirates.com`, `www.etihad.com`,
  `media.flydubai.com`, `news.marriott.com`, `content.presspage.com`
  confirmed 2026-05-24). The monitor therefore runs as a **scheduled
  GitHub Actions job** (same egress as `scrape.yml`, which reaches
  these hosts fine), writing a diff digest the desks read — it does
  not run live in editorial sessions. Technical Lead owns the
  implementation; this section is the requirements spec.
- **RSS first, Firecrawl second.** The three competitor sites are
  WordPress-family stacks with standard feeds. Feed polling is a
  plain HTTP GET in Actions — **zero Firecrawl credits**. Firecrawl
  is reserved for (a) press rooms without feeds, (b) JS-rendered
  pages, (c) per-story verification scrapes.
- **Diff, don't re-read.** Each cycle scrapes the index/press-room
  page only; article-level scrapes fire only when a new URL appears
  and passes a UAE-relevance keyword screen (Emirates, Etihad,
  flydubai, Dubai, DXB, AUH, Skywards, Etihad Guest, Qatar, GCC,
  Marriott Bonvoy + UAE, etc.).
- **Archive everything cited.** Any page a story will cite gets a
  same-day Firecrawl snapshot into
  `.council/research/news-monitor/raw/` — devaluations are proven
  with before/after archives, and issuer pages rewrite themselves.

### Target list

URLs from knowledge; **each marked (v) needs a one-time verification
scrape before the pipeline ships** — press-room paths churn.

**Tier D — Discovery (competitors; RSS, no credits)**

| Target | URL | Frequency |
|---|---|---|
| Head for Points | `https://www.headforpoints.com/feed/` | 2×/day |
| The Points Guy — news | `https://thepointsguy.com/feed/` (v) | daily |
| OMAAT | `https://onemileatatime.com/feed/` | 2×/day |
| HfP category index (fallback if feed truncates) | `https://www.headforpoints.com/category/airline-news/` (v) | weekly, Firecrawl |
| TPG news index (fallback) | `https://thepointsguy.com/news/` | weekly, Firecrawl |
| OMAAT news index (fallback) | `https://onemileatatime.com/news/` (v) | weekly, Firecrawl |

**Tier P1 — Airline press rooms (Firecrawl, index-page diff)**

| Target | URL | Frequency |
|---|---|---|
| Emirates Media Centre | `https://www.emirates.com/media-centre/` | 3×/week |
| Etihad newsroom | `https://www.etihad.com/en-ae/news` (v) | 3×/week |
| flydubai press | `https://media.flydubai.com/` (v — host returned 000 from web session; confirm Actions egress resolves it) | 2×/week |
| Qatar Airways press releases | `https://www.qatarairways.com/en/press-releases.html` (v) | 2×/week |
| Air Arabia press releases | `https://www.airarabia.com/en/press-releases` (v) | weekly |
| Wizz Air (Abu Dhabi) news | `https://wizzair.com/en-gb/information-and-services/about-us/news` (v — AD releases publish through group newsroom) | weekly |

**Tier P2 — Hotel press rooms (Firecrawl, index-page diff)**

| Target | URL | Frequency |
|---|---|---|
| Marriott | `https://news.marriott.com/` | 2×/week |
| Hilton | `https://stories.hilton.com/` | 2×/week |
| Accor | `https://press.accor.com/` (v) | weekly |
| IHG | `https://www.ihgplc.com/en/news-and-media` (v — corporate; check for a consumer newsroom too) | weekly |
| Rotana | `https://www.rotana.com/mediacentre` (v) | weekly |
| Jumeirah | `https://www.jumeirah.com/en/press` (v) | weekly |

**Tier L — Loyalty-programme pages (Firecrawl; these are also the
verification surface for devaluation stories)**

| Target | URL | Frequency |
|---|---|---|
| Skywards news/offers | `https://www.emirates.com/ae/english/skywards/` + programme T&C page (v — pin exact news/terms URLs at build time) | weekly |
| Etihad Guest | `https://www.etihadguest.com/` news + terms (v) | weekly |
| Qatar Privilege Club news | `https://www.qatarairways.com/en/Privilege-Club.html` (v) | fortnightly |
| Marriott Bonvoy / Hilton Honors / One Rewards / ALL terms pages | pinned per-programme T&C URLs (v) | monthly archival snapshot |

**Tier R — Regulator / infrastructure**

| Target | URL | Frequency |
|---|---|---|
| GCAA media | `https://www.gcaa.gov.ae/` news section (v) | weekly |
| Dubai Airports media centre | `https://www.dubaiairports.ae/` (v) | weekly |
| WAM (Emirates News Agency) aviation/tourism | `https://www.wam.ae/en` (v — check for section feeds) | via RSS if available, else weekly |

### Credit envelope

Assumptions: 1 credit per standard scrape; card scrape ≈ 500
credits/cycle per the session brief (the Charter references both a
weekly cron and a monthly refresh — I budget for the **weekly**
worst case, ≈ 2,150/month, so this envelope is safe under either
reading).

| Line | Calc | Credits/month |
|---|---|---|
| Tier D feeds | RSS, plain HTTP | 0 |
| Tier D index fallbacks | 3 × 4 | 12 |
| Tier P1 airline press indexes | (2×13) + (2×9) + (2×4) ≈ | ~70 |
| Tier P2 hotel press indexes | (2×9) + (4×4) ≈ | ~34 |
| Tier L programme pages | ~10 | 10 |
| Tier R regulator | ~10 | 10 |
| Article-level scrapes on new relevant URLs | ~40 stories screened × 1–2 pages | ~70 |
| Per-story verification + before/after archives | ~10 published stories × ~5 pages | ~50 |
| Retries / breakage / one-time (v) verifications | buffer | ~75 |
| **News-monitor total** | | **≈ 330, cap 500** |

**Envelope: news monitoring is capped at 500 credits/month** (10% of
plan). With the weekly card scrape at ~2,150/month, total worst-case
consumption ≈ 2,650 of 5,000, leaving ~2,350 headroom for dossiers,
SERP scans, and quarterly sweeps. If the card scrape is monthly
(~500), headroom is ~4,000. Either way the two news desks fit the
Hobby plan without a plan upgrade. The monitor job must log its
credit spend per run (as `scrape.yml` logs `LATEST_RUN.log`) so the
cap is observable, and must **hard-stop for the month** if its
cumulative spend hits the cap — a broken selector must degrade to
"no monitoring," never to "ate the card-scrape budget."

### Known constraints (restated for the record)

- Web-session allowlist blocks key press hosts; the monitor **must**
  run in GitHub Actions. Desk editors and Fact-Checker verify against
  the archived snapshots in `.council/research/news-monitor/raw/`,
  not live fetches — same pattern the Charter already mandates for
  fact-check of airline/bank pages.
- Firecrawl LLM `/extract` may seed prose summaries in the digest;
  per Charter §6 it may **not** emit typed numerics. Award-chart
  numbers entering any data layer go through deterministic parsers
  (Technical Lead to extend `scripts/scrape/_lib.ts` if the desks
  want structured chart tracking — separate fenced brief).

---

## 4. Kill-list additions for news copy

Proposed additions to the §10 kill-list, scoped to the news desks.
Recommendations for Chairman ratification; the desks operate to them
from day one regardless.

1. **No reprinting embargoed or exclusive content.** If material is
   under embargo we hold to the embargo time without exception. A
   competitor's exclusive (interview, leak) is never reproduced;
   credit-and-pointer plus our own verified analysis, or no story.
2. **No invented UAE angles.** If the honest UAE relevance is thin,
   the story is a two-paragraph brief or is skipped — we do not
   bolt "and Dubai residents love to travel" onto a US card story.
   The UAE angle must contain at least one verifiable UAE-specific
   fact (route, AED price, UAE card earn rate, local T&C clause) or
   the story doesn't carry one.
3. **Rumour handling.** Unconfirmed changes run only when (a) two
   independent rung-1/rung-2 signals exist (e.g. GDS filing +
   engine behaviour), or (b) a named outlet's reporting is the sole
   basis and is framed as such per §2. Rumours never state as fact
   in the headline: "Skywards appears to have…", "filed but
   unannounced". A single anomalous booking-engine result is a
   glitch until reproduced across dates/routes or confirmed on a
   published page.
4. **Correction duty.** When a sourced story changes — issuer
   reverses, a credited outlet retracts, a filing is pulled — the
   story is corrected within 24 hours of the desk learning of it,
   with visible correction language (never silent edits), and the
   change is logged in the public corrections posture per the
   2026-06-12 trust ruling. A previously-cited source being
   retracted escalates to the Chairman per my standing matrix.
5. **No competitor imagery, charts, or screenshots** in any form,
   credited or not. Booking-engine evidence is our own capture with
   date and search parameters visible.
6. **Devaluation stories require archived before/after evidence**
   (our own snapshots) or they run as attributed reports, not as
   confirmed devaluations.
7. **Mistake fares / pricing errors:** may be reported as news with
   an explicit "the airline may cancel these tickets" caveat; never
   framed as a recommendation to book with connecting travel booked
   separately; §5's no-advertorial posture applies to the
   surrounding copy.
8. **No LLM rewrite of another outlet's article** as a drafting
   shortcut, under any credit arrangement (restates §2's fence as a
   kill-list item so the Chairman can flag it at the gate).

---

## 5. Worked example — a Skywards devaluation first spotted on OMAAT

**T+0, discovery.** The Tier-D monitor digest flags an OMAAT post:
"Emirates Skywards Devalues Partner Awards Without Notice." The
airline-news desk opens a story ticket. The OMAAT tab is read once
for scope (which partners, which cabins, when noticed), then closed
— two-window rule in force.

**T+0–4h, verification (Research + desk).**

1. Pull the most recent archived Skywards partner-chart snapshot from
   the Tier-L monthly archive (this is why Tier L exists).
2. Fire a fresh Firecrawl scrape (GitHub Actions channel — Emirates
   hosts 403 from web sessions) of the current partner-award pages
   and programme T&Cs. Diff old vs new: which partners, which bands,
   percentage increases, computed in AED-relevant terms.
3. Run two live award searches on emirates.com/partner engine for
   UAE-relevant routes (e.g. DXB–JNB on the affected partner,
   DXB–BKK control route), screenshot with dates and parameters.
4. Check the Emirates Media Centre and Skywards news page: was this
   announced? (Assume no — that's the story's edge.)
5. Everything archived to `.council/research/news-monitor/raw/` with
   URL + scrape ID + date; dossier stub written with the diff table.

**Outcome fork:** if the diff confirms the change → confirmed story.
If the pages are unchanged and only engine behaviour differs →
rumour-handling rule 3 applies: reproduce across dates or run as an
attributed report ("OMAAT reports…; the published chart is unchanged
and Emirates has not responded").

**T+4h, the write.** Drafted from the dossier only. House spine, not
OMAAT's. Attribution in paragraph two:

> "The change was not announced by Emirates — it was first spotted by
> One Mile at a Time on Monday — but it is live on the published
> partner chart, and our own award searches confirm it."

**House angle (the reason the story is ours):** partner-award
inflation restated in AED using the ratified 2-fils cost basis
("a Business-class partner award DXB–JNB now needs 27,500 more miles
— about AED 550 of card spend at typical UAE earn rates"); which UAE
cards earn Skywards and how the effective return moves (figures from
L2 `cards.json`, never re-derived by LLM); whether Etihad Guest's
equivalent partner pricing now undercuts it for UAE-based flyers;
what a member with a pending redemption should do this week. Any
cash-fare-avoidance comparison labelled as such per the 2026-06-12
valuation ruling — never presented as the baseline.

**Gate path.** Stage 5.5 UX → Stage 6 Fact-Checker (verifies every
number against the archived snapshots; runs the side-by-side
laundering check against the OMAAT piece) → Stage 6.5 Standards →
Stage 7 Chairman. Post-publish: the affected chart URLs move to
weekly monitoring for a month (reversals happen and trigger the
correction duty).

---

## Open questions for synthesis

1. ~10 of the target URLs are marked (v) and need a one-time
   verification pass — I cannot run Firecrawl in this session; this
   is the first task once the monitor brief is approved (~25 credits
   from the buffer line).
2. flydubai's press host returned `000` from the web session; if
   Actions egress also fails, the fallback is WAM + flydubai's main
   site news section.
3. Whether the desks want structured award-chart tracking (typed
   numerics → deterministic parser extension in
   `scripts/scrape/_lib.ts`) is a separate fenced T3 brief for
   Technical Lead; this policy only covers prose monitoring.
4. ExpertFlyer/GDS access is assumed-legitimate in rung 2 — we hold
   no subscription today; Managing Editor to decide whether to
   acquire one before filing-stage stories are in scope.

## Last verified
2026-07-27 (URLs from knowledge, not scraped — see (v) marks.)

End.
