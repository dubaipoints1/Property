# Source archive — Air Arabia AirRewards programme profile (read 20 Oct 2026)

For `src/content/programs/air-arabia-airrewards.mdx`. Every figure on the
page is quoted verbatim below from Air Arabia's own pages. No LLM
extraction; the text is as printed by the free reader.

## Programme name

The programme is **AirRewards** (one word, capital R) on airarabia.com as of
20 October 2026. The old `/en/airewards` URL now returns Air Arabia's
"page not found"; the site navigation links "AirRewards" at
`/en/airrewards`. Our valuations table previously spelled it "Airewards".

## Channels

1. `fetch-sources.yml` run 39438665021 (job 118682378194), 20 Oct 2026
   14:23 UTC: `https://www.airarabia.com/en/airewards` → 404 "page not
   found" (navigation links gave the current URLs);
   `/en/airewards-terms-and-conditions` → redirected to website terms,
   which link "Air Rewards Terms and Conditions".
2. `fetch-sources.yml` run 39438997563 (job 118683585568), 20 Oct 2026
   14:25 UTC, all HTTP 200:
   - https://www.airarabia.com/en/airrewards (final:
     `/en/airrewards/discover-airrewards/the-airrewards-program`)
   - https://www.airarabia.com/en/airrewards/air-rewards-terms-and-conditions
     (text truncated by the reader at 20,000 characters, after the
     "Miscellaneous Provisions" section began)
   - https://www.airarabia.com/en/airrewards/rakbank-air-arabia-platinum-credit-card
   - https://www.airarabia.com/en/airrewards/discover-airrewards/join-airrewards
3. Firecrawl: not used for Air Arabia.

## 1. The AirRewards Program — /en/airrewards/discover-airrewards/the-airrewards-program

> # The AirRewards Program
> The most generous loyalty program in the region

> ## Earn points
> Every Flight gets you up to 10% Cashback as AirRewards points.

> ## Spend points
> Use your points online easily for flights, meals and baggage.

> ## Family account
> Pool your points together and spend points with your family

> ## Transfer points
> Convert your AirRewards points into Etihad Guest Miles.

> No Blackout Dates
> Every Seat available every day.
>
> Cash + Points
> Not enough points? Pair it with some cash.
>
> 100 points =1 USD
> Your points get you the same value anytime of the year.

> RAK Bank
> Earn points on all spends with the RAKBANK Air Arabia Platinum Credit Card.
>
> Union Insurance
> 200 AirRewards points per 100 AED spent on motor insurance
>
> Kalyan Jewellers
> Upto 40 AirRewards points per 100 AED spent on jewellery.
>
> Buzzpay
> 3 AirRewards points for every 10 AED spent on mobile recharges.
>
> Sixt
> Upto 6 AirRewards points per USD1 spent on car rentals.
>
> Rocketmiles
> Upto 10,000 AirRewards points per hotel stay.
>
> Kaligo
> Upto 15 AirRewards points per USD 1 spent on hotel stays.
>
> Land of Fashion
> Earn 4 AirRewards points on every Euro you spend.

Note: the page states that points convert to Etihad Guest Miles but the
text read gives **no conversion rate**. Not published on our page.

## 2. AirRewards Terms and Conditions — /en/airrewards/air-rewards-terms-and-conditions

> AirRewards is a card less, customer loyalty Program.

> AirRewards Members from the same family may elect to pool their AirRewards Points by starting a Family Account. One person from the family must be designated as the Head of Household. … The Head of Household may have a maximum of eight Family Members enrolled into the Family Account.
>
> The Head of Household is required to be a minimum of 21 years of age.
>
> Persons eligible to become Family Members are (with respect to the Head of Household): brother(s), sister(s), father, mother, grand father, grand mother, spouse(s), and children.
>
> … Once listed as a Family Member, such members cannot be replaced for a period of 12 Months.
>
> 50% of all AirRewards Points earned by a Family Member will be transferred to and accumulated under the AirRewards account of the Head of Household. The rest 50% will be forfeited.
>
> The Head of Household maintains exclusive control of the Family account and as such controls all redemptions made through this account.

