---
brief: phase-2a-2-card-review-visual-rebuild
stage: 3 + 5.5
reviewer: head-of-ux
date: 2026-05-20
ux-status: spec-only (no edits made; output is review + spec)
reference-page: /cards/emirates-nbd-skywards-infinite/
---

# Card-review page visual audit — Skywards Infinite (reference)

Scope: the rendered output of
`src/content/cards/emirates-nbd-skywards-infinite.mdx` inside the
`CardReviewLayout` body slot, at 375px and 1024px. Reads the four
Phase 1 components as the candidate replacements. Specs one new
component (`CardComparison.astro`) and the MDX wrapper pattern.

**Headline finding.** The page is a *data dump in publication
clothing*. The chrome (navy hero, verdict pill, sidebar) is right;
the MDX body, where the reader actually reads, is four markdown
tables and some prose. At 375px three of those tables wrap
mid-word, and the headline figures (AED 1,575; 2.5× dining;
40,000 miles) sit at the same visual weight as the labels next to
them. The fix is structural and mechanical: swap each markdown
table for the Phase 1 component that already exists, and add one
new component for the vs-table that every card review carries.

**Out of scope but flagged for Fact-Check.** The MDX prose
disagrees with `src/data/cards.json` on three numbers:

1. Skywards Infinite earn rate — MDX says **2.5× dining / travel**;
   data says **2×**.
2. Skywards Signature earn rate — MDX says **2× dining / travel**;
   data says **1.5×**.
3. Signature minimum salary — MDX says **AED 15,000**; data says
   **AED 12,000**.

These are not UX issues, but they will surface in the rebuild
because the components read from `cards.json`, not from the MDX
table. Either the table or the data wins; the Fact-Checker decides
which. Flagging now so the Tech Lead doesn't ship a rebuild where
the new components silently overrule the prose paragraph two
sentences above them. See "Coordination" at the end.

---

## 1. Audit table — current markdown tables in Skywards Infinite MDX

One row per markdown table currently in the MDX file. "Replacement"
is the Phase 1 component (or new component) that absorbs the table.
"Adjacent prose" is the paragraph immediately before or after the
table — whether it stays as prose or is folded into the component.

