# Independent review: HSBC Live+ product age correction

Date: 2026-11-10. Reviewer: Codex AI delegate `monitor10_repair`.
Authorship separation: I did not author the card parser, fixture, data
correction or card-source report. I authored the separate monitoring change;
this report does not review or approve that code. Three review lenses below
are one identified AI reviewer, not three human editors.

Outcome: **PASS for this bounded source/age correction**, subject to root's
combined release checks and genuine Council/Chairman/exact-head gates. No
whole-card verification, article acceptance, paid collection recovery or
deployment is approved by this report.

## Source / Head-of-Research evidence lens — PASS

I read the complete 10,496-byte deterministic primary text, including the
eligibility, fees, earning conditions, required documents, other products and
additional-information sections. I independently read the private receipt
manifest, parser, complete factual fixture, tests, source-author report and
actual `cards.json` changes. Complete source bodies remain outside Git.

Exact source: <https://www.hsbc.ae/credit-cards/products/live-plus/>. The
manifest records the same requested/final URL, HTTP 200, no redirects,
`transportComplete`, `extractionComplete` and `complete` true, captured at
2026-11-10T16:04:11.507Z. I independently loaded and hashed the complete
authentic retained files under
`/var/folders/91/6_h4wqg90m7171x6fcrlf2hm0000gn/T/dubaipoints-source-archive/`:

| Artefact | Bytes | Recomputed SHA-256 |
|---|---:|---|
| `01-0e50363eed4dc74d.response.html` |240907|`970c20a769e1c7f6a5cdb46b36d2a9db2516de102a74808d351cf6ba7e9f8240`|
| `01-0e50363eed4dc74d.text.txt` |10496|`271f5438d346fe6ec8aa8950f4b32eee52dcc517c6f99be58e650d397b97a3c0`|

The current `fetch-sources.mjs` hash matches the receipt's
`37248dc27478edc6fe148367208e24ebac3106fad9cf6e70ffaf256920cdaa51`.
Executing its actual `htmlToText` against the complete decoded HTML reproduces
the complete stored text exactly. The factual fixture is the contiguous
original lines 158–170, SHA-256
`361344130a49867f58750aa269a55c30b0c2357d05df60a5664fc71e70784230`;
it is not presented as a complete bank page or used to claim a fresh PDF read.

The separate KFS receipt is explicitly incomplete/extraction-failed. I did
not repair that receipt or accept any new KFS-based figure. This review
used local retained captures only; no external source request or paid call.

## Fact-Checker / Section evidence lens — PASS

The named Live+ “Who can apply?” block has the exact raw row
`- Be aged between 18 and 65` at original full-text line 165. Its SHA-256 is
`fe886f2b6ba70d74e948e99ab0b94d2fedf928f83666397f85bf23c5b305a48b`.
Independently located offsets are zero-based UTF-16 code units 4292–4319
exclusive, and UTF-8 bytes 4318–4345 exclusive in the complete text; these are
not offsets into the HTML or shortened excerpt.

I executed the actual deterministic `parseHsbcLivePlusAge` twice: once on
the factual excerpt and once on the authentic complete text with
`firstLine: 1` and its recomputed hash. Both returned identical evidence:
`eligibility.minAge: 18` and `eligibility.maxAge: 65`, original line 165. No
LLM extraction, monthly-rate division, salary inference, price, cap or
approval guarantee is involved.

The income paragraph has conditional employer/income branches. The existing
salary/KFS disagreement remains explicit; parent `eligibility`, `interestRate`
and `earnRates` provenance remain `needs-review`. Other reward/cost/model
holds are retained in the author report. Application age does not establish
credit approval or universal salary eligibility. No contributor/COI statement
or article byline acceptance is inferred.

## Technical / preservation lens — PASS

I loaded baseline `cards.json` from exact pre-candidate
`f87d28e06ee9931a7583aa8b7c13338952bc1fdd` and semantically compared all 75
records against the candidate. The other 74 cards are deeply identical. All
75 `lastVerified` and `_lastScraped` values are identical. Reversing only the
declared age values, dotted age evidence/provenance, limited `_lastReviewed`
and review-scope sentence reconstructs the original Live+ record exactly.
Thus every other eligibility/financial/earn-rate/fee value and historical
scrape text is preserved, including the seven existing ENBD joining fields.

The new Live+ record passes the actual `CardDataSchema`. Each accepted age
evidence object exactly equals the parser output after removing its
`field`/`value` properties, including capture method/representation, source
hashes, line and raw-row hash. The offline parser has no network or writes.

Executed Node 22.20 focused tests:

`tests/scrape/hsbc-live-plus-age.test.ts`,
`tests/scrape/bank-parsers.test.ts`, and
`tests/scrape/bank-document-review.test.ts`:
**19 tests, 19 pass, zero failures/skips**. The first file covers wrong
product/query, missing/hash-drifted provenance, duplicated eligibility
blocks/age rows, malformed/reversed ages, schema acceptance and retained holds.

These are actual source/parser/preservation checks, not a browser/render,
whole-site accessibility, full-suite or production certificate. Root owns
combined testing, independent review of my separate monitoring code and
protected merge/deployment verification.
