---
slug: card-data-audit-and-ui-programme
vertical: business-realestate
assigned-editor: business-realestate-editor
research-status: complete
seo-status: deferred
draft-status: complete (data patches landed; MDX prose refresh deferred)
factcheck-status: in-progress
tech-status: complete (components shipped; UX review in flight)
ux-stage-5-5-status: in-progress
standards-status: pending
chairman-status: pending
target-publish: 2026-05-27
sources-required: 34
sources-verified: 34
tier: T3
phase-2-expansion-queued: all-UAE-banks (Mashreq, ADIB, DIB, RAKBank, Emirates Islamic, ADCB, CBD, HSBC, SCB, Citi, Liv, Wio, UAB, SIB, Ajman, Mashreq Neo)
---

# Card data audit & UI programme

## The reader question

A reader landing on `/cards/` wants to answer one of three questions in
under 30 seconds: *"which UAE credit card pays me back the most on what
I actually spend?"*, *"which card is best for the trip I'm planning?"*,
or *"can I even get this card?"*. Today's `/cards/compare.astro` shows
a static top-3 by welcome-bonus value with no filtering; the
individual card pages render correctly but the data behind them was
last audited piecemeal (FAB on 2026-05-10, ENBD mixed dates). The
reader can't filter, can't compare on their own picks, can't see the
data freshness, and has no scannable spec-card surface across hubs.

## Why now

Three signals converge in week 2026-W21:

1. **Firecrawl Hobby plan went live this week** (4,000 credits/month).
   Audit-08 cleared the welcome-bonus parser; the budget unlocks a
   one-shot full refresh of all 34 cards before incremental weekly
   runs take over.
2. **The compare-page picker** has been the explicit Phase F follow-up
   since the Claude Design rollout (see
   `.council/research/2026-05/claude-design-rollout.md`).
3. **Bank product pages drift silently** — Emirates NBD restructured
   its `/credit-cards/` index sometime between 2026-04 and 2026-05;
   the existing card MDX files may already cite stale URLs.

## Out of scope

- **No bank expansion this programme.** Scope is the existing 34
  cards across Emirates NBD (30) + FAB (4). Adding Mashreq / ADIB /
  DIB is a separate brief queued behind this one.
- **No data-model migration.** `src/data/cards.json` remains the
  canonical L2 layer. The audit's dossier markdown is the
  human-readable single source of truth, but typed fields continue
  to live in JSON for the Zod validation + scrape merge contract.
- **No affiliate links introduced** in this programme. Disclosure
  policy unchanged.

## Done when

1. Every card in `cards.json` has a `lastVerified` date of
   2026-05-20 or later, with each field's `_provenance` either
   `editor-confirmed` (audited & matches scrape) or
   `editor-corrected` (audited & corrected).
2. A consolidated dossier exists at
   `.council/research/2026-05/full-card-audit-dossier.md` listing
   every card's audited values, source URLs, accessed-date, and any
   live-site changes since last verification.
3. `/cards/compare.astro` accepts up to 4 cards via URL params
   (`?cards=slug1,slug2,slug3`) with a picker UI on the page; the
   static top-3-by-bonus default remains the no-params view.
4. A new `/cards/finder/` route ships a filter-driven chooser
   (salary band, primary spend category, loyalty preference,
   network) that ranks cards using the existing
   `src/lib/cardsData.ts` matcher; the ranking is deterministic and
   the URL is shareable.
5. A reusable component library lands under
   `src/components/cards/`: `SpecCard.astro`, `FeeBlock.astro`,
   `EarnRateTable.astro`, `EligibilityChips.astro`,
   `WelcomeBonusCallout.astro`, `VerifiedStamp.astro`. Used on
   `/cards/[slug].astro`, hub pages, and compare/finder.
6. Council sign-off block in the PR body shows all Stage 5.5 / 6 /
   6.5 / 7 statuses passed; Chairman line marks `approved`.

## Stages running in parallel

- **Stage 3 (Research) — head-of-research** — owns the audit. One-shot
  Firecrawl pull on all 34 cards' `applyUrl` + `sources` + the
  `firecrawl-bank-urls.md` Schedule-of-Charges PDFs for ENBD and
  FAB. Writes the audit dossier and a structured diff against the
  current `cards.json`. Budget ceiling: 200 credits.
- **Stage 4–7 (Tech) — technical-lead** — can start the UI workstream
  in parallel with research because the L2 schema is stable. Builds
  the component library + finder + compare upgrade against current
  data; the data refresh patches in cleanly once Stage 3 lands.

## Acceptance for the Chairman gate

The Chairman will refuse the publish gate if any of:

- A card's `_provenance` map still has any `scraped` entries on
  fields the audit covered.
- The compare or finder pages don't pass Head of UX Stage 5.5 review
  (mobile-first, ≤ 5-second scannability).
- Any AED figure on a card page disagrees with the audit dossier.
- The Council sign-off block is missing or incomplete in the PR.

---

_Brief opened 2026-05-20 by the orchestrator on operator request.
Managing Editor logging is implicit: this is a T3 programme that
spans Research + Tech + UX + Standards + section-editor + Chairman._

## Stage 3 (Research) — handoff note 2026-05-20

Dossier delivered at `.council/research/2026-05/full-card-audit-dossier.md`
with `research-status: complete` flipped above. **Critical caveat**: the
session's `WebFetch` tool was blocked at HTTP 403 by both `bankfab.com`
and `emiratesnbd.com` edge security on every one of the 43 audit URLs,
including the FAB consolidated KFS PDF. The Firecrawl MCP toolset
(reserved to Head of Research per Charter) was not exposed in this
session's tool list. The dossier therefore covers (a) the tooling
diagnosis, (b) the per-card baseline values from `cards.json` with my
internal-consistency flags (11 high-priority data anomalies identified
without needing the live pages — see Open Questions §1–6 in the
dossier), and (c) the Firecrawl backfill plan the orchestrator must
commission before the editor can patch `cards.json`. Budget impact for
the backfill: ~35 product-page calls + 1 PDF + 1–2 map calls, well
under the 200-credit ceiling.
