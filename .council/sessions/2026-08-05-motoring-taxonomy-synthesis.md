# Council session synthesis: motoring in the taxonomy

**Session:** `.council/sessions/2026-08-05-motoring-taxonomy.md`
**Convened:** 2026-08-05, Chairman authority
**Participants:** fact-checker, standards-editor, business-realestate-editor, seo-strategist
**Synthesis owner:** convenor

---

## What each agent recommended

**Fact-Checker — FAIL (remediable, no re-sourcing needed).**
Every quoted figure verified correct against L2. The failure was in how
correct figures were *used*: the guide ranked cards 8/5/4/3 by headline
rate while `earnRates._caps` — already in `cards.json`, `editor-confirmed`
2026-08-04 — inverts that ranking. Net annual fuel return ran Emirates
Islamic AED 886, HSBC AED 2,086, ADIB AED 3,496, DIB AED 990. The top row
was the worst card for most drivers. Two further §10 hits: a missing VAT
tag on a fee column (ADIB's `vatPolicy` is `exclusive`), and Salik advice
that was false for two recommended cards (`everythingElse: 0` on ADIB and
DIB). Endorsed the decision to quote no petrol price.

**Standards Editor — pass-with-edits.**
The Modcare section does not cross the advertorial line overall: vendor
claims are attributed as vendor claims, and the general lesson survives
striking the example. Drew the line as: a named business is editorial when
it teaches the reader to judge the category and is interchangeable;
advertorial when the copy transmits its positioning, lists its services,
or hands the reader a route to transact. Flagged "They make the same point
we would" as the most advertorial clause present, the contact block as a
transaction surface rather than citation, and the services catalogue as a
listing. Disclosure wording passes; placement fails — it must precede the
naming, and rendering it in `.dp-callout-tip` dresses a disclosure as a
tip.

**Business & Real Estate Editor — accepts ownership as a one-off spoke,
not a beat.**
The topic serves the reader: a car is a credit decision before a motoring
one, and the auto-loan/DBR interaction is the desk's core competence. The
draft only partly did — titled "what a car actually costs" while
containing no cost, with a PPF installer as its largest section. Declines
an ongoing beat: no points nexus, insurance comparison is a
regulated-advice and lead-gen surface the desk will not hold, and capacity
belongs to salary-transfer. Proposed boundary rule: **motoring is a
spend-and-credit category, not a beat** — covered only where a card, loan
or bank product touches it. Noted the "25 cards" figure is soft; only ~10
carry a genuinely elevated fuel rate.

**SEO Strategist — net-positive on a narrow reading only.**
Admitting *fuel and Salik as a card spend category* is positive: verified
fuel rates exist in L2 and no page targets a fuel query. Admitting
*motoring as a topic* is neutral-to-negative. Primary keyword
`best credit card for fuel in UAE`. Judged `ppf dubai` and
`car insurance uae` structurally closed — Maps pack and lead-gen
aggregators, no local entity, no proximity signal — so the PPF section
aimed ~40% of the draft at a space the site cannot enter while emitting
five outbound links to one commercial installer. Two shipping blockers:
the guide is **orphaned** (`expat-starter.mdx` advertises "four companion
guides" and does not link down to it), and it never links to
`/cards/cashback/`, the pillar that owns those cards.

---

## Where the council agrees

Three of four independently reached the same structural conclusion from
different directions: **the card/spend angle is the piece's justification,
and the PPF section is its weakest part.** Fact-Check found the card
analysis wrong but fixable; Standards found the PPF prose closest to the
advertorial line; SEO found the PPF section targeting an unwinnable
space; the Section Editor found it disproportionate. None of them argued
the topic itself is illegitimate.

There is also unanimity that the decision to quote no petrol price, Salik
tariff or RTA fee was correct.

## What was corrected before this synthesis

The Fact-Checker's findings were errors of fact, not matters of taste, so
they were fixed rather than tabled:

- Rate-ranked table replaced with cap, cap-reached threshold, and a net
  annual return table at six spend levels. Arithmetic independently
  re-derived by the convenor, matching the Fact-Checker's figures.
- The crossovers now stated plainly: the best card changes at roughly
  AED 2,000 and AED 5,000 of monthly fuel spend.
- Salik claim corrected — two of the four cards pay 0% outside named
  categories.
- VAT-exclusive note added to the fee column.
- "Chase the rate" advice replaced with "work out your spend first".

## Trade-offs, explicit

**One-off spoke vs ongoing beat.** The section editor will own a spoke but
not a beat, and proposes motoring be defined as a spend-and-credit
category. That is a narrower door than "motoring enters the taxonomy" and
would let this guide ship without licensing car reviews, EV charging
guides or insurance comparisons. The cost: the boundary needs writing
down, or the next request re-opens it.

**The named example.** Standards says the section is editorial but three
elements are not; SEO says cut it on ranking grounds regardless. Against
that, the owner's explicit instruction was to include links to the
business's site, Instagram and phone. These cannot both be satisfied.
Retaining the contact block is a defensible Chairman decision — it is not
a rules violation, since there is no COI and no payment — but it is the
element both reviewers independently identified as promotional, and the
convenor did not resolve it unilaterally.

**Orphaned page.** Whatever else is decided, shipping a guide that
`expat-starter.mdx` does not link to wastes it. That fix is
uncontroversial and small.

---

## Decision questions for the Chairman

1. **Does motoring enter as a bounded category or a beat?** The
   recommendation on the table is "a spend-and-credit category, not a
   beat" — covered only where a card, loan or bank product touches it. Is
   that the rule, and should it be written into the taxonomy?

2. **Does the Modcare contact block stay?** Standards and SEO both
   recommend cutting it to two citation links. The owner asked for it
   explicitly. This is a Chairman call, not an editorial one.

3. **Ship, ship-with-edits, or hold?** The factual failures are fixed. The
   outstanding work is the PPF section's shape, the disclosure placement,
   and the orphan link — roughly an hour, none of it blocked.
