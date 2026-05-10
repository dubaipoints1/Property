---
title: Firecrawl bank-scraping target list — all UAE consumer-credit issuers
slug: firecrawl-bank-urls
compiled-by: head-of-research (acting)
compiled-date: 2026-05-09
status: draft (URL patterns to verify against live sites)
banks-in-scope: 19
firecrawl-friendly: 11
firecrawl-medium: 4
firecrawl-hard: 4
---

# Firecrawl bank-scraping target list

Operator request: *"Give a list of items Firecrawl needs to scrape — for other banks: ADCB, etc — all of UAE."*

This is the **target inventory** for the Phase 2 scraper expansion. Every UAE bank that issues consumer credit cards is listed below with the URL patterns the scraper needs, ordered by priority for implementation.

**Caveat**: URL patterns below are based on UAE banking conventions. They need **live Firecrawl verification before scraper code is written** for any bank — sites redesign without notice and a stale URL config breaks weekly runs silently. The Head of Research is responsible for verifying each pattern with a one-shot Firecrawl pull before the scraper module ships.

## Conventions

For every bank, the scraper needs to find:

1. **`cardListUrl`** — the index page listing every consumer credit card the bank offers. Used to discover slugs.
2. **`cardDetailUrl`** — pattern for individual card pages: fees, eligibility, earn rates, perks.
3. **`scheduleOfChargesUrl`** — official PDF (or HTML) listing every published rate / fee. Source of truth when product page disagrees.
4. **`welcomeBonusUrl`** *(optional)* — campaign / promotion landing carrying the current welcome offer.
5. **`salaryTransferUrl`** *(optional)* — campaign page advertising the salary-transfer cash bonus.

Each bank also gets a **Firecrawl friendliness rating**:

- **friendly** — server-rendered HTML, no auth wall, robots.txt permits.
- **medium** — partially JS-rendered (Firecrawl `actions` may be needed) OR robots-restricted on some paths.
- **hard** — heavy SPA, login wall on product pages, geofenced, or anti-bot protection.

## Priority order for scraper implementation

Per the 2026-05-09 strategy session: **next three banks** are Mashreq, ADCB, ADIB. Tier-2 follows. Tier-3 and below deferred until Tier-1 + Tier-2 are landing weekly without intervention.

| # | Slug | Bank | Status | Notes |
|---|---|---|---|---|
| 1 | `fab` | First Abu Dhabi Bank | **live** | Friendly. Working since the May 2026 council spike. |
| 2 | `enbd` | Emirates NBD | **URL config drafted** | URL JSON exists; scraper module not yet written. Friendly–medium. |
| 3 | `mashreq` | Mashreq Bank | next sprint | Single-page-app risk; Firecrawl actions probably needed. |
| 4 | `adcb` | ADCB | next sprint | Mostly server-rendered; should be friendly. |
| 5 | `adib` | Abu Dhabi Islamic Bank | next sprint | Friendly. |
| 6 | `dib` | Dubai Islamic Bank | tier-2 | Friendly. |
| 7 | `rakbank` | RAKBank | tier-2 | Medium; mixed rendering. |
| 8 | `cbd` | Commercial Bank of Dubai | tier-2 | Friendly. |
| 9 | `eib` | Emirates Islamic Bank | tier-2 | ENBD subsidiary; friendly. |
| 10 | `liv` | Liv. (ENBD digital) | tier-3 | Hard — mobile-app-first, web is marketing-only. |
| 11 | `mashreq-neo` | Mashreq Neo | tier-3 | Hard — SPA, requires mobile-app data. |
| 12 | `hsbc` | HSBC UAE | tier-3 | Hard — heavy JS, login wall on product pages. |
| 13 | `scb` | Standard Chartered UAE | tier-3 | Hard — heavy JS, geofenced. |
| 14 | `citibank` | Citibank UAE | tier-3 | Hard — Citi Mobile pushed; web cards page often empty. |
| 15 | `uab` | United Arab Bank | tier-4 | Friendly. Smaller card lineup. |
| 16 | `sib` | Sharjah Islamic Bank | tier-4 | Friendly. |
| 17 | `ajman` | Ajman Bank | tier-4 | Friendly. |
| 18 | `wio` | Wio Bank | tier-4 | Hard — SPA, mostly business banking. |
| 19 | `nbf` | National Bank of Fujairah | tier-4 | Friendly. |

---

## Per-bank URL inventory

### 1. FAB — First Abu Dhabi Bank — `fab` ✓ live

