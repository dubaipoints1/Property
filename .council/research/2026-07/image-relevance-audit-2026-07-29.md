# Image relevance audit — 29 July 2026

Full pass over all **106 manifest entries** in `data/stock/manifest.json`,
checking each image against the page it actually serves: does the picture
depict what the article is about, and does it comply with the library's
own rules in `scripts/images/fetch-stock.ts` and Charter §10?

Method: every entry joined programmatically to its content source —
cards to `src/data/cards.json` (earn rates, perks, typed `_features`),
guides/news/deals/banks/programmes to their MDX frontmatter — then
screened for rule violations by query and alt text, then inspected
visually where the frame contents could not be inferred from the query.

The last step is the one that matters. Two of the five findings below
were invisible in the metadata and only appeared on looking at the
picture.

---

## Findings

### 1. Alcohol on a published guide — kill-list violation ⛔

**`guide-dubai-brunch-on-credit-card-discounts`**
Query: `Dubai brunch buffet champagne hotel`

The fetched photograph contains a **glass of wine** in the mid-ground and
a **champagne bottle in an ice bucket** behind it. `fetch-stock.ts` states
the rule plainly:

> Alcohol: wine / cocktail / champagne glasses, bar scenes — even
> incidental table-setting glassware. UAE-market publication.

The query itself asked for champagne, so this was not a stray result — it
was requested. Live on the site until this audit.

**Action taken:** re-fetched on `brunch table spread food overhead
daylight`. The guide is about card discounts on brunch; the food is the
subject, and the drink was never load-bearing.

### 2. Mosques as commercial product-page headers — ruling requested ⚠️

Three Islamic-bank hub pages are headed by photographs of actual places
of worship:

| Slug | What the image shows | Alt text |
|---|---|---|
| `bank-adib` | **Sheikh Zayed Grand Mosque**, Abu Dhabi | "Modern Abu Dhabi Islamic architecture" |
| `bank-dib` | A full neighbourhood mosque, minarets and domes | "Modern Islamic architecture in Dubai" |
| `bank-emirates-islamic` | A mosque entrance bearing the **Shahada** | "Islamic geometric architectural pattern detail" |

The library rule permits this:

> Mosques are acceptable on Islamic BANK hub pages only, where the
> established context is respectful, not promotional.

But a bank hub page **is** promotional — it lists credit cards with
annual fees and apply links. The Emirates Islamic image places the
Islamic declaration of faith directly above a product grid.

**This is a Chairman call, not an editor's.** Recommendation: replace all
three with non-figurative Islamic geometric pattern, contemporary
architecture, or the bank's own district — imagery that reads as cultural
context rather than religious endorsement of a commercial offer. The
thematic link to Islamic banking survives; the sanctity problem does not.

**Fixed regardless:** the `bank-emirates-islamic` alt text describes a
"geometric architectural pattern detail". The image is a mosque facade
with Arabic calligraphy. That is a factual error in an accessibility
attribute and is corrected independently of the ruling above.

### 3. An image promising a benefit the card does not have ⛔

**`card-adcb-essential-cashback`**
Query: `cinema popcorn movie tickets flat lay`

Card data: `perks: []`, `_features: []`, `earnRates: { everythingElse: 1 }`.
There is **no cinema benefit on this card** — no BOGO, no entertainment
multiplier, nothing. The image invents one.

This matters more than a loose match. A reader scanning the card grid
reads the picture as a claim about the product, and this is the same card
that triggered the **2026-05-29 emergency §10 correction** for promoting
a wrong FX figure as a selling point. It should not also be carrying a
picture that oversells it.

**Action:** re-fetch to everyday-spend imagery matching a flat-rate card.

Contrast — two cards where the same check *passed*, and the images stay:

- `emirates-nbd-go4it-platinum` (cinema auditorium) — genuinely carries
  "Buy 1 Get 1 free at VOX Cinemas" and the typed `cinema_bogo` feature.
- `emirates-nbd-go4it-gold` (Dubai Metro station) — genuinely carries Nol
  card functionality and the typed `transit_card` feature.
- `cbd-one` (streaming at home) — perks explicitly list Netflix, Spotify
  and cinemas.

### 4. An image pointing at the wrong benefit ⚠️

**`card-fab-elite`**
Query: `luxury watch boutique storefront mall`

Actual perks: free access to 60+ **beach clubs, gyms and sports centres**
via ADV+, up to 40% off **hotel restaurants**, lifestyle concierge, valet
parking. Luxury retail is not among them.

The image points readers at a benefit the card does not offer while
ignoring the one it leads with.

**Action:** re-fetch to leisure/wellness imagery.

### 5. Generic scenery where the card has a specific story ⚠️

**`card-rakbank-world`**
Query: `dubai marina promenade evening`

