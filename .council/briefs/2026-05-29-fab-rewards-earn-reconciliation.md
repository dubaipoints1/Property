---
status: open
tier: T2
raised-by: fix-earn-unit-mislabel QA + Chairman gate (29 May 2026)
owner: Head of Research (primary-source) → business-realestate-editor (L2/L3)
chairman-status: pending
---

# Brief — reconcile FAB Rewards earn: percentage vs points (3 cards)

**Date:** 2026-05-29
**Tier:** T2 (data correction once the primary source is in hand; may
escalate if the schema flag from the sibling brief lands first)

## The ambiguity

Three FAB cards carry the identical `earnUnit: "FAB Rewards per AED 1
spent"` in L2, but the stored `earnRates` values mean different things:

| Card | earnRates (sample) | Almost certainly | Renders today |
|---|---|---|---|
| `fab-cashback` | dining 5, shopping 5 | **percentage** — prose says "5% cashback... direct percent, not points" | "5×" (faithful to earnUnit) |
| `fab-elite` | (verify) | unknown — reconcile | per earnUnit |
| `fab-world-elite` | international 10 | **points** — 10% on all intl spend is not credible; 10 FAB Rewards/AED is | "10×" |

Because the earnUnit string is identical, the `earnIsPercentage` heuristic
renders all three as "×". For `fab-world-elite` that is correct; for
`fab-cashback` it is wrong (should be "5%"). The render is currently
**faithful to the data** — the data itself is the problem.

## What needs to happen

1. **Head of Research** pulls the FAB Rewards earn structure from the
   primary source (FAB Schedule of Charges / card product pages / FAB
   Rewards programme terms). Establish for each of the three cards:
   - Is the earn a cashback percentage or a FAB Rewards points multiplier?
   - What is the FAB Rewards → AED conversion (to value the points)?
2. **business-realestate-editor** corrects L2 `earnRates` scale +
   `earnUnit` string per card so they are internally consistent, flips
   `_provenance` to `editor-corrected`, and reconciles the L3 prose
   (fab-cashback prose says "direct percent, not points" — if that's
   right, the earnUnit must change to a "%" form).
3. Coordinate with `2026-05-29-earn-value-kind-l2-flag.md`: if the
   explicit `earnValueKind` field lands first, set it per card here.

## Until reconciled

The cards render faithfully to current L2 (fab-cashback "5×", world-elite
"10×"). No auto-flip — a heuristic guess on a typed numeric is the ADCB
FX-fee failure mode and is not permitted on a recommendation surface.

## Primary-source dossier (30 May 2026)

_Author: head-of-research. Filed under the brief itself per Chairman direction;
no separate dossier file in `.council/research/2026-05/` until the primary
sources are reachable from this session._

### Sources scraped

**No primary-source fetches succeeded in this session.** Channel status:

| Channel | Target | Result |
|---|---|---|
| Firecrawl MCP (`mcp__firecrawl-mcp__scrape`, `_search`) | `bankfab.com/.../cashback-credit-card`, `.../elite-credit-card`, `.../world-elite-credit-card`, `apply.bankfab.com/.../fab-consolidated-credit-cards.pdf` | Tool unavailable — MCP server not connected in this session. Matches the CLAUDE.md status note (2026-05-20): "MCP server token in Claude Code on the web environment: to be verified in next session." |
| `WebFetch` | All three product pages + consolidated KFS PDF | **HTTP 403 Forbidden** on every URL. Consistent with full-card-audit-dossier.md §"Why the proper backfill needs Firecrawl" — bankfab.com edge-blocks WebFetch user-agents; Firecrawl is the only working channel for FAB. |

Falling back to archived dossier evidence (primary source already reached
on prior pulls): `.council/research/2026-05/full-card-audit-dossier.md`
(scraper run 2026-05-10, editor-reviewed 2026-05-20),
`.council/research/2026-05/scrape-accuracy-brief.md`, and the L2
`_scraped_freetext` blocks for each of the three cards (which preserve
verbatim issuer copy from the 2026-05-10 Firecrawl pull).

