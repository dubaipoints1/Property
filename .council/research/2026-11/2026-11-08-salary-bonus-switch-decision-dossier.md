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

## 2026-11-09 — Fresh HTML, cost ledger and qualitative draft scope

Root delegated Head-of-Research work for this salary article after the owner
approved up to thirty existing Firecrawl credits across the three articles.
Salary allocation: at most two plain searches and six deduplicated basic
fresh page reads, ten credits maximum. This desk used **three reads, no
searches: three confirmed credits**. Unused allocation is not permission for
automatic further work or another provider.

Every call used conversation ID
`11827994-ceed-8ad7-b02f-9f1a7916a33b`, the salary-research objective,
`formats: ["markdown"]`, `maxAge: 0`, `proxy: "basic"`,
`domainTools: false`, `onlyMainContent: false`, `toolDetail: "full"`.
No JSON/LLM financial extraction, highlights, provider, enhanced proxy,
interaction, autonomous agent/crawl, retry or fallback was used. Current tool
schemas were inspected before execution. Each result was non-error, HTTP 200,
with basic proxy and explicit `metadata.creditsUsed: 1`; no charge was inferred
from the shared account balance. Call-level receipts were reported to root.

### Private evidence and receipt identity

Full tool results and returned markdown are retained privately under
`/private/tmp/dubaipoints-article-release.OptQkX/research-salary/`.
These are Firecrawl-returned markdown and metadata, **not raw HTTP bodies**.
The markdown files have a terminal LF added for storage; the hashes below
identify those saved UTF-8 files. Recorded time is local receipt-recording
time in UTC, not an issuer publication timestamp or a browser-timezone claim.
The full serialized tool result is retained beside each markdown file.