The card's entire proposition is **10% cashback on supermarket, dining and
travel**, each capped monthly. A marina promenade says none of that. Not
wrong, but it wastes the slot — and RAKBANK's own hub image is already
`Al Marjan Island Ras Al Khaimah resort aerial`, so the pair reads as two
scenery shots rather than a bank and a product.

**Action:** re-fetch to one of the three earning categories.

---

## What passed

The other 101 entries are sound, and most are well-targeted rather than
merely inoffensive:

- **Earn-rate matching is genuinely good.** `adcb-365-cashback` (dining 6%)
  → barista; `emirates-islamic-switch-cashback` (fuel 8%) → petrol
  station; `adcb-lulu-platinum` (shopping 8%) → supermarket produce;
  `sc-platinum-x` (online 10%) → contactless mobile checkout.
- **Co-brands point at the right partner.** Emaar cards → Downtown Dubai
  and Dubai Mall; Marriott cards → hotel rooms scaling with tier
  (`world` → boutique king room, `world-elite` → suite with infinity
  pool); Skywards Infinite → A380 business suite; Manchester United →
  floodlit stadium.
- **Religious-architecture screening is otherwise clean** — no mosque
  imagery on any card product page, which is what the rule most cares
  about.
- **Alcohol screening is otherwise clean** — one hit across 106 entries,
  and dining queries generally follow the "daytime / casual / food-
  forward" guidance already (`hsbc-live-plus` → "friends lunch restaurant
  daytime casual").

## Noted, not actioned

- **Skyline repetition in the expat-starter series.** `guide-expat-starter`
  (Dubai skyline aerial), `-avoid-mistakes` (Dubai Marina aerial) and
  `-banking-basics` (DIFC skyscrapers at sunset) are three aerial city
  shots inside one linked series a reader moves through in order. Each is
  defensible alone; together they read as filler. Worth differentiating
  when the series is next refreshed.
- **Supermarket saturation.** Seven entries use a supermarket or
  hypermarket interior (`citi-cashback`, `dib-consumer-cashback`,
  `adcb-lulu-platinum`, `emirates-nbd-lulu-247-platinum`,
  `-lulu-247-titanium`, `share-visa-signature`, plus a news story). All
  are individually correct — grocery earn rates are genuinely the story
  on each — but replacements should avoid adding an eighth.
- **`card-adcb-lulu-titanium-gold`** (petrol pump) sits on a LuLu
  co-brand, where a reader might expect the supermarket. Defensible: fuel
  at 2% is the card's top published rate, and the supermarket slot is
  already taken by its sibling. Left as is.

---

## Outcomes — all four actionable findings fixed and visually verified

| Slug | Was | Now | Rounds |
|---|---|---|---|
| `guide-dubai-brunch-…` | Wine glass + champagne bucket | Overhead brunch spread, no glassware | 1 |
| `card-adcb-essential-cashback` | Cinema popcorn + tickets | Unbranded card at a shop terminal | 1 |
| `card-fab-elite` | Luxury watch boutique | Premium gym interior | 2 |
| `card-rakbank-world` | Marina promenade at evening | Market produce close-up | 2 |

Every replacement was opened and looked at before acceptance. Two
needed a second round, and **both second rounds were forced by
geography, not by topic** — see below.

### The lesson worth keeping: subject match is not relevance

The first `card-fab-elite` replacement was a resort pool with sun
loungers. Perfectly on-topic for a beach-club perk — and visibly
tropical, all thatched palapas and casuarina trees. It implied overseas
leisure travel to readers of a Dubai-first publication.

The first `card-rakbank-world` replacement was worse: a couple loading
groceries into a car boot, both in **padded winter coats** under a grey
sky in a concrete car park. Correct subject. Wrong hemisphere.

Neither failure was detectable from the query, the alt text, or the
topic mapping. Both required looking. The rule is now written into
`fetch-stock.ts` beside the alcohol and religious-architecture rules,
and into the AI art-direction SOP §3:

> Snow, bare deciduous trees, overcast European light and cold-weather
> clothing all break a Dubai-first publication. Check the background,
> the sky, and what people are wearing — not just the subject.

A second rule joined it: the library is **object-led**. The car-park
image put two faces front-and-centre in a grid of still-life, and read
as downmarket next to its neighbours.

---

## Round 2 — the GCC/UAE pass

