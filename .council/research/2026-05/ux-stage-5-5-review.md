---
brief: card-data-audit-and-ui-programme
stage: 5.5
reviewer: head-of-ux
date: 2026-05-20
ux-status: pass-with-edits
---

# Stage 5.5 — Visual hierarchy + scannability review

Scope: `src/components/cards/{SpecCard,FeeBlock,EarnRateTable,
EligibilityChips,WelcomeBonusCallout,VerifiedStamp}.astro`,
`src/pages/cards/compare.astro`,
`src/pages/cards/finder/index.astro`.

Verdict: **pass-with-edits**. The component set is well-factored,
the picker is sound, and the finder is a real product. But three
things stop this from being a publication people bookmark: the
welcome bonus does not yet read as the headline, the eligibility row
is visually equal to (and sometimes louder than) the fee, and the
finder header has no visual anchor. None are show-stoppers; all are
fixable inside this PR.

---

## 1. Scored cards

Scale: 1 (fail) – 5 (best practice). Criteria as briefed: 5-second
scannability, visual hierarchy, density, accent discipline, type
discipline, mobile-first, comes-back.

### SpecCard.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 3 | Mini-stats row carries the work in `compact`; in `full`, `FeeBlock` competes with `EarnRateTable` for first-glance. The mini-stats `dd` is 14px — same size as `EarnRateTable` body — so neither wins the eye. |
| Hierarchy | 2 | The card title (h3, 18px) and the mini-stats values (14px) are too close in weight. The annual-fee cell in `is-full` is the loudest thing (28px Fraunces) but it is below the eyebrow row, not above it — so the reader meets the bank acronym before the price. |
| Density | 4 | 16/24px padding, 12/16px gap. Reads breathable. The `mini-stats` 3-col on mobile collapses to 2-col cleanly. |
| Accent | 4 | `var(--green)` (now navy) used only on the bank eyebrow, the title hover, and the CTA hover. Clean. One leak: `.head .bank` letter-spacing 2px is identical to `.dp-card-chip` but the chip uses 0.2px — non-issue, just a note. |
| Type | 4 | Fraunces on h3 only, DM Sans elsewhere. Sizes from the scale (10 / 14 / 18 / 22). One drift: the foot CTA at 12px is correct, but the chip system uses 12px / 600 — chip and CTA both `--ink` and visually compete. Make the CTA carry the only underline. |
| Mobile | 4 | `is-row` collapses cleanly at 720px; `is-full` reduces padding to 16px. Tested mentally at 375px — readable. |
| Comes-back | 2 | The card is tidy but transactional. There is no editorial signal — no Our-take line, no AED/year value indicator, no "best for X" tag. A reader has no reason to remember which card this was. |

**Component verdict:** pass-with-edits. See Fix #1, #2, #5 below.

### FeeBlock.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 5 | `AED 525` in 28px Fraunces is exactly the reader-eye magnet this site needs. "Free" is the right substitute for AED 0. |
| Hierarchy | 5 | Amount → eyebrow label → FX → waiver. Reads top-to-bottom in priority order. |
| Density | 5 | 4px gap is tight enough to read as one block; the `margin-top: 4px` separators on `.fx` and `.waiver` create breathing space without breaking the unit. |
| Accent | 4 | `--green` (navy) on the waiver line is the only colour event. Correct: the waiver is "good news" and deserves a hue change. Watch: this is the only place navy is used on display-adjacent type in the whole card; it's load-bearing for the two-accent system. Don't lose it. |
| Type | 5 | Fraunces 28/500 on the amount; DM Sans 12 / 10-caps on the rest. By the book. |
| Mobile | 5 | Compact enough that the 28px amount survives at 375px. |
| Comes-back | 4 | The AED-headline-figure pattern is *the* differentiator vs. competitor sites that bury fees. Keep. |

**Component verdict:** pass. This is the strongest piece in the set.

