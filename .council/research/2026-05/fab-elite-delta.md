# Delta Report — `fab-elite` vs. premium-card competitor parallels

_Opened 2026-05-22 by Head of Research. Follow-on to `.council/research/2026-05/competitor-teardown.md` v2._

**Purpose:** The user surfaced `https://dubaipoints.ae/cards/fab-elite/` as evidence that the competitor teardown's findings have not propagated to the live site. This dossier answers the question empirically: scrape one premium-card review per competitor (matching FAB Elite's positioning: high annual fee, frequent-traveller / lifestyle target), then compare structurally — what does the cohort do that we don't?

**Cohort and source data:**

| Site | Card scraped | Annual fee | Scrape date | Archive |
|---|---|---|---|---|
| TPG | Chase Sapphire Reserve | $795 | 2026-05-22 | `raw/tpg-csr-review.md` |
| Upgraded Points | Chase Sapphire Reserve | $795 | 2026-05-22 | `raw/upgradedpoints-csr-review.md` |
| OMAAT | Chase Sapphire Reserve | $795 | 2026-05-21 | `raw/omaat-csr-review.md` |
| Head for Points | American Express Platinum | £650 | 2026-05-21 | `raw/hfp-amex-platinum-review.md` |
| dubaipoints.ae | FAB Elite | AED 2,500 (~$680) | 2026-05-22 | `src/content/cards/fab-elite.mdx` |

**Empirical confirmation of UP standardisation:** the UP CSR review's scaffold is **identical** to UP CSP (mid-tier) right down to section ordering, eyebrow wording, and the "Upgraded Points: Expertise You Can Trust" trust-block copy. The dossier's inference about template standardisation is now empirically grounded — same template, different cards.

---

## Side-by-side element matrix

✅ = present and well-executed · ⚠️ = present but degraded · ❌ = missing entirely · n/a = not applicable on our site

