# Content roadmap

Launch content priorities, in execution order. Phase 4 writes the actual prose;
Phase 1.5 only commits to the slugs, the priority order and the angles.

Priority key: **1** = launch-blocker, **2** = launch-month, **3** = within 90
days. Word-count targets are minimums (HfP density, not TPG fluff).

---

## 1. Salary transfer (commercial-intent anchor)

### 1.1 Live tracker page (already shipped in Phase 1.5)

- URL: `/salary-transfer/`
- Status: live; reads `salaryTransferOffers` collection.
- Phase 4 task: replace the four illustrative skeleton offers with verified
  data scraped in Phase 2.

### 1.2 Per-bank deep-dives (8 articles)

| Slug | Bank | Primary keyword | Word target | Priority |
|---|---|---|---|---|
| `/salary-transfer/emirates-nbd/` | Emirates NBD | "emirates nbd salary transfer offer" | 1,800 | 1 |
| `/salary-transfer/adcb/` | ADCB | "adcb salary transfer offer" | 1,800 | 1 |
| `/salary-transfer/emirates-islamic/` | Emirates Islamic | "emirates islamic salary transfer" | 1,500 | 1 |
| `/salary-transfer/rakbank/` | RAKBANK | "rakbank salary transfer offer" | 1,500 | 1 |
| `/salary-transfer/fab/` | FAB | "fab salary transfer offer" | 1,500 | 2 |
| `/salary-transfer/mashreq/` | Mashreq | "mashreq salary transfer offer" | 1,500 | 2 |
| `/salary-transfer/hsbc/` | HSBC UAE | "hsbc uae salary transfer" | 1,200 | 2 |
| `/salary-transfer/dib/` | Dubai Islamic Bank | "dib salary transfer" | 1,200 | 3 |

Each article structure: hero offer summary, salary band table, requirements,
clawback in plain English, payout-timing reality (verify by phone), reader
reports, alternatives, source URLs.

### 1.3 Per-band landing pages (5)

- `/salary-transfer/aed-5000-to-8000/`
- `/salary-transfer/aed-8000-to-15000/`
- `/salary-transfer/aed-15000-to-30000/`
- `/salary-transfer/aed-30000-to-50000/`
- `/salary-transfer/aed-50000-plus/`

Each page: filtered tracker view + 600-800 words explaining what to expect at
that band, common employer constraints (e.g. AED 5k-8k = often blue-collar
WPS, salary-transfer offers thin), and the best play right now.

### 1.4 Calculator (already shipped in Phase 1.5)

Phase 4 polish: add tooltips for each input, document the 20% voucher discount
methodology in plain English, and add an "email me when a better offer drops
for my band" capture (depends on newsletter platform decision).

---

## 2. Cashback cards

### 2.1 Best-of comparison

- `/cards/cashback/`
- Primary keyword: "best cashback credit card uae"
- Word target: 2,500 (intro + 12 capsule reviews + comparison table)
- Priority: 1

### 2.2 Individual reviews (12)

| Slug | Card | Bank | Priority |
|---|---|---|---|
| `/cards/mashreq-cashback/` | Mashreq Cashback | Mashreq | 1 |
| `/cards/mashreq-noon/` | Mashreq noon | Mashreq | 1 |
| `/cards/fab-cashback/` | FAB Cashback | FAB | 1 |
| `/cards/fab-cashback-islamic/` | FAB Cashback Islamic | FAB | 2 |
| `/cards/adcb-365/` | ADCB 365 | ADCB | 1 |
| `/cards/adcb-talabat/` | ADCB Talabat | ADCB | 2 |
| `/cards/hsbc-live-plus/` | HSBC Live+ | HSBC UAE | 1 |
| `/cards/hsbc-cash-plus/` | HSBC Cash+ | HSBC UAE | 2 |
| `/cards/cbd-super-saver/` | CBD Super Saver | CBD | 2 |
| `/cards/citi-cashback/` | Citi Cashback | Citi UAE | 2 |
| `/cards/emirates-islamic-switch/` | Emirates Islamic Switch | Emirates Islamic | 3 |
| `/cards/rakbank-titanium/` | RAKBANK Titanium | RAKBANK | 3 |

Word target per card review: 1,500. Structure: hero + key stats + earn-rate
table + pros/cons + detailed review + eligibility + alternatives + last
verified.

---

## 3. Airline programme guides

| Slug | Programme | Word target | Priority |
|---|---|---|---|
| `/airlines/skywards/` | Emirates Skywards | 4,000 (full guide, tier breakdown, UAE-side earning, redemption sweet spots) | 1 |
| `/airlines/etihad-guest/` | Etihad Guest | 4,000 (same depth) | 1 |
| `/airlines/qatar-privilege-club/` | Qatar Privilege Club | 2,500 | 2 |
| `/airlines/saudia-alfursan/` | Saudia Alfursan | 1,800 (lighter) | 3 |

---

## 4. Points hacks pillar

UAE-specific content with no real UK / US-site equivalent.

| Slug | Topic | Word target | Priority | Dependencies |
|---|---|---|---|---|
| `/guides/uae-transfer-ratios-2026/` | UAE transfer ratio chart (ADCB → Skywards/Etihad, ADNOC → Etihad/Smiles, ENBD Plus → Skywards, Mashreq Salaam → Skywards/Etihad) | 2,000 | 1 | Phase 2 scrape of programme T&Cs |
| `/guides/card-stacking-by-category/` | Card stacking by spend category (which card to use for groceries vs dining vs travel) | 2,500 | 2 | At least 6 reviewed cards |
| `/guides/skywards-everyday-dubai-retailers/` | Skywards Everyday at Dubai retailers — earn rates, gotchas | 1,500 | 2 | None |
| `/guides/adcb-5x-strategy/` | ADCB 5x promotions strategy | 1,500 | 3 | None |

---

## Unique angles vs Money Luna

These are the differentiators we lead with — Money Luna doesn't cover any of
them in depth.

- **Clawback reality**. Phone every bank, document the responses, publish
  verbatim. Nobody else does this — it's the most reader-valuable angle.
- **Voucher resale value**. Secondary-market check (Carrefour vouchers on
  Dubizzle, etc). Justifies the 20% discount in our calculator.
- **Stacking salary transfer + card welcome bonus**. When does a combined
  offer beat the headline? Worked example with real numbers.
- **Expat-specific friction**. Visa change, job change, leaving UAE
  mid-tenure — clawback mechanics differ per bank, and nobody has documented
  it. This is a launch-month feature for the salary transfer pillar.
- **Premium tier game**. HSBC Premier, FAB Elite, ADCB Privilege — the cards
  that come with private banking access; what's the AED-cost of unlocking each
  tier and is the perk set worth it?

---

## Editorial cadence post-launch

- Salary transfer tracker: scraper-driven, weekly auto-refresh PR; manual
  review on Mondays.
- Card reviews: 1 new + 1 refresh per fortnight.
- Guides: 1 new pillar piece per month.
- Deals: opportunistic; weekly summary on Fridays if volume warrants.
- Newsletter (when platform chosen): weekly digest with salary-band-tagged
  segments.
