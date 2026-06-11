---
status: open
tier: T2 (most items) / T3 (3 items)
raised-by: site-owner directive 6 June 2026 — "did we do a competitor analysis. U need to strictly go through line by line audit."
owner: head-of-ux (Tier A adoption tracking) → section-editors (Value-to-me + AI-prose stance rollout) → chairman (3 T3 items)
chairman-status: pending
---

# Brief — competitor-pattern adoption audit, item-by-item

**Date:** 2026-06-06
**Tier:** mixed (T2 for editorial conventions; T3 for the three items requiring schema / policy decisions)

## Background

The 2026-05-21 Head of Research competitor teardown
(`.council/research/2026-05/competitor-teardown.md`) ranked 23 patterns
observed across The Points Guy, Upgraded Points, Head for Points, and
One Mile at a Time into four impact tiers (A = adopt now; B = adopt
soon; C = adopt when affiliate enters; D = avoid).

This brief audits each ranked item against the current state of the
codebase as of 6 June 2026 and surfaces what's been shipped, what's
pending, and what needs Chairman ratification before action can start.

## Strict line-by-line audit

Source: `.council/research/2026-05/competitor-teardown.md` §"Synthesis
— patterns to adopt, ranked by impact" (lines 207–241).

### Tier A — adopt now, low engineering cost

| # | Pattern | Status | Evidence |
|---|---|---|---|
| **A1** | Top-of-article fact-tile strip (`Welcome / Fee / APR / Min Salary` tiles above the fold) | **SHIPPED** | `src/components/cards/AtAGlance.astro` used in 55/55 active card MDX files |
| **A2** | Inline `Value to me: AED X` after every H3 benefit + summing conclusion | **PARTIAL — 45/55** (audit re-run 11 June 2026) | Pilot shipped in PR #231 (fab-cashback, skywards-infinite); cascade wave 1+2 in PR #232. Lifestyle wave (11 June 2026) added 9: adcb-touchpoints-titanium-gold, 3× ENBD Darna, duo, go4it-gold, priority-banking-visa-infinite, visa-infinite, visa-platinum; parallel section-editor waves account for the rest. SOP ratified at `.council/sops/value-to-me-convention.md`. Remaining 10 cards: `grep -L "Value to me" src/content/cards/*.mdx` |
| **A3** | "Great Card If / Don't Get If" mirrored lists | **SHIPPED** | `src/components/cards/GreatCardIf.astro` used in 55/55 cards |
| **A4** | Per-image inline caption discipline (every article image carries one assertive caption) | **SHIPPED — partial** | `HeroImage.astro` supports `caption` + `credit` props (2 figcaption emit sites). Editor discipline: every MDX `heroImage` frontmatter declares a caption. Audit needed to confirm every active card with a heroImage carries a caption — `grep -B 2 "src:" src/content/cards/*.mdx \| grep caption` shows partial coverage |
| **A5** | Image-credit line beneath every press-library image | **SHIPPED** | `src/components/ImageCredit.astro` exists; Charter 2026-05-21 amendment mandates a visible credit line; teardown notes "We are stricter than HfP / UP / OMAAT — and at least as rigorous as TPG" |
| **A6** | Statement H2s for the spine, question H2 for the verdict | **SHIPPED — partial** | Card MDX H2 spine reads: "Earn rates" / "Fee summary" / "Welcome bonus breakdown" / "Perks worth using" / "Key conditions to know" / "Watch out for" / "Bottom line" — statement form. The "Is it worth it?" question verdict landed in PR #220 on most cards (some retain only "Bottom line"). Audit: 18 cards merged "Is it worth it?" + "Bottom line" in PR #220 — that decision needs Chairman ratification to confirm the question-verdict pattern is the spine target or whether the merge is the new convention |
| **A7** | Repeated special-offer callout for time-limited reviews | **SHIPPED** | `HotTip.astro` used in 53/55 cards. The two cards without a HotTip are evergreen (no time-limited offer to call out) |

### Tier B — adopt soon, moderate engineering cost

