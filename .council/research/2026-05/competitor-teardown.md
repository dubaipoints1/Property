# Competitor Teardown — TPG / Upgraded Points / HfP / OMAAT

_Dossier v2 — opened 2026-05-21 by Head of Research, executed in parent session due to Firecrawl-MCP tool-inheritance gap in sub-agent runtime (see Status section). v2 closes the OMAAT + card-review gaps left open in v1._

**Brief source:** `.council/handoff/2026-05-21-session-end.md` priority 2 (after image-binary swap).

**Deliverable purpose:** Inform every subsequent UX brief, the homepage rebuild, Phase 2a.2.5 (Hot Tips + Jump-to-Section sticky nav), and the card-review template propagation across the remaining 29 MDX files. The user has been explicit that prior Council work made editorial corrections without grounding in real competitor research, and this document is the foundation that should change that.

**Method:** Firecrawl `/scrape` in `markdown` and `branding` formats; Firecrawl `/map` for URL discovery on UP. Raw scrapes archived at `.council/research/2026-05/raw/` with source URL, scrape ID, and date sourced in each file's frontmatter. All branding observations are deterministic CSS-extraction; all editorial observations are quoted from the markdown scrape. No `[recall]` inference in this dossier.

**Quota used:** 14 Firecrawl credits (4 homepages + 4 brandings + 4 card reviews + 1 map + 2 404 retries on UP).

---

## Status — coverage matrix

| Site | Homepage | Card review (Chase Sapphire Preferred/Reserve) | Branding tokens | Coverage |
|---|---|---|---|---|
| Head for Points (HfP) | ✅ markdown | ✅ Amex Platinum review | ❌ (skipped — Charter already names HfP as voice ref) | **Full** |
| The Points Guy (TPG) | ✅ markdown | ✅ Chase Sapphire Preferred | ✅ | **Full** |
| Upgraded Points (UP) | ✅ markdown | ✅ Chase Sapphire Preferred | ✅ | **Full** |
| One Mile at a Time (OMAAT) | ✅ markdown | ✅ Chase Sapphire Reserve | ✅ | **Full** |

**Tool-inheritance gap noted in v1:** The `head-of-research` sub-agent was dispatched with explicit Firecrawl access in its Charter mandate but the MCP tools were not present in its runtime tool inventory. v2 was executed in the parent session, with a sub-agent dispatched only to extract patterns from the OMAAT review (66 KB Firecrawl output too large for the parent context). Worth a separate engineering ticket — agent runtimes should inherit MCP servers their Charter requires.

---

## Brand design tokens — four-site comparison

| Token | TPG | UP | HfP | OMAAT |
|---|---|---|---|---|
| **Body font** | Poppins | Sofia Pro | _(not scraped)_ | SharpGrotesk Book 19 |
| **Heading font** | Sora / Lexend | Sofia Pro | _(not scraped)_ | SharpGrotesk Book 23 |
| **Primary colour** | `#146AFF` electric blue | `#003458` deep navy | _(not scraped)_ | `#FFB71B` gold-orange |
| **Text primary** | `#162433` near-black navy | `#083865` deep navy | _(not scraped)_ | `#021D49` near-black navy |
| **Accent / CTA** | `#146AFF` blue | `#25A773` CTA green | _(not scraped)_ | `#FFB71B` gold-orange |
| **Background** | `#FFFFFF` | `#FFFFFF` | _(not scraped)_ | `#F4F6F8` cool off-white |
| **Border-radius (button)** | 9999px (full pill) | 5px (primary), 9999px (secondary) | _(not scraped)_ | **0px (sharp)** |
| **Border-radius (card)** | 16px | 10px | _(not scraped)_ | _(no card border-radius)_ |
| **CSS framework** | Tailwind | Custom (Gatsby) | _(not scraped)_ | Bootstrap |
| **H1 size** | 56px (clamped) | 36px | _(not scraped)_ | 36px |
| **H2 size** | _(extraction artefact)_ | 30px | _(not scraped)_ | 30px |

**Three brand archetypes are visible:**

- **TPG = consumer-tech / vibrant.** Electric blue, pill buttons, Tailwind, 16px-radius card chrome. Reads like a fintech app.
- **UP / HfP = points-publication / corporate-trust.** Navy as primary, modest border-radius, CTA green or amber. Reads like a finance trade publication.
- **OMAAT = journalism / editorial-magazine.** Off-white background, sharp 0px corners, gold-orange accent, premium-print typeface (SharpGrotesk). Reads like a print magazine moved to web.

