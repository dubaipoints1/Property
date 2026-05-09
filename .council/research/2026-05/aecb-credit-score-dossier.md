---
slug: aecb-credit-score-explained
target-query: aecb credit score uae
target-volume-bracket: 2k+ monthly searches (per SEO Strategist)
dossier-status: needs-review
compiled-by: head-of-research
compiled-date: 2026-05-09
primary-sources-count: 0
flagged-claims-count: 24
---

# Research dossier: aecb-credit-score-explained

_Author: head-of-research. Brief: pillar piece for `/guides/aecb-credit-score-explained/`, target query `aecb credit score uae`, ≥2,500 words, FAQPage schema candidate, future internal-link spine for every card review's eligibility section._

---

## Source-access status — read this first

This dossier is shipped as `dossier-status: needs-review`. **Every primary source the brief required was unreachable from this session's WebFetch.** The Charter's research arm normally has Firecrawl as the senior tool and WebFetch as fallback; in this session WebFetch is the only tool in scope and it is hitting a wall on every UAE government and bank domain.

### URLs attempted

| URL | Hostname class | Result |
|---|---|---|
| `https://aecb.gov.ae` | Primary regulator | ECONNREFUSED |
| `https://www.aecb.gov.ae` | Primary regulator | "typo or port" (DNS-level) |
| `https://www.aecb.gov.ae/en` | Primary regulator | "typo or port" |
| `https://aecb.gov.ae/en/about-us` | Primary regulator | ECONNREFUSED |
| `https://aecb.gov.ae/en/credit-score` | Primary regulator | ECONNREFUSED |
| `https://aecb.gov.ae/en/individuals/credit-report-and-credit-score` | Primary regulator | "typo or port" |
| `https://aecb.gov.ae/en/products-services/credit-score` | Primary regulator | ECONNREFUSED |
| `https://aecb.gov.ae/en/news` | Primary regulator | "typo or port" |
| `https://www.centralbank.ae/en/our-operations/financial-stability/credit-information` | UAE CB | HTTP 403 |
| `https://www.centralbank.ae` | UAE CB | HTTP 403 |
| `https://u.ae/en/information-and-services/finance-and-investment/credit-information` | UAE gov portal | HTTP 403 |
| `https://u.ae/en/information-and-services/finance-and-investment/credit-information/al-etihad-credit-bureau` | UAE gov portal | HTTP 403 |
| `https://www.bankfab.com/en-ae/personal/loans/personal-loans` | Major UAE bank | HTTP 403 |
| `https://www.emiratesnbd.com/en/help-and-support/credit-bureau` | Major UAE bank | HTTP 403 |
| `https://www.thenationalnews.com/.../al-etihad-credit-bureau-score-uae/` | UAE press | HTTP 403 |
| `https://www.khaleejtimes.com/business/al-etihad-credit-bureau` | UAE press | HTTP 403 |

**The pattern is environmental, not source-side.** AECB itself rejects the WebFetch user-agent at the connection layer (Cloudflare or equivalent edge); Central Bank, u.ae, the four bank pages tested, and both UAE press titles all return 403 from the same fetcher. This is consistent with the TPG dossier of 2026-05-08, which hit the identical wall and was resolved by switching to Firecrawl.

### Implication

Per my Escalation rules: **403/blocked-source escalation goes to Managing Editor.** I am routing this dossier in `needs-review` state with the following recommendation:

1. **Do not let the section editor draft from this dossier as-is.** It is a question-and-URL skeleton, not a verified source pack.
2. **Re-run the dossier under Firecrawl** (`mcp__firecrawl-mcp__scrape` on the URL list below) before the section editor enters Stage 5. Firecrawl's fetcher routinely gets through the same Cloudflare rules that bounce WebFetch — this was the exact remediation on `tpg-design-dossier.md` last week.
3. **If Firecrawl also fails on aecb.gov.ae** — which would be unusual — Managing Editor may need to descope the brief to a narrower angle (e.g. "How banks use AECB scores" sourced exclusively from bank Schedules of Charges and KFS PDFs) until AECB's own portal is verifiably crawlable.

Every numerical claim below is flagged `[NEEDS VERIFICATION]`. I have not invented UAE statistics. Where I describe AECB's product line or the score's general structure, I am summarising the publicly understood shape of the bureau as of 2024–2026; the section editor and Fact-Checker must treat these as hypotheses to confirm against aecb.gov.ae once the source is reachable.

