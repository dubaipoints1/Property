# Motion exploration and News thumbnail correction

Date: 2026-11-06. Coordinator: Codex. State: candidate only, owner review
and browser/device QA outstanding. Existing draft PR 518, no auto-merge.

## Owner evidence and response

Mostafa supplied an iPhone Safari screenshot of Latest reporting and
requested larger, proportionate, aligned imagery, plus deeper 21st
homepage/motion/flow research. This is not approval of the preceding
design or permission to waive the light/dark-preview release boundary.

The concrete defect is in shared `NewsListingVisual`, used by the four
News desk indexes. Photos/previews had a 68px-minimum compact width while
Liv had an 88px minimum and a fixed height containing its credit.

## Candidate changes

- All compact kinds now share `clamp(88px, 24vw, 128px)` and a 3:2 frame.
  The source model gives 94px at 390px, 103px at 430px and 108px at 448px;
  these are CSS arithmetic, not measured Safari geometry.
- Liv's credit sits outside the card-fitting area. Every compact visual
  reserves the same minimum caption track. Long/zoomed text can grow;
  credit is never hidden or clipped to force a fixed row height.
- Real issuer artwork stays contained; photographs stay cover-fitted.
  Portrait Liv artwork is not stretched to resemble a landscape card.
- Noncompact treatments are unchanged apart from a display:contents
  wrapper. Unsupported IDs do not acquire an empty thumbnail.
- Responsive image `sizes` follows the new slot; originals/provenance,
  image assets, financial copy and article destinations are unchanged.
- New private `/dev/21st-motion-review/` supplies three working native
  concepts: Runway Chapters, Dispatch Gallery and Decision Studio.
  All use current fonts/tokens and licensed manifest imagery/credits.
  The actual homepage and its scroll-gated reel were not edited.
- Fresh research and recommendations are in
  `.council/briefs/2026-11-06-21st-motion-research.md`. Public listing
  evidence, proposals and unverified rendered behaviour are distinct.

## Executed validation

- Fourteen focused tests pass: five new source-contract guards plus
  existing issuer-art, compact-delivery, content-coverage and private-route
  pruning checks. No source test is presented as a screenshot test.
- Astro check: 192 files, zero errors/warnings, four existing hints.
- Build/postbuild: pass. Private review routes removed; 322 pages indexed,
  22,739 internal links resolve, CSP unchanged at 1,373 characters and
  18 executable hashes.
- Baseline comparison: 322 routes / 19 families; no metadata,
  structured-data or previous-heading-anchor differences.
- Built News markup has 65 compact wrappers, each with separate media
  and caption tracks; one visible Liv credit. Private motion route is
  absent from delivery. This checks markup, not browser layout.
- The actual Astro private preview returned HTTP success from the
  existing local dev server; parse/transform and asset checks pass.
- Protected source diff is empty for homepage, BaseLayout, global.css,
  card data, image/card-art manifests and package files.

Independent researcher reviewed the research brief and the thumbnail diff
read-only. No concrete source regression was found. It explicitly leaves
zoomed credit wrapping, Safari rendering and layout shift unverified.
The prototype author performed compiler/source checks, not a browser pass.

## Remaining gates and known limits

The Chrome connection failed before an inspection page could be observed.
Mostafa was asked to reconnect; no alternate automation route was used.
No new rendered light/dark screenshots, physical iPhone Safari result,
runtime no-JavaScript/reduced-motion result or actual original-demo motion
quality is certified in this turn. Prior preview evidence is historical,
not proof that this newly reported defect was already fixed.

Exact-head Linux CI/Cloudflare preview status is to be recorded on the
draft PR after push. Owner selection of a motion direction, full T3
Council, successful executed checks and eventual browser/device/production
verification remain separate. No merge, live deployment, paid retrieval,
generation, dependency install, secret use or analytics change occurred.

## Subsequent Chrome reconnection — 2026-11-06

Mostafa reconnected Chrome. The preceding browser-blocker statement is
retained as history, not the current state of that connection.

- Hosted News at head `1ea8a65`: seven measured sizes (320/390/430/448,
  844 short landscape, 1024 and 1440) in both themes. First eight frames
  have identical dimensions/right edges, no copy overlap, credits below
  the frame and no document-level horizontal overflow. At 430px, every
  frame is 103.195 × 68.797px. These are Chrome measurements, not Safari.
- Private motion page: the same fourteen size/theme states show no root
  overflow. Phone and short landscape retain three inline story pictures;
  larger windows use the companion stage. Gallery selection and open task
  survive resizing. Named Gallery controls work with pointer and Tab/Space;
  Runway updates to the correct image on forward/back scroll; Salary task
  opens the corresponding copy, image and real Tracker/calculator links.
- All four built News desk indexes additionally pass the 430px frame and
  overflow checks in both themes (eight records). No JavaScript errors
  recorded for hosted News, the private concepts or built News.
- Browser inspection found two defects which source-only checks missed:
  the scoped scroll animation defeated the intended global solid-dark
  header rule; a direct Latest reporting anchor landed behind the header.
  The component now has a stronger scoped dark animation override and a
  reduced-motion static header. The News heading has token-based scroll
  clearance. Local built dark header computes to its existing paper colour
  with animation:none; heading clears the 104px phone and 81px desktop
  headers. Source reviewer independently found no concrete regression.
- Header light animation, palette values and homepage hero source are
  unchanged. Homepage source hash matches HEAD. A fresh built homepage
  had no video source at scrollY 0; native Down to 40 attached the existing
  reel. The shared dark-header defect is corrected on it too.
- Twenty-eight focused tests pass, including three new guards. Repeated
  Astro check/build/postbuild and 322-route static invariants pass.
  Exact-head CI and updated hosted verification belong to the draft PR
  after this correction is pushed, not to the earlier head's 726-test run.

Measured JSON is in the existing
`/private/tmp/dubaipoints-motion-safari.LXkHo1/` evidence directory; actual
JPG screenshots are saved under the thread's visualisations root.
This is a 36-state targeted sample, not a full-site pixel/device census.

The actual Chrome 21st homepage displayed catalogue shelves (Top today,
New & noteworthy, categories and wider resources). The Scroll 01 original
preview and one additional Product Rail Gallery listing were observed.
The latter's literal garment/physics presentation is not a proposed card
UI; no source copied, free copy consumed, purchase or installation occurred.
Original-demo cross-device, full motion and licence clearance remain separate.

An interaction on the older design picker selected Editorial Utility. That
mock-up has a warm cream/navy/Georgia/system palette/type contract unlike
current cool Runway/Newsreader/Geist. Its composition can be adapted, but
the owner was asked whether the selection includes those older colours.
No palette/type change or production approval is inferred while that
scope is unresolved. Physical Safari, zoom/CLS, executed no-JS/reduced-motion
browser checks, owner selection and full release gates remain outstanding.