| Source | Scrape ID | Recorded UTC | Actual credits | Saved markdown identity |
| --- | --- | --- | --- | --- |
| S4: EI current salary campaign, same official URL as this brief's pin | `01a1be86-00e8-7019-810b-a2da996cdeb7` | `2026-11-09T04:17:28.808Z` | 1 | `01-ei-campaign.markdown.md`; 94001 bytes; SHA-256 `4635906c1f785eeef089a01f293dab584c06b819f3a3ccfb976897f87d11a0f0` |
| S5: [EI account tariff](https://www.emiratesislamic.ae/en/soc/accounts) | `01a1be86-fc74-70b2-b75c-7cb8764dcf92` | `2026-11-09T04:18:19.073Z` | 1 | `02-ei-accounts-tariff.markdown.md`; 94345 bytes; SHA-256 `124752f67a03899bc0a86ee759a70e1b2898d3cb81a790a5edcef64107972dfe` |
| S6: [FAB current campaign landing](https://www.bankfab.com/en-ae/personal/promotions/20-percent-cashback-on-salary-transfers) | `01a1be87-9153-758f-ac6a-40da6d4a5c86` | `2026-11-09T04:19:02.044Z` | 1 | `03-fab-campaign.markdown.md`; 17721 bytes; SHA-256 `1868175925d78f82c60fe9050473bd4d95079c0d342854a3a24e74648e1a0df5` |

Full result files: `01-ei-campaign-full-result.json`,
`02-ei-accounts-tariff-full-result.json`, `03-fab-campaign-full-result.json`.
The entire returned content is preserved; the complete substantive campaign/
tariff sections were read. Navigation/marketing boilerplate was not treated as
campaign evidence. No provider omission was filled from an LLM assumption.

### Current source-to-candidate-draft map

| Candidate section | Source scope | Claim allowed; limit |
| --- | --- | --- |
| Relationship, enrolment and account exclusions | S4 lines 1164–1188 | Existing/new account versus group-wide salary relationship; enrolment; named account and Personal Finance exclusions. No salary band, duration or reward amount typed. |
| Account reward versus optional Covered Card | S4 lines 1190–1207 and separate reward-table headings | Separate eligibility/spend conditions, not an automatic combined reward. No source table copied into article. |
| Retention/disqualification | S4 lines 1209–1211 | Conditional reversal/disqualification exists; exact elapsed periods deliberately not reproduced without a parser payload. |
| FAB Save versus Spend and incremental balance | S2 §§3–5, text lines 13–26 and 44–66; S6 lines 104–141 | Distinct routes; card only for Spend; month-end increment rather than unchanged balance; both routes do not increase reward. No percentage or amount typed. |
| FAB payment/missed month/closure | S2 lines 68–84 | Monthly conditional earning/payment, no retrospective missed-month reward, unpaid reward forfeiture on closure. No exact payment window or cap typed. |
| EI fee exception and VAT basis | S5 lines 1166–1180 and 1293–1295 | Salary-transfer exception to fall-below charge; other services separately priced; tariff's VAT-inclusive wording. No disputed KFS field or tariff amount accepted. |
| DIB different bundle decision and uncertainty | S3 definitions/§2.1, plus §§3.4 and 4.13 | Card/finance condition and separate valuation reversal; do not claim an existing product qualifies, new enrolment is open or finance is cheaper. |

S6's simplified illustrative amounts do not match all S2 exact-rate/rounding
examples. S2 expressly gives its terms priority over marketing. The article
therefore reproduces neither illustration as a new numerical result and
directs readers to the governing campaign terms. S6 also displays savings
products outside S2's eligible current-account list; do not infer campaign
eligibility from the surrounding product catalogue.

S6 links the exact Personal Banking Fees PDF at
`https://www.bankfab.com/-/media/fab-uds/personal/charges-and-fees/fees-and-charges-first-abu-dhabi-bank.pdf?view=1`.
Root was asked to use the existing free PDF reader if a full account-cost
comparison is commissioned. This desk did not spend its HTML allocation on a
multi-page PDF, invent an account tariff or claim that linked-but-unread
document was checked.

### Revised scope and outstanding gates

`src/content/guides/salary-bonus-switch-decision.mdx` is a useful qualitative
candidate: decide the route → identify commitments → separate bundled products
→ price actual services → separate qualification/payment/retention → use the
existing calculator and native payroll checklist. It introduces no financial
numeric, timeline model, valuation or canonical source-date change.

This is **not completion of the originally proposed quantitative comparison**.
Full applicable costs, conflicting EI KFS fields, DIB existing/new-product
ambiguity/live enrolment, and reviewed deterministic amount/period payloads
remain held. The quantitative comparison is not replaced with invented values,
zero unknown costs or a guaranteed net-benefit verdict. Current S4/S5 resolve
the earlier missing-HTML gap only for the qualitative claims mapped above.

No top-ten SERP scan has been performed; SEO remains independent/pending.
The editor is the research author too and does not independently fact-check
or approve its own draft. Fact-Check, Standards, Technical/Council and Chairman
publication gates remain pending. No article publication, commit or merge is
performed by this desk. Root must approve the actual publication candidate,
not treat paid-retrieval permission as content approval.

## 2026-11-09 — Independent Fact-Check findings and publication hold

The independent reviewer held publication against the original quantitative
commission. The qualitative prose is prepared work, not an approved replacement
for the reward/cost comparison. The complete corrected candidate now lives at
`.council/drafts/2026-11/salary-bonus-switch-decision.mdx`; the candidate was
removed from `src/content/guides/` so it cannot publish in a production merge.
Earlier candidate paths and scope descriptions above are retained as history,
not present publication authority.

**S3 correction:** the earlier prose-only row describing a Home Finance fee
reversal as distinct from a joining bonus, and the source map's reference to a
separate reversal, overstate the distinction. S3 §2.1(g), lines 230–234,
expressly says that the Home Finance joining bonus shown in the table is
illustrative and takes the form of a reversal based on the actual valuation
fee charged. Do not add it as an extra fixed payment to that table entry.
The private candidate now states this correctly without typing a fee or cap.

**Method correction:** the private candidate now limits its application/payout
statement to this source-based research. It makes no universal assertion about
contributors' prior personal benefits or bank holdings. Actual contributor COI
confirmation remains pending and cannot be inferred from that method note.

Original numerical comparison, complete applicable cost evidence,
source-specific deterministic parsing, EI bilingual and DIB product/entry
clarification, current SEO work, final independent Fact-Check/Standards/Tech
and Chairman publication approval remain incomplete or held. No completed
article, public route, source-value/model/date promotion or publication
approval is claimed. Salary retrieval remains three confirmed credits; this
correction used no external call or further spend.

## 2026-11-09 — Additional free FAB fee-source capture available

Root supplied [public-source reader run 42561213809](https://github.com/dubaipoints1/Property/actions/runs/42561213809),
attempt 1, for the exact Personal Banking Fees PDF linked by S6:
`https://www.bankfab.com/-/media/fab-uds/personal/charges-and-fees/fees-and-charges-first-abu-dhabi-bank.pdf?view=1`.
Private artifact directory:
`/private/tmp/dubaipoints-article-release.OptQkX/fab-fees/public-source-evidence-42561213809-1/`.

The manifest records HTTP 200, identical requested/final URLs, PDF content,
complete transport/extraction and `reviewRequired: true`, with no incomplete
reasons. Fetch completed at `2026-11-09T04:20:23.909Z`; manifest creation was
`2026-11-09T04:20:23.919Z`. Root verified the complete capture. This desk
independently re-read the manifest and recomputed the following file identities:

- Body: `01-99862624c2f43f71.response.pdf`, 89638 bytes; SHA-256
  `f46721b13d97628c8e5c10bad7620af463a3ab64da90f10d49a4d2f33bb1fa09`.
- Extracted text: `01-99862624c2f43f71.text.txt`, 75884 bytes; SHA-256
  `7bf597e0807ce08b0b33097090f8c45b84330932423a0a21f3971a7992e71135`.

This is HTTP-decoded response-body evidence and a separate complete extracted
text file, not compressed wire bytes. The reader used the same source-reader
and extraction-bundle hashes recorded for S1–S3 above. No full PDF or full text
is copied into the repository. This additional source used the existing free
reader, not another Firecrawl debit; salary paid research remains three
confirmed credits.

The tariff is now available for later complete reading and scoped,
source-specific deterministic mapping. Its availability does not establish
which product/package or fee applies to a chosen applicant, accept any
financial amount, complete the numerical comparison or resolve EI bilingual,
DIB product/entry, SEO, COI or article-publication holds.
