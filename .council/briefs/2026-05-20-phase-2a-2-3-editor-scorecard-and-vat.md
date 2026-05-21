---
slug: phase-2a-2-3-editor-scorecard-and-vat
vertical: business-realestate
assigned-editor: standards-editor
predecessor-brief: phase-2a-2-2-prose-density-pass
gate-cleared: phase-1-chairman-approval (2026-05-20)
parent-programme: phase-2a-uae-banks-expansion
research-status: in-progress (UX scorecard spec + Standards methodology draft dispatched 2026-05-20)
seo-status: methodology page is a new route — add to sitemap; meta TBD
draft-status: pending (kicker copy per reference card; methodology page ≤400 words)
tech-status: pending (queued behind UX spec)
factcheck-status: in-progress (VAT-policy verification across FAB + ENBD complete; rollout pass after migration)
standards-status: in-progress
chairman-status: pending
target-publish: 2026-05-24
tier: T2
type: editorial-signature + data-clarity
---

# Phase 2a.2.3 — Editor scorecard + VAT clarity

> Lands BEFORE the `phase-2a-2.1` propagation so all 30 card-review MDX
> files migrate to the *full* template (visual rebuild + scorecard +
> VAT-clear pricing) in one pass.

## Two reader-flagged problems

### 1. The EditorVerdict at the top reads as a 5-line italic paragraph

Operator-flagged 2026-05-20 after reviewing the post-2a.2.2 Skywards Infinite reference page. At ~80 words the verdict is *read it or skip it*. A mobile reader who doesn't want to read the article gets nothing from the page above the fold beyond the AED 1,575 / AED 30,000 / 2× Dining numerals in `AtAGlance`. That's the spec data; the editorial voice is buried.

### 2. The bottom "Editor's Call" sidebar duplicates the verdict

The layout's `.dp-spec-card.is-call` block renders `editorTake.split(".")[0]` as a sidebar pill — same content, lighter chrome. Repetition; not pulling its weight.

### 3. VAT treatment is inconsistent across banks (audit hole)

Independent of (1) and (2), the operator flagged that AED 3,148.95 (Skywards Infinite joining fee) needs to be clear about VAT. Verified across primary sources:

- **FAB consolidated KFS PDF** explicitly states *"Annual Fee Applicable (AED; **Excluding VAT**)"*. Our "FAB Elite AED 1,200" is pre-VAT; reader pays AED 1,260.
- **ENBD Schedule of Charges + product pages** publish prices **inclusive of 5% VAT**. The `.95` / `.50` tails are the giveaway (AED 3,148.95 = AED 2,999.95 base + VAT; AED 1,575 = AED 1,500 base + VAT; AED 735 = AED 700 + VAT; etc.).

Today the page reads as if FAB Elite (AED 1,200) is cheaper than Marriott Bonvoy World (AED 315) — technically true but VAT-misleading; FAB Elite all-in is AED 1,260 and Marriott Bonvoy World all-in is already AED 315.

The reader's mental model is the credit-card statement, which carries VAT. We standardise on **AED inclusive of VAT** + a small "(incl. VAT)" tag wherever a fee renders.

## The four-part fix

### Part A — `kicker` field + tightened `<EditorVerdict />`

Schema (MDX frontmatter, `src/content.config.ts`):

```typescript
kicker: z.string().max(160).optional(),  // 1–2 sentences, ≤30 words
```

`<EditorVerdict card="..." />` reads `kicker` when present; falls back to `editorTake` first-sentence when missing. The full `editorTake` stays in frontmatter for SEO meta-description and feed use.

**Reading purpose**: the top callout becomes a 25–30-word kicker that summarises the card for the reader who doesn't want to read the article.

### Part B — `<EditorScorecard card="..." />` (new component)

Renders at the END of the article body (just before "## Watch out for" or wherever the long-form caveats begin). Replaces the layout's `.dp-spec-card.is-call` sidebar repetition.

Three elements inside the scorecard, top to bottom:

1. **Tier badge** — one of 5 enumerated tiers, big Fraunces:
   - `editors-pick` → "Editor's Pick"
   - `strong` → "Strong"
   - `solid` → "Solid"
   - `niche` → "Niche"
   - `skip` → "Skip"
2. **Five dimension stars** — DM Sans label + 5-star meter (half-step):
   - Welcome value
   - Earn rate
   - Perks
   - Fee value
   - Access (eligibility friendliness)
3. **Apply if / Skip if** — two short sentences, ≤20 words each:
   - "Apply if: you fly Emirates 2+ times/year out of DXB and spend AED 100k+ annually."
   - "Skip if: your Emirates spend is under AED 30k/year — the Signature carries less fee risk."

Visual idiom borrows the `EditorVerdict` chrome (navy left rule, paper background, hairline border) so the two read as bookends of the same editorial voice. UX spec locks the exact spacing + star-glyph treatment.

### Part C — VAT clarity

Schema (`src/lib/cardsData.ts`, card root):

```typescript
vatPolicy: z.enum(["inclusive", "exclusive"]).default("inclusive"),
```

Migration:

- **All 30 ENBD cards**: `vatPolicy: "inclusive"` (the existing AED figures already include 5% VAT; no value change).
- **All 4 FAB cards**: `vatPolicy: "exclusive"` (existing figures are pre-VAT). Migration: keep the existing values in cards.json AND add a computed inclusive figure for display. Cleanest path is the migration script grosses up the stored value (AED 300 → AED 315, AED 1,200 → AED 1,260, AED 2,500 → AED 2,625, AED 0 stays AED 0) and flips `vatPolicy` to `inclusive` — single canonical convention across all banks.

