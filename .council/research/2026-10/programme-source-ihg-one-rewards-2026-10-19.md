# Source archive — IHG One Rewards programme profile (read 19 Oct 2026)

For `src/content/programs/ihg-one-rewards.mdx`. Every figure on the page is
quoted verbatim below from IHG's own pages.

## Channels

1. **Free reader first.** `fetch-sources.yml` run 39273087453 (job
   118130254101), 19 Oct 2026 14:54 UTC, tried six `www.ihg.com` URLs
   (onerewards earn, elite-status, terms-and-conditions, redeem, home,
   terms-of-use). All returned **HTTP 403 "Access Denied"** (Akamai edge).
2. **Firecrawl** (`firecrawl_scrape`, `formats: ["markdown"]` only), 1
   credit each:
   - https://www.ihg.com/onerewards/content/us/en/maintain-points: 200
   - https://www.ihg.com/content/us/en/customer-care/member-tc: 200
     (IHG One Rewards Membership Terms and Conditions)

## 1. Membership Terms and Conditions — https://www.ihg.com/content/us/en/customer-care/member-tc

Verbatim:

> **Elite Tier Bonus Points:** "Elite Tier Bonus Points" are defined as Points Elite Members receive for Qualifying Stays at the following percentage rates:
> | IHG One Rewards Silver Elite | 20% |
> | IHG One Rewards Gold Elite | 40% |
> | IHG One Rewards Platinum Elite | 60% |
> | IHG One Rewards Diamond Elite | 100% |

> 23. **Elite Status Requirements:** Elite status will be awarded to Members that have successfully achieved at least one of the following criteria in a Calendar Year. A "Calendar Year" is defined as January 1st through - December 31st of each year.
> | | Silver Elite | Gold Elite | Platinum Elite | Diamond Elite |
> | Elite Qualifying Points | n/a | 40,000 | 60,000 | 120,000 |
> | Elite Qualifying Nights* | 10 | 20 | 40 | 70 |

> 24. **Earning and Maintaining Elite Status:** Once a Member earns Elite membership status in a Calendar Year, the status will be maintained through the end of the following Calendar Year. … Reward Nights consumed by Members count as Qualifying Nights towards Elite membership qualification.

> 25. **Rollover Nights:** At the end of the Calendar Year, Qualifying Nights in excess of the number required for Gold Elite, Platinum Elite, and Diamond Elite status will rollover into the following year and count towards earning Elite status in that next year.

> 27. **Milestone Rewards:** … Milestone Rewards are earned every 10 nights, beginning at 20 nights through 100 nights.

> Members earn ten (10) Points per US dollar or local currency equivalent on Qualifying Stays at most IHG branded hotels and five (5) Points per US dollar or local currency equivalent at Staybridge Suites and Candlewood Suites and Residences (Serviced Apartments/ extended stay units).

> 39. **Point Expiration:** Club level membership Points … will expire if your membership account point balance becomes inactive, meaning there was no "earn" or "redeem" transactions, for any period of twelve (12) months or longer … Use of the one night per year provided to IHG One Rewards credit card holders does not constitute an "earn" or "redeem" activity to prevent Point expiration. Elite Members' Points do not expire as long as Elite level membership is maintained.

> 41. **Point Purchases:** You may purchase up to 200,000 IHG One Rewards Points within a calendar year.

> 46. **Reward Nights:** IHG One Rewards Points may be redeemed for Reward Nights, and the number of Points required for a Reward Night may vary according to several factors, including but not limited to brand, hotel, and day of week. There are no blackout dates for Reward Nights; however, room inventory is limited and subject to prior sale.

> 53. **Reward Nights are Non-Qualifying Rates:** … A Reward Night is defined as a stay that a Member redeemed Points for, and includes Reward Nights booked via Points & Cash.

> 57. **Points & Cash:** IHG One Rewards Points & Cash enables you to redeem a combination of your existing Points, and Points purchased at the time of booking, to book a Reward Night.

## 2. How to keep your points — https://www.ihg.com/onerewards/content/us/en/maintain-points

Verbatim:

> *To avoid expiration of your points, the stay must result in either an increase or a decrease to your points balance.

> Use your IHG One Rewards points for a Reward Night at any of our 6,600+ destinations worldwide.

> ### 21 brands. 7,000+ global destinations.  Explore them all.

(The page quotes both 6,600+ and 7,000+; the profile quotes neither.)

## 3. UAE footprint — IHG's own release (already archived)

From `.council/research/2026-10/news-sources-2026-10-08.md` (IHG plc news
release, 29 September 2026, read 8 October 2026), verbatim:

> IHG® currently has 39 hotels operating across eight brands in UAE, including InterContinental Hotels and Resorts®, Vignette Collection, Hotel Indigo, Crowne Plaza®, vocoTM Hotels, Holiday Inn Resort® , Holiday Inn Express® and Staybridge Suites, and a strong pipeline of 110 hotels due to open in the next 3-5 years.

## 4. UAE cards (L2)

`src/data/cards.json` at 726a5cf: **no card** carries a `loyaltyProgram`,
`transferPartners` entry or any other field mentioning IHG. The page says
so and names no card.

## 5. Already-published sources reused

- Qatar Airways Global Points Exchange partner list ("IHG Hotels &
  Resorts" on it; conversion rate not stated), as published in
  `src/content/news/qatar-avios-transfer-bonus-uae-banks-31-october.mdx`.
- Garner Hotels UAE signing:
  `src/content/news/ihg-garner-hotels-uae-dubai-al-jaddaf-ras-al-khaimah.mdx`.