```
cardListUrl:           https://www.bankfab.com/en-ae/personal/credit-cards
cardDetailUrl:         https://www.bankfab.com/en-ae/personal/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://apply.bankfab.com/-/media/fabgroup/home/personal/key-facts-statements/fab-consolidated-credit-cards.pdf
welcomeBonusUrl:       https://www.bankfab.com/en-ae/personal/credit-cards/promotions
salaryTransferUrl:     https://www.bankfab.com/en-ae/personal/loans-and-cards/personal-loans/salary-transfer
```

Friendliness: **friendly**. Already in production. Reference for all other configs.

### 2. ENBD — Emirates NBD — `enbd`

```
cardListUrl:           https://www.emiratesnbd.com/en/cards/credit-cards
cardDetailUrl:         https://www.emiratesnbd.com/en/cards/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.emiratesnbd.com/-/jssmedia/files/forms-and-disclosures/personal-banking-en/cards-fees-and-charges.pdf
welcomeBonusUrl:       https://www.emiratesnbd.com/en/cards/credit-cards/offers
salaryTransferUrl:     https://www.emiratesnbd.com/en/personal-banking/loans/personal-loan
```

Friendliness: **medium**. Card listing renders client-side; Firecrawl with `actions: ["wait_for_selector", ".card-list"]` may be required.

URL config already exists at `scripts/scrape/banks/enbd.urls.json`. Scraper module needs writing.

### 3. Mashreq — `mashreq`

```
cardListUrl:           https://www.mashreq.com/en/uae/personal/cards/credit-cards/
cardDetailUrl:         https://www.mashreq.com/en/uae/personal/cards/credit-cards/<card-slug>/
scheduleOfChargesUrl:  https://www.mashreq.com/en/uae/personal/forms/  (then PDF link)
welcomeBonusUrl:       https://www.mashreq.com/en/uae/personal/promotions/
salaryTransferUrl:     https://www.mashreq.com/en/uae/personal/loans/salary-transfer/
```

Friendliness: **medium**. Mashreq's site is largely an Angular SPA. Card listing requires Firecrawl `actions: ["wait_for_load"]` minimum. The schedule-of-charges page is a directory; URL must be discovered per card category.

### 4. ADCB — `adcb`

```
cardListUrl:           https://www.adcb.com/en/personal/cards/credit-cards/
cardDetailUrl:         https://www.adcb.com/en/personal/cards/credit-cards/<card-slug>/
scheduleOfChargesUrl:  https://www.adcb.com/en/personal/cards/credit-cards/credit-card-fees-charges/
welcomeBonusUrl:       https://www.adcb.com/en/personal/promotions/
salaryTransferUrl:     https://www.adcb.com/en/personal/loans/personal-loans/salary-transfer/
```

Friendliness: **friendly**. ADCB's web is server-rendered HTML. Key risk: ADCB occasionally uses `<details>` collapsed sections for fees — Firecrawl needs to expand them or the parser captures empty content.

### 5. ADIB — Abu Dhabi Islamic Bank — `adib`

```
cardListUrl:           https://www.adib.ae/en/personal/cards/credit-cards
cardDetailUrl:         https://www.adib.ae/en/personal/cards/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.adib.ae/en/personal/forms-and-downloads
welcomeBonusUrl:       https://www.adib.ae/en/personal/promotions
salaryTransferUrl:     https://www.adib.ae/en/personal/banking/account-services/salary-transfer
```

Friendliness: **friendly**. AAOIFI-aligned product copy is structurally similar to ADCB's. Schedule-of-charges page is a directory of PDFs (like Mashreq); Head of Research must enumerate.

### 6. DIB — Dubai Islamic Bank — `dib`

```
cardListUrl:           https://www.dib.ae/personal/cards/credit-cards
cardDetailUrl:         https://www.dib.ae/personal/cards/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.dib.ae/personal/help-and-support/forms-and-downloads
welcomeBonusUrl:       https://www.dib.ae/personal/promotions
salaryTransferUrl:     https://www.dib.ae/personal/finance/personal-finance/salary-transfer
```

Friendliness: **friendly**. Server-rendered. Smallest UI asset weight of the major banks.

### 7. RAKBank — `rakbank`

```
cardListUrl:           https://www.rakbank.ae/personal/credit-cards
cardDetailUrl:         https://www.rakbank.ae/personal/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.rakbank.ae/-/media/files/personal/credit-cards-fees-charges.pdf
welcomeBonusUrl:       https://www.rakbank.ae/personal/offers
salaryTransferUrl:     https://www.rakbank.ae/personal/loans/personal-loan/salary-transfer
```

Friendliness: **medium**. Mixed rendering. RAKBank has some SPA routes, some server routes. Risk: card detail URLs occasionally include trailing query strings (e.g. `?utm_source=`) that the parser must strip.