---

## URL pack for re-verification (Firecrawl pass)

These are the URLs the dossier would have been built from. They are listed in the order a Firecrawl operator should hit them. Each line names what claim the URL is expected to substantiate.

### Tier 1 — AECB primary

- `https://aecb.gov.ae/en/about-us` — mandate, founding year, governance, what data the bureau holds.
- `https://aecb.gov.ae/en/individuals` — overview of consumer products.
- `https://aecb.gov.ae/en/individuals/credit-report` — individual credit report contents and pricing.
- `https://aecb.gov.ae/en/individuals/credit-score` — credit score range, bands, factors, weights.
- `https://aecb.gov.ae/en/individuals/dispute` — dispute portal, timeline, evidence requirements.
- `https://aecb.gov.ae/en/individuals/mobile-app` — AECB mobile app, frequency of free pulls (if any), pricing inside the app.
- `https://aecb.gov.ae/en/news` — 2024–2026 press releases (rule changes, telco/utility integration, score-version updates).
- `https://aecb.gov.ae/en/laws-regulations` — Federal Law No. 6 of 2010 (Credit Information Law) and amendments.
- `https://aecb.gov.ae/en/faqs` — myth-debunk material direct from the bureau.

### Tier 1 — UAE Central Bank

- `https://www.centralbank.ae/en/our-operations/financial-stability/credit-information` — CB's regulatory framing of credit-information sharing.
- `https://www.centralbank.ae` — search "AECB" and "credit information" for any 2024–2026 circulars to licensed financial institutions.

### Tier 1 — UAE government portal

- `https://u.ae/en/information-and-services/finance-and-investment/credit-information` — official consumer-facing summary.
- `https://u.ae/en/information-and-services/finance-and-investment/credit-information/al-etihad-credit-bureau` — services overview.

### Tier 1 — Bank pages (eligibility / AECB references)

- `https://www.bankfab.com/en-ae/personal/credit-cards` — FAB credit-card hub; check eligibility microcopy for AECB score thresholds.
- `https://www.bankfab.com/-/media/.../schedule-of-charges.pdf` — FAB SoC; cross-reference any "credit-bureau check" line item.
- `https://www.emiratesnbd.com/en/cards/credit-cards` — ENBD card hub; eligibility microcopy.
- `https://www.emiratesnbd.com/en/help-and-support/credit-bureau` — ENBD's customer-facing AECB explainer (if it exists).
- `https://www.mashreqbank.com/en/uae/personal/cards/credit-cards` — Mashreq card hub; eligibility microcopy.
- `https://www.adcb.com/en/personal/cards/credit-cards/` — ADCB card hub; eligibility microcopy.
- `https://www.hsbc.ae/credit-cards/` — HSBC UAE card hub; eligibility microcopy.
- `https://www.dib.ae/personal/cards/credit-cards` — DIB card hub.
- `https://www.adib.ae/en/personal/cards/credit-cards` — ADIB card hub.

### Tier 2 — UAE press (context, not citation)

- `https://www.thenationalnews.com/business/money/` — search "AECB" for 2024–2026 explainers.
- `https://www.khaleejtimes.com/business` — search "credit bureau" / "AECB" for recent coverage.
- `https://gulfnews.com/business` — same.
- `https://www.arabianbusiness.com` — same.

---

## What the dossier needs to confirm — section by section

The brief asked for ten content blocks. Below, each block is restated as a list of **specific claims to verify** with the URL most likely to host the answer. The section editor uses this as a checklist; the Fact-Checker uses it as a verification map.

### 1. AECB mandate, governance, data holdings

- [NEEDS VERIFICATION] AECB is the federal credit bureau of the UAE, established under **Federal Law No. 6 of 2010**, operational from **circa 2014**. → `aecb.gov.ae/en/about-us` and `aecb.gov.ae/en/laws-regulations`.
- [NEEDS VERIFICATION] The bureau is owned by the **UAE Federal Government via the Ministry of Finance** and operates under the supervision of the **Central Bank of the UAE**. → about-us page.
- [NEEDS VERIFICATION] Data sources: all UAE banks and finance companies licensed by CBUAE; in addition, by 2024–2026 the bureau also ingests **telco data (du, Etisalat / e&)** and **utility data (DEWA, ADDC, AADC, FEWA, SEWA)**, plus **court judgments and bounced-cheque records**. → about-us / data-providers page.
- Open question: does AECB ingest **rental ledger data** (Ejari) yet? Press has speculated since 2022; the editor should confirm directly.

