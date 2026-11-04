# Research dossier: Citi Cash Back application route and fee

## Primary sources

- [Citi Cash Back UAE product page](https://www.citibank.ae/credit-cards/cashback/citi-cashback-credit-card) — accessed 2026-11-04. The first card terms state the AED 300 joining statement credit, AED 6,000 spend in 60 days, the new-to-Citi-card and direct-application conditions, and the exclusion of search adverts and third-party links. Its annual fee FAQ and terms say the first year is free, the annual waiver threshold is AED 9,000 thereafter, and AED 300 plus 5% VAT applies if the waiver is not met.
- [Welcome Offer Terms PDF actually linked from the card page](https://www.citibank.ae/content/dam/cgcpc/ae/prelogin/www-citibank-ae/doc/en/pdf/credit-cards/credit-card-offers-terms-and-conditions.pdf) — accessed 2026-11-04, July 2026 edition, clause 20. It separates direct Citi applications from applications on designated Citi landing pages, which carry the terms of that specific page. This does not identify a publisher link or verify an offer through any specific third party.
- [Citi Fees and Charges, linked from the card page](https://www.citibank.ae/content/dam/cgcpc/ae/prelogin/www-citibank-ae/doc/en/pdf/credit-cards/fees-and-charges.pdf) — accessed 2026-11-04, July 2026 edition. Supplementary source for the issuer's schedule; use the specific product page and footnote for the exact Cash Back fee and waiver described in this article.

## Deterministic numerical evidence

Live HTML returned successfully. Parsed its text with parse5, matched the issuer's exact joining-bonus, annual-fee and VAT lines with regular expressions, and passed the AED and percent matches to parseAED and parsePercent from scripts/scrape/_lib.ts.

| Field | Value | Source line or derivation |
| --- | --- | --- |
| Welcome statement credit | AED 300 | Product page, first bullet under the card hero. |
| Qualifying spend / window | AED 6,000 / 60 days | Same source line as statement credit. |
| Later-year waiver spend | AED 9,000 annually | Product page, annual fee FAQ and terms footnote. |
| Later-year fee if charged | AED 315 incl. VAT | Product terms: AED 300 × (1 + 5/100). |
| Worked example | AED 7,200 later-year spend | Hypothetical AED 600 monthly × 12, below the sourced AED 9,000 threshold. |

## Existing coverage and boundary

The August Citi Cash Back story already reported the historical bonus increase; the September Citi welcome-ladder article compared several cards. The new article deliberately does not re-report either, or assert a bank change since then. The additional reader value is separating the application route, one-off credit and subsequent-year fee. A differently spelled path under /doc/english/ gave search snippets about a partner campaign, but direct retrieval did not substantiate that offer. Do not use those snippets to publish a partner amount or partner eligibility.

## Last verified

2026-11-04. Recheck by 2026-12-04; this is an editorial refresh date, not an offer expiry.
