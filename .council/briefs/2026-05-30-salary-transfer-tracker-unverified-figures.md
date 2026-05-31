---
status: open
tier: T2
raised-by: decay-audit on salaryTransferOffers (30 May 2026)
owner: head-of-research (primary-source scrape) → business-realestate-editor (L2 + body rewrite)
chairman-status: pending
---

# Brief — 2 salary-transfer tracker entries shipping illustrative-skeleton figures with 404 source URLs

**Date:** 2026-05-30
**Tier:** T2 (data-correction across 2 published tracker entries; not
yet T3 because no schema change is proposed)

## The finding

The 30 May 2026 decay audit on `src/content/salaryTransferOffers/`
surfaced two entries whose `lastVerified` had aged past 30 days:

- `adcb-2026-h1.mdx` — lastVerified 2026-04-29 (31 days old)
- `rakbank-2026-q2.mdx` — lastVerified 2026-04-29 (31 days old)

Attempting to re-verify against the published `sourceUrl` on each:

| Entry | sourceUrl | Status |
|---|---|---|
| adcb-2026-h1 | `https://www.adcb.com/en/personal/promotions/salary-transfer` | **404 Not Found** |
| rakbank-2026-q2 | `https://www.rakbank.ae/personal/accounts/salary-transfer` | **404 Not Found** |

Both entries' published prose also already carry a "**Verification
status:** illustrative skeleton" caveat from the original Phase 2 spike
— meaning the figures presented as a real tracker were never
primary-source-verified.

A Firecrawl search surfaced the **live primary sources** for both
banks (campaigns are still running, just at different URLs):

| Entry | Live primary source | Live headline |
|---|---|---|
| adcb-2026-h1 | `https://www.adcb.com/en/personal/promotions/switch-nine-salary-transfer` | "Earn rewards up to AED 7,000 when you transfer your salary and spend AED 2,500 on your ADCB Credit Card." |
| rakbank-2026-q2 | `https://www.rakbank.ae/en/landing-page/accounts/accounts-lp` (or `/en/everyday-banking/salary-transfer/rak-more`) | "up to AED 4,000 cashback on salary transfer ... offer is only until 30th June 2026" |

The live headlines do **not** match the L2 tracker structure:

- **L2 ADCB** carries a 3-band structure (AED 4,000 / 8,000 / 12,000
  at min salary AED 15k / 25k / 50k respectively, split into salary-
  transfer + card-spend halves). **Live ADCB** appears to be a single
  AED 7,000 tier conditional on salary transfer + AED 2,500 card
  spend.
- **L2 RAKBANK** carries a 3-band structure (AED 1,500 / 3,000 /
  5,000 at min salary AED 5k / 15k / 30k). **Live RAKBANK** appears
  to be a single "up to AED 4,000" headline, no published tiering
  in the search-result snippets.

## Why this is editorial, not autonomous

Per Charter §6 (no LLM extraction for typed numerics) the campaign
bands, bonus amounts and spend gates must be derived from a
deterministic parse of the issuer's live page, not from a search-
result snippet or an LLM JSON extraction. The Head of Research arm
owns Firecrawl markdown scraping; the typed L2 shape requires a
business-realestate-editor pass to reconcile bands → `salaryBands[]`
+ components + clawback terms.

The autonomous path I considered and rejected:

- **Bump `lastVerified` to today** — would falsely promote illustrative
  figures with the seal of a recent verification. Rejected.
- **Update `sourceUrl` to the live URL** — would put a live link
  next to figures that don't reflect that source. Rejected as
  misleading.
- **Set `archived: true`** — the salaryTransferOfferHistory pattern
  is for "ended" cycles, not "unverified". Wrong fit. Rejected.

## Recommended sequence

1. **Head of Research** scrapes both live primary-source URLs with
   markdown format (not JSON extraction), captures the verbatim
   campaign terms and any tier table, files a dossier under
   `.council/research/2026-05/salary-transfer-adcb-rakbank-live.md`.
2. **business-realestate-editor** rebuilds `salaryBands[]`,
   `requirements[]`, `clawbackTerms` per primary source. Strips the
   "illustrative skeleton" caveat from the body once the figures are
   verified.
3. If the live offers turn out to be single-tier (not band-keyed),
   the existing salaryBands schema still accommodates this (one
   band, no max). No schema change.
4. **chairman-status: approved** before the corrected entries
   re-publish.

## In-flight hedge (optional, low-risk)

If the editorial cycle is more than 24h out, the
business-realestate-editor could consider:

- Hiding the two entries from the public `/salary-transfer/` tracker
  surface (e.g., adding a `_unpublished: true` flag — would require a
  small T1 schema addition to gate the tracker query) while the
  re-verification is in flight.

This is a low-risk T1 schema add that protects readers from an
illustrative-skeleton entry presented as a recommendation. The
hedge is **not** in scope for this brief — flagged here only as an
option the editor may take in coordination with the Chairman.

## Channel-status footnote

The two 404 URLs were checked via Firecrawl in the main session on
2026-05-30. The new ADCB URL (`/promotions/switch-nine-salary-
transfer`) and the new RAKBANK URLs are confirmed as live (200 OK
on the issuer's own domain). Source-fetch channel: working primary
sources; subsequent scrape work is unblocked.

## One-line summary

**Two T2 corrections + 1 unverified-content kill-list-shaped issue
across `adcb-2026-h1` and `rakbank-2026-q2`. Live URLs found, figures
don't match L2 tracker structure. Awaiting Head of Research scrape +
business-realestate-editor rebuild.**
