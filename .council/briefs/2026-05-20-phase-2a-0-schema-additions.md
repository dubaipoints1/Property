---
slug: phase-2a-0-schema-additions
vertical: business-realestate
assigned-editor: technical-lead
predecessor-brief: card-data-audit-and-ui-programme
gate-cleared: phase-1-chairman-approval (2026-05-20)
parent-brief: phase-2a-uae-banks-expansion
research-status: complete (Phase 1 dossier already named the four additions)
tech-status: complete
factcheck-status: pending
standards-status: n/a (no copy-facing changes)
chairman-status: pending
target-publish: 2026-05-23
tier: T3
type: schema-migration
---

# Phase 2a.0 — Schema additions (lands before any per-bank pass)

## Why this exists

The Chairman's Phase 1 gate ruling (2026-05-20) named four schema additions that must land **before** Phase 2a's per-bank passes begin. Doing the schema work once, against the existing 34 cards, saves rework on the ~70 cards Phase 2a will add. Each addition retires a workaround that Phase 1 introduced as an interim measure.

## The four additions

### 1. `joiningFee` — optional typed AED amount

**Schema (in `src/lib/cardsData.ts`):**

```typescript
joiningFee: z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("AED").default("AED"),
}).optional(),
```

**Migration**: extract from `annualFeeWaiver.notes` on these Phase 1 cards:

| Slug | Joining fee (AED) | Year-2+ annual |
|---|---|---|
| `emirates-nbd-skywards-infinite` | 3,148.95 | 1,575 |
| `emirates-nbd-skywards-signature` | 1,573.95 | 735 |
| `emirates-nbd-marriott-bonvoy-world-elite` | 1,575 | 1,575 (same) |
| `emirates-nbd-u-by-emaar-infinite` | 2,625 | 1,575 |
| `emirates-nbd-dnata-world` | 1,048.95 | 1,048.95 (same) |
| `emirates-nbd-etihad-guest-inspire` | 1,575 | 735 |
| `emirates-nbd-share-visa-infinite` | 1,500 | 1,500 (same) |
| `emirates-nbd-lulu-247-platinum` | 525 | 262.50 |

**UI surfacing**: `FeeBlock` renders the joining-fee figure beneath the annual-fee figure when present and ≠ annual. New microcopy: "Joining fee AED 3,148.95 (year 1); AED 1,575 a year thereafter."

### 2. `eligibility.invitationOnly` — typed boolean

**Schema:**

```typescript
eligibility: z.object({
  // … existing fields …
  invitationOnly: z.boolean().default(false),
}),
```

**Migration**: retire the `minSalary` sentinel workarounds.

| Slug | Was | After |
|---|---|---|
| `fab-world-elite` | `minSalary: 250000` + note | `invitationOnly: true` + `minSalary: 0` (UI hides minSalary when invitationOnly) |
| `emirates-nbd-priority-banking-visa-infinite` | `minSalary: 0` + note | `invitationOnly: true` (AUM-gated) |

**UI surfacing**: `EligibilityChips` renders a navy-pill "Invitation only" qualifier when the flag is true. Salary band hidden. Finder UI: a checkbox in the form lets the reader include / exclude invitation-only cards (defaults to "include").

### 3. `discontinuedForNewApplicants` — typed object

**Schema:**

```typescript
discontinuedForNewApplicants: z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // ISO date the bank stopped accepting applications
  note: z.string().max(200).optional(),            // short reader-facing explanation
}).optional(),
```

**Migration**: retire the `annualFeeWaiver.notes` workaround.

| Slug | Migration |
|---|---|
| `emirates-nbd-manchester-united` | `discontinuedForNewApplicants: { date: "2025-06-01", note: "Closed to new applications. Existing cardholders retain all benefits." }` + remove the discontinuation line from `annualFeeWaiver.notes` |