### EarnRateTable.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 3 | Eight rows of `Dining   2×` are scannable as a table but flat. Nothing draws the eye to the *highest* earn rate, which is the question the reader has. |
| Hierarchy | 2 | All rows equal weight. `everythingElse` is correctly demoted to `--ink-soft`, but the headline rate (the 5× one) is not promoted. Reader has to read every row to find the answer. |
| Density | 4 | 8px padding, hairline borders. Clean. |
| Accent | 4 | No colour at all — defensible (this is a data table) but a missed chance to flag the highest rate. |
| Type | 5 | DM Sans 14/500 and 14/600. Numbers right-aligned. Fraunces on the collapsed rate. Clean. |
| Mobile | 4 | Two-column grid stays readable at 375px; numbers don't wrap. |
| Comes-back | 2 | No editorial signal. A reader scanning four cards on the compare grid can't tell at a glance which has the best dining rate. |

**Component verdict:** pass-with-edits. See Fix #3.

### EligibilityChips.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 3 | Chips read fast individually, but a row of 4 chips (salary + transfer + residency + employment-type) at 12px / 700 caps competes visually with the fee block. |
| Hierarchy | 2 | `is-warn` chip ("Salary transfer required") uses `--gold` background — which is the same accent token the welcome-bonus callout uses. **Two different signals (a constraint and an upside) currently share a colour.** This is the single most damaging accent leak in the set. |
| Density | 4 | 8px gap, flex-wrap. Wraps cleanly. |
| Accent | 2 | Gold doing two jobs (warn chip AND welcome-bonus background) breaks the "each colour does one job" rule. |
| Type | 4 | 12px / 600 from `.dp-card-chip`. The letter-spacing is 0.2px which is the only place on the page running tight caps — fine, but inconsistent with the 1.8–2px tracking on every other eyebrow. |
| Mobile | 5 | Inline-flex wrap handles narrow widths fine. |
| Comes-back | 3 | Functional but cold. "AED 8,000+ salary" is a useful signal — but a chip per dimension flattens the priority. The salary band is the only thing that determines eligibility for most readers; the rest is footnote. |

**Component verdict:** pass-with-edits. See Fix #4 and the gold-callout verdict below.

### WelcomeBonusCallout.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 4 | The block is visually distinct from the surrounding card; the gold tint pulls the eye. |
| Hierarchy | 3 | "Welcome offer" eyebrow + bonus body + threshold line is the right structure. But the gold eyebrow at 14px caps is heavier than the navy bank eyebrow at 10px caps on the same card — so the welcome-bonus header reads louder than the card identity. |
| Density | 4 | 12/16 padding, 4px gap. Reads as one unit. |
| Accent | 1 | Per the 2026-05-09 → 2026-05-16 amendment chain, gold is **sunsetted** in new UI (global.css line 67–72: "Legacy — defined for backward compat, NOT used in new UI"). Quiet Ledger amendment in EDITORIAL.md is explicit: "`--gold` and `--gold-soft` retire from UI usage". This component re-introduces gold as primary surface colour. Out of policy. |
| Type | 4 | Fraunces on the eyebrow is unusual (eyebrows elsewhere are DM Sans 10 / 700); 14px / 600 is also off the scale (use 11 or 12). |
| Mobile | 5 | Single-column block, no breakage. |
| Comes-back | 4 | The *idea* of a coloured callout for the headline reward is correct and load-bearing — readers come back to see "what's the bonus right now". The execution colour is wrong. |

**Component verdict:** fail on accent. See gold-callout verdict §3.

### VerifiedStamp.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 5 | Dot + date + optional stale label. Two-pass legible. |
| Hierarchy | 5 | Sized correctly (12px) for footer / trust role. |
| Density | 5 | 8px gap, tight. |
| Accent | 3 | Green dot when fresh, gold dot when stale. Same gold-token problem as the welcome-bonus callout — but here it's a warning signal, which is the legitimate use of an amber-adjacent colour. Either keep gold here and remove from the welcome callout (preferred — gold reads as warning), or migrate this to `--red` to mark "warning" unambiguously. |
| Type | 5 | DM Sans 12. Single-line. |
| Mobile | 5 | Inline-flex; no breakage. |
| Comes-back | 4 | This is one of the few things on the page that says "we update this" — trust signal. Keep prominent. |