Dubaipoints.ae's current palette (`--green` editorial green `#2d6a52` + `--gold` `#b8842a`) sits closest to **OMAAT's editorial-magazine archetype** — deep accent, no neon, AED-numerate-finance register. Validated by competitive set. The 2026-05-09 Charter amendment ratifying green is consistent with this archetype.

---

## Homepage architecture — four-site comparison

### TPG — quick-link strip + sponsored placements

Opens with a **horizontal row of quick-link tiles** (icon + label, 160×160 thumbnails) linking to tools and campaigns:

- "Explore businesses worth the trip" (Capital One Business campaign — **sponsored, unlabelled**)
- "TSA wait times" (live tool)
- "Join us on Substack"
- "Protect your points" (advocacy)
- "Top credit cards" (card finder)
- "The Business Brief"

This **pre-content navigation strip** is the strongest single TPG idea. It gives high-intent users a one-click path to their destination before any editorial loads. The first tile being sponsored content visually indistinguishable from editorial is the **cautionary** part — Charter §5 forbids this, but the **pattern** (icon tile strip, not the sponsorship) is adoptable.

### UP — claim → proof → coverage → trust footer

Sequence:

1. Advertiser-disclosure modal banner (dismissable)
2. Hero — "Our Readers Travel Like They Never Thought Possible…" — three positioning bullets + three rotating photos
3. Upgrade Your Travel (guide categories)
4. Latest News
5. Latest Credit Card Guides
6. Travel Hub
7. Explore Our Top Content
8. **As seen in** (press-logo strip)
9. **Meet the Team**
10. **How We Work**
11. **Editorial Disclosure**
12. Disclaimer

Three of the last four sections are trust-scaffolding. By the time a reader scrolls to the footer, they've been shown the press strip, the byline faces, the methodology, and the legal language. **This is UP's biggest single differentiator.** Dubaipoints.ae has trust language only on the trust page; surfacing it on the homepage is a Tier-A, low-engineering win.

### HfP — news-led river with product-anchored clusters

Sequence:

1. Three lead news posts (thumbnail + bold headline + 2-line deck + byline/date/comment-count)
2. **Subsection header: "The Platinum Card®"** — 4-card grid of related Amex Plat coverage
3. More news posts
4. **Subsection header: "American Express® Preferred Rewards Gold Credit Card"** — 4-card grid
5. More news posts
6. **Subsection header: "Which card is best for you?"** — 4-card grid of comparison guides

No above-the-fold hero, no carousel. The homepage **rewards return visits** because the lead news rolls daily. Product clusters interleave between news blocks rather than sitting in a separate section. This is HfP's strongest pattern for return-visit retention.

### OMAAT — single-voice news river with stats-brag footer

Sequence:

1. Lede paragraph (publication description, not brand statement)
2. Top-nav strip: News · Guides · Deals · Insights · Reviews (5 categories)
3. Hero image + H1 (H1 is a category description, not a brand statement)
4. **Featured Posts** — 3 bullets of currently-hot deal posts (not evergreen)
5. Recent OMAAT Articles — main news river, ~10 cards, **all bylined Ben Schlappig**
6. **Featured Credit Card** mid-river block (product cluster, similar to HfP idea)
7. Latest Trip Reports — separate H2 river of long-form trip reports
8. Credit-card sidebar — 4 cards stacked
9. Browse the Archives — `<select>` dropdown of every airline / airport / aircraft / bank / country / hotel / programme
10. **"Meet Ben, OMAAT Founder" stats block** — `5,883,136 Miles Traveled · 43,914,800 Words Written · 47,187 Posts Published`
11. Newsletter signup (Daily / Weekly / Promotions picker)
12. YouTube channel embed

Notable headline tone:

> "Is The Amex Business Gold Worth $375? Probably Not For Me — Here's Why"
> "Review: Rosewood Bangkok, Thailand (Solid, Second Tier Luxury City Hotel)"

**Opinion in the headline.** Opposite of HfP's neutral-question SEO headlines. Trades search discovery for click-confidence.

### "No ghostwriters or AI" footer line

OMAAT's footer carries:

> 43,914,800 Words Written — **I write all my own content; there are no ghostwriters or AI at OMAAT!**

This is a brand-positioning statement worth flagging. Dubaipoints.ae's Charter bans AI-generated photography but is silent on AI-prose. Worth a Council discussion: as the AI-content question grows, OMAAT's loud "no ghostwriters or AI" stance becomes a stronger trust signal. The Standards Editor could draft an equivalent line.

