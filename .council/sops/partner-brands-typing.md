# SOP — Typing `partnerBrands` from `_scraped_freetext.partnerBrands`

**Owner**: Managing Editor (Stage 6 of `02_workflow.md`); routes to the
relevant section editor per beat.
**Tier**: T1 (typing one card's `partnerBrands`) / T2 (a bank's worth
at once).
**Charter constraints**:
- §6 — LLM-extraction policy. `partnerBrands` is a typed enum, not
  free-text. **It must come from editor judgement against the bank's
  primary source, never from an LLM.** The SOP below explicitly
  forbids LLM-typing.
- §2 — Firecrawl exclusivity. Re-pulling a source for verification
  routes to Head of Research.

## Why this SOP exists

The L2 schema in `src/lib/cardsData.ts` defines a 22-slug `PARTNER_BRAND`
Zod enum for reader-intent queries — "which credit card earns boosted
at Talabat / LuLu / ADNOC". The matcher and the brand-affinity hub
pages (C2 of the May 2026 plan, when shipped) will read **only** this
typed array; the free-text `_scraped_freetext.partnerBrands` is the
evidence trail, not the contract.

Today, **5 of 34 cards** have populated `partnerBrands` (the
reference set seeded by this SOP). Every other card carries
`_provenance.partnerBrands: "needs-review"`. The hub pages, the
calculator's brand filter, and any future "best card for X" guide
depend on this gap closing.

The scraper writes raw co-brand mentions (lines of the source
markdown containing any of the 22 brand phrases) to
`_scraped_freetext.partnerBrands`. The editor reads those, decides
which typed slugs apply, and marks the field `editor-confirmed` in
`_provenance`.

## When to invoke

- **New scrape lands** — a `propose-changes.ts` PR opens a new card
  or refreshes an existing card's `_scraped_freetext.partnerBrands`.
  Editor types `partnerBrands[]` before approving the PR.
- **Backfill sprint** — bulk-typing the 29 existing cards still
  marked `needs-review`, distributed across section editors by beat
  (see §"Beat assignments" below).
- **Drift refresh** — quarterly, sample one card per bank;
  re-confirm `partnerBrands[]` against the bank's current product
  page; update if the bank's co-brand offer changed.

## Process — single card

1. **Read the source.** Open the card's `cards.json` entry. Look at:
   - `_scraped_freetext.partnerBrands` — raw lines the scraper found
     mentioning any of the 22 brand clusters
   - `perks[]` — editor-typed perks may also mention partner brands
   - `loyaltyProgram` — strong signal (e.g. `"LuLu Points"` →
     `lulu`; `"Marriott Bonvoy Points"` → `marriott`)
   - `name` — co-brand cards usually name the partner (e.g.
     "Emirates NBD LuLu 247 Platinum" → `lulu`)
   - `sources[]` — the URL(s) the scraper read from
2. **Open the bank's live product page** in a separate tab. Verify
   the freetext matches what's currently published. If the bank
   page disagrees, flag the field `needs-review` and route to Head
   of Research for a fresh Firecrawl pull.
3. **For each partner brand the card actually rewards or features**,
   select the matching slug from the 22-slug enum. See the
   slug cheatsheet below.
4. **Set `partnerBrands`** on the card object as an array of slugs,
   sorted alphabetically (so diffs stay stable).
5. **Flip `_provenance.partnerBrands`** from `"needs-review"` to
   `"editor-confirmed"`.
6. **Bump `_lastReviewed`** to today's date if you also confirmed
   the rest of the L2 entry against the live product page.

## Slug cheatsheet — the 22 PartnerBrand values

Read this list against the strongest brand signal in the card name
or `loyaltyProgram` first; fall back to perks / freetext if the
co-brand isn't named in the card title.

