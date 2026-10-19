# Source archive — World of Hyatt programme profile (read 19 Oct 2026)

For `src/content/programs/world-of-hyatt.mdx`. Every figure on the page is
quoted verbatim below from Hyatt's own pages.

## Channels

1. **Free reader first.** `fetch-sources.yml` run 39273087453 (job
   118130254101), 19 Oct 2026 14:54 UTC, tried
   `world.hyatt.com/content/gp/en/program-overview.html`,
   `/tiers-and-benefits.html`, `/rewards/free-nights-upgrades.html` and
   `/terms.html`. All four returned **HTTP 403**, Hyatt's bot wall
   ("We're sorry. Your browser did something unexpected", Error:E6020).
2. **Firecrawl** (`firecrawl_scrape`, `formats: ["markdown"]` only, no
   json/query/summary, Charter §6), 1 credit each:
   - program-overview.html: 200
   - rewards/free-nights-upgrades.html: 200
   - hyatt.com/help/terms/world-of-hyatt: 200
   - hyatt.com/explore-hotels/united-arab-emirates: 200, but the hotel list
     is rendered client-side and the markdown carried no hotels. **No UAE
     property count is published on the profile as a result.**

## 1. Programme overview — https://world.hyatt.com/content/gp/en/program-overview.html

Verbatim:

> You can earn up to 5 Base Points for every $1 USD you spend on qualifying nights, dining, spa experiences and more. Free nights start at just 3,000 points, which you could earn in a single stay.

> With Milestone Rewards, choose awards valuable to you or gift them to someone special—enjoy points for free nights, Club access or suite upgrades to enhance your stay or wellbeing experiences. Rewards begin after 20 qualifying nights and continue for each 10 qualifying nights, up to 150.

> You can earn a free night for every five unique brands you experience with a Brand Explorer Award.

> ## Discoverist
> Earn free nights faster with 10% Bonus Points on qualifying purchases
> Quench your thirst with a bottle of water daily
> Enjoy 2 p.m. late checkout, upon availability
> Stay connected with complimentary premium Internet where available
>
> ## Explorist
> Earn free nights faster with 20% Bonus Points on qualifying purchases
> Access upgraded rooms on qualifying nights, based on availability at check-in
> Enjoy 2 p.m. late checkout, upon availability
> Enjoy early access to award night inventory
>
> ## Globalist
> Earn free nights faster with 30% Bonus Points on qualifying purchases
> Enjoy room upgrades, up to standard suites
> Enjoy Club lounge access or complimentary breakfast
> Enjoy 4 p.m. late checkout, upon availability
> Enjoy early access to award night inventory

> There are four levels of membership.

> **POINTS** Only Base Points – and not Bonus Points – count towards earning tier status and benefits in the World of Hyatt program.

> | Membership Level | Nights | Base Points |
> | Member | N/A — Free to join | N/A |
> | Discoverist | 10 or | 25,000 |
> | Explorist | 30 or | 50,000 |
> | Globalist | 60 or | 100,000 |
> | Lifetime Globalist | N/A | 1,000,000 Lifetime Base Points |

## 2. Free nights and award chart — https://world.hyatt.com/content/gp/en/rewards/free-nights-upgrades.html

Verbatim:

> Enjoy free nights at Hyatt hotels and resorts (with no blackout dates in standard rooms). See our all-inclusive chart for using points at our all-inclusive resorts.

Standard-room tab, POINTS PER NIGHT (first of four tabs: STANDARD ROOM,
CLUB, STANDARD SUITE, PREMIUM SUITE):

```
| HOTEL CATEGORY | LOWEST | LOW | MODERATE | UPPER | TOP |
| 1 | 3,000 | 4,500 | 6,000 | 7,500 | 9,000 |
| 2 | 6,000 | 7,500 | 10,000 | 12,000 | 15,000 |
| 3 | 8,000 | 12,000 | 15,000 | 17,500 | 20,000 |
| 4 | 12,000 | 15,000 | 20,000 | 22,500 | 25,000 |
| 5 | 15,000 | 20,000 | 25,000 | 30,000 | 35,000 |
| 6 | 20,000 | 25,000 | 30,000 | 35,000 | 40,000 |
| 7 | 25,000 | 30,000 | 35,000 | 45,000 | 55,000 |
| 8 | 35,000 | 45,000 | 55,000 | 65,000 | 75,000 |
```

(The Club, Standard Suite and Premium Suite tables and the all-inclusive
A–F charts are on the same page and are not quoted on the profile.)

## 3. Programme terms — https://www.hyatt.com/help/terms/world-of-hyatt

Verbatim:

> (a) Inactivity. If a Member's account is inactive for twenty-four (24) consecutive months, all points in that Member's account will be forfeited at that time, but the Member's account will remain open (with the ability to earn new points thereafter) … Under no circumstances will forfeited points be reinstated. Active Members can remain active in the Program by (i) receiving points via authorized means, (ii) receiving credits with a partner in the Program for a stay at a Hyatt hotel or resort, (iii) redeeming points …

> 5. Base Points and Bonus Points; Eligible Rate. If a Member chooses to earn points for his/her stay, such Member will earn:
> - Five (5) points for each whole U.S. dollar or U.S. dollar equivalent spent by the Member on an Eligible Rate at any Point Property other than a Hyatt Studios hotel; or
> - Two and a half (2.5) points for each whole U.S. dollar or U.S. dollar equivalent spent on an Eligible Rate for a stay at a Hyatt Studios hotel.

> (c) Once points have been transferred to a partner program, they will no longer be available for use in the Program. All point conversions are final and non-reversible upon submission of the conversion request.

## 4. UAE cards (L2)

`src/data/cards.json` at 726a5cf: **no card** carries a `loyaltyProgram`,
`transferPartners` entry or any other field mentioning Hyatt. The page says
so and names no card.

## 5. Already-published sources reused

- Qatar Airways Global Points Exchange partner list (World of Hyatt is on
  it; conversion rate not stated), as published in
  `src/content/news/qatar-avios-transfer-bonus-uae-banks-31-october.mdx` and
  `src/content/programs/qatar-privilege-club.mdx`.
- New-hotel double-points offer:
  `news-source-world-of-hyatt-new-hotel-double-points-2026-10-13.md`.
