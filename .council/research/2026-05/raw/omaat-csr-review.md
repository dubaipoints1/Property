# OMAAT — Chase Sapphire Reserve card review: template teardown

**Source:** https://onemileatatime.com/reviews/credit-cards/chase/chase-sapphire-reserve/
**Author:** Ben Schlappig (meta only) | **Published / Modified:** 2026-05-04
**Reading time:** 22 minutes | **Title:** "Chase Sapphire Reserve Card Review: Big Annual Fee, Bigger Benefits"

Teardown of OMAAT review-template patterns for the dubaipoints.ae dossier — competitive UX research, not a card recap.

## 1. Article frontmatter / card hero

No prose byline at the top. The page opens with a **card-spec hero
widget**: card name with trademark glyph; one-line strip "Limited Time:
Earn 150,000 bonus points \| Annual Fee: $795"; card-art image **with a
"Learn More" button inline beside it**; three earn-rate bullets; one
annual-credit line; **5.0-out-of-5 star rating** linked to OMAAT's
rating methodology; **comments-count chip ("23")** as social-proof;
Share + Tweet buttons. Byline and dates are emitted only as `<meta>`
tags, not in the body — distinct from HfP's visible "By [author], [date]".

Immediately under the hero, before the lede, a bold inline link:
**"Link: Learn more about the [Chase Sapphire Reserve® Card]"** — the
affiliate CTA is above the fold as the first prose element.

## 2. Lede pattern

No callout, no "TL;DR" widget. Two short prose paragraphs with the
**thesis stated explicitly in the first paragraph, second sentence**:

> The Chase Sapphire Reserve® Card is one of the most popular premium
> credit cards on the market. If this is a card that has been on your
> radar, this is the ideal time to apply, given the welcome offer that's
> currently available. **I'd argue that picking up this card is a
> no-brainer, if eligible.**

The third element is the literal text "In this post:" — presumably a
jump-link TOC widget in the live page (not captured in markdown).

## 3. Section structure — H2s verbatim, in order

OMAAT uses **statement H2s, not questions** — except the penultimate H2,
which flips to a question. The card name is repeated in every H2.

1. `## Chase Sapphire Reserve bonus & fee basics`
2. `## Chase Sapphire Reserve points earning structure`
3. `## Chase Sapphire Reserve points redemption options`
4. `## Chase Sapphire Reserve lounge access perks`
5. `## Chase Sapphire Reserve benefits & credits`
6. `## Is the Chase Sapphire Reserve worth it?`
7. `## Bottom line`

30+ H3s sit underneath, all money-anchored:
`### $795 annual fee & $195 authorized user fee`,
`### 8x points on Chase Travel portal bookings`,
`### Up to $500 annual The Edit by Chase hotel credit`, etc.
Comparison sub-sections use a **"Showdown:" prefix**:
`### Showdown: Sapphire Preferred vs. Sapphire Reserve`,
`### Showdown: Sapphire Reserve vs. Sapphire Reserve Business`.

## 4. Callout patterns

**No boxed callouts at all.** No "Hot Tip", "Key Takeaway", "Bottom Line"
chip, or pull-quote chrome anywhere in the body. The only `>` blockquote
is the issuer's eligibility-rule quote:

> > This credit card is unavailable to you if you currently have one
> > open. The new cardmember bonus may not be available to you if you
> > previously held this card or received a new cardmember bonus for
> > this card. We may also consider the number of cards you have opened
> > and closed in determining your bonus eligibility.

"Bottom line" appears only once, as the **final H2** — not as a recurring
inline chip. Stark contrast to HfP/UP.

## 5. Pros/cons format

**No pros/cons table or side-by-side block.** Head-to-head comparisons
are delivered as **prose bullets** under "Showdown" H3s:

> - Welcome bonus — the Sapphire Preferred has a welcome bonus of 75,000
>   bonus points … while the Sapphire Reserve has a welcome bonus of
>   150,000 bonus points …
> - Annual fee — the Sapphire Preferred has a $95 annual fee, while the
>   Sapphire Reserve has a $795 annual fee

Em-dash leader bullets. No grid, no checkmark/X glyphs.

## 6. "Value to me" quantification

OMAAT's signature pattern, and it is **personal prose, not tabular**.
Ben states his points valuation once, then derives **per-category
percentage returns** in prose:

> Personally, I value Ultimate Rewards points at 1.7 cents each, so to
> me, the points are worth $2,550.

> Earning 8x points at 1.7 cents each, to me that's the equivalent of a
> 13.6% return on travel spending …

> To me, that's the equivalent of an 8.5% return on Lyft spending …

For credits, he qualifies whether he counts them at face value:

> Personally, I wouldn't value this credit at close to face value, since
> many hotels belonging to the portfolio are quite expensive.

