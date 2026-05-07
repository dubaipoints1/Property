# Scrape accuracy brief — dubaipoints.ae

A council spike. Audit-08. The Phase-2 scrape pipeline covers one bank
(FAB, four cards). Before it scales to ten more, the accuracy floor
needs raising — every additional bank at today's accuracy multiplies
the editor's typing-up burden. The proof commit ships one concrete
fix on the most load-bearing gap: `welcomeBonus` is now parsed into
the typed shape from `src/lib/cardsData.ts` instead of left as a
marketing string.

---

## Field-by-field accuracy gap

The L2 schema declares four typed shapes the scraper doesn't produce.
Each forces the editor to hand-type from scraper free-text — the
bottleneck behind the two-cards-per-week ceiling.

**1. `welcomeBonus` (now closed by Audit-08).** Today every FAB scrape
lands a string under `_scraped_freetext.welcomeBonus`. For the FAB
Elite card that string is `"Up to 500,000 FAB Rewards on all your
spending You can earn up to 500,000 FAB Rewards on all your spending"`
— a duplicated, untyped blob the matcher cannot read. The structured
form for the equivalent FAB Cashback welcome offer is

```
{ amount: 500, unit: "aed_cashback", spend_threshold_aed: 10000, qualify_window_days: 60 }
```

— four typed fields the matcher can rank against a query like *"which
welcome offer rewards me fastest if I'll spend AED 10k in 60 days?"*
The proof commit's `parseWelcomeBonus` produces this directly from the
fixture text `"Welcome bonus: Up to AED 500 cashback on AED 10,000
cumulative spend within 60 days of card activation."`

**2. `annualFeeWaiver` (still open).** Schema is `{ year_one_waived,
ongoing_threshold_aed, threshold_period }`. Scraper today produces
strings like `"Joining fee refunded on AED 40,000 cumulative spend
within first 3 months."` The typed form is `{ year_one_waived: true,
ongoing_threshold_aed: 40000, threshold_period: "annual" }`. Same
regex shape as welcomeBonus — same investment to close.

**3. `_features` (intentionally open).** Per CLAUDE.md the scraper does
not write this and never should — the discriminated union of 14 typed
perk types is the matcher's primary index, and a regex misclassifying
"Buy 1 Get 1 cinema tickets" as `entertainer_bogo` instead of
`cinema_bogo` would silently corrupt the matcher. This stays editor-only.

**4. `earnRates._caps`.** Most UAE cards cap the cashback or points
earned per category per month. The current scraper extracts `earnRates`
multipliers but ignores caps entirely. ENBD cards in `src/data/cards.json`
have `_caps` populated by hand. Free-text phrasings to detect: *"up to
AED 500 cashback per month"*, *"capped at 5,000 SHARE Points monthly"*.

**5. Quieter gaps.** `joiningFee` (separate from annual fee, common on
ENBD SHARE Infinite), `interestRate.annual` (we get the monthly %, not
the annual), `eligibility.minAge` (parsed nowhere). Each is small but
each one is a typed field the editor confirms by hand today.

Closing 1, 2 and 4 lifts hand-typing load by roughly half per new card
— the difference between two cards a week and five.

---

## Approach comparison

Four ways to raise extraction accuracy. Costs are subjective; blast
radius is what breaks if the approach gets it wrong.

**(a) Regex extension.** What this brief's proof does. Add typed parsers
beside `parseAED`, `parsePercent`, `parseMinSalary`. *Pros*: zero new
dependencies, deterministic, unit-testable against fixtures, aligned
with the existing `_lib.ts` discipline. The proof shipped 90 LOC plus
five tests in one commit. *Cons*: regexes brittle to phrasing drift
("Earn" vs "Receive" vs "Get"); each new bank brings new templates.
*Fit*: very high — matches the existing codebase exactly. *Cost*: low,
~2 hours per typed field. *Blast radius*: small — bad regex returns
`null`, falls through to free-text fallback, editor still has the
marketing copy to hand-type from.

**(b) Structured-data extraction (JSON-LD / Open Graph).** UAE bank
product pages occasionally embed JSON-LD `Product` schemas. *Pros*:
when present, these are gold — parsed once, no regex. *Cons*: most UAE
banks don't ship JSON-LD on credit-card pages (spot-checked FAB and
ENBD: neither does). Open Graph is even thinner — only `og:title` and
`og:description`. *Fit*: low for 2026 UAE banks. *Cost*: low to write,
near-zero yield. *Blast radius*: nil. *Worth a 30-minute audit per
bank to confirm before discarding.*

**(c) LLM-assisted extraction (Firecrawl `/extract`).** Takes a
Zod-shaped prompt, returns a typed object. *Pros*: handles phrasing
drift; schema-first; client already wired. *Cons*: non-deterministic;
silently invents plausible numbers on ambiguous source (the most
expensive failure mode — a typed-looking object is far likelier to be
rubber-stamped than a free-text blob); review burden shifts from
"transcribe" to "verify against source" which is harder, not easier;
weekly cost adds up (extract calls ~10× scrape calls). *Fit*: medium —
fits the existing client but breaks the
unit-testable-against-fixtures discipline. *Cost*: medium per bank
(prompt tuning) plus ongoing API spend. *Blast radius*: large — a
hallucinated typed field with `_provenance: scraped` looks
indistinguishable from a regex-extracted one once it lands.

