---
slug: phase-2a-uae-banks-expansion
vertical: business-realestate
assigned-editor: business-realestate-editor
predecessor-brief: card-data-audit-and-ui-programme
research-status: pending
seo-status: pending
draft-status: pending
factcheck-status: pending
tech-status: pending
ux-stage-5-5-status: pending
standards-status: pending
chairman-status: pending
target-publish: 2026-06-10
sources-required: ~70 cards across 6 new banks
tier: T3
gate: phase-1-chairman-approval
---

# Phase 2a — UAE banks expansion (Mashreq, ADIB, DIB, RAKBank, Emirates Islamic, ADCB)

## The reader question

A reader on `/cards/finder/` today sees 34 cards across 2 banks. The operator's bar is "all UAE banks, big or small." Until our database covers Mashreq, ADIB, DIB, RAKBank, Emirates Islamic, and ADCB — the six largest UAE consumer-banking issuers we don't yet carry — the finder cannot answer the real reader question ("which UAE card pays me back the most on what I spend") because three quarters of the relevant supply is missing from the result set.

Phase 2a adds the **next six banks**, picked because every URL pattern in `.council/research/2026-05/firecrawl-bank-urls.md` is rated **friendly** or **friendly–medium** for Firecrawl (no SPA / no auth wall on product pages). This is the highest-conversion sprint we can run.

## Why now

1. **Phase 1 closed clean** (chairman-gate `approved`, 95.5% editor-handled on 34 cards, zero `provenance: scraped` on audited fields). The pipeline is proven.
2. **Firecrawl Hobby plan budget** — the Phase 1 pass burned ~80 credits on 43 URLs + 3 PDFs. Phase 2a's estimated ~70 cards across 6 banks needs ~200 credits + 6 schedule-of-charges PDFs ≈ 230 credits total. Well within the 4,000-credit monthly cap.
3. **The L2 schema is hardened**: `REWARD_UNIT` enum extended (Darna / dnata / Marriott Bonvoy / noon / RED Points); `NETWORK` enum extended (Diners Club + dual-network); `annualFeeWaiver` supports promo waivers with SoC-standard notes. New banks plug in without schema churn.
4. **The Component library and Finder + Compare pages are in production**. Adding cards is now a data-only operation — no new UI required.

## Out of scope (Phase 2a)

- **Phase 2b banks** (CBD, HSBC, Standard Chartered, Citi) are deferred to the next sprint — they need Firecrawl `actions: ["wait_for_selector"]` for client-side card lists, plus geofencing fallbacks. Separate brief.
- **Phase 2c banks** (Liv, Mashreq Neo, Wio, UAB, SIB, Ajman, NBF) are mobile-app-first or business-banking-only; data may need to come from bank press releases. Separate brief.
- **MDX editorial layer** for the ~70 new cards. The L2 data + structured welcomeBonus + perks lists ship in this phase. The section editor's prose layer (the `editorTake` field used by the SpecCard tagline) is a follow-up Phase 2a.1.
- **Schema additions** flagged in the Phase 1 dossier (typed `joiningFee`, `eligibility.invitationOnly`, `earnRates._caps.min_monthly_spend`, `discontinuedForNewApplicants`) are deferred to Phase 2a.0 — a single focused brief that lands those schema fields before the new banks' data starts importing.

## Done when

1. **Six new banks present** in `src/content/banks/`: Mashreq, ADIB, DIB, RAKBank, Emirates Islamic, ADCB. Bank MDX cites the issuer's regulator (CBUAE), branch count, founding year, and salary-transfer policy.
2. **~70 new cards** in `src/data/cards.json`, every field with `_provenance: editor-confirmed` or `editor-corrected`. `lastVerified: 2026-MM-DD` matches the audit date. Zero `scraped` provenance.
3. **Per-bank scrape entry points** at `scripts/scrape/<bank>.ts`, each referencing a `banks/<bank>.urls.json` URL config + the bank's Schedule of Charges PDF as authoritative cross-reference.
4. **Per-card source citations** in `cards.json` — each card carries the live product-page URL + the bank's SoC/KFS PDF URL (`kfsUrl` field).
5. **Audit dossier** at `.council/research/2026-06/phase-2a-audit-dossier.md` mirrors the Phase 1 template (banner findings, T&C gotchas table, schema gaps, per-bank summary).
6. **Finder and compare** unchanged in code, but render 100+ cards instead of 34 — no UI regression.
7. **Council sign-off block** in the merge PR shows Stage 3 / 5.5 / 6 / 6.5 / 7 statuses all passed.