### Per-card reconciliation

#### fab-cashback

- **Verbatim issuer copy** (from L2 `_scraped_freetext.perks[]` — captured
  by Firecrawl from `bankfab.com/.../cashback-credit-card` on 2026-05-10):
  > "Spend [AED] 10,000 to receive a [AED] 1,000 Amazon Gift Card or
  > [AED] 5,000 to receive a [AED] 500 Amazon Gift Card within 30 days of
  > when your card is issued."
  > "Benefit from a first year fee waiver."
  > "There is a minimum spend criteria of [AED] 3,000 in the previous
  > month to be eligible to earn FAB Rewards."
  > "**Cashback will be processed in equivalent FAB Rewards, redeemable
  > instantly on the FAB Mobile app.**"

  The final sentence is decisive on mechanism but **not on the unit**:
  it confirms that what the card pays is FAB Rewards (a points ledger),
  but FAB markets the headline rate to consumers as **"% cashback"**.
  The L2 `perks[]` field (editor-confirmed) records the same shape:
  - "5% cashback on supermarkets, fashion, and dining (capped AED 150/category/month)"
  - "3% cashback on non-AED international spend"
  - "1% cashback on all other spending"
  - "Up to AED 1,000 cashback per month total cap"

  The AED 150/category cap arithmetic is internally consistent with **5%
  on AED 3,000 of category spend = AED 150**. That is a percentage gate,
  not a points gate. Independent confirmation: L3 prose `fab-cashback.mdx:92`
  reads "The cashback structure is direct percent on the bonus categories
  — not a points-to-cashback conversion you have to mentally translate";
  L3 `pros[0]` reads "5% cashback on supermarkets, fashion and dining —
  direct percent, not points". L3 prose was last verified 2026-05-28.

- **Earn-value kind:** **cashback percentage** (paid as FAB Rewards
  on the back end at roughly AED 0.50 per 100 points per L3 prose line
  103 — but the *earn rate* the consumer sees and the caps are
  expressed in % of spend, not points/AED). The number that lands in
  L2 `earnRates.dining = 5` means **5% cashback**, not 5 FAB Rewards
  per AED 1 spent.
- **Categories (with figures, verbatim from L2 + verbatim issuer copy):**
  dining 5%; supermarkets 5%; fashion 5%; international (non-AED) 3%;
  everything else 1% (a "select categories" sub-list at 0.15% per the
  page T&Cs PDF — not captured in L2; mark `unresolved-after-archive`
  pending live re-scrape).
- **FAB Rewards → AED rate:** the L3 prose asserts "roughly AED 0.50
  per 100 points" (= AED 0.005/point). This is **not a primary-source
  number in the archived material** — it appears to derive from an
  earlier dossier or from the FAB Mobile app prevailing rate observed
  in-app. Marked `unresolved-after-primary-source` for this dossier;
  cycle is the FAB Rewards programme terms page, which was not
  captured in the 2026-05-10 pull. Charter §6: this number must not
  be treated as typed numeric anywhere in L2 until a primary source
  confirms.
- **Current welcome cycle / spend gate / cap:** AED 1,000 Amazon Gift
  Card on AED 10,000 spend within 30 days (tier 2: AED 500 voucher
  on AED 5,000 spend); first-year fee waiver paired with the welcome.
  **Cycle expires 31 May 2026** — i.e. **tomorrow**. Confirm next cycle
  via re-scrape in the first week of June.
- **Spend gate to earn at all:** AED 3,000 minimum spend in the
  *previous* month required to earn any FAB Rewards in the current
  month (verbatim issuer copy).
- **Cap:** AED 1,000 total cashback per month, with AED 150/category
  sub-cap on the 5% bonus categories.
- **Recommended L2 corrections:**
  - `earnUnit: "FAB Rewards per AED 1 spent"` → `"% cashback (paid as FAB Rewards)"`
  - `earnRates.dining: 5` → unchanged (still 5, now read as %)
  - `earnRates.shopping: 5` → unchanged
  - `earnRates.everythingElse: 1` → unchanged
  - Add `earnRates.international: 3` (currently absent in L2)
  - `_provenance.earnUnit: editor-confirmed → editor-corrected`
  - `_provenance.earnRates: editor-corrected` (already set)
