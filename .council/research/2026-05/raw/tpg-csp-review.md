# TPG — Chase Sapphire Preferred review (template extraction)
_Source: https://thepointsguy.com/credit-cards/reviews/chase-sapphire-preferred-review/_
_Scraped 2026-05-21 via Firecrawl markdown_
_Scrape ID: 019e4c71-ccd7-764f-83bf-df63b948c87f_
_Authors: Madison Blancaflor (managing editor), Reviewed by Paige Balcom (compliance associate) + Matt Moffitt (contributing editor)_
_Published: 2025-12-16 · Modified: 2026-01-23 · 9 min read_

## Article scaffold (in document order)

1. **ADVERTISEMENT** label (TPG runs banners directly above the masthead)
2. **Breadcrumb**: `Reviews` link
3. **`# Card Name review: A top travel and dining card`** — H1 with a kicker subtitle baked in
4. **Multi-byline panel** — three named contributors with headshots, role titles, and 2–4 sentence bios. Specifically:
   - Madison Blancaflor — Managing editor
   - Paige Balcom — Compliance associate ("Reviewed By")
   - Matt Moffitt — Contributing editor
   - Line: "also contributed to this story"
5. **Publication date + read-time**: `Dec. 16, 2025 · 9 min read`
6. **Card link + Apply CTA** (repeated)
7. **TPG Editor's Rating** — `4.5 / 5`, with the card art beside it
8. **Apply CTA** (third time, secondary white button)
9. **Rewards-rate table** — clean 2-column markdown table:

   | 5x | Earn 5x on travel purchased through Chase Travel℠. |
   | 3x | Earn 3x on dining, select streaming services and online groceries. |
   | 2x | Earn 2x on all other travel purchases. |
   | 1x | Earn 1x on all other purchases. |

10. **Intro-offer summary box** — `75,000 bonus points`
11. **Annual fee box** — `$95`
12. **APR box** — `19.24% - 27.49% Variable`
13. **Recommended-credit box** — `670-850 Excellent/Good` with tooltip
14. **Jump-to-section** anchor list (sticky chrome — confirmed)
15. **Disclosure paragraph** — "The cards we feature here are from partners who compensate us…"
16. **`### Editor's Note`** — small callout flagging time-sensitive eligibility-rule changes
17. **`## Card overview`** — opens with the card name as a hyperlink, then sets up the use-case
18. **Card-rating bold callout**: `**Card rating*: ⭐⭐⭐⭐½**` with footnote pointing to methodology
19. **Newsletter signup block** mid-article (`Get updates on special offers…`)
20. **`## Pros and cons`** — 2-column markdown table:

    | **Pros** | **Cons** |
    | - Part of valuable Chase Ultimate Rewards ecosystem<br>- Bonus points on travel and dining<br>… | - Has an annual fee<br>- No lounge access |

21. **`## Welcome offer`** — H2 with the bonus details
22. **Daily-Newsletter promo block** — full-width inline ad for TPG's newsletter
23. **Numbered explanation paragraphs** with internal links to other TPG content (Chase 5/24 rule, valuations, etc.)
24. **`![Card Illustration]`** + **CardMatch tool callout** — interactive card-finder tool inserted mid-article. Two filter options: "Booking travel" / "Cash back and statement credits"
25. **`**Related: [link]**`** — inline cross-link to related TPG article (recurring pattern)
26. **`## Benefits`** — H2
27. **Photo with brand attribution** — `CHASE` (uppercase) below the image
28. **Bulleted list of travel protections** with deep links to TPG's coverage of each protection
29. **Bulleted list of shopping benefits**
30. **`## Earning points`**, **`## Redeeming points`**, **`## Transferring points`** — three sequential H2s for the three primary actions
31. **Photo with brand attribution** — `IMPRESSION MOXCHE BY SECRETS/HYATT`
32. **`## Which cards compete with the [Card]?`** — H2 with 3 H3 mini-comparisons. Each ends with a "Learn more in our full review" link.
33. **`## Bottom line`** — H2 with the closing recommendation
34. **Card art + Apply CTA** (fourth time)
35. **`Featured image by BLACKCAT/GETTY IMAGES`** — image credit
36. **Editorial disclaimer**: `Opinions expressed here are the author's alone, not those of any bank, credit card issuer, airline or hotel chain…`
37. **`## Reviews from cardholders`** — H2 with 4.7/5 cardholder rating, 19 reviews
38. **Rating-by-benefit breakdown** — 4 sub-ratings (Welcome bonus, Rewards, Additional perks, Customer service)
39. **Cardholder review cards** — individual quoted reviews with date + "Cardholder since YYYY"
40. **`## Comments` (Beta)** — comments section in beta mode
41. **`## Check out current card offers`** — H2 with 5 sponsored cards in a strip (Chase Sapphire Reserve, Capital One Venture Business, Hilton Surpass, Amex Business Platinum, Amex Gold). Each carries a small "Best for X" eyebrow tag.

## Multi-byline panel (TPG's signature move)

