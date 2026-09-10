# External link audit

Generated 2026-09-07T08:05:25.003Z · commit `b242105` · 150 distinct URL(s) · 87.6s
Source: GitHub Actions run 34098558459 (`link-audit.yml`, job `audit`), reconstructed from the job log because the artifact blob store is not reachable from the session.

Counts: client-error 6 · timeout 8 · network 4 · redirect-cross-host 3 · unverifiable 21 · ok 108

## Broken (18)

A 4xx/5xx from the target, or no answer at all. Each needs an editor: find the moved page, or archive the claim.

| URL | State | Detail | Method | Sources |
|---|---|---|---|---|
| https://icp.gov.ae/en/services/golden-residency-services/ | client-error | 404 | GET | `guides/golden-visa-cards/index.html` |
| https://mof.gov.ae/corporate-tax-legislation/ | client-error | 404 | GET | `guides/uae-corporate-tax-overview/index.html` |
| https://www.bankfab.com/en-ae/personal/elite-banking | client-error | 404 | GET | `guides/golden-visa-cards/index.html` |
| https://www.ihg.com/content/us/en/deals/member-offers/2k8k | client-error | 403 | GET | `news/ihg-one-rewards-choice-points-promo-ends-31-august/index.html` |
| https://www.mashreqbank.com/uae/en/personal/wealth/gold | client-error | 404 | GET | `guides/golden-visa-cards/index.html` |
| https://www.rakbank.ae/personal/accounts/salary-transfer | client-error | 404 | GET | `guides/salary-transfer-mechanics-2026/index.html` |
| https://www.emirates.com/ae/english/skywards/partners/marriott-bonvoy/ | timeout | no response within timeout | HEAD | `news/marriott-bonvoy-skywards-5000-points-one-stay/index.html` |
| https://www.emirates.com/media-centre/emirates-skywards-launches-5-million-skywards-miles-giveaway-for-dubai-summer-surprises/ | timeout | no response within timeout | HEAD | `news/skywards-summer-redemption-push-dss-5-million-miles/index.html` |
| https://www.emirates.com/media-centre/emirates-skywards-launches-global-season-of-rewards-campaign-for-members-worldwide/ | timeout | no response within timeout | HEAD | `news/emirates-skywards-season-of-rewards-2026/index.html`, `news/skywards-season-of-rewards-final-week-31-august/index.html` |
| https://www.emirates.com/media-centre/make-every-mile-count-spend-smarter-to-unlock-more-summer-value-with-emirates-skywards/ | timeout | no response within timeout | HEAD | `news/skywards-summer-redemption-push-dss-5-million-miles/index.html` |
| https://www.emirates.com/us/english/special-offers/shop-and-earn-skywards-tier-miles-on-the-ground/ | timeout | no response within timeout | HEAD | `news/skywards-season-of-rewards-final-week-31-august/index.html` |
| https://www.etihad.com/en-ae/offers | timeout | no response within timeout | HEAD | `deals/etihad-fare-sale-july-2026/index.html`, `deals/etihad-last-chance-summer-2026/index.html`, `news/etihad-fare-sale-book-by-31-july-2026/index.html` +1 more |
| https://www.etihad.com/en/etihadguest/tiers-and-benefits | timeout | no response within timeout | HEAD | `airlines/etihad-guest/index.html` |
| https://www.malloftheemirates.com/ | timeout | no response within timeout | HEAD | `guides/dubai-shopping-festival-2026/index.html` |
| https://aecb.gov.ae/en/credit-score | network | TypeError: getaddrinfo ENOTFOUND aecb.gov.ae | GET | `guides/aecb-credit-report-walkthrough/index.html` |
| https://aecb.gov.ae/en/individual-services | network | TypeError: getaddrinfo ENOTFOUND aecb.gov.ae | GET | `guides/aecb-credit-report-walkthrough/index.html` |
| https://www.cbd.ae/docs/default-source/document/cards/cbd-kfs-conventional_cbd-one-cc.pdf | network | UND_ERR_HEADERS_OVERFLOW Headers Overflow Error | GET | `cards/cbd-one/index.html` |
| https://www.mohre.gov.ae/en/services/wages-protection-system.aspx | network | UND_ERR_CONNECT_TIMEOUT Connect Timeout Error (attempted address: www.mohre.gov.ae:443, timeout: 10000ms) | GET | `guides/choosing-first-uae-bank/index.html`, `guides/salary-transfer-mechanics-2026/index.html` |