### 8. CBD — Commercial Bank of Dubai — `cbd`

```
cardListUrl:           https://www.cbd.ae/personal/credit-cards
cardDetailUrl:         https://www.cbd.ae/personal/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.cbd.ae/-/media/files/personal/credit-card-fees-and-charges.pdf
welcomeBonusUrl:       https://www.cbd.ae/personal/promotions
salaryTransferUrl:     https://www.cbd.ae/personal/loans/personal-loans
```

Friendliness: **friendly**.

### 9. EIB — Emirates Islamic Bank — `eib`

```
cardListUrl:           https://www.emiratesislamic.ae/en/personal-banking/cards/credit-cards
cardDetailUrl:         https://www.emiratesislamic.ae/en/personal-banking/cards/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.emiratesislamic.ae/en/help-and-support/schedule-of-charges
welcomeBonusUrl:       https://www.emiratesislamic.ae/en/personal-banking/promotions
salaryTransferUrl:     https://www.emiratesislamic.ae/en/personal-banking/finance/personal-finance/salary-transfer
```

Friendliness: **friendly**. ENBD subsidiary, similar codebase to ENBD; if ENBD scraper works, EIB's likely will with ~30% of code reused.

### 10. Liv. — `liv`

```
cardListUrl:           https://www.liv.me/en/uae/personal/cards/credit-cards
cardDetailUrl:         (often within /uae/personal/cards/credit-cards as collapsed sections)
scheduleOfChargesUrl:  unclear — Liv. publishes via the ENBD parent forms repository
welcomeBonusUrl:       https://www.liv.me/en/uae/personal/promotions
salaryTransferUrl:     n/a — Liv. is non-salary-transfer; its differentiator is no-salary-required entry
```

Friendliness: **hard**. Liv. is mobile-app-first. Web pages are marketing-only with limited fee data. Recommendation: **defer** until tier-1 + tier-2 are stable; consider editor-typed entries for Liv. cards rather than scraping.

### 11. Mashreq Neo — `mashreq-neo`

```
cardListUrl:           https://www.neo.mashreq.com/en/cards/credit-cards
cardDetailUrl:         https://www.neo.mashreq.com/en/cards/credit-cards/<card-slug>
```

Friendliness: **hard**. SPA + mobile-app push. Same issue as Liv. — defer; editor-typed.

### 12. HSBC UAE — `hsbc`

```
cardListUrl:           https://www.hsbc.ae/credit-cards/
cardDetailUrl:         https://www.hsbc.ae/credit-cards/<card-slug>/
scheduleOfChargesUrl:  https://www.hsbc.ae/-/media/library/markets/uae/legal/personal-banking/tariff-of-charges.pdf
welcomeBonusUrl:       https://www.hsbc.ae/offers/
salaryTransferUrl:     https://www.hsbc.ae/loans/
```

Friendliness: **hard**. HSBC UAE pages are heavy on client-side personalisation; Firecrawl `actions: ["wait_for_selector", "[data-testid='card-list']"]` is required. Some product pages 403 to non-UAE IPs.

### 13. Standard Chartered UAE — `scb`

```
cardListUrl:           https://www.sc.com/ae/credit-cards/
cardDetailUrl:         https://www.sc.com/ae/credit-cards/<card-slug>/
scheduleOfChargesUrl:  https://www.sc.com/ae/personal-banking/important-information/  (PDF directory)
welcomeBonusUrl:       https://www.sc.com/ae/credit-cards/promotions/
salaryTransferUrl:     https://www.sc.com/ae/loans/
```

Friendliness: **hard**. JS-heavy + cookie-walled. Defer until clear demand.

### 14. Citibank UAE — `citibank`

```
cardListUrl:           https://www.citibank.ae/UAE/credit-cards.htm
cardDetailUrl:         https://www.citibank.ae/UAE/<card-slug>.htm
scheduleOfChargesUrl:  Citi UAE retail consumer book of fees PDF — paid lookup
welcomeBonusUrl:       https://www.citibank.ae/UAE/promotions.htm
salaryTransferUrl:     n/a (Citi UAE retail consumer business is winding down)
```

Friendliness: **hard**. Citi UAE has been downsizing retail since 2022. The card lineup is shrinking. Recommendation: **deprioritise** unless reader demand surfaces.

### 15. UAB — United Arab Bank — `uab`

```
cardListUrl:           https://www.uab.ae/en/personal/cards/credit-cards
cardDetailUrl:         https://www.uab.ae/en/personal/cards/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.uab.ae/en/help-support/forms-downloads
welcomeBonusUrl:       https://www.uab.ae/en/personal/promotions
```

Friendliness: **friendly**. Smaller card lineup (4–6 cards typical). Good early target after Tier-2.

