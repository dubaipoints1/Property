# Design system brief for claude.ai

_Paste the section between the rules below as the first message in any
claude.ai design conversation. It gives claude.ai everything it needs
to produce designs that translate cleanly into our codebase — same
tokens, same class names, same editorial fences. Without this prefix,
claude.ai's output uses Tailwind utilities and arbitrary hex codes
that fight our system, and translation becomes painful._

---

```
You are designing UI for **dubaipoints.ae**, a UAE-focused points-and-
miles publication. Your output will be implemented in an Astro 5
codebase that uses a CSS-custom-property token system and a `.dp-*`
class namespace. The visual reference is The Points Guy
(thepointsguy.com), adapted for a UAE-resident audience and a non-
advertorial editorial voice.

When I ask you to design something, produce:
1. A working HTML/CSS Artifact that uses ONLY the tokens, class names,
   and patterns below.
2. A short rationale (50–150 words) explaining what design choices
   you made and why.
3. A "what gets hard in production" note flagging anything that
   needs photography, custom illustration, JS state, or a
   data-shape change.

## Palette — locked

Use ONLY these CSS custom properties. Do not introduce new colours.
Do not use Tailwind colour utilities (slate-*, gray-*, etc.).

```css
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
--ink:       #0a2540;     /* body text on white (= navy) */
--ink-soft:  #5a6068;     /* meta, secondary copy */
--muted:     #8a8f9a;     /* dates, byline timestamps */

/* Lines + chrome */
--line:      #e3e3e1;
--line-soft: #f1f1ef;

/* Interactive — link/focus only, never display type, never eyebrows */
--link:      #1a5fc6;
--link-deep: #154fa3;
--link-soft: #eef3fb;

/* Signal — live/expiry/warnings only */
--red:       #c8412d;
```

**Sunset:** `--gold` and `--gold-soft` are defined as legacy variables
but **must not** be used in new UI. Don't add them to a design.

## Type — locked

- **Display:** Fraunces serif, weight **700** (bump to 800 only on
  the homepage hero). Loaded from Google Fonts. Letter-spacing tight:
  -1.2px on H1 (44–56px), -1.4px on hero (60–96px), -0.6px on H2.
- **Body:** DM Sans sans, weight 400/500 for body, 600 for emphasis,
  700 for caps eyebrows. Loaded from Google Fonts.
- **Body size:** 16px on body, 17px in `.dp-prose` long-form, 14px
  on meta, 11px on caps eyebrows.
- **Eyebrows:** 11px / 700 / 2.5px tracking / uppercase / `--green`.
  On dark backgrounds (.dp-band-navy / .dp-band-green) eyebrows go
  white — green is preserved only for emphasis tags.
- **No italic display words.** `em` inside titles renders flat.

## Class system — `.dp-*` only

Use these existing classes. Don't invent new top-level component
classes; suggest them in the rationale if needed.

### Article / page shells
- `.dp-article` — max-width 880px, padded; `.is-wide` widens to 1080,
  `.is-trust` narrows to 720
- `.dp-article-head` — header block (eyebrow + title + lede + meta)
- `.dp-article-eyebrow` — emerald caps; `.is-red` for live/expiry,
  `.is-ink` to opt out of green on navy bands
- `.dp-article-title` — Fraunces 700, clamp(30-48px), -1.2px
- `.dp-article-lede` — body 16px, --ink-soft, max 60ch
- `.dp-article-meta` — meta line; `.verified-chip` modifier
- `.dp-prose` — long-form prose; styles h2/h3/p/ul/ol/blockquote/code
- `.dp-article-foot` — sources/disclosure footer

### Editorial components
- `.dp-stats` — stat strip (annual fee / FX fee / min salary)
- `.dp-take` — "Our take" callout, ink border on white, red label
- `.dp-proscons` — pros/cons two-column with `+` / `−` glyphs
- `.dp-data-table` — earn rates / fee table
- `.dp-byline` — byline with `.dp-byline-avatar` (flat ink circle)
- `.dp-bullet-list` — bulleted list with `+` glyph

### Section bands (TPG rotation)
- `.dp-band-navy` — navy bg, white text inside
- `.dp-band-green` — emerald bg, white text inside
- `.dp-band-cool` — cool grey bg, ink text

### Tile / card patterns
- `.dp-feature-card` — featured story (navy bg, circular-mask image,
  white serif headline, eyebrow, meta, arrow CTA)
- `.dp-card-tile` — directory tile (1.586:1 placeholder card art top,
  bank/name/network on art, body with eyebrow/title/specs/CTA)
- `.dp-dir-tile` — generic directory tile (eyebrow + title + desc +
  meta), used for non-card content
- `.dp-tabs` — green-underline tabs (active state has bottom border
  in --green)
- `.dp-filter-pills` — outlined oval pills, work on white or navy via
  currentColor border + inverted-on-hover
- `.dp-valuation-row` — heavy-number row primitive (icon + name +
  big serif number right)

### Tracker (Preact island)
- `.dp-tracker-*` — salary-transfer tracker styling

## Data layer constraints

When designing a card review or card-tile, the available data is the
L2 schema in src/lib/cardsData.ts:

```
slug, name, bank, network ('Visa'|'Mastercard'|'Amex'),
categories (travel|cashback|shopping|dining|lifestyle|co-brand|Islamic),
joiningFee?, annualFee {amount, currency:'AED'},
fxFee, loyaltyProgram, earnRates {dining?, groceries?, ...,
                                  everythingElse, _caps?},
earnUnit (the loyalty currency name),
welcomeBonus (structured: amount, unit, spend_threshold_aed,
              qualify_window_days, headline_value_aed?, notes?),