### 2. Score range and bands

- [NEEDS VERIFICATION] Score range is **300–900**, calibrated so higher = lower risk.
- [NEEDS VERIFICATION] Band labels and thresholds (these are the values widely cited but **must be confirmed verbatim from aecb.gov.ae**):
  - Excellent — **[NEEDS VERIFICATION] approximately 731–900**
  - Good — **[NEEDS VERIFICATION] approximately 651–730**
  - Average — **[NEEDS VERIFICATION] approximately 621–650**
  - Below Average — **[NEEDS VERIFICATION] approximately 581–620**
  - Poor — **[NEEDS VERIFICATION] approximately 300–580**
- [NEEDS VERIFICATION] What UAE banks "typically require" for entry-tier vs premium cards is **not published by the banks** and any number we publish would have to be sourced from a bank's own customer-facing eligibility page or a quoted spokesperson — not from inference. **Recommend the section editor not publish a single hard threshold and instead frame it as "banks rarely state public minima; in practice industry feedback suggests scores below ~620 face declines."** This claim itself needs a primary source — flag for editor to confirm with at least two bank relationship managers on the record, or a CBUAE statement.

### 3. What feeds the score

- [NEEDS VERIFICATION] The five widely-understood factor categories — **payment history, credit utilisation, length of credit history, recent enquiries, mix of credit** — and the **weights** AECB attaches to each. AECB has historically published a percentage breakdown; the **exact 2026 figures must come from aecb.gov.ae/en/individuals/credit-score**. Do not reuse FICO weights (35/30/15/10/10); the AECB model is its own.
- UAE-specific contributors that the guide must call out:
  - **Post-dated cheque (PDC) bounces** — recorded as a public record, severe drag.
  - **Salary-transfer status** — the editor should verify whether *transfer status itself* feeds the score or only feeds the *bank's internal underwriting*. These are different things and the public conflates them.
  - **Telco bills (du, e&)** — late payments do feed the bureau as of the post-2018 expansion. → confirm current scope on aecb.gov.ae.
  - **Utility bills (DEWA et al.)** — same as telco.
  - **Court judgments** — feed the public-records section of the report.
- Open question for the editor: does **rent default reported via Ejari** feed AECB yet? — flag if unable to confirm.

### 4. How an individual pulls their own report

- [NEEDS VERIFICATION] Channels: the **AECB website**, the **AECB mobile app** (iOS/Android), and **selected bank apps** (ENBD, FAB, ADCB and others have integrated AECB pull as a feature inside their consumer banking apps — confirm current list).
- [NEEDS VERIFICATION] Pricing: the brief cites **AED 84 + VAT** for an individual report. This needs verification against the **current** AECB pricing page. Historic pricing has been:
  - Credit Report only — historically around **AED 84.00** including VAT, sometimes quoted as **AED 80 + 5% VAT**.
  - Credit Score only — historically a lower price point.
  - Combined Report + Score — historically a bundled price.
  - **All three figures must be re-confirmed at aecb.gov.ae/en/individuals/credit-report at time of draft.**
- [NEEDS VERIFICATION] Frequency of free pulls — AECB has historically **not** offered routine free pulls to individuals. The editor should explicitly check whether a free annual pull was introduced in 2024–2026 (some markets adopted this; UAE may have followed).
- [NEEDS VERIFICATION] Turnaround: real-time / instant via the app and web portal. Confirm.

### 5. How banks use AECB

