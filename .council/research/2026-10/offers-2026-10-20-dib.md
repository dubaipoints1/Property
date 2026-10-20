# Source archive — DIB card offers (read 20 Oct 2026)

Discovery: `fetch-sources.yml` run 39438955517 read
https://www.dib.ae/offers/card-offers (status 200). Each tile reads
"[badge] Valid till [date] | [category] | [merchant] | [offer]". Tiles used:

> Valid till 15 November 2026 | Travel | Air Arabia | Get 20% discount on Ultimate fare tickets, up to AED 150 per passenger on one-way bookings and up to AED 300 per passenger on round trip. …
> 15% | Valid till 30 November 2026 | Premium Dining | Mann Marzi Restaurant | 15% discount on the total bill
> 20% | Valid till 31 December 2026 | Premium Dining | Choix, InterContinental Dubai Festival City | 20% off on à la carte, afternoon tea, 20% off on purchase of cakes for take away

Skipped: Emax (ends 25 Oct), SIXT (25 Oct), Thai Chi and Floward (31 Oct),
"Dine and get 10% cashback" (1 Nov), AVIS (detail page carries no terms,
details on an external link), hotel-restaurant brunch offers (alcohol
exclusion rule), EPP 0% instalment tiles.

## Air Arabia — `dib-air-arabia-20pct-ultimate`

Channel: run 39439223865, status 200, 20 Oct 2026.
URL: https://www.dib.ae/offers/offer-detail/air-arabia

> - Get 20% discount on Ultimate fare tickets, up to AED 150 per passenger on one-way bookings and up to AED 300 per passenger on round trip
> - Get 10% discount on Value fare tickets, up to AED 40 per passenger per one-way bookings or AED 80 per passenger on round trip
> - Offer is applicable on payment with DIB VISA Covered Cards only. Offer excludes Corporate Cards.
> - The promotion applies only to "Value" and "Ultimate" fare types purchased on the Air Arabia website; all other fare types are excluded.
> - Promo code "DIB" should be added during the search of the required flight to apply the offer.
> - The discount is valid for bookings including one flight originally departing from Sharjah (SHJ), Ras al Khaimah (RKT) or Abu Dhabi (AUH).
> - The discount applies only to (i) base fare, (ii) carrier-imposed surcharges, and (iii) eligible ancillary products purchased as part of the booking, including (without limitation) baggage, seat selection, and meals; all taxes, government levies, airport charges, and any other statutory or third-party charges are expressly excluded …
> - Blackout dates and/or blackout periods may apply.
> - Offer is not applicable through payments with Apple Pay and Samsung Pay.
> - Offer is valid from October 1, 2026 till November 15, 2026
> - The promotion is available exclusively for bookings made on the Air Arabia official website …
> - The promotion applies only to flights involving "Air Arabia PJSC (G9)" and "Air Arabia Abu Dhabi (3L)". …
> - If a booking made using the promotion is changed, reissued, or otherwise modified, Air Arabia may withdraw the discount (in whole or in part) for any unflown segments …
> - Offer is valid for bookings made from October 1, 2026 to November 15, 2026, for travel until March 31, 2027.

## Mann Marzi — `dib-mann-marzi-15pct`

Channel: run 39439223865, status 200.
URL: https://www.dib.ae/offers/offer-detail/mann-marzi-restaurant

> Mann Marzi Restaurant
> 15% discount on the total bill
> - Offer is applicable on payment with DIB Covered Cards and Johara Debit Cards
> - Offer is not applicable during public holidays, special occasions such as Christmas eve/day, New Year's Eve/day, Eid Al Fitr, Eid Al Adha etc.
> - Offer is not applicable in conjunction with any other discount or promotional offer.
> - Offer is valid till 31/12/2026.

Conflict: index tile says 30 November 2026, detail page 31/12/2026. The post
uses the earlier date as `expiresOn` and states both.

## Dr. Nutrition — `dib-dr-nutrition-app-dib15`

Channel: run 39439408046, status 200.
URL: https://www.dib.ae/offers/offer-detail/dr-nutrition

> - 15% off on all DNP Packages
> - 20% off on Tablets from Laperva & Wow Woman
> - 15% off on Slimming Products, Snacks and Beauty Products from Laperva & Wow Woman
> - 10% off on Sports Nutrition from Laperva & Wow Woman
> - 10% off on products from Optitect, Wowtien, BB, BIO PROTECTION & Applied Nutrition
> - 5% off on all the other brands that are not specified in the above listing
> - Offer is applicable on payment with DIB Covered Cards only.
> - Offer is only valid on purchases made through the Dr Nutrition app and is not applicable to purchases made through any other platform or in-store.
> - Offer can be availed by using promo code DIB15 on the DR Nutrition app.
> - Offer is not applicable in conjunction with any other discount or promotional offer.
> - Offer is valid till 31/08/2027.

(Index tile from the Air Arabia detail page's "Many more offers": "Deal ·
Valid till 31st August 2027 · Dr. Nutrition".)

## Choix — `dib-choix-intercontinental-20pct`

Channel: run 39439408046, status 200.
URL: https://www.dib.ae/offers/offer-detail/choix--intercontinental-dubai-festival-city

> Choix, InterContinental Dubai Festival City
> 20% off on à la carte, afternoon tea
> 20% off on purchase of cakes for take away
> - Offer is applicable on payment with DIB Covered Cards only.
> - Offer is available for up to 5 guests, including the Cardholder
> - Prior reservation is required, call on: +971 4 701 1127/28 or email reservation.dfc@ihg.com
> - To avail the offer DIB offer should be quoted during the reservation
> - Offer is not applicable during public holidays, special occasions such as Christmas eve/day, New Year's Eve/day, Eid Al Fitr, Eid Al Adha, etc.
> - Offer is not applicable in conjunction with any other discount or promotional offer.
> - Offer is not applicable on tobacco and retail items
> - Offer is applicable on dine-in only.
> - Offer is valid till 31/12/2026.

The takeaway-cakes vs "dine-in only" tension is flagged in the post.
