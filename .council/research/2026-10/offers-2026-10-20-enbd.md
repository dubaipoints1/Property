# Source archive — Emirates NBD card offers (read 20 Oct 2026)

Discovery: `fetch-sources.yml` run 39438534959 read
https://www.emiratesnbd.com/en/promotions (registry index) but the 20,000-character
reader cap was spent on navigation; https://www.emiratesnbd.com/en/cards/credit-cards/offers
returned ENBD's "Something went wrong" page. One Firecrawl `map` of
emiratesnbd.com (search "credit card offer promo code") surfaced the pages
below. The lifestyle.emiratesnbd.com deal pages render client-side and came
back empty through the reader (run 39439728829), so they were read with
Firecrawl markdown scrapes.

## 1. Trip.com — `enbd-tripcom-mastercard-20pct`

Channel: Firecrawl scrape (markdown, cache miss), 20 Oct 2026. The free reader
(run 39439724495) returned only navigation for this URL.
URL: https://www.emiratesnbd.com/en/promotions/mastercard-trip-com-discount

> # Take off to extraordinary savings
> ## Travel more. Save 20%.
> Turn your next getaway into great savings. Whether it's a quick escape or a long-awaited holiday, enjoy up to **20% off** on flights and hotel bookings through the Trip.com app.
> Simply book with your Emirates NBD Mastercard and make every journey more rewarding.
> ### Voyager World Mastercard Credit Card
> 15% OFF
> up to **AED 90** on bookings of **AED 600** or more
> Use code: **MCTRIP15**Valid **4 times a year**
> ### Voyager World Elite Mastercard Credit Card
> 20% OFF
> up to **AED 150** on bookings of **AED 750** or more
> Use code: **MCTRIP20**Valid **5 times a year**
> ### Mastercard Platinum Credit Card
> 10% OFF
> up to **AED 60** on bookings of **AED 600** or more
> Use code: **MCTRIP10**Valid **3 times a year**
> Log in to the **Trip.com app** and book your flight or hotel.
> Enter the applicable **promo code** at checkout.
> Pay with your eligible **Emirates NBD Mastercard** to enjoy the discount.
> The offer is valid until **31 March 2027** for travel until **31 March 2028**.
> [Terms and Conditions apply](https://cdn.emiratesnbd.com/en/assets/file/mastercard-trip-jul15-tnc.pdf)

Not read: the terms PDF. `promoCode` left unset in frontmatter because there
are three tier codes; all three are in the body.

## 2. Zuvees — `enbd-zuvees-15pct-flowers`

Channel: Firecrawl scrape (markdown, waitFor 4000), 20 Oct 2026.
URL: https://lifestyle.emiratesnbd.com/en/deals/e-commerce/zuvees
Index tile (https://lifestyle.emiratesnbd.com/en/deals/e-commerce, Firecrawl):
"15% Discount · Zuvees · Expires on: 12/31/2026 · Service".

> Zuvees
> 15% Discount
> Expiration date
> 31 Dec 2026
> Get 15% discount on flower arrangements while using the promocode on **ENBD15**
> - **This offer is only applicable for the below cards:**
> - Visa Infinite Privileges (Metal Card)
> - Visa Infinite
> - Visa Skywards Infinite
> - Share Visa Infinite Credit Card
> - U By Emaar Visa Infinite
> - Visa Skywards Signature
> - Share Visa Signature Credit Card
> - U By Emaar Visa Signature
> - Voyager World Elite
> - Marriott Master World Elite
> - The offer is valid only on **standalone flower arrangements**
> - The offer is not applicable on combo products, including flower arrangements paired with perfumes or any other items
> - The discount cannot be combined with any other ongoing offers or promotions
> - This offer is valid till **31 December 2026**

## 3. Right Bite — `enbd-right-bite-20pct-meal-plans`

Channel: Firecrawl scrape (markdown, waitFor 4000), 20 Oct 2026.
URL: https://lifestyle.emiratesnbd.com/en/deals/e-commerce/right-bite

> Right Bite
> 20% Discount
> Expiration date
> 31 Dec 2026
> Get 20% discount on selected meal plans through the Right Bite app or website using the promocode ENBD20.
> - This offer is only applicable while using an Emirates NBD card.
> - Offer is not valid in conjunction with any other promotions or discount.
> - Offer is valid on 20, 40 and 60 day meal plans.
> - Offer is not valid on lunch only plans.
> - Offer is not valid on Plus or Lite plans.
> - The offer is valid till 31-12-2026.

Fact-check: every percentage, code, card name and date in the three deal
posts appears above. Derived arithmetic (Trip.com caps reached at the
minimums; yearly maxima) is shown in the posts.
