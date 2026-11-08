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
