# Council agenda — next convening

This file holds the queue of pending agenda items between formal council
sessions. Each item has an owner, a tier, and a deliverable. The
Managing Editor curates this file weekly and the Chairman ratifies the
agenda at the start of each session.

## Current queue

### A1 — Site-wide menu / link audit

**Tier**: T2 (chrome / IA / navigation review)
**Owners (joint)**: Head of UX + SEO Strategist + Managing Editor
**Brief from Chairman**: > "Go through link by link and understand the
content. Does it make sense for what is the menu? What is it
achieving?"

**Deliverable**: a single file at `.council/audits/2026-05-link-audit.md`
that walks **every link in the site's chrome** and rates it on three
dimensions:

1. **Clarity** — does the label tell the reader where it goes? (UX
   kill-list rule 4: "mystery navigation")
2. **Content** — is there published content behind it, or is it a
   placeholder? Empty destinations are a worse problem than ambiguous
   labels.
3. **Purpose** — what reader job does this link do? If the answer is
   "none specific" — should it be in the chrome at all?

**Surfaces in scope**:

- **Header**:
  - Wordmark link (home)
  - Desktop primary nav: Cards, Banks, Airlines, Guides, Deals, News
  - **Cards mega-menu** — 4 panels × ~6 links each = ~25 links
    (best by type, by issuer, co-branded, learn)
  - **Airlines mega-menu** — Points + Miles panel: 4 groups × ~5
    links = ~20 links (UAE bank programmes, airline programmes,
    hotel programmes, learn)
  - Hamburger overlay (mobile): 6 flat rows + 3 expandable
    sections + tools block + publication block. ≥45 links.
  - Tracker strip: live-tracker pulse link + rotating headlines
    (3 hard-coded headlines).
  - Search icon → `/search/`.
  - Subscribe CTA → `/newsletter/`.

- **Footer**: 5 columns × ~7 links each = ~35 links
  - Salary transfer band landings
  - Bank programmes (auto-rendered from `banks` collection)
  - Airline programmes (auto-rendered from `programs` collection)
  - Site (cards / compare / valuations / guides / expat / best-of
    / topics / search / RSS)
  - Trust (about / editorial-policy / how-we-make-money /
    partnership / corrections / team / glossary / press / tip /
    contact)

- **Homepage**: hero quick-nav tiles, featured cards, latest feed,
  cards spotlight pills, newsletter band CTAs.

**Deliverable structure** (mandatory format):

```
## Header — desktop nav
| Label | Goes to | Clarity (1-5) | Content (live/thin/empty) | Purpose verdict | Recommendation |

## Header — Cards mega-menu (4 panels × N links)
[same table]

## Header — Airlines mega-menu (4 panels × N links)
[same table]

## Header — Mobile overlay
[same table]

## Footer — column 1 (Salary transfer)
[same table]
[…repeat per footer column…]

## Homepage chrome
[same table]

## Aggregate findings
- Mystery navigation count
- Empty-destination count
- Duplicate-label count (same label appearing in multiple places with different destinations)
- "Cut these" recommendations
- "Add these" recommendations

## Standards Editor cross-check
[Voice / kill-list compliance per surface]
```

**Process**: Head of UX walks the site at 360 / 768 / 1280 with the
audit doc open. SEO Strategist reviews the IA against UAE search
intent (do the links match how readers search?). Managing Editor
files the deliverable and routes implementation tickets to section
editors.

**Why now (T2 priority)**: as the site has grown over 32 PRs, the
header and footer link inventory has accumulated organically. The
operator has flagged that some destinations don't have content
behind them yet (e.g. `/best-of/` "Coming next quarter" tiles, mobile
overlay's `Travel` panel pointing to `/airlines/` for sub-themes
that don't exist). Pruning before the editorial sprint avoids
broken-promise links being indexed.

---

### A2 — Firecrawl bank-scraping target list

**Tier**: T2
**Owners**: Head of Research + Technical Lead
**Status**: **delivered** at `.council/research/2026-05/firecrawl-bank-urls.md`.
19 banks inventoried. 5-bank Q3 target (FAB + ENBD + Mashreq + ADCB +
ADIB). Editor-typed coverage recommended for 6 hard-to-scrape banks
(HSBC, Citi, SCB, Liv., Mashreq Neo, Wio).

Next action (Tech Lead): refactor `_normaliser.ts` to be CSS-selector-
configured (so 19 banks don't need 19 scraper modules).

---

### A3 — Solidity sprint backlog (open)

| ID | Item | Tier | Owner |
|---|---|---|---|
| SP2 | `.dp-verdict-tag` + `.dp-elig-row` patterns from UX audit | T2 | Head of UX |
| SP3 | `.dp-cr-mock` polish (bank-glyph + Verified stamp) | T2 | Head of UX |
| SP4 | Byline-strip avatar upgrade (gradient portrait placeholder) | T2 | Head of UX |
| SP5 | Footer bank-logo audit | T2 | Tech Lead |
| SP6 | Image conventions (`public/cover/<slug>.png` fallback) | T2 | Tech Lead |

---

### A4 — Operator instrumentation (deferred)

Per the 2026-05-09 strategy session, this is M1 work the operator
deferred while the solidity sprint runs. When ready:

- Replace `REPLACE_WITH_CLOUDFLARE_WEB_ANALYTICS_TOKEN` in BaseLayout.
- Verify Search Console + submit sitemap.
- Snapshot T+0 dashboard at `.council/growth/dashboard.md`.

A short `OPERATOR.md` will be written with the 10-minute checklist
when the operator signals they're ready.

---

## Curating this file

- The Managing Editor adds new items at the bottom under the next
  available `A<n>` heading.
- When an item is delivered, mark it **delivered** with a link to
  the artifact rather than removing it.
- The Chairman ratifies the agenda at the start of each formal
  council convening; ratified items move to a session record.
