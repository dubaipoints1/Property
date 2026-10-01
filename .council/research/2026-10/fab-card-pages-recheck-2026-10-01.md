# FAB card pages re-check — 1 October 2026 (issue #419)

The `dubaipoints-product-pages` monitor check `01a0f6b7-4673-76cf-a034-52b851fee4bf`
(1 October 2026) could not read three FAB pages ("All scraping engines failed").
They were re-read by hand through the free reader (`fetch-sources.yml`, no
Firecrawl credits), together with the two FAB documents they link to.
Figures below were read by a person from this text (Charter §6).

| # | Source | Reader run | Read (UTC) |
|---|---|---|---|
| 1 | https://www.bankfab.com/en-ae/personal/credit-cards/fab-world-elite | 36875727487 | 2026-10-01 14:22 |
| 2 | https://www.bankfab.com/en-ae/personal/credit-cards/cashback-credit-card | 36875727487 | 2026-10-01 14:22 |
| 3 | https://www.bankfab.com/en-ae/personal/credit-cards/fab-elite-credit-card | 36875727487 | 2026-10-01 14:22 |
| 4 | FAB Rewards Terms and Conditions, April 2025, Version 4 — https://www.bankfab.com/-/media/fab-uds/personal/terms-and-conditions-consolidated/fab-reward-programmes/fab-rewards-terms-and-conditions-en.pdf?view=1 | 36875994246 | 2026-10-01 14:24 |
| 5 | FAB Credit Cards Key Facts Statement, June 2023, Version 1 — https://apply.bankfab.com/-/media/fabgroup/home/personal/key-facts-statements/fab-consolidated-credit-cards.pdf | 36876402253 | 2026-10-01 14:27 |

## Findings

- **FAB Cashback** — matches `cards.json`: AED 5,000 minimum salary; AED 300
  annual fee (AED 315 with VAT); 5% supermarket / fashion / dining, each capped at
  AED 150 a month; 3% non-AED; 1% everything else; 0.15% select categories;
  AED 1,000 monthly cap; AED 3,000 previous-month minimum spend. No welcome offer
  or first-year waiver on the page. `lastVerified` → 2026-10-01.
- **FAB Elite** — fee (AED 1,200; AED 1,260 with VAT), AED 40,000 minimum salary,
  caps (500,000 / 200,000 luxury) and perks match. **Base earn does not match**:
  the page says "up to 5 FAB Rewards" on all other spending including abroad, and
  the terms (source 4, clause 3.1 table) give FAB Rewards Elite Card 5 per AED 1
  on everyday spending, 20 on luxury, 10 on eco-friendly purchases. L2 carried 1.
- **FAB World Elite** — invitation-only, lounge, concierge, USD 500,000 insurance
  match; KFS lists the annual fee as Free. **Earn does not match**: the terms give
  "FAB Rewards World - World Elite" 5 per AED 1 on domestic and international
  spend, no bonus category, 600,000 cap. L2 carried international 10 /
  everything else 1, neither of which had a primary source (see
  `.council/briefs/2026-05-29-fab-rewards-earn-reconciliation.md`, fab-world-elite).
- **Reward value** — the terms cap FAB Cashback card earn at "334,000 FAB Rewards
  (AED 1,000)", i.e. ~AED 0.003 per Reward, consistent with the 2026-06-01 brief.
  The FAB Elite review used AED 0.02.
- **Not changed, flagged:** the KFS gives the FX fee as "Up to 2.49% + (Scheme
  Charges)", scheme charges "1% (Approx.)"; L2 `fxFee` is 2.49 on all three cards.

## Source 4 — FAB Rewards terms, clause 3.1 (verbatim extract)

