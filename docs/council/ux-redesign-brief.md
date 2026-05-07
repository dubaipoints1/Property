# UX redesign brief — dubaipoints.ae

A council spike. Three directions on the table; one recommendation. Brand
identity (palette, type pairing, tone, idiom) is open. The owner picks a
direction; a follow-up commit aligns `BRAND_NOTES.md`,
`SITE_ARCHITECTURE.md`, `EDITORIAL.md`, and `global.css`.

---

## What is actually broken vs what is working

The `.dp-*` system in `src/styles/global.css` is *mostly fine*. It is a
coherent editorial idiom — type, callouts, stat strips, pros/cons,
directory tiles — and it is the one place on the site where the
visual language reads as a publication and not a Tailwind starter. The
salary tracker styling, the article shell, the directory grid: keep
them. Any redesign that throws all of this out is throwing out the only
thing that currently signals "this is a publication."

The pain is not in the system; it is in three places where the system is
*not applied*, plus one wider strategic question.

1. **The homepage is not in the system.** `src/pages/index.astro` is 668
   lines, ~427 of which are scoped CSS that re-invents tiles, eyebrows,
   bylines, and stat blocks instead of reaching for `.dp-dir-tile`,
   `.dp-article-eyebrow`, `.dp-byline`, `.dp-stats`. Seven sections
   compete for attention above the fold on desktop. The `<em>dirham</em>`
   italic in the hero, the gold byline chip, the dark `card-spot.visual`
   pretending to be a card photo, the gradient pin on the latest-feature
   image — these are small set pieces that each ask the reader to learn
   one more visual rule. There is no quiet on this page.

2. **`ArticleLayout.astro` runs a different visual grammar.** It uses
   Tailwind `prose prose-slate`, slate borders, and slate text utilities
   for the editorial header — exactly the pattern `EDITORIAL.md` and
   `CLAUDE.md` forbid in long-form pages. Meanwhile
   `CardReviewLayout.astro` uses `.dp-article-head` correctly. Two
   competing editorial headers ship in the same site.

3. **Two real CSS bugs, separately from the brand question.** Logo
   discontinuity at the 1024px breakpoint (32px → 54px in one step) is
   jarring. The deal rail at `index.astro:163-177` keeps a negative
   `margin-inline: -16px` after the layout switches from
   `grid-auto-flow: column` to a 4-up grid at ≥1024px, so the rail
   bleeds 16px into the gutter on desktop. Both are paper cuts but they
   are exactly what a returning desktop visitor notices first.

4. **Identity is generic-publication.** Electric blue plus warm cream is
   pleasant, but it is the same palette as a dozen fintech blogs.
   Nothing on the homepage signals UAE specifically — no climate, no
   architecture, no Khaleeji editorial cue. The differentiator is the
   *content* (AED-first, eligibility-first, salary-transfer-aware) but
   the chrome reads as generic.

What the redesign needs to do: keep the `.dp-*` system, fix the
homepage, kill the layout duplication, and decide whether to push the
identity harder toward UAE-distinctive or further toward newspaper-quiet.

---

## Direction A — *Khaleej Mono*

A UAE-distinctive editorial publication that leans into desert-light
neutrals and a single warm accent. Palette is the brand work; type is
the trust work.

- **Palette (semantic roles).**
  - `#f4efe6` *paper* — warm bone, replaces today's `--bg #fbfaf6`
  - `#16161a` *ink* — near-black with a graphite tint, replaces `#15171c`
  - `#b56b1f` *sun* — burnt-amber primary accent, replaces electric blue
  - `#0f3a3a` *teal-deep* — secondary trust accent (Verified chip,
    "Our take" border)
  - `#cf4a2b` *signal* — live indicators, "Ends" expiry stamps
- **Type pair.** GT Sectra (or fall back to Fraunces) for headlines and
  eyebrows; Söhne (fall back to DM Sans) for body and UI. Same families
  the site already loads — Fraunces + DM Sans — but used at heavier
  weights (600 headlines instead of 400/500) and tighter tracking.
- **Editorial tone shift.** From HfP-dry-British toward *Monocle-on-the-
  ground*. Still skeptical, still evidence-led, but the dateline matters
  ("Filed: Dubai Marina, Tuesday 7 May") and the voice acknowledges
  geography ("AECB rule changes", "DIFC vs onshore residency"). Less
  "this card is bad," more "this card is bad if you live in JLT and
  earn salary in AED."
- **Homepage IA — collapsed from 7 sections to 4.**
  1. Masthead band + dateline (replaces hero) — wordmark,
     today's date, three lead stories in a typographic stack, no images
  2. *Today's verdicts* — deal rail and card-of-the-week, side by side
     on desktop, stacked on mobile
  3. *The brief* — single-column run of Latest News + Recent Posts +
     Salary tracker preview, interleaved chronologically
  4. *Evergreen + Newsletter* — guides grid above a quiet newsletter band
- **Card review template.** Keep `CardReviewLayout.astro`. Replace
  `dp-article-eyebrow` blue with `--sun` amber. Replace the byline
  avatar gradient with a flat circle in `--teal-deep`. The `.dp-take`
  callout uses `--teal-deep` border on `--paper` background; gold goes
  away as a UI colour entirely (it is too close to the new sun accent).
