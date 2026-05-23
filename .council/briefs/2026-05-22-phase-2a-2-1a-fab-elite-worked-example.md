# Phase 2a.2.1a — fab-elite worked example

**Status:** open · **Tier:** T2 (chrome / copy / layout — non-trivial) · **Opened:** 2026-05-22
**Brief author:** Head of Research (continuation of the dossier-adoption line)
**Source dossier:** `.council/research/2026-05/competitor-teardown.md` v2
**Source delta:** `.council/research/2026-05/fab-elite-delta.md`
**Predecessors:** Phase 2a.2.5 (PR #129 merged), 2a.2.6 (PR #130 merged), 2a.2.7 (PR #131 open)
**chairman-status:** _pending_

## Why

The user flagged `dubaipoints.ae/cards/fab-elite/` as the test case for whether the dossier's findings had propagated to the live site. The delta report at `.council/research/2026-05/fab-elite-delta.md` audited fab-elite against four premium-card competitor parallels (TPG CSR / UP CSR / OMAAT CSR / HfP Amex Plat) and produced a 16-item punch list of gaps. This brief applies that punch list to **one card** (fab-elite) as the worked example before the broader Phase 2a.2.1 propagation across the remaining 28.

The point of doing one card first is concentration of risk: the brief surfaces (and resolves) all the issues a propagation across 29 files would hit at scale.

## What ships

### 1. Frontmatter — Phase 2a.2.3 scorecard fields added

- `kicker` (≤200 chars) — pulled-quote summary
- `tier: "solid"` — fits the dossier rubric (real proposition for a narrow profile, fee math doesn't pay back broadly)
- `scores` — 5-dimension self-assessment (welcomeValue 1.5, earnRate 3.5, perks 4, feeValue 3, access 1.5)
- `applyIf` (≤120 chars), `skipIf` (≤120 chars) — fit / no-fit one-liners

### 2. Editorial pros / cons rewritten using L2 data

The previous `pros[]` and `cons[]` made factual claims (AED 1,200 minimum salary, "1 FAB Reward per AED 1 with no clear multipliers") that contradict `src/data/cards.json`:
- L2 says **AED 40,000/month minimum salary, mandatory salary transfer**
- L2 caps note documents a **20× luxury-spend earn boost** capped at 200,000 Rewards/month
- L2 perks list documents a **10× eco-merchant earn boost**

The new pros / cons match L2 and surface the actual proposition (luxury + ADV+ lifestyle programme, not "ESG-themed marketing on a 1× card"). This is a Fact-Check Stage 6 finding the template propagation surfaced.

### 3. Component invocations — six added

In document order:

- `<AtAGlance card="fab-elite" />` — 3-tile fact strip (no `welcomeBonus` in L2 → 4th tile omitted)
- `<GreatCardIf card="fab-elite" />` — above-the-fold fit framing using new applyIf/skipIf
- `<EditorVerdict card="fab-elite" />` — renders the new kicker
- `<ProsCons card="fab-elite" />` — **now actually rendering** (was the single most damning finding in the delta — frontmatter pros/cons present but layout-side rendering removed in Phase 2a.2.0, MDX-side never added)
- `<EditorScorecard card="fab-elite" />` — foot-of-article recap with tier badge + 5-star scores + Apply / Skip qualifiers
- `<EarnRateTable card="fab-elite" />` and `<FeeBlock card="fab-elite" />` — replace prose tables with L2-driven components
- `<CardComparison cards={["fab-elite", "fab-cashback"]} />` — sibling comparison in the comparison H2

### 4. H2 spine restructured to the dossier canonical model

- Replaces the previous `What you actually get` / `Who should open it` / `Where it falls short` with: `Earn rates` → `Fee summary` → `ADV+ lifestyle programme` → `Key conditions to know` → `FAB Elite vs FAB Cashback` → `Watch out for` → `Is it worth it?` → `Bottom line`
- `## Is it worth it?` (question form) + `## Bottom line` (statement form) close the article, matching Phase 2a.2.5 reference pattern
- Bottom line carries the required `**Apply**` / `**Move down**` token in bold

### 5. Welcome-bonus claim dropped

The previous prose claimed "up to 500,000 FAB Rewards welcome." L2 has no `welcomeBonus` field for fab-elite, and the source URLs in `cards.json` don't substantiate this claim. The new prose includes a `<dt>Welcome offer</dt>` block in `## Key conditions to know` that says explicitly:

> FAB does not currently publish a stable welcome-bonus structure for the Elite that we have been able to verify against the issuer's product page…

This is Charter §10 compliance — unsourced claims become explicit caveats rather than getting silently propagated.

### 6. TODO comments retained but scoped

Two `{/* TODO: */}` blocks remain, narrowed and scoped to specific facts that need a Fact-Check pass against live issuer T&Cs:

1. Salary-transfer clawback formula
2. Welcome-bonus structure (per item 5)

These are honest TODO markers, not scratchpad commentary. The Charter allows TODOs in `{/* */}` comment form (invisible to the reader); they become a follow-on Fact-Check ticket, not a publication-blocker.

## What does NOT ship in this brief

- **Hero image** (`heroImage` frontmatter). Blocked on env network-policy fix. Phase 2a.2.1b.
- **Inline body images.** Same block.
- **`<WelcomeBonusCallout>` component invocation** — L2 has no `welcomeBonus` for fab-elite; the component throws on absent data by design. The prose `## Key conditions to know` block carries the welcome-bonus caveat instead.
- **L2 data fix for luxury/eco earn rates.** The 20× luxury and 10× eco are currently in `cards.json` `earnRates._caps.notes` (free text) rather than as structured `earnRates.luxury`/`earnRates.eco` fields. This is a data-layer schema question (does the matcher need new structured fields?) — separate brief, would unlock `<EarnRateTable>` displaying the multipliers directly.

## Verification

- `npm run check` — 0 errors, 0 warnings (93 files)
- `npm test` — 169 / 169 passes
- Visual check on `/cards/fab-elite/`:
  - Lede paragraph + AtAGlance 3-tile strip (Annual fee / Min salary / Top earn rate)
  - GreatCardIf mirrored block (green eyebrow / ink-soft eyebrow)
  - EditorVerdict callout with new kicker
  - ProsCons rendering (now actually shows on page)
  - Jump-to-section rail (desktop) shows 7 H2s
  - "Is it worth it?" + "Bottom line" H2s at foot of article
  - EditorScorecard at very end with tier badge + scores

## Out of scope, intended for follow-on

Phase 2a.2.1b — propagation to the remaining 28 unmodified cards. The delta report's punch list applies to all of them. Order: batch by issuer (FAB next: cashback, world-elite, …; then ENBD; then ADCB; then Mashreq; then RAKBank; then Emirates Islamic).

Phase 2a.2.1c — hero image + inline body image binaries. Blocked on env network policy.

## Council sign-off

**Tier:** T2

| Role | Status | Notes |
|---|---|---|
| Travel-Experiences editor (FAB Elite sits in business-realestate but lifestyle perks straddle both) | pending | reviews voice of the rewritten prose |
| Business-Realestate editor | pending | salary-transfer + premium positioning |
| Head of UX (Stage 5.5) | pending | reviews 3-tile vs 4-tile AtAGlance, GreatCardIf placement above EditorVerdict |
| Fact-Checker (Stage 6) | **action required** | (a) confirm AED 40,000 min salary against FAB issuer page, (b) confirm AED 1,260 annual fee, (c) confirm the 20× luxury cap at 200,000 Rewards/month, (d) resolve the two retained TODO comments |
| Standards Editor (Stage 6.5) | pending | reviews **Apply** / **Move down** token convention and the dropped welcome-bonus claim |
| Technical Lead | pass | additive component invocations; no schema change; check + tests clean |
| Chairman (Stage 7) | pending | publish gate |

End.