> Personally, I value this at close to face value, since some of my
> favorite restaurants in Miami are on the list.

The "is it worth it" section runs a **prose math walk-through** as
bullets — no table:

> - While the $795 annual fee is steep, I consider the $300 annual
>   travel credit to basically be worth face value, lowering the real
>   out of pocket on this card to $495 per year
> - Then there are the hundreds in extra credits … for me, the $300
>   dining credit is good as cash …

This is the **inverse of HfP's "value to me" table** — same intent,
prose not grid, opinionated not formulaic.

## 7. Affiliate / advertiser disclosure

**No inline FTC-style "we may earn commission" disclosure anywhere
above the fold or in the body.** Disclosure is delegated to a `[Learn
about OMAAT Star Ratings]` link in the hero pointing to
`/one-mile-time-advertising-policy/#star-ratings`. The **only literal
"advertiser" wording** in the article is the comments-section
boilerplate disclaiming endorsement of **user comments** (not
editorial), verbatim:

> The comments on this page have not been provided, reviewed, approved
> or otherwise endorsed by any advertiser, and it is not an
> advertiser's responsibility to ensure posts and/or questions are
> answered.

It sits ~38,500 chars in, immediately under "Conversations (23)" — well
below the fold. Affiliate links route through `onemileatatime.com/go/…`
redirectors with no visual flag (no asterisks). **Weaker than our
Charter §5; do not adopt.**

## 8. Image rhythm

44 image tokens total; **~14 are article images** (rest are comment
avatars, related-post thumbs, icons). Every article image has an
**inline plain-text caption** on the next line. Examples (verbatim):

- "Redeem points for a flight in Air France business class"
- "Chase is good about allowing product changes between cards"
- "Earn 8x points on Chase Travel bookings"
- "The card offers credits & benefits with DoorDash"

Cadence: ~one image per H2, more inside long H3s. Captions 5–10 words,
assertive, often restating a nearby benefit. No photographer credit,
no source attribution. **No alt text** (`![]` empty in source).

## 9. Pull quotes / sidebar elements

**None.** No pull quotes, sidebars, inline related-article chips, or
FAQ accordions in the body. Single-column flat read; images are the
only non-prose interrupt. Related-post tiles appear only after the
comments section.

## 10. Comments

**Present and prominent.** "Conversations (23)" — 17 numbered top-level
+ 6 nested replies. Each shows avatar, name + status tag (all 23 "Guest"),
timestamp, optional subject line, body, **Reply**, **Helpful** vote.
Sort: **Most Recent / Oldest First / Most Helpful**. Count surfaced in
the hero as a trust signal. Threading shallow (one reply level).

## 11. Author voice — verbatim

Three paragraphs capturing Schlappig's first-person, opinionated tone:

> If this is a card that has been on your radar, this is the ideal time
> to apply, given the welcome offer that's currently available. **I'd
> argue that picking up this card is a no-brainer, if eligible.**

> The Sapphire Reserve has a $795 annual fee. Among the super-premium
> credit cards out there, this is at the high end of the fees, given
> that the card was recently refreshed. The good news is that the card
> offers all kinds of benefits that should help cardmembers offset that
> fee.

> Personally, I find this card to be easy to justify. … Personally, I
> think the math on the card checks out nicely, at least in my
> situation. That being said, if you can't stomach the annual fee, I
> think the Chase Sapphire Preferred is a useful alternative …

Tonal markers: "Personally" (15+), "To me" (8+), "I'd argue", "easy to
justify", "no-brainer", "the math checks out". First-person dominates;
no "we" voice; hedges land on the reader ("everyone should crunch the
numbers for themselves").

---

## Take-aways for dubaipoints.ae card-review template

- **Adopt:** card-spec hero (name, AED bonus, AED fee, three earn-rate
  bullets, star rating, comments count, share row) above the lede.
- **Adopt:** statement H2s, six-section spine — Bonus & fees, Earning,
  Redemption, Lounge access, Benefits & credits, Is it worth it?,
  Bottom line. Final pair flips to question + summary.
- **Adopt:** per-image inline-caption discipline.
- **Adopt-with-modification:** "value to me" math, rendered as a
  **transparent AED table** (`benefit → AED face value → AED
  value-to-editor`) with one-line prose rationale per row — HfP rigour
  with OMAAT voice; satisfies our auditable-source rule.
- **Reject:** burying disclosure. Charter §5 mandates inline,
  above-the-fold affiliate disclosure.
- **Reject:** repeating the card name in every H2 (SEO-spammy).
- **Reject:** skipping pros/cons. Ship a 3-and-3 box for scannability.
- **Consider:** "Showdown:" prefix for bank-vs-bank comparisons.
- **Consider:** visible comments as trust signal — only with Standards
  Editor + Chairman-approved moderation policy.