**Component verdict:** pass. The gold here is defensible (warning signal); see §3 for the full ruling.

### /cards/compare.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 4 | Page-head + stats strip + picker summary above the fold. Reader knows what page this is in <2s. |
| Hierarchy | 3 | The h1 ("Compare cards") is large via `.dp-pagehead h1` (clamp 38–56px). Good. But the picker summary at 18px Fraunces visually competes with the h2 "Matching cards" elsewhere; the result-list h2 elements ("Annual fee", "Top category", "Earn rates", "Welcome", "Eligibility", "Loyalty programme") are all 10px / muted — once you're scrolling four columns, every column reads identical and you can't anchor your eye anywhere. |
| Density | 4 | 16px gap between columns; 20px column padding. Breathable on desktop. At 375px collapses to single column — but a 4-card comparison is then 6×4 = 24 sections of scrolling, with no anchor. |
| Accent | 3 | Picker button is `--ink` background with `--green` (navy) hover — fine. But every column header strip uses `--green` for the bank acronym; if the reader has selected 4 ENBD cards they get 4 identical navy strips with no differentiation. |
| Type | 4 | h2 at 20px Fraunces is one step below the SpecCard `is-full` (22px) — almost the same. Either choose 22 or choose 18; both is fuzzy. |
| Mobile | 3 | The `repeat(auto-fit, minmax(260px, 1fr))` works at 375px (single column) — but at 600px tablets it'll show one column awkwardly. Confirm minmax. |
| Comes-back | 3 | The picker URL is shareable — strong come-back signal. But the columns themselves don't have a "winner per row" visual. Reader who comes back tomorrow won't know what they decided. |

**Page verdict:** pass-with-edits. See Fix #6, #7.

### /cards/finder/index.astro

| Criterion | Score | Note |
|---|---|---|
| 5-sec scan | 2 | The page-head is text-only — no stats strip, no visual anchor. The reader on mobile sees a heading, prose paragraph, then has to scroll past 5 fieldsets before any card surface appears. That fails the "visual anchor above the fold" UX kill-list rule. |
| Hierarchy | 3 | Form on the left (sticky) is right; result list on the right is right. But the results h2 "Matching cards" is 28px Fraunces — same weight as the page h1 elsewhere — which makes the page feel like it has two H1s. |
| Density | 3 | Five fieldsets stacked vertically is a lot. The "Card network" and "Annual fee" fieldsets could share a row. Even better: collapse them into a single "More filters" disclosure. |
| Accent | 4 | Button uses `--ink`/`--green` correctly. Reset link uses `--green` on hover. The empty-state uses dashed `--line` border — fine. |
| Type | 3 | Radio labels at 13px is *between* the type scale (14 or 12). Use 12 or 14. Same for the picker labels in compare.astro. |
| Mobile | 3 | Form collapses above results at <720px. But the form itself is now 5 stacked fieldsets above the results — the reader must scroll past every filter to see any card. Make the form a `<details>` on mobile so it collapses. |
| Comes-back | 2 | The URL is shareable (great). But the page feels like a search tool, not a publication artefact. There is no editorial framing — no "we picked these 6 because…", no Our-take, no "what to know before you apply". A reader bookmarks publications, not query forms. |

**Page verdict:** pass-with-edits. See Fix #6, #8, #9.

---

## 2. Prioritised fixes (10)

Each fix is concrete enough to apply verbatim. Listed P0 → P3.

### Fix #1 — Swap gold-on-paper for navy-rule on the welcome-bonus callout
**Priority:** P0. **File:** `src/components/cards/WelcomeBonusCallout.astro` lines 62–91.