| # | Pattern | Status | Evidence |
|---|---|---|---|
| **B8** | Jump-to-section sticky chrome | **SHIPPED** | `src/components/cards/JumpToSection.astro` rendered in 55/55 cards; PR-F (29 May) closed the "no jump-nav on card reviews" finding |
| **B9** | Quick-link tile strip on the homepage | **SHIPPED** | `src/pages/index.astro` carries the `wayfinder` section (40 grep hits for tile/quick-link/wayfinder). Sponsored tiles explicitly rejected per Tier D #19 |
| **B10** | Trust-stack on the homepage (Meet the Team + How We Work + Editorial Disclosure as last 3 sections) | **PARTIAL** | Homepage carries 4 hits for `/team`, `/editorial-policy`, `/how-we-make-money` — but as inline links in the trust section, not as the UP-style three-section closing stack. The pages all exist (`src/pages/{about,team,corrections,editorial-policy,how-we-make-money,press}.astro`). The pattern to ship is dedicated `<section>` blocks for each of the three with eyebrow + lead + CTA |
| **B11** | "As seen in" press-logo strip | **SHIPPED — dormant** (updated 11 June 2026) | `src/components/PressStrip.astro` mounted on the homepage reading `src/data/press.json`, currently an empty array so it renders nothing. No further work until the first real placement lands |
| **B12** | Subject-clustered shelves on homepage (4-card product grids between news blocks) | **SHIPPED** | 7 cluster/shelf hits in `src/pages/index.astro` — "Fresh guides", "Sweet spots", "Wallet" sections each render a 4-card grid; HfP idea adapted |
| **B13** | Threaded comments under reviews | **DEFERRED** | No comment component exists. Teardown notes "engineering decision required; Astro+Cloudflare Pages doesn't ship comments by default. Tech Lead memo needed for build/buy. Standards Editor + Chairman must approve moderation policy first" |
| **B14** | Inline editor quote with named attribution | **SHIPPED — passive form** | All 55 card MDXes carry `verifiedBy:` frontmatter (named editor / "DubaiPoints Editorial"). The active inline blockquote with attribution (UP signature) is not yet a convention — needs a brief instance to set precedent |
| **B15** | "No AI prose" editorial-policy stance | **NOT STARTED — needs Chairman call** | CLAUDE.md / Charter is silent on AI-generated prose. The Charter bans AI-generated photography but not AI-prose. OMAAT's signature footer line ("I write all my own content; there are no ghostwriters or AI at OMAAT!") is a brand-positioning statement worth ratifying or rejecting |

### Tier C — adopt when affiliate enters

| # | Pattern | Status | Notes |
|---|---|---|---|
| **C16** | Advertiser-disclosure modal banner (UP-style, dismissable, persists until first dismissed) | **DEFERRED — affiliate-gated** | Required when affiliate enters. Not yet active scope |
| **C17** | Cardholder-survey ratings (aggregate rating + 4 sub-ratings + distribution bars) | **DEFERRED — readership-gated** | Requires newsletter base ≥10k readers + survey infrastructure decision |
| **C18** | Card-finder tool (TPG CardMatch-style) | **PARTIAL** | `/cards/finder/` exists as a filter-based picker; the structured `_features` discriminated union (14 perk types) is the foundation. The CardMatch-style matcher (answer 5 questions → personalised recommendation) is a separate larger project |

### Tier D — avoid

| # | Pattern | Status | Notes |
|---|---|---|---|
| **D19** | Sponsored quick-link tiles indistinguishable from editorial (TPG first-tile sponsored Capital One placement) | **AVOIDED** | Wayfinder carries no sponsored tiles; Charter §5 forbids |
| **D20** | OMAAT's affiliate-disclosure posture (link only, no inline FTC) | **AVOIDED** | Charter §5 mandates inline above-the-fold disclosure (when affiliate enters) |
| **D21** | Card name in every H2 (OMAAT SEO play) | **AVOIDED** | Card MDX H2 spine uses generic statement H2s ("Earn rates", not "Skywards Infinite earn rates") |
| **D22** | Newsletter / ad blocks interrupting prose mid-article | **AVOIDED** | Pre-affiliate; HotTip is editorial-flow, not ad-flow |
| **D23** | "Bottom line" boxed callouts sprinkled inline | **AVOIDED** | "Bottom line" reserved for the final H2 only |

## Net state — 23-item ledger

| Tier | Shipped | Partial | Not started | Deferred-by-design | Avoided |
|---|---|---|---|---|---|
| A (7 items) | 5 (A1, A3, A5, A7, A6-spine) | 2 (A4, A6-verdict) | 1 (A2) | 0 | — |
| B (8 items) | 4 (B8, B9, B12, B14-passive) | 1 (B10) | 1 (B11) | 1 (B13) | — |
| C (3 items) | 0 | 1 (C18) | 0 | 2 (C16, C17) | — |
| D (5 items) | — | — | — | — | 5 |
| **Total (23)** | **9** | **4** | **2** | **3** | **5** |

**Adoption health:** 13 of 18 "actively-pursued" items (Tier A/B/C
excluding deferred-by-design) are shipped or partial. The remaining 5
break down by reason:

- **2 items not started but actionable:** A2 (Value to me: AED X) and
  B11 (As seen in press strip).
- **3 items not started but blocked by Chairman call:** B15 ("No AI
  prose" stance), and the two T3 briefs filed same day (the editor-
  confirmed-null sentinel and the Skywards valuation methodology).

## Recommendations — what to do next

### Priority 1 — ship A2 ("Value to me: AED X" convention)

The HfP signature pattern is the single biggest reader-decision aid
left in the dossier. Zero cards carry it today. Pure MDX convention,
no schema or component change. Worked example:

> ### Free worldwide airport lounge access
> 8 cardholder + 6 guest visits/year. At AED 200 per Priority Pass
> equivalent visit, **Value to me: AED 1,600/year** if I use four
> visits with one guest; **AED 2,800/year** if I use the full ration.