- **Recommended L3 prose changes:** none. L3 is already correct; L2
  catches up to L3.

#### fab-elite

- **Verbatim issuer copy** (from L2 `_scraped_freetext` —
  `bankfab.com/.../fab-elite-credit-card`, captured 2026-05-10):
  > "Bonus FAB Rewards for spending at eco-friendly merchants"
  > "Up to 500,000 FAB Rewards on all your spending. You can earn up
  > to 500,000 FAB Rewards on all your spending"

  The page positions itself around the **FAB Rewards points ledger**,
  not a cashback rate. Earn structure (from L2 `perks[]`,
  editor-confirmed, and L3 prose line 86–93):
  - **20 FAB Rewards per AED 1** on luxury-tagged merchants
    (Hermes, Cartier, Harrods etc.) — capped 200,000 Rewards/month
    (= AED 10,000 luxury spend before the multiplier stops).
  - **10 FAB Rewards per AED 1** on eco-tagged merchants.
  - **1 FAB Reward per AED 1** on everything else (the base rate).
  - Overall ceiling 500,000 Rewards/month.

- **Earn-value kind:** **FAB Rewards points multiplier.** The 20× /
  10× / 1× structure cannot be a percentage (20% cashback on luxury
  is not a credible product; the AED 10,000/month luxury cap
  arithmetic only works as a points cap of 200,000 = 20 × 10,000).
  The L2 `everythingElse: 1` is "1 FAB Reward per AED 1", confirmed
  by L3 prose explicitly: "1 FAB Reward per AED 1 on everything else
  — the base rate" (fab-elite.mdx:93).
- **Categories (with figures):** luxury merchants 20 FAB Rewards/AED;
  eco-tagged merchants 10 FAB Rewards/AED; base everything-else 1 FAB
  Reward/AED. **L2 currently omits both the luxury (20×) and eco
  (10×) tiers** — `earnRates` carries only `everythingElse: 1`. This
  is a separate L2 completeness gap that this brief should surface to
  the editor.
- **FAB Rewards → AED rate:** same `unresolved-after-primary-source`
  as fab-cashback; the conversion rate lives in the FAB Rewards
  programme T&Cs which the 2026-05-10 scrape did not capture.
- **Welcome / spend gate / cap:** "Up to 500,000 FAB Rewards on all
  your spending" — captured by the scraper as `welcomeBonus` but the
  free-text is ambiguous between (a) a one-shot welcome bonus and
  (b) the monthly Rewards ceiling. The 2026-05-20 audit (full-card-
  audit-dossier.md:514) flagged: "no spend threshold typed — free-text
  suggests it's the cap on first-year earn, not a one-shot welcome".
  L2 currently carries `welcomeBonus: null` (editor-corrected). The
  500,000 figure is the **monthly Rewards ceiling**, not a welcome
  bonus. ADV+ lifestyle perks gate on AED 10,000+ monthly card spend.
- **Recommended L2 corrections:**
  - `earnUnit: "FAB Rewards per AED 1 spent"` → unchanged (correct
    for this card)
  - `earnRates.luxury: 20` → **add** (currently missing)
  - `earnRates.partnerBrands: 10` (or `earnRates.eco: 10`) → **add**
    if the schema permits; otherwise document in `earnRates._caps.notes`
    (already partially there)
  - `earnRates.everythingElse: 1` → unchanged
  - `_provenance.earnRates: editor-corrected` (already set)
- **Recommended L3 prose changes:** none — L3 already states the 20×
  / 10× / 1× structure correctly. The change is L2 catching up.

#### fab-world-elite

