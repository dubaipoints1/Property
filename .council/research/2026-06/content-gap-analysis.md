# Content-gap analysis — what the competitors publish that we don't

_Author: head-of-research. Commissioned by site owner, 2026-06-10:
"Competitor analysis — what's MISSING?" Content-gap scope only;
visual patterns were closed out by the 2026-05-21 teardown and the
6 June audit._

**Method:** No fresh scrapes (agent-runtime network is allowlist-
blocked). Walked the archived raw scrapes at
`.council/research/2026-05/raw/` (TPG homepage URL census ~64 KB, UP
homepage JSON, HfP homepage, OMAAT homepage, guides cross-competitor
notes) plus `page-type-structural-matrix.md`, and scored against the
live inventory in `src/content/` + `src/pages/` and the planned
taxonomy in `.council/04_content_taxonomy.md`.

---

## Site inventory as of 2026-06-10 (shipped)

| Collection / route | Count | Notes |
|---|---|---|
| `/cards/` reviews | 55 | + category pages (cashback, miles, islamic), compare tool, finder |
| `/banks/` hubs | 12 | |
| `/guides/` | 16 | expat-starter pillar + 6 spokes; transfer ratios; Skywards redemptions; DSF; Ramadan iftars; brunch; AECB; corporate tax; Golden Visa cards; eligibility; salary-transfer mechanics |
| `/airlines/` programmes | 4 | Skywards, Etihad Guest, Qatar Privilege Club, Marriott Bonvoy |
| `/news/` | 5 total | All May–June 2026; ~1/week effective cadence |
| `/deals/` | 1 | ENBD Skywards welcome Q2 2026 |
| Salary-transfer | tracker + calculator + 3 live offers + 2 archived | The live-product differentiator |
| Tools | compare, finder, 2 calculators | |
| `/best-of/` | directory page only | 5 "live" entries link to existing category pages; 3 entries marked "coming next quarter"; zero standalone roundup articles |
| Trust layer | 12+ pages | about, team, editorial-policy, how-we-score, valuations + methodology, corrections, press, glossary, etc. — **at or above competitor parity; not a gap** |

## Competitor content-type census (from raw scrapes)

- **TPG** (`raw/tpg-homepage.md` URL census): verticals `/news/`
  (multiple posts daily), `/credit-cards/` incl. a **`/best/`
  listicle library** (best for retirees, best starter travel cards,
  "credit cards you shouldn't have"), **standalone X-vs-Y comparison
  pages** (Amex Platinum vs Gold; CSR vs CSR-for-Business; Atmos
  Summit vs Citi Globe), `/loyalty-programs/` (monthly valuations
  hub, **current-transfer-bonuses live page**, per-programme
  transfer-partner pages, beginners hub, when-to-buy-points),
  `/airline/` (cabin **reviews** + practical guides: baggage fees,
  lounge guides, PreCheck/Global Entry, family seating), `/hotel/`
  (**hotel reviews** + best-of-chain listicles), `/cruise/`,
  `/travel/`, `/travel-gear/`, `/deals/` (deal-of-the-day), tools
  (CardMatch, TSA wait times, calculator), multiple newsletters.
- **UP** (`raw/upgradedpoints-homepage.json`): daily `/news/`;
  `/credit-cards/` split into `reviews/`, `guides/`, `best/`, and
  **facet category pages** (travel-rewards, sign-up-bonuses,
  lounge-access, military, business); `/travel/` hubs for hotels +
  airlines + practical how-tos; loyalty-programme reviews; ~26-author
  roster; trust pages (rating methodology, advertising policy).
