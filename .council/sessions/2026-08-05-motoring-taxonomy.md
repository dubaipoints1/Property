---
slug: motoring-taxonomy
convened-by: chairman
topic: Does motoring enter the content taxonomy, and does the car-running-costs guide ship?
convened: 2026-08-05
participants: fact-checker, standards-editor, business-realestate-editor, seo-strategist
deliverable-shape: brief
status: ratified — all three decision questions answered, 5 August 2026
---

# Council session: motoring in the taxonomy

## Why convened

The site owner proposed a page covering paint-protection-film providers in
Dubai. As proposed it was unpublishable: `04_content_taxonomy.md` states
twice that there is no `/blog/`, and the `deals` collection schema
requires a `bank` or `program` reference, so a PPF installer fails
validation at build.

It was reframed as a card-linked guide to the cost of running a car in the
UAE — Salik, fuel, RTA renewal, insurance, servicing, PPF — with the
best-earning card for each. That version is written and open as **PR #309**
(`src/content/guides/expat-starter-car-costs.mdx`), and the originating
brief is `.council/briefs/2026-08-05-uae-car-running-costs-guide.md`.

The brief deliberately did **not** decide the question it raised. Motoring
sits in no editor's declared beat. Lifestyle & Culture covers dining, DSF,
beach clubs, gyms, schools, clinics. Business & Real Estate covers banking,
Golden Visa, freezones, property, tax. This would be the first motoring
content on the site, and one guide arriving unopposed becomes precedent by
accident.

The strongest argument in favour is a fact about the existing data rather
than an editorial hunch: **25 cards in `src/data/cards.json` carry a
verified `fuel` earn rate, and no page on the site uses any of them.** The
publication has already done that verification and is not spending it.

## Scope

1. **Taxonomy.** Should motoring enter the content taxonomy — and if so,
   as a one-off expat-starter spoke or as an ongoing beat with an owner?
2. **The guide as written.** Is PR #309 publishable? It quotes fuel earn
   rates from L2 (all verified 2026-08-04) and deliberately quotes no
   petrol price, Salik tariff or RTA fee, because the `guides` collection
   has no `lastVerified` field and UAE fuel prices are reset monthly.
3. **The named example.** Modcare, a PPF installer in Al Quoz, appears as
   a worked example with links to its site, Instagram, WhatsApp and phone.
   No COI, no payment, all claims sourced from `modcare.ae` read 5 August
   2026, explicit disclosure in the piece. The brief warns that a
   *single-provider feature* would be advertorial in shape; a guide with
   one named example is a different thing, but adjacent, and the council
   should say where the line sits.

## Out of scope

- **Adding `lastVerified` to the `guides` schema.** Flagged in the brief
  as its own decision; it touches all 19 guides.
- **Rewriting the guide.** The council advises; edits follow a ruling.
- **The salary-transfer workstream**, unaffected by this session.

## Agent assignments

- **fact-checker** → `.council/sessions/2026-08-05-motoring-taxonomy-factcheck.md`
  Verify every figure and claim in the guide against its source. Apply the
  §10 kill-list. Verdict: pass / pass-with-edits / fail.
- **standards-editor** → `.council/sessions/2026-08-05-motoring-taxonomy-standards.md`
  House voice, and specifically whether the Modcare section reads as
  editorial or as advertorial. Rule on the disclosure wording.
- **business-realestate-editor** → `.council/sessions/2026-08-05-motoring-taxonomy-section.md`
  Does this belong on the expat-starter pillar, is it useful to the target
  reader, and would the desk own an ongoing motoring beat?
- **seo-strategist** → `.council/sessions/2026-08-05-motoring-taxonomy-seo.md`
  IA and organic-visibility consequences of admitting motoring, including
  precedent risk and cannibalisation against existing pillars.

## Synthesis owner

Convenor (this session), writing
`.council/sessions/2026-08-05-motoring-taxonomy-synthesis.md`.

## Decision questions for the user

Per the Charter-level convention, the council presents trade-offs and the
Chairman rules. Expected questions to return:

1. One-off spoke, or motoring as an ongoing beat with a named owner?
2. Does a named commercial example clear the advertorial line, and under
   what standing rule for future pieces?
3. Ship #309 now, ship with edits, or hold pending the schema decision?
