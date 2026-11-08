# Research dossier: salary-bonus-switch-decision

Prepared 8 November 2026 by `article_briefs`, acting for the assigned
Business & Real Estate desk. **Partial research dossier, not a completed
article, financial-data verification or publication approval.**

Brief: `.council/briefs/2026-11-08-salary-bonus-switch-decision.md`.
Session: `.council/sessions/2026-11-08-source-gap-recovery.md`.

## Evidence identity and reading perimeter

Root supplied the public-source artifact from
[source-reader run 42496702254](https://github.com/dubaipoints1/Property/actions/runs/42496702254),
attempt 1, manifest created `2026-11-08T15:49:21.859Z`.
Local artifact:
`/private/tmp/dubaipoints-source-recovery.yVRvx2/article-pdf-evidence/public-source-evidence-42496702254-1/`.

Manifest policy: HTTP-decoded response-body bytes, separately retained raw
PDF and full uncapped `pdftotext -layout` output within the recorded limits.
Extractor: `pdftotext version 26.01.0`, Node `v22.20.0`;
source-reader SHA-256
`37248dc27478edc6fe148367208e24ebac3106fad9cf6e70ffaf256920cdaa51`;
extraction-bundle SHA-256
`11941098a3c7f33b7f72d72dd2c0dca4f2b9a7b3315ad05d3776504d11ca9d2b`.

The relevant records report HTTP 200, `transportComplete: true`,
`extractionComplete: true`, `complete: true`, `reviewRequired: true`, with no
incomplete reasons. Root checked body/text hashes. This desk read every line
of the supplied extracted text, including the bilingual sections; this is not
a visual table-layout certificate or an independent legal translation review.
Line anchors below refer to the unchanged extracted `.text.txt` files, not a
whitespace-normalised display. Capture dates do not become site verification
dates. No external calls or paid retrieval were performed by this desk.

### S1 — Emirates Islamic account KFS

- Source/final URL: [Current and Savings Account KFS](https://www.emiratesislamic.ae/-/media/ei/pdfs/Key-Information/kfs_accounts_ea.pdf).
- Capture: `2026-11-08T15:49:16.168Z`–`2026-11-08T15:49:18.067Z`;
  observed HTTP Last-Modified `Fri, 24 Apr 2026 09:26:44 GMT`.
- Files: `01-44242d937fbde0ff.response.pdf` / `01-44242d937fbde0ff.text.txt`.
- Extent: eight PDF pages; 451 extracted text lines.
- Body: 176858 bytes; SHA-256
  `8f83bc37e6f2247e2a2ca372e9f97935a2ce78aa2491de4d27be7dfae9e0eae3`.
- Text: 55966 bytes; SHA-256
  `e2dd81bed4f237e626ec6d8c2d44e2e7c351484dfc876070f9c7c7aa20a98159`.

### S2 — FAB salary-transfer campaign terms

- Source/final URL: [Conventional salary-transfer campaign terms](https://www.bankfab.com/-/media/fab-uds/personal/promotions/2026/20-percent-cashback-on-salary-transfers/terms-and-conditions-en.pdf).
- Capture: `2026-11-08T15:49:18.081Z`–`2026-11-08T15:49:19.494Z`;
  observed HTTP Last-Modified `Tue, 07 Jul 2026 13:22:04 GMT`.
- Files: `02-28e03145049f711f.response.pdf` / `02-28e03145049f711f.text.txt`.
- Extent: three PDF pages; 142 extracted text lines.
- Body: 130272 bytes; SHA-256
  `8c5e9f35a8794f2de15aa33278f6c08926d0f5c73f56e760af280fc870d392f6`.
- Text: 9867 bytes; SHA-256
  `5e0dbdc70b02d90b0178c54f7f873c71640a847890a8fd662142bfb9c9ba5243`.

### S3 — DIB XTRA campaign terms

- Source/final URL: [DIB XTRA terms](https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf).
- Capture: `2026-11-08T15:49:19.505Z`–`2026-11-08T15:49:21.153Z`;
  observed HTTP Last-Modified `Wed, 31 Dec 2025 06:11:20 GMT`.
- Files: `03-bae9ff61d72756b5.response.pdf` / `03-bae9ff61d72756b5.text.txt`.
- Extent: eight PDF pages; 400 extracted text lines.
- Body: 232897 bytes; SHA-256
  `60cdab00593ee62a5135841742c4c9c6721d452cdfbba6eaec5018359dda1277`.
- Text: 51578 bytes; SHA-256
  `1e832142ab4be072a3c26011107a37b7019181c4ef9576fb7ced4ca252646fc0`.

## What the newly read documents support — prose only

| Reader decision | Source anchor | Reporting implication and limit |
| --- | --- | --- |
| Does salary transfer necessarily mean taking a new card? | S2 §§3–5, lines 13–26 and 42–66 | FAB describes separate Save and Spend qualification paths. Do not present the card as compulsory for the Save route, or describe a requirement to increase a balance as a bank charge. Exact thresholds remain held for deterministic parsing. |
| Is a quoted campaign return an upfront joining payment? | S2 §5, lines 68–96 | The bank describes recurring monthly qualification, crediting, caps, whole-dirham rounding and missed-month treatment. Do not replace the full calculation with the headline percentage or promise every applicant the maximum. |
| Can a reader spend the reward before qualification/payment? | S2 §5, lines 72–84 | Payment follows the bank's qualification rules; unpaid cashback can be lost on account closure. This is campaign wording, not a new statutory right or guaranteed personal payday. |
| Does an account KFS establish the salary campaign's bonus? | S1 lines 127–159 | No. The KFS supplies package and fee context, with stated VAT treatment and exceptions. It points to the complete Schedule of Charges. It does not substitute for the separate campaign terms. |
| Does DIB offer a stand-alone account-only route? | S3 definitions, lines 29–45; §2.1, lines 191–220 | The captured terms join salary transfer to a Covered Card and/or finance condition. Do not market an unbundled cash reward to the account-only reader. Product-specific approval and costs remain outside the captured account evidence. |
| Is a home-finance fee reversal the same thing as a joining bonus? | S3 §2.1(g), lines 230–234; §4.13, lines 384–394 | No. The reversal depends on an actual eligible valuation fee and its own conditions. Keep finance unpriced; a reversal is not evidence of a cheaper financing package. |
| Can personal transfers stand in for employer payroll? | S3 §§4.8–4.11, lines 352–375 | The document distinguishes accepted salary channels from personal funding. Do not generalise this wording to other banks without their terms. |

## Required deterministic capture anchors — values deliberately unfilled

Technical Lead/Head of Research must supply reviewed, source-bound parsed
payloads before financial numerics enter article prose or tables. This dossier
has not typed financial values out of an LLM reading.

| Document | Exact capture scope | Needed output/guard |
| --- | --- | --- |
| S1 | `Fees & Charges` → `Packages for Individuals customers`, English page 3, lines 129–159 | Bind package columns before capturing salary/balance thresholds, balance-charge exception, opening/closure fees and explicit VAT basis. Do not read adjacent product/profit tables as account charges. |
| S2 | §§1–3, lines 3–26 | Campaign date interval, salary definition/lookback, eligible account types, selected route, reward rate and caps, each with raw source spans. No implied card selection on Save. |
| S2 | §5, lines 44–84 | Qualification target, incremental-balance basis, exclusion list, monthly payment window, rounding-down rule, duration and missed-month/closure treatment. Compare model results with the issuer example rows in lines 86–96; do not use the headline as the formula. |
| S3 | Expatriate table only, lines 77–133; definitions and §2.1 | Bind row and product column explicitly; exclude the nationality table, translated duplicate rows, finance reversal and optional digital uplift from an unqualified account-only amount. |
| S3 | §§2.1(c)–(g), 3.1–3.4 and 4.12–4.13 | Keep bundle, spend, joining-payment and valuation-reversal clocks separate. Do not add product bonuses without satisfying each source condition. |

Available helpers: strict `parseSourceAED` / `parseSourceNumber` in
`scripts/scrape/_lib.ts` can validate an already-scoped token. They do not
identify a package column, promotional date or payout rule. Broad card-fee
normalisation is not an account/campaign parser. Do not concatenate these
multi-product documents and run a generic fee parser over them.

Existing `scoreOffer`/`rankOffers` in `src/lib/salaryTransfer.ts` are conditional
reward models, not net-switching-cost models. `getSalaryOfferRules` binds
special cases to the exact campaign/source. `getSalaryTransferTimeline` checks
the campaign's terms hash; a matching hash protects the existing prose from
silent campaign substitution but is not fresh source verification.

## Conflicts and unresolved source coverage

- **S1 original-layout-confirmed bilingual hold:** English package-salary
  line 137 versus Arabic line 309, and English cheque-book line 150 versus
  Arabic line 321, differ in the original tables, not merely in the extracted
  text. Root confirmed this by rendering and inspecting complete original PDF
  pages 3 and 6 at 120 DPI on 8 November 2026. Private render evidence is
  `/private/tmp/dubaipoints-source-recovery.yVRvx2/ei-kfs-page-3.png` and
  `/private/tmp/dubaipoints-source-recovery.yVRvx2/ei-kfs-page-6.png`, tied to
  S1's unchanged PDF identity above. This desk does not choose either language
  or type either disputed amount. Keep both fields held for clarification;
  other account/campaign fees still need the current Schedule of Charges
  and applicable source verification. No financial amount payload is accepted
  by this visual confirmation, and no tables or images are copied into the repo.
- **S3 product-definition hold:** definitions/§2.1(d) refer to existing/new
  products, while §3.4 excludes existing products from the campaign. Do not
  tell a reader an existing card or facility qualifies without clarification.
- S3 defines a campaign start but the read document does not identify a fixed
  closing date. A readable current URL is not confirmation that new enrolment
  remains available. Retain the live-entry hold until fresh official evidence.
- The current EI salary campaign HTML and tariff have not yet been supplied.
  S1 cannot establish its reward, enrolment or reversal terms.
- Applicable FAB and DIB account/card/finance KFS, full tariffs and any
  individually selected product conditions remain gaps for a net-return case.
- Archived November salary dossiers are prior research, not a replacement for
  these missing current checks. No live card or offer field/date was changed.

## Drafting disposition and safe fragment

**Comparison article held.** Enough evidence exists for a non-numeric
explanatory fragment, not an EI/FAB/DIB reward ranking or net-return result:

> Start with the route you are prepared to follow. Saving more in an account
> is not the same commitment as opening a card and spending on it. Then check
> what the bank counts as a qualifying salary, when the reward becomes payable
> and what you would lose if you stop. An advertised maximum does not answer
> those questions for you.

Proposed evidence flow remains: eligibility checkpoint → required versus
optional products → reward/cost/unknown comparison → guarded timeline →
calculator handoff → questions before changing payroll. Unknown fees and
finance remain unpriced, not zero. No public MDX is created while the source
and parser holds remain.

## Next handoff and status

Root supplies fresh missing HTML and reviewed deterministic payloads; the
assigned editor then drafts against those specific captures. Independent SEO,
Fact-Check, Standards, Technical/Council and Chairman article approval remain
pending. This file advances evidence preparation only; it does not silently
advance the brief's pending publication stages or approve further spend.
