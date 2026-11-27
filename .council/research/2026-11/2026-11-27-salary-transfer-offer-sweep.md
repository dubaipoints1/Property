# Salary-transfer offer sweep — 27 November 2026

Scope: DubaiPoints Salary Tracker, salary-band and bank views, and its
calculator. Issuer public terms, no application, referral, paid search,
monitor activation, or analytics change. Amounts are not approval promises.

| Campaign | Official evidence and decision |
| --- | --- |
| RAKBANK conventional | [Public campaign](https://www.rakbank.ae/en/everyday-banking/salary-transfer), [standard individual-account terms](https://www.rakbank.ae/globalassets/rakbank/all-pdfs/001---campaign/salary-transfer-cash-reward-promotion-terms-and-conditions-nov-2026.pdf), pp. 1–2 §§1–13. Both languages agree on the cash tiers. The new-account opening deadline and the existing-customer first-payroll deadline are not interchangeable. The lowest of the three salaries sets the band. Exclude the separate draw, referral reward and Elite-specific document. |
| HSBC existing Premier | [Bank's terms index](https://www.hsbc.ae/terms/), [existing Premier terms](https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/premier-existing-to-bank-customers-salary-transfer-offer-tscs.pdf), pp. 1–2. The start of the campaign and edition date are different. Keep the existing-customer cohort out of the general estimate, and do not import foreign-currency activity or the new-customer exception. |
| Mashreq NEO | [Terms index](https://www.mashreq.com/uae/neo/accounts/terms-and-conditions/) separates first salary before and from August. Use [the corresponding 2026 terms](https://www.mashreq.com/-/jssmedia/pdfs/neo/accounts-deposits/TnCs/2026/neo-salary-bonus-tnc-en-ar.ashx), English pp. 1–2 §§1–8. No fixed issuer end date. Previous six-instalment PDF remains relevant only for its own cohort. Date the record only after verifying the new source; show the headline with the early-bird condition and compare/estimate the base only. |
| Emirates NBD | [Separate bonus-interest offer](https://www.emiratesnbd.com/en/campaigns/transfer-your-salary-earn-more) and [revised terms](https://www.emiratesnbd.com/-/media/enbd/files/pdf/transfer_your_salary_win_rewards_tncs_lat.pdf) §2 and general terms (b): revised timing and no stacking. Keep out of the payroll cashback figures. The record for the separate Q4 cash campaign retains the existing typed amount, verification date and closing date. The dated news explainer is not rewritten in this tool release. |
| RAKislamic | [November terms](https://www.rakbank.ae/globalassets/rakbank/all-pdfs/002-campaign/islamic-salary-transfer-tc-nov-2026.pdf), p. 1 §7. English and Arabic end the AED 2,000 band at different thresholds. A visually verified source conflict, not an extraction ambiguity. Bank document SHA-256 `99d56b14431901a253d8498ef81e5f51ccb3d9ed3b2f0ba6139a502280e7068b`. Hold the whole separate offer out of the figures; do not copy the conventional payout. |
| FAB Islamic / Al Masraf | [FAB Arabic terms](https://www.bankfab.com/-/media/fab-uds/islamic-banking/promotions/2026/20-percent-salary-transfer-cashback/fab-islamic-terms-and-conditions-20-percent-salary-transfer-campaign-ar.pdf?view=1), pp. 1–2: new-card condition is explicit, referenced savings mechanics are incomplete. [Al Masraf product](https://www.almasraf.ae/payroll-campaign), [linked KFS](https://www.almasraf.ae/pdf/kfs-al-masraf-salary-plus-account.pdf), p. 2 provisions: KFS calls the amounts proposed; no firm enrolment window or payout deadline. Both outside rankings. |
| Other published products checked | [ADCB Islamic BEYOND](https://www.adcb.com/en/islamic/personal/promotions/switch-nine-salary-transfer.aspx) pays points, [ADIB Ghina](https://www.adib.ae/-/media/project/adib/adibsite/docs/offer/2026/nov/ghina/ghina-rate-salary-transfer-tcs.pdf) profit is balance-dependent, and [Ajman Bank Salary Plus](https://www.ajmanbank.ae/site/salary-plus-program.html) has a draw. [NBF](https://nbf.ae/offers-promotions/open-an-nbf-account-and-earn-up-to-6-15-p-a-bonus-interest/) and [UAB Bonus Plus terms](https://www.uab.ae/help-center/-/media/9CD50BC02A1444EF887C409C4E1A13FE.ashx) require balances; [NBF's other welcome reward](https://nbf.ae/offers-promotions/everyone-gets-rewarded-with-nbf/) requires a referral. Public [CBI](https://www.cbiuae.com/en/Personal) and [NBK UAE](https://www.nbk.com/uae/personal/accounts/everyday-banking/current-account.html) product reviews did not verify a cash campaign. Retain the NBQ hold: no usable fresh primary terms for a comparable cash amount. |

The exact three typed inputs, number extraction and mutation checks are in
`scripts/scrape/_salary-offer-sweep.ts`,
`tests/scrape/fixtures/salary-offer-sweep-2026-11-27.json` and
`tests/scrape/salary-offer-sweep.test.ts`. The fixture records original PDF
and extracted layout hashes and pinned clause/row locations. Date-anchored
RAKBANK and HSBC payout clocks have no fixed months-to-payout estimate.

On future sources, distinguish first payroll, qualifying credits, payout,
retention and any separate dispute deadline. Hide explicitly expired
campaigns from interactive estimates at Dubai midnight without pretending that a
published review date is an issuer deadline. No-JavaScript and bank detail
rendering identify saved terms; campaign facts can still change before a stated
closing date. Continue to review the partial/unconfirmed offers without a
balance conversion or an assumed card, spend, nationality or account status.