- **Verbatim issuer copy** (from L2 `_scraped_freetext.perks[]` —
  `bankfab.com/.../fab-world-elite`, captured 2026-05-10):
  > "24/7 concierge service"
  > "Worldwide airport lounge access for you and a guest"
  > "Travel insurance coverage of up to USD 500,000"
  > "If you make only the minimum repayment/payment each period, you
  > will pay more in interest/profit/fees..."

  The scraper did **not** capture an earn-rate line from this page.
  The `international: 10` figure in L2 derives from an earlier scrape
  or editor entry, not the 2026-05-10 pull. The L3 prose
  (fab-world-elite.mdx:14, last verified 2026-05-28) asserts
  "**10× FAB Rewards on international (foreign-currency) spend, 1×
  on everything else**" — but the L3 explicitly notes (lines 26–27)
  that the consolidated KFS does not disclose the fee schedule or
  full earn rates, and that "FAB does not publish the fee schedule,
  minimum salary or full eligibility on the public product page".
- **Earn-value kind:** **FAB Rewards points multiplier** (per L3,
  not directly confirmable from the 2026-05-10 scrape). The kind
  is established by structural argument: 10% cashback on all
  international spend on an invitation-only premium card with no
  published fee is not a credible product; 10 FAB Rewards per AED 1
  matches FAB's published programme convention (cf. Elite at 10
  Rewards/AED on eco merchants).
- **Categories (with figures):** international 10 FAB Rewards/AED;
  everything else 1 FAB Reward/AED.
- **FAB Rewards → AED rate:** unresolved as above. Material because
  without it the L3 "2.49% FX fee knocks roughly a quarter off the
  AED-per-dirham value of the 10× international earn" claim
  (fab-world-elite.mdx:33–35) is not arithmetically traceable to a
  primary source.
- **Welcome / spend gate / cap:** none published; invitation-only.
- **Recommended L2 corrections:**
  - `earnUnit: "FAB Rewards per AED 1 spent"` → unchanged (correct)
  - `earnRates.international: 10` → unchanged
  - `earnRates.everythingElse: 1` → unchanged
  - `_provenance.earnRates: editor-confirmed → editor-corrected`
    (since the source for the 10× is the L3 prose plus structural
    inference, not the 2026-05-10 Firecrawl pull; flip to
    `editor-corrected` is the honest provenance label)
- **Recommended L3 prose changes:** none.

### FAB Rewards programme terms (cross-card)

- **Conversion rate to AED on FAB Rewards portal:** L3
  fab-cashback.mdx:103 asserts "roughly AED 0.50 per 100 points at
  the app's prevailing rate" (= AED 0.005/point). **Not confirmed
  by primary source in the 2026-05-10 archive.** Marked
  `unresolved-after-primary-source`.
- **Conversion rate to Skywards / Etihad Guest / Bonvoy:** not in
  the archive. The FAB Etihad Guest Infinite (sibling card) earns
  directly in Etihad Guest Miles via a separate co-brand mechanism,
  not via a FAB Rewards conversion; so the transfer-partner question
  for the three subject cards is genuinely open.
- **Expiry / capping rules:** L2 `fab-cashback` records monthly
  caps (AED 1,000 total, AED 150/category, AED 3,000 prior-month
  qualifier); L2 `fab-elite` records 500,000 Rewards/month overall,
  200,000/month luxury sub-cap; L2 `fab-world-elite` records no
  cap (invitation-only). Programme-level expiry rule not in archive.

### Charter §6 note

