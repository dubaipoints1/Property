# Research dossier: tpg-design

_Author: head-of-research. Brief: Chairman override of Quiet Ledger
(2026-05-08). Deliverable paired with `tpg-redesign-brief.md`._

## Source-access status

**WebFetch was blocked on every TPG URL attempted.** All four direct
fetches and four fallback paths returned HTTP 403 from
`thepointsguy.com` (the hostname rejects the WebFetch user-agent at the
edge — almost certainly a Cloudflare bot rule, since TPG is a
known-aggressive blocker of programmatic readers). Web Archive
(`web.archive.org`) is also outright blocked at the WebFetch layer in
this environment.

| URL attempted | Result |
|---|---|
| `https://thepointsguy.com` | HTTP 403 |
| `https://www.thepointsguy.com` | HTTP 403 |
| `https://thepointsguy.com/credit-cards/` | HTTP 403 |
| `https://thepointsguy.com/credit-cards/chase-sapphire-preferred-credit-card-review/` | HTTP 403 |
| `https://thepointsguy.com/guide/` | HTTP 403 |
| `https://thepointsguy.com/news/` | HTTP 403 |
| `https://thepointsguy.com/feed/` | HTTP 403 |
| `https://thepointsguy.com/sitemap.xml` | HTTP 403 |
| `https://web.archive.org/web/2026/https://thepointsguy.com/` | environment blocks archive.org |