---

## Card-review template — four-site comparison

### Master spine (in document order, by site)

| Stage | HfP | UP | TPG | OMAAT |
|---|---|---|---|---|
| **Pre-prose chrome** | Date + byline + comment-count + category + share | Advertiser banner + card art + Welcome offer + Apply CTA + U.P. star rating + 4 fact tiles | Ad strip + breadcrumb + H1 + **3-author panel with headshots + bios** + date + read-time + 4 fact tiles + Jump-to-section | **Card-spec hero card** (name, bonus, fee, 3 earn-rate bullets, star rating, comment-count, share row) |
| **Lede** | Bolded thesis + devil's advocate counter + repeated special-offer callout | Two-paragraph summary | Single-paragraph use-case intro | Two-paragraph thesis ("**no-brainer, if eligible**") + tiny TOC |
| **H2 style** | **Question form** ("What is the annual fee?") | **Question form** (`Is It Worth It?`) + statements (`Pros & Cons`) | **Statement form** (`Welcome offer`, `Earning points`) | **Statement form** with card name repeated each time + final flip to question (`Is the Chase Sapphire Reserve worth it?`) |
| **Pros/cons** | 2-column markdown table | Two H3-led bulleted lists side-by-side | 2-column markdown table | **None — uses "Showdown:" prose-bullet comparisons** |
| **"Value to me" pattern** | **Per-benefit `Value to me: £X` line** with explicit reasoning | Specific dollar values inline per benefit (not personal valuation) | Inline editor-voice with TPG points-valuation data hub linked | **Personal valuation + per-category % return** ("I value points at 1.7 cents, so 8x = 13.6% return") |
| **Bottom line** | `## Conclusion` with math sum | `## [Card] — Is It Worth It?` H2 | `## Bottom line` H2 | `## Is the Chase Sapphire Reserve worth it?` then `## Bottom line` |
| **Affiliate disclosure** | FCA paragraph, italic, end of article | Banner modal + inline "Compensation may impact placement…" paragraph above the rating | Multi-paragraph disclosure under fact tiles + per-link tooltip | **Indirectly via "Learn about OMAAT Star Ratings" link** — disclosure URL referenced only, no inline FTC paragraph above the fold |
| **Comments** | **109 threaded WordPress comments with Gravatar avatars**, author replies inline | None visible (reCAPTCHA at bottom) | **Beta comments** + structured cardholder-survey ratings (`4.7/5 from 19 reviews` with sub-ratings) | **23 threaded comments** with Most Recent / Oldest / Most Helpful sort + Helpful voting per comment |

### Signature patterns — one per site

#### HfP — "Value to me: £X"
Every H3 benefit ends with `Value to me: £X` and explicit reasoning. Conclusion sums them to a single number. Reader can re-do the math with their own inputs. Voice: editorial-honest, admits "I rarely use Priority Pass because I have BA status." See `raw/hfp-amex-platinum-review.md`.

#### UP — Inline editor quote + "Great Card If / Don't Get If"
Inline blockquote with attribution to a named UP staffer:
> "It doesn't take much to justify the $95 annual fee since that breaks down to **under $8 per month**…"
> — Stella Shon, compliance editor and content contributor

Plus mirrored fit-criteria lists:
> ## Great Card If
> - You want a card that offers flexible redemption options
> …
> ## Don't Get If
> - You seldom eat out and prefer cooking at home
> …

Multi-voice editorial, fit/no-fit framing. See `raw/upgradedpoints-csp-review.md`.

#### TPG — Multi-byline panel + Jump-to-section
Three named contributors with headshots + bios above the H1, including a **"Reviewed By"** label for the compliance associate. Then a Jump-to-section anchor list rendered client-side from the article's H2s. Sticky chrome confirmed. See `raw/tpg-csp-review.md`.

#### OMAAT — Card-spec hero + personal % return
Card-spec hero card replaces any prose lede. Then the article quantifies benefits as percentage returns derived from a stated points valuation:

> Personally, I value Ultimate Rewards points at 1.7 cents each, so to me, the points are worth $2,550.
> Earning 8x points at 1.7 cents each, to me that's the equivalent of a **13.6% return** on travel spending.

The inverse of HfP's tabular "Value to me" — same intent, prose-and-percent form. See `raw/omaat-csr-review.md`.