- **Mobile rules.** Logo height becomes 36px on mobile, 44px on tablet,
  52px on desktop — no single-step jump. Hero collapses to masthead +
  dateline + three headlines (no images, no big italic display type).
  Sticky bottom CTA on long-form pages: "Subscribe / Verify".
- **Worst-case downside.** Burnt amber on warm bone reads
  *Middle-East-tourism-brochure* if photography is bad. We have no
  photography budget at launch. The palette only works if every figure,
  every chart, every diagram is rendered in the system; one stock photo
  of a Dubai skyline at sunset sinks the whole identity. Gold-to-sun is
  also the biggest doc-churn change.

---

## Direction B — *Quiet Ledger*

Push *further* in the direction `EDITORIAL.md` already wants — newspaper-
quiet, near-monochrome, accent only on Verified and Live. The opposite
move from A: less identity in the chrome, more identity in the
typography.

- **Palette (semantic roles).**
  - `#ffffff` *paper* — pure white, replaces `--bg #fbfaf6`
  - `#0d1117` *ink* — near-black
  - `#5a6068` *ink-soft* — for meta and supporting copy
  - `#c8412d` *signal* — kept from current; only used for live, expiry,
    and "needs verification" warnings
  - `#2a6bd1` *link* — slightly desaturated electric blue, *only* on
    interactive text (link, focus ring). Never on backgrounds, never on
    eyebrows, never on display type.
- **Type pair.** Fraunces stays, but only for headlines. Eyebrows and
  "Our take" labels move to DM Sans 700 caps with 2.5px tracking — no
  serif eyebrows, no italic display words. DM Sans body. The "italic +
  gold display word" pattern is killed entirely.
- **Editorial tone shift.** Current HfP-dry stays the baseline; B
  *amplifies* the dryness. No exclamation marks anywhere on the site.
  Numbers are always written numerically. Pull-quotes are replaced with
  pull-numbers (the AED figure). The Friday recap becomes a single
  paragraph + dated bullets, not a magazine-style spread.
- **Homepage IA — collapsed to 4.**
  1. Dateline + 5-story typographic index (no hero, no images)
  2. *Live: salary transfer + deals rail* — combined into one
     two-column module; the rail and the tracker share a header
  3. *Latest analysis* — single-column reverse-chronological feed
  4. *Newsletter + RSS-by-band* — quiet card with both options visible
- **Card review template.** Same `dp-article-head`, but eyebrow goes
  black (uppercase DM Sans). The `.dp-take` callout becomes a
  hairline-bordered block on white with a "Our take" label in red caps.
  Pros/cons drop their green/red top borders and use `+` and `−` glyphs
  instead.
- **Mobile rules.** Same continuous logo scale (36/44/52). No bottom
  CTA bar; relies on header drawer entirely.
- **Worst-case downside.** It is *very* easy for Quiet Ledger to read
  unfinished — readers may experience the absence of accent colour as a
  bug, not a choice. Without a strong photography or chart-maker
  practice (which we do not have), the homepage looks like a parked
  domain on first paint. This direction *requires* a strong masthead
  wordmark which we have not actually designed (the current one is the
  text wordmark from the launch logo file).

---

## Direction C — *Currency*

A magazine-y direction that leans into the points-and-miles category by
treating numbers as the visual hero. Less type-driven than A or B; more
data-visual.

- **Palette.** Current electric blue stays, paired with off-white
  `#f8f7f2`, near-black ink, and a mint `#1f9d6e` for "value found"
  callouts (replacing the current desaturated green). Gold goes away.
- **Type pair.** Display type switches to *GT Super* (or Fraunces as
  fallback) at 700 weight — heavier than today. Body in Inter (or DM
  Sans fallback). Numerals use OpenType tabular figures everywhere on
  the site so AED columns line up.
- **Editorial tone.** HfP-dry stays. New convention: every card and
  every offer ships with a "Value: AED X / year" headline number,
  rendered in display type at 56–72px. The number *is* the headline; the
  prose is supporting evidence.
