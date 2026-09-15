---
status: open
tier: T2
raised-by: Chairman ruling R9 on the 6–7 September site audit (15 September 2026)
owner: managing-editor (cadence) → lifestyle-culture-editor (deals desk)
chairman-status: pending
---

# Brief — a deals cadence for the DSF season

**Date:** 2026-09-15
**Tier:** T2 (content cadence; no schema or template change)
**Trigger:** Chairman ruling R9, given in-session on 15 September 2026:
"keep deals in the nav with an honest count; expired deals stay as dated
records; open the DSF brief."

## What the audit found (F-047, F-013)

`/deals/` holds three live deals and occupies a primary nav slot, a
homepage directory tile and a Travel-panel row. Two of the three live
entries are salary-transfer offers already on the tracker. The desk is
the thinnest top-level section on the site.

## The ruling, and what it settles

1. The nav slot stays. The primary-nav label now carries the live count
   ("Deals · 3 live"), computed at build from the deals collection, so the
   number argues for itself.
2. Expired deals are **dated records**, never redirects. `archived: true`
   keeps the page, and `/deals/<slug>/` renders the expired banner. This is
   the salary-transfer precedent (offers move to a history collection and
   render a dated "ended" sentence) applied to deals as a rule.
3. The desk commits to a cadence for the DSF season under this brief.

## Ask

- **Cadence.** A ceiling in the news desks' pattern: target 1–2 new deals a
  week from mid-November through DSF, with a floor of six live deals on
  1 December 2026. Deals are dated and sourced to the issuer's own page;
  the sourcing ladder in `.council/research/2026-07/news-sourcing-policy.md`
  applies unchanged.
- **Scope.** DSF retail and dining promotions that touch a UAE card,
  bank or loyalty currency; card-spend promotions timed to the season;
  salary-transfer promotions are the tracker's, not the desk's, unless
  the deal is a card-side bundle.
- **Sources to watch.** The bank offers pages already in
  `scripts/monitor/offers.registry.json` once populated; DSF's own
  programme announcements; issuer press rooms via the news monitor.
- **Successor check now.** Etihad's UAE offers page carries a "4 new
  destinations, one special fare — book by 18 September" tile (read
  14 Sep 2026, no Miles price shown). The desk decides whether it is a
  deal before the window closes.

## Stages

- Stage 3 research: Head of Research seeds the DSF calendar and the
  offers registry candidates (`scripts/monitor/discover-offers.mjs`).
- Stage 4 SEO: one keyword spec for the season's deal pages.
- Stage 5–7: per-deal, through the normal gates. Chairman gate applies
  to each deal as it ships.

## Done means

Six live deals on 1 December 2026, each dated and sourced, with the
count on the nav reflecting it. Recorded in the deals desk's post-mortem
at Stage 10.
