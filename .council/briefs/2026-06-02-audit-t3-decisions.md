---
status: open
tier: T3
raised-by: 3-agent site audit (Head of UX + Standards Editor + Fact-Checker) — 1 June 2026
owner: chairman (terminology) → standards-editor + head-of-ux (rollout) → section-editors (pilot)
chairman-status: pending
---

# Brief — four T3 audit decisions awaiting Chairman gate

**Date:** 2026-06-02
**Tier:** T3 (voice / terminology / new template) per Charter §"Tiered review"

The 1 June 2026 three-agent audit (Head of UX, Standards Editor,
Fact-Checker, dispatched in parallel) closed 6 HIGH-severity reader-
impact bugs (merged as PR #204) and 8 T1 chrome microcopy fixes
(merged as PR #205). Four findings remain that need Chairman gate
because they involve site-wide terminology, voice, or a precedent-
setting first instance.

## Decision 1 — Kill "Intel" or keep it?

Standards Editor finding T3-A. The publication uses **four** competing
labels for the same artefact (long-form editorial):

| Surface | Current label | File:line |
|---|---|---|
| `/guides/` H1 | "All intel." | `pages/guides/index.astro:52` |
| `/guides/` meta title | "All Intel — UAE points, miles, banking guides" | `pages/guides/index.astro:60` |
| Homepage section | "Fresh Intel" / "All intel →" | `pages/index.astro:244, 246` |
| Sidebar block | "Insider Intel" | every index page |
| Newsletter band | "The DubaiPoints brief" | `pages/index.astro:371` |
| Header CTA | "Subscribe" | `Header.astro:249` |
| Hero CTA | "Join the brief →" | (now killed in PR #205, formerly index hero) |

**Standards Editor's recommendation:** "Intel" reads as a marketing
flourish — closer to a spy-thriller register than HfP-dry. Consolidate
to **Guides** (the route, the schema, the noun the reader already
understands) and reserve **The brief** for the newsletter only. Kill
"Intel" entirely.

**Chairman decision needed:**
- (a) Kill "Intel" — consolidate to "Guides" and "The brief"
- (b) Keep "Intel" — formalise it as the canonical noun and rewrite
  the four scattered uses into one consistent label everywhere
- (c) A different consolidation the Chairman prefers

Rollout once decided: T2 chrome-copy PR. Branch the rollout from the
already-shipping chrome microcopy pattern (PR #205) for consistency.

## Decision 2 — "Welcome bonus" vs "Welcome offer"

Standards Editor finding T3-B. The codebase is internally consistent
on **"Welcome bonus"** in chrome (AtAGlance fact-tile, listing tiles,
strap on CardReviewLayout) and one outlier:

- `src/components/cards/WelcomeBonusCallout.astro:92` — callout
  eyebrow reads **"Welcome offer"** (the only chrome occurrence)
- Editorial body prose: three card MDX files leak `sign-up bonus`
  (`fab-elite.mdx:162`, `emirates-nbd-visa-flexi.mdx:122`,
  `emirates-nbd-visa-platinum.mdx:122`); one guide leaks both
  (`dubai-shopping-festival-2026.mdx:117, 168`)

**Chairman decision needed:** is "Welcome bonus" or "Welcome offer"
the canonical chrome term? "Welcome bonus" is industry-standard
(TPG, HfP, UP all use it); "Welcome offer" is FAB's own marketing
language. Recommend: **Welcome bonus** as canonical, harmonise the
one chrome outlier, route editorial body prose fixes through the
relevant section editors.

## Decision 3 — "Annual fee" vs "Annual membership fee"

Standards Editor finding T3-C. Chrome standard is **"Annual fee"**
everywhere (`AtAGlance.astro:123`, `CardReviewLayout.astro:313`,
listings — all shipped). Two card bodies and one cards.json note
leak `annual membership fee`:

- `src/data/cards.json:859` — editor-typed note in one card record
- `src/content/cards/emirates-islamic-switch-cashback.mdx:96`

**Chairman decision needed:** is "Annual fee" or "Annual membership
fee" the canonical term? Recommend: **Annual fee** as canonical
(shorter, industry-standard, already 95%+ adopted). Editor's choice
on the leaked uses; flag to business-realestate-editor for the
section-by-section sweep.

## Decision 4 — "Value to me: AED X" pilot

Head of UX finding T3 (also referenced by competitor-teardown.md
§"Tier A #2"). The Tier A competitor pattern is at **0/55** card
adoption. Only renders in `/design-spike/`.

**Spec is straightforward:** an MDX convention + an inline
`<ValueToMe amount={X} reasoning="…">` component, OR a Fraunces-
italic prose convention used inline after each benefit H3. No L2
schema change required; no scrape change required. The Fact-Checker
audit already confirms `welcomeBonusHeadline`, `annualFeeLabel`,
`topEarnEntry`, `formatEarnValue`, `formatAED` are the canonical
primitives — `ValueToMe` would compose them.

**Editorial weight:** per-benefit AED valuation = per-benefit
opinion at scale. The first time the publication renders
"Value to me: AED X" on a benefit, it's making a public reader-
facing claim about an editor's personal valuation of that perk for
a typical UAE-resident reader. Chairman-gated for the same reason
the first card-review score (per the 2026-05-25 amendment) was
Chairman-gated.

**Chairman decision needed:** pick a pilot path —
- (a) Component-based pilot — ship `<ValueToMe>` component, roll
  out on one card (e.g. `fab-elite.mdx` which already has the
  EditorScorecard scaffolding), eval, expand to 5 cards, eval,
  expand to remaining 50. Estimated T2 + T2 + T3 stages.
- (b) Prose-convention pilot — Fraunces-italic inline string after
  each benefit H3 ("Value to me: AED X — reasoning fragment").
  Lower engineering, higher editor authorial-voice burden.
- (c) Defer entirely until the first card-review score lands (per
  2026-05-25 amendment, that itself is Chairman-gated as
  precedent-setting). Stack the two as a single editorial moment.
- (d) Different approach the Chairman prefers.

Head of UX recommendation: **(c) — defer.** The publication should
not ship two precedent-setting editorial-opinion mechanisms in
quick succession; the first card-review score is the bigger lift
and should land first. Once a Chairman-approved scorecard is live
on N cards, the Value-to-me pattern can ride the same editorial-
voice precedent.

## Cross-decision rollout sequencing

If all four are approved, recommend this rollout order to minimise
chrome churn:

1. **Decision 1** (Intel) — biggest site-wide diff. Land first as a
   T2 chrome PR.
2. **Decision 2** (Welcome bonus) — single-string chrome fix; can
   ride the Decision 1 PR or land standalone.
3. **Decision 3** (Annual fee) — content-side; section editor sweep,
   not chrome. Routes through business-realestate-editor.
4. **Decision 4** (Value to me) — defer per Head of UX
   recommendation, OR launch the pilot once the EditorScorecard
   precedent is established (4/55 currently; per the audit roll
   to 10–15 next, then re-evaluate Value-to-me as the natural
   follow-on).

## One-line summary

**Four Chairman-gate decisions outstanding from the 1 June 2026
three-agent audit: kill "Intel", canonicalise "Welcome bonus" +
"Annual fee", and pick a "Value to me" pilot path. T1+T2 work
from the same audit shipped in PRs #204+#205.**
