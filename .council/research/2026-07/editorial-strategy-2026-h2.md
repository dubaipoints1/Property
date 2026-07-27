---
slug: editorial-strategy-2026-h2
author: managing-editor
session: 2026-07-27-travel-news-desks-strategy
status: draft-for-synthesis
date: 2026-07-27
---

# Editorial strategy — H2 2026

_Managing Editor deliverable for the 27 July council session. This is
the whole-publication strategy and cadence. The sourcing policy
(Head of Research), the two desk specs (Travel & Experiences Editor),
and the taxonomy/routing proof (Technical Lead) are companion
documents in this directory; nothing here duplicates them._

---

## 0. Where we actually are

Strategy starts from the shipped inventory, not the ambition:

- **55 card reviews** (L2 `src/data/cards.json` + L3 MDX), all twelve
  covered banks in `scripts/scrape/banks.registry.json`.
- **19 guides**, **6 programme pages**, **12 bank hubs**.
- **Salary-transfer tracker** — live data product with history
  collection and calculator island.
- **Deals desk** — two posts ever, one expired. Effectively dormant.
- **News desk** — 7 posts: 5 from the May launch cluster
  (banking-dominated), then a six-week silence, then 2 on 27 July
  (`adcb-365-cashback-earn-table-rebalance-2026`,
  `emirates-islamic-switch-welcome-extended-30-september`) — both
  born from the 26 July data run.
- **Navigation debt** — `src/components/Header.astro:82–93` promises
  Airline news, Hotel news, Hotel reviews, UAE staycations, and
  Routes & destinations. "Airline news" and "Hotel news" resolve to
  the single mixed `/news/` feed; "Hotel reviews" points at
  `/airlines/`; "UAE staycations" points at `/deals/`. The menu is
  writing cheques the content model cannot cash.
- **Analytics** — the Cloudflare Web Analytics token in
  `BaseLayout.astro` is still the placeholder string. We are flying
  without instruments; §5 KPIs activate the day that changes.

The pattern in that inventory: **the reference library is strong; the
publishing rhythm is weak.** 55 reviews and a live tracker is a real
moat. Seven news posts in three months is not a news desk — it is a
changelog. H2's job is to convert a reference site into a publication
that people have a reason to open twice a week, without pretending a
solo operator plus agents is a twelve-person masthead.

---

## 1. The desk map and what each desk owes

After the two travel desks land, the publication runs **seven desks**.
Three are news beats, four are the standing library. Every desk has a
named owning agent and a cadence obligation stated as a **ceiling for
news** (UAE-relevance is the filter; nobody publishes to fill a
quota) and a **floor for the library** (the reference content decays
if untouched).

| Desk | Owner (Stage 5) | Weekly | Monthly |
|---|---|---|---|
| **Banking news** | business-realestate-editor | 1–2 posts (Mon anchor slot + breaks) | scrape-triage note within 24h of the scrape PR (see §4) |
| **Airline news** _(new)_ | airline-news desk agent | 2–3 posts, event-driven, UAE-relevant only | 1 "state of the programme" round-up if the month warrants it |
| **Hotel news** _(new)_ | hotel-news desk agent | 1–2 posts (the UAE-relevant hotel wire is genuinely thinner than airline; do not pad) | — |
| **Deals** | lifestyle-culture-editor | 1 post (Tue slot) + expiry check on every live `expiresOn` | expired-deal archive sweep |
| **Reviews (cards)** | section editor by beat | 1 review touched — new card or full refresh (Wed slot) | clear any `needs-review` provenance flags raised by the scrape |
| **Guides** | section editor by beat | 1 slot (Thu): new guide and refresh alternate fortnights | — |
| **Data products** (tracker, valuations, bank hubs, L2) | business-realestate-editor + technical-lead | tracker offers verified weekly | scrape-cycle L2 merge review; quarterly valuation re-derivation (the Etihad Guest rows queued under the 12 June ruling are first) |

Plus two cross-desk fixtures: the **Friday recap** (rotates to
whichever editor published most, per existing practice) and, once
analytics land, the **monthly traffic memo**
(growth-analytics-lead, Stage 10).

