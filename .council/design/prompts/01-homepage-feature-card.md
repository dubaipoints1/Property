# Prompt 01 — Homepage feature card (single paste)

_The first design ask in the queue. Self-contained — paste once into
claude.ai._

## How to use

1. Open <https://claude.ai>, start a new chat (Sonnet 4.6 or Opus 4.7).
2. Attach the TPG mobile screenshot showing the "Global stories of
   award travel, points + miles" featured story (dark-navy card with
   the circular-masked Stockholm photo). If you don't have it,
   navigate to thepointsguy.com on mobile and screenshot.
3. Copy everything between the `===PROMPT BEGINS===` and
   `===PROMPT ENDS===` markers below.
4. Paste as your first message and hit send.
5. Iterate on the Artifact. When you like it, paste the HTML source
   (or a screenshot) into this Claude Code session — I implement.

---

===PROMPT BEGINS===

You are designing UI for **dubaipoints.ae**, a UAE-focused points-
and-miles publication. Your output will be implemented in an Astro
5 codebase that uses a CSS-custom-property token system and a
`.dp-*` class namespace. The visual reference is The Points Guy
(thepointsguy.com), adapted for a UAE-resident audience and a non-
advertorial editorial voice.

## Palette — locked

Use ONLY these CSS custom properties. Do not introduce new colours.
Do not use Tailwind colour utilities (slate-*, gray-*, etc.).

```
/* Surfaces — rotate across sections */
--bg:        #ffffff;     /* default page surface */
--paper:     #ffffff;     /* cards, callouts on white */
--cool:      #f4f5f7;     /* light cool band — valuations */
--cream:     #f8f0e0;     /* warm band — optional */
--navy:      #0a2540;     /* primary dark identity */
--navy-deep: #06182d;     /* footer / very dark band */
--green:     #0c8463;     /* universal eyebrow + chrome accent */
--green-band:#1d6b54;     /* newsletter band background */

/* Type */
--ink:       #0a2540;     /* body text on white */
--ink-soft:  #5a6068;     /* meta, secondary copy */
--muted:     #8a8f9a;     /* dates, byline timestamps */

/* Lines + chrome */
--line:      #e3e3e1;
--line-soft: #f1f1ef;

/* Interactive — link / focus / hover only */
--link:      #1a5fc6;
--link-deep: #154fa3;
--link-soft: #eef3fb;

/* Signal — live / expiry / warnings only */
--red:       #c8412d;
```

`--gold` is sunsetted from UI. Do not use it.

## Type — locked

- **Display:** Fraunces serif, weight 700 (bump to 800 only on the
  hero). Letter-spacing tight: -1.2px on H1 (44–56px), -1.4px on
  hero (60–96px), -0.6px on H2.
- **Body:** DM Sans sans, 400/500 for body, 600 for emphasis, 700
  for caps eyebrows.
- **Body size:** 16px on body, 17px in `.dp-prose` long-form, 14px
  on meta, 11px on caps eyebrows.
- **Eyebrows:** 11px / 700 / 2.5px tracking / uppercase / `--green`
  on white. On dark backgrounds (navy / green band) eyebrows go
  white; reserve `--green` for emphasis tags.
- **No italic display words.** `em` inside titles renders flat.

## Editorial fences — non-negotiable

Do NOT design:

- "Apply now" CTAs of any kind. Card pages and tiles use "Read
  review" or "Compare" — never apply. We are not on the affiliate
  surface yet.
- Advertiser-disclosure ribbons at the top of pages.
- "ADVERTISEMENT" inline blocks.
- Sponsor-pinned tiles above the fold.
- Affiliate badges that compete with editorial verdicts.
- Auto-playing video / interrupting modal newsletter capture.
- Yellow / honey / gold accents in chrome.
- Saturated cyan. Our blue is link-only and desaturated.
- Pricing in USD as primary. Always AED-first.
- Italic display words.

## Voice constraint

Display copy is HfP-dry, not TPG-commercial. Headlines lean
analytical, not transactional. Sceptical, evidence-led, specific.
No exclamation marks. Numbers always written numerically.

## Mobile rules

- Mobile-first — design 390px first, scale up.
- Container padding-inline: 16 / 24 / 32px at <768 / 768–1023 /
  ≥1024.
- Tap targets ≥44px on mobile.

---

# THE DESIGN ASK

