# Emirates NBD scraper notes

_Companion to `enbd.urls.json`. Owner: Head of Research.
First-seeded 2026-05-08 from owner-supplied URL list._

## Lineup

28 cards across 9 loyalty programmes:

| Programme | Cards | Earn currency |
|---|---|---|
| Skywards | 2 (Infinite, Signature) | Skywards Miles |
| Darna | 3 (Visa Infinite, Visa Signature, Select Visa) | Darna |
| Plus Points | 10 (Priority Banking Infinite, Visa Infinite, Visa Flexi, Mastercard Platinum, Duo, Go4it Platinum, Go4it Gold, Visa Platinum, Diners Club, WebShopper) | Emirates NBD Plus Points |
| dnata | 2 (World, Platinum) | dnata Travel Points |
| Etihad Guest | 2 (Visa Elevate, Visa Inspire) | Etihad Guest Miles |
| Red Points | 1 (Manchester United) | Red Points |
| LuLu | 2 (247 Platinum, 247 Titanium) | LuLu Points |
| Marriott Bonvoy | 2 (World Elite Mastercard, World Mastercard) | Marriott Bonvoy Points |
| U Points | 3 (Infinite, Infinite for Emiratis, Family) | U Points |
| Noon | 1 (Noon One) | Noon Loyalty |

## Slug strategy

7 slugs preserved from the existing `src/data/cards.json` pre-seed
(merge protects their `_provenance: editor-confirmed` fields):

- `emirates-nbd-skywards-infinite`
- `emirates-nbd-skywards-signature`
- `emirates-nbd-go4it-platinum`
- `emirates-nbd-go4it-gold`
- `emirates-nbd-lulu-247-platinum`
- `emirates-nbd-lulu-247-titanium`
- `emirates-nbd-u-by-emaar-infinite`

21 new slugs land with `_provenance: scraped` on first scrape run.

Two existing `emirates-nbd-share-*` slugs in `cards.json`
(`emirates-nbd-share-visa-infinite`, `emirates-nbd-share-visa-signature`)
are **not** in this URL list. SHARE was the prior loyalty-programme
name; Darna is the rebrand. The migration call is editorial:

- Keep both? (SHARE entries become legacy/historical; Darna entries
  are the current product.)
- Rename the SHARE slugs to Darna slugs and migrate their editorial
  provenance? (Cleaner; needs Chairman go because slug renames carry
  301 obligations.)

Pending Chairman call. **Until decided, the SHARE slugs sit untouched
in `cards.json` and the scraper writes Darna entries as new slugs.**

## Open data gaps

### KFS / Schedule of Charges PDF URLs

Not provided in the dossier. Head of Research backfill:

- ENBD publishes a consolidated Schedule of Charges PDF —
  canonical URL needs to be confirmed via Firecrawl scrape of
  `https://www.emiratesnbd.com/en/help/regulatory-documents` or
  similar. Once confirmed, populate `urls.kfs` on every entry.
- Some product cards may have a per-card Key Facts Statement
  separate from the consolidated Schedule of Charges. Owner
  follow-up.

### Welcome / promotional offer URLs

Not provided. Most ENBD welcome offers live on
`https://www.emiratesnbd.com/en/credit-card-promotions` or product-
page tabs. Verify and populate `urls.welcome` per card if the offer
lives on a separate landing page.

### Salary-transfer offers

ENBD's salary-transfer programme lives at a separate URL — needs a
Head of Research dossier producing a `salaryTransferOffers`
collection entry, not handled by the credit-card scraper.

## Field heuristics applied

The url config sets sensible defaults that the scraper overrides
once it parses the live page. Fields with deterministic priority:

- `network` — guessed from card name; scraper confirms from page.
- `categories` — guessed from programme; scraper may add or remove.
- `loyaltyProgram` — set from owner-supplied grouping headers; not
  scraped (loyalty programme is rarely re-stated on the bank page).
- `salaryTransferRequired` — guessed by tier (Infinite typically
  yes, Platinum-and-below typically no). Scraper detects from the
  eligibility section and overrides.

## Followup tasks

1. **KFS URLs.** As above.
2. **Welcome page URLs.** As above.
3. **Salary-transfer dossier** (separate collection from cards).
4. **SHARE → Darna migration call** (Chairman + Section Editor).
5. **dnata Travel Points loyalty programme entry** in
   `src/content/programs/` if not already present (`programs`
   collection).
6. **Red Points (Manchester United) loyalty programme entry** —
   investigate whether this is a true loyalty currency or just
   "Mastercard rewards" with a Manchester United co-brand.
7. **Darna loyalty programme entry** in `src/content/programs/`.