**Honesty check on total volume.** That grid is 5 anchored library
items plus 4–7 short news posts per week — 9–12 published items at
peak. It works only because news posts are 250–500 words on a fixed
template and because the binding constraint is **verification slots,
not writing**. If a week gets heavy, the shed order is explicit:
hotel news first, then the Tue deal, then the Thu guide slot. The
Wed review-touch and the tracker verification are never shed — they
are the moat. The three news ceilings are re-examined at the
end-of-September checkpoint (§6) against actual UAE-relevant story
supply; if airline news averages under 1/week of genuinely relevant
stories, the ceiling comes down rather than the relevance bar.

**Cross-desk ownership rule** (extends my existing routing table):
a story that touches both a programme and a card — a Skywards earn
change that reprices the ENBD co-brands, say — is **one story, owned
by the airline desk**, with the card-side arithmetic as a section in
that post and any needed review updates opened as follow-up briefs.
Two desks never publish the same event. Disputes come to me;
recurring ones go to the Chairman per the escalation matrix.

---

## 2. The news track: how 300-word posts move through a 10-stage pipeline

The Stage 1–9 pipeline in `.council/02_workflow.md` was built for
reviews and guides; run literally, it puts a 300-word fee-change post
through five sequential review gates and a multi-day SLA. News that
publishes 96 hours after the event is not news. The workflow already
contains the precedent we need: the **expedited deals path** (Stages
3–7 collapse into a 4-hour combined pass). I propose a parallel
**news track**, ratified once by the Chairman as a standing logged
justification (the Charter permits the Chairman, and only the
Chairman, to collapse stages with written reasoning — this document
is the request for that ratification).

**News track (N-track), for posts in `src/content/news/` only:**

- **Stages 1–2 (intake/brief):** no brief file. The desk's discovery
  log entry (format per the Head of Research sourcing policy) *is*
  the brief. I see it in the daily standup, not before drafting.
- **Stage 3 (research):** dossier-lite — the primary source URL(s)
  in the post's `sources:` frontmatter, plus discovery attribution
  where the sourcing policy requires it. The existing news schema
  already enforces `sources` as URLs; a news post with an empty
  sources array does not leave the desk.
- **Stage 4 (SEO):** waived per-post. The SEO Strategist instead
  owns a standing **news headline & schema pattern** (one document,
  reviewed quarterly). News lives or dies on freshness, not on
  per-post keyword specs.
- **Stage 5 (draft):** desk editor, on the fixed news template.
- **Stage 5.5 (UX):** waived per-post, **replaced by template
  approval**. Head of UX reviews and signs the news post template
  once (and again whenever the template changes). A fixed 300–500
  word layout does not need a per-post scannability review; the
  template either scans or it does not.
- **Stage 6 (fact-check): never waived.** Every AED figure, every
  date, every rate against the primary source. This is the one gate
  speed is not allowed to buy. Note the deliberate asymmetry with
  the expedited deals path: there, I stand in as Fact-Checker; on
  the news track the **real Fact-Checker runs Stage 6**, because
  news claims are externally-controlled facts about other people's
  products and our trust posture (per the 12 June B15 ruling) is
  built entirely on verifiable figures. Target turnaround: same
  session, since the check is typically 3–6 claims.
- **Stage 6.5 (standards): sampled, not per-post** — with a ramp.
  The **first ten posts of each new desk** get full per-post
  Standards review until the desk's voice settles. Thereafter the
  Standards Editor audits a weekly sample (minimum two posts per
  desk) and any post the Fact-Checker or I flag for tone. Voice
  drift found in sampling puts that desk back on per-post review
  for ten posts.
- **Stage 7 (tech):** folded into publish. `npm run check` +
  build green; the segmented news routes (this session's
  technical-lead proof) carry the schema pattern.
- **Stage 8 (Chairman): mandatory, unchanged, and cheap.** Charter
  non-negotiable #3 is not negotiable and this strategy does not
  ask it to be. What the gate *means* for a 300-word post: a
  read-through against a five-line news rubric — (1) headline says
  what happened, no bait; (2) attribution per sourcing policy is
  present; (3) the UAE/AED angle is real, not bolted on; (4) no
  advertorial scent; (5) the "who should care" turn is honest,
  including "almost nobody" when true. Target: same-day decision.
  If Chairman turnaround becomes the bottleneck, the answer is
  batching the gate (one sitting, several posts) — never skipping
  it. Both 27 July posts already model the rubric.