UI surfacing:

- `FeeBlock` renders a small 10px DM Sans tag below the headline AED amount: "incl. VAT" when `vatPolicy === "inclusive"`. No tag on AED 0 / "Free".
- `AtAGlance` Annual fee tile gets the same tag below the value.
- `CardComparison` Annual fee row + Joining fee row carry "(incl. VAT)" inline in the cell when needed for clarity.

Kill-list addition to `.council/01_editorial_standards.md §10`: "Never display a bank fee without its VAT treatment. The site's convention is AED inclusive of 5% UAE VAT; cards whose underlying source publishes excluding VAT must be grossed up at the data layer."

### Part D — Methodology page

New route `src/pages/editorial-policy/how-we-score.astro` (~400 words). Three sections:

1. **The five dimensions** — one paragraph each on Welcome value / Earn rate / Perks / Fee value / Access. What we measure, what scores high, what scores low.
2. **The tier badges** — one sentence each on the 5 tiers, with editorial rubric (an "Editor's Pick" is more than a high score — it's the card we'd actually open).
3. **VAT convention** — one paragraph on the AED-inclusive standard.

Linked from every scorecard (small "How we score →" link below the dimensions).

## Skywards Infinite reference values (Standards Editor pre-fills)

Tier: **Editor's Pick** (top-tier Skywards earn + 100k welcome + lounge bundle justify the fee at the audience the kicker names).

Scores (out of 5, half-step):
- Welcome value: **5** (100,000 miles + Rotana — best welcome on a UAE-issued Visa)
- Earn rate: **4.5** (2 miles per USD on Emirates ecosystem; 1.5 international; 1 domestic)
- Perks: **4** (Visa Airport Companion unlimited + 1 guest; concierge; valet AUH; status match)
- Fee value: **2.5** (AED 3,148.95 joining + AED 1,575 renewal is heavy unless spend ≥ AED 100k/year)
- Access: **2** (AED 30,000/month salary excludes most early-career expats)

Apply if: "you fly Emirates 2+ times/year out of DXB and spend AED 100,000+ annually."
Skip if: "your Emirates spend is under AED 30,000/year — the Signature carries less fee risk."

## Skywards Signature reference values

Tier: **Solid** (good Skywards on-ramp at mid-market salary; capped earn ceiling vs Infinite).

Scores:
- Welcome value: **3** (40,000 miles, no bundled membership)
- Earn rate: **3** (1.5 miles per USD on Emirates ecosystem; 0.75 domestic)
- Perks: **2.5** (Visa Airport Companion cardholder only; golf; BOGO cinema)
- Fee value: **3** (AED 735 renewal, no spend-waiver)
- Access: **4** (AED 12,000/month — accessible at mid-market salary)

Apply if: "you fly Emirates 1–2 times/year and want direct Skywards earning at AED 12,000 minimum salary."
Skip if: "you spend AED 100k+/year on the card — the Infinite earns enough more to cover the fee gap."

## Done when

1. New schema fields: `kicker`, `tier`, `scores`, `applyIf`, `skipIf` in `src/content.config.ts`; `vatPolicy` in `src/lib/cardsData.ts`.
2. New component `<EditorScorecard card="..." />` shipped per UX spec.
3. `<EditorVerdict />` reads `kicker` when present.
4. Layout's `.dp-spec-card.is-call` sidebar block removed.
5. FAB's 4 cards grossed up to AED-inclusive; ENBD's 30 cards confirmed `vatPolicy: "inclusive"`.
6. `FeeBlock` + `AtAGlance` + `CardComparison` render "(incl. VAT)" tag.
7. New methodology page at `/editorial-policy/how-we-score/`.
8. Both Skywards reference MDX files updated with `kicker` + scorecard frontmatter, render the new scorecard at end of body.
9. Kill-list addition lands in `01_editorial_standards.md`.
10. `npm run check` / `npm run build` / `npm test` all green; new tests for scorecard render + VAT migration.

## Out of scope

- Other 28 card-review MDX files — `phase-2a-2.1` propagation brief carries them once this lands. Section editor pre-fills tier + scores + kicker + apply/skip during propagation.
- New design tokens — none. Tier badge in `--ink` Fraunces; dimension stars in `--positive` (filled) + `--line` (empty) — reusing existing Phase 2a.2.0 token.
- Per-card score-justification commentary — held for a future "deep-dive" template; the scorecard surfaces values only.
- ADCB / Mashreq / DIB / RAKBank / Emirates Islamic VAT verification — Phase 2a sprints scrape their KFS PDFs and confirm `vatPolicy` per bank at intake.

## Acceptance for the Chairman gate

The Chairman will refuse if:

- Any score on the reference cards isn't traceable to the methodology page rubric.
- A dimension star renders without the methodology page being live.
- Any fee figure on either reference page lacks a VAT qualifier.
- The kicker reads as marketing (any forbidden word from the kill-list: "discover", "unlock", "elevate", "best-in-class" without justification, etc.).
- Tier badges multiply beyond 5 enumerated values.
- The methodology page exceeds 500 words.

---

_Brief opens 2026-05-20 on operator feedback. Head of UX dispatched at brief-open to spec the scorecard component + VAT tag treatment. Standards Editor dispatched at brief-open to draft kicker copy for both reference cards + methodology page + tier-name register decision. Tech Lead queued behind both. Target Chairman gate: 2026-05-24._