> Members will earn five (5) Points per USD (or equivalent) spent on flights and baggage allowance; and ten (10) Points per USD (or equivalent) spent on meal selection, insurance, seat selection and Hala services. Points can be earned on the base fare and surcharge of the flight only and on the value of ancillary services purchased. Points cannot be earned on government taxes/fees, or other fees or charges. … Members will not earn any Points for amounts spent on any other traveller's flight, even if this traveller is on the Member's booking and/or whose flight has been paid for by the Member. … For a flight paid for partly using points, points cannot be earned on the portion paid using AirRewards points.

> Any claim for missing Points must be received by AirRewards within 3 months (90 days) of the qualifying Air Arabia flight.

> Points cannot be earned on special flights, which may include (but is not a comprehensive list) charter flights, special Hajj/Umrah Flights and repatriation flights.

> Members may redeem AirRewards Points for the base fare and surcharge of an Air Arabia flight and/or eligible add-on services on any Air Arabia flight. Members may also use a combination of AirRewards Points and monetary payment for the same.

> A minimum balance of 3,000 Points is required for a Member to be able to redeem against a flight and baggage reward. The number of Points required is based on the published base fare and surcharge at the time of booking … Taxes and fees apply and are the responsibility of the passenger … Any change or cancellation to an Award Flight booking is subject to the Air Arabia standard change and cancellation fees and policies.

> Flights which are purchased with a monetary payment may not be exchanged or refunded for payment with Points, in whole or in part.

> AirRewards Points expire 24 months from the date they are earned. The earning date for each transaction can be viewed using the My Activity Statement in the member dashboard. Should a Member close his or her AirRewards account, the Points in that account will be cancelled.

> Points and Award Travel have no cash value and may not be redeemed for cash.

No elite tiers are described anywhere in the terms text read (to the
20,000-character truncation) or on the programme page.

## 3. RAKBANK Air Arabia Platinum Credit Card — /en/airrewards/rakbank-air-arabia-platinum-credit-card

> No joining fee
> Get 20,000 AirRewards welcome bonus
> Free annual return ticket to any destination
> Free 10 kg baggage and 2 meal vouchers
> …
> Complimentary lounge access

> How to earn AirRewards from your RAKBANK Air Arabia Platinum Credit Card
> | Earn | Spend |
> | 1.75 AirRewards Points | AED 5 at www.airarabia.com |
> | 1.25 AirRewards Points | AED 5 within UAE |
> | 1.75 AirRewards Points | AED 5 outside UAE |
> | 0.30 AirRewards Points | AED 5 under special categories* |
> *Conditions apply. For more details visit www.rakbank.ae

This card is **not** in `src/data/cards.json` (no L2 entry); RAKBANK's own
fee schedule lists an "Air Arabia" card (scraped free text on the RAKBANK
World Cashback L2 entry). Our page quotes Air Arabia's description only and
says the card is not reviewed.

## 4. Register to AirRewards — /en/airrewards/discover-airrewards/join-airrewards

> Earn upto 10% cashback as AirRewards points when you book a flight, pre-select additional services or shop at our extensive partner network.
> Redeem your points easily to book any flight anytime of the year without restrictions or blackout dates.
> Select one of the options below to proceed with your registration:
> - Sharjah … - Abu Dhabi … - Morocco … - Egypt … - Saudi Arabia

## Derived figures on our page (labelled as derived)

- "100 points =1 USD" (Air Arabia's statement) → 1 point = USD 0.01 =
  AED 0.036725 at the 3.6725 peg ≈ **3.67 fils per point**. This is the
  redemption value Air Arabia states, not a DubaiPoints valuation.
- 5 points per USD on fares = USD 0.05 back per USD 1 = **5%** of the
  eligible fare at that stated value; 10 points per USD on meals, seats,
  insurance and Hala = **10%**.
- RAKBANK card, 1.25 points per AED 5 in the UAE = 0.25 points per AED;
  × AED 0.036725 = AED 0.0092 per AED ≈ **0.9%**; 1.75 points per AED 5 =
  0.35 per AED ≈ **1.3%**.