```
3. Earning FAB Rewards
3.1 FAB Rewards Earning Structure in respect of Credit Cards

For every 1 (one) d (or equivalent foreign currency) charged by the Customer to a Credit Card,
the Customer will be awarded a FAB Reward as set out in the table below:

                                                                            Number of FAB               Number of FAB
                                                                            Rewards per d               Rewards per d 1
 Credit Card Type                Spend Type                                    1 spent                      spent

                                                                              Gaming**/        Everyday spending
                                                                         Special Categories***
FAB Rewards Active             Every 1000 steps                                   25*****                       0.5

                               Sports (d )                                            5

                               Domestic (d )                                          2
                               & International (Non – d )




         First Abu Dhabi Bank PJSC is licensed and regulated by the Central Bank of the United Arab Emirates.
                    Its registered office address is P.O. Box 6316, Abu Dhabi, United Arab Emirates.
                     FAB – FAB Rewards Terms and Conditions– April 2025] – Version 4 – English,
FAB Rewards Indulge               Domestic (d )                             5 (E-commerce)***                    1
                                  & International (Non – d )
FAB Rewards Platinum*             Domestic (d )                                        -                         1
                                  & International (Non – d )
FAB Rewards Signature             Domestic (d )                                        -                         1
                                  & International (Non – d )
FAB Rewards Infinite              Domestic (d )                                        -                         4
                                  & International (Non – d )
FAB Rewards Elite Card            Domestic (d )                            20 (Luxury Spends)                    5
                                  & International (Non – d )
                                                                           10 (Eco-friendly
                                                                           purchases)




FAB Rewards World -               Domestic (d )                                        -                         5
World Elite                       & International (Non – d )
Manchester City FC                Domestic (d )                           10 (Sports Goods and                   1
 Titanium                         & International (Non – d )                  Sports Apparel
                                                                               spends)*****
FAB Z Card                        Domestic (d )                            1 (All Retail spends)                 1
                                  & International (Non – d )                   0.5 (Special
                                                                               Categories)
du Titanium Credit Card           Domestic (d )                               51(Spent at du                     1
                                  & International (Non – d )                   merchants*)



Monthly card spend FAB Rewards will be capped at 600,000 for World and World Elite, 500,000 for FAB Elite Card,
150,000 for Infinite and Elite Infinite, 75,000 for Signature and 50,000 for FAB Rewards Indulge, Active and
Platinum, Manchester City FC, du and other FAB Rewards Credit Cards. Supermarkets, telecom, fuel, education,
government, charities, transport, rental, car rental, utilities, florists, bookstores, laundry, rentals, lottery,
insurance, and fast-food spending will earn 0.5 FAB Reward for every d 1 spent.

                      FAB – FAB Rewards Terms and Conditions– April 2025] – Version 4 – English,
  ****The term Eco-friendly Merchant refers to merchants that sell eco-friendly products such as Kibsons,
  Emirates Bio Farm, Just Vegan, The Giving Movement, BON organic perfumes etc. The term Luxury spends refers
  to merchants such as Hermes, Cartier, Harrods, Van Cleef, Prada, Gucci, Dior, Hugo Boss and more. FAB Elite
  Credit Cardholders will be entitled to get 200,000 FAB Rewards bonus per month on the Luxury spending
  category and the maximum rewards earned per calendar month across all categories shall not exceed 500,000
  FAB Rewards. Customers will be entitled to a gold gift upon cumulative retail spend of d 500K in the first year
  and on card anniversary and will receive a promo code to order the same via the FAB Rewards Shop. For the
  tree-planting program members will contribute to the give a ghaf through a seedling contribution on card first
  spend and thereafter at every card anniversary,
  *****The term Sports Goods and Sports Apparel refers to transactions under Merchant Category Codes 5941

 Note: There is overall cap of 334,000 FAB Rewards (d 1,000) per month.
```

## Sources 1–3 — earn and fee lines (verbatim extracts, one block per page)

FAB renders the dirham sign as a glyph the reader drops, so "##  1,200" is AED 1,200.

### Source 1 — FAB World Elite page

Every line on the page that mentions rewards, cashback, a percentage or the
invitation. **The page publishes no earn rate**; the only earn source for this
card is the terms row "FAB Rewards World - World Elite" (source 4), whose cap
line reads "600,000 for World and World Elite". The KFS (source 5) lists "FAB
World Elite" as the only World Elite card FAB issues.

