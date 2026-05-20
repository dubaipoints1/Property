---
slug: phase-2a-2-2-prose-density-pass
vertical: business-realestate
assigned-editor: standards-editor
predecessor-brief: phase-2a-2-0-pros-cons-verdict-amendment
gate-cleared: phase-1-chairman-approval (2026-05-20)
parent-programme: phase-2a-uae-banks-expansion
research-status: in-progress (UX spec for AtAGlance dispatched 2026-05-20)
seo-status: n/a
draft-status: complete (lead + Best for folded; Key conditions collapsed)
tech-status: pending (AtAGlance component queued behind UX spec)
factcheck-status: n/a (no data changes)
standards-status: complete (Skywards reference pair trimmed)
chairman-status: pending
target-publish: 2026-05-23
tier: T2
type: prose-density-trim + new-component
---

# Phase 2a.2.2 — Prose density pass on the card-review template

> Lands BEFORE the `phase-2a-2.1` propagation so all 30 card-review MDX
> files migrate to the *trimmed* template, not the bloated one.

## The reader problem

The operator eyeballed the rebuilt Skywards Infinite reference page on 2026-05-20 and reported it still reads as a wall of text on mobile. The components are right; the *prose around them* is the problem. Specifically:

1. **The Welcome bonus bullet list** (lines 70–76 of the current MDX) duplicates the new `<WelcomeBonusCallout />` content one-for-one (100,000 miles / Rotana Rewards / Silver tier). The callout is the structured display; the bullet list is the same content as prose. Reader sees the same beat twice in one viewport.
2. **The "back-of-envelope" earn-rate paragraph** (lines 48–51) is 5 lines of footnote material (USD ≈ AED 3.67, 0.54 miles/AED equivalent) immediately after the earn-rate table. Footnote, not body.
3. **The Fee summary paragraph** (lines 60–62) re-explains the waiver reversibility that the `<FeeBlock />` row already conveys. Then a separate one-line about interest rate (line 64) — a fragment that should fold into the data block.
4. **The "Key conditions to know" section** (lines 81–108) is 5 sub-sections × 2–3 bullets each = 15 bullets of dense prose. Each sub-section is itself a wall. On a 375px viewport, reads as ~3 full screens of bullet-list scrolling.
5. **The "Best for" section** (lines 119–125) still duplicates the EditorVerdict's audience qualifier even after the prior brief flagged it. Deferred and never landed.

The operator's bar: "simplified, visually easier to follow." Mobile readers on second-language English need less prose between visual blocks, not more.

## The two-part fix

### Part A — New `<AtAGlance card="<slug>" />` component

A 3-stat horizontal strip placed **above** the `<EditorVerdict />`. Pulls three numbers from cards.json:

| Tile 1 | Tile 2 | Tile 3 |
|---|---|---|
| Annual fee — AED N or "Free" | Min salary — AED N/mo | Top earn rate — Nx (label) |

