# Council session synthesis: Travel news desks + editorial strategy

_Session: `.council/sessions/2026-07-27-travel-news-desks-strategy.md` ·
Synthesised 27 July 2026 by the convenor. Four participants, four
disjoint deliverables, one shipped proof._

## What each agent recommended

**Managing Editor** (`research/2026-07/editorial-strategy-2026-h2.md`)
— Seven-desk map with weekly **ceilings, not quotas** (banking news 1–2,
airline 2–3, hotel 1–2, deals 1 + expiry check, one review touched, one
guide slot, data products verified weekly). A **news track** through the
gates: Stages 4/5.5 template-approved once rather than per-post,
Fact-Checker never waived, Standards sampled after a 10-post ramp,
Chairman gate kept but reduced to a five-line same-day rubric. The
scrape cycle is formalised as a story-discovery engine (24-hour
newsability triage of every data diff — the 26 July run producing two
27 July posts is the standing model). Biggest risk: gate throughput;
a defined shed order if cadence slips.

**Head of Research** (`research/2026-07/news-sourcing-policy.md`)
— Three-rung sourcing ladder: **primary** (press rooms, T&Cs, regulator
notices, dated booking-engine captures) is the only citable fact base;
**official aggregators** corroborate; **competitors (HfP/TPG/OMAAT)
are discovery-and-credit only** — never a number, never structure,
enforced by a two-window rule plus a Fact-Checker side-by-side
laundering check at Stage 6. Monitoring pipeline: competitor RSS is
free; Firecrawl reserved for press-room diffs and per-story
verification, capped at 500 credits/month (~330 realistic) — fits the
Hobby plan with ~2,350 headroom even in a weekly-scrape month. Hard
constraint: key press hosts 403 from web sessions, so **the monitor
must run in GitHub Actions** with desks reading archived snapshots.

**Travel-Experiences Editor** (`research/2026-07/travel-desks-spec.md`)
— Desk mandates with the **"currency governs"** boundary rule: the desk
whose points currency moves owns the story; section editors keep
evergreen judgement products; lifestyle keeps the venue layer. Three
formats (quick hit 120–250w, standard 300–550w default, analysis
600–900w with editor sign-off, max one per desk per week), every format
requiring AED figures, a "what it means for UAE members" section, a
verified-date line, ≥1 primary source and ≥1 pillar link. Draft agent
definitions for `airline-news-editor` and `hotel-news-editor` are in
the spec, awaiting Chairman ratification before the fenced files ship.

**Technical Lead** (`research/2026-07/news-taxonomy-routing.md` +
**shipped proof**, commit `8efb8f9`) — Chose an optional **`beat`
field** (`banking|airline|hotel`) over widening `NEWS_CATEGORY`:
category answers "what kind of story," beat answers "which desk," and
the Skywards post proves the axes collide. Shipped: schema + post
classification, shared `NewsIndexLayout`, `/news/banking/`,
`/news/airlines/`, `/news/hotels/` with desk tabs and an honest
empty state for the hotel desk, and the Travel nav rewired — "Hotel
reviews", "UAE staycations" and the whole "Routes & destinations"
group removed until their content types exist. check 0/0, tests
204/204, build green, dist verified. Follow-ups queued: per-beat RSS,
hotel programmes living under `/airlines/` URLs, desk-index JSON-LD.

## Trade-offs explicit

1. **Speed vs gates.** The news track buys same-day publication by
   pre-approving templates and sampling Standards — the cost is that a
   badly-templated story class fails uniformly until sampled. Mitigant:
   Fact-Checker is never waived and every post carries sources.
2. **Ceilings vs SEO volume.** 2–3 airline stories/week is deliberately
   below aggregator volume; the bet is that UAE-relevance and data
   authority beat firehose coverage. Revisit with analytics.
3. **`beat` field vs enum purity.** Two orthogonal axes cost a little
   schema surface; the alternative (enum merge) silently loses one axis
   on every crossover story.
4. **Nav honesty vs menu richness.** Removing five Travel rows shrinks
   the menu today; each returns only behind a real brief (hotel
   programme profiles 1 Oct, staycations pillar Nov, routes 2027 per
   the ME strategy).
5. **Actions-based monitoring vs immediacy.** Running discovery in CI
   means desks work from snapshots, not live pages — slower by up to
   one cycle, but it is the only egress that reaches the press hosts,
   and it archives evidence for Fact-Check by default.

## Decision questions for the user (Chairman)

1. **Ratify the two desk agents?** The fenced files
   `.claude/agents/airline-news-editor.md` / `hotel-news-editor.md`
   ship verbatim from the spec's drafts on your word (Charter: agent
   prompts are Chairman-gated).
2. **Cadence ceilings** — confirm 2–3 airline / 1–2 hotel per week, or
   set different numbers. (Strategy doc is written to these.)
3. **Attribution posture** — confirm primary-first with named credit
   when not independently verified ("first reported by…"), per the
   sourcing policy.
4. **Merge the proof?** Commit `8efb8f9` (beat routes + honest nav) is
   on the branch, validated, ready for the normal PR gate. The removed
   nav rows are T2 copy changes flagged for your sign-off.

## Artefacts shipped

- Proof: beat-filtered news routes + honest Travel nav, commit
  `8efb8f9` on `claude/session-handoff-june-10-9ufa50`.
- Four research documents under `.council/research/2026-07/`.
- This synthesis.