welcomeBonusValue (AED valuation),
annualFeeWaiver (structured: year_one_waived, ongoing_threshold_aed,
                 threshold_period),
_features (typed perks: lounge_access, cinema_bogo, hotel_discount,
                         airport_transfer, golf, dining_discount, etc.),
perks (free-text array, fallback to _features),
eligibility {minSalary, maxAge?, minAge?, residencyRequired,
             salaryTransferRequired, employmentTypes, additionalRequirements},
applyUrl, kfsUrl, lastVerified, sources, verifiedBy.
```

**No `cardArtUrl` exists yet.** Card art is currently a CSS
placeholder rendered as a navy gradient with the bank name + tier +
network. Photography licensing is pending; design accordingly.

For news posts (the 'news' content collection):
```
title, description, publishedAt, updatedAt?,
category (news | deal-update | card-launch | regulation |
          programme-change | salary-transfer),
relatedCards[], relatedPrograms[], relatedBanks[], sources[].
```

## Editorial fences — non-negotiable

Do NOT design:
- "Apply now" CTAs of any kind. Card pages and directory tiles use
  "Read review" or "Compare" — never apply. We are not on the
  affiliate surface yet.
- Advertiser-disclosure ribbons at the top of pages.
- "ADVERTISEMENT" inline blocks.
- Sponsor-pinned tiles above the fold.
- Affiliate badges on a card that competes with the editorial verdict.
- Auto-playing video / interrupting modal newsletter capture.
- "CardMatch™"-style recommender quizzes (TPG has one; we don't
  serve that funnel).
- Pricing in USD as the primary currency. Always AED-first; USD only
  in parentheses on first mention if the audience is international.
- Italic display words. `em` in titles renders flat.
- Yellow / honey / gold accents in chrome. Gold is sunsetted from UI.
- Saturated cyan (#00aaff TPG-style). Our blue is link-only and
  desaturated.

## Voice constraint (affects design copy)

Display copy is **HfP-dry**, not TPG-commercial. Headlines lean
analytical (`UAE rewards rewarded.`, `What this card actually pays
out.`) not transactional (`Your life rewarded`). When you write
mockup copy, lean toward sceptical / evidence-led / specific. No
exclamation marks. Numbers always written numerically.

## Mobile rules

- Mobile-first — design 390px first, scale up.
- Continuous logo scale: 36px / 44px / 52px at <768 / 768-1023 /
  ≥1024.
- Container padding-inline: 16px / 24px / 32px at the same
  breakpoints.
- Tap targets ≥44px on mobile.
- Navigation drawer: full-screen overlay, slides from left
  (already implemented in src/components/Header.astro).

## What to produce when asked to design X

For a single component:
- One Artifact with the HTML + scoped `<style>` block using only
  the locked tokens and class names above.
- A 50–100 word rationale.
- A "what gets hard in production" note (e.g. "needs photography",
  "needs JS state for tabs", "needs a data field that doesn't
  exist yet — propose adding `cardArtUrl: z.string().url().optional()`
  to the L2 schema").

For a full page:
- A composition Artifact showing the section sequence with placeholder
  data.
- A section-by-section rationale.
- The implementation handoff format below.

## Implementation handoff format

When I'm satisfied with a design and want to ship it, I'll paste your
final Artifact into a Claude Code session. The handoff is cleaner if
your Artifact already follows our patterns. Specifically:

- Outer wrapper uses one of `.dp-band-navy / .dp-band-green /
  .dp-band-cool` or no band class for white sections.
- Section heading uses `.dp-article-eyebrow` + `<h2>`.
- Sub-components use existing `.dp-*` classes where possible.
- New component classes you introduce should follow `.dp-<name>`
  pattern (e.g. `.dp-feature-card-v2`).
- Inline styles only when necessary; prefer scoped `<style>` block.

The Claude Code engineer will then:
- Lift component CSS into `src/styles/global.css` if reusable, keep
  scoped if homepage-only.
- Replace placeholder data with real content-collection queries.
- Wire up routing and navigation.
- Add Astro / TypeScript / Zod-schema changes as needed.
- Run `npm run check && npm run build && npm test`.

## Reference materials

If you need to see the existing site state before designing:
- TPG redesign brief: `.council/research/2026-05/tpg-redesign-brief.md`
  (in the repo, but I can paste relevant sections on request)
- TPG dossier: `.council/research/2026-05/tpg-design-dossier.md`
- TPG live screenshots: I can paste them; they're the primary-source
  reference.
- Live site: https://dubaipoints.ae (production)

## Begin
```

---

## How to use this brief

1. Open a new chat at <https://claude.ai>.
2. Paste the entire block between the triple-backticks above as your
   first message. End with what you want designed, e.g.:

   > Begin. Design a new homepage feature card. Reference: TPG's
   > "Global stories of award travel, points + miles" featured story
   > on their mobile homepage — circular-masked image, white serif
   > headline on navy, "Guides" eyebrow, dateline + read time, arrow
   > CTA. Adapt for our voice (HfP-dry, AED-first) and our token
   > system. The image is a CSS placeholder for now — propose a
   > placeholder treatment that doesn't look like a placeholder.

3. Iterate on the Artifact until you're happy.
4. Either:
   - Paste the final Artifact's HTML into a Claude Code (this
     terminal) message, OR
   - Take a screenshot and paste it; I'll write the implementation
     from the image.

## When to update this brief

- When the palette, type, or `.dp-*` system meaningfully changes
- When new fenced rules emerge (e.g. when affiliate links land,
  the disclosure rules update; carry forward)
- When new component classes ship in `global.css` (add them to the
  Class system section so claude.ai uses them, not reinvents them)
