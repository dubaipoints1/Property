# Content Taxonomy

_Categories, tags, pillar pages, and routing rules. The taxonomy is
load-bearing — it dictates URLs, internal linking, schema breadcrumbs,
and search facets. Changes go through the Chairman._

---

## Top-level verticals (route segments)

The site has **five top-level content verticals**, mapped 1:1 to
section-editor beats and to URL prefixes:

| URL prefix | Vertical | Section editor | What lives here |
|---|---|---|---|
| `/cards/` | Credit cards | Travel & Experiences (with Business & Real Estate cross-coverage on premium cards) | Card reviews, comparison hubs, "best of" curated lists, category pages (cashback, miles, Islamic) |
| `/airlines/` | Loyalty programmes | Travel & Experiences | Programme deep-dives, transfer-partner matrices, sweet-spot redemption guides |
| `/banks/` | Bank hubs | Business & Real Estate | One hub per bank — card lineup, current offers, salary-transfer position, reputation |
| `/salary-transfer/` | Salary-transfer tracker | Business & Real Estate | Live tracker, calculator, per-band landing pages, individual offer pages, history archive |
| `/guides/` | Evergreen long-form | All three section editors by topic | Pillar guides and spoke articles. Cornerstone: `/guides/expat-starter/` |

**Two horizontal verticals** cut across:

| URL prefix | Vertical | Owner | Notes |
|---|---|---|---|
| `/deals/` | Deals & lifestyle promotions | Lifestyle & Culture | Time-bound, expiry-sorted. May contain inline merchant promo codes. **No `/promo-codes/` directory.** |
| `/news/` | Daily news archive | Managing Editor (rota) | Mirror of homepage news; topic tags reference the verticals above. |

**Trust pages** are top-level, owned by Chairman + Fact-Checker:
`/about/`, `/team/`, `/editorial-policy/`, `/how-we-make-money/`,
`/valuations/` (with `/valuations/methodology/`).

**No `/promo-codes/` and no `/blog/`.** Promo codes live inside deals
posts as inline merchant codes. There is no generic blog — every
article belongs to a vertical.

---

## Section-editor beat assignments

### Travel & Experiences Editor

- All `/airlines/*` pages.
- All `/cards/*` reviews where the dominant earn category is travel,
  miles, or co-brand with an airline / hotel programme.
- Cross-write into `/guides/` for: redemption sweet spots, status
  matches, lounge access, airport navigation (DXB, AUH, DWC), points
  hacks pillar.

**Beat boundaries** (from PLAN.md, refined):

- **Loyalty programmes:** Emirates Skywards, Etihad Guest, Qatar
  Privilege Club (Avios), Saudia Alfursan, plus international
  programmes used by UAE residents (Marriott Bonvoy, Hilton Honors,
  World of Hyatt, Accor ALL).
- **Hotel coverage:** Dubai property focus — Atlantis, Address, Bulgari,
  Burj Al Arab, Five, Mandarin, Palace, One&Only, Raffles, Royal
  Mirage, Waldorf Astoria. Plus regional flagship properties readers
  redeem points at: Doha, Riyadh, Abu Dhabi.
- **Attractions:** Burj Khalifa, Museum of the Future, IMG, Global
  Village (seasonal), Aquaventure, View at the Palm, Ain Dubai,
  desert experiences, dhow cruises.
- **Lounges:** DXB Concourse A/B/C, Marhaba, Al Mourjan (transit),
  Skywards lounges by tier.
- **Card categories owned:** travel, co-brand, premium-tier (Infinite,
  World Elite, Reserve when locally issued).

### Business & Real Estate Editor

- All `/banks/*` hub pages.
- All `/salary-transfer/*` tracker, calculator, history, per-band
  pages, and per-bank deep-dives.
- All `/cards/*` reviews where the dominant story is salary-transfer
  eligibility or cashback monthly mechanics.
- Cross-write into `/guides/` for: Golden Visa, freezones (DMCC,
  IFZA, Meydan, JAFZA), DLD property data, off-plan vs ready,
  mortgages (resident and non-resident), corporate tax, VAT, banking
  for new arrivals.

**Beat boundaries:**

- **Banking:** all 11 priority banks listed in PLAN.md Phase 2.
- **Real estate:** DLD, off-plan launches, secondary market, master
  developers (Emaar, Damac, Nakheel, Meraas, Aldar, Sobha), property
  finance.
- **Visa & residency:** Golden Visa (10-year), Green Visa (5-year),
  property-investor visa, freelance permits.
- **Tax:** corporate tax (9% for ≥AED 375k profit), VAT (5%),
  international tax-residency interactions.
- **Card categories owned:** cashback, salary-transfer-required,
  Islamic.

### Lifestyle & Culture Editor

- All `/deals/*`.
- All `/cards/*` reviews where the dominant story is lifestyle
  (dining BOGO, cinema, entertainer, retail).
- Cross-write into `/guides/` for: dining (Michelin Guide UAE, brunch
  culture), DSF, Ramadan iftars, beach clubs, expat onboarding,
  schooling, healthcare navigation, weather-driven seasonal content.

**Beat boundaries:**

- **Dining:** Michelin Guide UAE entries, brunch venues, iftar venues
  during Ramadan, top-end and accessible-end coverage.
- **Events calendar:** Dubai Shopping Festival, Dubai Food Festival,
  Eid Al Fitr, Eid Al Adha, UAE National Day (2 December), New Year's
  Eve, Art Dubai, Dubai International Film Festival.
