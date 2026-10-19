# Source archive — UAE airport lounges by card (read 19 Oct 2026)

Guide: `src/content/guides/uae-airport-lounges-card-access-2026.mdx`.

Channels: free reader `fetch-sources.yml` runs 39293991758, 39294232783,
39294494402; Firecrawl markdown only (9 credits) where the reader got a
JavaScript shell (dubaiairports.ae) or a Cloudflare 403
(zayedinternationalairport.ae), plus the Sharjah Al Diyafah FAQ, whose
answers the reader did not render.

## DXB — Dubai Airports

https://dubaiairports.ae/experiences/relax-refresh (Firecrawl, 1 credit).
Listing, with terminal tag per tile:

> Game Space Gaming Lounge — T3 · Ahlan Lounges — T3 · Ahlan Business Class Lounge — "for guests on airlines that don't have their own dedicated lounge." — T1 · DXB Hotel — T3 · Timeless Spa — T3 · Unaccompanied Minor's lounge — T1 · British Airways Lounge — T1 · Ahlan First Class Lounge — "for First Class guests travelling on airlines that don't have their own dedicated lounge." — T1 · XpresSpa — T3 · DXB Family Zone — T3 · Assisted Travel Lounge — T2 · Plaza Premium Lounge — "offers you a premium experience even while travelling economy class." — T3 · [Show more]

https://dubaiairports.ae/experiences/relax-refresh/details/plaza-premium-lounge (Firecrawl, 1 credit):

> ## Location ### Terminal 3 — A Gates - Departures
> You may like: Emirates Lounges — "Work, relax and indulge before boarding directly from the Concourse A lounges."

https://dubaiairports.ae/experiences/relax-refresh/details/ahlan-lounges (Firecrawl, 1 credit):

> ## Location ### Terminal 3 — B Gates - Arrivals

None of the three Dubai Airports pages names a card or lounge programme.
"Show more" tiles were not expanded; the guide lists only what was read.

## AUH — Zayed International

Free reader: 403 Cloudflare. Firecrawl: home (1), `/en/lounges` 404 (1),
`/en/zayedairport` links (1), then:

https://www.zayedinternationalairport.ae/en/shop-dine-and-experience/hotel-and-lounges/lounges (1 credit):

> Diamond Lounge — "nestled in a separate terminal away from the hustle and bustle of the airport" · Private Entry
> Etihad Business Lounge — "The Etihad Airways Business Class Lounge …"
> Etihad First Class Lounge — "The Etihad Airways First Class Lounge …"
> Pearl Lounge — "Open to all travellers"
> Yas Island Lounge — "enhances arrivals at Zayed International Airport, by offering complimentary services"

https://www.zayedinternationalairport.ae/en/shop-dine-and-experience/hotel-and-lounges/lounges/pearl-lounge (1 credit):

> Open 24 hours · Location: Departure level 3, Beginning of Pier D
> #### Accessing the Lounge
> The Pearl Lounge is accessible to a wide range of travellers through various loyalty and membership programmes
> Loyalty Programs Accepted
> Priority Pass (Visa, MasterCard)
> Lounge Key (Visa, MasterCard)
> Dragon Pass (MasterCard ME, Visa)
> Dream Folks (Diners, MasterCard, Visa, Rupay)
> Or, Pay to Access … 3 hour(s) for AED 265.

Note: Visa Airport Companion and Mastercard Travel Pass are not named on
this list. The guide says so and does not infer that they are accepted.

## SHJ — Sharjah Airport

Free reader (run 39294232783):
https://www.sharjahairport.ae/en/traveller/airport-facilities/dining/lounge-area/

> Easy to find and centrally located, all our airport lounges are open 24-hours, 365 days per year. Charges do apply and entry to the lounges can be pre-booked.
> ## Al Diyafa Lounge … four private suites …
> ## The Lounge … Sharjah Airport's newest premium lounge, is open 24/7 …

https://www.sharjahairport.ae/en/traveller/airport-facilities/dining/the-airport-lounge/

> The Lounge is Sharjah Airport's newly renovated premium airport lounge.
> ## How to Book
> • Passengers can apply for a voucher to The Lounge through their tourism agency or airline, by emailing Hala Services or the Transfer Desk, or at the check-in counter. Charges may apply for access to the lounge for up to three hours.
> • Walk-in guests can purchase a voucher at The Lounge reception.
> • Children aged between 0-2 years old enter free
> • Children aged between the ages of 2 and 12 are charged at 50% of the applicable adult lounge charge.
> • All fees will be subject to 5% VAT …

Firecrawl (1 credit): https://www.sharjahairport.ae/en/traveller/airport-facilities/services/al-diyafah/

> ## Rates
> - Al Diyafah Service for 1 passenger without lounge access: **180**
> - Al Diyafah Service for 1 passenger with lounge access: **280**
> - Al Diyafah Service for a family (4 members max) without lounge access: **500**
> - Al Diyafah Service for a family (4 members max) with lounge access: **650**
> ### Which cards are allowed to access Al Diyafah lounge?
> - This service is not available in Al Diyafah lounge.

No currency is printed beside the rates; the guide says so.

## Citi — Mastercard Travel Pass mechanics

Free reader (run 39294232783): https://www.citibank.ae/credit-cards/travel/lounge-access

> IMPORTANT – From 01 June 2025, Mastercard lounge program is introducing a maximum number of lounge visits per year subject to non-AED spend.
> Your Citi Ultima Mastercard brings you and your supplementary cardholders 14 complimentary lounge visits per year.
> Download the "MasterCard Travel Pass" app … Register your Citibank Mastercard credit card. See the lounges near you and view if you are eligible for complimentary access. Generate and present the app QR code or membership number … Each cardholder, primary and supplementary, should show their QR code …
> You and your supplementary cardholders are entitled to bring 1 guest each with the MasterCard Travel Pass app.
> Guest visits are deducted from your maximum visits allowance per year.
> A $32 charge will apply to all guests above your allowance entering the lounge and will be billed directly to your card.
> Children over 1 year old are considered as paying guests.

## Network directories

dragonpass.com home read (free reader); it is an app-download page with no
lounge list. Visa Airport Companion and Mastercard Travel Pass directories
are in-app. Per brief, the guide links/names the finder rather than listing
lounges per network.

## Card ↔ programme mapping

Taken only from `src/data/cards.json` `_features[type=lounge_access]` (and,
for cards with no typed lounge feature, their `perks[]` free text):

- DragonPass: emirates-nbd-skywards-infinite (unlimited, "DXB and AUH"), emirates-nbd-skywards-signature (6/yr)
- Visa Airport Companion: emirates-nbd-share-visa-infinite (unlimited), emirates-nbd-u-by-emaar-infinite (unlimited), emirates-nbd-share-visa-signature (limited, cap unpublished), hsbc-live-plus (12/yr), cbd-one (8/yr); emirates-nbd-visa-infinite (perks text: Visa Airport Companion, cardholder + 1 guest, no cap stated)
- Mastercard Travel Pass: emirates-nbd-voyager-world (unlimited), emirates-nbd-lulu-247-platinum (allowance not stated), citi-cashback (8/yr, non-AED spend)
- sc-platinum-x: "Mastercard (20+ lounges)", no named programme

Held: `emirates-nbd-lulu-247-titanium` is a **Mastercard** in L2 but its
`_features` entry says network "Visa Airport Companion" (12/yr, ME). The
guide does not repeat the network; it quotes the perk text only. Needs an
editor to re-check against the ENBD product page.
