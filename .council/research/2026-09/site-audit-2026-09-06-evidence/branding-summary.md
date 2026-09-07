# Live branding audit — dubaipoints.ae (Firecrawl `branding` format)

Scraped 2026-09-06, `onlyMainContent=false`, 1 credit per page (4 total). All four
returned HTTP 200, `colorScheme: light`, `theme-color` meta `#1f3a4d` on every page,
same logo / favicon (`/logo-mark.svg`) and OG image (`/og-default.png`).

| slug | path | JSON |
|---|---|---|
| `root` | `/` | `root.json` |
| `cards__adcb-365-cashback` | `/cards/adcb-365-cashback/` | `cards__adcb-365-cashback.json` |
| `guides__best-premium-cards-2026` | `/guides/best-premium-cards-2026/` | `guides__best-premium-cards-2026.json` |
| `salary-transfer` | `/salary-transfer/` | `salary-transfer.json` |

Allowed families per Charter (2026-07-25 no-third-hue rule): navy `#1f3a4d / #15293a /
#0f1f2e / #8fb3cc`, gold `#b8842a / #f3ead6`, neutrals. Anything else needs a Chairman ruling.

Method note: Firecrawl's extractor samples hexes from the loaded stylesheet plus
sampled elements, not from a full render. Because `global.css` ships to every page,
a colour can be attributed to a page on which no element actually paints it. Each
off-family hex below was therefore traced back to its rule in the repo.

---

## 1. Colours — side by side

| slot | `/` | `/cards/adcb-365-cashback/` | `/guides/best-premium-cards-2026/` | `/salary-transfer/` |
|---|---|---|---|---|
| primary | **`#8FD3B3`** | `#1F3A4D` | `#1F3A4D` | `#1F3A4D` |
| secondary | `#241C0A` | `#16202C` | `#16202C` | `#16202C` |
| accent | **`#235F46`** | **`#8FD3B3`** | **`#8FD3B3`** | `#1F3A4D` |
| link | **`#235F46`** | **`#8FD3B3`** | **`#8FD3B3`** | `#566A77` |
| background | `#FBFAF6` | `#FBFAF6` | `#FBFAF6` | `#FBFAF6` |
| textPrimary | `#1F2328` | `#1F2328` | `#1F2328` | `#1F2328` |
| extractor confidence (colors) | 0.95 | 0.90 | 0.90 | 0.90 |

Bold = outside the two permitted accent families.

### Classification of every extracted hex

| hex | family | where it comes from in the repo | verdict |
|---|---|---|---|
| `#1F3A4D` | navy | `--green` / `--navy` / `--dpst-navy` (`src/styles/global.css:35,54,142`) | on-charter |
| `#16202C` | navy (very dark) | dark-theme surfaces: `src/components/Header.astro:708` (`.dp-header-subscribe` dark bg), `global.css:1502,3717`, `src/pages/deals/index.astro:570` | on-charter; a **dark-theme** value surfaced from global CSS on a light-scheme scrape |
| `#566A77` | navy (tinted) | not literal anywhere; equals `--dpst-navy-soft` `rgba(31,58,77,.75)` composited on `--dpst-cream #faf6ef` (→ `#566976`, ±1/channel) | on-charter (navy at 75 % alpha) |
| `#1F2328` | neutral | `--ink` (`global.css:39`) | on-charter |
| `#FBFAF6` / `#FDFCF8` / `#DAD6CD` / `#6B7178` | neutral | `--bg` / `--paper` / `--line` / `--muted` (`global.css:29,30,44,41`) | on-charter |
| `#241C0A` | neutral (warm near-black) | `src/pages/index.astro:999-1019` — `.hp-news-eyebrow`, `.hp-news .micro a`; comment: chosen because "solid #241c0a measures 5.1:1" on gold `#b8842a` | on-charter as a contrast neutral for gold; homepage-only, which matches its root-only detection |
| **`#8FD3B3`** | **mint green — third hue** | `global.css:292` `.dpst-table thead th.sorted .sort-ind { color: #8fd3b3 }` and `:431` `.dpst-foot a:hover { border-bottom-color: #8fd3b3 }` | **off-charter** — see §4 |
| **`#235F46`** | **dark green — third hue** | `global.css:324` `.dpst-badge.cash { color: #235f46 }` | **off-charter** — see §4 |

