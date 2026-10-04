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
2. **Typography** — Fraunces → Newsreader, DM Sans → Geist. The font names
   are literal strings in ~41 files; the swap should introduce
   `--font-display` / `--font-ui` tokens so the next change is one line.
   Held: a bulk in-place rewrite across 41 files needs the Chairman's go
   for that method (the session's permission layer blocked it).
3. **Homepage** — rebuild S1–S8 to the A+B board.
4. **Card review template** — A+B treatment plus trial findings 3, 5–9,
   12, 16–18, 20 (`.council/research/2026-10/web-design-guidelines-trial-
   card-review-2026-10-04.md`).
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
