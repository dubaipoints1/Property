# Card-source repair: bounded HSBC Live+ age candidate

Date: 2026-11-10. Author: `card10_source_repair`, a Codex AI research/engineering delegate. State: implemented local candidate; independent Fact-Check/Section and combined Council/release approval remain required. No self-approval, push, merge or deployment by this delegate.

## Actual correction, not a whole-card refresh

The current HSBC Live+ product eligibility section states an age range of 18–65. The stored pending eligibility object still carried minimum age 21 and no maximum. The standalone deterministic `parseHsbcLivePlusAge` now reads only the exact product's bounded eligibility age row and proposes minimum 18 / maximum 65. It cannot emit salary, fees, rates, rewards, approval or a verification date.

The candidate changes only that card's two age values, dotted age provenance/evidence, `_lastReviewed` and limited review-scope wording. Whole `eligibility`, `interestRate` and `earnRates` remain `needs-review`. All 75 `lastVerified` and `_lastScraped` values, every financial value and the other 74 card records are unchanged. The previously accepted seven ENBD joining-fee additions are preserved. Existing raw historical scrape text is retained, not rewritten to pretend it captured the new age.

The product's conditional income branches and the KFS salary scalar still differ. Age correction is not salary qualification and does not clear that hold. The new maximum is the product-page application age, not a guarantee of approval.

## Fresh free primary receipt and reproducibility

- Source: <https://www.hsbc.ae/credit-cards/products/live-plus/>; exact requested/final URL; HTTP 200; `text/html;charset=utf-8`; no redirect.
- Actual capture `2026-11-10T16:04:11.507Z`, existing `fetch-sources/archive-v1`, source-reader SHA-256 `37248dc27478edc6fe148367208e24ebac3106fad9cf6e70ffaf256920cdaa51`.
- Complete decoded HTML: 240,907 bytes, SHA-256 `970c20a769e1c7f6a5cdb46b36d2a9db2516de102a74808d351cf6ba7e9f8240`.
- Complete deterministic readable text: 10,496 bytes, SHA-256 `271f5438d346fe6ec8aa8950f4b32eee52dcc517c6f99be58e650d397b97a3c0`.
- The factual fixture is the contiguous original text lines 158–170, not a fabricated full page. Its own SHA-256 is `361344130a49867f58750aa269a55c30b0c2357d05df60a5664fc71e70784230`; age row is original full-text line 165. Raw age-row SHA-256 `fe886f2b6ba70d74e948e99ab0b94d2fedf928f83666397f85bf23c5b305a48b`.
- Private archive: `/var/folders/91/6_h4wqg90m7171x6fcrlf2hm0000gn/T/dubaipoints-source-archive/manifest.json`, with `01-0e50363eed4dc74d.response.html` and `.text.txt`. Full raw source stays outside Git.

Actual local read-back independently recomputed full body/text hashes and reproduced `htmlToText(body) === fullText`; the receipt and excerpt were compared. The actual parser was also run against the complete authentic 10,496-byte text with `firstLine: 1`; it independently returned both age values at original line 165, matching the excerpt and canonical evidence. Public CI can test the factual excerpt and pins, not re-read private full source. The parser accepts only the precise HTTPS product path, public HTTP body representation with hashes, the named eligibility block and one age row; wrong products, missing/hash-drifted/duplicate sections, malformed or reversed ages are refused.

The same free batch fetched the HSBC KFS PDF successfully but could not run `pdftotext` in this shell. Its receipt remains **incomplete / extraction-failed**, not fixed by changing the receipt. The current PDF body hash `034fb362ced75d8545240d15f0e3e10c4f9b9f43110d2c0d522571f2ee6ecde8` matches the retained earlier body, but no new local full PDF extraction is claimed. No KFS-based value is accepted in this candidate. There were no Firecrawl/media/provider calls or paid credits used by this work.

## Other high-impact gaps: what remains genuinely unresolved

1. **HSBC Live+ salary:** product conditional income branches do not establish one universal minimum. Preserve the current income/KFS disagreement rather than replace it with one scalar. No outreach is proposed or sent under the owner's no-contact ruling.
2. **HSBC monthly interest:** the publicly stated annual APR does not establish monthly interest by division. The existing hold stays; model representation is a separate reviewed change.
3. **HSBC Live+ rewards:** the current product distinguishes base cashback below the accelerated-spend gate. Existing cap schema cannot honestly model that as a global minimum for all earning, and the product groups groceries/entertainment. Leave rewards held until the exact group/cycle/exclusion terms and a suitable model are reviewed; do not type a guessed independent entertainment cap.
4. **HSBC new-product joining fees and waivers:** pages/KFS reviewed here do not explicitly establish zero joining fees merely by omitting one. Cash+ introductory annual waiver is already accepted; omission still cannot establish first-year total cost. Skywards conditions remain held.
5. **ENBD positive joining charges:** standard KFS charges and current product-level annual-fee promotions are not interchangeable. No positive joining value is added without exact offer applicability. Diners Club / Mastercard Platinum / Emirati U-by-Emaar remain exact-document variant holds even where product pages contain already-known annual-fee/salary facts.
6. **Coverage vs verification:** the source-route audit covers maintenance routing, not acceptance of all pending fields or fresh paid monitoring. No claim that all cards are fully verified is made.

## Concurrent automated proposal

Read-only PR533 review: head `ecc239e5ddde0604507dfc08bc9a21d0873affed`, Wio refresh. Its body lists two parser warnings and changes to loyalty programme, verification date and free-text fields, not an accepted source-gap solution. The file has extensive formatting/order churn, so the one-card summary is not enough for merge review. This delegate did not merge it, accept its figures/dates or import it into this candidate. Root owns any separate semantic/source review.

## Tests and next owner

Executed Node 22.20 offline checks: new age parser/acceptance tests plus existing bank-parser, HSBC partial-cost and seven-ENBD-joining protections: **21 pass, 0 fail/skip**. Exact canonical semantic read-back against this workspace's HEAD reconstructs the original catalogue after removing only the stated age/evidence/review-scope changes. Source/scrape dates and every other card are preserved.

Next owner: root appoints an independent Fact-Checker/Section reviewer to read the complete material source/capture and candidate, then runs combined check/build/tests/rendered QA and actual T3 Council/exact-head release gates. This note is a bounded source/engineering result, not independent approval or a new whole-site certificate.