## Per-bank URL handoff (from `.council/research/2026-05/firecrawl-bank-urls.md`)

| Bank | Slug | Card list URL | Schedule of charges | Firecrawl rating |
|---|---|---|---|---|
| Mashreq | `mashreq` | `mashreq.com/en/uae/personal/cards/credit-cards/` | (PDF link from forms page) | medium (SPA wait) |
| ADCB | `adcb` | `adcb.com/en/personal/credit-cards/` | (PDF link in product footer) | friendly |
| ADIB | `adib` | `adib.ae/en/personal/cards/credit-cards` | (PDF link) | friendly |
| DIB | `dib` | `dib.ae/personal/cards/credit-cards` | (PDF link) | friendly |
| RAKBank | `rakbank` | `rakbank.ae/personal-banking/credit-cards/` | (PDF link) | medium |
| Emirates Islamic | `emirates-islamic` | `emiratesislamic.ae/en/personal-banking/cards/credit-cards` | (PDF link) | friendly |

The `adcb.urls.json` and `enbd.urls.json` files already exist in `scripts/scrape/banks/`. Three more URL JSONs need writing.

## Stage routing

- **Stage 2 (Managing Editor)** opens this brief once Chairman approves Phase 1.
- **Stage 3 (Research)** runs in two passes per bank: (a) Firecrawl-map the card list URL to discover the slugs that bank offers; (b) Firecrawl-scrape each slug + the SoC PDF. Budget: 40 credits/bank × 6 = 240 credits.
- **Stage 4 (SEO)** — net new for Phase 2a: each of the six new banks gets a hub page (`/banks/<slug>/`) with the same template as `/banks/emirates-nbd/`. SEO Strategist sets primary keyword + meta for each.
- **Stage 5 (Business & Real Estate Editor)** — the section editor for this beat. Drafts each card's MDX with `editorTake` (one-paragraph publication voice; the tagline regex will pull the first sentence).
- **Stage 5.5 (Head of UX)** — light pass on the 6 new bank hub pages only (the SpecCard surface is unchanged).
- **Stage 6 (Fact-check)** — same gating as Phase 1: kill-list checks per `.council/01_editorial_standards.md §10`; provenance hygiene sweep; T&C gotcha capture.
- **Stage 6.5 (Standards Editor)** — house-voice pass on the new bank MDX + the new card MDX.
- **Stage 7 (Chairman)** — publish gate.

## Acceptance for the Chairman gate

The Chairman will refuse the gate if:

- Any new card carries `_provenance: scraped` on audited fields.
- Any AED figure disagrees with the bank's SoC/KFS PDF.
- Any new card lacks a `kfsUrl` field pointing at a primary source.
- The schema additions deferred to Phase 2a.0 land mid-pass without a separate brief.
- The finder page's first-paint time exceeds the Phase 1 baseline (Lighthouse Performance score regresses).

## Open from Phase 1 (carry-over for the section editor)

The four open questions from the Phase 1 Chairman gate — tagline regex tightening, "we" voice on tool pages, "Any employment" chip handling, stats-strip label parity — should be resolved before the new bank pages render with the same patterns. Either the Chairman ruled on them at the Phase 1 gate (in which case implement during Phase 2a) or they remain ambiguous (in which case the section editor surfaces them in the Phase 2a dossier for re-ruling).

---

_Brief drafted 2026-05-20 by the orchestrator, queued behind the Phase 1 Chairman gate. Open this brief via the Managing Editor (`/brief phase-2a-uae-banks-expansion`) the moment Phase 1 receives `chairman-status: approved`._
