---
status: open
tier: T3
raised-by: salary-transfer coverage audit (5 August 2026)
owner: business-realestate-editor
chairman-status: pending
---

# Brief — salary-transfer tracker covers 2 of 12 banks; scaffolding for the backfill

**Date:** 2026-08-05
**Tier:** T3 (new content across up to ten entries)

## The finding

The salary-transfer tracker is named a core differentiator in the
Charter. It renders **two live offers** — DIB and Mashreq — against the
twelve banks the publication covers. Emirates NBD's entry carries
`archived: true` and is filtered out by `getLiveOffers()`.

As of 5 August the page states this openly: the stats strip reads
"Banks tracked: 2 of 12" and a coverage note names the gap. That fixed
the *honesty* problem. It did not fix the *coverage* problem, which is
what this brief is for.

## What is already done, so nobody repeats it

Tooling built across #303–#306:

- A weekly Firecrawl monitor watching 5 URLs across enbd, mashreq, dib.
- `discover-salary-transfer.mjs` — proposes candidate URLs per bank.
- `verify-candidates.ts` — fetches a candidate and reports deterministic
  evidence (reachability, AED amounts, minimum salary, band and clawback
  language) using the scrapers' own parsers.

**None of that writes offer content.** `salaryTransferOffers` is typed
editor content end to end; the scraper has no free-text equivalent for
salary bands, payout months or clawback terms. Every entry below has to
be read off a primary source and typed by a human.

> **RAKBANK resolved 6 August 2026** (see the 30 May brief for its
> history): the "up to AED 4,000" campaign is live 1 July – 31 August
> 2026 and is now a tracker entry, `rakbank-cash-reward-2026.mdx`, typed
> from the campaign T&C PDF and fact-checked band-by-band. Coverage moves
> to 4 of 12.

## ADCB and RAKBANK are NOT in this brief

They are already covered by
`.council/briefs/2026-05-30-salary-transfer-tracker-unverified-figures.md`,
**status: open**, which has an owner, a recommended sequence, and — most
usefully — the live replacement URLs it confirmed on 30 May:

- ADCB: `adcb.com/en/personal/promotions/switch-nine-salary-transfer`
- RAKBANK: `rakbank.ae/en/landing-page/accounts/accounts-lp`

Work that brief, not this section. Restating it here would double-count
the effort and lose its earlier analysis.

> **A lesson worth keeping.** Both salary-transfer discovery runs reported
> "no candidate found" for ADCB while its live URL sat in that open brief
> for two months. URL discovery is not the only source of candidates —
> check `.council/briefs/` before concluding a bank has no reachable
> offer page.

## Per-bank state

What discovery and verification actually found, so nobody re-runs a pass
that already failed.

| Bank | Candidate state | Next step |
|---|---|---|
| **fab** | ~~No candidate from either run~~ **Resolved 5 August**: owner supplied the 20% cashback URL; entry `fab-20-percent-2026.mdx` is live; landing page + T&C watched | Fact-Checker Stage 6 on the entry (run 6 August — see the entry's verification note). |
| **citi** | **Hand search completed 6 August 2026: documented absence.** A map call returned 47 salary-mentioning URLs; all are Salary Protect insurance, loan-pricing tiers, or funding-based Citigold promos. Citi UAE runs no salary-transfer cashback offer. | None — record stands. The coverage-gap note can cite this as a verified "no offer", not an unknown. |
| **hsbc** | **Hand search completed 6 August 2026: offer found.** AED 2,000 cashback for monthly salary ≥ AED 40,000 (30,000 Emirati) inside the Premier welcome offer, ends 31 December 2026. Page watched; T&C PDF timed out twice, unverified. | Head of Research dossier from the rewards page; verify T&C PDF via Actions channel; then editor types the entry. High threshold — present as the premium-segment offer it is. |
| **cbd** | **Hand search completed 6 August 2026: offer existed, now expired.** The `/cbd-rewards/credit-card-cash-bonus` page carries a full band table but validity 1 June – 31 August 2024 (T&C PDF confirms). Page watched for renewal. | None until renewal — the brief's own rule applies: a bank with no live offer is a finding to record, not a gap to fill. |
| **standard-chartered** | `sc.com/ae/save/salary-account/apply` — NO SALARY-TRANSFER CONTENT (an application form) | The landing page without `/apply` was never proposed. Try it. |
| **adib** | **Resolved 6 August 2026: draw programme, not an offer.** The full T&C is one page — no bands exist. Min AED 3,000, automatic enrollment, 10 monthly winners of 1× salary (cap 10,000), 1 annual winner of 12× salary (cap 200,000). A draw has no guaranteed reward, so no tracker entry; both surfaces watched. | None until ADIB launches a banded offer — the monitor will say so. |
| **emirates-islamic** | Only candidate was `payroll-card`, a WPS prepaid card — not an offer. Archived `sourceUrl` was never primary-source-verified | Locate by hand. |

A bank that runs **no** salary-transfer offer is a legitimate finding to
record, not a gap to fill with something loosely related. The coverage
note already tells readers the distinction, so the data must honour it.

## What each entry needs

Every field in `SalaryTransferOfferShape` (`src/content.config.ts:212`),
so nobody re-derives the schema:

| Field | Notes |
|---|---|
| `bank` | reference to the `banks` collection |
| `name` | as the bank brands it |
| `validFrom` / `validUntil` | campaign dates from the source |
| `tenureMonths` | how long the salary must keep arriving |
| `sharia` | boolean |
| `creditCardRequired` | boolean — see the bundling note below |
| `additionalProductsRequired` | e.g. `credit_card` |
| `salaryBands[]` | `minSalary`, `maxSalary` (null for top band), `rewardAmount`, `rewardType`, `monthsToPayout`, optional `components[]` |
| `requirements[]` | verbatim eligibility conditions |
| `clawbackTerms` | what happens if the salary stops |
| `sourceUrl` | the primary source the figures came from |
| `lastVerified` | the date a human checked it |

**Bundled offers are the norm here, and the schema exists for it.** DIB's
bonus is only paid alongside a covered card or finance facility; ENBD's
top band stacks a card welcome top-up on the cash bonus. Use
`creditCardRequired`, `additionalProductsRequired` and `components[]` —
a headline "AED 5,000" that is really two products must not render as a
standalone salary bonus.

## Sequence

1. **One bank per brief.** Keeps the fact-check reviewable and lets
   partial coverage ship rather than waiting for all ten.
2. Head of Research scrapes the primary source in markdown (not JSON
   extraction, per §6) and files a dossier.
3. business-realestate-editor types the entry.
4. **Fact-Checker at Stage 6, no exceptions** — every band and amount
   traced to the issuer's own terms.
5. Chairman gate before publish.

Once an entry lands, add its `sourceUrl` to
`scripts/monitor/salary-transfer.registry.json` so the monitor watches it
from then on.

## What moves when this is done

The tracker's stats strip and coverage note both derive from the
collections, so they self-correct as entries land — no copy edit needed.
Each bank added moves "2 of 12" without anyone touching the page.

## One-line summary

**Ten banks have no live salary-transfer entry. Tooling to find and verify
source URLs exists; writing the entries is editorial work requiring
primary sources and Fact-Checker at Stage 6. ADCB and RAKBANK are covered
by the open 30 May brief; FAB is the highest-value remaining gap.**
