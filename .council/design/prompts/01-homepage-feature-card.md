# Prompt 01 — Homepage feature card

_The first design ask in the queue. Paste-ready for claude.ai._

## How to use this

**Step 1.** Open <https://claude.ai>, start a new chat (Sonnet 4.6
or Opus 4.7 — whichever your Max plan exposes).

**Step 2.** Open `.council/design/system-brief-for-claude-ai.md` and
copy the block between the two `---` rules (the prompt starts with
`You are designing UI for...` and ends with `## Begin`). Paste it as
your **first** message. Hit send. claude.ai will acknowledge.

**Step 3.** Attach the TPG mobile screenshot showing their "Global
stories of award travel, points + miles" featured story (the dark-
navy card with the circular-masked Stockholm photo). You took this
in our session; if you can't find it, navigate to thepointsguy.com
on mobile and screenshot the section.

**Step 4.** Paste the block below as your **second** message
(immediately after attaching the screenshot). Hit send.

**Step 5.** Iterate. When the Artifact looks right, take a clean
screenshot OR copy the Artifact's HTML source. Bring either back to
this Claude Code session. I'll implement on a focused PR.

---

## Paste this as your second message in claude.ai

```
Begin. Design the homepage feature card (.dp-feature-card).

REFERENCE
Attached: TPG mobile screenshot of their "Global stories of award
travel, points + miles" featured story. Note the structure — dark
navy card, circular-masked photo top, eyebrow above headline, white
heavy serif headline, dateline + read time, arrow CTA. Adapt this
pattern for our voice and our token system.

CURRENT STATE I WANT TO IMPROVE
Today this card is rendered with a CSS-gradient circular mask in
place of a photo (because we don't have licensed photography yet).
The current implementation is at src/pages/index.astro and uses the
.dp-feature-card class defined in src/styles/global.css. The
placeholder reads as "image missing" rather than "intentional
typographic placeholder". I want this fixed.

PRODUCE TWO ARTIFACT VARIANTS

Variant A — Photography-light (priority).
The card renders without a real photo. Design a placeholder
treatment that looks intentional even when every feature card on
the site uses the same placeholder style for months. Allowed
materials: typographic marks (a stylised wordmark, a numeral, a
glyph), geometric shapes (circles, lines, wave patterns), gradients
within the locked palette, decorative SVG patterns. The card must
work at 390px (mobile) and 1024px (desktop). The eyebrow / headline
/ meta / arrow remain.

Variant B — Photography-licensed.
Same card structure, but assume we license a 16:9 photograph and
render it inside the circular mask. Show the cropping behaviour,
how the mask shape interacts with image content, and how the photo
degrades on small screens. Use a placeholder Unsplash image (any
travel/skyline photo from Unsplash works for the mockup; use
unsplash.com/photos/[id] in an <img> src so it's clear what's
expected).

PLACEHOLDER COPY (use this verbatim in both variants)
Eyebrow:    Editor's read
Title:      What FAB's salary-transfer programme actually pays
            out, by salary band
Date:       8 May 2026
Read time:  9 min read
Href:       /guides/fab-salary-transfer-by-band/
Arrow CTA:  → (visual only; the whole card is the link)

Stick to this exact copy — it's HfP-dry, AED-specific, evidence-
led, and tests the headline-line-length wrap behaviour. Do not
substitute a TPG-style title.

ACCEPTANCE CRITERIA
1. Outer wrapper uses --navy background (or wraps in
   .dp-band-navy if the card is the section).
2. All colours come from the locked palette (--navy / --navy-deep
   / --green / white / rgba(white, X)).
3. Headline is Fraunces 700 at clamp(22px, 3.6vw, 30px), letter-
   spacing -0.6px, line-height 1.18.
4. Eyebrow is DM Sans 700 caps, 11px / 2.5px tracking, --green.
5. Meta line uses rgba(255,255,255,0.72), 13px DM Sans 400.
6. Arrow CTA is a 38x38 white circle, ink-coloured arrow,
   self-aligned bottom-left or bottom-right (designer's call).
   On hover, translateX(4px) is the existing convention.
7. Internal padding 28px on mobile, 40px from 768px+.
8. Border-radius 12px on the card.
9. Variant A's placeholder is *visually distinct* from a missing-
   image placeholder. If you put a single circle in the middle, it
   reads broken. If you build a small composition (overlapping
   shapes, a typographic mark, a wave pattern), it reads
   intentional.
10. Variant B handles the case where the photo is too dark or too
    busy by darkening / overlaying the mask edge.

WHAT YOU MUST NOT DESIGN
- An "Apply now" CTA. The arrow CTA is a "read more" gesture, not
  an apply gesture.
- A subscriber / advertiser disclosure ribbon attached to this card.
- Yellow / honey / gold accents anywhere in the card. --gold is
  sunsetted from UI.
- Saturated cyan. Our blue is link-only and desaturated (--link
  #1a5fc6).

OUTPUT FORMAT

For each variant, an Artifact containing:
- A complete, viewable HTML page with a single .dp-feature-card
  rendered at the centre of the viewport.
- All CSS in a scoped <style> block at the top of the artifact (NOT
  inline on elements). Use only the locked tokens — declare them
  in :root at the top of the style block so the artifact is
  self-contained.
- The placeholder copy verbatim.

After both Artifacts:
1. RATIONALE (100–150 words). What did you choose for the placeholder
   treatment in A and why does it not read as broken? What's the
   smallest production change to swap A → B?
2. WHAT GETS HARD IN PRODUCTION (50–100 words). Photography licensing
   from FAB / ENBD; image format; Cloudflare image cache; responsive
   image sizing; the card is also rendered in a list view on
   /guides/ — does the design carry?

Begin with Variant A. After I respond, do Variant B.
```

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

## When this prompt becomes stale

- If the locked palette / type scale / class system changes in
  `system-brief-for-claude-ai.md`, regenerate this prompt by re-pulling
  values from there.
- If the placeholder copy needs updating (the FAB salary-transfer
  guide gets retired or the headline tests poorly), swap it out.
- If photography licensing lands, retire Variant A — Variant B becomes
  the default and you don't need this prompt anymore for new feature
  cards.
