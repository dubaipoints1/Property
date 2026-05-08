# Prompt 00 — Whole homepage (single paste)

_Sweeping starting-point prompt. Produces a complete-vision homepage
mockup as a single Artifact. Run this first if you want to see the
whole thing before drilling into per-component refinement._

## How to use

1. Open <https://claude.ai>, start a new chat (Sonnet 4.6 or Opus 4.7).
2. Attach **all** the TPG mobile screenshots you took (8 of them —
   the homepage scrolling sequence). Drag-drop or use the paperclip.
3. Copy everything between `===PROMPT BEGINS===` and
   `===PROMPT ENDS===` below.
4. Paste as your first message. Send.
5. Iterate — claude.ai will produce a long Artifact; ask for tweaks
   to specific sections in follow-up messages.
6. When you're satisfied, paste the Artifact's HTML source back into
   this Claude Code session OR a screenshot. I'll break it into
   per-section implementation PRs (hero / feature card / feed /
   favourite cards / newsletter) so each ships bite-size.

---

===PROMPT BEGINS===

You are designing UI for **dubaipoints.ae**, a UAE-focused points-
and-miles publication. Your output will be implemented in an Astro
5 codebase that uses a CSS-custom-property token system and a
`.dp-*` class namespace. The visual reference is The Points Guy
(thepointsguy.com), adapted for a UAE-resident audience and a non-
advertorial editorial voice. Attached: TPG mobile screenshots of
their homepage scrolling sequence — these are the primary visual
reference. Use them.

## Palette — locked

```
/* Surfaces */
--bg:        #ffffff;
--paper:     #ffffff;
--cool:      #f4f5f7;
--cream:     #f8f0e0;
--navy:      #0a2540;
--navy-deep: #06182d;
--green:     #0c8463;
--green-band:#1d6b54;

/* Type */
--ink:       #0a2540;
--ink-soft:  #5a6068;
--muted:     #8a8f9a;

/* Lines */
--line:      #e3e3e1;
--line-soft: #f1f1ef;

/* Interactive */
--link:      #1a5fc6;
--link-deep: #154fa3;
--link-soft: #eef3fb;

/* Signal */
--red:       #c8412d;
```

`--gold` is sunsetted from UI. Do not use it. Do not introduce new
colour tokens. Do not use Tailwind colour utilities.

## Type — locked

- **Display:** Fraunces serif, weight 700 body / 800 hero. Tight
  letter-spacing: -1.4px on hero (60–96px), -1.2px on H1 (44–56px),
  -0.6px on H2.
- **Body:** DM Sans sans, 400/500 body, 600 emphasis, 700 caps.
- **Sizes:** 16px body, 14px meta, 11px caps eyebrows.
- **Eyebrows:** 11px / 700 / 2.5px tracking / uppercase / `--green`
  on white. White on dark backgrounds.
- **No italic display words.**

## Editorial fences — non-negotiable

Do NOT design:
- "Apply now" CTAs of any kind. Use "Read review" / "Compare" only.
- Advertiser-disclosure ribbons.
- "ADVERTISEMENT" inline blocks.
- Sponsor-pinned tiles above the fold.
- Auto-playing video / interrupting modals.
- Yellow / honey / gold accents.
- Saturated cyan. Our blue is link-only.
- Pricing in USD as primary. Always AED-first.
- Italic display words.

## Voice constraint

HfP-dry, evidence-led, sceptical. Headlines are analytical, not
transactional. No exclamation marks. Numbers always numerical
("AED 18,000", not "eighteen thousand AED").

## Mobile rules

Mobile-first — design 390px first, scale to 768 / 1024 / 1280.
Tap targets ≥44px. Container padding-inline: 16 / 24 / 32px at
the standard breakpoints.

---

# THE DESIGN ASK

Design the **complete homepage** for dubaipoints.ae as a single
Artifact. Seven sections, top to bottom:

## 1. Header (sticky)

- Hamburger left, wordmark center, search icon right (mobile).
- Logo height continuous-scale: 36 / 44 / 52px at <768 / 768–1023 /
  ≥1024.