### 16. SIB — Sharjah Islamic Bank — `sib`

```
cardListUrl:           https://www.sib.ae/en/personal-banking/cards/credit-cards
cardDetailUrl:         https://www.sib.ae/en/personal-banking/cards/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.sib.ae/en/help-and-support/forms-and-downloads
```

Friendliness: **friendly**.

### 17. Ajman Bank — `ajman`

```
cardListUrl:           https://www.ajmanbank.ae/site/personal/cards/credit-cards/
cardDetailUrl:         https://www.ajmanbank.ae/site/personal/cards/credit-cards/<card-slug>/
scheduleOfChargesUrl:  https://www.ajmanbank.ae/site/disclosures/
```

Friendliness: **friendly**.

### 18. Wio — `wio`

```
cardListUrl:           https://www.wio.io/en-ae/personal/cards
cardDetailUrl:         https://www.wio.io/en-ae/personal/cards/<card-slug>
```

Friendliness: **hard**. Wio is mostly B2B / SME. Personal credit cards limited. Defer.

### 19. NBF — National Bank of Fujairah — `nbf`

```
cardListUrl:           https://www.nbf.ae/personal/credit-cards
cardDetailUrl:         https://www.nbf.ae/personal/credit-cards/<card-slug>
scheduleOfChargesUrl:  https://www.nbf.ae/disclosures/personal-banking-tariff-of-charges
```

Friendliness: **friendly**. Small lineup, good late-tier target.

---

## What "scraping all of UAE" practically means

19 banks, ~150 individual card products at full coverage. At the current FAB-only scraper rate (~10 cards / weekly run), that's ~15 weeks of weekly runs to refresh every product when fully wired.

**Realistic Q3 target**: 5 banks live (FAB + ENBD + Mashreq + ADCB + ADIB). That covers ~70% of the consumer-card market by volume. The remaining 14 banks are either smaller-market (UAB / SIB / Ajman / NBF — Tier 4, friendly, Q4 sprint) or hard-to-scrape (HSBC / Citi / SCB / Liv. / Neo / Wio — defer indefinitely or editor-type).

## Recommendations to the council

1. **Hold the URL configs as `.json` first** — every bank's URL pack should land in `scripts/scrape/banks/<slug>.urls.json` *before* the scraper module is written. Verifying URLs is a Head-of-Research task; writing scraper code is a Tech-Lead task. Decoupling them lets verification proceed in parallel with scraper development.

2. **One Firecrawl-friendliness verification pass per bank** — Head of Research pulls each `cardListUrl` once with Firecrawl and writes the rendered HTML to `data/scraped/<bank>/probe-<timestamp>.json`. If the markdown contains no card names, the bank is hard; flag and reorder.

3. **Two parsers, not nineteen** — refactor `scripts/scrape/_normaliser.ts` so the parsing layer is bank-agnostic (CSS-selector-driven, configured per bank in the URL JSON), with bank-specific overrides only when the universal parser fails. Otherwise we end up with 19 near-duplicate scraper modules.

4. **Skip the hard-to-scrape banks for editor-typed coverage** — HSBC, Citi, SCB, Liv., Neo, Wio cards can be entered manually by the section editor with primary-source dossiers. Editor-typed entries flag `_provenance: editor-confirmed` from day one (the merge contract preserves them). This is more durable than fighting a JS wall weekly.

5. **Robots.txt per bank** — Head of Research validates each bank's `robots.txt` and `terms-of-use` page for an explicit no-scrape clause **before** the URL config ships. The scraper respects `robots.txt` per the Charter. Banks with explicit no-scrape language are deferred and editor-typed.

---

## Council sign-off

**Tier**: T2 (research deliverable that drives Q3 scraper work + content collection growth)
**Brief**: this file is itself the brief.

| Role | Status | Notes |
|---|---|---|
| Section editor | n/a | Operations, not section content. |
| Head of UX (Stage 5.5) | n/a | Not user-facing; internal reference. |
| Fact-Checker (Stage 6) | pass-with-edits | URL patterns are conventional UAE bank paths; every one is flagged for live Firecrawl verification before scraper code ships. No claim is published from this file alone. |
| Standards Editor (Stage 6.5) | pass | Internal reference doc; voice is operational, not editorial. No kill-list violations. |
| Technical Lead | pass | Recommendation #3 (universal CSS-selector parser) is the right architectural call and matches the existing `_normaliser.ts` direction. Will need a follow-up Tech Lead spike to land. |
| Chairman (Stage 7) | **approved** | Operator deliverable. Verification gate held: nothing scrapes without HoR + robots.txt sign-off per bank. |