Per `global.css` lines 67–72 and EDITORIAL.md amendment 2026-05-08, gold is sunsetted. The welcome bonus is still the headline trust signal — it just needs a different visual anchor. Recommended: navy left-rule on `--paper`, eyebrow in `--ink` caps, body in Fraunces. Mirrors the `.dp-take` editorial-verdict idiom and reads as "the publication's headline figure" rather than "promotional callout".

```css
/* before */
.dp-welcome-callout {
  background: var(--gold-soft);
  border-left: 3px solid var(--gold);
  border-radius: 4px;
  padding: 12px 16px;
}
.dp-welcome-callout .eyebrow {
  font-family: "Fraunces", serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--gold);
  line-height: 1.2;
}

/* after */
.dp-welcome-callout {
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--green);     /* navy via token alias */
  border-radius: 0 4px 4px 0;
  padding: 14px 18px;
}
.dp-welcome-callout .eyebrow {
  font-family: "DM Sans", system-ui, sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.2;
  margin-bottom: 6px;
}
.dp-welcome-callout .body {
  font-family: "Fraunces", serif;          /* promote body to display type */
  font-weight: 500;
  font-size: 18px;
  letter-spacing: -0.2px;
  color: var(--ink);
  line-height: 1.35;
}
```

This single change resolves the accent-doubling between `EligibilityChips.is-warn` and the welcome callout, and aligns the welcome callout with `.dp-take` so the site reads as one idiom.

### Fix #2 — Promote the eligibility surface from "row of chips" to a structured key/value block
**Priority:** P0. **File:** `src/components/cards/EligibilityChips.astro` lines 31–67.

Today's row of equal-weight chips makes salary band, employment type, and constraints look like sibling facts. They are not. Salary band is the gate; the rest is qualifier. Render salary as a `dt/dd` pair (Fraunces 18 numeral, DM Sans label) and demote the qualifiers to a single tight chip row underneath.

```astro
<!-- before -->
<ul class="dp-card-chips" role="list">
  <li><span class="dp-card-chip">{aedFormatter.format(eligibility.minSalary)}+ salary</span></li>
  {eligibility.salaryTransferRequired && (
    <li><span class="dp-card-chip is-warn">Salary transfer required</span></li>
  )}
  ...
</ul>

<!-- after -->
<div class="dp-eligibility">
  <div class="dp-eligibility-primary">
    <span class="lbl">Minimum salary</span>
    <span class="val">{aedFormatter.format(eligibility.minSalary)}<span class="per">/mo</span></span>
  </div>
  <ul class="dp-eligibility-qualifiers" role="list">
    {eligibility.salaryTransferRequired && (
      <li><span class="dp-card-chip">Salary transfer</span></li>
    )}
    {eligibility.residencyRequired && (
      <li><span class="dp-card-chip">UAE residents</span></li>
    )}
    {(eligibility.employmentTypes ?? []).map((t) => (
      <li><span class="dp-card-chip">{EMPLOYMENT_LABELS[t] ?? t}</span></li>
    ))}
  </ul>
</div>
```

Drop the `is-warn` modifier on "Salary transfer required" — it's not a warning, it's a constraint, and dressing it as one tells readers something is wrong with the card. With the primary surface change, the salary figure carries the weight; constraints become quiet qualifiers.

### Fix #3 — Highlight the top earn-rate row in EarnRateTable
**Priority:** P0. **File:** `src/components/cards/EarnRateTable.astro` lines 49–63 + 84–115.

Pre-compute the max-rate key server-side and emit a `is-top` modifier on that row. Render the rate value in `--green` (navy) and bump weight to 700. Reader's eye lands on "Dining 5×" within a glance instead of reading every row.

```astro
const topKey = allEntries.length > 0
  ? allEntries.reduce((a, b) => (b.value > a.value ? b : a)).key
  : null;
```

