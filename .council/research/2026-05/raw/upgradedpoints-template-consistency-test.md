# UP template consistency — empirical test across 4 card archetypes
_Source: 4 UP card reviews scraped 2026-05-22 (Amex Platinum + Amex Gold + Capital One Venture X + Citi Strata Premier)._
_Combined with previously scraped UP CSP + CSR = 6 UP card reviews total._

## Hypothesis test

The competitor teardown v2 dossier inferred "UP runs one identical template across the credit-card-reviews collection." Tested empirically by sampling 6 UP reviews across 6 different card archetypes:

| Card | Tier | Annual fee | U.P. Rating | Read time | Editor quote? |
|---|---|---|---|---|---|
| Amex Platinum | premium luxury | $895 | 4.59 | 14 min | ✅ Katie Seemann (senior contributor) |
| Amex Gold | mid-tier dining | $325 | 4.59 | 9 min | ✅ Nick Ellis (editor) |
| Chase Sapphire Reserve | premium travel | $795 | 4.59 | 10 min | ✅ Lori Zaino (senior contributor) |
| Capital One Venture X | premium travel alt | $395 | 4.55 | 5 min | ✅ Katie Seemann |
| Chase Sapphire Preferred | mid-tier travel | $95 | 4.59 | 8 min | ✅ Stella Shon (compliance editor) |
| Citi Strata Premier | mid-tier travel alt | $95 | 4.00 | 4 min | ❌ no editor quote |

## Confirmed empirically

**Scaffold is identical** across all 6 reviews:

1. Advertiser-disclosure banner (modal)
2. Card art + eyebrow ("BEST LOUNGE CARD" / "NEW OFFER" / "BEST FOR DINING" / etc.)
3. Welcome Offer summary box
4. Apply Now CTA
5. U.P. Rating star block (4-tile fact strip below: Welcome / Annual Fee / APR / Credit)
6. `## Card Name` H2 with single-sentence value prop
7. `### Summary` (2 paragraphs)
8. `### Card Details` → Card Snapshot, Welcome Bonus & Info (bulleted), Card Categories (taxonomy chips), Rewards Center, Customer Service Number, Login Link
9. `### Pros & Cons` (parallel bulleted lists)
10. `### More Reads / Related Articles` (mid-flow, 6-12 tiles)
11. "Upgraded Points: Expertise You Can Trust" trust block — 6 chips, **byte-identical wording across all 6 reviews**
12. `## Great Card If` H2 (3–5 bullets, fit criteria)
13. `## Don't Get If` H2 (2–4 bullets, no-fit criteria)
14. `## [Card Name]: Is It Worth It?` (question-form H2)
15. **Optional**: Inline editor blockquote with named-staffer attribution
16. `## [Card Name] Top Benefits` H2 + H3 sub-benefits per perk
17. **Optional**: HotTip / Bottom Line callouts inline (Hot Tip box-style; Bottom Line uses bolded-eyebrow chip)
18. `## Best Ways To Earn and Redeem` H2
19. `## Alternative Cards` H2 with H3 sub-cards
20. Comparison-link tiles block ("Card X vs Card Y") — count varies by card popularity (Amex Plat has 9; Citi Strata Premier has 8)
21. `## UP's Card Review Methodology` — **byte-identical across all 6**
22. Top Credit Card Content sidebar — **identical across all 6**
23. Related Posts (4 thumbnails)
24. reCAPTCHA

## Variable elements (vary by card, but always at the same position)

- **Eyebrow text** in the hero: each card gets a 1-3 word "BEST X" tagline ("BEST LOUNGE CARD", "BEST FOR DINING", or just "NEW OFFER")
- **Pros / Cons count**: scales with card complexity (Amex Plat = 8 pros; Citi Strata Premier = 5 pros)
- **H3 sub-benefit count under "Top Benefits"**: 12 for CSR, ~6 for CSP, ~10 for Amex Plat, ~4 for Citi Strata Premier
- **Editor quote**: present on 5/6 cards; absent on the smaller-flagship Citi Strata Premier
- **Hot Tip count**: 0–2 per article
- **Comparison-link tile count**: scales with card popularity

## Implications for dubaipoints.ae

1. **Template standardisation is achievable and proven at scale** — UP's 6 reviews are scaffold-identical despite covering 4 different card archetypes (premium luxury / premium travel / mid-tier travel / mid-tier dining). The 23-step scaffold I documented in the dossier is what they actually ship across every card.

2. **Some elements should be optional/conditional** in our template — not every card needs an editor quote (especially smaller cards). The Phase 2a.2.1b propagation should treat editor quotes, HotTips, and comparison-link density as **scalable to the card's complexity / popularity** rather than strictly required.

3. **The "Expertise You Can Trust" trust block is byte-identical site-wide** — this is the equivalent of a layout-rendered trust component. We could ship our own equivalent as a `<TrustChips>` layout component rather than re-typing it per card.

4. **Methodology footer is also byte-identical** — same opportunity for a `<RatingMethodology>` shared component.

5. **U.P. Ratings cluster around 4.55–4.59 for flagship cards, 4.0 for smaller cards** — UP doesn't fine-grain the rating. Our 5-dim score system (welcomeValue / earnRate / perks / feeValue / access) is meaningfully more granular. Keep ours; don't degrade to a single number.

6. **Eyebrow taglines ("BEST X")** — Charter §10 forbids superlative claims without basis. We can adapt this pattern to "EDITORS' PICK" / "STRONG" / "SOLID" / "NICHE" / "SKIP" — which is exactly what our existing `tier` frontmatter field is. Surface it as a visible badge in the chrome.
