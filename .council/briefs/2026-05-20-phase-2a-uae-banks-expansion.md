---
slug: phase-2a-uae-banks-expansion
vertical: business-realestate
assigned-editor: business-realestate-editor
predecessor-brief: card-data-audit-and-ui-programme
gate-cleared: phase-1-chairman-approval (2026-05-20)
type: programme-overview
research-status: pending (per-bank)
chairman-status: directives-set
target-publish: 2026-06-10 (final bank)
sources-required: ~70 cards across 6 new banks
tier: T3 (programme); each child brief is T3 in its own right
---

# Phase 2a — UAE banks expansion programme overview

> This is a **programme overview**, not a single executable brief. Phase 2a
> ships as **one brief per bank** plus one upfront **schema-additions** brief
> (Phase 2a.0) — per the Chairman's 2026-05-20 directive
> (`.council/sessions/2026-05-20-chairman-gate-phase-1.md`).

## The reader question

A reader on `/cards/finder/` today sees 34 cards across 2 banks. The operator's bar — set on 2026-05-20 — is "all UAE banks, big or small." Until our database covers the next six banks (Mashreq, ADIB, DIB, RAKBank, Emirates Islamic, ADCB), the finder cannot answer the actual reader question because three quarters of the relevant card supply is missing from the result set.

## Programme structure (per Chairman directive)

| # | Brief slug | Bank | Target open | Estimated cards | Firecrawl rating |
|---|---|---|---|---|---|
| 0 | `phase-2a-0-schema-additions` | (data layer) | 2026-05-21 | 0 (schema-only) | n/a |
| 1 | `phase-2a-mashreq` | Mashreq | 2026-05-27 | ~14 | medium (SPA wait) |
| 2 | `phase-2a-adib` | ADIB | 2026-05-30 | ~12 | friendly |
| 3 | `phase-2a-dib` | DIB | 2026-06-02 | ~11 | friendly |
| 4 | `phase-2a-rakbank` | RAKBank | 2026-06-04 | ~10 | medium |
| 5 | `phase-2a-emirates-islamic` | Emirates Islamic | 2026-06-06 | ~10 | friendly |
| 6 | `phase-2a-adcb` | ADCB | 2026-06-09 | ~14 | friendly |

Phase 2a.0 must land first — the four schema additions affect every card's data shape, so adding them once before the bank passes start saves rework on ~70 cards.

## Phase 2a.0 — Schema additions (lands first)

Per Chairman ruling (2026-05-20), the L2 schema gains four typed fields. Each is additive; none breaks existing data. Each opens with a Council sign-off by Tech Lead + Chairman.

### 1. `joiningFee`

```typescript
joiningFee: z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("AED").default("AED"),
}).optional(),
```

Phase 1 surfaced six cards with one-time joining fees that differ from year-2+ annual fees (Skywards Infinite AED 3,148.95, Marriott Bonvoy World Elite AED 1,575, U By Emaar Infinite AED 2,625, dnata World AED 1,048.95, Etihad Inspire AED 1,575, SHARE Visa Infinite AED 1,500). Currently captured in `annualFeeWaiver.notes`; promoting to a typed field unlocks finder UI sort-by-first-year-cost.

### 2. `eligibility.invitationOnly`

```typescript
eligibility: z.object({
  // … existing fields …
  invitationOnly: z.boolean().default(false),
}),
```

Phase 1 reclassified FAB World Elite as Private Banking invitation-only (set `minSalary: 250,000` as a finder-UI sentinel). The flag retires that workaround and lets the finder filter cleanly. Also applies to ENBD Priority Banking Visa Infinite (AUM-gated).

### 3. `discontinuedForNewApplicants`

```typescript
discontinuedForNewApplicants: z.object({
  date: z.string(),            // ISO date the bank stopped accepting applications
  note: z.string().optional(), // brief explanation for the editor surface
}).optional(),
```

