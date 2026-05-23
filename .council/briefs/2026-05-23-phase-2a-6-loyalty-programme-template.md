# Phase 2a.6 — Loyalty-programme template (Skywards worked example)

**Status:** open · **Tier:** T2 (template / chrome / editorial) · **Opened:** 2026-05-23
**Brief author:** Head of Research
**Source dossier:** `.council/research/2026-05/page-type-structural-matrix.md` §F — Loyalty-programme review
**Source comparison:** `raw/upgradedpoints-loyalty-chase-ur-review.json` (UP's loyalty-programme template) + `raw/hfp-amex-platinum-review.md` (HfP's per-redemption value-math pattern)
**chairman-status:** _pending_

## Why

The `/airlines/skywards/` page was a 3-line stub. The dossier addendum mapped UP's loyalty-programme review template + HfP's per-redemption value math + OMAAT's "Is it worth chasing?" question-H2 to dubaipoints.ae's equivalent `/airlines/<slug>/` route. This brief ships the worked example on Skywards — the dominant UAE loyalty programme and the highest-leverage page to start with.

## What ships

### 1. Skywards MDX body — comprehensive rewrite

`src/content/programs/skywards.mdx` grows from 3 lines to a full editorial guide. Frontmatter expanded:
- 4 documented sweet spots (was 2)
- Tightened `expiryPolicy` text to surface the tier-extension nuance

Body adopts the canonical loyalty-programme template:

1. `<JumpToSection>` with 10-entry sections array
2. Lede paragraph (one-paragraph positioning)
3. `## Skywards in 60 seconds` — bulleted KeyTakeaways pattern adapted to programme-context
4. `## How to earn Skywards Miles` — three H3 sub-routes (UAE-issued co-brand cards / flying Emirates+flydubai / transfer partners)
5. `## What a Skywards Mile is worth` — **HfP-pattern value-math table** with per-redemption ranges and an explicit dubaipoints baseline (2 fils per mile)
6. `## Best sweet-spot redemptions` — expands the structured sweet-spot frontmatter with editorial prose on the two highest-leverage redemptions (Y-to-J regional upgrade + DXB-LHR Business)
7. `## Tier structure (Blue / Silver / Gold / Platinum)` — tier table with thresholds + Skywards Infinite's year-one Silver upgrade contextualised
8. `## Transfer partners` — Marriott Bonvoy + Accor ALL with explicit "usually a poor use" honesty
9. `## Mile expiry mechanics` — the Blue-tier 3-year clock + the silent reset when tier drops (a real reader trap)
10. `## Watch out for` — 5 caveats (devaluation cadence, surcharges, saver availability, flydubai earn weakness, Skywards Plus eroding value)
11. `## Is Skywards worth chasing?` — question-H2 verdict (OMAAT pattern). Three audience segments answered.
12. `## Bottom line` — single-paragraph close with explicit `**Apply**` / `**Skip Skywards as your primary currency**` tokens

### 2. Cross-linking to existing pages

- Both Skywards co-brand cards (`/cards/emirates-nbd-skywards-infinite/`, `/cards/emirates-nbd-skywards-signature/`) — link from the "How to earn" and "Is it worth chasing?" sections
- `/cards/fab-cashback/` — link from "Is it worth chasing?" as the alternative for non-Skywards-flyers
- `/airlines/etihad-guest/` — link from "Is it worth chasing?" for Etihad-leaning UAE residents

### 3. No schema changes

The existing `programs` content-collection schema is sufficient. No new components added (re-uses `<JumpToSection>` from the cards collection — works on any page with H2 ids). No layout changes.

## What does NOT ship in this brief

- **Propagation to the other three programmes** (`etihad-guest`, `qatar-privilege-club`, `marriott-bonvoy`). Skywards is the worked example; the other three follow as Phase 2a.6.1–2a.6.3 once you confirm the template lands well.
- **Schema extensions for structured value-per-mile / tier-table / earning-table data.** Treated as prose-only here. A future Phase 2a.6.x could add a `valueAnchor` field (programme-baseline value per point) for cross-card sort/comparison once we have multiple programmes filled.
- **New components.** `<ProgrammeKeyFacts>` or a programme-specific `<AtAGlance>` are deferred. If propagation surfaces a need for shared chrome, we'll factor a component out at that point.

## Verification

- `npm run check` — must pass with 0 errors, 0 warnings
- `npm test` — must pass all suites
- Visual check on `/airlines/skywards/`:
  - JumpToSection sticky pill at top with 10 sections
  - 10 H2s render with correct slug IDs (rehype-slug already wired from Phase 2a.2.7)
  - Programme reference block (auto-rendered) shows 4 sweet spots + 2 transfer partners + expiry policy
  - Related cards (auto-rendered from cards.json) shows the 2 Skywards co-brands and any other Skywards-earning cards in the L2 data
  - Cross-links to `/cards/emirates-nbd-skywards-infinite/`, `/cards/emirates-nbd-skywards-signature/`, `/cards/fab-cashback/`, `/airlines/etihad-guest/` resolve

## Council sign-off

**Tier:** T2

| Role | Status | Notes |
|---|---|---|
| Travel-Experiences editor | pending | reviews voice of programme-level editorial |
| Head of UX (Stage 5.5) | pending | reviews dense-prose readability + JumpToSection on a longer page |
| Fact-Checker (Stage 6) | **action required** | confirm 102,500-mile DXB-LHR Business saver rate (Emirates current rate), tier thresholds (25k Silver / 50k Gold / 150k Platinum Tier Miles), and the 3-year Blue-tier mile-expiry policy against current Skywards T&Cs |
| Standards Editor (Stage 6.5) | pending | reviews the explicit **Apply** / **Skip** verdict tokens + the "2 fils per mile" baseline number as a public commitment we'll be held to |
| Technical Lead | pass | content-only change, no schema, no new components |
| Chairman (Stage 7) | pending | publish gate; this is the FIRST page setting our public stance on what a major loyalty currency is worth — explicitly review the 2-fils baseline as policy |

End.
