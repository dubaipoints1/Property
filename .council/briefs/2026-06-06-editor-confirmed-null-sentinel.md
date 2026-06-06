---
status: open
tier: T3
raised-by: PR #207 audit (6 June 2026) — surfaced by Fact-Checker spawn during the per-page editorial pass
owner: technical-lead (schema design) → chairman (provenance taxonomy decision) → editor (sentinel-flipping convention)
chairman-status: pending
---

# Brief — editor-confirmed null sentinel for the scrape merge contract

**Date:** 2026-06-06
**Tier:** T3 (schema change to the provenance taxonomy — touches every card's `_provenance` map and the merge contract in `scripts/scrape/propose-changes.ts`)

## Background

The 2 June 2026 weekly scrape PR (#207, now closed) attempted to merge
`welcomeBonus` back into `rakbank-world` after PR #213 explicitly nulled
that field on 3 June. The PR #213 null was deliberate: the 31 May 2026
welcome cycle expired, the next cycle had not been announced, and
publishing the expired offer would have leaked stale figures past their
cycle end. The scraper saw `welcomeBonus: null` on a card with
`_provenance.welcomeBonus = "needs-review"` (or absent), treated that as
"editor has no opinion", and re-pulled the expired offer text.

The merge contract today has no vocabulary to express:

> "This card's `welcomeBonus` is null **because the editor intentionally
> nulled it after the cycle expired**, not because no editor has typed
> a value yet."

PR #225 (6 June) added a plausibility guard that catches the broader
welcome-bonus contamination class (markdown image fragments, broken
HTML, near-empty captures). The plausibility guard does NOT solve the
expired-offer regression — the rakbank-world re-pull was a syntactically
valid string ("AED 750 welcome bonus, subject to minimum-spend
criteria…"). The guard would pass it.

This brief asks the Chairman to ratify a new provenance value so that
deliberate nulls survive the next weekly scrape.

## The decision

Two viable options.

### Option A — new provenance value `editor-confirmed-null`

Extend the provenance enum from four values to five:

```ts
"scraped" | "editor-confirmed" | "editor-corrected" | "needs-review" | "editor-confirmed-null"
```

Merge contract in `propose-changes.ts:166` extends from:

```ts
if (currentProv === "editor-confirmed" || currentProv === "editor-corrected") {
  preservedFields.push(field);
  continue;
}
```

to:

```ts
if (
  currentProv === "editor-confirmed" ||
  currentProv === "editor-corrected" ||
  currentProv === "editor-confirmed-null"
) {
  preservedFields.push(field);
  continue;
}
```

**Pros:** Explicit. The provenance map reads truthfully — "this null is
the editor's confirmed answer, not an absence of one." Audit queries
can count `editor-confirmed-null` fields separately from
`editor-confirmed` fields and report "X cards intentionally have no
current welcome cycle."

**Cons:** Adds a fifth state to a four-state enum that every consumer
(`src/lib/cardsData.ts`, chrome rendering, tests) treats discriminantly.
Schema validation needs the new variant in
`ProvenanceMap` (line 29). Tests need updating.

### Option B — re-purpose `editor-confirmed` to mean "editor has spoken (whatever the value)"

Treat `editor-confirmed` as confirming the *current value*, including
`null`. The merge contract is unchanged. The editor's discipline is:
when an editor nulls a field deliberately, they also flip
`_provenance.<field> = "editor-confirmed"`.

For rakbank-world this would mean PR #213 should have written:

```diff
   "welcomeBonus": null,
   "_provenance": {
-    "welcomeBonus": "scraped",
+    "welcomeBonus": "editor-confirmed",
   }
```

**Pros:** No schema change. No new state to plumb through every
consumer. Just convention.

**Cons:** The current convention isn't strict — many cards have
`null` values with `"scraped"` or absent provenance, and editors don't
treat absence-of-`editor-confirmed` as a meaningful state. We'd need a
clear written convention + linting hook so PR #213-shaped fixes never
forget the paired provenance flip.

## Recommendation

**Option A** — explicit `editor-confirmed-null` provenance value.
The publication has 70+ cards with mixed provenance histories. Asking
editors to remember to also flip a provenance flag every time they null
a structured value is a process discipline that will erode within two
cycles. An explicit fifth state surfaces in audit reports, in the
provenance-aware rendering pattern (PR #210, #218, #225), and in the
weekly scrape's "preserved" tally — none of which would surface a
silent `null + scraped` state today.

The plumbing is a one-day Tech Lead task:

- `src/lib/cardsData.ts` `_provenance` Zod enum: add `"editor-confirmed-null"`
- `scripts/scrape/propose-changes.ts` ProvenanceMap type + merge guard
- `tests/scrape/propose-changes.test.ts` — new test: "Audit-09 mergeDraft preserves editor-confirmed-null on subsequent scrape"
- Backfill: rakbank-world.welcomeBonus and any other deliberately-nulled
  fields (search for `: null` paired with `"scraped"` or absent
  provenance, flip)
- CLAUDE.md amendment to Part I (4-state → 5-state enum)

## Owners + sequencing

1. **Technical Lead** — drafts schema PR (1 day)
2. **Chairman** — ratifies the new provenance value via Charter
   amendment ("X June 2026 — `editor-confirmed-null` ratified")
3. **Editor (any section)** — backfills the 2–4 cards today carrying
   deliberate nulls (rakbank-world is the only one currently known;
   audit will surface more)
4. **Tests** — added in the same PR; merge once both schema and
   backfill land

## What blocks this

Charter §"Tiered review" T3 requires full council convene via
`/council`. This brief is the convene trigger. Until ratified, the
next weekly scrape (Sunday 23:00 UTC) will continue to re-populate
deliberately-nulled fields unless an editor catches them in the PR.

End.