## Unverifiable (21)

Bot walls, rate limits and egress blocks. Not evidence the page is gone — a human with a browser can settle each host in a minute.

### www.adcb.com (13) — cloudflare-block

- https://www.adcb.com/ — 403 · `banks/adcb/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/365-cashback-card.aspx — 403 · `cards/adcb-365-cashback/index.html`, `news/adcb-365-cashback-earn-table-rebalance-2026/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/adcb-lulu-credit-card.aspx — 403 · `cards/adcb-lulu-platinum/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/adcb-lulu-titanium-gold-credit-card.aspx — 403 · `cards/adcb-lulu-titanium-gold/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/betaqti-credit-card.aspx — 403 · `cards/adcb-betaqti/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/essential-cashback-credit-card.aspx — 403 · `cards/adcb-essential-cashback/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/shukran-credit-card — 403 · `cards/adcb-shukran/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/talabat-credit-card.aspx — 403 · `cards/adcb-talabat/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/touchpoint-ic.aspx — 403 · `cards/adcb-touchpoints-infinite/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/touchpoint-platinum-cc.aspx — 403 · `cards/adcb-touchpoints-platinum/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/touchpoint-tg-cc.aspx — 403 · `cards/adcb-touchpoints-titanium-gold/index.html`
- https://www.adcb.com/en/personal/cards/credit-cards/traveller-credit-card.aspx — 403 · `cards/adcb-traveller/index.html`
- https://www.adcb.com/en/personal/promotions/salary-transfer — 403 · `guides/salary-transfer-mechanics-2026/index.html`

### www.alhilalbank.ae (2) — cloudflare-block

- https://www.alhilalbank.ae/en/Images/Ahb-sof.pdf — 403 · `banks/al-hilal/index.html`
- https://www.alhilalbank.ae/en/Images/ahb-cashback-tcs-final.pdf — 403 · `banks/al-hilal/index.html`

### www.cbd.ae (2) — cloudflare-403

- https://www.cbd.ae/ — 403 · `banks/cbd/index.html`
- https://www.cbd.ae/personal/cards/credit-cards/cbd-one — 403 · `cards/cbd-one/index.html`

### www.centralbank.ae (3) — cloudflare-challenge

- https://www.centralbank.ae/en/cbuae-amlcft/consumer-protection-standards/ — 403 · `guides/aecb-credit-report-walkthrough/index.html`
- https://www.centralbank.ae/en/our-operations/financial-stability/licensed-financial-institutions/ — 403 · `guides/choosing-first-uae-bank/index.html`
- https://www.centralbank.ae/en/our-operations/payment-systems/wages-protection-system — 403 · `guides/salary-transfer-mechanics-2026/index.html`

### www.salik.ae (1) — cloudflare-challenge

- https://www.salik.ae/ — 403 · `guides/expat-starter-car-costs/index.html`

## Cross-host redirects (3)

The link works but lands on a different site. Worth a look: a moved brand domain is fine, a redirect to a homepage is a soft 404.

| URL | Lands on | Sources |
|---|---|---|
| https://buttondown.email/ | https://buttondown.com/ | `newsletter/index.html` |
| https://www.adib.ae/en/pages/personal_cards_notices.aspx | https://www.adib.com/en/pages/personal_cards_notices.aspx | `cards/adib-cashback-visa/index.html` |
| https://www.mydsf.ae/ | https://www.visitdubai.com/en/festivals-and-events/dsf | `guides/dubai-shopping-festival-2026/index.html` |

## Internal absolute links (6 checked, 0 broken)

`https://dubaipoints.ae/...` written out in full — verified against dist like the internal sweep. Prefer root-relative hrefs.

_All resolve._

## OK (108)

108 link(s) answered 2xx on the same site.