| Element | TPG CSR | UP CSR | OMAAT CSR | HfP Amex Plat | **fab-elite** |
|---|---|---|---|---|---|
| Hero photograph above the fold | ✅ Featured Getty photo with credit | ✅ Card-art mock | ✅ Card-spec hero panel | ✅ Photo with credit | ❌ **no heroImage frontmatter** |
| Byline (named author + role + bio) | ✅ Matt Moffitt + photo + bio | ✅ Jarrod West + reading-time | ❌ Meta-only (Ben Schlappig) | ✅ Rob Burgess + comment count | ⚠️ "DubaiPoints Editorial" (generic, no person) |
| Publication / verified date | ✅ "May 01, 2026 · 14 min read" | ✅ "Est. reading time: 10 min" | ✅ "May 2026" | ✅ "19 May 2026" | ❌ no date visible in MDX (lastVerified comes from cards.json) |
| Read-time estimate | ✅ | ✅ | ✅ | ❌ | ❌ |
| Above-the-fold fact tiles (fee / bonus / earn / salary) | ✅ 4 tiles (Welcome Offer / Annual Fee / APR / Credit) | ✅ 4 tiles (same) | ✅ 4 items in card-spec hero | ❌ inline prose | ❌ **no `<AtAGlance>` component** |
| Star / numeric rating | ✅ ⭐⭐⭐⭐½ (4.5/5) | ✅ 4.59/5 + tooltip | ✅ 5.0/5 + methodology link | ❌ | ❌ **no `tier` or `scores` frontmatter** |
| Jump-to-section anchor list | ✅ "Jump to section" pill | ❌ | ⚠️ TOC text mentioned, not seen in scrape | ❌ | ⚠️ **lives at the layout level (Phase 2a.2.7), but reads the page's H2s — which fab-elite only has 3 of** |
| Lede / thesis paragraph | ✅ Single use-case paragraph | ✅ 2-paragraph summary | ✅ Bolded "no-brainer if eligible" thesis | ✅ Bolded thesis + counter | ✅ 1 paragraph lede |
| **"Apply if / Skip if" fit framing** | ⚠️ scattered in "Downsides" section | ✅ explicit mirrored `Great Card If / Don't Get If` H2 lists | ❌ buried in prose | ❌ in conclusion | ❌ **no `applyIf` / `skipIf` frontmatter; no `<GreatCardIf>`** |
| Editor verdict callout / our take | ⚠️ inline | ✅ Inline named-editor blockquote (Lori Zaino) | ✅ first-person voice throughout | ✅ "Value to me" framework | ⚠️ `editorTake` set but **not rendered** (layout-side rendering removed in Phase 2a.2.0; `<EditorVerdict>` component never added) |
| Pros / cons block | ✅ 2-col markdown table | ✅ Parallel bulleted lists with bold-emphasis | ❌ none (prose only) | ✅ table | ⚠️ frontmatter `pros` + `cons` populated but **NOT rendering** (same root cause as above) |
| Welcome bonus dedicated section | ✅ H2 + dollar valuation | ✅ Welcome Bonus & Info bulleted block | ✅ first H2 | ✅ H2 + transfer-partner conversion table | ⚠️ 1 paragraph in prose, no structured value |
| Fee summary table | ⚠️ APR in fact-strip + prose | ⚠️ same | ⚠️ first H2 prose | ✅ inline bold | ⚠️ prose only — fees scattered in body |
| Earn-rates table | ✅ 4-row table | ✅ in bulleted Welcome Bonus & Info | ✅ table-equivalent in earning H2 | ✅ section by section | ❌ no `<EarnRateTable>`; earn structure described in prose only |
| Per-benefit H3 breakout (lounges / status / insurance) | ✅ 6 H3s | ✅ 12 H3s | ✅ ~10 H3s | ✅ 9 H3s with "Value to me" each | ❌ benefits compressed into a single short H2 "What you actually get" |
| Image rhythm — inline body images | ✅ 7 images with uppercase credits | ⚠️ several images, no captions | ✅ ~14 images with inline captions | ✅ 3 images, no captions | ❌ **zero body images** |
| Comparison vs sibling card | ✅ H3 "Sapphire Reserve vs. Amex Platinum" + 3-card alternatives H2 | ✅ 2 alternative cards + 10 comparison-link tiles | ✅ "Showdown:" H3 vs Preferred + vs Reserve Business | ✅ named alternatives | ❌ **no `<CardComparison>`** |
| Time-limited offer callout (repeated top + end) | ✅ "Limited-Time Offer" eyebrow + bold reprise | ✅ NEW OFFER eyebrow + strikethrough | ❌ | ✅ paragraph repeated twice | ❌ |
| "Is it worth it?" H2 (question form for the verdict) | ⚠️ "Bottom line" closes; no dedicated worth-it H2 | ✅ explicit H2 | ✅ explicit H2 | ✅ implied in conclusion | ❌ uses "Where it falls short" instead |
| "Bottom line" final H2 | ✅ explicit | ⚠️ implicit in last paragraph | ✅ explicit | ✅ "Conclusion" | ⚠️ last sentence works as a Bottom Line, but no H2 |
| Affiliate / regulatory disclosure | ✅ Editorial disclaimer paragraph + inline tooltips | ✅ Advertiser modal banner | ⚠️ buried link only | ✅ FCA paragraph | n/a (no affiliate yet — Charter §5) |
| TODO comments in published prose | n/a | n/a | n/a | n/a | ⚠️ **2 unresolved `{/* TODO: */}` blocks** ("verify exact spend threshold", "confirm exact clawback formula") |
| Sources / references | ⚠️ inline | ✅ Card Details has Customer Service + Login Link | n/a | n/a | ✅ `sources[]` in cards.json (renders in layout footer) |
| Comments | ⚠️ Beta | ❌ | ✅ 23 threaded | ✅ 109 threaded | ❌ |
| Cardholder-survey ratings | ✅ 4.7/5 from 19, 4 sub-ratings, verbatim quotes | ❌ | ❌ | ❌ | ❌ |

---

## Punch list — what fab-elite needs to reach the dossier's reference template

Ordered by leverage. Each line is a discrete, actionable change.

### Tier 1 — content + frontmatter (no engineering)

