# Research dossier: hotel-points-rate-premium

Prepared 8 November 2026 by `article_briefs` for Travel & Experiences, with
Hotel News contributing. **Partial research; real matched-rate article held.**
Brief: `.council/briefs/2026-11-08-hotel-points-rate-premium.md`.

## Evidence identity and full-read record

Root supplied [public-source reader run 42496702254](https://github.com/dubaipoints1/Property/actions/runs/42496702254),
attempt 1. Artifact directory:
`/private/tmp/dubaipoints-source-recovery.yVRvx2/article-pdf-evidence/public-source-evidence-42496702254-1/`.
Manifest creation: `2026-11-08T15:49:21.859Z`.

H1 is the [Accor participating-property PDF](https://all.accor.com/a/content/dam/all/hubs/meapac/offers-campaigns/2026/2026-10/2x-stay---dine/2X_Stay_dine_Hotellist.pdf).
Requested/final URL are identical. Capture ran
`2026-11-08T15:49:21.165Z`–`2026-11-08T15:49:21.845Z`; response HTTP 200,
`application/pdf`; observed Last-Modified `Sun, 11 Oct 2026 22:49:32 GMT`.
Manifest reports complete transport/extraction, `reviewRequired: true` and no
incomplete reasons. Body representation is HTTP-decoded response bytes, not
compressed wire bytes.

- Body file: `04-1486ed9b7cac24b4.response.pdf`, 466008 bytes.
- Body SHA-256:
  `c9758fe607569842c2027e96ddb1d53d4ec68217a26be42bd36d5294b6ae7a7f`.
- Text file: `04-1486ed9b7cac24b4.text.txt`, 93584 bytes.
- Text SHA-256:
  `d1e0db4b523b583d8998805530f24b9d0579efe3eb7646b338125382068b1a5e`.
- Extent: eleven PDF pages; all 845 extracted text lines read through the
  final Viet Nam rows, not just the UAE matches.
- Extraction: `pdftotext version 26.01.0`, Node `v22.20.0`.
- Source-reader SHA-256:
  `37248dc27478edc6fe148367208e24ebac3106fad9cf6e70ffaf256920cdaa51`.
- Extraction-bundle SHA-256:
  `11941098a3c7f33b7f72d72dd2c0dca4f2b9a7b3315ad05d3776504d11ca9d2b`.

Root verified supplied body/text hashes. Full extraction and this text read
are not a visual layout certificate, a live room search or proof of a
particular rate's eligibility. No provider calls or paid retrieval were made
by this desk. Exact raw files remain in the supplied artifact; this dossier
does not claim that temporary storage is a permanent public archive.

## What H1 establishes, and what it cannot establish

The PDF identifies a Stay & Dine promotion and has a booking/dining-period
heading at lines 1–3. Its main content is a property list with RID, brand,
hotel, city and country columns. UAE entries occur at lines 754–799.

The list includes **Novotel Dubai Al Barsha**, RID `H6535`, at line 786.
That is an evidence-backed candidate for the research case. It does not prove
that a room is available, the selected rate qualifies, registration was
completed or that booking direct is cheaper.

Recommended bounded research case, still only an editorial selection:
Novotel Dubai Al Barsha; 24–26 November 2026; one room, two adults, no children;
standard double, room-only; same refundable terms; AED final cash totals.
One direct quote and one named OTA quote are enough for this case—not a claim
about the cheapest rate across the market. Do not book, hold, sign in, join a
programme or accept third-party terms for the reader.

## Required deterministic anchors and current evidence gaps

| Required evidence | Supplied anchor / needed capture | Status and guard |
| --- | --- | --- |
| Property identity/participation | H1 heading and row `H6535`, line 786 | Read. Bind the RID to exact property/country; identifiers are not price evidence. |
| Campaign windows | H1 lines 1–3 plus full current offer conditions | Heading read, but no typed date payload or full promotion HTML supplied. Distinguish book/dine dates from stay dates. |
| Registration order, minimum stay, eligible channel/rate, caps, stacking and posting | Current [Accor promotion conditions](https://all.accor.com/a/en/loyalty-program/promotions-offers/meapac-bonus-points-offer.html) | Current HTML not supplied/read for this commission. The older report is discovery only. |
| Brand/status earn basis and eligible spend | Current official programme earning terms, exact URL to be obtained by root | Missing. Do not infer points from gross room cost or assume tax/service charges earn. |
| Issuer redemption mechanic and restrictions | Current official redemption/programme terms | Missing. No fresh EUR block, AED conversion or points value is asserted here. |
| Direct total and rate rules | Full public result for the selected dates/room/party, including pay-later taxes and cancellation | Missing. Not replaceable with a property landing page or advertised nightly rate. |
| OTA total and rate rules | Same property/dates/room/party/board/flexibility and final charges | Missing. Different restrictions mean a non-equivalent comparison, not a forced price winner. |

Technical must parse amounts from scoped source tokens and reproduce
arithmetic; `parseSourceAED` / `parseSourceNumber` validate numeric tokens but
do not establish which rate, inclusion or points table they belong to.
Keep raw text/quotes immutable, with source hashes and time zone, before any
typed financial payload. Capture both each quote's displayed currency and
any independently sourced dated conversion, rather than silently applying
an approximate exchange rate.

If a country/property count is wanted, compute it from full row boundaries
and unique RIDs with a tested deterministic method. This list contains repeated
RIDs/alternative property naming elsewhere and some country-label oddities;
row counting or matching a generic city string is not sufficient. A global
count is unnecessary for this single-property decision, so do not create a
fresh numerical claim merely for a headline.

## Calculation and interaction boundary

There is **no Accor row** in the current `programmeValuations` array, so the
existing `/valuations/` converter cannot price an Accor balance. Do not add a
global valuation, imply it can be selected or use another programme as a
stand-in. The brief's general converter reference does not waive this limit.

For this guide, use a matched evidence table and native checklist/disclosures.
Any numerical worked case must use freshly verified issuer redemption terms
and a separately reviewed deterministic calculation. Separate:

- the direct price premium from the matched alternative;
- all rewards available only on the direct booking from the narrower
  promotional uplift;
- spend that earns points from taxes/charges or other ineligible spend;
- an issuer discount from a liquid cash payment, and unknown flexibility or
  elite benefits from anything priced into the comparison.

Do not double-count base points, round an issuer benefit optimistically or
treat cancellation, FX, payment timing or redemption restrictions as identical
without source evidence. No unsupported converter integration or global
valuation-model change is commissioned by this dossier.

## Safe draft fragment and publication hold

> A points promotion is not a reason to ignore the room price. Compare the
> stay you would actually book: the same room, meals, payment timing and
> cancellation rules. Then separate the points you would earn anyway from
> the extra reward. If the rates do not match, say what the difference buys
> before calling either option better value.

This is a non-numeric explanatory fragment, not an observed result. The final
article needs a dated matched-rate case; no full current-terms or price claim
can yet be drafted. No public MDX or staged article asserting live rates was
created. The property-list capture does not complete article research.

## Next handoff and status

Root obtains the missing current HTML, official earning/redemption terms and
matched public quotations only within a separately approved retrieval
configuration. If access requires authentication, CAPTCHA bypass or an
unmatched rate, stop and hold/rescope. Record query/capture failures as such.
No new provider call, booking, monitoring expansion or retry is approved here.

The assigned Travel & Experiences editor drafts only after the packet and
deterministic financial payload are sufficient. Hotel News consults; independent
SEO, Fact-Check, Standards, Technical/Council and Chairman article approval
remain pending. No article-stage completion or publication is claimed.

## 9 November update — current terms read; matched quote still held

This dated entry supersedes the earlier missing-HTML rows only to the extent
specified here. It does not rewrite the 8 November PDF/full-read history.
Prepared by the Research delegate, then the Travel & Experiences drafting
delegate; no self-approval.

### Retrieval and cost record

The owner authorised an overall thirty-credit research tranche. This desk's
allocation was one plain search costing two credits and up to seven distinct
basic markdown reads costing one each, maximum nine gross. All page requests
used fresh mode, basic proxy and no domain-provider tools, add-ons or profiles.
No provider, booking, account, registration or monitor action was executed.

| Evidence | Exact public source / operation | Receipt and outcome |
| --- | --- | --- |
| H2 | [STAY and DINE promotion conditions](https://all.accor.com/a/en/loyalty-program/promotions-offers/meapac-bonus-points-offer.html) | Scrape 01a1be88-3162-7334-a4e7-7ccc1d624a67; HTTP 200, basic, one credit. |
| H3 | [Membership conditions](https://all.accor.com/a/en/loyalty-program/legal/terms-and-conditions.html) | Scrape 01a1be89-7507-76fb-bce2-768f6ba9f046; HTTP 200, basic, one credit. Version text: from 14 October 2026. |
| H4 | [Requested-date official property page](https://all.accor.com/hotel/6535/index.en.shtml?dateIn=2026-11-24&nights=2&compositions=2&currencyCode=AED) | Scrape 01a1be8a-f6af-774c-b576-3f3b3e2f4a2c; HTTP 200, basic, one credit. No accepted rate. |
| H5 | [Requested-date Expedia property page](https://www.expedia.ae/Dubai-Hotels-Novotel-Dubai-Al-Barsha.h5440701.Hotel-Information?chkin=2026-11-24&chkout=2026-11-26&adults=2&rooms=1&currency=AED) | SCRAPE_ALL_ENGINES_FAILED, status 500; no ID or cost receipt returned. Actual charge UNKNOWN; all paid execution stopped. |

Search 01a1be87-0122-77fc-adf5-9a295c053f20 cost two credits, limit five.
It discovered the Expedia property URL, not a requested-date final quote.
Feedback 01a1be87-8510-7128-afad-cfdcc2b921af refunded one credit. Gross
known spend is five, refund one, net known spend four, plus the failed call's
unknown charge. One additional credit is reserved against this allocation;
the missing receipt was reported to root. No retry or fallback was attempted.
Automatically returned provider examples were discovery output, not execution.

Access date is the observed 9 November 2026 session. Firecrawl did not supply
a capture timestamp, raw HTML/body or full-transport/extraction certificate
for these markdown responses. No exact capture time or whole-source legal
reading is invented. Full JSON/returned markdown and the error are retained
privately in the task's research-hotel directory, not in this repository:
/private/tmp/dubaipoints-article-release.OptQkX/research-hotel/.
The private ledger records exact request settings and calls; temporary
storage is not a permanent archive.

H2's STAY conditions and H3's relevant definitions, sections 7.1–7.2.3 and 10
were read, including earning exclusions and redemption restrictions.
Both responses included an unrelated embedded access-denied login fragment.
That fragment is excluded from evidence and claims. No blocked URL was
visited; no login, session, bypass, retry or proxy escalation was attempted.
This is a public-terms reading, not proof that every website component worked.

### Deterministic candidate payload and source identity

scripts/scrape/_hotel-promotion.ts scopes STAY separately from DINE, the
Reward-points table separately from Status points, and online redemption
separately from on-site/partner terms. Every typed observation carries the
source URL, scrape ID, observed access date, exact input span/line, supplied-text
hash and returned-markdown hash. Invalid/missing/duplicate scopes, changed
table order, identity drift and inconsistent tokens fail closed.

Minimal factual excerpts retaining original source line numbers are in
tests/scrape/fixtures/2026-11-accor-hotel-terms.json. Unrelated text and
omitted lines are blank. This fixture is explicitly an excerpt, NOT the
complete source, a raw body or a transport certificate. Absolute offsets
index the supplied excerpt with its own hash, not the full returned markdown:

- H2 returned-markdown SHA-256:
  e1080ac61d8cd6ccb2c7bb98e95fc3297c01d9b7cd5db0deed51003079065ea0;
  excerpt SHA-256:
  16c388581bd3802d798b2b55d8529a82f9453ea60b0e5b9f0387d385194a34ef.
- H3 returned-markdown SHA-256:
  ddd1bb41639617ba56e7914513286fc2a9b4d527e23dc06b0fbfc48d8838e058;
  excerpt SHA-256:
  0c1cbd0e5b0834066b408949c838d236035e2b2d02224035355f9304f0c989c4.

The parser returns the same candidate values for the private returned markdown
and curated excerpts. Nine focused tests pass. It deliberately reports no
automatic acceptance, no source-completeness certificate and no available
matched-rate comparison. It has no fetch/paid entry point, data write, global
valuation or FX conversion. Independent acceptance remains pending.

| Candidate fact | Scoped evidence | Boundary |
| --- | --- | --- |
| Registration/booking 27 October–13 December 2026; 11:59 p.m. CET deadline | H2 STAY lines 659 and 677 | Registration must precede booking; no sign-in or registration was performed. |
| Stays 27 October 2026–31 March 2027; minimum two consecutive nights | H2 STAY lines 671 and 677 | Same hotel; date window does not establish room/rate eligibility. |
| Advertised 2X, based on Classic status | H2 STAY lines 661–663 | Do not double an elite member's entire ordinary award. |
| Credit within ten days of checkout | H2 STAY line 689 | Programme wording, not money funding the current booking. |
| Classic default-brand earn scale: 25 points per €10 eligible spend | H3 section 7.2.3, lines 226–239 | Default column, not Novotel Living/other reduced-earn brands; excludes tax/service charges. |
| Online redemption: 1,000 points for €20; 2,000 for €40; thereafter increments of 2,000 | H3 section 10, line 710 | Conditional booking discount, some taxes excluded, not cash or a sourced AED conversion. |

H2's eligibility, exclusions, stacking and availability clauses were also read,
not inferred from the headline. H3 excludes third-party OTA stays from ordinary
eligible stays and specifies local-currency conversion/eligible-spend rules.
No overall property/country count, rate premium, AED conversion or awarded
points estimate is computed.

### Quote failure and draft/publication boundary

H4 identifies the exact ordinary Novotel property, but its booking widget did
not return a final quote for the requested dates. Rendered booking links
instead used different default parameters (23 November, one night, one adult).
The requested query string is not proof the returned page honoured it.
H5 failed to retrieve; the search snippet had different dates and excluded
charges, so no snippet price was accepted.

Therefore direct/OTA final totals, equivalent room/board/refundability,
payment timing, taxes/fees and rate-specific promotion eligibility remain
unestablished. Neither page proves sold-out inventory, a broken public
booking service or which channel is cheaper. H1 participation and H4 property
identity do not fill those gaps.

The complete explanatory draft at
.council/drafts/2026-11/hotel-points-rate-premium.mdx is **prepared, held and
outside production content**. It opens with the quote limitation and contains
no invented total, break-even result, personal experience, affiliate agreement
or Accor converter support. This does not satisfy the original matched-price
commission. Publish only after obtaining matched public evidence, or after an
explicit re-commission and the normal independent article/Council gates.
COI, byline, imagery, SEO, Fact-Check, Standards, Tech and Chairman decisions
are not claimed complete by this research/drafting handoff.