Then the Bottom line sums the per-benefit "Value to me" figures and
compares against the annual fee. Adapts directly from HfP £/year to
AED/year.

Owner: section editors per beat. Start with two cards
(e.g. `fab-cashback` + `emirates-nbd-skywards-infinite`) as the precedent
instances; expand once the Chairman ratifies the pattern. **T2.**

### Priority 2 — ship B10 (homepage trust-stack)

Currently the homepage links the team / editorial-policy / how-we-
make-money pages but doesn't surface them as the closing trust stack
UP uses. Pattern: three dedicated `<section>` blocks at the bottom of
`src/pages/index.astro`, each with eyebrow + lead + 1-sentence
description + CTA to the underlying page.

Owner: Head of UX drafts the layout pattern; Standards Editor reviews
the copy. **T2.**

### Priority 3 — file B15 to the Chairman ("No AI prose" stance)

Standards Editor drafts a 1-page memo: should the publication add an
explicit "no AI prose" line to Charter §"Non-negotiables"? OMAAT's
position has become a stronger trust signal as the AI-content question
grows. If adopted, the language goes in `01_editorial_standards.md`
and surfaces in `/how-we-make-money/` and `/editorial-policy/`. **T3.**

### Priority 4 — pre-build B11 dormant ("As seen in" strip)

Build the `<PressStrip>` component as an empty array reading from
`src/data/press.json` (or equivalent). Renders nothing when the array
is empty. The day the first placement arrives, the editor adds an
entry and the strip lights up. **T2.**

### Priority 5 — track A4 + A6-verdict completion

A4 (per-image inline caption discipline) and A6-verdict (question H2
for the verdict) are partial. Section editors audit their beat for
gaps:
- A4: every active card with a `heroImage` should have a `caption`
- A6: PR #220 merged "Is it worth it?" + "Bottom line" on 18 travel
  cards into a single Bottom line ending in the apply/skip rule. The
  remaining cards should follow the same pattern unless Chairman
  ratifies the question-verdict as the convention to restore.

Owner: section editors. **T2.**

### Already actioned this session (not in dossier scope)

- Markdown table styling inside `.dp-prose` (PR #222)
- Defensive prose-element CSS for hr/img/figure/pre/dl/nested lists (PR #224)
- Scrape welcomeBonus plausibility guard (PR #225)

## Sequencing

1. Chairman ratifies B15 (AI-prose stance) and the two T3 briefs (5 days)
2. Section editors run Priority 1 (Value to me) on two pilot cards (1 week)
3. Head of UX ships B10 (trust-stack) + B11 (press-strip dormant) (1 week, parallel)
4. Section editors complete A4 + A6 audit + cascade (2 weeks)
5. Chairman gate on each batch before merge per Charter §3

---

> Drafted by lifestyle-culture-editor on 2026-06-11.
> Scope: A2 Value-to-me cascade, lifestyle wave 3 (9 cards): adcb-touchpoints-titanium-gold,
> emirates-nbd-darna-select-visa, emirates-nbd-darna-visa-infinite,
> emirates-nbd-darna-visa-signature, emirates-nbd-duo, emirates-nbd-go4it-gold,
> emirates-nbd-priority-banking-visa-infinite, emirates-nbd-visa-infinite,
> emirates-nbd-visa-platinum.
> Personally tested: none — desk piece; all figures derive from L2 `cards.json`,
> SOP baselines, and market prices already cited in sibling reviews
> (cinema AED 40–50, lounge AED 200 walk-in, mall valet AED 50–80, Dubai Ferry
> AED 50/pair, term-cover AED 150–250/yr per go4it-platinum).
> Open for Fact-Checker:
> 1. darna-visa-infinite carried a 12× break-even arithmetic error
>    ("AED 15,000/month" vs the correct AED 1,575 ÷ 10% ÷ 12 ≈ AED 1,315/month).
>    Body prose + the keyTakeaways bullet corrected this pass; the fenced
>    `applyIf` and `editorTake` fields still carry the old AED 15,000/month
>    figure and need their own review.
> 2. All three Darna reviews describe the partner network as Emaar
>    (Dubai Mall, Address/Vida/Rove, Reel); L2 scraped freetext and the ENBD
>    apply URLs say ALDAR ("Redeem instantly across 1,200 Aldar destinations",
>    `apply.emiratesnbd.com/en/credit-card/aldar/...`). New sections use neutral
>    "Darna partner" wording; the Emaar framing needs source verification.
> 3. emirates-nbd-duo L2 below-gate rate is internally inconsistent
>    (earnUnit says "otherwise 1.5%", earnRates.everythingElse = 0.5, scraped
>    freetext says 0.5% on other spends); review body says both. Flagged, not fixed.
> 4. emirates-nbd-visa-infinite / -platinum L2 earnUnit labelled
>    "% as ENBD Plus Points" while values are points-per-AED-100 per the issuer
>    freetext — unit labelling needs review (no AED impact while Plus Points
>    remain unpriced).