Gold (`#b8842a` / `#f3ead6`) was **not ranked in any slot on any of the four pages**. The
extractor only has six slots, so this is not proof gold is absent from the render, but
it does say the secondary trust accent has low DOM coverage on these four surfaces.

---

## 2. Fonts

Identical on all four pages: **Fraunces** (heading, `["Fraunces","serif"]`) and
**DM Sans** (body, `["DM Sans","system-ui","sans-serif"]`). Matches the Charter type rule.

| | `/` | card review | guide | salary-transfer |
|---|---|---|---|---|
| paragraph stack | DM Sans | DM Sans | **Fraunces, serif** | DM Sans |
| h1 | 72px | 42px | 48px | 56px |
| h2 | 40px | **11px** | 34px | **56px** |
| body (sampled) | 17px | 14px | **22px** | 14px |

Worth a look (low-confidence — the extractor samples one element per role):

- **Guide page**: paragraph stack reads as Fraunces at 22px. Charter puts Fraunces on
  headlines / eyebrows / "Our take" only, with DM Sans body (lede 21px, prose 19px). Most
  likely the sampler hit a lede or `.dp-take` paragraph rather than running prose, but if
  `.dp-prose p` is actually serif on guides that is a Standards/UX item.
- **Card review**: h2 sampled at 11px. That is eyebrow styling on an `<h2>` element
  (uppercase kicker), which is a heading-semantics smell rather than a colour issue.
- **Salary-transfer**: h1 and h2 both 56px — a display-size h2, probably the tracker's
  headline stat.

---

## 3. Button styles

| | `/` · card · guide (identical) | `/salary-transfer/` |
|---|---|---|
| **primary** | bg `#1F2328` (`--ink`), text `#FFFFFF`, radius **999px pill**, no shadow — the header "Join brief" subscribe pill (`.dp-header-subscribe`, hover → `--green`) | bg `#1F3A4D` navy, border `#1F3A4D`, text `#FFFFFF`, radius **8px**, no shadow — the tracker's "Reward value ↓" sort control (`.dpst` island) |
| **secondary** | bg `#FDFCF8` (`--paper`), text `#6B7178` (`--muted`), border `#DAD6CD` (`--line`), 999px pill — this is the header **search field** ("Search cards, guides…"), classified as a button by the extractor | bg `#1F2328`, text `#FFFFFF`, 999px pill — the "Join brief" pill, demoted to secondary |
| border radius (spacing block) | 8px, base unit 4 | 8px, base unit 4 |

Observations:

- Site chrome is consistent across the three editorial pages: ink pill CTA + paper pill
  search. Neither uses a navy fill; the navy arrives only on hover.
- The salary-transfer page is the one surface where a **navy-filled, 8px-radius** control
  is prominent enough to out-rank the site CTA. Two button geometries (999px pill vs 8px)
  coexist on that page — island idiom vs site idiom. The `.dpst` block's own comment says it
  "mirrors the homepage card-spot/deal-card visual language", which the radius does not.

---

## 4. Off-family colours — the finding

Two hexes outside navy / gold / neutral were extracted, and both are **real** in the
shipped stylesheet, not extractor noise:

| hex | rule | what it paints |
|---|---|---|
| `#8FD3B3` (mint) | `global.css:292` | sorted-column indicator in the Salary Transfer Tracker table header |
| `#8FD3B3` (mint) | `global.css:431` | link-hover underline in the tracker footer |
| `#235F46` (dark green) | `global.css:324` | text colour of the tracker's `cash` badge |

