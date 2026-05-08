# Design queue

_Ordered list of components / pages to redesign in claude.ai (with the
system brief at `system-brief-for-claude-ai.md` as the prompt prefix).
Top of the list = biggest visual win for least effort. Tackle
sequentially; once a design ships via Claude Code, move to the next._

---

## Priority 1 — Homepage feature card (`.dp-feature-card`)

**Current state.** Navy block with a CSS-gradient circular mask
("placeholder card") and white serif headline. Renders the newest
guide. The mask reads as "image missing" rather than "intentional
typographic placeholder".

**Why first.** It's the largest single block above the fold and the
first piece of editorial chrome a returning visitor sees. Fixing this
alone raises perceived quality more than any other single component
on the homepage.

**Reference.** TPG mobile screenshot 2 of the brief — "Global stories
of award travel, points + miles" featured story. Dark navy card,
circular-masked photo (Stockholm at golden hour), GUIDES eyebrow in
caps, white serif headline, date + read time, arrow CTA bottom-right.

**What to produce in claude.ai.**
- Two Artifact variants:
  - **A.** With placeholder treatment (no real photo). Goal: design a
    placeholder that looks intentional, not broken — geometric shapes,
    typographic mark, or wave pattern in --green / --navy /
    rgba(white, 0.04). Must look polished even when every feature
    card on the site has the same placeholder.
  - **B.** With a real photo (assume we license one). Goal: card-art
    treatment that handles a 16:9 photo cropped to a circular mask
    elegantly.
- Rationale should explain how A degrades gracefully toward B as we
  add photography over time.

**Constraints.**
- Use `.dp-band-navy` for the section wrapper if the card is in a
  sectioned context, or render the card itself with `--navy` background
  if it's standalone. Decide which.
- Headline copy: HfP-dry. The current "My dad was a points and miles
  expert. Here's what we still got wrong when preparing for his death"
  is TPG voice, not ours. Use our tone in the mockup copy.
- Eyebrow: "Editor's read" (current) or "Guides" or other — propose.
- "What gets hard in production": image licensing, image format
  (WebP / AVIF), Cloudflare image cache.

---

## Priority 2 — Card-tile (`.dp-card-tile`)

**Current state.** A 1.586:1 navy gradient with the bank name + tier
+ network text overlaid. Every tile in the cards grid looks identical
except for the text. The grid feels generic.

**Why second.** Card tiles compose the homepage "favourite cards"
section AND the cards directory AND the cards-by-category landings.
A great tile design cascades to multiple pages.

**Reference.** TPG mobile screenshot 4 — "Great offers from partners"
showcase with "BEST PREMIUM TRAVEL CARD FOR VALUE" eyebrow, real
Chase Sapphire Reserve card image, "Apply now" pill. We adapt: keep
the structure, drop the Apply now (per Charter), use our placeholder
art treatment until licensing lands, retain the editorial-eyebrow
positioning category badge.

**What to produce.**
- Two Artifact variants:
  - **A.** Placeholder card art treatment. Each tile differentiates
    via category eyebrow ("Best for travel" / "Best for cashback" /
    etc.), bank colour scheme (within our locked palette), and a
    geometric / pattern variation. Goal: 8 tiles in a row look like 8
    different cards, not 8 identical placeholders.
  - **B.** Real card art treatment (assume licensed). 1.586:1 ratio,
    handle Visa / Mastercard / Amex network logos.
- Plus the body block under the art: bank, name, AED annual fee,
  AED min salary, "Read review" CTA.

**Constraints.**
- "Read review", never "Apply now" (Charter §Q3).
- Network logo can use Visa / Mastercard / Amex official mark
  (free for editorial use); propose where it goes.
- "What gets hard in production": If you suggest per-bank colour
  variation, we may need to add a `bankColor` field to the bank
  collection schema. Flag in rationale.

---

## Priority 3 — Footer

**Current state.** Untouched in the entire revamp. Whatever the
existing `Footer.astro` renders is what shipped. No design intent
applied since the Quiet Ledger pivot or the TPG pivot.

**Why third.** Footer is the second-most visited site element after
the homepage hero (every page renders it). It's a deliberate design
surface in good publications. Untouched = wasted real estate and
trust signal.

**Reference.** TPG mobile screenshots 6 and 7 — dark navy band, white
wordmark + tagline, social-icon row (Facebook / Instagram / YouTube /
X / TikTok), newsletter capture (second one — first is mid-page),
two-column nav (MEET TPG / LEGAL) with green eyebrow headings,
"OUR COMMITMENT TO TRANSPARENCY" disclosure block.

**What we adapt.** Drop the disclosure block (we're not affiliate
yet). Drop social icons we don't have accounts for (audit needed —
do we have any social presence yet?). Otherwise structure adopts
verbatim.

**What to produce.**
- One Artifact for the full-width footer using `.dp-band-navy-deep`
  (a new variant slightly darker than `--navy`).
- Sections: wordmark + tagline + social icons (placeholder) →
  newsletter capture inline (links to /newsletter/ — same form pattern
  used on the homepage band) → 3 navigation columns: PUBLICATION
  (about / team / editorial-policy / how-we-make-money), CONTENT
  (cards / banks / airlines / guides / news / deals), TOOLS (salary-
  transfer / valuations / compare / search) → copyright + corrections
  link.
- Eyebrow headings on the columns in --green caps.

**Constraints.**
- Social icons: only include accounts we actually have (audit before
  designing). Don't paste TikTok / X if there's no account.
