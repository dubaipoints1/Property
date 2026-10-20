# Source archive — RAKBANK card offers (read 20 Oct 2026)

Discovery: the registry index https://www.rakbank.ae/en/cards/card-offers
loads its list client-side (reader shows "Loading..."). One Firecrawl `map`
of rakbank.ae (search "card offers promotions discount") listed the offer
pages; the free reader renders them server-side.

Currency note: RAKBANK prints amounts with the new UAE dirham sign. The reader
does not render the glyph, so "Get 25% off (up to\n30)" below is AED 30 on
the page. The deal posts write AED.

Skipped: /crro Careem offer ("Offer period is from 1 April to 30 April 2026",
expired); Domino's RAK25PC, NowNow, Dr. Nutrition RAK10, Danube Home (no end
date stated); travel-spends Rehlat MASTERCARD code (no end date); La Perle
(2024 dates).

## Campaign landing page — talabat, noon, Careem, LuLu

Channel: `fetch-sources.yml` run 39439675294, status 200, 20 Oct 2026.
URL: https://www.rakbank.ae/en/landing-page/campaigns/ecomm-landing-page

> # Rakbank credit cards delivery offers
> ### Exclusive savings on your food, grocery and everyday apps
> From tonight's dinner to tomorrow's groceries and those little last-minute buys, simply use your Rakbank credit card to pay for orders on your favourite apps and add more savings to your checkout cart.
> ### Lulu
> ##### Valid on Lulu.com and Lulu App
> Get 15% off (up to [dirham sign] 50)
> Minimum order: 150
> Valid on 1 transaction per customer, every Sunday of the month.
> Validity: 26 April 2026 - 27 December 2026
> ### Talabat
> Get 25% off (up to 30)
> Minimum order: 100
> Promo code: RAK30
> Valid on 2 transactions per customer per month.
> Validity: 15 April 2026 - 31 December 2026
> ### Noon
> Get 15% off (up to 50)
> Minimum order: 300
> Promo code: RAK50
> Valid on 1 transaction per customer per month.
> Validity: 01 August 2026 - 31 December 2026
> ### Careem
> ##### Valid on Careem Food and Careem Quik
> Get 25% off (up to 30)
> Minimum order: 100
> Promo code:
> Quik - RAKQ25
> Food - RAK25
> Valid on 2 transactions per customer per month.
> Validity: 01 May 2026 - 31 December 2026
> ## Terms and Conditions
> Loading...

The terms section did not render in the reader; each post says so. Slugs:
`rakbank-talabat-25pct-rak30`, `rakbank-noon-15pct-rak50`,
`rakbank-careem-food-25pct-rak25`, `rakbank-lulu-sundays-15pct`.

## IGP — `rakbank-igp-20pct-rak20`

Channel: `fetch-sources.yml` run 39439680955, status 200, 20 Oct 2026.
URL: https://www.rakbank.ae/en/cards/card-offers/igp

> # igp
> ## Flat 20%
> - Flat 20% off with no minimum order
> Get online gift delivery with IGP.
> Promo code: RAK20
> * Offer is valid till 31 December 2026.
> - Payment on RAKBANK and RAKBANK Islamic credit and debit cards only
> - The discount cannot be used in conjunction with any other discount or promotional offer.
> - Offer is applicable on https://ae.igp.com/
> - Under this program customers can avail 20% off. Minimum order value is not required
> - The deal is not applicable on gold, diamond, electronics, international shipping and international catalog, gift cards, and some branded products
> - The maximum discount is capped at [dirham sign] 100

Fact-check: every figure in the five posts is above. Derived arithmetic:
talabat/Careem cap at AED 120 (25% × 120 = 30); noon AED 45 at the AED 300
minimum, cap at ~AED 334; LuLu AED 22.50 at the minimum, ten Sundays from
25 Oct to 27 Dec 2026 (27 Dec 2026 is a Sunday), AED 50 × 10 = AED 500; IGP
cap at AED 500.