- [NEEDS VERIFICATION] **Soft pull vs hard pull** — the editor must verify whether AECB's enquiry framework distinguishes the two the way US bureaus do. UAE practice has historically treated all bank-initiated pulls as enquiries that surface on the report; the section editor must NOT import US "soft vs hard" framing without confirming UAE applicability.
- [NEEDS VERIFICATION] **When in the application timeline** banks pull — typically at the underwriting stage, after the applicant submits salary certificate / Emirates ID. Verify with at least one bank's published application flow.
- **AECB-fail thresholds at major UAE issuers — DO NOT PUBLISH WITHOUT PRIMARY SOURCE.** Banks do not publish minimum scores. Any number sourced from forums, comparison sites, or unattributed claims is **off-limits per the Charter** (no aggregator citation, no UGC). The editor's options are:
  1. State the truth: "no UAE bank publicly states an AECB minimum."
  2. Quote a specific bank's customer-service or relationship-manager statement on the record (rare and risky).
  3. Cite the **CBUAE Consumer Protection Regulation** if it sets any floor — confirm via centralbank.ae.

### 6. AECB myths to debunk

These are the myths the section editor should address. Each must be debunked from a primary source — not from "industry common knowledge":

- **"Closing a credit card improves your score."** — In most credit-scoring models, account closure can hurt utilisation ratios and history length. Confirm AECB's specific behaviour from aecb.gov.ae's FAQ.
- **"Salary transfer status directly affects your AECB score."** — Likely false in the strict bureau sense; salary transfer affects bank underwriting separately. Confirm.
- **"Telco late payments don't count."** — False since the post-2018 telco integration. Confirm current scope.
- **"Checking your own score hurts it."** — Self-pulls are not enquiries that drag the score in any major bureau model. Confirm AECB's stance.
- **"Settling a defaulted account erases the record."** — Public records and historical defaults remain visible for a defined retention period (often 5 years post-settlement in comparable bureaus). Confirm AECB's retention policy.
- **"Paying minimum due is fine."** — Minimum-due payment avoids late-payment marks but can increase utilisation/interest; framing matters. Confirm with AECB educational content.

### 7. How to improve a UAE score

- Settle any **PDC bounce** through the issuing bank, then request the bank update AECB.
- Register **utilities (DEWA, telco) under your own name** — and pay on time — once they feed the bureau.
- **Reduce credit-card utilisation** below a target ratio. The editor should NOT publish a "30% rule" without confirming AECB recommends it; that figure is FICO heritage.
- **Length of salary-transfer history** with one employer is a known UAE underwriting signal — confirm whether it surfaces in the report or only in bank underwriting.
- **Avoid clustering credit applications** — multiple enquiries in a short window depress the score. AECB's specific behaviour on rate-shopping (one enquiry vs many) needs confirmation.
- **Use the AECB dispute process** for any record the consumer believes is wrong.

### 8. Disputing an error

- [NEEDS VERIFICATION] Channel: AECB website dispute portal and AECB mobile app. Confirm exact path.
- [NEEDS VERIFICATION] Timeline: AECB must respond within a defined statutory window (commonly cited as **20 business days** in comparable jurisdictions; the UAE figure must come from aecb.gov.ae or from Federal Law No. 6 of 2010).
- [NEEDS VERIFICATION] Evidence accepted: bank statements, settlement letters, court orders, Emirates ID. Confirm.
- [NEEDS VERIFICATION] Cost of dispute: historically free. Confirm.
- Escalation: if AECB rules against the consumer, the next step is the **CBUAE Consumer Protection Department** (Sanadak ombudsman) — confirm current routing.

### 9. What changed in 2024–2026

This section cannot be written without a live aecb.gov.ae/en/news pull. Expected change-areas to interrogate:

- **Score model versioning.** Has AECB released a new score version (V2/V3) since 2022?
- **New data feeds.** Telco was added pre-2020; rental (Ejari) was rumoured. Confirm 2024–2026 status.
- **Mobile app pricing changes.** Has the bundled Report+Score price moved?
- **Free-pull introduction.** Any consumer-protection-driven free pull?
- **Sanadak / CBUAE consumer protection rulings** referencing AECB — has any 2024–2026 circular changed how banks use the score?
- **PDC-to-civil-debt reform** (UAE moved bounced-cheque enforcement out of the criminal court in 2022; downstream AECB reporting may have shifted).

### 10. Stat block — five to seven numerical claims

**Every number below is `[NEEDS VERIFICATION]`. The section editor must not surface any of these in the published draft until each is sourced from aecb.gov.ae or another primary URL.**