| # | Table heading | Rows / columns today | Replacement component | Adjacent prose verdict |
|---|---|---|---|---|
| 1 | **Earn rates** (line 27) | 5 rows × 2 cols. Dining 2.5, Travel 2.5, Groceries 1, Fuel 1, Everything else 1. Bolded numbers on rows 1–2. | `<EarnRateTable card="emirates-nbd-skywards-infinite" />`. The component already promotes the top row to navy + 700 weight per the `is-top` rule. Categories `groceries`/`fuel` are not in the L2 data for this card — but the table is **the data**, and the component will render whatever `earnRates` carries. The Tech Lead must reconcile (see Coordination §1). | **Keep as prose.** The line "Miles post directly to your Emirates Skywards account — no monthly conversion step and no transfer ratio loss" is editorial value-add and does not belong inside the component. Stays as the paragraph below the component. |
| 2 | **Fee summary** (line 42) | 7 rows × 2 cols. Annual fee Y1 / Y2+, waiver threshold, interest rate, FX, min salary, salary transfer. | `<FeeBlock card="emirates-nbd-skywards-infinite" />` covers **annual fee, FX, year-one waiver, year-two threshold, joining fee**. That is 5 of the 7 rows. **Min salary** belongs in `<EligibilityChips />` (already surfaced by the sidebar's at-a-glance block in `CardReviewLayout`). **Interest rate** has no Phase 1 home — leave it as a single prose sentence below the `FeeBlock` ("Interest accrues at 3.25% per month on unpaid balances"). **Salary transfer "Not strictly required"** also has no Phase 1 home; folds into the existing "Salary transfer:" prose block at line 80–84, which is already there. So this table compresses to one component plus one prose sentence. | The paragraph at line 53 ("The year-two waiver is reversible…") **stays as prose**. It is editorial colour on the threshold — the kind of sentence the publication exists to write. Do not fold it into `FeeBlock`. |
| 3 | **Welcome bonus breakdown** (line 56–63, bullet list — not technically a markdown table, but a structured block) | 3 bullets: 40,000 miles, 90-day window, AED 800 valuation. | `<WelcomeBonusCallout card="emirates-nbd-skywards-infinite" />`. The component pulls the structured `welcomeBonus.headline` (currently "Up to 100,000 Skywards Miles + complimentary Rotana Rewards") and the `qualify_window_days` threshold line. The third bullet — the AED 800 valuation derivation — is editorial commentary and **stays as the prose paragraph** beneath the callout. **Data drift flag:** the bullet says 40,000 miles; the structured welcomeBonus says 100,000 miles. Same drift as the earn-rate / salary mismatch — Fact-Checker decides which wins. | Paragraph at line 65 ("The bonus is enough on its own to cover the year-two fee with room to spare…") **stays as prose**. |
| 4 | **Skywards Infinite vs Skywards Signature** (line 95) | 5 rows × 3 cols (dimension, Infinite value, Signature value). Annual fee Y2+, min salary, dining/travel earn, lounge access, welcome bonus. | `<CardComparison cards={["emirates-nbd-skywards-infinite", "emirates-nbd-skywards-signature"]} />` — the new component, spec'd in §2. | Paragraph at line 103 ("The Infinite makes the most sense if both conditions hold…") **stays as prose** below the component. It is the editor's verdict on the comparison; the component shows the data, the prose draws the conclusion. |

**Tables → components count:** 4 markdown structures, 4 component
replacements (3 Phase 1 + 1 new). No table survives the rebuild.

**Sections that stay as prose, unchanged:**

- Lede paragraph (lines 20–23).
- "Key conditions to know" — Lounge access / Skywards status match
  / Salary transfer / Annual fee waiver mechanics (lines 68–91).
  These are structured bullet lists, not tables, and they read
  cleanly on mobile. **Do not** componentise.
- "Best for" (lines 108–114).
- "Watch out for" bullet list (lines 116–130). The em-dash-led
  emphasis pattern is the house voice — leave it alone.

---

## 2. `CardComparison.astro` — per-row spec

The new component. Spec is deliberately verbose so the Tech Lead
implements without follow-up questions.

### 2.1 Props signature

```ts
interface Props {
  /**
   * Card slugs in display order, left-to-right on desktop,
   * top-to-bottom on mobile. The reference card (the one whose
   * review page this is) is conventionally the first slug.
   * Exactly 2 slugs. The component throws at build time if not.
   */
  cards: [string, string];

  /**
   * Optional override for the "winner" rule. Default: the
   * component computes the winner per row from the data
   * (lower fee, lower min salary, higher earn rate, etc.).
   * Pass `winner="none"` to render the table without any
   * winner highlight — useful for tone-equal comparisons.
   */
  winner?: "auto" | "none";
}
```

Internal: the component calls `getCardData(slug)` for each entry
and throws if either is missing. **No inline data props.** The
MDX call site stays one line.

### 2.2 The canonical row set

The brief proposes 5 rows: Annual fee (Y2+), Min salary,
Dining/travel earn, Lounge access, Welcome bonus. My
recommendation **adds joining fee as a 6th row** and **drops
dining/travel earn into a single row** rather than two — because
on the Skywards pair (and on most pairs) those two numbers are
identical.

Canonical row order, top to bottom:

| # | Row | Source field | Render rule | Winner rule |
|---|---|---|---|---|
| 1 | **Annual fee** (year 2+) | `annualFee.amount` | `formatAED(amount)`; "Free" if 0. | Lower wins. Tie → no winner highlight on this row. |
| 2 | **Joining fee** (year 1) | `joiningFee.amount` | `formatAED` w/ 2dp. Render "—" when null. | Lower wins. Tie or both null → no highlight. |
| 3 | **Minimum salary** | `eligibility.minSalary` | `formatAED(amount)` + `<span class="per">/mo</span>` matching `EligibilityChips`. | Lower wins (more accessible to readers). Tie → no highlight. |
| 4 | **Top earn rate** | `earnRates.dining` (or `travel`, whichever is higher). Render as `Dining 2×` / `Travel 2×` so the reader sees *which* category drives the number. | `${categoryLabel} ${value}×` | Higher wins. Tie → no highlight. |
| 5 | **Welcome bonus** | `welcomeBonus.headline` if present; else `welcomeBonusDisplay(welcomeBonus)`. Truncate to 60 chars + `…` on mobile only. | Free text. | **No winner highlight.** Welcome bonuses are temporal and bundled — declaring a winner here is editorially inappropriate. Render both in `--ink`, no bold differential. |
| 6 | **Lounge access** | Derived from `_features[]` where `type === "lounge_access"`. Render as `"DragonPass — unlimited"` / `"Priority Pass — 6 visits/yr"` / `"None"`. | Free text. | Winner = whichever has `scope === "unlimited"` over a `visits_per_year` number. None → no highlight. |

**Row 4 rationale.** The MDX table today has a "Dining / travel
earn" row — one number for two categories. On the Skywards pair
dining and travel are identical so the simplification is lossless.
Where they diverge (e.g. a card with 3× dining but 1× travel) the
component renders only the higher of the two with its category
label, which is the publication's voice anyway ("the headline
rate is 3× on dining"). For the rare card where dining and travel
are both useful and different, the section editor can drop the
component and write prose — the component is the default, not the
straitjacket.

**Rows dropped from the original MDX table.** None. The brief's
five rows are preserved; this spec adds joining fee (Phase 2a.0
schema gave us the field; surface it) and reframes the earn row.

### 2.3 Winner-render rule

A row's winner cell renders:

- `color: var(--green)` (navy, per the May 9 amendment),
- `font-weight: 700` on the value,
- a small `↗` glyph appended to the value, in `--green`,
  `font-size: 11px`, `margin-left: 4px`. The glyph is the
  five-second-scan anchor — the reader's eye lands on it before
  reading the row label.

The loser cell renders in `var(--ink-soft)` at `font-weight: 500`.
No strike-through, no parentheses, no de-emphasis below
`--ink-soft` — the loser is still a credible card and the reader
may still pick it.

Tied rows render both cells in `var(--ink)` at `font-weight: 600`,
no glyph. No "tie" badge.

The row label (left column) stays in `var(--ink)`, 600 weight,
regardless of which side wins — the label is editorial scaffolding,
not data.

**Justification for the glyph over a "Winner" badge.** A `Winner ↗`
text badge consumes a full word of width that the row already
struggles to give. The arrow glyph is one visual unit, reads as
"this one points to the better answer", and reuses an idiom the
site already has on directory tiles. Cost: one glyph; benefit:
five-second scan works.

### 2.4 Mobile layout — below 720px

**Decision: keep the two-column table; don't stack.**

Reasoning: the comparison is *about the contrast*. If the table
stacks to two single-card blocks, the reader has to scroll between
them and hold the values in working memory to compare. That defeats
the purpose. A two-column table at 375px is tight but readable if
the type and padding are right.

Concrete rules at <720px:

- Row label column: `min-content` width, `font-size: 12px`, label
  text allowed to wrap to 2 lines max but **not mid-word** (apply
  `overflow-wrap: normal; word-break: keep-all;` and rely on a
  shorter label set — e.g. "Annual fee" not "Annual fee (year 2+)"
  on mobile; year disambiguation moves to a small subtext line).
- Two value columns: `1fr 1fr`, `font-size: 13px`, `padding: 10px
  8px`, value cell allowed to wrap to 2 lines.
- Row gap: `border-bottom: 1px solid var(--line-soft)` between
  rows. No vertical dividers.
- Header row (card names): see §2.5. The two card names get the
  same `shortCardLabel`-style treatment as on the compare picker.

Above 720px: same two-column table, but `font-size: 14px`,
`padding: 14px 18px`, and the full row label ("Annual fee, year
2+") replaces the short label.

Above 1024px: container clamps to `max-width: 720px` so the table
doesn't stretch to the full body grid and lose readability.

The component **never** triggers horizontal page scroll. If the
narrowest viable rendering (the 6-row, 3-col, 375px case) overflows
its wrapper, that is a bug in the component's type scale, not a
permission to let the page scroll. The Tech Lead's acceptance test
includes 360px.

### 2.5 Header row — card names

The two card names sit above the value columns. The Skywards pair
is "Emirates NBD Skywards Infinite" vs "Emirates NBD Skywards
Signature" — three- and four-word card names that wrap on mobile.

**Recommendation: introduce a `shortCardLabel(card)` helper in
`src/lib/cardsData.ts`.** This is not a "new design token" — it's
a derived display helper. The helper strips the bank-name prefix
when it matches a known issuer (`Emirates NBD `, `FAB `, `ADCB `,
`Mashreq `, etc.) so the header reads "Skywards Infinite" /
"Skywards Signature" rather than "Emirates NBD Skywards Infinite"
/ "Emirates NBD Skywards Signature".

If the helper is contentious (it adds one ~15-line function), the
fallback is: render the full card name in 13px / 600 / `--ink` on
mobile, with `text-wrap: balance` and a max-height of 2 lines.
That works for the Skywards pair, but breaks at 360px for cards
like "Emirates NBD U By Emaar Family" — so the helper is the
durable answer.

Header row styling:

- Eyebrow above each name: the bank acronym in `font-size: 10px`,
  `letter-spacing: 1.8px`, `font-weight: 700`, `color: var(--muted)`,
  `text-transform: uppercase` — same idiom as `SpecCard.head.bank`.
  So Skywards Infinite column header reads:
  ```
  ENBD
  Skywards Infinite
  ```
- Name line: Fraunces 16px / 500 / `--ink`, `letter-spacing:
  -0.2px`, `line-height: 1.2`. **Linkified** to `/cards/<slug>/`
  using the same underline style as `.dp-article-foot a` (ink with
  `text-decoration-color: var(--line)`).
- Header row has a 1px bottom border in `--line` and a small
  bottom padding of 12px (mobile) / 14px (desktop).

The left-most column (the row-label column) in the header row is
empty — no "Dimension" heading, no "Field" label. The labels in
the rows below are self-evident; an extra header label is noise.

### 2.6 Type, spacing, colour — exact tokens

| Element | Type | Size | Weight | Colour | Notes |
|---|---|---|---|---|---|
| Container | — | `max-width: 720px`, `margin: 24px 0`, `border: 1px solid var(--line)`, `border-radius: 4px`, `background: var(--paper)` | — | — | Padding inside container: 0 (the rows handle their own padding). |
| Header eyebrow (bank acronym) | DM Sans | 10px | 700 | `var(--muted)` | letter-spacing 1.8px, uppercase |
| Header card name | Fraunces | 16px (mobile) / 18px (≥720px) | 500 | `var(--ink)` (link), hover `var(--green)` | letter-spacing -0.2px |
| Row label | DM Sans | 12px (mobile) / 13px (≥720px) | 600 | `var(--ink)` | line-height 1.35, no uppercase |
| Row value (default) | DM Sans | 13px (mobile) / 14px (≥720px) | 500 | `var(--ink-soft)` | line-height 1.4 |
| Row value (winner) | DM Sans | same | **700** | **`var(--green)`** | + `↗` glyph 11px |
| Winner glyph (`↗`) | DM Sans | 11px | 700 | `var(--green)` | margin-left 4px, vertical-align baseline |
| Row divider | — | 1px solid `var(--line-soft)` | — | — | between rows only; container has its own border |
| Row padding | — | 10px 8px (mobile) / 14px 16px (≥720px) | — | — | 8px grid |
| AED format | — | use `Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 })` | — | — | Match `FeeBlock` formatter. Decimals on joining fee use a separate `maximumFractionDigits: 2` formatter, same as `FeeBlock`. |

No new tokens. Every value above is a `var(--*)` already defined
in `global.css` or a value `FeeBlock` / `EarnRateTable` already
uses.

### 2.7 Accessibility

- The component renders as a `<table>` with `<thead>` (the header
  row) and `<tbody>` (the data rows). Screen readers get the
  comparison structure for free.
- `<th scope="row">` on each row label. `<th scope="col">` on the
  card-name headers.
- The winner glyph carries `aria-label="Better on this dimension"`
  on its `<span>`. Without it, screen readers read the arrow as
  "north-east arrow" — unhelpful.
- Card-name links inherit the existing `.dp-article` link focus
  ring; no new focus styles required.
- Contrast: `--ink-soft` on `--paper` is 5.8:1 per the audit in
  `ux-stage-5-5-review.md` (passes AA at 4.5:1). `--green` on
  `--paper` is 6.3:1 (also passes).
- No motion, no hover-only affordances, no `prefers-reduced-motion`
  considerations needed.

### 2.8 Reduce-only example (the rendered Skywards pair)

For the Tech Lead's mental model, the rendered table at 720px
should read approximately:

```
                  ENBD                          ENBD
                  Skywards Infinite             Skywards Signature

Annual fee        AED 1,575                     AED 735 ↗
Joining fee       AED 3,148.95                  AED 1,573.95 ↗
Min salary        AED 30,000/mo                 AED 12,000/mo ↗
Top earn rate     Dining 2× ↗                   Dining 1.5×
Welcome bonus     Up to 100,000 Skywards Miles  Up to 40,000 Skywards Miles
                  + Rotana Rewards
Lounge access     DragonPass — unlimited ↗      DragonPass — 6 visits/yr
```

Note that the Signature wins four of six rows here — which is the
correct editorial outcome (it's cheaper, more accessible, almost
as rewarding). The prose paragraph below the component reframes:
*the Infinite is the right pick when conditions A and B hold*.
The component shows the data; the prose draws the conclusion.

---

## 3. MDX wrapper spec

The brief's preferred path is "MDX wrappers that pull data by
slug". My recommendation: **extend the existing components'
props to accept either an inline shape OR a `card` slug string**,
rather than create a parallel set of wrapper components.

Three reasons:

1. One file per concept beats two. A `FeeBlockBySlug.astro` thin
   wrapper is a maintenance carry — every prop change has to be
   mirrored in two places.
2. The existing call sites (`compare.astro`, the sidebar in
   `CardReviewLayout`) already construct the inline shape. They
   continue to work unchanged.
3. The MDX call site stays one line either way:
   `<FeeBlock card="emirates-nbd-skywards-infinite" />`.

### 3.1 Proposed prop extension

Each of the four Phase 1 components grows a `card?: string`
optional prop. When present, the component calls
`getCardData(card)` and constructs its own inline props from the
result. When absent, the existing prop set is required (current
behaviour).

```ts
// FeeBlock.astro — Props interface becomes:
interface Props {
  card?: string; // slug; when set, overrides the rest
  annualFee?: CardData["annualFee"];
  fxFee?: number;
  waiver?: CardData["annualFeeWaiver"];
  joiningFee?: CardData["joiningFee"];
}

// In the body:
const data = card ? getCardData(card) : undefined;
if (card && !data) throw new Error(`FeeBlock: unknown slug ${card}`);
const _annualFee = data?.annualFee ?? annualFee;
const _fxFee = data?.fxFee ?? fxFee;
const _waiver = data?.annualFeeWaiver ?? waiver;
const _joiningFee = data?.joiningFee ?? joiningFee;
// then use the underscored values in the existing render.
```

Same pattern for `EarnRateTable`, `WelcomeBonusCallout`, and
(later) `EligibilityChips` if the MDX needs it.

### 3.2 If the Tech Lead prefers separate wrappers

Acceptable fallback. In that case, four one-line files under
`src/components/cards/mdx/`:

```astro
---
// src/components/cards/mdx/FeeBlock.astro
import FeeBlockBase from "~/components/cards/FeeBlock.astro";
import { getCardData } from "~/lib/cardsData";
interface Props { card: string; }
const { card } = Astro.props;
const data = getCardData(card);
if (!data) throw new Error(`FeeBlock: unknown slug ${card}`);
---
<FeeBlockBase
  annualFee={data.annualFee}
  fxFee={data.fxFee}
  waiver={data.annualFeeWaiver}
  joiningFee={data.joiningFee}
/>
```

The MDX import becomes
`import { FeeBlock } from "~/components/cards/mdx";` (via a
barrel file). The brief's "thin one-line wrapper" pattern is
this approach.

**My recommendation stands at the prop-extension path** because
it keeps the component set at four files, not eight. But either
satisfies the brief.

### 3.3 The MDX call site

After the wrapper / prop-extension lands, the new Skywards
Infinite MDX body has, in order:

```mdx
[lede paragraph stays]

## Earn rates

[one-line lede paragraph stays]

<EarnRateTable card="emirates-nbd-skywards-infinite" />

[Skywards-posts-directly prose stays]

## Fee summary

<FeeBlock card="emirates-nbd-skywards-infinite" />

[year-two-waiver prose stays]

Interest accrues at **3.25% per month** on unpaid balances.

## Welcome offer

<WelcomeBonusCallout card="emirates-nbd-skywards-infinite" />

[AED-800-valuation prose stays]

[bonus-covers-fee prose stays]

## Key conditions to know

[four sub-bullet sections stay verbatim]

## Skywards Infinite vs Skywards Signature

<CardComparison cards={["emirates-nbd-skywards-infinite", "emirates-nbd-skywards-signature"]} />

[Infinite-makes-sense-when prose stays]

## Best for

[prose stays]

## Watch out for

[bullet list stays]
```

Net result: 4 markdown tables removed, 4 components added, ~15
lines of prose unchanged, ~30 lines of structured bullets
unchanged. The diff is mechanical.

---

## 4. Operator-approval gate

The operator approves on browser inspection at **375px width** of
`/cards/emirates-nbd-skywards-infinite/`. The concrete checklist:

1. **No horizontal scroll** at any point on the page. Test by
   scrolling top-to-bottom with the dev-tools 375px viewport
   active. If anything pushes the body wider than 375px, fail.
2. **`FeeBlock`** renders **AED 1,575** in 28px Fraunces as the
   loudest piece of type on the screen when the section is in
   view. The "Annual fee" eyebrow above it reads in 10px caps,
   `--muted`. The "FX +1.99%" line below reads in 12px,
   `--ink-soft`. The waiver line ("Year-one fee waived; reverts on
   <AED 100,000 annual spend") reads in 12px, `--green`.
3. **`EarnRateTable`** renders **Dining 2×** (or whatever the data
   top-row is) in `--green` + 700 weight. The other rows render
   in `--ink` 500 weight (default rates) and `--ink-soft` (the
   `everythingElse` row). No row wraps mid-word.
4. **`WelcomeBonusCallout`** renders the editor's headline ("Up to
   100,000 Skywards Miles + complimentary Rotana Rewards") in 18px
   Fraunces italic, balanced to 52ch. The eyebrow "WELCOME OFFER"
   above reads in 11px caps. The threshold line ("within 90 days")
   reads in 12px `--ink-soft`. The `border-left: 3px solid
   var(--green)` is visible on the left edge.
5. **`CardComparison`** vs-table renders:
   - Two header columns: `ENBD / Skywards Infinite` and `ENBD /
     Skywards Signature`. Neither name wraps mid-word.
   - Six rows: Annual fee, Joining fee, Min salary, Top earn rate,
     Welcome bonus, Lounge access. Row labels do not wrap
     mid-word.
   - The winner cell on each row reads in **navy + 700 weight**
     with a small **↗** glyph after the value. The loser cell
     reads in `--ink-soft` 500 weight.
   - On the Skywards pair specifically: Signature wins Annual fee,
     Joining fee, Min salary. Infinite wins Top earn rate and
     Lounge access. Welcome bonus has no winner highlight
     (deliberate per §2.2 row 5 rule).
6. **Five-second scan**, mobile, top to bottom of the article body:
   reader can see (a) the verdict pill in the hero, (b) the AED
   fee figure, (c) the top earn rate, (d) the welcome headline, (e)
   the comparison's winner glyphs — in five seconds, without
   reading body prose. If any of those five fail, the page is
   broken.
7. **Desktop** (1024px+): the article body grid is unchanged from
   today. The four components render in the body column, not the
   sidebar. The sidebar's at-a-glance specs (FeeBlock + EarnRateTable
   already in the layout) are unchanged. Brief is "no template
   change", so the sidebar must look identical to before.
8. **Lighthouse Performance** on `/cards/emirates-nbd-skywards-
   infinite/` drops no more than 3 points vs. the Phase 1 baseline
   (per the Chairman acceptance criterion).
9. **The other 29 card-review pages**, picked at random (3
   samples), render identically to before — no regression from
   shared CSS changes. The Tech Lead validates by visual diff on
   `/cards/fab-cashback/`, `/cards/adcb-touchpoints-platinum/`,
   `/cards/mashreq-cashback-credit-card/`.

If all nine pass, operator says go and the propagation brief
(`phase-2a-2.1-card-review-mdx-migration`) opens.

---

## 5. Standards-Editor handoff — new microcopy to review

Strings introduced by this rebuild that are user-facing and need
the Standards Editor's house-voice pass at Stage 6.5:

| String | Where | Why it needs review |
|---|---|---|
| Row label: **"Top earn rate"** | `CardComparison` row 4 | Replaces the MDX's "Dining / travel earn". Considered alternatives: "Best category", "Headline rate", "Top rate". "Top earn rate" is what I'd ship; Standards Editor confirms or replaces. |
| Row label: **"Lounge access"** | `CardComparison` row 6 | Same as the MDX today. No change. |
| Glyph: **"↗"** | winner cell on each row | Decorative; alt-text on the `<span>` is `"Better on this dimension"`. Standards Editor confirms the alt-text reads in publication voice, not screen-reader jargon. Alternative: `"Stronger on this row"`. |
| Sentence: **"Interest accrues at 3.25% per month on unpaid balances."** | new prose line under `FeeBlock` (was a table row) | Promoted from a table cell to a prose sentence. The phrasing is mine; Standards Editor confirms it matches the house's monthly-interest convention. Compare to existing card reviews — the FAB and ADCB pages may use a different phrasing. |
| Shortened row label on mobile: **"Annual fee"** (no "year 2+") | row 1 mobile rendering | The "year 2+" disambiguation moves to a small subtext line beneath the row label on mobile. Standards Editor confirms whether the subtext is mandatory or optional — i.e. is "Annual fee" alone ambiguous in the context of a fee-comparison? |
| Welcome-offer mobile truncation: **first 60 chars + …** | row 5 mobile | Standards Editor confirms whether truncating a welcome headline is OK in house voice or whether the row should overflow to 2 lines instead. |

No copy beyond these six strings. Everything else is data passed
through from `cards.json` via the existing components.

---

## 6. Coordination — Fact-Checker, Tech Lead, Chairman

### To Fact-Checker (Stage 6, after Tech Lead implements)

Three data ↔ prose discrepancies surface visibly when the
rebuilt page renders, because the components read from
`cards.json` and the prose paragraphs nearby read from the
editor's old MDX text. Either resolve before publish, or the
page contradicts itself within one viewport:

1. **Skywards Infinite earn rate.** MDX prose (lede, line 9
   pros, line 22 lede, line 31 table): "2.5 miles per AED on
   dining and travel". `cards.json` `earnRates.dining = 2`,
   `earnRates.travel = 2`. The `EarnRateTable` will render **2×**;
   the surrounding prose will say **2.5×**.
2. **Skywards Signature earn rate.** MDX vs-table: "2 miles per
   AED". `cards.json` `earnRates.dining = 1.5`,
   `earnRates.travel = 1.5`. The `CardComparison` will render
   **Dining 1.5×**; the vs-table-following prose says "similar
   earn profile" — defensible either way, but the contrast becomes
   3-vs-1.5 rather than 2.5-vs-2.
3. **Signature minimum salary.** MDX vs-table: "AED 15,000".
   `cards.json` `eligibility.minSalary = 12000`. The
   `CardComparison` will render **AED 12,000/mo**.
4. **Welcome bonus amount.** MDX prose: "40,000 Skywards Miles".
   `cards.json` `welcomeBonus.amount = 100000` and the headline
   says "Up to 100,000 Skywards Miles + complimentary Rotana
   Rewards". The `WelcomeBonusCallout` will render the 100,000
   headline; the prose paragraph below says 40,000.

Fact-Checker decides which is true and either (a) updates the
MDX prose to match the data, or (b) updates the data to match
the MDX. **Out of scope for me — flagging because the rebuild
exposes it.**

### To Tech Lead (Stage 7)

- `EarnRateTable` will render whatever `earnRates` keys are
  present in `cards.json`. The Skywards Infinite data has
  `travel`, `dining`, `everythingElse`, `international`,
  `partnerBrands` — five rows. The current MDX table shows five
  rows but the categories are different (`dining`, `travel`,
  `groceries`, `fuel`, `everythingElse`). After the swap, the
  component renders the *data* categories — `international` and
  `partnerBrands` appear, `groceries` and `fuel` disappear. This
  is a Fact-Check question (which set is true?) but a Tech-Lead
  reality (the component does what the data says). Worth flagging
  to the operator before the swap.
- The "year 2+" mobile label split (§4 row 1 label rule) requires
  a tiny addition to the `CardComparison` row schema —
  `{ label: string, mobileLabel?: string, subtext?: string }` —
  rather than a hard-coded `Annual fee, year 2+`. Build it
  parametric from the start; the propagation brief will need
  per-card overrides on some rows.
- The `shortCardLabel(card)` helper (§2.5) is small enough that
  it lives in `src/lib/cardsData.ts` next to `welcomeBonusDisplay`.
  Tests in `tests/lib/cardsData.test.ts` should cover at least
  the ENBD, FAB, ADCB, Mashreq, and CBD prefixes.

### To Chairman (Stage 7 gate)

The rebuild's Chairman acceptance criteria are spelled out in
the brief. My UX gate at Stage 5.5 will pass if the nine items in
§4 (Operator-approval gate) all hold on the rebuilt page. I will
not re-spec the gate at Stage 5.5; I will execute it.

---

## Summary

- **4** markdown tables identified in the current Skywards Infinite
  MDX; all 4 are replaced by Phase 1 components or the new
  `CardComparison`. Adjacent prose paragraphs stay as prose
  (15 lines preserved; ~30 lines of structured bullets
  preserved).
- **Canonical row set** for `CardComparison`: Annual fee (Y2+),
  Joining fee (Y1), Minimum salary, Top earn rate, Welcome bonus,
  Lounge access. 6 rows. Joining fee is new (Phase 2a.0 schema);
  the dining/travel earn row collapses to a single "Top earn rate"
  with a category label.
- **Winner-render rule**: navy + 700 weight on the winner cell,
  small `↗` glyph appended, `--ink-soft` 500 on the loser. Welcome
  bonus row deliberately carries no winner highlight. Ties
  render both cells in `--ink` 600, no glyph.
- **Mobile breakpoint**: keep the 2-column table at all widths;
  do not stack. Short row labels under 720px (with optional
  subtext for year disambiguation), 13px values, 10/8 padding,
  `keep-all` word-break. Page never scrolls horizontally.
- **Standards Editor reviews 6 strings** (row labels, mobile
  truncation, glyph alt-text, new interest-rate sentence).
  **Chairman gates on** the 9-item operator-approval list in §4 +
  the brief's Lighthouse and no-regression clauses. **Fact-Checker
  must resolve 4 data-vs-prose discrepancies** flagged in §6 before
  Stage 6 closes, or the rebuilt page contradicts itself.

