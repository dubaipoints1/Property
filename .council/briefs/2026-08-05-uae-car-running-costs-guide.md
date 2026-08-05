---
status: open
tier: T3
raised-by: site owner (5 August 2026) — originally proposed as a paint-protection-film provider page
owner: business-realestate-editor
chairman-status: pending
---

# Brief — UAE car running costs guide, and whether motoring enters the taxonomy

**Date:** 2026-08-05
**Tier:** T3 (new topic area outside every declared beat; taxonomy question)

## Conflict of interest

**None declared.** The site owner raised this having a specific UAE paint-
protection-film business in mind, and confirmed on 5 August 2026 that they
hold no ownership stake and no commercial relationship with it — a shop
they rate as a customer.

Recorded here rather than omitted because
`.council/03_escalation_matrix.md` requires the declaration at the top of
any brief where a conflict *could* be material, and naming a single
provider invites the question whatever the answer. No co-author is
required on this basis.

## What was originally proposed, and why it does not fit

The proposal was a page listing PPF providers, placed either under
`/deals/` or in a blog. Both placements are closed by existing rules
rather than by editorial preference:

| Proposed home | Why it does not work |
|---|---|
| A blog | `.council/04_content_taxonomy.md`, §"What's not in the taxonomy": *"No `/blog/`. Every article belongs to a vertical."* |
| `/deals/` | The collection's schema (`src/content.config.ts:150`) requires **either** a `bank` **or** a `program` reference, enforced by a `superRefine` that errors *"A deal needs an issuer"*. A PPF shop is neither, so the entry fails content validation at build. `/deals/` is also defined as time-bound and expiry-sorted — a provider list is a directory, not a deal. |

Beyond placement, a bare provider directory carries none of what this
publication's credibility rests on: no AED figure traceable to a primary
source, no verification date, no per-field provenance. It is also the
shape lead-generation content takes, which §5 of the Charter bans
regardless of intent.

## What is proposed instead

**A `/guides/` piece on the cost of running a car in the UAE**, with
PPF as one line item among Salik, fuel, RTA registration and renewal,
insurance, and servicing — and, for each, which card earns best on that
spend.

That reframing is what makes it publishable here. The piece stops being
about cars and becomes a points question the site is built to answer.

### The data already exists and nothing uses it

**25 cards in `src/data/cards.json` carry a `fuel` earn rate** —
`adcb-365-cashback` at 5, `adib-cashback-visa` at 4, `adcb-lulu-platinum`
at 2, and twenty-two others. That figure is in L2 today, verified, and no
page on the site puts it to work for a reader deciding how to pay for
petrol.

This is the strongest argument for the topic entering the taxonomy: the
publication has already done the verification work and is not spending it.

### Placement

A fifth spoke on the **expat-starter pillar**, which
`04_content_taxonomy.md:123` assigns to Business & Real Estate, alongside
the four that exist: `expat-starter-banking-basics`,
`-first-credit-card`, `-points-101`, `-avoid-mistakes`. Buying and running
a car is squarely a newcomer problem.

## The taxonomy question the Council must actually rule on

**Motoring is in no editor's declared beat.** Lifestyle & Culture covers
dining, DSF, Ramadan, beach clubs, gyms, schools and clinics — consumer
experiences tied to card categories the site reviews. Business & Real
Estate covers banking, Golden Visa, freezones, property, tax.

Cars sit adjacent to expat onboarding without being inside it. The
Council should decide whether motoring enters the taxonomy deliberately,
rather than letting it arrive through a single guide and become precedent
by accident. If the answer is no, this brief closes and nothing ships.

## A schema gap this piece would expose

The `guides` collection (`src/content.config.ts:182`) carries `title`,
`description`, `publishedAt`, `updatedAt`, `relatedCards[]` and
`relatedPrograms[]`. It has **no `lastVerified`**. Cards have one, and the
UI flags drift past 90 days; guides have no equivalent and no drift flag.

That is tolerable for an evergreen guide. It is a real problem for this
one, because the figures move fast:

- **UAE petrol prices are reset monthly** by the Fuel Price Committee.
- **Salik tariffs and RTA fees** change by decree.
- Insurance and PPF pricing are commercial and move without notice.

A guide quoting those figures is stale within weeks, and nothing in the
system would catch it. Three options, for the Council to choose between
rather than for this brief to decide:

1. **Avoid volatile figures.** Describe the cost structure and the card
   earn rates (which are verified and drift-flagged already), and link to
   the authority for current prices. Safest; slightly less useful.
2. **Quote them with an inline "verified on" line** and a named refresh
   cadence owned by Growth & Analytics. Useful; depends on the refresh
   actually happening.
3. **Add `lastVerified` to the guides schema.** Fixes the gap for all 19
   guides, not just this one — but it is a schema change with site-wide
   reach and belongs in its own T1 decision, not smuggled in here.

## If a provider is named

Any named business carries what a card review carries: **published price,
warranty terms, a source URL, and a verification date.** Nothing softer.

A single named provider with no comparison set is advertorial in shape
even with no conflict of interest behind it, and §10 of the editorial
standards kills pieces at the Chairman gate for less. **A
single-provider feature is not the recommended form.** If providers are
named at all, name several against a documented standard, or name none
and keep the piece about cost structure and cards.

The specific business the owner had in mind is not identified in this
brief: it was supplied as a Google Maps link that could not be resolved
from the authoring session. Whoever writes the piece supplies and verifies
it.

## What is being asked

1. Rule on whether motoring enters the taxonomy at all.
2. If yes, pick one of the three staleness options above.
3. Assign the guide, with Fact-Checker at Stage 6 as normal.
4. Decide separately whether `lastVerified` should exist on guides.

## One-line summary

**A PPF provider directory cannot be published here — no blog exists, the
deals schema rejects a non-issuer, and a bare directory has no provenance.
Reframed as a card-linked UAE car running costs guide it becomes viable,
and would finally use the `fuel` earn rate already verified on 25 cards —
but motoring is in no editor's beat, and the guides schema has no
`lastVerified` to catch figures that move monthly.**