Tile body in **24px Fraunces** (one step below the FeeBlock's 28px headline so the FeeBlock retains its anchor role). Eyebrow above each tile in DM Sans 10px / 700 / uppercase / 2px tracking. Three tiles on desktop ≥720px (equal-width grid, 16px gap); stacked on mobile <720px with the same tile chrome.

**Reading purpose**: gives the reader the three headline numbers in 3 seconds before they encounter any prose. The EditorVerdict (italic Fraunces) then carries the publication's read; the ProsCons gives the at-a-glance summary; only then does the reader hit Earn Rates / Fee Summary / etc.

UX spec (currently in flight) locks the exact pixel values + tokens.

### Part B — Aggressive Standards Editor prose trim

Every post-component paragraph in the Skywards Infinite MDX is either:
- **Trimmed to ≤1 sentence** that adds something the component doesn't already say, OR
- **Deleted**.

Specific cuts on Skywards Infinite (mirror on Signature with parallel edits):

| Location | Action |
|---|---|
| Lines 48–51 (post-earn-rate "back-of-envelope" paragraph) | Move the "0.54 miles/AED" footnote into the EarnRateTable's component caption OR cut entirely. Reader who needs the AED conversion is the minority; the bank denominates in USD. |
| Lines 53–54 (post-earn-rate "miles post directly" paragraph) | Cut — the table caption already says "direct Skywards earning". |
| Lines 60–62 (post-FeeBlock waiver reversibility) | Cut — `FeeBlock` already shows the "Reversible from year two on cumulative spend" line in its waiver footnote. |
| Line 64 (post-FeeBlock interest rate fragment) | Move to a `FeeBlock` row (or a footer below the fee tile). One-sentence orphan paragraph is the worst kind of prose. |
| Lines 70–76 (Welcome bonus bullet list) | **Delete the entire bullet list.** The `<WelcomeBonusCallout />` covers all four items (Up to 100k miles / Rotana / Silver tier / headline value). Keep only the closing sentence about Y-to-J upgrade economics if it adds reader value, otherwise cut. |
| Lines 78–79 (post-welcome bonus closing paragraph) | Trim to one sentence or cut. |
| Lines 81–108 ("Key conditions to know" section) | **Collapse all 5 sub-sections into one compact `<dl>` block** with 5 `<dt>/<dd>` pairs. Each `<dd>` is ≤2 lines of prose. Goes from ~15 bullet points to 5 paragraph-style entries. New microcopy: section heading stays "## Key conditions to know"; sub-section labels become bold inline (`<dt>`); content becomes a single paragraph per condition (`<dd>`). |
| Lines 119–125 ("## Best for" section) | **Fold into the EditorVerdict's notes line** (one-sentence addition to the verdict body) and delete the standalone h2 + paragraph. The verdict already names the audience; adding the AED 100k threshold sentence makes it complete. The wayfinding-anchor argument was weaker than expected once the verdict landed above the fold. |
| Lines 127–144 ("## Watch out for" section) | **Keep verbatim.** Long-form caveat list for readers post-decision. This is the right register and the right placement. |

Net change: 144 lines of MDX → ~70 lines. The reading experience on a 375px viewport goes from ~9 mobile screens to ~5.

### Apply to both reference cards

- `src/content/cards/emirates-nbd-skywards-infinite.mdx`
- `src/content/cards/emirates-nbd-skywards-signature.mdx`

Signature is the smaller file (~106 lines today) but suffers the same density. Mirror the cuts.

## Done when

1. New `<AtAGlance.astro>` component shipped per UX spec.
2. Both reference MDX files trimmed per the table above.
3. Compact `<dl>`-style render of "Key conditions to know" works on mobile without horizontal scroll.
4. `<AtAGlance />` placed above `<EditorVerdict />` on both reference MDX files.
5. EditorVerdict body includes the AED 100k threshold sentence (folded from "## Best for").
6. `npm run check` / `npm run build` / `npm test` all green; new tests for AtAGlance render.
7. Council sign-off: Standards Editor (the trim is theirs), Tech Lead (the component is theirs), Chairman (the prose-density bar + the new component).

## Out of scope

- The other 28 card-review MDX files — `phase-2a-2.1` propagation brief picks them up once this passes.
- New design tokens — none. AtAGlance uses existing `--ink`, `--paper`, `--line`, `--green`.
- New data fields — none.
- Layout / page-template changes — none.
- Removing the watch-out-for section — explicitly kept.

## Acceptance for the Chairman gate

The Chairman will refuse if:

- The trimmed prose loses any AED figure or material fact present in the pre-trim version (Standards Editor's pass is *cut*, not *omit-data*).
- AtAGlance competes visually with the EditorVerdict (the verdict is the dominant block; AtAGlance is the quick-look strip).
- The mobile view at 375px shows any horizontal scroll on any component.
- The `<dl>` collapse of "Key conditions to know" breaks the section's scannability (e.g., labels run too long to wrap cleanly).
- Lighthouse Performance score drops more than 3 points vs. the Phase 1 baseline.

---

_Brief opens 2026-05-20 on operator review of the rebuilt Skywards Infinite page. Standards Editor does the trim; Tech Lead builds AtAGlance per UX spec; Chairman gates._
