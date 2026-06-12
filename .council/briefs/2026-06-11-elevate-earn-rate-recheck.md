# Brief — Etihad Guest Elevate earn rates: live page contradicts L2; review verdict may invert

**Opened:** 11 June 2026 (consolidating session, post-#239 audit)
**Owner:** travel-experiences-editor, with Head of Research for the KFS pull
**Tier:** T2 (data + review rewrite once rates confirmed)
**Card:** `emirates-nbd-etihad-guest-elevate`

## What we know

L2 (`src/data/cards.json`, verified 2026-05-20) carries, per AED 10:
`travel/partnerBrands/dining: 5, international: 3, everythingElse: 2`.

The live issuer page was fetched via Firecrawl on **11 June 2026**
(https://www.emiratesnbd.com/en/cards/credit-cards/etihad-guest-visa-elevate)
and now states, exact quotes:

> "10 Miles per 10 spend on Etihad Airways, hotels and dining"
> "Up to 6 Miles on all other spends"

The 6 June weekly scrape captured the same strings in
`_scraped_freetext` — this is a stable change, not a banner glitch.

## Why it matters

The review's load-bearing argument is that the Elevate's earn (5 per
AED 10) **trails** the Inspire's and FAB Infinite's 7 per AED 10 — it
appears in the cons, editorTake, and comparison sections. If the live
rate is 10 per AED 10 on Etihad/hotels/dining, the Elevate **leads**
the siblings on those categories and the verdict inverts.

## Why this session did not fix it

"Up to 6 Miles on all other spends" is marketing tiering, not a rate
card — the international vs domestic split is not derivable from the
product page, and §6 bars typing numerics without a deterministic
source line. The card has **no kfsUrl in L2**; the KFS (or the rates
table deeper in the page) is needed for the full split.

## Actions

1. Head of Research: pull the Elevate KFS / full rates table (the
   Firecrawl channel works from the main session — see CLAUDE.md
   credential note, verified 11 June).
2. travel-experiences-editor: re-key L2 `earnRates` + `earnUnit` with
   provenance `editor-corrected`, then rewrite the review's earn
   argument (cons bullet 1, editorTake, "earn trails the siblings"
   passages) and re-run the Value-to-me arithmetic.
3. Fact-Checker: verify the rewritten claims against the KFS before
   the Chairman gate.

Welcome bonus needs no action: the live page confirms "Up to 200,000
Etihad Guest Miles", matching L2 and the review.