- **Homepage IA — 5 sections.** Hero becomes a single AED-figure
  scoreboard ("This week's best value: AED 4,200 / year — FAB Cashback
  Visa"). Then deals, then card-grid, then evergreen, then newsletter.
- **Card review.** `.dp-stats` becomes the hero, not a strip below the
  title. Title and stats swap visual weight.
- **Worst-case downside.** Numerical hero only works if the underlying
  data (annual value, redemption ceiling, salary-transfer payout) is
  *credible*. We do not yet have an AED valuation methodology shipped —
  per `EDITORIAL.md`, that's a Q3 2026 artifact. Putting numbers in
  display type before the methodology is published is a credibility
  trap.

---

## Recommendation — *Direction B, Quiet Ledger*

**Pick Quiet Ledger.** Three reasons.

1. It is closest to what `EDITORIAL.md` already says the site wants
   ("HfP-dry, evidence-led, one idiom") and the smallest doc-churn move.
   `BRAND_NOTES.md` §2 keeps electric blue; B retains it as a link
   colour. `EDITORIAL.md` §"Visual standard" stays valid except for the
   gold-italic eyebrow rule, which is the single line that goes stale.
2. It directly addresses the three pain points without inventing a
   fourth: homepage collapses to 4, layout duplication dies because
   `ArticleLayout.astro` would be re-skinned to use `.dp-article-head`
   like `CardReviewLayout` already does, and the deal-rail bug becomes
   irrelevant when the rail merges with the tracker module.
3. It is the only direction that does not require new visual assets we
   do not have. A needs sun-warm illustrations or photography to look
   intentional. C needs validated AED valuations. B needs nothing we
   are not already producing.

**Trade-offs / what gets harder.**

- **Owner satisfaction risk.** The owner said they are "unhappy with
  the current design." Quiet Ledger is *more restrained* than today,
  not less. If the owner's dissatisfaction is "this looks too plain,"
  B is wrong; if it is "this looks unfinished and inconsistent," B is
  exactly right. Open question 1 below.
- **Doc churn.** `BRAND_NOTES.md` §3 (tone) is unchanged. §2 (colour)
  needs a one-line addition: "blue is interactive only — never an
  accent on display type or eyebrows." `EDITORIAL.md` §"Visual
  standard" needs the gold-italic eyebrow rule struck and an "italic
  display words are removed" line added. `SITE_ARCHITECTURE.md` §4 is
  rewritten to a 4-section homepage. `global.css` keeps `.dp-*` but
  retunes `--brand-soft`, kills the gold-italic eyebrow rule on
  `.dp-article-eyebrow`, and changes `.dp-take` to a white background
  with red label.
- **Regression risk on existing pages.** Card review pages are largely
  unchanged. Bank hubs and airline programmes use the same `.dp-*`
  shell so they inherit the changes for free. The ~6 places that
  hardcode `gold` (verified chip, "Our take" border, affiliate
  asterisk, byline, valuations status block, methodology row hover)
  all need to be re-themed by hand — call it a half-day audit pass.
- **Long-form pages with `prose prose-slate`.** `ArticleLayout.astro`
  needs to be rewritten to mirror `CardReviewLayout.astro`'s
  `dp-article-head` + `dp-prose` structure. This is the layout-
  duplication fix and it is the same work regardless of which
  direction we pick — B just makes it most obviously aligned.

---

## Editorial tone treatment

The current `EDITORIAL.md` baseline is HfP-dry-British. All three
directions keep this; they shift it differently.

- **Direction A (Khaleej Mono)** adds *place*. Datelines, district
  names, salary-band specificity in the lede ("for an AED 18k salary
  earner in JLT, this card pays out AED X over 12 months"). Tone
  becomes correspondent-on-assignment.
- **Direction B (Quiet Ledger)** *amplifies* the dryness — no
  exclamation marks, no italic emphasis, numbers always numerical,
  pull-numbers replace pull-quotes. Voice becomes ledger-sober. The
  Friday recap shrinks to a paragraph plus bullets.
- **Direction C (Currency)** keeps the dry voice but lets the *number*
  be the loud thing. Headlines are AED figures; prose is quiet around
  them. Risk: looks like an affiliate site if the numbers aren't
  validated.

The recommendation (B) is the smallest tone shift — current
`EDITORIAL.md` §3 stays, just with two specific stylistic rules added
(no `!`, no italic emphasis on display type).

---

## Stale-doc list (if Quiet Ledger is adopted)

- `BRAND_NOTES.md` §2 — append "blue is interactive only" rule;
  recommendation (Option C) stands.
- `BRAND_NOTES.md` §3 — unchanged.
- `EDITORIAL.md` §"Visual standard" — strike "italic + `--gold` on
  emphasised words" from the headline rule. Strike "(or `--red` for
  live indicators)" from the eyebrow rule and re-state as
  "eyebrows: black caps, never accented; red reserved for live and
  expiry only."
- `SITE_ARCHITECTURE.md` §4 — rewrite to a 4-section homepage; merge
  the deals rail with the salary-transfer preview; remove the "New to
  the UAE? band" as a standalone section (link from the masthead
  index instead).
- `SITE_ARCHITECTURE.md` §5.3 — already incorrect about the header
  drawer (it claims none exists; one does); take this opportunity to
  fix it.
- `global.css` — retune `--brand-soft`; remove gold from
  `.dp-article-eyebrow`, `.dp-take`, `.dp-byline-avatar` (move to
  ink); rewrite `.dp-take` to white background with red label.
- `src/layouts/ArticleLayout.astro` — rewrite to `.dp-article-head` +
  `.dp-prose`, dropping `prose prose-slate`.
- `src/pages/index.astro` — full rewrite against the 4-section spec.
- `src/components/Header.astro` — adjust desktop logo to 52px (from
  54px) for continuous scale; no other change.
- `CONTENT_ROADMAP.md` — unchanged; the IA shift does not move
  cornerstone priorities.
- `PLAN.md` — unchanged.

The proof at `/design-spike/` renders Quiet Ledger so the owner can
sit with it before any of the above is committed.
