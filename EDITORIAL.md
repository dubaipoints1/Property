# Editorial cadence and process

Companion to `PLAN.md`, `BRAND_NOTES.md`, and `SITE_ARCHITECTURE.md`. This
file is the operating doc for what we publish, when, and how.

## Weekly cadence

A solo-operator publication needs a cadence template that is sustainable,
covers every vertical at least once a fortnight, and forces evergreen
authority work onto the calendar.

| Day | Slot | Output |
|---|---|---|
| Mon | Bank / salary transfer | One news post or offer update |
| Tue | Deal / lifestyle | One deal post or merchant promo update |
| Wed | Card or airline programme | One review, refresh, or sweet-spot piece |
| Thu | Lifestyle deal roundup or news | One post, light editorial |
| **Fri** | **Weekly recap** | "This week on DubaiPoints" — one short post linking the week's items + the newsletter / WhatsApp send |

Saturdays and Sundays — no scheduled publishing; reserved for planning,
verification refreshes, and quarterly artifacts (valuations etc).

## Friday recap

Every Friday, publish a short "This week on DubaiPoints" post under the
`/guides/` collection (or a dedicated `/weekly/` collection in a later
phase). Format:

- Title: `This week on DubaiPoints — [Month] [Day], [Year]`
- 4–6 bullet points, one per published item that week
- One "Verdict of the week" — the single recommendation we'd give a
  reader who only has time to read one thing
- One "Heads-up" — the thing landing next week worth knowing about
- Cross-posted as the week's newsletter send (Buttondown) and WhatsApp
  broadcast

The recap surfaces in the homepage **"This week on DubaiPoints"** band
automatically because it's an entry in the `guides` collection (sorted by
`updatedAt`). When `/weekly/` becomes its own content collection, the
homepage band switches to read from it.

## Quarterly artifacts

- **AED Valuations** — first formal sampling Q3 2026, then quarterly on
  the first Friday of January, April, July, October. Methodology page:
  `/valuations/methodology/`. Data module: `src/lib/valuations.ts`.
- **Card lineup refresh** — every quarter, sweep all live card MDX for
  rate / fee / welcome-bonus drift; refresh `lastVerified`.
- **Salary-transfer offer scrape** — weekly via Firecrawl scraper (see
  `PLAN.md` Phase 2).

## Verification rhythm

- Card MDX older than 90 days flagged as "Needs verification" in the UI
  via the existing `lastVerified` field.
- Salary-transfer offers re-checked on each Buttondown send.
- AECB / DFSA / UAE Central Bank rule changes monitored continuously;
  affected guide pages flagged for refresh within 7 days.

## Visual standard

**One idiom across the site.** Audit Session 02 (commits c1e9cac, 66d0418,
074d770) consolidated the previous two-idiom split. The single editorial
language is:

- **Type.** Fraunces (serif) for headlines, eyebrows, "Our take" labels,
  and section heads. DM Sans for body, meta, and UI.
- **Palette.** CSS custom properties only — `--ink`, `--ink-soft`,
  `--paper`, `--bg`, `--line`, `--brand`, `--brand-deep`, `--brand-soft`,
  `--gold`, `--gold-soft`, `--red`, `--green`, `--muted`. No Tailwind
  slate utilities in layouts or long-form pages.
- **Two-accent system.** `--green` (`#2d6a52`, deep editorial green)
  is the **primary accent**: section eyebrows, italic title accents,
  hover states, link-hover, focus rings, primary CTAs, directory tile
  hover borders, "+" bullet markers, kicker copy, and the byline
  avatar gradient. (Ratified by Chairman 2026-05-09; supersedes the
  earlier electric-blue `--brand` token, which remains as a fallback
  alias only.)
  `--gold` (`#b8842a`) is the secondary trust-signal accent: the
  Verified chip on bylines, the "Our take" callout border + soft
  background, the affiliate-link asterisk (`*`), the bank-callout
  block on bank hub pages, the "Indicative — pre-sampling" status
  block on the valuations page, and the methodology-link hover on
  valuation rows. Each colour does one job; never mix them in the
  same UI element.
- **Radius.** 4px on chips and inputs, 6px on callouts and small cards,
  8px on article cards and tables. No `rounded-full` pills.
- **Eyebrows.** 11px / 700 / 2.5px letter-spacing / uppercase / `--gold`
  (or `--red` for live indicators).
- **Headlines.** Fraunces 500, `clamp(28px, 5vw, 44px)`, balanced text
  wrap, italic + `--gold` on emphasised words.
- **Tap targets.** ≥44px on every clickable element. ≥36px on filter
  chips.
- **Tables.** `.dp-data-table` for stat tables, `.dp-compare-table` for
  side-by-side comparisons. Both have hairline borders and uppercase
  letter-spaced headers.

**Reference components in `src/styles/global.css`:**

