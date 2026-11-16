# Card source audit, batch 1: CBD One issuer fees

Scope: two previously held fees on the named CBD One card. No complete-card refresh, calculator interest change, cashback forecast, welcome-offer change or salary-matching change.

The [CBD One Key Facts Statement](https://www.cbd.ae/docs/default-source/document/cards/cbd-kfs-conventional_cbd-one-cc.pdf), with a 3 September 2026 footer, returned HTTP 200 as a PDF on 16 November at 17:58:21 UTC. It was 325,937 bytes (SHA-256 `2237dfc9faec1ca4bc8504edbc407bccf7edf4b83d54bb886a4e4c3afd4c94e8`). I visually inspected English pages 1–3 and compared them with Poppler layout text (SHA-256 `d1b8b024833df4b3686a07cb6bdccb674b160822d77d872a2be25c794d887ce5`).

- Page 1 names the exact CBD One Visa Signature variant. The issuer FX fee row (layout lines 56–57) applies to international AED and non-AED transactions, and carries across the page break to the separate scheme processing fee clause (lines 74–75 on page 2). Page 3 (148–151) confirms VAT is already included in the published fees. Show the issuer charge only, never the total FX cost.
- The cash withdrawal fee row (lines 53–54) is fixed per withdrawal irrespective of channel. It is distinct from cash interest; no changes to that interest, repayment terms or modelling.
- The direct product URL returned HTTP 403 to this reader. The [bank’s selected-merchant conditions](https://www.cbd.ae/cbdone/assets/doc/CBDOne_TC_New.pdf) and [dated FAQ](https://www.cbd.ae/cbdone/assets/doc/FAQ_2025_Latest.pdf) do not clear all current merchant-credit, channel and benefit details. KFS gives employment and fixed-deposit routes; no eligibility expansion. No new welcome offer independently corroborated.

The committed excerpt fixture preserves both source hashes and exact spans. The parser deliberately rejects a different variant, digest, source, network clause, VAT rule or byte position. Only these two field gates change: CBD’s existing stored fee values are reconciled to those spans; APR, minimum repayment, eligibility, rewards and welcome are untouched. The older whole-card source date and scrape date remain unchanged.
