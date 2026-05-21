# OMAAT — homepage observations
_Source: https://onemileatatime.com — scraped 2026-05-21 via Firecrawl markdown_
_Scrape ID: 019e4c71-f88d-711d-9278-9858ec1e46e7_
_Cache: hit (returned cached 2026-05-21T21:29:52Z)_

## Top-of-page structure (in order)

1. **Lede paragraph** (literal text):
   > The Latest Airline News and Travel Offers
   > One Mile at a Time brings you breaking travel news, reviews and strategies to maximize elite travel status.
   > Earn more miles, points and rewards with today's top credit card offers.

2. **Top-nav category strip**: `News · Guides · Deals · Insights · Reviews`. Five categories — no "Cards" as a top-level item; cards live under Reviews. Editorial-first IA.

3. **Hero image** with overlay graphic — small (60px wide thumbnail in the scrape, presumably full-width on the rendered page)

4. **`# H1: The Latest Airline News and Travel Offers`** — the H1 is a category description, not a brand statement (compare UP's "Our Readers Travel Like They Never Thought Possible…")

5. **Featured Posts strip** — 3 bullets:
   > - Huge: Best-Ever Chase Sapphire Reserve Card 150K Bonus Points Offer
   > - Big Alaska Atmos Rewards Summit Card Offer: 100K Points, 25K Award, 50% Off
   > - Citi AAdvantage Globe Card Best-Ever 90K Miles Welcome Bonus Returns

   All three are time-sensitive deal posts. Featured = currently-hot, not evergreen.

6. **"Jump to the latest" repeat-nav** — Same five categories again as anchor links

7. **`## Recent OMAAT Articles`** — main news river, ~10 article cards

## News-card pattern

Each article card carries:
- Thumbnail (40:31 aspect ratio, 400×310)
- Bold linked headline
- Two-line meta: relative-time (`1 hour ago`) + byline (`Ben Schlappig` — almost always)
- Comment count link (e.g. `[26]` linking to `#comment-NNNNN`)

Bylines are dominated by **Ben Schlappig** (the founder) — every single card in the visible river was authored by him. This is **single-voice editorial** at scale — opposite of TPG's multi-byline approach.

Sample card (verbatim):
> 1 hour ago
> Ben Schlappig
> [26]
> [Trump Admin Threatens To Shut Down Customs At "Sanctuary City" Airports]

Notice: relative time (`1 hour ago`), not date format. This is recency-led.

## "Featured Credit Card" mid-river block

> Chase Sapphire Reserve®
> Limited Time: Earn 150,000 bonus points
> [card art]
> - 4x points on flights and hotels booked direct
> - 3x points on Dining
> - $300 Annual Travel Credit
> - $795
> [Learn More]
>
> **Learn more from these OMAAT posts:**
> - Chase Sapphire Reserve Card Review: Big Annual Fee, Bigger Benefits
> - Is The Chase Sapphire Reserve Still Worth The $795 Annual Fee?
> - Huge: Best-Ever Chase Sapphire Reserve Card 150K Bonus Points Offer
> - Chase Sapphire Preferred Vs. Reserve: Which Is Better?

This is a **content-cluster card** keyed to a single product, embedded mid-river. Same structural idea as HfP's "The Platinum Card®" subsection cluster on its homepage — but visually one block, not a grid.

## `## Latest Trip Reports` H2

A second river of long-form trip reports, separate from the news river above. OMAAT's trip-report genre is unique to it — long-form, multi-part, illustrated, archival. Not directly applicable to dubaipoints.ae's current scope but worth noting as an audience-retention play.

## "Credit-card sidebar"

Right rail (or interleaved on mobile): four credit-card cards stacked vertically, each with:
- Card name
- Card art
- One-line offer summary
- Learn More CTA
- Optional Terms Apply / See Rates & Fees disclosure

Cards: Chase Sapphire Reserve / Citi AAdvantage Globe / Capital One Venture X Business / Amex Gold.

## "Browse the Archives" category select

A massive `<select>` element listing every airline, airport, aircraft type, bank, country, hotel chain, and rewards programme the site has ever covered. This is a **discovery aid** in IA terms — gives the user a brute-force way to find a specific topic from 47,000+ posts. Not a pattern dubaipoints.ae needs to copy until our post count is in the thousands; worth noting as the eventual archive-IA solution.

## Footer "About Ben" stats block

The single most distinctive homepage element on OMAAT:

> Meet Ben, OMAAT Founder
>
> **5,883,136** Miles Traveled
> I've flown hundreds of airlines, primarily in first and business class.
>
> **43,914,800** Words Written
> I write all my own content; there are no ghostwriters or AI at OMAAT!
>
> **47,187** Posts Published
> 18 years (and counting) of daily blogging adds up.

Three numeric brags + a one-sentence explanation each. **The "no ghostwriters or AI" line is the standout brand differentiator** — OMAAT is loudly positioned as a single human authority. For dubaipoints.ae: the Charter is silent on AI-content disclosure; with the AI-photography ban already in place, an AI-prose ban (or at minimum a transparency stance) is worth a Council discussion. OMAAT's footer line is the model copy.

## Newsletter signup

Three-frequency picker (Daily / Weekly / Promotions) + email field + Join Now. Standard play.

## "Watch the latest from OMAAT"

YouTube channel callout — Ben's video introduction embedded. OMAAT is multi-channel; this is the cross-promo link.

## Trust block: "New to One Mile at a Time?"

A small block with three onboarding links:
> - Credit Card Points Strategy for Beginners
> - Types of Miles and Points
> - Top Credit Card Offers This Month

Beginner-friendly entry points. UP runs the same idea structurally; OMAAT keeps it lighter and more conversational.

## Notable absences

- **No "As seen in" press strip** (UP has this).
- **No "Meet the Team" stack** (UP has this) — OMAAT is single-voice so the equivalent is the Ben stats block.
- **No card-finder tool** (TPG has CardMatch) — OMAAT's discovery is editorial, not algorithmic.

## Voice signals from headlines

Sample headlines from the visible river:
- "Trump Admin Threatens To Shut Down Customs At 'Sanctuary City' Airports"
- "Massive New 'Landmark' Alaska Lounge Coming To Seattle In Late 2027"
- "JFK ATC Flippantly Dismisses British Airways 787 Pilot Visibility Concerns"
- "Is The Amex Business Gold Worth $375? Probably Not For Me — Here's Why"
- "Aman Makes Mexico Debut With 18-Key Amanvari, In Costa Palmas Complex"

Notice the **opinion in the headline** — "Probably Not For Me — Here's Why", "Flippantly Dismisses", "Solid, Second Tier Luxury City Hotel". OMAAT headlines lean editorial, not neutral SEO bait. This contrasts with HfP's neutral-question H2s ("Is the American Express Platinum card worth £650?") which lean SEO. Both work; OMAAT trades search-discovery for click-confidence.
