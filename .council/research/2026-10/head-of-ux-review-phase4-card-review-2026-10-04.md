---
title: Head of UX Stage 5.5 review — redesign Phase 4 (card-review template)
date: 2026-10-04
reviewer: head-of-ux sub-agent, against .claude/skills/web-design-guidelines and the trial memo
range: 682aeb6..09e41d0 (PR #426)
ux-status: pass-with-edits
---

# Disposition (session, 4 October 2026)

| Finding | Action |
|---|---|
| Fact-tile label contrast 4.48:1 | Tile surface is opaque `#fdfcf8`; labels 11 px. |
| Verified tile date format | `fmt()` house format, tile value at 15 px so "17 September 2026" fits a 130 px tile. |
| 0% FX renders "0.00%" | Renders "None". |
| JSON-LD BreadcrumbList ≠ visible trail | JSON-LD now Home → Cards → bank hub → card (bank step omitted when no hub). |
| 14 s drift on every card review | Card review uses a 4.5 s translate-only variant; homepage keeps 14 s with rationale in the brief. |
| `.dp-cr-tile` literal navy equal to the dark band pin | `--navy-pin` token for the dark pin; the tile sits one step darker. |
| `.crumb-link:focus` colour-only rule | Folded into `:focus-visible`. |
| `dt` 10 px | 11 px. |
| Verdict pill never passed a score (trial 1) | Open, Chairman. |
| `/5` vs `bestRating: 10` (trial 2) | Open, dormant until a score is passed. |

# Report, verbatim

Stage 5.5 code review — redesign Phase 4, card-review template. Read-only; nothing edited.

**Scope note.** The brief said "review ONLY the uncommitted diff", but the tree moved during the review: the Phase 4 set was committed as `a6a89a1` and a follow-up `09e41d0` (one line, `/mo` on its own line) landed on top; the working tree is now clean. The reviewed range is therefore `682aeb6..HEAD` for `/home/user/Property/src/layouts/CardReviewLayout.astro` and `/home/user/Property/src/styles/global.css`, verified against the live bytes at HEAD. Line numbers below are live-file lines.

## src/layouts/CardReviewLayout.astro

/home/user/Property/src/layouts/CardReviewLayout.astro:351 - Verified tile formats the date with `month: "short"` ("4 Oct 2026") while the byline at :371 and the sources footer use `fmt()` ("4 October 2026"); house rule is `2 March 2026` (01_editorial_standards §3:46). Three dates on one page in two formats. Use `fmt(lastVerified)` or get a ruling that tile chrome may abbreviate. [Standards]
/home/user/Property/src/layouts/CardReviewLayout.astro:292–299 vs :252–258 - Visible breadcrumb is now Cards → {category} → {bank}; the JSON-LD `BreadcrumbList` still emits Home → Cards → {cardName}. Pre-existing divergence, but the visible trail was rewritten here and the two should match. [Tech Lead]
/home/user/Property/src/layouts/CardReviewLayout.astro:349 - A 0% FX card renders "0.00%" under "FX markup" where the fee tile says "Free"; "None" (or "0%") reads faster. Copy call. [Standards]
/home/user/Property/src/layouts/CardReviewLayout.astro:303–316 - Verdict pill still never renders: `src/pages/cards/[slug].astro:92–121` passes neither `score` nor `verdictLabel`. Out of this diff's scope (trial finding 1, T3), but it is what fails kill-list #2 below. [Chairman]
/home/user/Property/src/layouts/CardReviewLayout.astro:307 - `/5` denominator vs `bestRating: 10` at :237 — dormant until a score is passed (trial finding 2, open). [Tech Lead]

Confirmed passes worth recording: `.sr-only` at :337/:347 is emitted by Tailwind 4 (present in `dist/_astro/BaseLayout.*.css`; the `.dpst .sr-only` rule at global.css:197 is not what it relies on). No inline `style=` remains. `/cards/` is a real route (honest-nav). `<dl>` with `<div>` wrappers is valid.

## src/styles/global.css

/home/user/Property/src/styles/global.css:3028, :3031, :3036–3037 - Fact-tile label contrast is borderline-fail. Surface is `rgba(253,252,248,0.96)` over `--navy` → ≈ `#f4f4f1`; label/`small`/`is-unverified` colour `#6b7178` gives **≈4.48:1** by WCAG arithmetic (`--muted` is "AA on paper" only because paper is `#fdfcf8`, 4.8:1). At 10px uppercase this is small text, so 4.5:1 applies; it sits in the same band in dark mode (band pinned `#16202c`). Fix: opaque `#fdfcf8` surface (literal, per the dark-mode comment) or `#56606b` (`--ink-soft` light value) for the labels. (a11y)
/home/user/Property/src/styles/global.css:2899–2904 + :3976 - `.dp-cr-hero::before` autoplays `dp-drift` for 14s with no pause/stop control. WCAG 2.2.2 applies to motion that *lasts* more than 5 s alongside other content, not only to loops — the comment at :3975 ("forbids an uncontrolled loop > 5 s") misstates the criterion. Inherited from `.hp-hero`, but this diff extends it from one page to every card review. Judgement call because the drift is a slow 12% translate of a soft gradient, arguably below perceptibility; if kept, shorten to ≤ 5 s (e.g. `4.5s ease-out 1 forwards`) or record the rationale in the brief. Reduced-motion gating is correct (inside the `no-preference` block). (motion)
/home/user/Property/src/styles/global.css:2956 - `.dp-cr-tile` gradient is literal `#16202c → #0f1f2e`. In the dark theme the hero band is pinned to `#16202c` (:3794–3800), so the tile's top edge is the band colour and the tile survives only on its 12% white border. Also kill-list #9 ("use the variables"). Suggest a `--navy-deep` token the dark band pin and the tile share, with the tile one step darker. (other)
/home/user/Property/src/styles/global.css:2993–2997 - `.crumb-link:focus` colour-only rule survives (trial 17). Now harmless — the `:focus-visible` gold ring at :2907 carries visibility — but it fires on mouse click too; fold into `:hover, :focus-visible`. (a11y, low)
/home/user/Property/src/styles/global.css:3031 - `dt` at 10px. No WCAG minimum, but on a mobile-first site this is the smallest text on the page apart from the tile `.b`; 11px (matching `.crumb`) costs nothing at 2×2. (other, nit)

Passes confirmed: :2907 `--gold-lift` `#d9a441` on `#1f3a4d` ≈ 5.3:1, and higher on the dark pin — closes trial 16. :3086 `top: 96px` clears the 80px + 1px-border header (`src/components/Header.astro:452–456`, :780–783). :2911–2914 `minmax(0, 1fr)` + `min-width: 0` fixes the clipped fourth tile; `.dp-cr-facts` and `.dp-cr-matchups ul` collapse intrinsically via auto-fit. :3103–3104 gap/min-width/overflow-wrap closes trial 20. :3110–3128 matchups have hover, weight cue, global focus ring. No new hue: `rgba(184,132,42)` = `--gold`, `rgba(143,179,204)` = `--navy-lift`.

## Kill-list at 390 × 844

Header 57px (56 + border). Band: pad 32 + crumb ~26 + H1 28px (2 lines) ~71 + welcome strap ~70 + facts 2×2 ~150 → facts bottom ≈ 406; + gap 24 + tile 346×0.63 = 218 → tile bottom ≈ 648; band ends ≈ 680. A 3-line H1 pushes that to ≈ 710. So the whole band, tile included, sits in the first viewport with ~130–160px of body (byline) beneath.

- Q1 what is this page — **pass** (crumb eyebrow + H1).
- Q2 who is it for — **pass** (Min salary tile, with "Invitation only" / "No minimum" / unverified states).
- Q3 verdict — **fail, cause outside this diff.** No `score`/`verdictLabel` is passed, so there is no verdict element on the band; the first verdict is the MDX `EditorVerdict`, well below the fold. The fact tiles are a stats strip (satisfies kill-list #3, visual anchor), not a verdict. When trial finding 1 is wired, the pill lands between H1 and strap, ≈ 190px from the top — comfortably in viewport. Until then the page is kill-list #2 open, as it was before Phase 4.
- Density: prose/visual ratio above the fold is fine (tile + 4 tiles + 1 strap). Two primary links only. Crumb links name their destinations. No horizontal scroll at 360 (content 316px → 2-col facts 261px; tile 199px tall).

## Trial cross-check (`.council/research/2026-10/web-design-guidelines-trial-card-review-2026-10-04.md`)

| # | Status | Evidence |
|---|---|---|
| 3 | closed | `<nav aria-label="Breadcrumb"><ol>` :292–299; "Cards" linked to `/cards/` |
| 4 | **resolved, no ruling needed** | Chip, network mark and card face removed; `.dp-cr-tile` is an `aria-hidden` navy tile with three text facts (:284–288, css :2956–2975). It does not depict a product, so the 2026-07-29 documentation line is not engaged. One residual card cue: the 1.586:1 aspect ratio — note it in the brief, no ruling required |
| 5 | closed | aside headings `<h2>` :406, :441 |
| 6 | closed | `<dl class="dp-spec-rows">` :408–415 |
| 7 | closed | `aria-hidden` dash + `.sr-only` "not yet verified" :337, :347 (utility verified in built CSS) |
| 8 | closed | `formatAED(minSalary)` :342 |
| 9 | closed | `aria-hidden="true"` on `.mark` :445 |
| 10 | closed | no `style=` in file; `.dp-cr-byline`, `.dp-spec-list` |
| 12 | closed | `.dp-cr-matchups*` :3110–3128 |
| 16 | closed | gold `:focus-visible` ring :2907 |
| 17 | partially closed | ring fixed by :2907; colour-only `:focus` rule still at :2993–2997 (harmless leftover) |
| 18 | closed | `top: 96px` :3086; header 80px confirmed |
| 19 | **resolved, no ruling needed** | all `[data-bank]` tints deleted; tile uses `#16202c`/`#0f1f2e` (navy family, same hex the dark theme uses for navy bands) + `--gold-lift`. No third hue. Tokenising the hex is the one follow-up (finding above) |
| 20 | closed | `.dp-spec-row` gap 12px, `.k/.v` min-width 0 + overflow-wrap :3100–3104 |
| 1, 2 | open | out of scope; 1 is the kill-list #2 cause |
| 11 | closed | byline "Verified {date} against issuer T&Cs" :371 |

The commit message's "Closes trial findings 3, 4, 5–10, 12, 16–20" holds, with 17 as partial.

**ux-status: pass-with-edits.** Two edits before this is clean: the fact-tile label contrast (4.48:1 → make the surface opaque or darken the label) and the date format on the Verified tile. The 14-second drift wants either a ≤ 5 s duration or a one-line rationale in the brief. The buried verdict is pre-existing and T3.

Totals: 10 findings (3 a11y, 1 motion, 6 other)
