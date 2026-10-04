# Web design guidelines: trial run on the card-review template

**Date:** 4 October 2026
**Checklist:** `.claude/skills/web-design-guidelines/SKILL.md` (first run)
**Reviewer:** Head of UX sub-agent, read-only
**Scope:** `src/layouts/CardReviewLayout.astro`, `src/components/cards/HeroImage.astro`,
`src/components/StockImage.astro`, card-review rules in `src/styles/global.css`

This trial checked whether the checklist finds real defects in this codebase.
Nothing was fixed here. The fixes are follow-up work at their own tiers.

**Verified against source by the main session:** findings 1, 12, 16 and 18 below.
The rest are the sub-agent's findings and have not yet been checked independently.

## Findings

### src/layouts/CardReviewLayout.astro

1. `:311` The verdict pill (score, verdict label, "Last verified") never renders.
   `src/pages/cards/[slug].astro` passes neither `score` nor `verdictLabel`, so the
   verdict sits below JumpToSection, AtAGlance and GreatCardIf at 390px
   (UX kill-list #2, buried verdict). *Verified.*
2. `:315` The score renders as "/5" while the JSON-LD at `:237` declares
   `bestRating: 10`. Dormant until a score is passed. [Tech Lead]
3. `:296` The breadcrumb is a bare `<div>`. Use `<nav aria-label="Breadcrumb">` with
   an `<ol>`. The "Cards" segment is not linked.
4. `:284` A div-built fake card face (chip, bank name, network mark) is the hero
   fallback on every review without a photo. [Chairman]
5. `:387`, `:412`, `:445` The aside headings are `<h3>` after the body's `<h2>`
   sections, so the outline nests them under the wrong section.
6. `:388`–`:418` Spec key/value rows are `<div>`/`<span>` pairs. Use
   `<dl>`/`<dt>`/`<dd>`.
7. `:395`, `:404` A needs-review value renders a bare "—", so a screen reader
   hears "dash". Add visually hidden text such as "not yet verified".
8. `:398` `AED ${minSalary.toLocaleString()}` has no locale and no non-breaking
   space. Use `formatAED`, as `:388` already does.
9. `:449` The decorative "+" marker has no `aria-hidden="true"`.
10. `:346`, `:348`, `:448`, `:449` Inline `style` attributes. Move them to `.dp-*`
    classes.
11. `:352` "Filed {date}" shows `lastVerified`, not a filing date. [Standards]
12. `:471` `.dp-cr-matchups` has no CSS anywhere in `src/`. *Verified.*

### src/components/cards/HeroImage.astro

13. `:93` The credit line drops to 9px italic below 720px. That is too small for a
    credit that licensing requires. No card sets `heroImage` today, so this
    component is not rendered.

### src/components/StockImage.astro

14. `:127` The AI/editorial label is laid over the photograph. The checklist puts
    captions below the image. The labelling requirement in the 2026-07-29
    amendment is met either way.
15. `:145` The scrim uses pure black and the label uses `#fff`. Use tokens instead.

### src/styles/global.css

16. `:134` The global focus ring is `var(--green)` (`#1f3a4d`) and `.dp-cr-hero` is
    `var(--navy)` (`#1f3a4d`), so focus on the hero crumb link is invisible in the
    light theme. *Verified.*
17. `:3037` `.crumb-link:focus` only changes the colour slightly, which does not
    replace the ring. It also uses `:focus`, not `:focus-visible`.
18. `:3109` The sticky aside uses `top: 32px` under an 80px sticky header at
    1024px and up, so the aside's top scrolls under the header. *Verified (32px).*
19. `:3004`–`:3022` Per-issuer tints on the card mock (red, orange, teal, green) are
    hues outside the navy and gold families. Check them against the no-third-hue
    rule and the R1 ruling. [Chairman]
20. `:3124` `.dp-spec-row` has no `gap`, `min-width: 0` or `overflow-wrap`, so long
    values can collide at 320–360px.

**Totals:** 20 findings. The sub-agent's hand-back said 19, but it listed 20.

## Read on the checklist

It is useful. The trial found two defects that are visible to every reader and
that the 6 September audit's rendered probes did not catch: the unstyled matchups
section and the invisible focus ring on the hero. It also found a structural
defect, the verdict pill that never renders. The house overrides worked as
intended. Nothing was proposed in Tailwind or a new hue, and the copy and palette
findings were routed to their owners.

## Suggested follow-ups (not in this PR)

- **T2 (UX + Standards + Section editor + Chairman):** findings 3, 5–9, 12, 16–18,
  20 (accessibility and layout fixes in the card-review template).
- **T3:** finding 1, the decision to wire `score` / `verdictLabel`. The first
  published card score is precedent-setting under the 2026-05-25 amendment.
- **Chairman ruling:** findings 4 and 19 (the fake card face and issuer tints
  against the 2026-07-25 and 2026-07-29 amendments).