| Slug | Triggers (in card name, loyaltyProgram, or freetext) |
|---|---|
| `emaar` | Emaar properties; Dubai Mall; Address Hotels; Burj Khalifa |
| `majid-al-futtaim` | SHARE; SHARE Points; MAF malls; City Centre malls; Carrefour |
| `lulu` | LuLu Hypermarket; LuLu Points; LuLu 247 |
| `noon` | noon.com; noon Food; noon Minutes; NowNow; Namshi; Noon Loyalty |
| `talabat` | Talabat; Talabat Pro; Talabat credits |
| `adnoc` | ADNOC fuel stations; ADNOC Oasis; ADNOC rewards |
| `enoc` | ENOC; EPPCO; YES Card |
| `al-futtaim` | Blue Rewards; IKEA; ACE Hardware; M&S; Toys R Us |
| `etihad` | Etihad Airways; Etihad Guest Miles |
| `skywards` | Emirates Airlines; Emirates Skywards; Skywards Miles |
| `marriott` | Marriott Bonvoy; Marriott Bonvoy Points; SPG legacy |
| `booking-com` | Booking.com bookings |
| `amazon-ae` | Amazon.ae |
| `shukran` | Shukran; Shukran Stores; Centrepoint; MAX; Splash; Lifestyle; Babyshop; Shoemart; Homebox; Styli |
| `aldar` | Aldar properties; Yas Island; Yas Mall; Darna (Aldar's app) |
| `gems` | GEMS Education; GEMS Schools; school fee instalments named for GEMS |
| `dnata` | dnata Travel; Emirates Leisure Retail; dnata Travel Points |
| `air-arabia` | Air Arabia; AirRewards |
| `etisalat` | Smiles app; elGrocer; Etisalat e&; du is **not** etisalat — use `du` for that |
| `choithrams` | Choithrams supermarket |
| `du` | du telco rewards; du loyalty |
| `careem` | Careem rides; Careem Plus; Careem Food |

**Critical disambiguation.**

- **"Darna" is `aldar`, not Emirates NBD's house program.** Emirates NBD has cards branded "Darna" because the underlying loyalty is Aldar's. If a card's only "co-brand" signal is the issuing bank's own house loyalty (Plus Points, Smiles for Mashreq, etc.), it has **no partner brand** — leave `partnerBrands` as an empty array `[]` and confirm provenance.
- **Etihad vs Skywards.** Etihad Guest and Skywards are separate programmes; never group them under one slug.
- **Generic "rewards points" cards** (e.g. ADCB TouchPoints, FAB Rewards on a non-co-brand card) have no partner brand — empty array.
- **Cinema BOGO, lounge access, golf** are perks, not partner brands. They live in `_features[]` per the features-typing SOP. Don't conflate.

## Process — backfill sprint (multiple cards per session)

1. **Pull the list of cards still marked `needs-review`** via:
   `node --import tsx --eval "import('./src/lib/cardsData.ts').then(m => console.log(m.getAllCards().filter(c => c._provenance?.partnerBrands === 'needs-review').map(c => c.slug).join('\n')))"`
2. **Group by beat.** Beat assignments:
   - **business-realestate-editor**: bank-house cards (Mashreq, FAB,
     ADCB, ADIB house brands — usually empty `partnerBrands`),
     salary-transfer-focused cards.
   - **travel-experiences-editor**: Skywards / Etihad / Marriott /
     dnata / Air Arabia / Emirates Leisure Retail co-brands.
   - **lifestyle-culture-editor**: Shukran / LuLu / Choithrams /
     Carrefour-via-SHARE / GEMS / dining-affinity / Noon /
     Talabat / Careem co-brands.
3. **Work through one bank at a time** so you keep the live product
   pages open in tabs. ENBD has the highest co-brand density —
   start there.
4. **Open a single PR per beat** with a clear sign-off block. The
   editor doing the typing is the named pass; Standards Editor is
   n/a (no user-facing copy); Chairman approves the merge.

## Reference set (seeded by this PR)

These 5 cards demonstrate the SOP works end-to-end. They were
chosen because each has an unambiguous single-brand affinity
visible in the card name and loyalty programme:

| Card slug | partnerBrands | Why this slug |
|---|---|---|
| `emirates-nbd-lulu-247-platinum` | `["lulu"]` | Loyalty programme is "LuLu Points"; perks are explicitly LuLu cashback. |
| `emirates-nbd-dnata-platinum` | `["dnata"]` | Loyalty programme is "dnata Travel Points"; co-brand named in card title. |
| `emirates-nbd-etihad-guest-elevate` | `["etihad"]` | Loyalty programme is "Etihad Guest Miles"; co-brand named in title. |
| `emirates-nbd-marriott-bonvoy-world` | `["marriott"]` | Loyalty programme is "Marriott Bonvoy Points"; co-brand named in title. |
| `emirates-nbd-share-visa-infinite` | `["majid-al-futtaim"]` | Loyalty programme is "SHARE Points (Majid Al Futtaim)"; SHARE is MAF's flagship loyalty programme covering Carrefour and City Centre malls. |

All five have `_provenance.partnerBrands: "editor-confirmed"` in
this commit.

## Kill-list — what you must never do

- **No LLM mapping.** Charter §6. Editor judgement only. If the
  freetext is ambiguous, leave the field `needs-review` and ask in
  the editor Slack.
- **No inventing brand affinities not supported by the source.**
  "This card has cinema BOGO at VOX, so I'll tag it as
  `emaar`-affiliated" — no. VOX cinema is a perk, not a partner
  brand. Source must explicitly name the brand or its loyalty
  programme.
- **No empty `editor-confirmed`.** If you confirm a card has no
  partner brand, set `partnerBrands: []` (empty array) **and** flip
  the provenance to `editor-confirmed`. Leaving `partnerBrands`
  undefined while marking provenance `editor-confirmed` breaks the
  audit invariant.
- **No silently expanding the enum.** Adding a new slug requires a
  Charter §1 escalation to the Chairman; the test in
  `tests/data/partner-brands.test.ts` will fail otherwise.
- **No partial commits.** Each card edit ships with both
  `partnerBrands` and `_provenance.partnerBrands` updated in the
  same commit. Editing one without the other corrupts the merge
  contract.

## What this SOP deliberately does NOT do

- Authorise scraping new sources to populate `partnerBrands`.
  Firecrawl exclusivity means any re-fetch routes to Head of
  Research.
- Cover the order or weighting of multiple partner brands on a
  single card (e.g. a card that earns at both LuLu and Carrefour
  goes `["lulu", "majid-al-futtaim"]` — alphabetical sort, no
  ranking). Ranking is a hub-page (C2) concern, not a schema
  concern.
- Type partner brands for cards whose underlying offer can't be
  confirmed from a live primary source. If the bank product page is
  404 or behind auth, flag `needs-review` and route to Head of
  Research.
- Cover `_features[]` typing. That's `features-typing.md`'s scope.

## Verification

- `npm run check` — every card validates against the schema; no
  invalid enum slugs.
- `npm test` — `tests/data/partner-brands.test.ts` asserts every
  card has either populated `partnerBrands` or
  `_provenance.partnerBrands === "needs-review"`. After backfill,
  the population count should rise; the test still passes either
  way.
- Manual: open `/calculator` after a backfill sprint and confirm
  the result tiles surface partner brands once the hub-page work
  (C2) lands.

End.
