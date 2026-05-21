# Competitor Teardown — TPG / Upgraded Points / HfP / OMAAT

_Dossier opened 2026-05-21 by Head of Research, executed in parent session due to Firecrawl-MCP tool-inheritance gap in sub-agent runtime (see Status section). First-pass scope: ~1.5 of 4 sites scraped with primary-source rigor; remaining 2.5 flagged for next pass._

**Brief source:** `.council/handoff/2026-05-21-session-end.md` priority 2 (after image-binary swap).

**Deliverable purpose:** Inform every subsequent UX brief, the homepage rebuild, Phase 2a.2.5 (Hot Tips + Jump-to-Section sticky nav), and the card-review template propagation across the remaining 29 MDX files. The user has been explicit that prior Council work made editorial corrections without grounding in real competitor research, and this document is the foundation that should change that.

**Method:** Firecrawl `/scrape` in `markdown` and `branding` formats. Raw scrapes archived at `.council/research/2026-05/raw/` with source URL, scrape ID, and date sourced in each file's frontmatter. All branding observations are deterministic CSS-extraction; all editorial observations are quoted from the markdown scrape. No `[recall]` inference in this dossier.

---

## Status

| Site | Homepage scraped | Card review scraped | Branding scraped | Coverage |
|---|---|---|---|---|
| Head for Points (HfP) | ✅ markdown | ✅ Amex Platinum review | ❌ (not run) | **Full** — richest data |
| The Points Guy (TPG) | ✅ markdown | ❌ | ✅ branding | **Partial** — structure + design tokens |
| Upgraded Points (UP) | ✅ markdown | ❌ | ✅ branding | **Partial** — structure + design tokens |
| One Mile at a Time (OMAAT) | ❌ | ❌ | ❌ | **Not scraped** — next pass |

**Remaining work for the next session:** OMAAT homepage + one OMAAT card review; one TPG card review (e.g. Chase Sapphire Preferred); one UP card review (their flagship comparison piece). Estimated cost: 5 Firecrawl scrapes. Quota usage so far: 6 credits.

**Tool-inheritance gap noted:** The `head-of-research` sub-agent was dispatched with explicit Firecrawl access in its Charter mandate but the MCP tools were not present in its runtime tool inventory; the Read/Write/WebFetch/Glob/Grep subset that did load could not reach the four target sites because all four sit behind Cloudflare bot-protection that rejects WebFetch. The parent session has Firecrawl MCP tools available, so the scrapes were executed in the parent context. Worth a separate engineering ticket — agent runtimes should inherit MCP servers their Charter requires.

---

## Head for Points (HfP) — full teardown

HfP is the most directly relevant competitor for dubaipoints.ae. The Charter already names it as the voice/tone reference and the operating model is the closest analog: independent, points-and-miles-literate audience, regulated-financial-advice disclaimer (UK FCA equivalent of UAE SCA), single named founder voice (Rob Burgess at HfP, equivalent role at dubaipoints.ae yet to be filled).

### Homepage architecture

HfP's homepage is a **news-led river with product-anchored clusters embedded mid-stream**. Sequence observed at 2026-05-21:

1. **Three lead news posts** — large square thumbnail (325×215 webp) above a bold linked headline, two-sentence deck, byline + date + comment-count link.
2. **Subsection header: "The Platinum Card®"** — a four-card grid of related Amex Plat coverage. These are content clusters, not editorial categories.
3. **More news posts** — same lead-news pattern.
4. **Subsection header: "American Express® Preferred Rewards Gold Credit Card"** — another four-card cluster.
5. **More news posts.**
6. **Subsection header: "Which card is best for you?"** — four-card grid of comparison guides.

Key observation: there is no above-the-fold hero, no static editor's-pick block, no rotating carousel. The homepage **rewards return visits** because the lead news posts roll over daily. Product clusters are interleaved between news blocks rather than gated to a separate section.

### Card-review template