```
- Worldwide airport lounge access for you and a guest
- Travel insurance coverage of up to USD 500,000
Exclusive to Private Banking Customers. Applications are by invitation only.
Get 20% off when you book a ride with Uber. Choose your preferred car type for immediate pick up or schedule for later. Learn more.
The Bicester Village Shopping Collection is defined by its luxury brands, charming open-air ‘village’ settings, a welcoming and superior service, a calendar of events and, not least, exceptional value for money. World-leading brands offer savings of up to 60%, and sometimes more, on the recommended retail price, in their own luxuriously appointed boutiques, all year round. Learn more.
Enjoy a quality stay that includes a 10% discount, complimentary daily house cleaning on stays over 7 nights, at 2,000 onefinestay properties across London, Paris, Milan, Florence, Rome, New York, Los Angeles, San Francisco and Sydney. Learn more.
Hertz Gold Plus Rewards® President's Circle Membership*
Renting a car is now hassle-free. With World Elite Mastercard, you are automatically eligible for Hertz Gold Plus Rewards® President's Circle, which is otherwise obtainable through 20 qualifying Hertz Gold Plus Rewards® rentals in a 12-month period. Learn more.
Whether you're departing, arriving, or just connecting flights, Mastercard Airport Concierge gives you access to a personalised meet and greet service, facilitating your airport experience. Enjoy a special saving of 15% on this VIP service at over 470 airports, globally. Learn more.
Going on a holiday or booking that business trip? Book your ticket on Cleartrip using your World Elite Mastercard and enjoy a 10% discount on any international roundtrip airfare. Learn more.
You and your loved ones deserve peace of mind every time you travel. Rest assured that you will receive compensation for medical care or emergency help if you need it for up to USD 500,000. Learn more.
```

### Source 2 — FAB Cashback page

```
##  5,000
Minimum Monthly Salary
##  300
Annual Fee
## Get great cashback whenever you spend.
What you spend on
The cashback you get
FAB Rewards earned
Monthly Cap
Supermarket
5%
17 FAB Rewards /  1 Spend
 150
Fashion
5%
17 FAB Rewards /  1 Spend
 150
Dining
5%
17 FAB Rewards /  1 Spend
 150
All other spending excluding select categories
1%
3.5 FAB Rewards /  1 Spend
-
Select categories
0.15%
0.5 FAB Rewards /  1 Spend
-
Cashback for non-AED spending
3%
10 FAB Rewards /  1 Spend
-
Overall Cap on cashback
Rewards will be granted up to  1,000 or until eligible spends reach the credit limit,
whichever comes first.
### It’s good to know:
- There is a minimum spend criteria of  3,000 in the previous month to be eligible to earn FAB Rewards.
- To learn more about select categories and all other spending, please read the below Terms & Conditions PDF.
- Cashback will be processed in equivalent FAB Rewards, redeemable instantly on the FAB Mobile app.
## Lifestyle
40% off Talabat orders
Movie tickets for  20
Carrefour online discounts
```

### Source 3 — FAB Elite page

```
### Up to 500,000 FAB Rewards on all your spending
You can earn up to 500,000 FAB Rewards on all your spending.
##  40,000
Minimum Monthly Salary
##  1,200
Annual Fee
Receive up to 20 FAB Rewards on luxury spending
Get 10 FAB Rewards on eco-friendly purchases
Up to 5 FAB Rewards on all other spending including abroad
Get up to 20 FAB Rewards on luxury spending
Earn 20 FAB Rewards at brands such as Hermes, Cartier, Harrods, Van Cleef, Prada, Gucci, Dior, Hugo Boss and more. Learn more
Receive 10 FAB Rewards for each  1 spent at eco-friendly merchants including Kibsons, Emirates Bio Farm, Just Vegan, The Giving Movement, BON organic perfumes and over 200 more brands in the UAE. Learn more
Get up to 5 FAB Rewards on all other spending including abroad
Get up to 5 FAB Rewards* for each  1 spent on all other spending in the UAE and abroad (including non-AED currencies). Learn more
Use your FAB Rewards for cashback and much more
FAB Rewards earning is capped at 500,000 FAB Rewards per month except earning on luxury spending which is capped at 200,000 FAB Rewards each month.
*Selected categories will only earn 0.5 FAB Rewards per  1 spent. See FAB Rewards Terms and Conditions for more information on categories.
- Bonus FAB Rewards for spending at eco-friendly merchants
```

## Source 5 — KFS (verbatim extract, whitespace collapsed)

```
FAB World Elite                              Free
FAB Cashback                                 AED 300
Foreign Currency Transaction Fee   Up to 2.49% + (Scheme Charges) of every card transaction which is affected in currencies other than UAE Dirhams
                                   Here, scheme charges refer to 1% (Approx.) of every card transaction which is affected in currencies other than UAE Dirhams. This amount is
                                   charged by VISA or MasterCard, considering which card you are holding
(Annual Fee Applicable, AED; Excluding VAT — FAB Key Facts Statement, June 2023, Version 1)
```