Design the homepage **feature card** (`.dp-feature-card`).

## Reference

Attached: TPG mobile screenshot of their "Global stories of award
travel, points + miles" featured story. Note the structure — dark
navy card, circular-masked photo top, eyebrow above headline, white
heavy serif headline, dateline + read time, arrow CTA. Adapt this
pattern for our voice and our token system.

## Current state I want to improve

Today this card renders with a CSS-gradient circular mask in place
of a photo (we don't have licensed photography yet). The placeholder
reads as "image missing" rather than "intentional typographic
placeholder". I want this fixed.

## Produce two Artifact variants

### Variant A — Photography-light (priority)

The card renders without a real photo. Design a placeholder treatment
that looks intentional even when every feature card on the site uses
the same placeholder style for months. Allowed materials: typographic
marks (a stylised wordmark, a numeral, a glyph), geometric shapes
(circles, lines, wave patterns), gradients within the locked palette,
decorative SVG patterns. The card must work at 390px and 1024px. The
eyebrow / headline / meta / arrow remain.

### Variant B — Photography-licensed

Same card structure, but assume we license a 16:9 photograph rendered
inside the circular mask. Show cropping behaviour, mask-shape
interaction with image content, and small-screen degradation. Use a
placeholder Unsplash image (any travel/skyline photo) so it's clear
what's expected.

## Placeholder copy (verbatim, both variants)

- **Eyebrow:** Editor's read
- **Title:** What FAB's salary-transfer programme actually pays out,
  by salary band
- **Date:** 8 May 2026
- **Read time:** 9 min read
- **Href:** /guides/fab-salary-transfer-by-band/
- **Arrow CTA:** → (visual; the whole card is the link)

Use this exact copy. It's HfP-dry, AED-specific, evidence-led, and
tests headline wrap behaviour. Do not substitute a TPG-style title.

## Acceptance criteria

1. Outer wrapper uses `--navy` background or wraps in
   `.dp-band-navy`.
2. All colours from the locked palette only.
3. Headline: Fraunces 700, `clamp(22px, 3.6vw, 30px)`, letter-spacing
   `-0.6px`, line-height `1.18`.
4. Eyebrow: DM Sans 700 caps, 11px / 2.5px tracking, `--green`.
5. Meta line: `rgba(255,255,255,0.72)`, 13px DM Sans 400.
6. Arrow CTA: 38×38 white circle, ink arrow inside, designer's call
   on alignment. Hover translates `translateX(4px)`.
7. Internal padding: 28px on mobile, 40px from 768px+.
8. Border-radius: 12px on the card.
9. Variant A's placeholder must be visually distinct from a missing-
   image placeholder. A single circle in the middle reads broken;
   a small composition (overlapping shapes, typographic mark, wave
   pattern) reads intentional.
10. Variant B handles dark / busy photos via mask-edge overlay.

## Output format

For each variant, an Artifact containing:

- A complete viewable HTML page with a single `.dp-feature-card`
  rendered at the centre of the viewport.
- All CSS in a scoped `<style>` block at the top of the artifact
  (NOT inline on elements). Declare `:root` tokens at the top of
  the style block so the artifact is self-contained.
- The placeholder copy verbatim.

After both Artifacts:

1. **RATIONALE** (100–150 words). What did you choose for the
   placeholder treatment in A and why does it not read as broken?
   What's the smallest production change to swap A → B?
2. **WHAT GETS HARD IN PRODUCTION** (50–100 words). Photography
   licensing from FAB / ENBD; image format; Cloudflare image cache;
   responsive image sizing; the same card is also rendered in a
   list view on `/guides/` — does the design carry?

Begin with Variant A. After I respond, do Variant B.

===PROMPT ENDS===

---

## After you have a design you like

Bring back to this Claude Code terminal:

- The Artifact's HTML/CSS source (paste it directly), OR
- A screenshot of the rendered Artifact (drag-drop in chat).

I'll implement on a branch like `claude/feature-card-redesign`, lift
the new component CSS into `src/styles/global.css` (replacing the
current `.dp-feature-card` rules), update `src/pages/index.astro` to
match any structural changes, run check + build + test, and open a
PR for review.

If you want both variants implemented (A as the live look, B as a
ready-to-flip-to once licensing lands), say so when you bring the
design back — I'll wire them as `.dp-feature-card.is-photo-mode` for
the licensed variant and the default for the placeholder.