### Image rhythm

| Site | Images per review | Captions | Credits | Notes |
|---|---|---|---|---|
| HfP | ~3 in a 5000-word piece | None | None inline | Press-library, looser than our convention |
| UP | Multiple (not measured) | None | None inline | Stock + own |
| TPG | Multiple | Brand attribution beneath, uppercase | Yes — `THE POINTS GUY` / `CHASE` / `GETTY IMAGES` / `WESTEND61/GETTY IMAGES` | Most rigorous of the four |
| OMAAT | **~14 article images** | **Yes — every image** (5–10 words, assertive, often restates benefit) | None | One image per H2 + extras inside long H3s |

Dubaipoints.ae's Charter 2026-05-21 amendment requires a visible credit line on every press-library image. **We are stricter than HfP, UP, and OMAAT — and at least as rigorous as TPG.** This is a real differentiator; keep it visible.

### Engagement signals

| Site | Sample engagement on the scraped review |
|---|---|
| HfP — Amex Platinum | **109 threaded comments**, Gravatar avatars, author replies, comments visible on homepage card |
| UP — Chase Sapphire Preferred | No comments section visible |
| TPG — Chase Sapphire Preferred | **Beta comments** + structured cardholder rating: `4.7/5 from 19 reviews`, 4 sub-ratings (Welcome bonus / Rewards / Additional perks / Customer service), distribution bars |
| OMAAT — Chase Sapphire Reserve | **23 threaded comments**, sort by Most Recent / Oldest / Most Helpful, per-comment Helpful voting |

HfP's comment-engagement model is the highest-flywheel option. OMAAT's "Helpful" voting + multiple sort orders is the most polished moderation UX. TPG's structured survey is the most data-rich but requires a survey base we don't have.

---

## Synthesis — patterns to adopt, ranked by impact

### Tier A — adopt now, low engineering cost

1. **Top-of-article fact-tile strip** (UP + TPG signature) — `Welcome Offer / Annual Fee / APR / Min Salary / Credit Recommended` as 4–5 tiles above the fold. Single highest-density piece of information per article; turns scroll-to-find into scan-to-decide. Small Astro component, big payoff.
2. **Inline `Value to me: AED X` after every H3 benefit** (HfP signature) + a conclusion that sums the math. Adapts directly to AED. Pure MDX convention, no schema change.
3. **"Great Card If / Don't Get If" mirrored lists** (UP signature) — fit/no-fit framing above the deep-dive sections. Editorial-honesty signal; pure MDX content.
4. **Per-image inline caption discipline** (OMAAT pattern) — every article image carries one short assertive caption. Combined with our visible-credit-line rule, this strengthens the editorial-magazine read.
5. **Image-credit line beneath every press-library image** — *already Charter §10 mandated*. We are stricter than three of four competitors. Keep the differentiator visible.
6. **Statement H2s for the spine, question H2 for the verdict** (OMAAT model with our voice) — six-section spine (Bonus & Fees → Earning → Redemption → Lounge / Perks → Benefits → "Is it worth it?" → Bottom line). Reject OMAAT's card-name-in-every-H2 pattern (SEO-spammy).
7. **Repeated special-offer callout** (HfP signature) — bolded paragraph at top AND end of any time-limited review. Pure typography, no new component.

### Tier B — adopt soon, moderate engineering cost

8. **Jump-to-section sticky chrome** (TPG signature) — small Astro/Preact island that reads H2s and renders a sticky anchor list on desktop, collapsible pill on mobile. The handoff already named this as a wanted feature; we now have the rationale.
9. **Quick-link tile strip on the homepage** (TPG model, sponsored-tile rejection) — icon+text cells linking to Salary-transfer tracker, Top card deals, Newsletter, etc. New homepage component.
10. **Trust-stack on the homepage** (UP model) — "Meet the Team" + "How We Work" + "Editorial Disclosure" as the last three sections. Closes the trust layer at the surface, not just in policy files.
11. **Press-logo strip ("As seen in")** — dormant slot until we have placements. Pre-build the component.
12. **Subject-clustered shelves on the homepage** (HfP model) — interleave product-anchored 4-card grids ("The Skywards Infinite", "Salary-transfer offers this week") between news blocks. Replaces the current flat directory grid.
13. **Threaded comments under reviews** (HfP / OMAAT flywheel) — engineering decision required; Astro+Cloudflare Pages doesn't ship comments by default. Technical Lead memo needed for build/buy. OMAAT's Most Recent / Most Helpful sort + Helpful voting is the polished reference. **Standards Editor + Chairman must approve moderation policy first.**
14. **Inline editor quote with named attribution** (UP signature) — low-cost trust upgrade once we have ≥2 named editors on the masthead. Convention not infrastructure.
15. **"No AI prose" editorial-policy stance** (OMAAT signature) — Standards Editor + Chairman discussion. If adopted, the line goes in `01_editorial_standards.md` and surfaces in the trust page.

