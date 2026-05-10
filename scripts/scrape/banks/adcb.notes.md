# ADCB scrape config — operator notes

**Compiled**: 2026-05-10 from operator-pasted URLs.
**Source**: 11 individual product-page URLs the operator copied from
the live ADCB credit-cards index. Debit cards filtered out per scope.

## Card lineup (11 credit cards)

| Slug | URL path | Best-guess fields (editor must confirm on first scrape PR) |
|---|---|---|
| `adcb-shukran` | `/credit-cards/shukran-credit-card` | Co-brand with Shukran (Landmark Group). |
| `adcb-traveller` | `/credit-cards/traveller-credit-card.aspx` | Travel; assumed earns ADCB TouchPoints. |
| `adcb-365-cashback` | `/credit-cards/365-cashback-card.aspx` | Cashback; no loyalty programme. |
| `adcb-talabat` | `/credit-cards/talabat-credit-card.aspx` | Co-brand with Talabat (food delivery). |
| `adcb-betaqti` | `/credit-cards/betaqti-credit-card.aspx` | Entry-level; salaryTransferRequired likely true. |
| `adcb-lulu-platinum` | `/credit-cards/adcb-lulu-credit-card.aspx` | Co-brand with LuLu Hypermarket; earns LuLu Points. |
| `adcb-lulu-titanium-gold` | `/credit-cards/adcb-lulu-titanium-gold-credit-card.aspx` | Premium tier of the LuLu co-brand. |
| `adcb-touchpoints-infinite` | `/credit-cards/touchpoint-ic.aspx` | Highest TouchPoints tier; Visa Infinite. |
| `adcb-touchpoints-platinum` | `/credit-cards/touchpoint-platinum-cc.aspx` | Mid-tier TouchPoints. |
| `adcb-touchpoints-titanium-gold` | `/credit-cards/touchpoint-tg-cc.aspx` | Entry-level TouchPoints. |
| `adcb-essential-cashback` | `/credit-cards/essential-cashback-credit-card.aspx` | Entry-level cashback; salaryTransferRequired likely true. |

## Schedule of Charges PDF (consolidated)

`https://www.adcb.com/en/multimedia/sof/cb-sof-current-charges-fees.pdf`

Used as the `kfs` URL for every card. Operator confirmed; editor
should re-verify it covers all 11 listed credit cards on first scrape
PR review.

## What editors must confirm on first scrape PR

The fields below are operator-side best-guesses based on URL slugs
and UAE consumer-banking conventions. They are **not** verified
against the live product page. First scrape PR review must confirm:

1. **`name`** — actual marketing name on the bank's product page may
   differ from the slug-derived name (e.g. ADCB may sell the
   "365 Cashback" as "ADCB 365 Day-to-Day Cashback Credit Card").
2. **`network`** — assumed Visa for all 11. TouchPoints Infinite is
   typically Visa Infinite, but mid-tier TouchPoints could be Mastercard.
3. **`categories`** — best-guess from card name. Editor refines.
4. **`loyaltyProgram`** — set to "ADCB TouchPoints" / "Shukran" / "LuLu
   Points" / "Talabat Pro" based on URL/name conventions. The
   `Talabat Pro` programme name in particular needs verification — ADCB
   may use a different brand for the rewards mechanic.
5. **`salaryTransferRequired`** — set to `true` for entry-level
   (Betaqti, Essential Cashback), `false` for everything else. Editor
   confirms per ADCB's published eligibility on each product page.

## What's missing (out of scope for this URL config)

- Welcome-bonus URLs (`urls.welcome`). ADCB runs welcome offers on
  campaign pages that change quarterly; editor adds these on a per-card
  basis when active.
- T&Cs URL (`https://www.adcb.com/en/terms-conditions/`). The current
  schema doesn't have a `terms` URL field; the KFS PDF is the
  source-of-truth document for fees.
- The `/key-facts-statement/` index page. Useful for editor reference;
  not in the schema.

## Stage 4 status

- Config: written ✓
- Scraper module (`scripts/scrape/adcb.ts`): not yet — Tech Lead
  follow-up after Stage 2 selector refactor lands, OR template
  immediately from `fab.ts` if Firecrawl key gets provisioned first.
- Registry (`banks.registry.json`): not yet — added when scraper
  module exists AND `FIRECRAWL_API_KEY` is in CI secrets.

## Provisioning blocker

Per the Q3 strategy session and the Head of Research probe attempt
(2026-05-10): scraping is currently blocked because Firecrawl is not
provisioned to the agent session and WebFetch is 403'd on UAE bank
domains. This URL config is **ready to use** the moment a
`FIRECRAWL_API_KEY` lands in repo secrets and the scraper module is
written — no operator URL provision is needed beyond what's already
captured here.