**This dossier is therefore built from prior-knowledge recall of
TPG's design as of late 2025 / early 2026, not from a live scrape.**
Every observation below carries a `[recall]` tag and should be
re-verified by Firecrawl (which has a different fetcher and routinely
gets through Cloudflare's edge rules) before the brief is locked in
by the Chairman. I have flagged the highest-confidence vs lower-
confidence calls so the editor knows which lines to prioritise for
re-verification.

A live Firecrawl pass (`mcp__firecrawl-mcp__scrape` on the same five
URLs) is the single missing input that would upgrade this dossier
from "informed recall" to "primary source."

---

## Palette `[recall — high confidence on roles, medium on hex]`

TPG runs a saturated, advertorial-friendly palette — not a
publication palette. The two dominant identity colours are a deep
navy and a high-saturation sky / cyan blue, with a warm yellow used
sparingly as a secondary accent (notably on legacy "TPG" wordmarks
and historic badge work).

| Role | Approximate value | Confidence | Notes |
|---|---|---|---|
| Primary brand | Deep navy `#0a2540` ish | High on role, medium on hex | Header, primary CTAs, link colour on tile titles |
| Brand accent / link | Bright cyan-blue `#00aaff` ish | High on role, medium on hex | "Apply Now" CTA fill, in-text affiliate link, hover underlines |
| Surface / paper | White `#ffffff` | High | Body background; section bands sometimes shift to a `#f5f7fa`-ish cool grey |
| Text | Near-black `#0d1b2a` ish | High | Body copy, headlines |
| Text-soft / meta | Mid-grey `#5a6473` ish | High | Bylines, datelines, meta strips |
| Yellow / honey accent | `#f7c948` ish | Medium | Used historically as a TPG-brand yellow; less prominent on current site, surfaces on some "Best of" overlays and the legacy wordmark |
| Sponsor / advertorial flag | Pale yellow / cream ribbon background | Medium | "Advertiser disclosure" bar at top of card-review pages |
| Verdict / rating green | `#1f9d6e` ish | Medium | "Excellent" rating chip on card scorecards |
| Warning / red | `#d23a3a` ish | Low | Used sparingly; not a primary palette colour |

The meaningful pattern is **two blues and a white**, not "two blues
and a yellow." Yellow has receded to legacy chrome since the Red
Ventures redesign.

## Typography `[recall — high confidence on pairing, medium on font names]`

- **Display / headlines.** A geometric high-contrast serif. Most
  likely **Tiempos Headline** (Klim) or **Publico Headline**, set at
  heavy weights (600–800). Headlines on cards and articles are large
  — homepage hero headlines run 36–48px desktop, 28–32px mobile.
- **Body / UI.** A neutral humanist sans, almost certainly the
  **Graphik** family (Commercial Type) or **Inter** as a near-
  identical substitute. Body copy is set at ~17–18px on article pages.
- **Eyebrow / category labels.** Sans-serif, all caps, small (11–12px),
  letter-spacing in the 1–2px range, often coloured in the cyan-
  accent blue.
- **Numerals.** Tabular figures used in card-rate boxes — the regular
  APR / annual fee / welcome-bonus stack reads as a column of
  aligned numbers, not flowing text.
- **Verdict / rating.** Display serif used at large size to render
  the star rating numeral (e.g. "4.5") inside a coloured pill.

## Layout `[recall — confidence varies]`

- **Container width.** Article body is ~720–760px (fairly tight).
  Card directory and homepage stretch to ~1280px max with side
  rails.
- **Grid system.** Standard 12-col Bootstrap-flavoured grid; gutters
  feel ~24px desktop. Card-tile grid is 3-up at desktop, 2-up at
  tablet, 1-up at mobile.
- **Side rail.** Article pages run a right rail at ≥1024px containing
  a sticky "Featured cards" widget, more affiliate CTAs, and ad
  units. Below ~1024px the rail collapses below the article and
  becomes inline modules.
- **Section structure (homepage).** Top-down:
  1. Top utility bar (small, cream-coloured "Advertiser Disclosure"
     ribbon).
  2. Header — wordmark left, primary nav centre, search + newsletter
     CTA right.
  3. Hero band — one large featured story tile, photographic, with
     2–4 secondary tile stack to the right at desktop.
  4. "Featured credit cards" widget — 3–4 card-art rendering with
     "Apply Now" CTAs and "Best for X" eyebrows.
  5. Latest news / "Editor's Picks" article grid — 3-up.
  6. Category bands — Travel / Cards / Loyalty / Hotels — each a
     horizontal scroll or 4-up grid of tiles.
  7. Newsletter capture band — full-width, photographic background.
  8. Footer.
- **Mobile.** Hero collapses to a single stacked card; nav becomes a
  hamburger drawer with the search and newsletter CTAs pinned.

**Cannot verify from recall:** exact breakpoint values, exact
container max-widths in px, whether the rail is 320px or 360px wide.

## Component inventory `[recall]`

- **Hero tile.** Photographic, 16:9 aspect, eyebrow + headline +
  byline overlaid or beneath.
- **Card-tile (article).** Photo top, eyebrow above headline, headline
  in serif, byline + date below in small grey sans.
- **Card product tile.** Card-art image (the actual plastic card
  rendering, supplied by issuer), card name, "Best for X" label,
  star rating, "Welcome Bonus / Annual Fee / Regular APR" 3-stat
  strip, "Apply Now" cyan button, "Read full review" secondary link.
- **Comparison tables.** Sticky header, alternating row shading,
  affiliate "Apply Now" cell on the right.
- **"Best of" widgets.** "TPG's Best Cards for [category]" embedded
  module — 4–5 cards stacked with star rating prominent.
- **Verdict / rating callout.** A scorecard block at the top of card
  reviews with a numeric rating ("4.5 / 5"), bullet list of awards
  ("Best for Beginners 2025"), and a one-paragraph editor verdict.
- **Pros / cons.** Two-column block, green and red minimal indicators
  (check / cross icons), set inside a bordered panel.
- **Affiliate disclosure.** Two patterns:
  1. Page-top ribbon: pale yellow / cream band, all caps tiny text,
     "ADVERTISER DISCLOSURE: This site is part of an affiliate sales
     network..."
  2. Inline next to in-text card mentions: a small dagger or
     asterisk linking to the disclosure footnote.
- **Newsletter module.** Full-width photographic band, large white
  serif headline ("Get TPG's daily newsletter in your inbox"),
  email input + "Subscribe" cyan button.
- **Footer.** Multi-column (4–5 columns), categories, company links,
  social, "Privacy", "Affiliate Disclosure", "Editorial Guidelines".
  Background dark navy, text white / pale grey.

## Information architecture `[recall]`

- **Top nav.** Travel / Credit Cards / Loyalty / Reviews / News /
  Deals / Guides — approximately seven primary items. Hamburger on
  mobile.
- **Card directory IA.** `/credit-cards/` is the hub. Sub-hubs by
  category (Travel, Cashback, Business, Airline, Hotel, No Annual
  Fee, etc.) and by issuer. Filtering UI on the hub for fee range,
  reward type, issuer.
- **Card review URL pattern.** `/credit-cards/<slug>-credit-card-review/`.
- **Breadcrumb.** Visible above the title on article and review pages
  ("Home > Credit Cards > Reviews > Chase Sapphire Preferred").
- **Internal linking density.** TPG runs **very dense** internal
  linking — a long card review can carry 30–60 in-text links,
  largely to other reviews and "Best of" hubs. This is part of the
  SEO playbook.

## Imagery `[recall]`

- **Hero photography.** Large, professional travel / aviation
  photography — airline cabins, hotel lobbies, destinations. 16:9.
  Image-led: the photo is often the dominant element above the fold.
- **Card art.** Issuer-supplied PNGs of the actual physical card,
  rendered at ~280–360px wide on tile, larger on review pages.
  Always shown.
- **Icons.** Light-line icons for category labels and pros/cons.
- **Photography intensity.** TPG is **photo-heavy.** A homepage
  visit shows 8–12 photographic images above the second scroll.

## Editorial conventions `[recall]`

- **Byline format.** "By [Author Name]" with a small avatar. Author
  links to author page.
- **Dateline.** "Published [date]" or "[date] • [N] min read".
- **Last updated.** Frequently surfaced as "Updated [date]" — this is
  prominent on card reviews and "Best of" pages.
- **Verdict.** Top-of-page scorecard, often with multiple sub-ratings
  (Rewards Earning, Welcome Offer, Benefits, etc.).
- **Affiliate disclosure.** Front-loaded: page-top ribbon AND an
  inline note below the title on review pages ("Some of the card
  offers that appear on the website are from credit card companies
  from which ThePointsGuy.com receives compensation.").
- **"Information collected independently."** TPG runs an explicit
  badge ("The credit card offers that appear on the website are from
  credit card companies from which ThePointsGuy.com receives
  compensation, but the analysis... is our own.") near the top of
  reviews.

## Density `[recall, low precision]`

- Above the fold (desktop, homepage): roughly 60–80 words of headline
  + eyebrow text, 3–5 photographic images, 1–2 ad slots.
- Above the fold (card review): page-top disclosure ribbon, a
  scorecard block, a card-art image, a "Welcome Bonus / Annual Fee"
  stat strip, and a 1–2-sentence verdict — total ~40–60 words plus
  the scorecard.
- Article body: ~17–18px body text, ~720px column, dense in-text
  links. A typical card review runs 2,500–4,500 words.
- Image-to-text ratio above the fold: very high (image-led).
- Ad-to-content ratio above the fold: medium-high — at least one
  display unit usually visible above the first article paragraph.

---

## Open questions (must be verified before brief lock-in)

- [ ] **Verify with Firecrawl.** The blocking on WebFetch is
  environment-specific; a Firecrawl pass with `formats: ["html",
  "markdown", "screenshot"]` should get through. Reset every
  `[recall]` flag against actual page source.
- [ ] **Exact hex codes for the navy and the cyan accent.** Recall
  gives ranges; locked-in palette spec needs the exact values from
  inline `style=` or computed CSS.
- [ ] **Exact font names.** Headlines are likely Tiempos or Publico
  Headline; body is likely Graphik or Inter. The font-family
  declaration in the CSS or the `<link>` tag to a font CDN gives the
  truth.
- [ ] **Mobile layout.** WebFetch returns one render; we cannot
  verify responsive rules. A real device screenshot at 375px and
  768px is needed.
- [ ] **JS-rendered components.** TPG's "Featured cards" widgets are
  partly JS-injected (affiliate-network feeds). What renders
  server-side vs client-side affects what we can observe.
- [ ] **Sponsor-pinning rules.** The exact placement and labelling of
  paid-for tile placement above the fold needs first-hand
  observation — this directly informs the "what we reject" section
  of the paired brief.
- [ ] **Internal-link count per article (verified).** Recall says
  30–60 per long review; needs an actual count from one fetched
  page.
- [ ] **Newsletter modal.** Does TPG run an interrupting modal on
  first visit, or is the capture only inline? Affects the
  "advertorial pattern" rejection list.

## Last verified

2026-05-08 — recall-only; no primary verification possible in this
session due to UA-blocking at TPG and at archive.org. Re-verification
ticket: open with Firecrawl-equipped session before Chairman lock-in.