```astro
{allEntries.map(({ key, label, value }) => (
  <div class={`row${key === "everythingElse" ? " is-default" : ""}${key === topKey ? " is-top" : ""}`}>
    <dt>{label}</dt>
    <dd>{value}×</dd>
  </div>
))}
```

```css
.dp-earn-table .row.is-top dt,
.dp-earn-table .row.is-top dd {
  color: var(--green);
  font-weight: 700;
}
.dp-earn-table .row.is-top dd::after {
  content: "";  /* reserved for an optional inline-glyph signal later */
}
```

### Fix #4 — Restore the eyebrow → title → fee → bonus reading order on SpecCard
**Priority:** P1. **File:** `src/components/cards/SpecCard.astro` lines 93–175.

Today's order: bank-eyebrow + network-pill (header) → title → fee/earn grid → welcome callout → eligibility → footer. The fee block lives below the title, so the reader meets the bank acronym (10px caps) before the headline AED figure. Move `FeeBlock` above the title on `is-full`, and move the `WelcomeBonusCallout` immediately under it.

Reading order desired (top of card → bottom):

1. bank eyebrow + network pill (10px) — quiet anchor
2. `FeeBlock` — 28px Fraunces AED amount (the loudest thing)
3. card title — 22px Fraunces (the name)
4. `WelcomeBonusCallout` — 18px Fraunces body (now in navy idiom per Fix #1)
5. `EarnRateTable` — 14px (with top-rate row highlighted per Fix #3)
6. Eligibility block — 18px AED salary + chip row (per Fix #2)
7. Foot — VerifiedStamp + CTA

This is the "comes back" lever. A reader who scans 6 finder tiles can instantly compare four AED figures, four names, four bonuses. Today they get four bank acronyms first.

### Fix #5 — Add a one-line editorial signal to SpecCard's `full` variant
**Priority:** P1. **File:** `src/components/cards/SpecCard.astro` after line 111 (after title block).

The single biggest "comes back" gap is the lack of editorial voice on the card surface. A short Fraunces-italic line — pulled from `card.editorTake` if present, otherwise from a new `card.tagline` field, otherwise computed from `(top-category × top-rate)` — gives the reader the *publication's* read of the card, which is the entire reason they're on this site instead of a comparison-aggregator.

```astro
{variant === "full" && card.editorTake && (
  <p class="tagline">{firstSentence(card.editorTake)}</p>
)}
```

```css
.tagline {
  margin: 0;
  font-family: "Fraunces", serif;
  font-style: italic;
  font-size: 16px;
  line-height: 1.4;
  color: var(--ink-soft);
  text-wrap: balance;
  max-width: 52ch;
}
```

If `editorTake` isn't on the L2 card object yet, the Tech Lead can stub this with a placeholder and ticket the editorial pass to the section editor. This is the line that converts a spec card from "data tile" to "publication artefact".

### Fix #6 — Add a stats strip + visual anchor to the Finder header
**Priority:** P1. **File:** `src/pages/cards/finder/index.astro` lines 108–116.

The finder page-head today is `crumb + h1 + p`. No visual element. Add a `.dp-tools-stats` strip (the pattern compare.astro already uses) immediately under the lede paragraph. Surface: "Cards covered: 34 · Last refreshed: 20 May 2026 · Methodology: Read →". This satisfies the visual-anchor-above-fold rule and aligns the two tool pages.

```astro
<div class="dp-tools-stats">
  <span><span class="lbl">Cards in database:</span><strong>{allCards.length}</strong></span>
  <span><span class="lbl">Last refreshed:</span><strong>20 May 2026</strong></span>
  <span><span class="lbl">Methodology:</span><strong><a href="/editorial-policy/">Read →</a></strong></span>
</div>
```

### Fix #7 — Collapse the finder form into `<details>` on mobile
**Priority:** P1. **File:** `src/pages/cards/finder/index.astro` lines 118–209 + 561–573.

At <720px the 5-fieldset form pushes every card below 1500px of scroll. Wrap the form in a `<details open>` element with the existing summary pattern from compare.astro; on mobile, default it closed once the user has interacted. Compromise that doesn't require client-side JS:

```astro
<details class="dp-finder-formwrap" open>
  <summary>
    <span class="dp-finder-formwrap-title">Filter cards</span>
    <span class="dp-finder-formwrap-hint">Salary, spend, preference</span>
  </summary>
  <form method="get" action="/cards/finder/" class="dp-finder-form">
    …
  </form>
</details>
```

Then in the `@media (max-width: 720px)` block, set `details:not([open]) ~ .dp-finder-results { margin-top: 12px; }` so the results breathe.

### Fix #8 — Combine "Card network" and "Annual fee" fieldsets into one row
**Priority:** P2. **File:** `src/pages/cards/finder/index.astro` lines 171–203.

These two fieldsets are both "narrow inline radios" and both serve the secondary-filter role. Wrap them in a single `.dp-finder-fs-row` with `display: grid; grid-template-columns: 1fr 1fr; gap: 16px` on desktop. Reduces the form from 5 sections to 4. Smaller wins matter on a mobile form.

### Fix #9 — Pre-rank the static-rendered finder list server-side using initial URL params
**Priority:** P2. **File:** `src/pages/cards/finder/index.astro` lines 39–101.

Today the static HTML always renders cards in `getAllCards()` order (by min salary asc). The client-side script then reorders. For a reader who lands on `/cards/finder/?salary=15000&spend=dining` from a bookmarked URL, the first paint shows the wrong order; the JS then flickers into the right one. Run the same scoring logic at build/SSR time against `Astro.url.searchParams` so the SSR HTML is already correct. Mitigates layout shift and is a Lighthouse win.

### Fix #10 — VerifiedStamp: drop the gold dot for stale, use --ink + dashed border instead
**Priority:** P3. **File:** `src/components/cards/VerifiedStamp.astro` lines 49–72.

Once gold is removed from the welcome callout (Fix #1) it is only present here and on `.dp-card-chip.is-warn`. We can either keep gold here (the single legitimate warning use) or remove it everywhere for full Quiet-Ledger compliance. Recommended compromise: keep gold only on `VerifiedStamp.is-stale` and on `EligibilityChips.is-warn` (if Fix #2 doesn't fully remove it). Document this is the *only* gold use site-wide in a comment block. If the operator wants gold gone entirely, swap to `--red` for the stale-data dot — but red feels alarmist for a 91-day-old date, so my call is keep gold here.

---

## 3. Gold-callout verdict

**Verdict: swap.** Specifically: swap `WelcomeBonusCallout.astro` to navy-rule on paper (Fix #1). Keep gold only on `VerifiedStamp.is-stale`. Drop `is-warn` modifier from `EligibilityChips` entirely.

**Reasoning:**

1. **Policy:** `global.css` lines 67–72 are explicit: gold is sunsetted, defined for back-compat only, "NOT used in new UI". EDITORIAL.md amendment 2026-05-08 (Quiet Ledger) is equally explicit: gold and gold-soft retire from UI usage. The 2026-05-09 Charter amendment ratified green (now navy) as the *only* primary accent. There is no carve-out for welcome bonuses; the brief language naming gold predates these rulings. The Tech Lead is right to flag this — and the correct call is to update the brief, not the policy.

2. **Semantics:** Gold-on-cream reads as "promotional / advertorial". This is exactly the visual register a publication that boasts "no affiliate-driven recommendations at launch" must not adopt. The welcome bonus is editorial information about a third-party product, not an endorsement of it. The navy-rule + Fraunces body idiom signals "the publication's data" — which is what we want readers coming back for.

3. **Differentiation:** Today, gold appears on (a) the welcome callout, (b) the `is-warn` eligibility chip, (c) the `is-stale` verification dot. Three different signals — upside / constraint / warning — share one colour. That's the strongest accent-discipline failure in the set. Removing it from (a) and (b) leaves a single, defensible use on (c).

4. **Comes-back test:** Bookmarkable publications have a *signature* visual idiom. Gold-on-cream is the idiom of every airline-rewards aggregator on the open web. Navy-rule + Fraunces body is rarer, quieter, more editorial. It looks like a publication, not a comparison-shopping engine.

**If the operator overrules and keeps gold:** confine it to `WelcomeBonusCallout` only, drop `is-warn` from `EligibilityChips`, and move `VerifiedStamp.is-stale` to `--red`. One signal per colour is non-negotiable.

---

## 4. The single biggest visual gap

**The cards do not read as a publication's view of the product. They read as a database row about the product.**

Concretely, every spec card today renders:

- bank acronym
- card name
- annual fee
- earn rates
- welcome bonus
- eligibility
- last-verified
- "Read review →"

What is missing — and this is the come-back lever — is the line of editorial voice that says *what this publication thinks*. A one-sentence pull-from-`editorTake` (Fix #5) under the card title would convert every surface from a data tile to a publication artefact. The reader's mental model shifts from "I'm comparing products" to "I'm reading DubaiPoints' take on these products", and that mental model is what gets bookmarked.

The Fraunces 16/italic on a 52ch line is *the* visual idiom every magazine-trained reader recognises as editorial voice. We already use it in `.dp-take`. Putting it inline on the spec card extends that voice to the surfaces where readers spend the most time (finder, compare, hub grids) — currently the only surfaces where the publication's voice is mute.

Everything else in this review is polish. This is the gap.

---

## 5. Push-back on the brief

Three things worth flagging back to the Chairman / Managing Editor:

1. **The brief names gold as the welcome-bonus colour.** That contradicts the live policy in `global.css` and `EDITORIAL.md`. Recommend amending Done-When item §5 to read: "A reusable component library lands … with the welcome callout rendered in the navy-rule + Fraunces idiom (not gold) consistent with the Quiet Ledger amendment."

2. **The finder is shipped as a tool, not a publication artefact.** The Done-When item §4 is framed as "a filter-driven chooser". Today it reads as a SaaS filter UI. To meet the operator's "comes back" bar, the page should also carry a short editorial intro ("how we rank") and a "what we recommend for these three reader profiles" block underneath the results — surfacing the publication's voice on the same page the tool sits on. This is a 30-line additional editorial pass, not a re-architecture.

3. **No `editorTake` field on L2 cards.** Fix #5 above wants a short sentence on every SpecCard. Today the editorial layer is in `src/content/cards/<slug>.mdx`. Either (a) extract a `tagline` or first-sentence-of-`editorTake` from MDX at build time and join it to the L2 object, or (b) add an optional `tagline` field to `cards.json`. The Tech Lead and section editor own this call; flagging for the Managing Editor as a scope addition.

---

## Sign-off

| Component / page | Status |
|---|---|
| SpecCard.astro | pass-with-edits (Fix #4, #5) |
| FeeBlock.astro | pass |
| EarnRateTable.astro | pass-with-edits (Fix #3) |
| EligibilityChips.astro | pass-with-edits (Fix #2) |
| WelcomeBonusCallout.astro | **fail on accent**, pass on structure (Fix #1) |
| VerifiedStamp.astro | pass |
| /cards/compare.astro | pass-with-edits (Fix #6 partial, #7 not applicable) |
| /cards/finder/index.astro | pass-with-edits (Fix #6, #7, #8, #9) |

**Overall ux-status: pass-with-edits.** Forward to Fact-Checker (Stage 6) once Fix #1, #2, #3 land. Fix #4, #5, #6, #7 should land in the same PR; #8, #9, #10 can ticket separately if scope forces it.

— Head of UX, 2026-05-20.