**(d) Human-in-the-loop confirmation flow.** A small editor UI fed by
`_scraped_freetext` that click-confirms a suggested typed shape into
`cards.json`. *Pros*: highest accuracy; matches the existing
"scraper proposes, editor disposes" contract. *Cons*: building and
maintaining a UI is Phase-3-class work (week+, not days); doesn't
reduce per-card *decision* time, only typing. *Fit*: high in principle,
low for solo-editor cadence. *Cost*: high. *Blast radius*: small.

---

## Recommendation

**Hybrid (a) + (b), with (c) excluded for typed numeric fields.**
Lead with regex extension for `welcomeBonus`, `annualFeeWaiver`, and
`earnRates._caps` — the proof commit ships the first; the other two
are ~one commit each. Add a 30-minute JSON-LD audit to every new
bank's onboarding: short-circuits half the regex work when present;
falls through cleanly when absent (the UAE common case).

Excluding LLM extraction for typed numerics is load-bearing.
CLAUDE.md's editorial guarantees — *"every figure in AED, every card
≥1 source URL"* — only hold if every figure traces to deterministic
extraction. Once an LLM has invented a `qualify_window_days` that
isn't in the source, the "editor-confirmed" flag stops meaning what
it claims to mean. Keep LLM use, if any, for unstructured prose
(e.g. an `editorTake` first draft) where there's no load-bearing
number to hallucinate.

Defer (d) to Phase 3 — 13 cards today, the UI pays back around 50.

---

## Bank rollout order

Sequenced for *value-per-engineering-hour* — banks where the scraper
unlocks the most existing data come first.

1. **Emirates NBD.** Nine pre-seeded editor-confirmed cards. The
   scraper here *refreshes* (catches fee changes, perk drops), not
   seeds — highest ROI per bank because the editorial work is already
   sunk. Consistent template; centralised KFS PDFs.
2. **ADCB.** Largest UAE bank by volume after FAB+ENBD. Flagship
   TouchPoints Infinite + Lulu cobrand. `adcb_touchpoints` already in
   `REWARD_UNIT`, so the welcomeBonus parser handles it day one.
3. **Mashreq.** Salaam in the enum; cleanest second-tier product pages
   (reliable "Welcome offer" sub-heads the regex anchors to).
4. **HSBC.** Lower card volume but highest-spend cards in the market —
   accuracy here matters more per-card. Cleanest KFS PDFs.
5. **RAKBank.** Strong cashback and salary-transfer surface; doubles
   as a `salaryTransferOffers` data source. Simpler fees.
6. **CBD.** Modest range, clean website, useful breadth coverage.
7. **DIB.** Brings Islamic cards into coverage. Fee phrasings differ
   ("profit rate" vs "interest rate") — first bank needing a
   parser-shape change rather than just new fixtures.
8. **ADIB.** Same Islamic considerations as DIB; cheaper after DIB.
9. **Standard Chartered.** Smaller UAE book; product pages heavier
   on JS (Firecrawl handles, but flakier).
10. **Citi.** Smallest UAE range and the most template drift between
    en-ae and global pages. Worst cost-to-coverage ratio.

Each bank onboards as one commit: `scripts/scrape/<bank>.ts`,
`scripts/scrape/banks/<bank>.urls.json`, one fixture per representative
card, one test asserting the normaliser shape. The pipeline scales by
adding files, not by changing the normaliser — except where DIB/ADIB
introduce Islamic-bank phrasing.

---

## Workflow migration

`.github/workflows/scrape.yml` line ~62 hard-codes `npm run scrape:fab`.
Three options for taking it off that hard-code:

- **Matrix job** (recommended). `strategy.matrix.bank` listing bank
  slugs; each leg runs `npm run scrape:${{ matrix.bank }}`. Pros:
  parallel execution, per-bank failure isolation, separate logs.
  Rate-limit risk on the Firecrawl free tier solved with
  `max-parallel: 3`. New bank = one line to edit.
- **Single step that loops.** `for bank in fab enbd adcb ...; do ...`.
  Pros: minimal diff. Cons: one bank's failure fails the whole run;
  no parallelism.
- **Per-bank workflow files.** Cleanest separation, but ten copies of
  the same YAML to maintain and no shared `LATEST_RUN.log`.

Pick the matrix job. Same shape as the `_normaliser.ts` work: a small
structural edit that makes the scaling case (bank N+1) cheap.
Out-of-scope here (workflow is fenced); next commit after the third
bank lands.

---

## Open questions for the owner

1. **`welcomeBonus` field routing in `propose-changes.ts`.** Audit-06
   intentionally moved `welcomeBonus` from `SCRAPED_FIELDS` to
   `FREETEXT_FIELDS` (commit `e291a87`). The proof commit makes
   `normalise` emit the structured object on `draft.welcomeBonus`, but
   propose-changes still routes that field into
   `_scraped_freetext.welcomeBonus`, where the schema only accepts a
   string. To land typed `welcomeBonus` in `cards.json` we need to add
   `welcomeBonus` back to `SCRAPED_FIELDS` (alongside `welcomeBonusValue`)
   and let the existing `editor-confirmed` provenance check protect
   already-curated entries. Confirm before opening that PR — the change
   is small but it's a contract change in the merge rules.

2. **LLM extraction policy.** This brief recommends excluding LLM use
   for typed numeric fields. If the owner wants Firecrawl `/extract` on
   the table for any subset (e.g. `editorTake` first drafts, perk
   summarisation into free-text), the policy needs a one-line addition
   to CLAUDE.md so it's not relitigated every Audit. Confirm the
   exclusion stands or scope what's allowed.
