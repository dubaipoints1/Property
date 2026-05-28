---
status: open
tier: T3
raised-by: Lifestyle-Culture Editor, via PR #166 Chairman review (28 May 2026)
owner: Technical Lead
chairman-status: pending
chairman-date: null
---

# Brief — add `archived` field to the cards content collection

**Date:** 2026-05-28
**Tier:** T3 (schema change, full council convene required per Charter §"Tiered review")
**Owner:** Technical Lead, with Chairman gate.

## Background

PR #166 added `emirates-nbd-manchester-united.mdx` as part of the legacy ENBD
component-stack refresh. The L2 entry `cards.json["emirates-nbd-manchester-united"]`
already carries:

```json
"discontinuedForNewApplicants": {
  "date": "2025-06-01",
  "note": "Closed to new applications. Existing cardholders retain all benefits."
}
```

The `SpecCard.astro` component already renders a "Closed to new applications"
badge from this L2 field, so the page surface is correct. But the L3 MDX has
no clean way to mark the editorial review itself as archived — the card
review still appears in directory listings, search, and internal links as if
it were a current product.

This was flagged by the section editor during the PR #166 batch. The
business-realestate-editor proposed two paths:

(a) Add `archived: z.boolean().default(false)` and `archivedReason: z.string().optional()`
    to the `cards` collection schema in `src/content.config.ts`. Card pages
    and directories filter `archived: true` entries from active listings while
    keeping the page reachable at its slug for existing cardholders.

(b) Leave the chrome-driven `SpecCard` badge as the canonical signal, and
    add an inline editorial banner inside the MDX body for the affected card.
    Faster, but doesn't scale beyond the 1-2 cards a year ADCB / ENBD / FAB
    retire.

PR #166 ships with the Manchester United review live and the SpecCard badge
correctly rendering. This brief decides path (a) vs (b) for the next
retirement cycle.

## What needs to happen

1. Technical Lead drafts the schema change (path a) — `archived: z.boolean().default(false)`
   plus `archivedReason: z.string().optional()` on the `cards` collection in
   `src/content.config.ts`.
2. SEO Strategist confirms the listing-filter behaviour does not orphan
   inbound links to archived card pages.
3. Standards Editor confirms the in-page archive banner copy (something like
   "This card is closed to new applicants — existing cardholders retain
   benefits, see [bank hub](/banks/<bank>/) for current options").
4. Head of UX reviews the visual treatment of the archived banner against
   the SpecCard badge — no double-flagging.
5. Chairman gate on the schema change PR.

## Carry-forwards from PR #166

In addition to the Manchester United precedent, the following items were
flagged at the publish gate as carry-forwards (not blocking PR #166's
merge, but logged here for the next fact-check pass):

- **Mashreq Cashback** category rate dropping from 0.33% to 0.15% on
  utilities/fuel/telecom effective **13 June 2026** per the issuer's own
  notice. Verify against the Mashreq site closer to date and update L2
  + L3 prose if confirmed.
- **FAB Etihad Guest Infinite** welcome-bonus end-date stated as **30 June
  2026** per FAB. Re-verify at publish.
- **ENBD Marriott Bonvoy World Elite** salary-transfer-required flag —
  L2 says required; confirm against ENBD's apply page in case the
  requirement has been relaxed since the 2026-05-20 `lastVerified`.

Each is a small T1 refresh when the date arrives. Fact-Checker to
calendar.
