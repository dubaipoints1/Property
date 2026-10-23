# Logo assets

This directory holds bank and airline-programme logos used by the site.

## Status

As of 2026-05-29, this directory holds a **mix**: 10 files are real brand
marks sourced per the replacement rule below (see the source log), and
the remaining 5 are **placeholder text-marks** authored by DubaiPoints —
not official brand marks — rendering the bank/programme name in a neutral
serif until a clean asset is sourced.

- **Real marks (10):** banks/emirates-nbd (PNG, official brand kit;
  resolved via `BankLogo` `PNG_FORMAT_SLUGS` set), banks/fab, banks/adcb,
  banks/hsbc, banks/citi, banks/standard-chartered,
  airlines/qatar-privilege-club, airlines/etihad-guest, airlines/skywards,
  airlines/marriott-bonvoy.
- **Still placeholders (5):** banks/dib, banks/adib, banks/cbd,
  banks/emirates-islamic, banks/rakbank (no clean free source found —
  no Wikimedia {{PD-textlogo}} entry, no public brand-kit page with a
  downloadable asset). Each renders the name in serif and falls back
  gracefully.

  **Coverage expansion (2026-08-22):** three more placeholder text-marks
  added at coverage launch — banks/liv, banks/wio, banks/al-hilal. These
  were authored as placeholders per Charter §10 (no brand mark drawn);
  no Commons {{PD-textlogo}} / brand-kit sourcing sweep has been run for
  them yet. Replace only per the replacement rule below.

  **Sourcing sweep (2026-05-30):** re-checked all 5. Wikimedia Commons
  has no SVG logo for any of them (DIB's Commons category holds only
  panoramio photos; the others have no category). Wikipedia hosts
  `File:Commercial Bank of Dubai logo.svg` and `File:ADIB logo.svg` —
  both are explicitly tagged **non-free / fair-use** ("All non-free
  logos", "Wikipedia non-free files with NFUR stated"). Wikipedia
  non-free uploads are NOT §10-licensed for our use; only Commons
  {{PD-textlogo}} (below the threshold of originality) and issuer
  brand kits qualify. No public brand-kit pages with downloadable
  assets surfaced for DIB, Emirates Islamic, or RAKBANK. Next attempt
  needs either (a) an issuer publishing a brand kit, (b) a Wikimedia
  editor uploading to Commons under {{PD-textlogo}} with a below-
  threshold-of-originality argument, or (c) a direct permission
  request to each bank's PR/brand team — all three outside the
  autonomous-safe envelope.

  **2026-10-20 amendment (Chairman, "Real brands in pictures").** Issuer
  marks may now also be taken from the issuer's own website, and merchant
  marks may lead deal tiles. Real marks now replace the placeholders for
  adib, cbd, liv and wio (SVG). rakbank, emirates-islamic and mashreq have
  a real **PNG** beside their placeholder SVG (no colour SVG was reachable);
  they render only once the slug is added to `PNG_FORMAT_SLUGS` in
  `BankLogo.astro` and to the bank-mark extension in `DealVisual.astro`.
  **Still placeholders:** dib (its site ships the mark only in white, for a
  dark header) and al-hilal (site footer mark is white; header not
  reachable). Since 2026-10-22 both white marks sit beside the placeholder
  as `banks/dib-white.png` and `banks/al-hilal-white.svg`, for rendering on
  a navy plate only (the `-white` suffix is the signal). Sources in the
  2026-10-20 section below.

## Replacement rule

Per the editorial style guide, real SVGs must be:

1. Sourced from EITHER (a) the issuer's published **brand kit / press
   page**, OR (b) **Wikimedia Commons** where the file is tagged
   **{{PD-textlogo}}** (below the threshold of originality, not
   copyrightable). Per the Charter §10 amendment (2026-05-29), Commons
   {{PD-textlogo}} marks are licensed for nominative editorial use — to
   identify a product the publication reviews, never to imply endorsement.
   Not screenshotted from the website. Not redrawn. No AI-generated marks.
2. **Unmodified.** Original aspect ratio preserved. No tinting or
   recolouring outside the bank's own hub page on this site.
3. Filed under the slug used in `src/content/banks/` or
   `src/content/programs/`, e.g. `banks/emirates-nbd.svg`.
4. Rendered **nominatively** — adjacent to the brand name (e.g.
   `<BankLogo>` beside the name). A mark standing alone in a hero needs a
   visible credit line. Takedown requests honoured within 24 hours.

When you replace a file, log the source URL and the date pulled in
this document.

## Non-issuer marks (`partners/`)

The replacement rule above governs **issuer** marks — banks, airlines and
loyalty programmes the publication reviews. It is deliberately strict, and
that strictness is why five reviewed banks above still render as text
placeholders.

The 2026-08-05 Charter amendment opened a separate, narrower lane for a
**non-issuer** company named as an illustrative example inside a guide.
These live in `partners/` rather than `banks/` or `airlines/` so the two
standards never get confused with one another.

**Read this before adding one.** A `partners/` mark is generally *not* a
{{PD-textlogo}} or brand-kit asset — it is the company's own artwork taken
from its own website, used nominatively to identify a business the piece
discusses. That is a weaker licence basis than anything in the source log
above, and **it is not precedent for sourcing issuer logos the same way.**
An issuer mark that fails the replacement rule stays a text placeholder;
that has not changed.

Conditions, all of them:

1. The company is named as an example **or recommended** in editorial
   copy, with no payment, affiliate arrangement or ownership interest —
   disclosed in the piece. Where it is a recommendation, the disclosure
   also states the basis for it.
2. The mark is used **unmodified** and rendered **nominatively**, adjacent
   to the business name at a modest size. Not a hero badge.
3. Source URL and date logged below, in the same commit as the asset.
4. Takedown requests honoured within 24 hours, no questions asked.
5. Fetched via `.github/workflows/fetch-partner-logo.yml` — the web
   session cannot reach third-party image hosts.

| Slug | Source URL | Pulled | Notes |
|---|---|---|---|
| partners/modcare | https://modcare.ae/wp-content/uploads/2023/09/Modcarelogo-singular-min.svg | 2026-08-05 | Company's own artwork from its own website. Trademark of Modcare Car Care, Al Quoz, Dubai; used nominatively to identify the business **recommended** in `guides/expat-starter-car-costs`. No payment, no affiliate arrangement, no ownership interest — disclosed inline above the recommendation, which also states its basis (the editor's first-hand use as a customer) and its limit (no comparative test of UAE installers). Not a {{PD-textlogo}} or brand-kit asset; permitted under the 2026-08-05 amendment, on site-owner direction. No written permission on file — if a grant is later obtained, record it in this row. |

## 2026-10-20 amendment — merchant, issuer and programme marks

Fetched by `.github/workflows/fetch-logos-2026-10-20.yml` (inputs and
exact asset URLs in `scripts/logos/2026-10-20.json`), bytes written as
served: not redrawn, recoloured or cropped, and no AI. Two marks were
shipped by their sites as inline `<svg>` in the page header (Right Bite,
Wio); those were sliced verbatim from the HTML. Every file was rasterised
and checked by eye on 2026-10-22 against light and dark grounds; white-only
marks, app icons and superseded logos were rejected.

Commons files marked public domain are below the threshold of
originality; two Commons files (fnp, mashreq) carry a CC BY-SA 4.0 tag
from their uploader, so the credit is Wikimedia Commons. Every mark
remains its owner's trademark, used nominatively to identify whose offer
or product a page is about; it never implies endorsement of DubaiPoints.

Not sourced as of 2026-10-22 (deal keeps its photo, no `logo`): BinSina
(binsina.ae answers 403 to GitHub runners and to Firecrawl, stealth proxy
included; no Commons file), Zed (its site gozed.ae, found via the App Store
listing, returns a WAF "Request Rejected" page; zed.ae is an unrelated
domain marketplace; no Commons file), Styli (stylishop.com answers 403 to
runners and Firecrawl; no Commons file), Carrefour (the header mark is at
cdnprod.mafretailproxy.com/mafrp-web/assets/en/images/default/logo.svg,
located via Firecrawl, but that CDN and majidalfuttaim.com time out from
GitHub runners; Commons has no current main-mark file, only
Carrefour-Mobile and old Champion/Promodès marks), UAE airport duty-free
(no single brand). NRTC Fresh's `logo-white.png` was rejected: it is the
e-commerce theme's placeholder ("6valley"), not NRTC's mark; the site's
real header logo is used instead (colour, see below).

White-only marks carry a `-white` suffix and are for a navy plate only;
each was checked rasterised on `#1f3a4d`.

| Slug | Source URL | Pulled | Notes |
|---|---|---|---|
| partners/noon (SVG) | https://commons.wikimedia.org/wiki/File:Noon_Website_Logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/c/ca/Noon_Website_Logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of noon AD Holdings. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/amazon (SVG) | https://commons.wikimedia.org/wiki/File:Amazon_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of Amazon.com, Inc.; also identifies the Amazon Now deal. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/talabat (SVG) | https://commons.wikimedia.org/wiki/File:Talabat_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/b/b3/Talabat_logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of talabat. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/careem (SVG) | https://commons.wikimedia.org/wiki/File:Careem_Logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/0/01/Careem_Logo.svg | 2026-10-20 | Wikimedia Commons, public domain; matches the mark on careem.com. Trademark of Careem; used for Careem Food and Careem DineOut deals. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/careem-plus (PNG) | https://www.careem.com/ — asset: https://careem-public-web-media.media.careem.com/cplus_logo_93db37150b_f263ac2af7.webp | 2026-10-22 | Company's own website (served as PNG despite the .webp name). Trademark of Careem. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/lulu (PNG) | https://commons.wikimedia.org/wiki/File:Lulu_Hypermarket_logo.png — asset: https://upload.wikimedia.org/wikipedia/commons/a/ab/Lulu_Hypermarket_logo.png | 2026-10-20 | Wikimedia Commons, public domain. Trademark of LuLu Group International. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/trip-com (SVG) | https://commons.wikimedia.org/wiki/File:Trip.com_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/7/7a/Trip.com_logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of Trip.com Group. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/zuvees (PNG) | https://www.zuvees.ae/ — asset: https://zuvees.com/cdn/shop/files/Zuvees-logo-new.png?v=1787050522 | 2026-10-20 | Company's own website (header logo). Trademark of Zuvees. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/cinepolis (SVG) | https://commons.wikimedia.org/wiki/File:Cin%C3%A9polis_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/5/53/Cin%C3%A9polis_logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of Cinépolis. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/igp (PNG) | https://www.igp.com/ — asset: https://cdnnew.igp.com/assets/images/igp-logo-revamp.png | 2026-10-20 | Company's own website (header logo). Trademark of IGP.com. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/air-arabia (SVG) | https://commons.wikimedia.org/wiki/File:Air_Arabia_logo_2018.svg — asset: https://upload.wikimedia.org/wikipedia/commons/8/84/Air_Arabia_logo_2018.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of Air Arabia PJSC. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/makemytrip (SVG) | https://commons.wikimedia.org/wiki/File:Makemytrip_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/6/61/Makemytrip_logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of MakeMyTrip. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/fnp (SVG) | https://commons.wikimedia.org/wiki/File:Fnp_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/a/a2/Fnp_logo.svg | 2026-10-20 | Wikimedia Commons, file tagged CC BY-SA 4.0 by its uploader (credit: Wikimedia Commons). Trademark of Ferns N Petals. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/reel-cinemas (PNG) | https://www.reelcinemas.com/ — asset: https://storage.googleapis.com/eeg-prod-reelcinema-sb/web/assets/images/logo/logo.png | 2026-10-20 | Company's own website (header logo, served from its own asset bucket). Trademark of Emaar Entertainment / Reel Cinemas. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/dubai-parks-and-resorts (SVG) | https://www.dubaiparksandresorts.com/en — asset: https://www.dubaiparksandresorts.com/sites/default/files/2026-10/dubaipark_0.svg | 2026-10-22 | Company's own website (colour logo). Trademark of Dubai Parks and Resorts. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/zomato (SVG) | https://commons.wikimedia.org/wiki/File:Zomato_Logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/b/bd/Zomato_Logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of Zomato (Eternal Ltd). Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/farfetch (SVG) | https://commons.wikimedia.org/wiki/File:Farfetch_logo_2020.svg — asset: https://upload.wikimedia.org/wikipedia/commons/a/ae/Farfetch_logo_2020.svg | 2026-10-20 | Wikimedia Commons, public domain. Trademark of Farfetch. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/dr-nutrition (PNG) | https://drnutrition.com/en-ae — asset: https://drnutrition.com/images/logo_4.png | 2026-10-22 | Company's own website (header logo). Trademark of Dr. Nutrition. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/right-bite (SVG) | https://rightbite.com/ — asset: https://rightbite.com/ (inline header <svg> #1, aria 'Right bite logo') | 2026-10-22 | Company's own website: the header logo is inline SVG; taken verbatim from the page. Trademark of Right Bite. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/adib (SVG) | https://www.adib.ae/en — asset: https://www.adib.ae/-/media/project/adib/adibsite/header/logo.svg | 2026-10-20 | Issuer's own website (header logo). Trademark of Abu Dhabi Islamic Bank. Replaces the text placeholder. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/cbd (SVG) | https://www.cbd.ae/ — asset: https://www.cbd.ae/images/default-source/3-in-1-cut/cbd-logo.svg?Status=Master&sfvrsn=effb026b_1 | 2026-10-22 | Issuer's own website (header logo). Trademark of Commercial Bank of Dubai. Replaces the text placeholder. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/liv (SVG) | https://www.liv.me/ — asset: https://www.liv.me/-/media/liv/website/liv-rebranding/logo/liv-logo.svg | 2026-10-20 | Issuer's own website (header logo). Trademark of Emirates NBD (Liv). Replaces the text placeholder. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/wio (SVG) | https://www.wio.io/ — asset: https://www.wio.io/ (inline header <svg> #1) | 2026-10-22 | Issuer's own website: header wordmark is inline SVG, taken verbatim (xmlns already present; its CSS class sets black, the SVG default). Trademark of Wio Bank. Replaces the text placeholder. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/rakbank (PNG) | https://www.rakbank.ae/en/personal — asset: https://www.rakbank.ae/globalassets/rakbank/header/brand-refresh-logos/rak-logo-conv.png | 2026-10-22 | Issuer's own website (header logo, brand refresh). Trademark of RAKBANK. PNG only: banks/rakbank.svg placeholder kept until the slug is added to PNG_FORMAT_SLUGS. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/emirates-islamic (PNG) | https://www.emiratesislamic.ae/en — asset: https://www.emiratesislamic.ae/-/media/ei/emirates-islamic-logo.png | 2026-10-20 | Issuer's own website (221x36, the only colour asset found; the header SVG is white-only). Trademark of Emirates Islamic. PNG only: placeholder SVG kept until the slug is added to PNG_FORMAT_SLUGS. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/mashreq (PNG) | https://commons.wikimedia.org/wiki/File:Mashreq-new-logo.png — asset: https://upload.wikimedia.org/wikipedia/commons/e/ef/Mashreq-new-logo.png | 2026-10-20 | Wikimedia Commons, tagged CC BY-SA 4.0 by its uploader; 228x46, small. Trademark of Mashreqbank. PNG only: placeholder SVG kept until the slug is added to PNG_FORMAT_SLUGS. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| airlines/saudia-alfursan (SVG) | https://commons.wikimedia.org/wiki/File:Saudia_wordmark_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/3/3f/Saudia_wordmark_logo.svg | 2026-10-20 | Wikimedia Commons, public domain. Parent-airline mark (Saudia) for the AlFursan programme, per the 2026-05-29 parent-brand precedent. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| airlines/air-arabia-airrewards (SVG) | https://www.airarabia.com/en/airrewards — asset: https://www.airarabia.com/-/media/Project/Air-Arabia/Air-Arabia/AirRewards-Banner/AirRewards.svg | 2026-10-20 | Programme operator's own website: the Air Rewards programme mark. Trademark of Air Arabia. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| airlines/accor-all (SVG) | https://all.accor.com/ — asset: https://all.accor.com/a/content/dam/all/global-marketing/brand-identity/logos/all-accor/blue/vertical/Logo%20ALL%20ACCOR_BLUE_Vertical_RGB.svg | 2026-10-20 | Programme operator's own website: the ALL Accor programme mark. Trademark of Accor. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| airlines/hilton-honors (SVG) | https://commons.wikimedia.org/wiki/File:Hilton_Worldwide_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/8/8a/Hilton_Worldwide_logo.svg | 2026-10-22 | Wikimedia Commons, public domain. Parent-brand mark (Hilton) for Hilton Honors. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| airlines/world-of-hyatt (SVG) | https://commons.wikimedia.org/wiki/File:Hyatt_Logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/9/91/Hyatt_Logo.svg | 2026-10-22 | Wikimedia Commons, public domain. Parent-brand mark (Hyatt) for World of Hyatt. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| airlines/ihg-one-rewards (SVG) | https://commons.wikimedia.org/wiki/File:IHG_Hotels_%26_Resorts_logo.svg — asset: https://upload.wikimedia.org/wikipedia/commons/9/93/IHG_Hotels_%26_Resorts_logo.svg | 2026-10-22 | Wikimedia Commons, public domain. Parent-brand mark (IHG Hotels & Resorts) for IHG One Rewards. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/dib-white (PNG) | https://www.dib.ae/ — asset: https://www.dib.ae/images/default-source/default-album/dib-logo.png?sfvrsn=14a4dd47_3 | 2026-10-22 | Issuer's own website (header logo; white wordmark and Arabic, colour globe). For a navy plate only; the text placeholder banks/dib.svg stays for light grounds. Trademark of Dubai Islamic Bank. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| banks/al-hilal-white (SVG) | https://www.alhilalbank.ae/en/personal/ — asset: https://www.alhilalbank.ae/en/Images/ahb-billingual-logo-footer.svg | 2026-10-22 | Issuer's own website (footer logo; white bilingual wordmark, orange-pink square). No script, no external reference; the gradient square is an embedded data: PNG inside the file as served. For a navy plate only; placeholder banks/al-hilal.svg stays for light grounds. Trademark of Al Hilal Bank (ADCB Group). Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/nrtc (PNG) | https://nrtcfresh.com/ — asset: https://nrtcfresh.com/storage/app/public/company/2026-03-23-69c0edd628bac.png | 2026-10-22 | Company's own website (header logo, img alt "Logo"; colour, includes the site's own "Celebrating 53 / since 1973" lockup, not cropped). Light grounds only: the black "53" disappears on navy. Trademark of NRTC (NRTC Fresh). Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/mann-marzi (PNG) | https://mannmarzi.ae/ — asset: https://mannmarzi.ae/wp-content/uploads/2025/11/Untitled-design-2025-12-28T192311.503.png | 2026-10-22 | Restaurant's own website (the file its schema.org Organization names as `logo`; gold wordmark, reads on light and navy). Trademark of Mann Marzi Restaurant, Wafi City, Dubai. Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |
| partners/intercontinental (SVG) | https://www.ihg.com/intercontinental/hotels/us/en/reservation — asset: https://digital.ihg.com/is/content/ihg/ic-logo-updated | 2026-10-22 | Brand owner's own website (IHG, the InterContinental Hotels & Resorts page; the asset its own page shows as "IC logo"). Current mark; paths only, no script or external reference, but 1.5 MB. Identifies Choix at InterContinental Dubai Festival City. Trademark of IHG Hotels & Resorts. Not on Commons (only IHG group marks). Basis: 2026-10-20 Chairman amendment. Used unmodified, nominatively; takedown within 24 hours. |

## Source log

| Slug | Source URL | Pulled | Notes |
|---|---|---|---|
| banks/emirates-nbd | https://www.emiratesnbd.com/en/brand-assets | 2026-05-29 | Issuer brand kit (emiratesnbd.com/en/brand-assets); trademark of Emirates NBD Bank PJSC, used nominatively per Charter §10 — official primary logo (blue, horizontal) — only freely-available format is PNG |
| banks/fab | https://commons.wikimedia.org/wiki/File:First_Abu_Dhabi_Bank_Logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of First Abu Dhabi Bank, used nominatively |
| banks/adcb | https://commons.wikimedia.org/wiki/File:Abu_Dhabi_Commercial_Bank_logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Abu Dhabi Commercial Bank, used nominatively |
| banks/emirates-islamic | placeholder | 2026-05-06 | Replace with Emirates Islamic brand-kit SVG — **SVG placeholder kept; real PNG beside it (emirates-islamic.png), see the 2026-10-20 section** |
| banks/rakbank | placeholder | 2026-05-06 | Replace with RAKBANK brand-kit SVG — **SVG placeholder kept; real PNG beside it (rakbank.png), see the 2026-10-20 section** |
| banks/mashreq | placeholder | 2026-05-26 | Replace with Mashreq brand-kit SVG — **SVG placeholder kept; real PNG beside it (mashreq.png), see the 2026-10-20 section** |
| banks/dib | placeholder | 2026-05-26 | Replace with Dubai Islamic Bank brand-kit SVG |
| banks/adib | placeholder | 2026-05-26 | Replace with ADIB brand-kit SVG — **superseded 2026-10-20: real mark, see the 2026-10-20 section** |
| banks/cbd | placeholder | 2026-05-26 | Replace with Commercial Bank of Dubai brand-kit SVG — **superseded 2026-10-20: real mark, see the 2026-10-20 section** |
| banks/liv | placeholder | 2026-08-22 | Text-mark authored by DubaiPoints. Replace with a Liv (Emirates NBD) brand-kit SVG or Commons {{PD-textlogo}} asset — **superseded 2026-10-20: real mark, see the 2026-10-20 section** |
| banks/wio | placeholder | 2026-08-22 | Text-mark authored by DubaiPoints. Replace with a Wio Bank brand-kit SVG or Commons {{PD-textlogo}} asset — **superseded 2026-10-20: real mark, see the 2026-10-20 section** |
| banks/al-hilal | placeholder | 2026-08-22 | Text-mark authored by DubaiPoints. Replace with an Al Hilal Bank (ADCB Group) brand-kit SVG or Commons {{PD-textlogo}} asset |
| banks/hsbc | https://commons.wikimedia.org/wiki/File:HSBC_logo_(2018).svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of HSBC Holdings, used nominatively |
| banks/citi | https://commons.wikimedia.org/wiki/File:Citi.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Citigroup, used nominatively |
| banks/standard-chartered | https://commons.wikimedia.org/wiki/File:Standard_Chartered_(2021).svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Standard Chartered PLC, used nominatively |
| airlines/skywards | https://commons.wikimedia.org/wiki/File:Emirates_logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Emirates, used nominatively — parent-airline mark for the Emirates Skywards programme |
| airlines/etihad-guest | https://commons.wikimedia.org/wiki/File:Etihad-airways-logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Etihad Airways, used nominatively — parent-airline mark for the Etihad Guest programme |
| airlines/marriott-bonvoy | https://commons.wikimedia.org/wiki/File:Marriott_Logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Marriott International, used nominatively — parent-brand mark for the Marriott Bonvoy programme |
| airlines/qatar-privilege-club | https://commons.wikimedia.org/wiki/File:Qatar_Airways_logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Qatar Airways, used nominatively — parent-airline mark for the Privilege Club programme |


**2026-10-22 note:** `partners/intercontinental` is served as a 800px PNG rendered from IHG's 1.5 MB SVG (same source above), unmodified apart from rasterising and resizing, to keep the deal tile light.


## 2026-10-23 — four merchant marks from secondary sources

On Chairman direction in-session, 23 October 2026: "Find the logos high quality online". The four companies' own websites refuse automated fetches (403 or time-out from both GitHub runners and Firecrawl, see the 2026-10-22 section), so each mark was taken from the most reliable public copy found, downloaded through `.github/workflows/logo-candidates.yml`, and viewed before use. Each is the company's own, unmodified mark (trimmed only). Basis: 2026-10-20 Chairman amendment. Used nominatively; takedown within 24 hours.

| File | Source page — asset | Date | Notes |
|---|---|---|---|
| partners/carrefour.svg | https://en.wikipedia.org/wiki/File:Carrefour_Groupe.svg — https://upload.wikimedia.org/wikipedia/en/6/65/Carrefour_Groupe.svg | 2026-10-23 | Carrefour's symbol; tagged on Wikipedia as ineligible for copyright (simple shapes). No script or external reference. Trademark of Carrefour (franchised in the UAE by Majid Al Futtaim). |
| partners/binsina.png | https://survey.brandingforum.org/brands/binsina-pharmacy/attachment/binsina-pharmarcy-logo/ — https://b3490422.assetcdn.net/2.0/3490422/wp-content/uploads/2016/10/BinSina-Pharmarcy-logo.jpg | 2026-10-23 | BinSina Pharmacy's bilingual mark, trimmed of white margin (517×116). Matches the mark on binsina.ae as seen in search results. Trademark of BinSina Pharmacy (Aster DM). |
| partners/styli.png | https://cloud.google.com/customers/styli — https://lh3.googleusercontent.com/8_41gjykfEhGn6vKbZiZIWfYfoTQ0TIf0mMjfXFt1QMQEXNl0h7prdcNT6yQDn6lK-1rb02BSesO1kiVQ_oNyDvOAFxM-wfZq6UkfNlkwTrZInItEeA=s0 | 2026-10-23 | Styli's bilingual wordmark as shown on Google Cloud's customer page (198×120). Trademark of Styli (Retail Cart Trading). |
| partners/zed.png | https://play.google.com/store/apps/details?id=com.zed.customer — https://play-lh.googleusercontent.com/uILUlNXOYnVMW34ESyd7HBzBWI_OxglVdTECso9HvCqRwSivBOhaDZGnodFwEA_IMIYbbfvCXgZrHbfICShh=s512 | 2026-10-23 | Zed's app mark (white "zed." on coral, 512×512) as published by Zed on Google Play. Trademark of Zed Mobility. |