- Wordmark is plain text "DubaiPoints" in DM Sans 800 (no icon mark
  yet — we don't have brand-mark assets).
- Background: white with hairline `--line` bottom border. No
  advertiser-disclosure ribbon.
- "Live · salary transfer tracker" tag visible somewhere — in
  current site this sits in the masthead row below the header.
  You can leave it or fold it into the header — designer's call.
  Make it green caps, not red, since it's a tag not an alert.

## 2. Hero (typographic, no images)

Reference: TPG's "Your life rewarded" wordmark-only hero. Adapt:

- Wordmark "DubaiPoints" + dateline "8 May 2026 · Dubai" in a
  masthead row above the headline.
- Headline: **"UAE rewards rewarded."** (or propose a tighter HfP-
  dry alternative — sceptical, specific, AED-aware).
- Strap: **"Independent UAE-resident-led analysis of credit cards,
  salary-transfer bonuses, miles redemptions, and lifestyle deals
  — every figure in AED, every card checked against UAE eligibility
  rules."**
- Below the hero: a 5-row typographic index (no images) — one
  category eyebrow + headline + meta per row, separated by hairline
  rules. Reference TPG's "In today's brief" pattern.

5-row index sample copy:

| eyebrow | title | meta |
|---|---|---|
| Guides | What FAB's salary-transfer programme actually pays out, by salary band | Updated 8 May |
| Review | Emirates NBD Skywards Infinite — earns Skywards Miles, but not enough of them | Verified 7 May |
| Deal | Cinnabon UAE 2-for-1 boxes — no app required | Ends 31 May |
| News | Etihad Guest devalues partner redemptions on Lufthansa Group | Filed 5 May |
| Guide | Opening a UAE bank account: what AECB looks at, and what it doesn't | Updated 30 Apr |

## 3. Feature card (`.dp-feature-card`) — navy band

Reference: TPG's "Global stories of award travel, points + miles"
featured story. Dark navy card, circular-masked photo top, eyebrow,
white serif headline, dateline + read-time, arrow CTA.

Adapt: card art is **placeholder** (no licensed photography yet).
Design a placeholder treatment that looks intentional — typographic
mark / overlapping shapes / wave pattern — NOT a single circle in
the middle (that reads broken).

Copy:
- Eyebrow: **Editor's read**
- Title: **What FAB's salary-transfer programme actually pays out,
  by salary band**
- Date: **8 May 2026** · **9 min read**
- Arrow CTA: **→**

## 4. Latest analysis (white background) — tabs + feed

Tabs (`.dp-tabs`, green underline on active):
- "The latest" (active)
- "Credit cards" (links to /cards/)
- "Loyalty programs" (links to /airlines/)

Below: 8-row reverse-chronological feed mixing guides + deals + card
reviews. Each row: eyebrow caps in `--green` (130px column on desktop
≥768px), title (Fraunces 600), one-line detail (DM Sans, --ink-soft),
date right-aligned. Hairline rule between rows.

Sample feed copy (use these 8 verbatim):

1. **Guides** · What FAB's salary-transfer programme actually pays out, by salary band · 8 May
2. **Review** · Emirates NBD Skywards Infinite — earns Skywards Miles, but not enough of them · 7 May
3. **Deal** · Cinnabon UAE 2-for-1 boxes — runs through May, no app required · ends 31 May
4. **News** · Etihad Guest devalues partner redemptions on Lufthansa Group · 5 May
5. **Guide** · Opening a UAE bank account: what AECB looks at, and what it doesn't · 30 Apr
6. **Review** · FAB Cashback Visa — capped at AED 1,000/month, but the tier-1 categories are right · 28 Apr
7. **News** · DLD raises off-plan registration fees — what changes for first-time buyers · 25 Apr
8. **Deal** · Mashreq + noon: 10% off groceries through July · ends 31 Jul

CTA at the bottom of the feed: **"Find more stories →"** in `--link`
text.

## 5. Explore our favourite cards — navy band, filter pills + card-tile grid

Section eyebrow: **Editor's picks** (white caps on navy).

Headline: **"Cards that pay back what UAE residents actually spend on."**

Strap: One sentence — sceptical / evidence-led / AED-specific.

Filter pills (`.dp-filter-pills`) — outlined ovals on navy:
**All cards** · **Cashback** · **Miles** · **Islamic** · **Compare**
· **Banks** · **Airlines**

Card-tile grid (`.dp-card-tile`) — 1 col mobile / 2 col 640+ /
4 col 1024+. Each tile: placeholder card art (1.586:1 ratio, navy
gradient) with bank + name + network printed on the art, then a body
block with category eyebrow / title / specs strip / "Read review"
CTA. **No "Apply now".**

Sample 8 cards (use verbatim):

| Bank | Name | Network | Annual fee | Min salary |
|---|---|---|---|---|
| FAB | FAB Cashback Visa | Visa | AED 525 / yr | AED 8,000 / mo |
| Emirates NBD | Skywards Infinite | Visa | AED 1,575 / yr | AED 30,000 / mo |
| Emirates NBD | Visa Infinite | Visa | AED 700 / yr | AED 25,000 / mo |
| FAB | Etihad Guest Infinite | Visa | AED 1,575 / yr | AED 30,000 / mo |
| Emirates NBD | Marriott Bonvoy World Elite | Mastercard | AED 1,575 / yr | AED 30,000 / mo |
| Emirates NBD | Manchester United | Mastercard | AED 525 / yr | AED 8,000 / mo |
| Emirates NBD | dnata World | Mastercard | AED 700 / yr | AED 25,000 / mo |
| FAB | Elite | Visa | AED 1,575 / yr | AED 30,000 / mo |

CTA at the bottom of the section: **"See all reviewed cards →"** in
white, on navy.

## 6. Newsletter — emerald (`--green-band`) full-width band

Reference: TPG's "Fuel your adventure" newsletter band. Adapt for
DP voice:

- Eyebrow: **The DubaiPoints brief**
- Headline: **Friday morning, in your inbox.**
- Strap: One sentence — what the newsletter contains, AED-first
  framing, no fluff.
- Email input + **Subscribe** button (white pill, green text)
- Secondary CTA: **RSS feeds** (white text underline)
- Microcopy underneath: "We never sell email addresses or browsing
  data. **[Editorial policy](/editorial-policy/)**."

Optional: a decorative SVG wave pattern in
`rgba(255,255,255,0.08)` — TPG uses this and it works.

## 7. Footer — dark (`--navy-deep`) full-width

Reference: TPG mobile screenshots 6 and 7 (footer top + bottom).
Adapt:

- Wordmark + tagline ("Maximize your travel" → propose a DP-voice
  alternative like "UAE rewards, without the marketing.")
- Social icons row — placeholder for now (Facebook, Instagram, X,
  YouTube). DP doesn't have all of these yet — show them as
  placeholder spots.
- Newsletter capture inline (same pattern as section 6 — second
  capture point).
- Three nav columns with `--green` caps headings:
  - **Publication** — About / Team / Editorial policy / How we make money
  - **Content** — Cards / Banks / Airlines / Guides / News / Deals
  - **Tools** — Salary transfer / Valuations / Compare / Search
- Bottom strip: copyright + "Corrections: info@dubaipoints.ae"
- **Do NOT design** an "OUR COMMITMENT TO TRANSPARENCY" affiliate-
  disclosure block. We don't run affiliates yet.

## Output format

A single Artifact: a complete viewable HTML page rendering all 7
sections in order. CSS in a scoped `<style>` block at the top, with
`:root` token declarations so the artifact is self-contained.

After the Artifact:

1. **RATIONALE** (200–300 words). Section-by-section: what design
   choices you made and why. Note where you deviated from TPG and
   why (voice / fence / DP context).
2. **WHAT GETS HARD IN PRODUCTION** (100–200 words). Photography
   licensing; the JS state for tabs (we want them as anchor links
   to dedicated pages, not real tabs); the placeholder card-art
   treatment (each card looks identical without per-bank treatment);
   typography (Fraunces is loaded; if you propose Tiempos / Publico,
   that's a license cost); responsive image sizing; how the design
   handles 0 deals / 0 news / 0 cards (empty states).
3. **WHAT I'D CHANGE NEXT** (100 words). If we ship this exactly,
   what's the next-most-important refinement — one specific
   component / pattern you'd revisit?

Begin.

===PROMPT ENDS===

---

## After you have a design you like

Bring back to this Claude Code terminal:
- The Artifact's HTML/CSS source (paste it directly), OR
- A screenshot of the rendered Artifact

I'll **break it into per-section implementation PRs** so each ships
bite-size — header / hero / feature card / feed / favourite cards /
newsletter / footer. That's about 5–7 PRs over a week or two,
landing on `main` incrementally so you can see each component go
live without waiting for the whole revamp to merge in one go.

If claude.ai's design needs assets we don't have (custom illustration,
photography, custom serif font license), I'll flag those as separate
"asset needs" tickets — you decide which to commission and which to
skip.