From the Amex Platinum review (live 2026-05-19, 109 comments):

1. **Date + byline + comment count + category + share button** — top of article, single horizontal row.
2. **Lede paragraph** — bolded one-sentence thesis (`The Platinum Card from American Express is probably the most divisive credit card on the UK market.`).
3. **Devil's-advocate paragraph** — one-sentence counter that names the cost objection and pivots to the value proposition.
4. **Special-offer callout** — entire paragraph bolded, ends with CTA link. No special visual box, just typography. Repeated at top AND end of article.
5. **Photo** — full-width, 500×333 webp, no caption.
6. **H2 sections phrased as questions** — "What are the benefits of American Express Platinum?", "What is the sign up bonus?", "What is the annual fee?", "Can I get the sign-up bonus if I have a British Airways American Express card?" Every H2 is a verbatim search query. SEO-led editorial.
7. **APR disclosure** — bold inline, no special box. Treated as factual, not decorative.
8. **H2: "Here are the American Express Platinum core benefits (for me)"** — signals personal POV.
9. **H3 benefit blocks** — each one followed by **`Value to me: £X`** with explicit reasoning. See "Value to me pattern" below — this is HfP's signature move.
10. **Conclusion** — does the math. `Looking at the maths above, I get £1,500 of 'value' per year from The Platinum Card, which is double the £650 annual fee.`
11. **Special offer callout repeated.**
12. **FCA disclaimer** — italic, single paragraph, regulatory.
13. **Category tag.**
14. **Comments section** — fully expanded WordPress threaded comments with Gravatar avatars. Author replies inline. **109 comments** on a single review is a substantial engagement signal.

### The "Value to me" pattern

This is the most copyable HfP innovation. After each H3 benefit description (1–3 short paragraphs), a line reads `Value to me: £X` with the author's reasoning. Sample:

> ### £200 of UK dining credit:
> **You will receive £200 cashback per year when eating at 160+ UK restaurants listed here.**
> This is split into £100 per half year. There is no small print – you don't need to book via any special link or quote any code. You simply register for the offer and then pay on The Platinum Card when you dine.
> **Value to me:** £200. We eat in some of the participating restaurants on a regular basis so this is essentially free money for me.

The conclusion sums them: `I get £1,500 of 'value' per year`. The reader can do the same math with their own inputs. **Editorial honesty signal** — the author explicitly discounts benefits he doesn't use (`I rarely use the Priority Pass benefit as I have British Airways status…`).

For dubaipoints.ae: this pattern adapts directly. Replace `Value to me: £X` with `Value to me: AED X` and the framework works for any UAE card. The math at the conclusion becomes the most-shareable element of the review.

### Affiliate / regulatory disclosure

End of article, italic, single paragraph:

> _Disclaimer: Head for Points is a journalistic website. Nothing here should be construed as financial advice, and it is your own responsibility to ensure that any product is right for your circumstances. Recommendations are based primarily on the ability to earn miles and points. The site discusses products offered by lenders but is not a lender itself. Robert Burgess, trading as Head for Points, is regulated and authorised by the Financial Conduct Authority to act as an independent credit broker._

Two operating principles encoded here, both transferable:
1. **Regulatory line** — UK FCA. UAE equivalent: SCA / CBUAE registration when affiliate is introduced.
2. **Editorial line** — `Recommendations are based primarily on the ability to earn miles and points.` This is the "no advertorial-driven recommendations" guarantee in compliance-grade prose. Charter §10 already commits to this; we have model wording.

### Voice and tone

First person, conversational, capitalises full words for emphasis (`SOLELY`, `VERY generous`), discloses personal circumstances to ground analysis (`we usually fly Business Class`, `as non car-owning Londoners`). Assumes literacy in points-and-miles culture — does not lecture, does not over-define. The closest existing dubaipoints.ae piece in tone is the Skywards Infinite review; this is the intended voice and we have a live anchor.

### Image rhythm