**UI surfacing**: `SpecCard` renders a gold "No longer accepting applications" chip in the head row (between the bank eyebrow and the network pill) when present. Finder filters discontinued cards out of the ranked top-6 unless the reader explicitly opts in via a "Include legacy cards" checkbox.

### 4. `welcomeBonus.headline` — ≤90 char display string

**Schema (extends `WelcomeBonus`):**

```typescript
const WelcomeBonus = z.object({
  amount: z.number().nonnegative(),
  unit: REWARD_UNIT,
  spend_threshold_aed: z.number().nonnegative().nullable(),
  qualify_window_days: z.number().int().positive().nullable(),
  headline_value_aed: z.number().nonnegative().optional(),
  headline: z.string().max(90).optional(),  // ≤90-char display string
  notes: z.string().optional(),
});
```

**Migration**: write a short headline for every Phase 1 card whose `welcomeBonus.notes` exceeds 90 characters. Today's longest is the Marriott Bonvoy World Elite (261 chars). The headline is the publication's one-line summary; notes remains the full footnote.

Examples:
- Marriott Bonvoy World Elite → headline: `"200,000 Marriott Bonvoy points (100k on activation + 100k on US$15k spend)"`
- Skywards Infinite → headline: `"Up to 100,000 Skywards Miles + complimentary Rotana Rewards"`
- FAB Cashback → headline: `"AED 1,000 Amazon Gift Card on AED 10,000 spend (expires 31 May)"`
- Etihad Inspire → headline: `"Up to 60,000 Etihad Guest Miles + Silver fast-track"`

**UI surfacing**: `WelcomeBonusCallout` body prefers `headline` over `welcomeBonusDisplay` derived from notes. Falls back to the existing display pipeline when headline is absent.

## Explicitly deferred (per Chairman ruling)

- **`earnRates._caps.min_monthly_spend_to_qualify_aed`** typing → Phase 2b. The current `earnUnit` string convention works for Duo / FAB Elite / FAB Cashback. Don't touch in this brief.
- **`network` as a tuple** for Duo's "Diners Club + Mastercard" → indefinite. Current string convention works.

## Done when

1. Four schema additions land in `src/lib/cardsData.ts` + mirror types in `src/lib/cardsDataFormat.ts`.
2. Existing 34 cards in `src/data/cards.json` migrated — all workarounds retired:
   - 8 cards gain `joiningFee`.
   - 2 cards gain `invitationOnly: true` (FAB World Elite, ENBD Priority Banking VI).
   - 1 card gains `discontinuedForNewApplicants` (Manchester United).
   - ≥6 cards gain `welcomeBonus.headline` (the cards whose notes exceed 90 chars).
3. UI surfacing on `FeeBlock`, `EligibilityChips`, `SpecCard`, `WelcomeBonusCallout` matches the spec above.
4. Tests cover each new field: schema validation, migration sanity, render output.
5. `npm run check`, `npm run build`, `npm test` all green.
6. Council sign-off: Tech Lead + Chairman. No section-editor pass needed (data-shape change, no prose). Standards Editor n/a (no reader-facing copy beyond the four micro-strings above, all already drafted in the spec).

## Out of scope (Phase 2a.0)

- **No new cards added.** This brief only migrates the existing 34.
- **No new banks added.** Phase 2a per-bank briefs (Mashreq onward) come next.
- **No MDX prose changes.** The `editorTake` field is unaffected.
- **No new content collections.** Existing eight collections in `src/content.config.ts` are unchanged.

## Acceptance for the Chairman gate

The Chairman will refuse if:

- Any of the four schema additions is missing or partially typed.
- Any existing card data layer regresses (a field that used to validate no longer does).
- The UI surfacing doesn't match the spec above.
- Lighthouse Performance score drops more than 3 points vs. the Phase 1 baseline.

---

_Brief opens 2026-05-21 per Chairman scheduling (the day after Phase 1 closes). Tech Lead is the assigned editor; Chairman is the gate._