All three live inside the `.dpst` scoped block (Salary Transfer Tracker Preact island,
`src/components/islands/SalaryTransferTracker.tsx`; `dpst` appears in no other component).
That block also declares its own third palette — `--dpst-green #2f7d5d`, `--dpst-teal
#54a37e`, `--dpst-ochre #c08a2e`, badge inks `#8a6217` / `#2f6b4f`, and `--dpst-far
#4f6e60` / `--dpst-soon #8f5f18` / `--dpst-urgent #b4513a` — with the comment "green/teal/
ochre + far/soon/urgent are functional signal colours. Not global."

Two things follow:

1. **Attribution vs rendering.** The extractor pinned mint/green on `/`, the card review
   and the guide — pages that do **not** mount the tracker — because `global.css` is
   loaded everywhere. On those three pages the colours are in the CSS but not painted.
   Ironically, on `/salary-transfer/`, where they *are* painted, the extractor ranked navy
   instead. So the per-page colour table overstates the spread, but the underlying hexes
   are live on the salary-transfer surface.
2. **Charter exposure.** The "functional signal colours" defence is reasonable for the
   badge semantics (cash / voucher / cashback / points need to be told apart) and for
   far/soon/urgent expiry states, which parallel the Chairman-scoped `--positive` /
   `--negative` / `--red` tokens. It is weaker for `#8fd3b3`, which paints a **sort
   indicator and a link-hover underline** — chrome, not signal — and for a hard-coded
   `#235f46` in place of a token. The 2026-07-25 ruling replaced a teal (`#7dd3c0`) in the
   dark theme for exactly this reason; the light-theme tracker carries the same class of
   colour with no ruling on record in `CLAUDE.md`. Note also that `#8fd3b3` is visually
   adjacent to the sanctioned dark-navy `#8fb3cc` (two hex pairs swapped) — easy to wave
   through at a glance, but it is a mint, not a navy.

### Related, not surfaced by the extractor (stylesheet check only)

- `--mint: #5fb88a` (green) is still the **light-theme** value (`global.css:56`), with five
  `var(--mint)` consumers (`.dp-callout-tip` border + chips). The 25 July fix set dark-mode
  `--mint` to `#8fb3cc` but left light mode green.
- `--link: #1a5fc6` (electric blue) remains defined with 10 `var(--link)` consumers and one
  `var(--link-deep)`. The extractor never ranked it as `link` on any page — links resolve
  through `--green` in practice (`.dp-prose a:hover { color: var(--green) }`) — so the blue
  is latent in the token sheet rather than visible on these four pages. `var(--brand)`
  has zero consumers.
- `--positive #2f6a4f` / `--negative #b54a2c` / `--red #c8412d` are Chairman-scoped
  (2026-05-20 comment block) and sanctioned; listed only for completeness.

---

## 5. What is consistent (for the record)

- Navy `#1f3a4d` is primary on 3/4 pages and `theme-color` on 4/4.
- Warm-paper neutrals (`--bg`, `--paper`, `--line`, `--muted`, `--ink`) identical on 4/4.
- Fraunces / DM Sans on 4/4; no stray font family.
- Logo, favicon, OG image, brand name identical on 4/4; extractor logo confidence 0.95 each.
- 4px base unit, 8px component radius, no shadows on 4/4.

## 6. Suggested follow-ups (not actioned here)

1. **T2 — `.dpst` chrome colours.** Replace `#8fd3b3` (sort indicator, footer hover) and
   `#235f46` with navy/gold-family tokens, or take the tracker's signal palette to the
   Chairman for an explicit ruling and log it under `## Amendments`. Owner: Head of UX +
   business-realestate editor.
2. **T2 — light-theme `--mint`.** Decide whether `#5fb88a` gets the same navy treatment the
   dark theme received on 25 July.
3. **Verify, don't assume:** confirm on a workstation render whether `.dp-prose p` on the
   guide template is serif; the 22px Fraunces paragraph sample is the only hint.
