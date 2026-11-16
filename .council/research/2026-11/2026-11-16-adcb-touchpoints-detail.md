# ADCB TouchPoints: scoped product-page disclosures

Read 16 November 2026, 22:01 Dubai (18:01 UTC). Scope: the named ADCB UAE
Infinite, Platinum and Gold/Titanium credit cards, product detail pages only.
The retrieval receipts are line-addressed source representations, not raw HTTP
entity hashes. Local direct retrieval returned access-denied pages rather than
usable bank HTML; the line pins below were independently read from the public
official pages. The observations are reproducible using
`scripts/scrape/_adcb-touchpoints-detail.ts`; rate/threshold tokens go through
the standard deterministic number parser.

| Official product | Lines: product / upper bound / monthly bonus / qualifying spend / three scoped rates / classification | Captured representation SHA-256 |
| --- | --- | --- |
| [Infinite](https://www.adcb.com/en/personal/cards/credit-cards/touchpoint-ic) | 65 / 67 / 68 / 70 / 71 / 72 | `bce637be7a53fdbcebb29887609ba4cff0024da4d1d501396157744903efcf3a` |
| [Platinum](https://www.adcb.com/en/personal/cards/credit-cards/touchpoint-platinum-cc) | 61 / 63 / 64 / 66 / 67 / 68 | `b2b32da10e80ed2acf349f14430de2ab25fc7ef43a41e48caa0bbb48895a0918` |
| [Gold/Titanium](https://www.adcb.com/en/personal/cards/credit-cards/touchpoint-tg-cc) | 61 / 63 / 64 / 66 / 67 / 68 | `6b734fefb2b138544ddf4ebc9cf663745396c8bba04b9bf6ebabdf06994a21cc` |

The page headline amounts are upper bounds, not default rates. The bonus is
monthly, not acquisition; it concerns qualifying retail spend net of refunds
and reversals, excluding disputed purchases and cash withdrawals. Both named
merchant lists are domestic. ADCB links the regional band to its product page's
own “United Kingdom and Europe” wording and applies Visa merchant guidance to
Infinite and the applicable Visa/Mastercard guidance to both other cards. No UK-wide
application, EEA membership conclusion, unstated jurisdiction, universal base, numerical
reward cap, general valuation or ranking is inferred.

The bank's [current terms index](https://www.adcb.com/en/terms-conditions/)
links the [TouchPoints card terms](https://www.adcb.com/en/multimedia/tnc/cb-tnc-touchpoints-credit-card.pdf)
at line 48 and the [programme terms](https://www.adcb.com/en/multimedia/tnc/cb-tnc-touchpoints-reward-program.pdf)
at line 67. Card terms section 7, PDF pp. 6–7 / rendered lines 223–254,
specifies a calendar month and the net-retail conditions. Programme Schedule
B, PDF p. 14 / rendered lines 473–503, excludes donations and specified
insurance payments and ties eligible monthly spend to the assigned credit
limit. The two merchant groups named in the product page but affected by
Schedule B are omitted from the positive earn lists and the conflict disclosed.
The parser's product observations remain raw scoped claims, not an adjudication
of eligibility; no model points cap or value is generated.

Platinum's legacy canonical fuel entry contradicts the product-page row. It
remains in the immutable held record and is not exposed in the updated detail
review (which previously withheld all legacy earn figures). No canonical bytes,
verification dates, qualification, fees, other perks, public welcome values,
comparison or calculators are changed. The per-article earn-issue note is
replaced only where the new copy gives the scoped disclosure and explicitly
retains the all-spend hold.

Lifecycle: prepared for independent Council review and owner release decision;
not self-approved or published.