1. Score range: **300 to 900** [NEEDS VERIFICATION].
2. Individual credit report price: **AED 84 (or AED 80 + 5% VAT)** [NEEDS VERIFICATION] — confirm at draft time.
3. Combined Report + Score price: **[NEEDS VERIFICATION]** — figure not held; pull from AECB pricing page.
4. Median UAE AECB score: **DO NOT PUBLISH WITHOUT A PRIMARY SOURCE.** AECB has at points published aggregate statistics in annual reports or press; check `aecb.gov.ae/en/news` and any annual-report PDF. If unavailable, omit.
5. Number of major UAE banks reporting to AECB: **all CBUAE-licensed banks and finance companies** [NEEDS VERIFICATION] — exact 2026 count from about-us page.
6. Year of AECB establishment under law: **2010** (Federal Law No. 6 of 2010) [NEEDS VERIFICATION].
7. Year AECB became operational for consumer reports: **circa 2014** [NEEDS VERIFICATION].
8. Telco/utility data integration year: **post-2018** [NEEDS VERIFICATION] — confirm exact year.
9. Dispute resolution window: **[NEEDS VERIFICATION]** — pull from AECB dispute portal or Federal Law No. 6 / its executive regulations.

---

## Regulatory citations to fetch

- **Federal Law No. 6 of 2010** (Credit Information Law of the UAE) — primary statute. Find the official Arabic + English text on the UAE legislation portal or AECB's laws-regulations page.
- **Federal Law No. 7 of 2010** — amendments.
- **Cabinet Resolution No. 16 of 2014** — executive regulations of the Credit Information Law (this is the document that operationalises the bureau and is often the source of dispute timelines and data-retention rules).
- **CBUAE Consumer Protection Regulation (2020) and Consumer Protection Standards** — regulates how banks use credit information and how disputes route through Sanadak.

The section editor must cite these at the appropriate paragraph in the guide. Do not paraphrase the law from third-party summaries.

---

## Competitor coverage

I did not run a competitor sweep on this topic in this session because the WebFetch wall would have produced the same 403s. The brief notes "near-zero quality competition" — that is consistent with my standing memory of the UAE points/loyalty space, where AECB explainers are dominated by:

- bank blog posts (often outdated and self-serving),
- comparison-site SEO content (off-limits as citation per the Charter),
- the AECB site itself (the gold standard).

If the SEO Strategist wants a competitor scan run for differentiation purposes, I will run it under Firecrawl in a follow-up; the dossier does not require it.

---

## Open questions for the editor

1. **Has Firecrawl been brought back online for this session?** If yes, re-run the URL pack above before drafting. If no, route the brief back to Managing Editor.
2. **Are we comfortable publishing without a stated bank-by-bank "minimum AECB score" table?** My recommendation: yes, frame the absence honestly. The competitor advantage here is candour, not invented numbers.
3. **Free-pull policy in 2026.** Worth a phone call to AECB customer service (800 232 322 — confirm number on the live site) to confirm the current consumer-pricing reality before draft.
4. **Sanadak escalation.** Confirm the current consumer-complaint routing for AECB disputes that the bureau itself rejects.
5. **PDC reform downstream.** The 2022 decriminalisation of bounced cheques may have changed how AECB records older PDC marks. Editor should ask AECB directly.

---

## Recommendations to Managing Editor

1. **Hold the brief at Stage 3.** Do not promote to Stage 5 (Section Editor draft) until the AECB primary URLs are confirmed reachable and re-scraped under Firecrawl.
2. **Open a tooling ticket with Technical Lead** noting that WebFetch is environment-blocked from `aecb.gov.ae`, `centralbank.ae`, `u.ae`, and at least four major UAE bank domains in this session. This is a recurring constraint (cf. `tpg-design-dossier.md` 2026-05-08) and should be tracked.
3. **Once Firecrawl is available**, this dossier can be upgraded to `dossier-status: verified` in approximately one working session — the URL pack and claim checklist are pre-built.
4. **Flag to Chairman**: this is the highest-volume evergreen target query in our banking pillar. Publishing a guide built on `[NEEDS VERIFICATION]` flags would be a Charter-level breach (Non-negotiable §1, Dubai-first / evidence-led; §6, LLM-extraction policy on numerics). The discipline is to hold the publish gate until the dossier is verified.

---

## Last verified

2026-05-09 — `dossier-status: needs-review`. Re-run required under Firecrawl before Stage 5.