1. **Add Phase 2a.2.3 scorecard fields to frontmatter:** `kicker`, `tier` (probably `solid` based on the existing edit's tone), `scores` (5-dim self-assessment), `applyIf`, `skipIf`. All other ENBD/FAB cards in the propagation cohort need the same. About 8–15 minutes of editorial judgment per card.
2. **Resolve the 2 `{/* TODO: */}` blocks** before propagation — verify spend threshold + window for the 500k welcome bonus, and the clawback formula. Fact-Checker task. Source: FAB issuer page + salary-transfer T&Cs. If the answer can't be sourced cleanly, the TODOs become explicit "we asked FAB and have not received confirmation" caveats in prose — Charter §10 forbids unresolved scratchpad comments in published prose.
3. **Restructure the H2 spine** to match the dossier model: replace `What you actually get` / `Who should open it` / `Where it falls short` with the canonical seven-H2 spine (`Earn rates` → `Fee summary` → `Welcome bonus breakdown` → `Key conditions to know` → `[Card] vs [sibling]` → `Watch out for` → `Is it worth it?` → `Bottom line`). The existing prose can be reorganised into these slots; the analysis doesn't change.
4. **Write `## Is it worth it?` + `## Bottom line` H2 sections** at the foot of the article, modelled on the reference Skywards pages. Bottom Line must contain a visible `**Apply**` / `**Skip**` / `**Move up**` token.

### Tier 2 — component invocations (the components exist; just wire them)

5. **Add `<AtAGlance card="fab-elite" />`** — 4-tile fact strip (Annual Fee / Min salary / Top earn rate / Welcome bonus). Reads from `cards.json`; needs no per-card work beyond confirming the L2 data is correct.
6. **Add `<GreatCardIf card="fab-elite" />`** — mirrored Apply / Skip block above the fold. Requires the `applyIf` / `skipIf` frontmatter (Tier 1, item 1) first.
7. **Add `<EditorVerdict card="fab-elite" />`** — renders the kicker + verdict callout. Requires `kicker` frontmatter (Tier 1, item 1) first.
8. **Add `<ProsCons card="fab-elite" />`** — renders the existing frontmatter `pros` + `cons` (which are CURRENTLY POPULATED BUT NOT RENDERING). One-line fix.
9. **Add `<EditorScorecard card="fab-elite" />`** at the foot of the article — tier badge + 5 dimension stars + Apply/Skip qualifiers. Requires `tier` + `scores` frontmatter.
10. **Add `<EarnRateTable card="fab-elite" />`, `<FeeBlock card="fab-elite" />`, `<WelcomeBonusCallout card="fab-elite" />`** to replace bare-prose tables. All read from `cards.json`.
11. **Add `<CardComparison cards={["fab-elite", "fab-cashback"]} />`** in the comparison H2 — needs a sibling card to compare against. FAB Cashback is the natural counterpart (same issuer, opposite philosophy: cashback vs ESG-rewards).

### Tier 3 — image binary + hero

12. **Add `heroImage` frontmatter** referencing a FAB-issuer or stock library file. **Blocked on the env network-policy issue** that prevents image-CDN egress. Phase 2a.2.1b territory.
13. **Add 1–2 inline body images** with credit lines per Charter §10. Same network-policy block.

### Tier 4 — out of scope here, named for the propagation brief

14. **`Value to me: AED X` per-benefit annotation** convention — separate Standards Editor brief; HfP signature pattern; pure MDX content once Standards approves the convention.
15. **Inline editor-quote pattern** — when we have ≥2 named editors on the masthead, the UP-style inline blockquote with named attribution is a Tier-A trust upgrade.
16. **Comments infrastructure** — out of scope until the moderation-policy decision is made.

---

## The single most damning finding

`pros` and `cons` are populated in fab-elite's frontmatter. They are not rendering anywhere on the live page. This has been true since Phase 2a.2.0 (2026-05-20), when the layout's `pros`/`cons` block was removed in favour of an MDX-invoked `<ProsCons />` component — and the component was added only to the two reference cards. Twenty-nine cards have authored editorial pros/cons sitting in their frontmatter that the reader never sees.

**This is the strongest single argument for Phase 2a.2.1 propagation as the immediate next priority.**

---

## What this dossier confirms about the original teardown

- **UP standardisation is empirically verified.** CSP and CSR reviews share an identical scaffold including identical wording in trust blocks and methodology footers. The dossier's inference about template consistency is grounded.
- **TPG goes single-byline on premium cards.** CSP had 3 authors + compliance reviewer; CSR has 1 author. The Tier-A pattern "multi-byline panel" needs nuance: TPG uses it on mid-tier cards, not on premium cards.
- **OMAAT's "Personally I value points at X cents" math is consistent** across CSR and the Amex Business Gold review (linked elsewhere in OMAAT). Pattern is stable.
- **Every site has a "Bottom line" or equivalent final-paragraph verdict.** fab-elite doesn't.

---

## Recommendation

Propagation should ship in **bank-batches** as planned (per the answer to the propagation-order question), but **fab-elite gets the worked-example PR first**. The PR demonstrates the full template adoption on one real card and gives Council a concrete artefact to sign off on before the broader rollout. The image binaries (Tier 3 above) are explicitly deferred pending the env network-policy fix; everything else is unblocked.

End.