ENBD Manchester United is closed to new applicants since 2025-06-01 but existing cardholders retain benefits. Phase 1 captured this in `annualFeeWaiver.notes`; promoting to a typed field lets the finder hide / badge the card.

### 4. `welcomeBonus.headline` (≤90 chars)

```typescript
const WelcomeBonus = z.object({
  // … existing fields …
  headline: z.string().max(90).optional(),  // ≤90 char display headline
});
```

The Marriott Bonvoy World Elite `welcomeBonus.notes` is 261 characters and overflows the SpecCard surface. The Chairman ruled: introduce a separate `headline` field (≤90 chars) for display; keep `notes` as the long-form footnote. UI components prefer `headline` and fall back to `notes` truncated.

### Explicitly deferred

- **`earnRates._caps.min_monthly_spend_to_qualify_aed`** typing → Phase 2b. Currently encoded in `earnUnit` strings (Duo, FAB Elite). Acceptable interim.
- **`network` as a tuple** (for Duo's "Diners Club + Mastercard") → indefinite. The current string-with-plus convention works.

## Out of scope (Phase 2a programme)

- **Phase 2b banks** (CBD, HSBC, Standard Chartered, Citi). Need Firecrawl `actions` for SPAs and geofencing fallbacks. Separate programme.
- **Phase 2c banks** (Liv, Mashreq Neo, Wio, UAB, SIB, Ajman, NBF). Mobile-app-first or business-banking-only. Separate programme.
- **MDX editorial layer** for the ~70 new cards. Each per-bank brief ships the L2 data; the section editor's prose layer (`editorTake`) is Phase 2a.1.
- **Affiliate links** — Charter §non-negotiable #5 holds; no affiliate work in Phase 2.

## Per-bank brief template

Each child brief (`phase-2a-<bank>`) mirrors the Phase 1 brief structure with these adjustments:

- **Done-when #1**: "Every card in `cards.json` from `<bank>` has `lastVerified: 2026-MM-DD` ≥ brief open date." (provenance hygiene per Phase 1's standard).
- **Done-when #2**: "Audit dossier at `.council/research/2026-MM/<bank>-audit-dossier.md` follows the Phase 1 template (banner findings, T&C gotchas table, schema gaps, per-card breakdown)."
- **Done-when #3**: "Bank MDX at `src/content/banks/<slug>.mdx` cites CBUAE regulator, branch count, founding year, salary-transfer policy."
- **Done-when #4**: "Per-card source citations in `cards.json` include live `applyUrl` + bank's KFS PDF (`kfsUrl`)."
- **Done-when #5**: "Finder + compare render with the new cards in place — no UI regression. Lighthouse Performance score doesn't drop more than 3 points vs. Phase 1 baseline."

## Phase 1 carry-over (already implemented in this branch)

The Chairman's T1 follow-ups from the Phase 1 gate are implemented in the same PR as this brief:

- Tagline regex tightened to `/^[^.!?]+[.!?](?:\s|$)/` (decimal-clip risk).
- `EligibilityChips` omits the chip when `employmentTypes` contains `"any"`.
- `/cards/finder/` stats-strip label standardised on **"Cards covered"** (was "Cards in database").
- First-person "we" voice on tool-page leads — **kept** per Chairman. Standards Editor to log the register clarification in the next `01_editorial_standards.md` amendment.

## Acceptance for the Chairman gate (each child brief)

Each child brief inherits Phase 1's four refusal triggers verbatim:

1. Any `_provenance` entry on audited fields still `scraped`.
2. UX Stage 5.5 fail on any new bank hub page (mobile-first, ≤5-sec scannability).
3. Any AED figure disagrees with the bank's SoC/KFS PDF.
4. Council sign-off block missing or incomplete in the merge PR.

---

_Phase 2a opens 2026-05-21 with the schema-additions brief; the first per-bank brief (Mashreq) opens on or after 2026-05-27. Managing Editor routes each per-bank brief through the standard 10-stage workflow._