- **Lifestyle services:** beach clubs (Soul, Twiggy, Cove), gyms,
  schools (KHDA-rated), clinics (DHA-licensed).
- **Card categories owned:** dining, lifestyle, shopping (where
  cashback is not the lead).

---

## Pillar pages and hub-spoke architecture

Pillar pages are evergreen, ≥2,000 words, refreshed quarterly. Each
pillar links down to spokes; spokes link up to the pillar.

| Pillar | URL | Owner | Spokes (examples) |
|---|---|---|---|
| Expat starter | `/guides/expat-starter/` | Business & Real Estate | First credit card, opening a UAE bank account, how points work in the UAE, common newcomer mistakes |
| UAE points hacks | `/guides/uae-transfer-ratios-2026/` | Travel & Experiences | Card stacking by category, Skywards Everyday at Dubai retailers, ADCB 5x strategy |
| Salary-transfer playbook | `/salary-transfer/` (live tracker is the pillar landing) | Business & Real Estate | Per-bank deep-dives × 8, per-band landing pages × 5, calculator, history |
| Skywards complete guide | `/airlines/skywards/` | Travel & Experiences | Tier breakdown, UAE-side earning, redemption sweet spots, status match plays |
| Etihad Guest complete guide | `/airlines/etihad-guest/` | Travel & Experiences | Same depth as Skywards |
| Cashback cards | `/cards/cashback/` | Business & Real Estate | 12 card reviews + comparison table |
| Islamic cards | `/cards/islamic/` | Business & Real Estate | Sharia-compliant card reviews |
| Miles cards | `/cards/miles/` | Travel & Experiences | Miles-earning card reviews + transfer ratio guidance |

**Hub rule:** every daily news post, deal post, and card review must
link upward to **at least one pillar page**. Internal linking is
enforced at SEO Pass (Stage 4).

---

## Tags

Tags are flat (no hierarchy), case-sensitive lowercase kebab-case,
used by:
- Pagefind facet search.
- Article-footer "related coverage" rails.
- RSS per-tag feeds (future, on the per-band salary-transfer model).

**Tag namespaces** (use only these prefixes):

- `bank:` — `bank:enbd`, `bank:fab`, `bank:adcb`, `bank:mashreq`,
  `bank:hsbc`, `bank:citi`, `bank:standard-chartered`, `bank:rakbank`,
  `bank:cbd`, `bank:dib`, `bank:adib`, `bank:emirates-islamic`.
- `programme:` — `programme:skywards`, `programme:etihad-guest`,
  `programme:qatar-privilege-club`, `programme:saudia-alfursan`,
  `programme:marriott-bonvoy`, `programme:hilton-honors`,
  `programme:world-of-hyatt`, `programme:accor-all`.
- `category:` — `category:cashback`, `category:miles`,
  `category:travel`, `category:dining`, `category:lifestyle`,
  `category:co-brand`, `category:islamic`, `category:premium`.
- `salary-band:` — `salary-band:5k-8k`, `salary-band:8k-15k`,
  `salary-band:15k-30k`, `salary-band:30k-50k`, `salary-band:50k-plus`.
- `season:` — `season:dsf`, `season:ramadan`, `season:national-day`,
  `season:summer`, `season:winter`.
- `topic:` — `topic:welcome-bonus`, `topic:status-match`,
  `topic:transfer-bonus`, `topic:fee-waiver`, `topic:new-launch`,
  `topic:refresh-needed`.

A piece typically carries 3–6 tags spanning at least two namespaces.

---

## URL slug rules

- Lowercase, hyphenated, max 3–4 words per segment.
- No dates in URLs (allows evergreen refresh without redirects).
- No vertical prefix duplication (e.g. don't write
  `/cards/credit-cards/fab-cashback/` — the `/cards/` segment is the
  vertical).
- For card reviews: `<bank-short>-<card-name>` —
  `/cards/fab-cashback/`, `/cards/enbd-skywards-infinite/`.
- For salary-transfer: `<bank-short>` —
  `/salary-transfer/emirates-nbd/`.
- For programmes: `<programme-short>` —
  `/airlines/skywards/`, `/airlines/etihad-guest/`.
- For banks: `<bank-short>` — `/banks/fab/`, `/banks/enbd/`.
- For deals: descriptive, brand-led — `/deals/talabat-50pct-iftar/`,
  not `/deals/2026-ramadan-talabat-deal/`.

Slug renames after publish are a Chairman call — they require a
`301` from old to new and a sitemap re-submission, owned by Technical
Lead.

---

## Redirects map

Maintained in `public/_redirects` (Cloudflare Pages syntax). Owner:
Technical Lead.

When the Chairman approves a slug rename, Technical Lead adds a
`301 /old-path /new-path` line. The redirect map is reviewed quarterly
for entries that can be retired (≥18 months and traffic ≤ 5/month).

---

## What's not in the taxonomy

- No `/blog/`. Every article belongs to a vertical.
- No `/promo-codes/`. Promo codes are inline within `/deals/` posts.
- No author archives at `/author/<name>/` — the byline links to
  `/team/<name>/` (a single profile page) instead.
- No date-based archives (`/2026/03/`). Pagefind handles
  recency-aware search.
- No tag-only landing pages other than the salary-band variants
  (which are first-class because of the per-band RSS pairing).

End.