- **HfP** (`raw/hfp-homepage.md`): ~3 news posts/day river;
  product-anchored clusters; **comparison guides as a first-class
  genre** ("What is the best Avios business credit card?", "free
  hotel elite status from UK cards"); reader forum.
- **OMAAT** (`raw/omaat-homepage.md`): 5-category IA — News (several
  daily) · Guides · **Deals** · Insights · **Reviews** (airline
  cabins, hotels, lounges, trip reports); archive browse by
  airline/airport/aircraft/bank/hotel/programme.

---

## Ranked gap list

| # | Gap | What competitors have | Our equivalent | UAE relevance | Effort |
|---|---|---|---|---|---|
| 1 | **News cadence** | TPG/UP/OMAAT: several posts/day; HfP: ~3/day, homepage is the news river | 5 posts total (~1/week) | **High** — return-visit flywheel; UAE bank/airline news is uncontested in English | Content-only |
| 2 | **Standalone "best of" roundups** | TPG `/credit-cards/best/` library (best for retirees / starters / lounge / shouldn't-have); UP `best/` | `/best-of/` is a link directory to category pages; 3 roundups "pending"; zero real listicle articles | **High** — "best credit card UAE / best cashback card UAE" are the head terms | Content-only (Phase 2a.5 recipe already written) |
| 3 | **Hotel loyalty programme pages** | TPG + UP cover Hilton, Hyatt, IHG, Accor as dedicated programme pages + best-property listicles | 1 of 4+ (Bonvoy only). Own taxonomy already promises Hilton Honors, World of Hyatt, Accor ALL tags | **High** — Accor + Hilton density in Dubai is among the world's highest; redemption math in AED is uncovered | Content-only (programs collection exists) |
| 4 | **Deals river** | OMAAT Featured Posts = hot deals; TPG deal-of-the-day; HfP deal posts with "Is this a good deal?" verdict | 1 deal post | **High** — DSF, Ramadan, summer promos, transfer bonuses are seasonal UAE staples | Content-only (template recipe exists, Phase 2a.7) |
| 5 | **Lounge reviews + airport practical guides** | TPG `/airline/` lounge guides + reviews; OMAAT Reviews category | None. Taxonomy names DXB Concourse A/B/C, Marhaba, Al Mourjan as a beat | **High** — every premium card review asserts lounge value we've never tested; DXB queries are local-intent gold | Needs-schema (new collection or guides sub-type) |
| 6 | **Static X-vs-Y comparison pages** | TPG runs them as SEO pages; HfP as comparison guides | Compare tool exists; zero static pages | **Medium-high** — "Skywards Infinite vs Etihad Guest Inspire" class queries | Needs-engineering (route) — Phase 2a.4, demand-validated |
| 7 | **Transfer-bonus tracker page** | TPG `current-transfer-bonuses` live page | `topic:transfer-bonus` tag only | **Medium-high** — second "live product" alongside salary-transfer tracker | Needs-schema |
| 8 | **Airline programme expansion** | Competitors cover every programme their readers can earn into | 3 airline programmes. Missing: Saudia Alfursan (promised in own taxonomy), Avios-earn-in-UAE guide, flydubai-within-Skywards, Air Arabia Rewards, Wizz | **Medium** | Content-only |
| 9 | **Beginners hub page** | TPG points101; UP guide library; OMAAT "New to OMAAT?" block | expat-starter pillar + points-101 spoke exist; no single hub IA | **Medium** | Content-only |
| 10 | **Hotel property reviews (on points)** | OMAAT/TPG hotel reviews | None; taxonomy names 11 Dubai properties | **Medium** — supports #3; costly to do honestly | Needs-schema + budget |
| 11 | **Monthly valuations cadence** | TPG monthly-valuations hub, re-dated monthly | `/valuations/` exists, no stated refresh rhythm | **Medium** | Content-only |
| 12 | **Insights / opinion genre** | OMAAT Insights category | Editor takes live inside reviews only | Low-medium | Content-only |
| 13 | **Cruise vertical** | TPG `/cruise/` | None | Low-medium (Dubai cruise season exists; off-beat) | Out of scope for now |
| 14 | **Trip reports** | OMAAT signature | None | Low — already ruled out of scope (matrix, page-type H) | n/a |
| 15 | **Travel gear** | TPG `/travel-gear/` | None | Low — affiliate-driven genre, off-brand per Charter §5 | n/a |
| 16 | **Comments / forum** | HfP forum + comments; OMAAT threaded comments | None | Medium (engagement, not content) | Needs-engineering — already Tier B #13 in teardown |

**Not gaps:** trust layer (we exceed UP, the best of the four),
salary-transfer tracker (no competitor has an equivalent live
product), Islamic-cards category (unique to us), AED-first pricing.

---

## Top-5 recommendation

1. **News cadence to 3–5/week (gap #1).** Cheapest compounding
   asset; the HfP homepage model we already adopted assumes a news
   river we aren't feeding. UAE bank/loyalty news has effectively no
   English-language competition.
2. **Ship 3 real best-of roundups (gap #2).** The `/best-of/` page
   already promises three "coming next quarter" — entry-level
   (AED 5–8k), premium (AED 30k+), premium-cabin programmes. The
   listicle recipe is written; 55 card reviews provide the raw
   material. Highest SEO ceiling per hour spent.
3. **Hilton Honors + Accor ALL programme pages (gap #3).** Our own
   taxonomy promises them; Dubai's hotel mix makes them more relevant
   to our reader than to TPG's. Unlocks hotel-redemption guides.
4. **Deals cadence (gap #4).** One post in a `/deals/` vertical reads
   as abandoned. Eid Al Adha + summer promos are imminent; HfP's
   opinionated deal template is ready to apply.
5. **DXB lounge review series (gap #5).** Uncontested local niche,
   verifies the lounge-value claims in our premium card reviews, and
   is the natural first "Reviews beyond cards" genre — far cheaper
   than cabins or hotels.

Gaps 6–7 (vs-pages, transfer-bonus tracker) are the strongest
needs-engineering candidates for Q3 once 1–5 establish cadence.

## Sources

All in-repo, accessed 2026-06-10: `.council/research/2026-05/raw/
{tpg-homepage.md, upgradedpoints-homepage.json, hfp-homepage.md,
omaat-homepage.md, guides-pagetype-cross-competitor.md}`,
`.council/research/2026-05/{competitor-teardown.md,
page-type-structural-matrix.md}`, `.council/04_content_taxonomy.md`,
`src/content/**`, `src/pages/**`.

## Open questions for the editors

- Per-band salary-transfer landing pages (taxonomy promises 5) — not
  verified live in this pass; Managing Editor to confirm.
- Cruise: does the Aroya/MSC Dubai homeport season justify a single
  seasonal guide rather than a vertical? Lifestyle & Culture call.
- Lounge reviews need a site-visit budget decision (Chairman) before
  a schema is designed.

## Last verified
2026-06-10
