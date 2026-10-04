---
name: add-card
description: Checklist for adding a new credit card to dubaipoints.ae — the L2 entry in src/data/cards.json, the L3 prose file in src/content/cards/, provenance, sources and verification. Use whenever a new card is added or an existing card is re-created under a new slug.
argument-hint: <slug>
---

# Add a card

Cards live in two files joined by slug (CLAUDE.md, "the three-layer card model").
A mismatch or a missing field fails the build — or worse, publishes an untraceable figure.

## 0. Before writing anything

- A Head of Research dossier or the issuer's own KFS / Schedule of Fees is open.
  Every number below is read from that source by a person or a regex parser —
  never LLM extraction (Charter §6).
- The slug is `<bank>-<product>` in kebab case, matching the house pattern
  (`adcb-traveller`, `fab-etihad-guest-infinite`). Check it is free:
  `grep -n '"$ARGUMENTS"' src/data/cards.json`.

## 1. L2 — `src/data/cards.json`

Add the entry under the slug key. Required by the Zod schema in
`src/lib/cardsData.ts`:

- `bank` (an existing bank slug), `name`, `network`, `categories`
- `annualFee: { amount, currency: "AED" }` — VAT treatment per `vatPolicy`
  (default `inclusive`; set `exclusive` if the source quotes pre-VAT)
- `fxFee` (percent as a number), `earnRates`, `earnUnit`, `loyaltyProgram`
- `eligibility.minSalary` and the other eligibility fields
- `lastVerified` (ISO date of the check) and `_lastReviewed` (ISO date)
- `sources`: **at least one** URL — the KFS / SoF / product page the figures
  came from. `kfsUrl` and `applyUrl` where they exist.
- `_provenance`: one entry per top-level field you set. A value you read and
  typed from the source is `editor-confirmed`; a deliberate empty is
  `editor-confirmed-null`; anything unchecked is `needs-review`. Never mark a
  field `scraped` by hand.
- Typed editor fields (`welcomeBonus`, `annualFeeWaiver`, `_features`) are
  typed by hand from the source — the scraper never writes them.

The PostToolUse hook validates the file against the schema on save. If it
reports an issue, fix it before moving on.

## 2. L3 — `src/content/cards/<slug>.mdx`

Frontmatter (`src/content.config.ts`): `slug` (identical to the L2 key),
then editorial fields only — `pros`, `cons`, `editorTake`, `verifiedBy`,
optional `kicker` (≤ 200 chars), `tier`, `applyIf` / `skipIf` (≤ 120 chars),
`keyTakeaways` (2–4 bullets, 8–140 chars each). **Do not repeat L2 fields
here** — fees and rates render from L2.

Every figure in the prose must match L2 and the source; AED first.

## 3. Verify

```bash
npm run check        # Zod + content collections
npm test             # includes tests/cards/*
npm run build        # the page renders; check dist/cards/<slug>/index.html
```

## 4. Ship

The Charter's tier table does not name "new card". It adds typed numerics and
a new page, so treat it as **T3** (when in doubt, escalate); Fact-Checker is
never waived. Draft the PR block with `/signoff`.