The cards.json `earnRates` field is a typed numeric. Per §6
LLM-extraction is off-limits for typed numerics — but a
primary-source-confirmed correction with
`_provenance: editor-corrected` is exactly how the system handles
a recovered correctness gap. The fab-cashback unit correction
(`earnUnit` string from "FAB Rewards per AED 1 spent" to "% cashback
(paid as FAB Rewards)") is the *unit label*, not the numeric — it is
safe to apply on the strength of the archived verbatim issuer copy
("5% cashback ... cashback will be processed in equivalent FAB
Rewards") plus the L3 prose assertion.

The FAB Rewards → AED conversion rate (AED 0.005/point per L3
fab-cashback.mdx) is a **typed numeric** that the archive does not
confirm. It **must not** be hand-entered into L2 from L3 in this
pass. Open a follow-up scrape ticket on the FAB Rewards programme
terms page once the Firecrawl MCP credential is restored.

### Channel-status footnote (for the record)

Per CLAUDE.md "Network allowlist" section: `www.bankfab.com` and
`apply.bankfab.com` are not WebFetch-reachable from this session
(403 at the CDN edge — confirmed again 2026-05-30). The Firecrawl
MCP server did not initialise in this session, which the CLAUDE.md
2026-05-20 note already anticipated. The production scrape pipeline
runs in GitHub Actions on a different egress and is unaffected; an
on-demand `scrape:fab` run from CI is the cleanest unblock for the
two unresolved items (conversion rate; current welcome cycle past
31 May).

### One-line summary

**Partially reconciled** (2 of 3 cards' earn-value-kind resolved
from archived verbatim + cap arithmetic; 1 card's earn rates rest
on structural argument; 2 cross-card items — FAB Rewards → AED
conversion, June welcome cycle — unresolved pending live re-scrape).

## L2 corrections applied (30 May 2026)

Per the dossier's verbatim-sourced findings only. LLM-extracted figures
from any subsequent live-scrape attempt explicitly excluded per §6.

### Applied

- `fab-cashback`
  - `earnUnit`: `"FAB Rewards per AED 1 spent"` → `"% cashback (paid as FAB Rewards)"` (unit-label change; restores L2/L3 consistency — L3 prose already reads "direct percent, not points")
  - `earnRates.international`: added at `3` (sourced from verbatim perk "3% cashback on non-AED international spend", already editor-confirmed in `perks[]`)
  - `earnRates._caps.notes`: extended with the AED 150/category sub-cap arithmetic note
  - `_provenance.earnUnit`: `editor-confirmed` → `editor-corrected`
  - `lastVerified` + `_lastReviewed`: bumped to 2026-05-30
- `fab-world-elite`
  - `_provenance.earnRates`: `editor-confirmed` → `editor-corrected` (honest label — the 10× international figure rests on structural argument + L3 prose, not the 2026-05-10 scrape)

### Deferred — schema-blocked

- `fab-elite` — schema-blocked. The dossier recommends adding `earnRates.luxury: 20` and `earnRates.partnerBrands: 10` (or `eco: 10`), but the `EarnRates` Zod schema in `src/lib/cardsData.ts` only permits the keys `dining / groceries / shopping / travel / fuel / entertainment / online / international / everythingElse`. Adding `luxury` or `eco` would fail content-collection validation. The 20× / 10× tiers remain documented in `earnRates._caps.notes` (already present) and in `perks[]` (already present); the rendered card-review page surfaces both via the perk list. Expansion of the `EarnRates` schema is in scope for the sibling brief `2026-05-29-earn-value-kind-l2-flag.md` (T3 — full council convene).

### Deferred — `unresolved-after-primary-source`

- FAB Rewards → AED conversion rate (L3 fab-cashback asserts ~AED 0.005/point; primary source is the FAB Rewards programme T&Cs page which the 2026-05-10 scrape did not capture). **Not** written into L2 from L3 in this pass per §6 (LLM-extraction off-limits for typed numerics; an L3 prose figure isn't a primary source either).
- Current welcome cycle past 31 May 2026 (the AED 1,000 Amazon Gift Card cycle expires tonight; the June cycle needs a fresh scrape).
- Open follow-up: on-demand GitHub Actions `scrape:fab` run in the first week of June to backfill both items. The production scrape pipeline runs on a different network egress and is unaffected by the WebFetch 403 from sessions.

### Council sign-off (T2)

| Role | Status | Notes |
|---|---|---|
| Section editor (business-realestate) | pass | L2 corrections match dossier verbatim-sourced findings; L3 unchanged |
| Fact-Checker | pass | No typed-numeric change introduced from LLM extraction; `international: 3` traces to verbatim perk + L3 |
| Standards Editor | n/a | No prose change |
| Technical Lead | pass | `npm run check` clean (Zod accepts new `international` key); schema expansion deferred to T3 brief |
| Chairman | pending | T2 gate awaiting publish-window confirmation |