Three images in the Amex Platinum review body (a ~5000-word piece), placed at natural H2/H3 breakpoints. Format: 500×333 webp. **No captions, no inline credits.** This is looser than dubaipoints.ae's `Image courtesy of Emirates Media Centre` convention; HfP's interpretation of editorial-use rests on the same press-library logic but without the visible attribution line.

For dubaipoints.ae the visible attribution is non-negotiable per the 2026-05-21 Charter amendment, so we will look more rigorous than HfP on credits — a small differentiator worth keeping.

### Engagement layer

Comments are first-class. 109 on a single review, threaded, author replies inline. Comment count is visible at the top of the article AND in the homepage card. This is a flywheel that dubaipoints.ae does not currently have. Implementing comments is a separate engineering decision (Cloudflare Pages + Astro doesn't ship with comments by default — would need Disqus / utterances / a serverless write-API). Worth a Technical Lead memo.

---

## The Points Guy (TPG) — partial teardown

### Brand design tokens

From `/scrape branding` against `https://thepointsguy.com`:

- **Body font**: Poppins
- **Heading font**: Sora (also Lexend in fallback stack)
- **Primary colour**: `#146AFF` (electric blue) — used for primary CTA and accent
- **Secondary colour**: `#29836B` (deep green) — limited use
- **Text primary**: `#162433` (almost-black navy)
- **Background**: `#FFFFFF`
- **Buttons**: 9999px border-radius (full pill). Primary blue, secondary white-on-navy outline.
- **Card border-radius**: 16px
- **Design framework**: Tailwind (confirmed)
- **Personality**: professional / medium energy / travel enthusiasts

Note: the Firecrawl `fontSizes` extraction reports `h1: 56px, h2: 12px, body: 12px` for TPG — the h2/body extraction is clearly an artefact (likely captured a small metadata label, not the actual body type). Worth re-running with a different selector strategy if precise typography matters. The 56px h1 is plausible for the homepage hero.

### Homepage architecture (from markdown scrape)

TPG opens with a row of **quick-link tiles** — icon+text cells with 160×160 thumbnails, each linking to a tool or campaign:

- "Explore businesses worth the trip" (Capital One Business campaign — sponsored)
- "TSA wait times" (live tool)
- "Join us on Substack" (newsletter funnel)
- "Protect your points" (advocacy campaign)
- "Top credit cards" (card finder)
- "The Business Brief" (newsletter funnel)

This **pre-content navigation strip** is a strong UX pattern: it gives high-intent users (deal hunters, card seekers) a one-click path to the right destination before they see any editorial content. Dubaipoints.ae's "Salary-transfer tracker" and "Top card deals" links in the top nav are a basic version of this; TPG goes further with visual tiles.

### Quick-link strip — sponsored placement transparency

The first tile (Capital One Business — "Explore businesses worth the trip") is sponsored content placed in the same visual treatment as editorial tiles. **There is no visible "Sponsored" label in the markdown.** This is the kind of placement the Charter's "no advertorial-driven recommendations at launch" stance is built against; TPG is at a different point in its lifecycle and depends on these placements for revenue. Worth a Standards Editor note: when affiliate eventually enters dubaipoints.ae, sponsored content must visibly differ from editorial. TPG is the cautionary tale, not the model.

---

## Upgraded Points (UP) — partial teardown

### Brand design tokens

From `/scrape branding` against `https://upgradedpoints.com`:

- **Font**: Sofia Pro (single family, used for body and heading)
- **Primary colour**: `#003458` (deep navy) — primary brand
- **Accent colour**: `#25A773` (CTA green) — primary CTA buttons
- **Secondary border colour**: `#F7941E` (orange) — pill-button outline
- **Text primary**: `#083865` (deep navy, slightly lighter than primary)
- **Background**: `#FFFFFF`
- **Typography hierarchy**: H1 36px, H2 30px, body 16px — clean, scaled, **not the dramatic clamp of headlines you see at TPG**. Tighter, more publication-feeling.
- **Card border-radius**: 10px
- **Button border-radius**: 5px (primary), 9999px (secondary pill)
- **Secondary button shadow**: `rgba(247, 148, 30, 0.15) 0px 10px 20px 1px` — a subtle orange-tinted glow under the pill secondary button. Detail-oriented design.
- **Design framework**: Gatsby (custom CSS, not a major framework)

### Homepage architecture (H2 sequence)

In document order:

1. **Advertiser Disclosure** (collapsible/modal banner) — opens with the full disclosure, has a Close button
2. **Hero — "Our Readers Travel Like They Never Thought Possible..."** — three positioning bullets and three rotating photos (premium business class seat, woman with ocean view, infinity pool)
3. **"Upgrade Your Travel"** — guide categories
4. **"Latest News"** — news river
5. **"Latest Credit Card Guides"** — card-content cluster
6. **"Travel Hub"** — travel-content cluster
7. **"Explore Our Top Content"** — most-popular surfacing
8. **"As seen in"** — press-logo strip (social proof)
9. **"Meet the Team"** — bylines / faces (E-E-A-T signal)
10. **"How We Work"** — editorial process transparency
11. **"Editorial Disclosure"** — long-form policy
12. **"Disclaimer"** — regulatory

### Editorial-trust scaffolding

This is UP's biggest single differentiator vs. HfP. The homepage **literally ends with editorial policy**. Three of the last four sections are trust signals: As seen in / Meet the Team / How We Work / Editorial Disclosure / Disclaimer. By the time a reader scrolls to the footer, they've been shown the press strip, the byline faces, the methodology, and the legal language.

For dubaipoints.ae: the current homepage has a thinner trust layer. A "Meet the Team" + "How We Work" + "Editorial Disclosure" stack on the homepage would directly address Charter §10 (editorial standards) at the surface, not just in policy files. This is high-value, low-engineering work.

### Hero pattern

UP's hero ("Our Readers Travel Like They Never Thought Possible...") leads with **audience benefit, not site identity**. Three short positioning bullets follow:

> - Simplifying travel and credit cards. Our expertise makes affordable, unforgettable travel experiences a reality.
> - We're travelers first. Our team has decades of travel and points expertise.
> - We've got you covered. Latest updates across major cards, airlines, hotels, deals and more.

Three photos rotate behind the text. The format is **claim → proof → coverage**, in that order. Dubaipoints.ae's current homepage opens with a directory-style structure; the UP pattern is more conversion-led and might suit a "what is this site?" first-visit reader better.

### Advertiser disclosure modality

UP shows the disclosure as a dismissable banner above the fold ("Advertiser Disclosure" + the full text + a Close button). It is **explicit and prominent** — a reader cannot miss it on first visit. For dubaipoints.ae the Charter currently bans affiliate-driven recommendations; if/when that changes, the UP modal is the model for compliance.

---

## One Mile at a Time (OMAAT) — not scraped

OMAAT was named in the handoff as the homepage style reference (`onemileatatime.com`). The site was not scraped in this pass due to quota discipline — TPG, UP, and HfP gave us higher-value first-pass coverage for the time invested. Next pass should:

- `firecrawl_scrape` of `https://onemileatatime.com` (markdown + branding)
- `firecrawl_scrape` of one OMAAT card review (Chase Sapphire Preferred or Amex Platinum US)

The user has previously asked Head of UX to "study analyse" OMAAT and only got a partial response. Closing that gap is the explicit next deliverable.

---

## Synthesis — patterns to adopt, ranked by impact

The following patterns are recommended for adoption, ranked by likely impact on dubaipoints.ae's editorial quality and reader value. Each is one-line justified; concrete implementation belongs in a follow-on UX brief, not this dossier.

### Tier A — adopt now, low engineering cost

1. **"Value to me: AED X" pattern in every card review.** HfP's signature move; turns the benefits list into transparent math; reader can re-do the calculation with their own inputs. Easy MDX convention, no schema change.
2. **H2-as-question** in card reviews — `What is the annual fee?`, `Can I get the sign-up bonus if I already hold X?`. Every H2 doubles as an SEO query target and a scannable signpost. Low effort, high mobile-readability win.
3. **Special-offer callout repeated at top and end** of time-limited reviews. Bolded paragraph, no special box. We have the typography (`.dp-prose` is already strong); this is a copy-and-paragraph-style convention, not a new component.
4. **APR / fee-disclosure as bold-inline**, not as a sidebar widget. HfP and dubaipoints.ae both already treat fees as factual content; reinforcing this matches reader expectation.
5. **Visible image credit line under every press-library image** (already Charter §10 mandated). We are stricter than HfP on this. Keep the differentiator visible.

### Tier B — adopt soon, moderate engineering cost

6. **Quick-link tile strip on the homepage** (TPG model) — icon+text cells linking to Salary-transfer tracker, Top card deals, Newsletter, etc. Visually distinct from the editorial directory below. New homepage component.
7. **"Meet the Team" + "How We Work" + "Editorial Disclosure" stack on the homepage** (UP model) — closes the trust layer at the surface, not just in policy files. Three new homepage sections, all static content.
8. **Press-logo strip ("As seen in") when we have placements to credit.** Dormant until we have placements. Worth pre-building the slot.
9. **Subject-clustered content shelves on the homepage** (HfP model) — e.g. "The Skywards Infinite", "Salary-transfer offers this week" — four-card grids interleaved between news. Replaces the current flat directory grid.
10. **Threaded comments under reviews** (HfP's flywheel) — engineering decision required; Astro+Cloudflare Pages doesn't ship comments by default. Technical Lead memo needed for build/buy.

### Tier C — adopt when affiliate enters

11. **Advertiser-disclosure modal banner** (UP model) — explicit, dismissable, persists across pages until first dismissed. Required when affiliate compensation enters; cosmetic until then.
12. **Card-finder tool** ("Top credit cards — find the next best card based on your goals") — TPG's anchored funnel. Requires significant data scaffolding (we have `_features` discriminated union; would need filter UI). Major project.

### Tier D — avoid

13. **Quick-link strip with sponsored placements visually identical to editorial** (TPG's first tile — Capital One Business — has no visible Sponsored label). Charter forbids this; TPG is the cautionary tale, not the model.

---

## Raw archive

- `.council/research/2026-05/raw/tpg-homepage.md` — TPG homepage, markdown, 64 KB
- `.council/research/2026-05/raw/tpg-branding.json` — TPG branding tokens
- `.council/research/2026-05/raw/upgradedpoints-homepage.json` — UP homepage, markdown, 50 KB
- `.council/research/2026-05/raw/upgradedpoints-branding.json` — UP branding tokens
- `.council/research/2026-05/raw/hfp-homepage.md` — HfP homepage notes
- `.council/research/2026-05/raw/hfp-amex-platinum-review.md` — HfP Amex Platinum review with annotations

All files traceable to Firecrawl scrape ID + source URL + date sourced.

---

## What this dossier does not yet contain

- OMAAT homepage and card-review patterns (highest gap — handoff named OMAAT as the homepage reference).
- TPG card-review template (we have homepage structure and branding; review template is the unscraped half).
- UP card-review template (same — homepage and tokens captured, review template open).
- Footer architecture across all four sites (we touched on UP's editorial-disclosure footer pattern; full comparison pending).
- Sticky chrome behaviour (Jump-to-Section nav, reading-progress bar, share buttons) — requires JS-rendered observation, which Firecrawl can do with `waitFor` and screenshot formats. Not run in this pass.

**Recommendation for next session:** spend 5–6 more Firecrawl credits to close OMAAT and the three missing card reviews, then this becomes a complete-enough teardown to drive the Phase 2a.2.5 brief and the homepage rebuild brief without further research-side blockers.

End.
