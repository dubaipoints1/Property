# Seven ENBD joining-fee fields — deliberate acceptance

Reviewed 2026-11-09 by root, separately from source/proposal author
`card_coverage`; independent implementation/source review is in
`2026-11-09-operations-independent-review.md`. These are Codex delegates,
not named human journalists. Scope is seven missing fields, not a whole-card
freshness declaration or acceptance of the complete 61-observation packet.

## Source and deterministic review

Root independently read the complete retained named header/value blocks and
re-ran `reviewBankDocumentSources` and `parseEnbdKfsFees` against the authentic
8 November private captures. All five retained PDF/text identities passed
exact requested/final URL, content/signature, complete transport/extraction,
timestamp and full-byte/hash checks. The ENBD full text is SHA-256
`2a59c7a950a88e2568381753ab6fc3cf40ca4791ab5ab549f44a39ce613fbc30`;
PDF `32a0c9a99210039fa0f9a49fb6437d5465a3e97d0cee4c1962a4b37db42bf241`.
Actual capture: `2026-11-08T15:42:28.252Z`, KFS version 08/2026,
[issuer KFS](https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf).
No new provider call or source-capture date was fabricated.

Each accepted value is the parser's exact literal **Free -> 0**, under an
exact ordered named header and column count. It is not an absent value
converted to zero, generic tier mapping, LLM extraction or positive-fee VAT
calculation. Full line/byte spans, raw-token context and hashes are retained
in each `_fieldEvidence.joiningFee` with explicit `pdftotext-layout` source
representation. Source details and all seven row/column mappings are in the
card-evidence operations report.

Accepted joining fee only, **AED 0**:

- Darna Select Visa; LuLu 247 Titanium; noon One.
- Priority Banking Visa Infinite; SHARE Visa Signature.
- U-by-Emaar Family; Voyager World.

All seven previously lacked both a joining-fee value and field provenance.
Add `{amount:0,currency:"AED"}` and `editor-confirmed` field provenance.
No protected joining-fee value is overwritten. Positive standard joining
charges remain unaccepted where product-level promotional applicability
needs reconciliation; all three exact-variant ENBD holds remain.

## Preservation and dates

Whole-catalogue deep comparison to main `4cd884a` proves that the only card
changes are those seven fee objects, seven provenance entries, seven evidence
arrays and the seven editorial `_lastReviewed` dates to 9 November. The
engineering manual requires that editorial date on a data edit. It records
this limited field review, not a complete review of all card facts.

All `lastVerified`, `_lastScraped`, annual fees, eligibility, FX, rewards,
waivers, other field evidence and all other cards are unchanged. Priority
Banking keeps its AED 1,575 renewal and existing first-year waiver/eligibility.
Voyager keeps its existing product-level fee treatment rather than being
overwritten by the KFS's standard renewal tariff. No formula, ranking logic
or automatic scrape policy changes; source completeness and unresolved
claims still govern any tool outcome.

## Verification and release boundary

Eight new deterministic acceptance tests check exact named column/token,
value, source/full-capture identity, representation, line/byte/raw hashes and
the renewal/waiver distinction. The existing exact joining-field inventory
is expanded by seven explicit slugs, not weakened to a lower-bound count.
Combined focused source/schema/coverage checks pass; final full-suite,
rendered combined-head and exact-head release checks are recorded separately.
Independent reviewer rehashed the full captures and reconstructed the exact
old catalogue after removing only the stated additions/date changes.

State: implemented candidate and independently source-reviewed, **not yet
merged or live**. No wider source gap, contradictory HSBC salary, paid
collection failure or whole-catalogue freshness hold is closed by this work.