- **Stages 9–10:** unchanged. News posts enter the Stage 10
  dashboard like everything else.

Anything that outgrows the news shape — a fee change that demands
re-running a review's arithmetic, a devaluation needing a full
sweet-spot re-derivation — **leaves the news track**: the news post
ships fast with the fact, and a standard-track brief opens for the
analysis. The news track is for reporting, not for smuggling
analysis past the pipeline.

---

## 3. Nav-promise gaps: what becomes real, what gets de-scoped

Default posture, per the session scope: **the nav tells the truth
today, and grows a link the day the content exists** — never the
reverse. Priority order for H2:

1. **Segmented news indexes — now (this session).** `/news/airlines/`,
   `/news/hotels/`, `/news/banking/` per the technical-lead's routing
   proof, with the `NEWS_CATEGORY` enum in `src/content.config.ts`
   extended. Nav's "Airline news" / "Hotel news" point at the real
   indexes. This is the cheapest honesty available: the content type
   exists, only the routing was dishonest.
2. **Hotel reviews — real brief, October.** De-scope from nav
   immediately (the current link to `/airlines/` is not a gap, it is
   a mislink). We cannot review hotels the way we review cards — no
   stay budget, and AI-fabricated stay experience is unthinkable
   under our trust posture. What we *can* ship honestly is the
   **points-hotel profile**: a data-led format — award rates by
   season, AED cash comparison, elite-benefit delivery, which card
   feeds the programme — in the idiom our Bonvoy and Hilton
   programme pages already use ("the two Dubai Waldorfs for
   staycations"). Brief opens 1 October; four Dubai flagship
   properties by year-end; cadence one per month. Nav link returns
   at four live profiles.
3. **UAE staycations — one pillar guide, November.** De-scope from
   nav now ("staycations" currently points at a deals index holding
   one live deal). Staycation demand is seasonal; the honest play is
   a single pillar guide — booking on points vs card rates vs cash,
   AED-first — briefed mid-October to publish early November when
   the weather (and the search curve) turns, cross-linked to the
   hotel profiles as they land. Nav link returns with the guide.
4. **Routes & destinations — de-scoped for all of H2.** A route-page
   system is a new content collection, new template, new data
   maintenance burden — a T3 programme competing against desks we
   have just committed to. Route-shaped material keeps landing where
   it already lives and performs
   (`skywards-business-class-redemptions-2026` and the sweet-spot
   guides). Revisit at 2027 planning with H2 traffic evidence. The
   nav section goes until then.

De-scoping is not retreat; it is sequencing. Every de-scoped item
above has a named return condition.

---

## 4. The refresh economy: scrapes, sweeps, and news feed each other

The 26 July run showed the machine working end-to-end, and H2
formalises it as a loop rather than a happy accident:

**Precedent, stated precisely.** The scheduled scrape
(`.github/workflows/scrape.yml`, all twelve banks) ran 26 July;
`propose-changes.ts` wrote the merge PR and `LATEST_SCRAPE.md`
15:36 UTC. Within 24 hours the diff review had produced **two news
posts** (the ADCB 365 earn-table rebalance; the Emirates Islamic
Switch welcome extension — both `publishedAt: 2026-07-27`, both
sourced to issuer pages) and a sweep of expired welcome-cycle claims
across the affected reviews. Separately, the 2 July fact-check sweep
(`fact-check-sweep-2026-07-02.md`) — ten reviews ranked by
inbound-link weight × verification age — found zero drift but still
yielded a news-grade discovery (the Switch extension date) and
settled three `needs-review` provenance flags.

**The loop, as standing process:**

1. **Scrape → triage.** Within 24h of every scrape PR, I run a
   **newsability triage** on the diff: every material change is
   dispositioned as (a) a news post on the relevant desk's track,
   (b) an L3/review edit brief, or (c) a logged no-action. The
   triage note lives beside the run log. No diff dies unread.
2. **Sweep → freshness.** The 2 July sweep becomes a **monthly
   fixture** (first week), same ranking method, run by the
   Fact-Checker. The 90-day `lastVerified` UI flag is the
   public-facing backstop; the sweep's job is to make sure readers
   never see it. Sweep findings route through the same triage
   disposition.
3. **News → refresh.** The new travel desks feed the loop in
   reverse: an airline or hotel story that changes a fact on a
   programme page or review (earn rate, transfer ratio, lounge
   rule) *must* open a refresh brief on that page as part of
   shipping the post — the post's `relatedCards`/`relatedPrograms`
   frontmatter is the checklist. A news desk that reports a change
   our own library still contradicts is worse than no news desk.
4. **Deals → expiry.** Every `expiresOn` in the deals collection is
   checked in the Tue slot; expired deals are archived same week.
   One expired deal sitting live in a two-post collection is the
   exact credibility failure this loop exists to prevent.

The strategic point: **the scrape pipeline is a story-discovery
engine, not just a data-hygiene chore.** Both July news posts came
from our own verification machinery before any aggregator covered
them for a UAE audience. That — not rewriting HfP faster — is the
banking desk's structural edge, and the sourcing policy's
aggregator-discovery stack gives the travel desks the equivalent.

---

## 5. KPIs, once analytics land

Precondition: the Cloudflare Web Analytics token replaces the
placeholder in `BaseLayout.astro`. Until then, only the operational
KPIs (which need no analytics) are live; the growth KPIs activate at
token-day + 60 (baseline period first — no targets invented before
we have a floor to measure from).

**Operational (live immediately, reported in the Friday recap):**

- **Freshness:** % of the 55 reviews with `lastVerified` ≤ 90 days —
  target 100%; volatile fields on the top-10 linked reviews ≤ 30
  days per the Stage 6 rule.
- **News latency:** median hours from source event (or scrape-run
  timestamp) to published post — target ≤ 48h; % of posts through
  the Chairman gate same-day.
- **Cadence adherence:** posts per desk vs the §1 grid, reported as
  actual/ceiling — with the explicit note that under-ceiling on
  news with full UAE-relevance is success, not failure.
- **Verification discipline:** 100% of news posts with populated
  primary `sources:`; corrections count per desk per month (a
  desk's third correction in 30 days triggers the escalation-matrix
  review).
- **Loop closure:** % of scrape-diff items dispositioned within
  24h; % of news posts whose related-page refresh briefs closed
  within 7 days.

**Growth (from token-day + 60, in the monthly traffic memo):**

- Organic clicks to `/news/*` by desk, and news's share of new
  sessions.
- **News-to-library click-through:** % of news sessions that reach
  a review, guide, or the tracker. News is a funnel into the
  reference library, not a destination; if this number is poor, the
  desks are publishing wire copy, not dubaipoints journalism.
- Return-visitor rate — the single best proxy for "reason to open
  the site twice a week".
- Refresh economics: position recovery on refreshed pages at T+30
  (Stage 10 already specifies the mechanism).

**What we deliberately do not measure desks on:** raw pageviews per
post. A 300-word fee-change post that saves 400 readers from a bad
application is doing its job at numbers that would embarrass a
listicle. The mix metric is the traffic memo's job, quarterly, with
the Chairman.

---

## 6. Sequencing and checkpoints

- **Weeks 1–2 (from ratification):** segmented news routes live;
  desk agents shipped post-Chairman-sign-off; N-track ratified;
  each travel desk publishes its first posts on full per-post
  Standards review.
- **September checkpoint:** news ceilings vs actual UAE-relevant
  supply reviewed; Standards sampling begins for any desk past ten
  posts; hotel-profiles brief drafted.
- **1 October:** hotel-profiles brief opens. **Mid-October:**
  staycations pillar brief. **Early November:** staycations guide
  publishes; first two hotel profiles live.
- **Year-end review:** four hotel profiles live and nav link
  restored; routes decision packaged for 2027 planning with H2
  evidence; this strategy re-cut against the first two months of
  real analytics.

Single biggest risk, named plainly: **review-gate throughput.** The
plan roughly doubles weekly published items, and every one still
passes a real Fact-Checker and a real Chairman. If either gate
backs up, the failure mode is quiet SLA slippage that turns "news"
into "olds". The standup flags any post stuck > 24h at a gate; two
such flags in a week and the shed order in §1 executes before
quality does.

— Managing Editor, 27 July 2026. For synthesis and Chairman
ratification (the N-track stage collapses and the nav de-scopes are
Chairman calls; everything else is within existing decision rights).