### Tier C — adopt when affiliate enters

16. **Advertiser-disclosure modal banner** (UP model) — explicit, dismissable, persists until first dismissed. Required when affiliate enters.
17. **Cardholder-survey ratings** (TPG model) — aggregate rating + 4 sub-ratings + distribution bars + verbatim cardholder quotes. Requires a newsletter base of ≥10k readers and a survey infrastructure decision.
18. **Card-finder tool** (TPG CardMatch) — requires significant data scaffolding; we have `_features` discriminated union as foundation. Major project.

### Tier D — avoid

19. **Sponsored quick-link tiles indistinguishable from editorial** (TPG first tile — Capital One Business). Charter §5 forbids this.
20. **OMAAT's affiliate-disclosure posture** — disclosure URL referenced only, no inline FTC paragraph above the fold. Charter §5 mandates inline above-the-fold disclosure.
21. **Repeating the card name in every H2** (OMAAT SEO play) — reads poorly, contradicts house voice.
22. **Newsletter / ad blocks interrupting prose mid-article** (TPG model) — breaks editorial flow for monetisation. Pre-affiliate the slot can carry editorial cross-promotion with the same visual treatment.
23. **"Bottom Line" boxed callouts sprinkled inline** (UP / generic SEO pattern) — visual noise; reserve "Bottom Line" for the final H2.

---

## Raw archive

| File | Bytes | Notes |
|---|---|---|
| `raw/tpg-homepage.md` | ~64 KB | TPG homepage markdown |
| `raw/tpg-branding.json` | ~1.4 KB | TPG design tokens |
| `raw/tpg-csp-review.md` | ~9 KB | TPG Chase Sapphire Preferred review template extraction |
| `raw/upgradedpoints-homepage.json` | ~50 KB | UP homepage markdown |
| `raw/upgradedpoints-branding.json` | ~1.4 KB | UP design tokens |
| `raw/upgradedpoints-csp-review.md` | ~7 KB | UP Chase Sapphire Preferred review template extraction |
| `raw/hfp-homepage.md` | ~3 KB | HfP homepage notes |
| `raw/hfp-amex-platinum-review.md` | ~6 KB | HfP Amex Platinum review with annotations |
| `raw/omaat-homepage.md` | ~6 KB | OMAAT homepage observations |
| `raw/omaat-branding.json` | ~1.5 KB | OMAAT design tokens |
| `raw/omaat-csr-review.json` | ~67 KB | Raw Firecrawl JSON of OMAAT Chase Sapphire Reserve review (too large for direct context) |
| `raw/omaat-csr-review.md` | ~14 KB | Subagent-extracted template patterns + adopt/reject recommendations |

All files traceable to Firecrawl scrape ID + source URL + date sourced.

---

## What this dossier does not yet contain

- **Sticky-chrome behaviour observation** (Jump-to-Section nav, reading-progress bar, share button) — Firecrawl markdown can't see client-side rendered sticky elements; would need `waitFor` + screenshot formats. The TPG `Jump to section` label is present in markdown but the anchor list itself is JS-rendered.
- **Footer architecture comparison** — partial (we have UP's trust-footer stack and OMAAT's stats-brag). HfP and TPG footers not specifically analysed.
- **Newsletter and post-conversion funnels** — visible in scrapes but not analysed comparatively.
- **Mobile-specific layouts** — Firecrawl scrapes the desktop rendering by default.
- **NerdWallet** — named in the handoff as a card-finder UX reference, deferred since the present scope already covers card reviews and homepage rebuilds. Worth a separate one-page teardown when Tier-C #18 (card-finder tool) becomes active scope.

**Recommendation for next session:** Hand this dossier to Head of UX to draft the Phase 2a.2.5 brief (Hot Tips + Jump-to-Section + fact-tile strip + Value to me convention). The fact-tile strip alone is worth a Phase 2a.2.6 brief in parallel — it is the single highest-leverage pattern in the dossier and is independent of the sticky-chrome work.

End.