The first round screened by rule and topic, and inspected only where
those flagged something. On owner direction ("keep it GCC UAE based;
understand the context of the article") a second pass ran specifically
for **place**.

Scale of the exposure: **60 of 106 entries carry no place anchor** in
their query or alt text. Over half the library was topically verified
but geographically unverified — including images this audit had already
passed in round 1.

### Found and fixed

**`card-adcb-talabat` — a competitor's branding on a co-brand card.**
The rider's delivery box read **"99 food"**, a Latin American delivery
brand, on the review page for the **ADCB Talabat** card. Talabat is the
UAE incumbent. Beyond geography, this illustrated a co-brand product
with its rival's mark. Replaced with an unbranded takeaway meal.
(First replacement was rejected too — brand-clean and place-neutral,
but dim and murky, failing the tile-legibility rule.)

**`programme-accor-all` — Bali, alcohol signage, and swimwear.** A
Balinese resort with thatched pavilions, a **"HAPPY HOUR"** sign on the
swim-up bar, and swimmers in frame. Three separate problems in one
image, live on a programme page. Replaced with a graphic warm-stone
hotel facade — also the only hotel *exterior* in a library otherwise
full of hotel interiors.

**`card-fab-elite` — corrected, over-corrected, then reverted.** The
gym interior accepted earlier the same day had bare trees and iced
water visible through its glass wall. Attempting to fix it object-led
produced rusty 5kg plates that read budget-municipal on a card selling
concierge and valet; a third attempt returned a spa with two people in
swimwear and a **Russian-language** display. The wide gym interior was
restored and its minor window accepted. Recorded because the churn was
avoidable: the fix traded a small flaw for larger ones.

### Noted, not actioned

`card-emirates-nbd-diners-club` shows empty stemware, blurred, in the
background of a mezze spread. The kill-list names "even incidental
table-setting glassware", but the drink in shot reads as ayran and the
subject is unambiguously food. Flagged as borderline rather than
churned — a judgement to confirm at the next standards review.

---

## Round 3 — brand identity

On owner direction ("what brand or name is it… context and what it is
is important, can't be random"), a third pass checked whether every
brand-specific page shows the **named brand**.

This is the worst failure mode in the set, because it looks fine until
you read the livery.

### Found

**`news-etihad-fare-sale-book-by-31-july-2026` was a Lufthansa
aircraft.** An A350-900 named *Dortmund*, German registration, crane
tail, parked at **Munich** T2 (gates 255/256 visible) — illustrating an
**Etihad** fare sale. A European competitor at a European hub on a UAE
carrier's story. Replaced with a genuine Etihad A380 (A6-APF).

**`card-emirates-nbd-etihad-guest-inspire` was a byte-identical
duplicate** of `programme-etihad-guest` — the same photograph doing two
jobs on two pages. Correct brand, but duplicate images across pages
read as a template rather than a publication. Confirmed by hashing the
whole library; it was the only duplicate pair in 106 files.

**`card-fab-etihad-guest-infinite` showed no airline at all.** A dark
night shot through a terminal window, heavy orange flare, an
unidentifiable white aircraft at a stand — on a premium **Etihad**
co-brand. It failed twice over: no Etihad marking anywhere in frame,
and far too dark to read at tile size. Replaced with an Etihad 787
Dreamliner (A6-BNB) in standard livery against blue sky.

Together with round 2's `card-adcb-talabat` — a **"99 food"** box, a
Latin American delivery brand, on the **Talabat** co-brand card — that
is four brand-identity failures, none of which any metadata check
could have caught.

The four Etihad-facing pages now carry four *distinct* Etihad
aircraft: the F1 787 (A6-BLV) on the programme, the A380 (A6-APF) on
the fare-sale story, the "Choose Thailand" 787 (A6-BLO) on Inspire, and
the standard-livery 787 (A6-BNB) on FAB Infinite.

### Verified correct, and worth recording as such

Spot-checking the brand-critical set found the rest sound:

| Page | Shows | Verdict |
|---|---|---|
| `programme-skywards` | Emirates 777, full livery | ✅ |
| `programme-etihad-guest` | Etihad 787, F1 Abu Dhabi livery | ✅ |
| `programme-qatar-privilege-club` | Qatar Airways 777 | ✅ |
| `card-emirates-nbd-skywards-infinite` | Emirates A380 | ✅ |
| `programme-marriott-bonvoy` | Gulf luxury lobby — mashrabiya screens, palms, sea | ✅ |

### The rule

Written into the `fetch-stock.ts` kill-list:

> A named page must show the named thing. Check the tail, the fascia,
> the delivery box, the shopfront — anything carrying a mark. A
> competitor's mark on a co-brand page is worse than a generic image:
> it is not merely irrelevant, it is wrong about the product.

Plus a duplicate check — `md5sum public/images/stock/*.jpg` — since
nothing else surfaces a shared file.

### Still unverified

Rounds 2 and 3 inspected the highest-risk entries, not all 60
place-unanchored ones. Category coherence (does a hotel page show a
hotel, an airline page an aircraft) held everywhere it was checked, but
"checked" is not "all". The remainder is real outstanding exposure.

## Method note for the next audit

Metadata screening caught findings 1, 3, 4 and 5 — query text against
earn rates and typed perks is cheap and effective, and should run first.

It did **not** catch finding 2. The `bank-emirates-islamic` alt text
claimed a geometric pattern; only opening the file showed a mosque
entrance carrying the Shahada. Alt text describes what the fetcher was
*asked* for, not always what arrived. Any image whose subject carries
editorial risk — religious, alcohol, people, landmarks — has to be
looked at, not read about.
