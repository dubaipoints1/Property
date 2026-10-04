---
slug: redesign-ledger-editorial
tier: T3
owner: technical-lead
section: site-wide
opened: 2026-10-04
chairman-status: approved
chairman-direction: "1. A mix" / "Ok go" — Chairman in-session, 4 October 2026
---

# Redesign: Ledger with editorial headlines (direction A+B)

## Decision

The Chairman picked a mix of the 4 October direction mockups
(https://claude.ai/artifact/19V2Vx7JQdgeT4y7WZAYuR, board "A+B") and said
"go". The direction:

- **Structure from A (Ledger):** navy hero band, white fee tiles with
  tabular numerals, hairline tables, gold primary buttons.
- **Headlines from B (Broadsheet):** a serif display (Newsreader) for the
  wordmark, H1/H2 and card names; a clean sans (Geist) for UI and figures.
- **Palette:** unchanged — navy and gold families (2026-07-25 rule holds).
- **Motion:** "like the cool ones on 21st.dev" — rebuilt in house CSS and a
  small vanilla module, never pasted React.

Authority: CLAUDE.md Amendments 2026-10-04 (look open to redesign; the
current idiom stays in force until each phase ships).

## Phases — each its own PR

1. **Motion layer** — shipped first (this brief's opening PR): hero
   entrance, scroll reveal, number ticker, cursor spotlight, tile lift, CTA
   shine. Reduced-motion safe, visible without JS.
2. **Typography** — shipped 4 October ("Do all"): `--font-display`
   (Newsreader) / `--font-ui` (Geist) tokens; 336 literals in 53 files
   replaced; the Google Fonts link and the SVG cover updated.
3. **Homepage** — first six items shipped 4 October: navy hero band with a
   drifting gold/navy light, gold shimmer CTA, hover previews on the
   strategy rows, Editor's picks carousel (L3 `tier` editors-pick/strong,
   L2 figures), outlined footer wordmark, mobile-menu stagger. Remaining:
   S3–S8 restyle to the A+B board.
   **Motion audit, 4 October** (`.council/research/2026-10/motion-audit-
   2026-10-04.md`, `design-motion-principles` AUDIT mode): 15 findings, all
   applied the same day — reveal made opt-in (`data-reveal`) so no prose
   section is ever hidden, batch stagger, transform-driven spotlight, hover
   sweep and mobile-menu stagger removed, backdrop blur removed, one easing
   token pair. The homepage hero's 14 s drift is kept against the audit's
   letter: it is a 12% translate of a soft gradient that plays once, below
   the level at which it reads as movement, on the one surface the skill
   preamble licenses for showpiece motion. Card reviews get a 4.5 s variant.
4. **Card review template** — shipped 4 October: ledger tile replaces the
   CSS card-face mock and its per-issuer tints (trial findings 4 and 19,
   resolved on the house palette rather than by ruling); breadcrumb nav;
   four fact tiles on the band (annual fee, min salary, FX, verified);
   aside as `<dl>` rows under `h2`s; perks without inline styles;
   matchups styled; sticky offset 96px; gold focus ring. Trial findings 3,
   5–10, 12, 16–20 closed. Open: finding 1 (the score/verdict pill is
   still never passed a score; precedent-setting, Chairman) and 11/13–15
   (byline wording done; HeroImage credit size, StockImage label
   placement and scrim colour untouched).
   **Head of UX Stage 5.5, 4 October** (`.council/research/2026-10/head-of-
   ux-review-phase4-card-review-2026-10-04.md`): pass-with-edits; the edits
   (opaque tile surface for label contrast, house date format, "None" for
   0% FX, JSON-LD breadcrumb aligned to the visible trail, `--navy-pin`)
   shipped in the follow-up the same day. Trial finding 1 (the verdict pill
   is never passed a score) remains the one open kill-list item: Chairman.
5. **Directories, guides, news** — template by template.

## Guardrails

- §6: no invented figures in any component or demo; every number from L2.
- 2026-07-25: AI/21st output is reference only; rebuilt in `.dp-*` + tokens.
- Each phase passes `npm run check`, `npm test`, `npm run build`, the
  `web-design-guidelines` review and a rendered probe at 390 and 1280 px.
- Honest-nav, slugs, anchors and nav labels unchanged unless ruled.

## Council

T3. Chairman direction recorded above. Head of UX, Standards Editor,
Technical Lead and SEO Strategist review each phase PR; Fact-Checker
only where a phase touches figures.
