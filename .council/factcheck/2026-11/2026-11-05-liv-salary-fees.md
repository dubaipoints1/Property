# Liv — eligibility and fee correction evidence

Last checked: 2026-11-05 (by ChatGPT). Field-scoped primary-source review, not a full Liv re-verification and not evidence that the bank recently changed a rule or price.

## Sources and reproducible capture

- [Issuer KFS](https://www.liv.me/-/media/liv/website/pdf/2024/kfs/apr/liv-credit-card-key-facts-statement-kfs-english.pdf), printed January 2026, three pages. The `2024` URL directory does not denote the current PDF edition.
- Downloaded the public PDF using the repository's `DubaiPointsSourceReader/1.0` user agent. Ordinary curl without that user agent returned 403; the successful request did not use credentials or a paid service.
- PDF SHA-256: `5aac22dcc2a4e2b17ffc406f200d95384d2a6fd0b768cf8e3525d728f8711827`.
- Ran Poppler `pdftotext 26.05.0 -layout`. `captureLivKfsProductTable` retained the complete first-page Product Information table, all five product columns, and its edition marker; surrounding prose was excluded and trailing whitespace trimmed. The checked-in fixture and source metadata are `tests/fixtures/issuer/liv-kfs-january-2026-{product-table.txt,source.json}`.
- Rendered page 1 with Poppler and visually inspected the column mapping. The two Cashback columns precede the three separate Tamayaz columns; the latter were not used as Cashback eligibility.
- Local source evidence (not rehosted or committed): `/private/tmp/liv-reverify.Ca8T43/liv-credit-card-kfs-2026-11-05.pdf` and `kfs-page-1.png`.
- Reproduce: `pdftotext -layout issuer.pdf - | node scripts/ci/parse-liv-kfs.mjs -`. This reader only prints parsed values. It never writes card data or invokes a scraper/LLM.

## Deterministic named-column results

| Model field | Previous DubaiPoints value | Parsed issuer value | Basis |
|---|---|---|---|
| Cashback minimum salary | 0; rendered as no minimum | AED 5,000 | `Eligibility Criteria – Min. Salary`, `Cashback Card` column |
| Cashback+ minimum salary | 0; rendered as no minimum | AED 15,000 | Same row, `Cashback+ Card` column |
| Cashback+ joining fee | AED 700; labelled including VAT | AED 735 including VAT | `Joining Fee*`, `Cashback+ Card` column |
| Cashback+ annual fee | AED 700; labelled including VAT | AED 735 including VAT | `Renewal Fee`, `Cashback+ Card` column |

The parser requires the known edition, all five headers in the inspected order, exactly one matching row for each field, valid currency formatting and all five cells. Missing, reordered, duplicated or collapsed columns fail closed for editorial review. Adjacent Tamayaz salary values are regression-tested not to leak into the two Cashback results. Numeric data came from regex parsing of the PDF's extracted text, not an LLM extraction.

## Cross-check and limits

- [Current product page](https://www.liv.me/en/liv-credit-card) links the same KFS. Its comparison table quotes Cashback+ joining/annual fees before VAT and explicitly says all fees are exclusive of VAT. The KFS table does not itself label its figures VAT-inclusive: that treatment is the reconciliation of its parsed 735 with the product page's 700 excluding VAT, not a verbatim KFS label. They are consistent amounts, not evidence of a bank price change. Source HTML hash is in the fixture metadata.
- The product page's joining-fee waiver requires a Liv Savings/Current Account with an ongoing Liv Max subscription **before applying**. This is a joining-fee waiver, not an unconditional annual-fee waiver; no new annual waiver was inferred.
- [Feature terms](https://www.liv.me/en/important-information/features/liv-credit-card-feature) were read to distinguish monthly card-spend tiers from minimum salary and retain the one-card rule. No earn-rate, cap, formula, ranking algorithm, welcome offer or unsupported-estimate assumption was changed.
- `lastVerified`, `_lastScraped` and `_lastReviewed` were not advanced: this review only establishes the stated salary and joining/annual-fee fields. Existing reward figures were not represented as freshly verified by this change.
- Removed old pre-VAT late-payment/replacement amounts from editorial prose rather than presenting them as freshly validated structured fields. The review now points to the issuer KFS for those other charges.
- Meeting a salary minimum is not approval. The KFS also states age, debt-burden and credit-score conditions; approval remains the bank's decision. These requirements must not be turned into an automatic financial recommendation.

## Implementation and QA scope

- Both L2 salary fields marked `editor-corrected`; Cashback+ joining/annual fees and VAT policy likewise marked. KFS added to the source list; false absence-of-salary perk removed.
- Reviews, bank prose, five affected guides and corrections log updated. New inline model-backed salary/fee components avoid another manually duplicated current numeric source. Independent review also removed the retained bank-verdict claim that there was no published salary gate.
- Finder boundary tests check immediately below and at each salary minimum. Source/parser tests check provenance, Compare rows, fee-index facts and consumer evidence; built/browser verification is a separate release gate, not established by unit tests alone.
- No preview CSS, hero, imagery, dependency, scraper or workflow change. No paid source retrieval. No commit, push, merge or deployment by this workstream.