| Pattern | Class | Used by |
|---|---|---|
| Article wrapper | `.dp-article` (+ `.is-wide`) | Card review, guide, comparison, bank hub, airline programme, salary-transfer slug, valuations |
| Article header | `.dp-article-head` + `.dp-article-eyebrow` + `.dp-article-title` + `.dp-article-lede` + `.dp-article-meta` | Every long-form page |
| Stat strip | `.dp-stats` + `.dp-stat` | Card review |
| Editor's verdict | `.dp-take` | Card review (when `editorTake` set) |
| Pros / Cons | `.dp-proscons` + `.dp-proscons-block` | Card review (when `pros` or `cons` set) |
| Section head | `.dp-article-section` | Long-form sections inside any article |
| Data table | `.dp-data-table` | Card earn rates, salary-transfer bands |
| Bullet list | `.dp-bullet-list` | Perks, requirements |
| Article footer | `.dp-article-foot` | Sources / verification / customer-service blocks |
| MDX prose | `.dp-prose` | Every `<slot />` rendering MDX |
| TOC rail | `.dp-article-grid` + `.dp-toc` | Guide layout |
| Directory grid | `.dp-dir-grid` + `.dp-dir-tile` | Index pages (cards, banks, airlines, guides) |
| Directory pills | `.dp-dir-pills` + `.dp-dir-pill` (`.is-feature` for gold) | Filter rails on index pages |
| Tracker (Preact) | `.dp-tracker-*` | SalaryTransferTracker island |

**When adding a new long-form page:** start from `BaseLayout` with
`fullWidth`, wrap in `<article class="dp-article">`, use the article
patterns above. Do not introduce Tailwind slate utilities.

**When adding a new directory page:** wrap in `<article class="dp-article
is-wide">`, then `<div class="dp-dir-grid">` with `<a class="dp-dir-tile">`
children. Pills at the top use `.dp-dir-pills`.

## Channels

- **Site** — primary, all evergreen content lives here.
- **Newsletter (Buttondown)** — Friday recap + tagged segment sends to
  AED-band subscribers when an offer drops for their band.
- **WhatsApp broadcast** — same Friday recap, abbreviated, link to site.
  Trial scale: free WhatsApp Business broadcast list; upgrade to a paid
  API tier (Twilio or 360dialog) past 256 subscribers.
- **RSS** — site-wide and per-AED-band, generated at build time (see
  `BRAND_NOTES.md` §7).

---

## Amendments

### 2026-05-08 — Quiet Ledger direction adopted

**Authority:** Chairman pick on `/council` session output.
**Brief:** `.council/research/2026-05/ux-redesign-brief.md`.
**Status file:** `.council/STATUS.md`.

The §"Visual standard" rules below are amended as follows. The
original rules remain in the file as historical context; where the
amendment supersedes a clause, the amendment wins.

- **Palette.** White paper (`--bg #ffffff`), near-black ink
  (`--ink #0d1117`), softened grey (`--ink-soft #5a6068`), hairline
  rule (`--line #e3e3e1`). Red `--red #c8412d` is reserved for live
  indicators, expiry stamps, and the "Our take" label only.
- **Two-accent system — sunsetted.** The brand-blue + gold pairing
  collapses to a single interactive colour. `--brand #2a6bd1` is
  link-only (link text, link hover, focus ring). `--gold` and
  `--gold-soft` retire from UI usage; their bindings remain defined
  for backward compatibility but no new rule reaches for them.
- **Eyebrows — strike old rule, replace with:** 11px / 700 / 2.5px
  letter-spacing / uppercase / `--ink` (black caps, never accented).
  `.is-red` modifier is reserved for live and expiry indicators
  only.
- **Headlines — strike old rule, replace with:** Fraunces 600,
  `clamp(28px, 5vw, 44px)`, balanced text wrap. **Italic display
  words are removed.** No `em` element inside `.dp-article-title`
  renders italic or in an accent colour. `font-style: normal`,
  `color: inherit`, `font-weight: inherit`.
- **"Our take" — replace.** Hairline-bordered (1px `--ink`) block on
  white paper background, red label (`--red`) in 11px caps, body
  copy in Fraunces 500. Replaces the prior gold-on-cream callout.
- **Pros / Cons — replace.** Drop the green/red top borders. Pros
  list items prefix with `+`; cons list items prefix with `−` (U+2212
  minus sign). Glyphs in `--ink`, no colour coding.
- **Byline avatar — replace.** Flat `--ink` circle with white
  initials. Replaces the prior `var(--brand) → var(--brand-deep)`
  gradient.
- **Verified chip — replace.** `--paper` background, 1px `--ink`
  border, 4px radius, ink text. Replaces the gold-soft / brown-text
  pill.
- **Continuous logo scale.** 36px (mobile, <768px), 44px
  (768–1023px), 52px (≥1024px). No single-step jump at any
  breakpoint.

**Tone amplifications (per Quiet Ledger §"Editorial tone").**

- No exclamation marks anywhere on the site (excludes quoted source
  material).
- Numbers in body copy are always written numerically (`30,000
  Skywards Miles`, never `thirty thousand`).
- Pull-quotes are replaced with pull-numbers — typically the AED
  figure that anchors the piece.
- The Friday recap is one paragraph plus dated bullets, not a
  magazine-style spread.

**Other rules unchanged.** Type pairing (Fraunces + DM Sans), tap
targets, table classes, eyebrow size, and reference-component
mappings carry forward as written.