- No "OUR COMMITMENT TO TRANSPARENCY" inline block (that's affiliate-
  specific).

---

## Priority 4 — Header / nav

**Current state.** Mobile drawer works (PR #17 confirmed); logo
continuous-scale lands (PR #25). But the nav structure — what's in
the drawer, what's in the desktop top-bar, the search behaviour, the
"Live · salary transfer tracker" tag — hasn't been designed against
TPG.

**Reference.** TPG mobile screenshot 1 — hamburger left, wordmark
centre with green/teal arrow icon, search-glass right. Sticky top.

**What to produce.**
- Mobile drawer redesign: nav structure, search prominence, "Live"
  tag treatment, newsletter / tracker CTAs in drawer.
- Desktop nav: should we move from mobile-only drawer to a
  desktop top-bar nav? TPG has both depending on screen.
- Wordmark / logo treatment: do we keep "DubaiPoints" text-only or
  add a mark / icon (the TPG green-arrow analogue)?

**What gets hard.** Logo file. We're using `/wordmark.svg`
(placeholder). A proper brand mark needs commissioning.

---

## Priority 5 — Card review template (`CardReviewLayout.astro`)

**Current state.** `.dp-article-head + .dp-stats + .dp-take +
.dp-proscons + .dp-data-table + .dp-prose + .dp-article-foot`. Solid
structure but no navy hero band, no card-art hero, no scorecard, no
sticky compare rail. The TPG-adapted brief calls for all of these.

**Reference.** TPG mobile screenshot 4 → adapted for our editorial
voice. The brief at `tpg-redesign-brief.md` §"Locked component
additions" has the spec.

**What to produce.**
- Hero band — navy, full-width, with the placeholder card art at
  320px on mobile (left) and the title block (right). Eyebrow:
  bank + network. Title. Lede. Verified chip + last-updated meta.
- Below the hero: stat strip (existing) + "Our take" callout
  (existing, retheme to navy ink-on-paper) + pros/cons (existing)
  + earn-rate table (existing) + perks list + sources/footer.
- Sticky right rail at ≥1024px: "Compare similar cards" with 2-3
  related card mini-tiles (using `.dp-card-tile-mini` if needed, or
  scoped variant). NOT "Apply now".

---

## Priority 6 — Directory pages

**Current state.** `/cards/`, `/banks/`, `/airlines/`, `/guides/`
plus card-category subpages (`/cards/cashback/`, `/islamic/`,
`/miles/`). All render with `.dp-dir-grid + .dp-dir-tile` (the
generic directory tile, not the new `.dp-card-tile`).

**What to produce.**
- A unified directory layout that takes filter pills (`.dp-filter-
  pills`) above a card-tile grid for `/cards/`, and a generic
  directory grid (`.dp-dir-grid`) for `/banks/`, `/airlines/`,
  `/guides/`.
- For category subpages — the filter pills surface the active
  filter visually.

---

## Priority 7 — Salary-transfer pages

**Current state.** Pillar landing at `/salary-transfer/`, calculator,
per-band slug pages. Tracker is a Preact island. All inherit the new
tokens but layout untouched.

**Reference.** No clean TPG analogue for salary-transfer (US doesn't
have it as a product). Design from first principles — "live tracker"
energy, AED-prominent, band-comparator UI.

**What to produce.**
- Pillar landing redesign: hero with current "best AED reward" pull-
  number, top-3 bands at-a-glance, calculator inline, per-bank
  deep-dive cards in a grid below.
- Per-band landing: bank-by-bank in a comparison-table format.
- Calculator: redesign to feel like a tool, not a form.

---

## Priority 8 — Trust pages (light)

**Current state.** `TrustPageLayout` migrated to `.dp-article + .dp-
prose` in PR #24; tokens cascaded in PR #25. Looks fine but undesigned.

**What to produce.**
- A header treatment that signals "trust page" without being heavy
  (no navy band; this is editorial prose, not chrome).
- Per-page accent: `/about/` carries a portrait or signature treatment;
  `/editorial-policy/` carries a verification-stamp visual; `/how-we-
  make-money/` carries an asterisk / disclosure visual.

---

## Priority 9 — Valuations pages (`/valuations/`,
`/valuations/methodology/`)

**Current state.** Empty / placeholder. Methodology is a Q3 2026
artifact per `EDITORIAL.md`.

**Reference.** TPG mobile screenshot 6 — "We know what points are
worth" + valuation strip with `2.05¢` style heavy numbers right-
aligned.

**What to produce.**
- Valuations landing: hero + valuation strip listing every programme
  in `programs` collection with our AED-per-mile valuation.
- Methodology page: prose explanation of how we value, what we don't
  value, when we update.

**What gets hard.** Methodology is the load-bearing trust artefact.
The Chairman gates the methodology copy. Design first; copy follows.

---

## Items NOT in this queue (deliberate)

- **CardMatch / recommender quiz.** Charter §Q3 rejects. TPG has it;
  we don't.
- **Advertiser-disclosure ribbon.** No affiliates yet.
- **"Apply now" CTAs.** Read review only.
- **Per-band RSS feed UI.** RSS works headless; no design needed.

---

## Cadence

Tackle one priority per week. Each priority produces a claude.ai
Artifact, you review, send to me, I implement and ship via PR. Six
to nine weeks for the full revamp at this cadence — significantly
faster than going chunk-by-chunk in code without a design pass first.

If you want to accelerate, parallelise: start P1 in claude.ai while
P3 (footer) is being designed in a second claude.ai conversation.
The system brief is identical for every conversation.
