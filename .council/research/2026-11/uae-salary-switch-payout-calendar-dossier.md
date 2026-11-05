# Research dossier: uae-salary-switch-payout-calendar

Role: Head of Research. Accessed and handed to Section Editor on 2026-11-05. Independent fact-check remains open.

## Primary sources and claim map

| Draft section | Evidence checked | Limitation |
| --- | --- | --- |
| Emirates Islamic salary/account qualification, processing and continued salary | [October salary offer terms](https://www.emiratesislamic.ae/en/terms-and-conditions/salary-transfer-offer-terms-and-conditions-oct-2026), Campaign Eligibility and General Terms | Official browser lines 1016–1018, 1026, 1030 and 1038. Account opening is not the sole payout trigger; the optional card has a distinct spend clock. |
| FAB recurring qualification and payment | [Conventional offer PDF](https://www.bankfab.com/-/media/fab-uds/personal/promotions/2026/20-percent-cashback-on-salary-transfers/terms-and-conditions-en.pdf), §5.7–12 | Read-only source run below, cleaned lines 2435–2451. The monthly qualification and payment timetable are separate. Missed months are not retrospectively paid. |
| DIB home-finance valuation-fee reversal is not joining cashback | [DIB XTRA PDF](https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf), §§3.1 and 4.13 | Same run, cleaned lines 2772–2773 and 2898–2908. Do not apply the joining-bonus clock to the home-finance benefit or infer a net gain. |

## Source capture and completeness

Free read-only [GitHub Actions source run 42012970512](https://github.com/dubaipoints1/Property/actions/runs/42012970512), executed on 2026-11-05, captured the EI HTML and FAB/DIB PDFs successfully. PDFs were converted with `pdftotext -layout` by the existing source reader. The workflow writes no repository data and uses no LLM or Firecrawl credits.

The EI HTML output reached the reader's character cap before its General Terms. Its qualification excerpt is at cleaned read-step lines 2267–2275. **The payout/reversal clauses were therefore independently read on the full official browser page**, not inferred from the successful workflow status. FAB and DIB excerpts above are within their captured PDFs. Line numbers refer to the read-step-only output after removing the timestamp prefix, not a truncated tool transcript.

## Existing verified model, no new financial inputs

The article imports the published EI and FAB offer entries through Astro's content collection and calls `getSalaryTransferTimeline`. The campaign checksum gates the already-reviewed wording. If an offer's source/terms change, the draft must not silently inherit a different campaign; rendering should fail closed for review. No new salary band, fee, payout amount or formula is introduced.

`src/lib/salaryTransferTimeline.ts` and the [previous Scorecard dossier](uae-salary-switch-scorecard-dossier.md) are existing publication evidence, not substitutes for the new clause checks. The new article does not calculate a calendar deadline for a fictional customer, because qualification, payroll posting and optional-product events depend on the actual case. DIB finance remains explicitly unpriced.

## Original editorial contribution

A compact record separates campaign entry, employer payroll credit, completion of conditions, expected processing window and ongoing retention/reversal obligations. These are an editorial organisation of verified terms, not a bank-issued payment promise. No visitor analytics, customer interview or first-hand application experience is asserted. No competitor copy or methodology supplies the bank facts.

## Open questions / deferred review

- Actual applicant eligibility, employer payroll cut-off, correct qualifying product and credited transaction dates require the reader and bank; not answered here.
- The reader should retain the exact application route/terms and ask for the event which starts processing. Do not promise that opening before a closing date establishes eligibility.
- Root still needs independent Fact-Checker, SEO and standards decisions plus built-page/link/schema/visual QA. No publication is recorded by this file.

## Last verified

2026-11-05. Recheck the current campaign terms before publication and at the article review date.
