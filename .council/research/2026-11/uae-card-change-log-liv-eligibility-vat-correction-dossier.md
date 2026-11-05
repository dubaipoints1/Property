# Research dossier: uae-card-change-log-liv-eligibility-vat-correction

Role: Head of Research. Handed to Section Editor on 2026-11-05. Financial-field verification was performed by the separate accuracy workstream; article-level independent review is still required.

## Primary evidence

- [Liv KFS](https://www.liv.me/-/media/liv/website/pdf/2024/kfs/apr/liv-credit-card-key-facts-statement-kfs-english.pdf), printed January 2026, page 1 Product Information table. Capture and deterministic parsing are documented in [the accuracy fact-check](../../factcheck/2026-11/2026-11-05-liv-salary-fees.md). The URL's older directory is not treated as the PDF edition.
- [Liv product page](https://www.liv.me/en/liv-credit-card), accessed 2026-11-05 by the accuracy workstream. Provides the KFS link, VAT-exclusive comparison-table label and conditional joining-fee waiver. No unconditional annual waiver inferred.
- [Liv feature terms](https://www.liv.me/en/important-information/features/liv-credit-card-feature), accessed 2026-11-05 by the accuracy workstream. Monthly card-spend tiers are not salary eligibility.

The separate agent's reproducible source manifest is `tests/fixtures/issuer/liv-kfs-january-2026-source.json`. PDF SHA-256: `5aac22dcc2a4e2b17ffc406f200d95384d2a6fd0b768cf8e3525d728f8711827`. Its retained full product table has fixture SHA-256 `77d7a93794d479e9152fb44856310a22c21602af64dacaf8c2d820d7df4456f1`. `scripts/ci/parse-liv-kfs.mjs` validates the edition, all named columns and row structure, then deterministically parses the financial fields; adjacent Tamayaz columns must not be substituted for Cashback.

## Article claim map

| Claim | Basis | Bound |
| --- | --- | --- |
| Our previous no-minimum salary presentation was wrong | Accuracy fact-check previous-model comparison plus named-column KFS salary results | Publisher correction only; no evidence for the date when Liv introduced these requirements. |
| Cashback+ joining and recurring fees needed VAT correction | Same KFS Joining Fee and Renewal Fee rows, cross-checked with the product page's VAT-exclusive wording | Do not present the old before-tax and corrected after-tax figures as different bank prices. |
| The joining-fee waiver is conditional and does not establish an annual-fee waiver | Product page's pre-application Liv Max condition, accuracy fact-check | Do not imply a subscription is free or improves net value without pricing it. |
| Salary minimum is not approval | KFS eligibility criteria beyond salary | No invented credit-score cut-off, approval guarantee or personally tailored recommendation. |

## Numeric publication method

Use the deterministic source table/parser supplied by the accuracy agent, or its already-corrected model-backed components as agreed with the root integrator. Do not type an LLM-extracted copy into the article. Preserve the January 2026 source snapshot if rendering a historical correction; future live model changes must not silently rewrite a dated event. The article must not advance the cards' full-product verification dates: this recheck establishes only salary and joining/renewal-fee fields.

## Original contribution and remaining unknowns

The series already published a Citi application-route baseline. This Liv edition instead owns an actual DubaiPoints error, explains how a missing field and a VAT label can distort a shortlist, and points the reader back to corrected product data. No user-analytics inference or new bank announcement is needed.

No assurance is given on every other Liv reward rate, cap, waiver, charge or current application outcome. Independent article-level facts/SEO/standards review, built rendering, links and the Council gate remain open. Root owns release; this dossier is not publication.

## Last verified

2026-11-05, within the stated salary and joining/renewal-fee scope.
