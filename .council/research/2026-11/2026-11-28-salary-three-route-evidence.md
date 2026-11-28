# Salary transfer: three conditional routes — 28 November 2026

Prepared source and model evidence for an isolated editor-owned release.
No automatic ingestion, schedule/credit/account change, applicant form,
outreach, financial recommendation or assumed release approval.

## Abu Dhabi Islamic Bank — Arrive

- [Official public programme](https://www.adib.ae/en/personal/new-to-country) and its linked [14-page terms](https://www.adib.ae/-/media/project/adib/adibsite/docs/personal/new-to-country/adib-arrive-terms-and-conditions.pdf).
  Public HTTP read 2026-11-28T11:55:09Z; 276,404 bytes; SHA-256
  `b093e340cb30cd893262be5fb8b7255a714b919c7a4c63d393703765fece70b4`.
  The [bank's dated announcement](https://www.adib.ae/en/news/2026/nov/adib-launches-adib-arrive-a-new-banking-proposition-for-new-uae-residents)
  supplies 10 November 2026 as a record start, not an enrolment clause.
  No fixed issuer end date found; 31 January 2027 is an internal review
  date, not an application deadline.
- PDF p. 1 §§1.1–1.6: approved, recently relocated non-UAE nationals
  with an Emirates ID and/or residency visa issued within the 180 days
  before onboarding, plus required proof of relocation. Pinned PDF
  p. 1 lines 8–11 supply the exact separate 180-day identity clock.
  P. 2 opening requires new-to-bank onboarding and an eligible
  assigned account tier. P. 2 §1 exact English table supplies salaries
  and the **Salary Transfer Welcome Prize** cells; the **Maximum Total**
  cells combine deposit and salary. Do not use the deposit's amounts,
  rate, balance, or the credit-card waiver as salary eligibility.
- P. 2 §3: three consecutive monthly salary credits. P. 7 §§3.1–3.3:
  qualifying salary amount established within 90 calendar days of
  onboarding and all qualification requirements in the first 12 months;
  it does not say the three credits all have to land in 90 days. The
  displayed three months reflects the qualifying salaries and is not a
  fixed lock-in. P. 3 §§4–8: employer UAEFTS/WPS, qualifying pensions,
  no obligation to hold the salary funds, payment within 90 calendar
  days of the third qualifying credit and bank's highest qualifying
  segment. P. 7 §2: periodic assessment and active account in good
  standing at assessment/payment. P. 8 §4 supplies reversal events.
  P. 3 other terms reserve discretion, exclude staff and prohibit
  combining with other campaigns.

## Mashreq Al Islami NEO — Early Bird salary route

- [Bank's salary-account page](https://www.mashreqalislami.com/uae/neo/accounts/current-accounts/salary-transfer/)
  supplies the 1 August 2026 first-salary cohort. [Early Bird terms](https://www.mashreqalislami.com/-/jssmedia/pdfs/mai/neo/kfs-tnc/Early-Bird-TNCS.ashx)
  public HTTP read 2026-11-28T11:55:08Z; 477,524 bytes; SHA-256
  `e0d17670b124f1f8027e7b036821ae57a64857092bdbde27ecad0dd9f5f97c8c`.
  PDF is labelled July 2026; do not substitute that edition date for the
  bank's dated first-salary cohort. No fixed end date verified; 31 January
  2027 is an internal review date.
- PDF p. 1 and pp. 2–4 §1(a–k): eligible new relationship and first
  Islamic NEO current/savings account; Gold/Private excluded; qualifying
  employer credit starts from AED 5,000 and §1(b) imposes 90 days from
  opening the first account. Use the displayed total in §1(c) for that
  scope and do not present the base alone as confirmed for later pay.
  P. 2 distinguishes separate non-salary activities; a credit card, card
  spend, remittance, referral and investment are not conditions of §1.
- P. 3 §1(d–i): 12 equal monthly instalments, first within 90 days of
  first qualifying salary; a missed or below-minimum month does not
  regain the instalment, and two consecutive missed transfers in the
  12-month period can recover all previous bonus payments. First salary
  sets the band; rises do not increase it and falls may reduce later
  instalments. Pp. 3–4 §1(j–k): correct employer route, once per customer.
  Pp. 7–8 general terms exclude stacking with other bank/subsidiary
  offers. Do not conflate the conventional NEO offer or recommend stacking.

## First Abu Dhabi Bank — Islamic Amana

- [Official Amana offer](https://www.bankfab.com/en-ae/islamic-banking/promotions/20-percent-salary-transfer-cashback)
  links its [English campaign terms](https://www.bankfab.com/-/media/fab-uds/islamic-banking/promotions/2026/20-percent-salary-transfer-cashback/fab-islamic-terms-and-conditions-20-percent-salary-transfer-campaign-en.pdf?view=1).
  Public HTTP read 2026-11-28T11:54:51Z; 130,689 bytes; SHA-256
  `ab30ed5438998d7fb2ac7b0c10592bb6ab4666959ea2b94a2a0d36348811c576`.
  Official [Arabic terms](https://www.bankfab.com/-/media/fab-uds/islamic-banking/promotions/2026/20-percent-salary-transfer-cashback/fab-islamic-terms-and-conditions-20-percent-salary-transfer-campaign-ar.pdf?view=1)
  also read; 203,514 bytes; SHA-256
  `6434b853d351aae65c8a987c60589a9e31d0efc22b8cf2e2415de0b9709281d6`.
- P. 1 §§1–5: 1 September–31 December inclusive; first qualifying
  salary into AED Amana during the campaign and a **new FAB Islamic
  credit card obtained during that period**. Minimum AED 5,000; new
  Islamic customer or no FAB salary in the preceding 12 months, further
  product/account exclusions apply. Actual monthly salary sets the
  recalculated spend target (20%); only specified card spend counts. The
  Save-or-Spend heading and Arabic reference to two options (with no
  second route filled in) do not establish a savings-only route. Do not
  import the conventional route or generalise to another account/card.
- P. 2 §5: apply 1.67% to actual monthly payroll, round down to whole
  AED, then cap at AED 750/month and AED 9,000/12 months. Use only this
  PDF's six **examples**, not the rounded marketing numbers or a quote
  for a range. The record's max-salary boundaries are editorial display
  containers for sample amounts; they do not belong in estimates or
  rankings. Monthly payment is within 45 calendar days from month-end;
  no retrospective payments for missed months, no fulfilment after
  closure. The signed source supersedes marketing (§6); no combining with
  another promotion unless allowed, with explicit prize-draw exception.

## Offline reproducibility

`tests/scrape/fixtures/salary-three-routes-2026-11-28.json` carries raw
PDF identity and page-and-line excerpts, with exact locations (e.g.
`p2:l29` is physical page 2, extracted line 29, both one-based). The
layout digest is SHA-256 of UTF-8 JSON of the array of page arrays,
using `pdfplumber` default `extract_text().splitlines()`, Python
`json.dumps(pages, ensure_ascii=False, separators=(",", ":"))`. To
isolate English in ADIB only, crop each page to
`(0, 0, page.width / 2 + 6, page.height)` first. The ADIB witnesses
`p2:t1:r#:c#` are one-based cells from `extract_table()` on that
cropped page. Preserve the bank's original source currency symbol in
table evidence and report AED to readers.

The secondary date anchors are literal matches from the contemporaneous
official HTML after unescaping entities, removing HTML tags, and
collapsing whitespace; the fixture carries both source URLs, raw body
SHA values and retrieval times. Separate body hash, layout hash and
excerpt/date-evidence hash protect against version or line drift. On a
source change, independently re-read before making new pins. The
replayer never calls the network and never writes site data. The tests
reproduce the exact MDX cash and salary boundaries, date bases, payout
terms, card flags and negative identity changes; presentation and
release require their own independent checks.
