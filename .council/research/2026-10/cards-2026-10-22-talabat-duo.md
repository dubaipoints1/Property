# Source check — ADCB talabat and Emirates NBD Duo earn rates (22 October 2026)

Two card reviews disagreed with their L2 entries in `src/data/cards.json`.
Each was settled against the issuer's own product page.

**Channel.** The free reader came first: `fetch-sources.yml` run 39762466135
(22 October 2026). ADCB returned a Cloudflare block (HTTP 403, "Sorry, you have
been blocked"). Emirates NBD returned HTTP 200 but only site navigation, because
the page body is rendered client-side. Both pages were then read with Firecrawl
`firecrawl_scrape`, markdown only, `maxAge: 0` (2 calls, 1 credit each). Every
figure below is quoted from that markdown. Nothing was LLM-extracted (Charter §6).

---

## 1. ADCB talabat Credit Card (`adcb-talabat`)

URL: https://www.adcb.com/en/personal/cards/credit-cards/talabat-credit-card.aspx
Read: 22 October 2026, Firecrawl scrapeId `01a16322-87a0-736f-a187-72a703a73d4c`

Quoted, "Earn talabat credit on talabat orders & other purchases":

> 35% back as talabat credit on the first 10 talabat orders placed each calendar
> month. Each order is capped at AED 35, with a cumulative limit of AED 350 per
> month. All additional talabat orders within the same month will earn 1.25% as
> talabat credit. A minimum monthly retail spend of AED 2,500 is required to be
> eligible to earn 35% back as talabat credit on talabat orders. If the minimum
> spend criteria is not met in any given month, 1.25% back as talabat credit will
> be applicable to all talabat orders for that particular month.

> 0.35% back as talabat credit on domestic retail purchases from categories such
> as fuel, education, government services, real estate, telecommunications,
> charity, transport, supermarkets, auto dealers, and insurance.

> 0.35% back as talabat credit on all domestic and international retail purchases
> made at merchants in the United Kingdom and Europe (i.e., countries that are part
> of the European Economic Area). The classification of merchants based in the
> European Economic Area will follow prevailing MasterCard guidelines.

> 1.25% back as talabat credit on other domestic and international retail
> purchases, whether made within the UAE or outside the UAE.

> talabat credit for all eligible purchases in a month shall be credited to
> talabat Pay account in the first week of upcoming month.

Welcome bonus:

> Up to AED 750 welcome Bonus — as talabat credit upon achieving a minimum spend of
> AED 5,000 in 45 days

> Primary Cardholders having an existing ADCB Credit Card or ADCB Islamic Credit
> Card will be eligible for AED 200 welcome bonus as talabat credit.

> The Welcome Bonus is a one-time reward and will be credited to the primary
> cardholder's talabat Pay account within 90 days of card issuance

Network (lounge section and benefits section):

> Download the "Mastercard Travel Pass" app ... & register your card before
> traveling.

> If you do not make an international transaction, you will not be able to access
> the airport lounge unless you make a payment of USD 32 on your Mastercard card.

> Enjoy 4 complimentary visits to at 25+ airport lounges worldwide for you and your
> supplementary cardholders.

talabat pro:

> Your talabat ADCB Credit Card gives you a free subscription to talabat pro

Eligibility:

> You should be at least 18 years old
> You need to have a minimum salary of AED 5,000 or be eligible for a credit limit
> of at least AED 3,500

Fee: "Free for life — no annual fee, ever".

### Finding

- **The review was wrong** to say ADCB publishes no accelerated talabat rate and
  that 1.25% is the single rate. The page publishes 35% on the first 10 talabat
  orders a month (AED 35 per order, AED 350 a month, AED 2,500 monthly spend
  condition) and 0.35% on ten everyday categories and UK/EEA merchants.
- **L2 was wrong too.** `earnRates.everythingElse: 1` with `earnUnit: "Talabat Pro
  per AED 1 spent"` matches nothing on the page. "talabat pro" is the free
  delivery **membership** bundled with the card, not a points currency, so there is
  no "Talabat Pro" unit and ADCB states no value for one. The reward currency is
  **talabat credit**, which ADCB denominates in dirhams throughout ("up to AED 35
  per order as talabat credit", "AED 750 welcome bonus as talabat credit"). The page
  does not print an explicit "1 talabat credit = AED 1" line; the AED denomination
  is the basis for valuing it at face.
- **Network**: L2 and the review said Visa. The page's own terms (Mastercard Travel
  Pass registration, "your Mastercard card", EEA classification under "MasterCard
  guidelines") make it a Mastercard.

### Changed

L2 `adcb-talabat`: `earnRates` (partnerBrands 35, with the AED 35 per order and AED 350 per month caps stated in `earnUnit`, not as a typed `_caps` block, because the calculator models no partner-brand spend and `tests/calculator/caps-breakeven.test.ts` rejects a typed cap it cannot reach;
everythingElse 1.25; supermarkets, autoDealers, insurance, fuel, education,
government, realEstate, telecom, charity, transport and europe 0.35), `earnUnit`,
`loyaltyProgram` ("talabat credit"), `network` ("Mastercard"),
`welcomeBonus.spend_threshold_aed` 5000 and `qualify_window_days` 45, `lastVerified`
2026-10-22. All marked `editor-corrected`. L3 `adcb-talabat.mdx` rewritten to match.
The no-annual-fee guide's table row, which quoted "1 Talabat Pro point per AED 1,
per our data", now quotes the page.

---

## 2. Emirates NBD Duo Credit Cards (`emirates-nbd-duo`)

URL: https://www.emiratesnbd.com/en/cards/credit-cards/duo-credit-cards
Read: 22 October 2026, Firecrawl scrapeId `01a16322-8781-752b-806b-fca542126818`

> 5% Plus Points on grocery, electronics, utilities, education and fuel\*
> 0.5% Plus Points on other spends including travel, dining, hotels and online

> \* Effective 5th April 2025:
> A minimum monthly spend of 5,000 per statement is required to earn 5% Plus
> Points on Grocery, Electronics, Utilities, Education and Fuel categories. If the
> minimum monthly spend is not met, you will earn 1.5% Plus Points.
> For all other categories, 0.5% Plus Points will continue to remain applicable.
> Maximum Plus Points per statement will be capped at 500.

Also on the page: "Minimum salary: 12,000", "Exclusive for Abu Dhabi residents",
"Exclusive current offer: No Annual Fees".

### Finding

**L2 is right, the review was wrong.** Below the AED 5,000 monthly spend the
**bonus categories** earn 1.5%; other spend earns 0.5% whether or not the threshold
is met. The review had it inverted in five places ("0.5% on bonus categories and
1.5% on the rest").

### Changed

L3 `emirates-nbd-duo.mdx` only: the con, the editorTake, the HotTip, the
conditions list and the watch-out item. No L2 change.

---

## 3. Emirates NBD LuLu 247 Platinum: comparison table (no change)

The Platinum-vs-Titanium table in `emirates-nbd-lulu-247-platinum.mdx` matches L2
for both cards: minimum salary AED 5,000 / AED 12,000; LuLu 3.5% / 7%; fuel 2% / 4%;
utilities 1% / 2%; other 0.35% / 0.7%; Titanium free for life, Platinum AED 262.50 a
year and AED 525 to join. The ENBD Platinum page body was not readable through the
free reader (client-rendered) and was not re-scraped, so this is an L2/L3
consistency check, not a fresh source check.