Three named contributors above the fold — author + compliance reviewer + contributing editor — each with a headshot, role line, and short bio.

> Madison Blancaflor — Managing editor
> Madison Blancaflor is the managing editor for TPG's content operations team. She focuses on helping TPG's broader editorial team bring news, features and advice to readers. She has nearly six years of experience covering the credit cards and travel industries.
>
> Reviewed By
> Paige Balcom — Compliance associate
> Compliance associate Paige Balcom joined TPG in 2022 and has spent her time working in the credit card industry reviewing content across sites such as CNET, CreditCards.com and Bankrate…
>
> Matt Moffitt — Contributing editor
> Matt Moffitt is a contributing editor and expert in getting the most out of credit cards and points (he carries at least 25 cards in his wallet at any given time). Originally from Sydney, Australia, he won the Green Card Lottery and lived in Austin, Texas for 10 years before relocating to Spain in 2025.
>
> also contributed to this story

The **"Reviewed By"** label and the **named compliance associate** are notable trust signals — TPG explicitly visibilises the editorial process (write → compliance review → publish). For dubaipoints.ae: once we have a fact-checker on the masthead, surfacing them inline with the byline (not just in the trust page) is a Tier-A trust upgrade.

## Above-the-fold density

A reader reaches the body prose only after scrolling past:

- Ad strip
- Breadcrumb
- H1
- Three-author panel with headshots + bios
- Date + read time
- Card art + Apply CTA
- Editor's rating
- Apply CTA again
- Rewards-rate table (4 rows)
- 4 fact boxes (intro offer / annual fee / APR / credit)
- Jump-to-section anchor list
- Disclosure paragraph
- "Editor's Note" callout

That is a **lot** of pre-prose. The compensating UX is the **Jump-to-section** sticky anchor list — a reader who knows what they want skips straight to it. This is the pattern the handoff named explicitly as a wanted feature for dubaipoints.ae.

## Sticky chrome — Jump to section

The markdown shows:
> Jump to section

…with no enumerated list captured in the markdown scrape (the list is rendered client-side from the article's H2 set). This is the **single highest-priority structural pattern** for dubaipoints.ae to copy: a reader on mobile lands on a long card review and needs an in-article skip mechanism. Engineering note: requires a small Preact/Astro island that reads the article's H2s and renders an anchor list with `position: sticky` chrome on the side (desktop) or a collapsible "Jump to" pill at the top (mobile).

## Internal-linking density

Comparable to UP — every benefit name, every Chase mechanic, every related concept is a deep link to another TPG article. Casual sampling: 30+ outbound links in the first half of the article. SEO + reader-funnel strategy fused.

## Mid-article newsletter and tool insertions

TPG breaks the prose flow twice in the first half:
1. **Daily Newsletter signup** — full-width inline ad after the welcome-offer section
2. **CardMatch tool** — interactive card-finder with two filter buttons inserted between the welcome-offer and benefits sections

This is monetisation at the cost of editorial flow. For dubaipoints.ae the Charter forbids this kind of in-flow ad insertion at launch; pre-affiliate, the slot can carry editorial content (e.g. "Salary-transfer tracker for this card's issuer") with the same visual treatment. Worth keeping the design pattern, just substituting the content.

## "Reviews from cardholders" + 4-sub-rating breakdown

After the editorial review ends, TPG runs:
- Aggregate cardholder rating (`4.7 / 19 reviews`)
- 4 sub-ratings (Welcome bonus / Rewards / Additional perks / Customer service)
- Distribution bars (`5 → 73.7%`, `4 → 21.1%`…)
- 4 individual reviews quoted verbatim with "Cardholder since YYYY" attribution

This is the **community-review layer** UP omits and HfP partially does via threaded comments. TPG approaches it as a structured survey output. For dubaipoints.ae: requires a newsletter base to survey; not in scope until we have ≥10,000 readers and a survey infrastructure decision.

## Image credits format

Every photo carries an uppercase credit beneath it. Three sampled:
- `THE POINTS GUY` (own photography)
- `CHASE` (issuer-supplied)
- `IMPRESSION MOXCHE BY SECRETS/HYATT` (hotel-supplied)
- `DOORDASH` (partner-supplied)
- `WESTEND61/GETTY IMAGES` (stock-licensed)
- Featured image: `BLACKCAT/GETTY IMAGES`

The uppercase treatment is purely typographic (a `.uppercase` class on the figcaption). Dubaipoints.ae's `Image courtesy of Emirates Media Centre` convention is more explicit per the Charter 2026-05-21 amendment. We are stricter; keep the differentiator.

## Editorial disclaimer

Single italic paragraph at the end:

> _Opinions expressed here are the author's alone, not those of any bank, credit card issuer, airline or hotel chain, and have not been reviewed, approved or otherwise endorsed by any of these entities._

Shorter and more direct than HfP's FCA disclosure (no regulatory body named). Reflects the US context — no central financial-advice regulator equivalent to FCA. UAE equivalent will need its own line referencing SCA / CBUAE / DFSA depending on the entity we register under.
