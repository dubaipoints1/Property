# UX redesign brief — TPG-adapted direction (supersedes Quiet Ledger)

A council spike, second pass. The Chairman has overridden the
2026-05-08 adoption of *Quiet Ledger* (Direction B from
`ux-redesign-brief.md`) and now wants the site to look like
**thepointsguy.com (TPG)**. This brief takes the dossier at
`tpg-design-dossier.md` and proposes a single locked-in spec the
Chairman can sign off on.

PRs **#23 (homepage, merged)** and **#24 (trust pages, merged)** were
shipped under Quiet Ledger. They are visually superseded by this
direction and will be re-themed in the implementation pass below.

---

## CHAIRMAN LOCK-IN — 2026-05-08-bis

The three blocking questions resolved on 2026-05-08-bis. The brief
below remains valid as the working spec; this section is the
authoritative locked record. Where the dossier (recall-based) and
the screenshots (primary-source) disagree, **the screenshots win**.

### Q1 — Source verification

**Resolved by primary-source screenshots** in lieu of a Firecrawl
pass (TPG WebFetch was 403'd by their bot detection; Firecrawl is
configured for our weekly bank scraper but not loaded in this
session). Eight mobile screenshots verified the live site at
2026-05-08 13:52–13:53 local. Dossier corrections:

| Field | Recall said | Screenshots show | Action |
|---|---|---|---|
| Yellow / honey accent | `#f7c948`-ish "legacy" | **Not present.** Emerald green is the live accent. | **Drop yellow/gold from the spec.** Legacy artifact; TPG migrated. DP does NOT re-introduce gold. |
| Cyan accent | `#00aaff`-ish saturated | **Not present** in mobile homepage. | Drop cyan from the spec. |
| Category eyebrow accent | Cyan | **Emerald green** `~#0c8463`–`#117f5a` (consistent across category labels, footer headings, "OUR COMMITMENT TO TRANSPARENCY") | Adopt emerald as the universal eyebrow accent |
| Hero | "Photographic, image-dominant" | **Typographic.** "Your life rewarded" sits on white with no image. Image used in *Featured story* card only. | **Correct the dossier** — TPG's homepage hero is typographic. Adopt verbatim. |
| Section backgrounds | Single tone | **Five-tone rotation**: white / cool grey `~#f4f5f7` (valuations) / deep navy `~#0a2540` (Featured story, "Explore favourite cards", "Points 101", footer) / emerald `~#1d6b54` (newsletter band) / warm cream `~#f8f0e0` (CardMatch — DP skips) | Adopt the rotation; cream is optional |
| Display type weight | 600–800 | **700–800**, very large (60–80px hero) | Confirmed; bump our Fraunces from 500/600 to 700 |
| Body type | Sans | Sans (Graphik or similar) | Confirmed; DM Sans stays as our equivalent |
| Filter UI | Not described | **Two patterns**: (a) outlined-pill row on navy band ("BEST / TRAVEL / AIRLINE / REWARDS / BUSINESS / HOTEL / CASH BACK"), (b) underline-tab row ("The latest / Credit cards / Loyalty programs" with green underline on active) | Adopt both for our IA |
| Valuation strip | Not described | Heavy bold-serif **right-aligned number** + brand-mark left + name; one row per programme | Adopt for `/valuations/` |
| Numerical hero | Not described | "2.05¢", "2.20¢" — ~80px serif 700 right-aligned | Adopt the pull-number pattern (this was Quiet Ledger Direction C — vindicated) |
| Footer | Recalled as deep navy | Confirmed. Dark navy with **green** eyebrow headings ("MEET TPG", "LEGAL"), white wordmark, social-icon row, newsletter capture, "OUR COMMITMENT TO TRANSPARENCY" disclosure block | Adopt; DP's transparency block reads differently (see Q3) |

### Q2 — Card-art licensing

**Placeholder until permission lands.** DP does not yet have
explicit permission from FAB or ENBD to render their card art.
Implementation uses a **typographic placeholder card** — a styled
rectangle with bank-mark + tier name + network — rendered in the
same dimensions as a real card image (1.586:1 aspect ratio,
ISO/IEC 7810 ID-1 ratio).

Card data layer gains an optional `cardArtUrl` field that defaults
to the placeholder generator. Permission landing → URL config
swap, no other change.

### Q3 — Voice question — "review blog hack kind of vibe"

**Resolved decisively against TPG's transactional energy.** Chairman
verbatim: *"Ours is a review blog hack kind of vibe not apply now.
We haven't reached affiliate or partners. In future maybe."*

Implementation consequences:

- **No "Apply now" CTAs anywhere on the site.** Card review pages,
  card directory tiles, side rails, comparison tables — all
  surface a **"Read review"** or **"Compare"** CTA, never apply.
- **No "Try CardMatch™"-style recommender quiz.** TPG's CardMatch
  funnels to apply; we don't have that surface.
- **No advertiser-disclosure ribbon** at the top of pages.
- **No "ADVERTISEMENT" inline blocks** in editorial.
- **No "OUR COMMITMENT TO TRANSPARENCY" footer block** with the
  affiliate-compensation disclaimer. DP's equivalent footer block
  reads *"How we make money"* and *"Editorial policy"* — both
  already exist as routes; the footer just links them, no inline
  long-form disclaimer.
- **Sponsor / commercial fence stays.** When DP eventually adds
  affiliate links, the inline asterisk + the `/how-we-make-money/`
  page are the disclosure mechanism. TPG-style ribbons are not
  adopted.
- **Verdict copy retains HfP-dry voice.** Visual chrome borrows
  TPG; editorial voice does not.

### Locked palette (CSS custom properties)

```css
/* TPG-adapted Quiet Ledger v2 — locked 2026-05-08-bis */
:root {
  /* Surfaces */
  --bg:        #ffffff;          /* default page surface */
  --paper:     #ffffff;          /* cards, callouts on white */
  --cool:      #f4f5f7;          /* valuations strip section */
  --navy:      #0a2540;          /* primary dark identity */
  --navy-deep: #06182d;          /* footer (slightly darker) */
  --green:     #0c8463;          /* category eyebrows + hover accents */
  --green-band:#1d6b54;          /* newsletter band background */
  --cream:     #f8f0e0;          /* optional warm section, low priority */

  /* Type */
  --ink:       #0a2540;          /* body text on white (was #0d1117) */
  --ink-soft:  #5a6068;          /* meta, secondary copy */
  --muted:     #8a8f9a;          /* dates, byline timestamps */

  /* Lines + chrome */
  --line:      #e3e3e1;
  --line-soft: #f1f1ef;

  /* Interactive */
  --link:      #1a5fc6;          /* link / focus / "Read review" pill */
  --link-deep: #154fa3;          /* link hover */

  /* Signal */
  --red:       #c8412d;          /* live, expiry, "Needs reverify" */

  /* Legacy — defined for backward compat, NOT used in new UI */
  --gold:      #b8842a;
  --gold-soft: #f3ead6;
  --brand:     #2a6bd1;          /* old interactive blue, replaced by --link */
}
```

### Locked typography

- **Display (Fraunces serif):** weight 700, letter-spacing -1.4px on
  hero (60–80px), -1.1px on H1 (44–56px), -0.6px on H2 (28–36px).
  Bump from Quiet Ledger's 500/600. If a heavier display serif
  ships later (Tiempos / Publico if licensed), the scale carries
  over.
- **Body (DM Sans sans):** 16px on body (was 15px), 17px in
  `.dp-prose` long-form, 14px on meta, 11px on caps eyebrows.
- **Eyebrows:** 11px / 700 / 2.5px tracking / uppercase / `--green`
  (was `--ink` in QL, was `--brand` in pre-QL).

### Locked component additions

These ship as new `.dp-*` classes in the chunks that consume them:

- `.dp-band-navy` — navy section wrapper, white text inside
- `.dp-band-green` — emerald section wrapper (newsletter)
- `.dp-band-cool` — cool grey section wrapper (valuations)
- `.dp-feature-card` — Featured story card (navy bg, circular-mask
  image or typographic placeholder, white serif headline, eyebrow,
  meta, arrow CTA)
- `.dp-card-tile` — card directory tile (placeholder card art top,
  bank/name, "Read review" pill, no Apply)
- `.dp-filter-pills` — outlined oval pills on navy band
- `.dp-tabs` — underline tabs (green underline on active, sans caps)
- `.dp-valuation-row` — icon left + name + heavy serif number right
- `.dp-points-101` — educational dark-navy band with video / illustration

### Implementation order — locked

1. **Chunk 1 — `global.css` token retune.** Palette tokens, type
   weights, body size, eyebrow colour. Cascades to every existing
   `.dp-*` component. *(Branch: `claude/tpg-pivot`, this PR.)*
2. **Chunk 2 — Homepage rebuild.** Typographic hero / feature card /
   feed (with tabs) / favourite cards (with filter pills) / valuation
   strip / newsletter band / footer retheme. Supersedes PR #23.
3. **Chunk 3 — Card review template.** `CardReviewLayout` gains
   navy hero band, placeholder card-art, "Read review" CTA pattern,
   green eyebrow.
4. **Chunk 4 — Directory pages.** Card-tile grid, filter pills.
5. **Chunk 5 — Trust pages.** Already on `.dp-article` shell;
   inherit chunk 1 + minor adjustments. Supersedes PR #24.
6. **Chunk 6 — Salary-transfer pages.**
7. **Chunk 7 — Valuations pages.** Adopt the `.dp-valuation-row`
   pattern with AED-per-mile values when our valuation methodology
   ships.

### Doc-churn list — locked

- `BRAND_NOTES.md` §2 — append amendment recording the move from
  Quiet Ledger's "interactive blue only" to TPG-adapted four-token
  system (navy / emerald / link blue / red).
- `EDITORIAL.md` §"Visual standard" — append amendment with new
  type weights, body size, eyebrow colour `--ink → --green`.
- `SITE_ARCHITECTURE.md` §4 — Quiet Ledger's 4-section homepage is
  replaced by TPG's pattern: hero / Featured story / feed /
  favourite cards / valuations / Points 101 / newsletter / footer.
- `CLAUDE.md` Part I — palette table updated; non-negotiables stay
  verbatim.
- `.council/04_content_taxonomy.md` — unchanged.

### Editorial fence — re-stated

The TPG visual pivot does NOT touch the Charter's editorial non-
negotiables. These remain in force regardless:

- AED-first pricing on every page
- No advertorial-driven recommendations at launch
- Affiliate disclosure inline above the fold (when affiliates land)
- Chairman publish gate
- Firecrawl exclusive to Head of Research
- LLM-extraction policy — `editorTake` only; typed numerics via
  deterministic regex
- HfP-dry voice in prose

If a chunk's implementation conflicts with any of the above, the
Charter wins and the chunk amends.

---

**Source-confidence caveat.** The TPG dossier is recall-based (see
`tpg-design-dossier.md` §"Source-access status"); WebFetch was 403'd
on every TPG URL attempted and on archive.org. Lock-in should not
happen until a Firecrawl pass re-verifies the palette hex codes and
font-family declarations. Every recommendation below carries that
caveat.

---

## What's actually in TPG vs what's actually in DP today

| Dimension | TPG (recalled) | DP today (Quiet Ledger, post PR #23/#24) |
|---|---|---|
| **Surface** | White, occasional cool-grey section bands `#f5f7fa` | Pure white `#ffffff` (`--bg`) |
| **Primary identity** | Deep navy `#0a2540`-ish header + cyan-blue `#00aaff`-ish accent | Near-black ink `#0d1117` + interactive-only desaturated blue `#2a6bd1` |
| **Accents** | Yellow / honey `#f7c948`-ish (legacy), green for "Excellent" rating, advertorial cream ribbon | Red `#c8412d` for live / signal only; gold `#b8842a` retained as variable but removed from UI |
| **Display type** | Heavy serif (Tiempos / Publico), 600–800 weight, 36–48px hero | Fraunces serif, 400–500 weight, restrained sizes |
| **Body type** | Graphik / Inter sans, ~17–18px | DM Sans sans, 15px |
| **Eyebrows** | Sans caps, often coloured cyan | Sans caps, black, never coloured |
| **Hero** | Photographic, 16:9, image-dominant | Typographic, dateline-led, image-light |
| **Card directory tile** | Card-art image + 3-stat strip + "Apply Now" cyan CTA + star rating + "Best for X" | Text tile (`.dp-dir-tile`), eyebrow + title + meta strip, no card-art, no CTA |
| **Card review hero** | Top-page disclosure ribbon, scorecard with numeric rating, card-art image, "Apply Now" CTA | `.dp-article-head` + `.dp-stats` strip, no rating, no Apply Now, "Verified" chip |
| **Side rail** | Sticky right rail with Featured Cards + ads (≥1024px) | None |
| **Affiliate disclosure** | Page-top cream ribbon + inline note + asterisks throughout | Footnote-only inline asterisk, gold; no top ribbon |
| **Newsletter** | Full-width photographic band + (suspected) interrupting modal | Quiet inline band, no modal |
| **Photography** | Heavy — 8–12 images above second scroll | None — typographic |
| **Internal-link density** | High — 30–60 per long review | Moderate — 10–20 per long review |
| **Homepage section count** | 7–8 (hero, featured cards, latest, categories, newsletter, etc.) | 4 (Quiet Ledger collapse) |
| **Sponsor placement** | Pinned above the fold (separate from editorial picks but adjacent) | None — editorial only |

The diff is large. TPG is **commercial advertorial-publication
chrome**; DP is **newspaper-quiet typography**. This is not a retune
— it is a category change.

---

## What we adopt verbatim

The following TPG patterns translate to DP without conflict with the
Charter's editorial non-negotiables.

1. **Photography-light hero alternative is decided up-front.** TPG's
   image-led hero does *not* translate (we have no photo budget). We
   adopt instead **card-art-led hero on card pages and category-
   coloured banded hero on the homepage** (see "What we adapt").
2. **3-stat strip on card tiles.** Welcome Bonus / Annual Fee /
   Earn Rate, tabular numerals. DP already has `.dp-stats` for the
   review page; we extend it to the directory tile via a new
   `.dp-card-tile-stats` (see hybrid spec).
3. **"Best for X" eyebrow on card tiles.** A short categorical label
   above the card name ("Best for AED Cashback", "Best for Skywards
   Earners", "Best for New UAE Residents"). DP currently has eyebrow
   slots on `.dp-dir-tile`; we lean on them harder.
4. **Sticky right rail on review pages at ≥1024px.** Used for a
   contextual "Compare similar cards" widget — *not* for affiliate
   CTAs (see fence). Below 1024px, collapses inline.
5. **Tabular numerals everywhere.** Add `font-feature-settings:
   "tnum"` to `.dp-stats`, `.dp-data-table td.num`, salary tracker
   amount columns. Already partially in place; standardise.
6. **Dense internal linking on long-form.** Increase internal-link
   target from "10–20 per long review" to "20–35 per long review."
   This is an editorial standards change (`EDITORIAL.md`), not a
   visual one, but it is the single highest-ROI thing we adopt.
7. **Breadcrumb above page title** on cards, banks, airlines,
   guides, salary-transfer entries. We have one route nesting; we
   should surface it.
8. **"Last updated [date]" prominent in the editorial header,** not
   buried in the meta strip. DP already has `verifiedBy` + 90-day
   freshness flagging; surface it harder.
9. **Multi-column dark footer** with an "Editorial Guidelines",
   "How We Make Money", "Privacy", "Contact" cluster. We have all
   four pages; the footer just needs the architecture.

## What we adapt

TPG patterns that need DP-specific changes.

1. **USD → AED.** All currency display, all valuations, all welcome-
   bonus AED equivalents, all salary-band entries. The Charter
   non-negotiable. *No exceptions.*
2. **Hero photography → typographic + card-art hero.** Concretely:
   - **Homepage hero.** A category-coloured band (default `--ink`
     navy) running ~360px tall on desktop, holding one large
     headline + eyebrow + dateline + a CTA pair. No photo. Below the
     band, a 4-up "Featured cards" strip *with card-art* — this is
     where the visual interest comes from; card-art is supplied by
     issuers (we just need permission to render it, which is
     standard practice).
   - **Card review hero.** Card-art rendered at 320px wide left, a
     scorecard-style stat strip + verdict beneath the title right.
     Replaces today's text-only `.dp-article-head` on review pages
     specifically.
   - **News / guide article hero.** Stays typographic — eyebrow +
     headline + lede + meta. No photo. We do not photograph; we
     write.
3. **TPG yellow accent → DP gold, *re-introduced for UI*.** Quiet
   Ledger removed `--gold` from UI. The TPG direction wants a third
   accent. Bring `--gold` back, but **scoped tightly**: "Verified"
   chip, "Editor's Pick" overlay (see #4), affiliate asterisk.
   *Not* on display type, *not* on eyebrows, *not* as a background
   for ribbons.
4. **TPG "Editor's Pick" overlay → DP "Editor's Pick", with
   editorial-standards fence.** Adopted, but the criterion list for
   the badge ships in `EDITORIAL.md` and is auditable. A card
   carrying "Editor's Pick" must:
   - Have a `verifiedBy` date within 60 days (stricter than the
     90-day baseline);
   - Have an `editorTake` paragraph with a stated reason;
   - Not be the only card with "Editor's Pick" in its category (avoid
     monopoly badging).
   This is the badge-with-teeth version. TPG's "Best for X" is
   adopted alongside without these gates because it is categorical,
   not a recommendation.
5. **TPG advertiser-disclosure ribbon → DP "How we earn" inline
   note.** We adopt a top-of-card-review ribbon, but in DP form:
   one line, `--ink-soft` text on `--bg` background (no cream, no
   yellow), linking to `/how-we-make-money/`. This is **honest
   front-loading**, not advertorial cover. At launch we are not
   running affiliate; the ribbon still ships and reads "DubaiPoints
   does not yet earn affiliate commissions. When we do, this notice
   will state which links pay us." (Honest at launch, structurally
   correct for later.)
6. **TPG "Apply Now" cyan CTA → DP "See current offer at [Bank
   Name]" outbound link.** Same visual weight (a primary button-
   styled link), but the language is non-affiliate-coded. The button
   colour is `--brand` (the desaturated blue, not TPG's saturated
   cyan).
7. **TPG comparison table → DP `.dp-data-table` extended.** Adopt
   the pattern of dense card-vs-card tables with sticky header and
   alternating row shading. DP's `.dp-data-table` already covers
   most of this; add `position: sticky` on `thead` and an "Add to
   compare" checkbox row that hooks the existing
   `cards/compare.astro` route.
8. **TPG dense internal linking → DP editorial brief target of 20–
   35 internal links per long-form review.** Operationalised in
   `EDITORIAL.md` and enforced by SEO Strategist on Stage 6 of the
   workflow.
9. **TPG sticky right rail → DP "Compare similar cards" rail.** No
   ad units, no affiliate CTAs in the rail. Just a 4-card mini-grid
   of typed peer cards from `cards.json` filtered by category.

## What we reject

These TPG patterns conflict with the Charter and do not ship.

1. **Sponsor-pinned tiles above the fold.** TPG runs paid-for
   placements adjacent to editorial picks above the fold, separated
   only by a "Sponsored" micro-label. This is the exact pattern the
   Charter forbids: "No advertorial-driven recommendations." We do
   not adopt it. If sponsorship arrives in 2027, it lives below the
   fold in clearly-labelled "Sponsored" bands — never adjacent to
   editorial recommendations.
2. **Affiliate badges that compete with the verdict.** TPG sometimes
   surfaces "Apply Now / Earn 60,000 points" as the visually
   loudest element on a review, ahead of the verdict. We don't.
   Verdict + "Verified" chip + last-updated are visually primary;
   the outbound link is a secondary action.
3. **Auto-playing video.** Not adopted. A11y, performance, and tone
   conflict.
4. **Pop-up newsletter capture (interrupting modal).** Not adopted.
   Quiet Ledger's inline newsletter band stays. Modal capture is the
   single most-cited reason readers say a publication "feels spammy"
   in HfP comment threads — we do not adopt it.
5. **Commission-link styling that hides the asterisk.** TPG's small
   dagger / asterisk on in-text card mentions is sometimes hard to
   spot. DP's affiliate-link styling, when affiliate ships, will use
   a visible `--gold` asterisk + a `*compensation` superscript that
   reads as a footnote indicator, not as a stylistic flourish.
6. **TPG saturated cyan as a primary surface colour.** We adopt the
   *role* (link / CTA blue) but not the *value*. DP keeps `--brand
   #2a6bd1` (desaturated). TPG's `#00aaff` reads as ad-tech blue;
   that's the wrong signal for an evidence-led publication.
7. **Star ratings as a numeric scorecard ("4.5 / 5").** We do not
   ship single-numeric ratings until an AED valuation methodology is
   published (per `EDITORIAL.md`, that's a Q3 2026 artifact). Putting
   "4.5" on a card before the methodology is publicly defensible is
   the same credibility trap Direction C (Currency) called out in
   the prior brief. We adopt sub-rating *labels* ("Excellent for
   cashback", "Average for travel insurance") but never a single
   composite numeral.
8. **Cream / yellow advertiser-disclosure ribbon.** Visually adopted
   in role (top-of-page disclosure) but not in colour — see "What
   we adapt" #5.

---

## Recommendation: a single DP-TPG hybrid spec

Lock this in. Everything below is the spec the Chairman approves.

### Palette (4 hex + 2 retained variables)

```css
:root {
  /* DP-TPG hybrid palette — adopted YYYY-MM-DD by Chairman. */

  /* Surfaces */
  --bg:        #ffffff;          /* page background */
  --paper:     #ffffff;          /* card surface */
  --band:      #f5f7fa;          /* TPG-style cool-grey section band */

  /* Ink */
  --ink:       #0a2540;          /* deep navy — TPG-aligned, replaces #0d1117 */
  --ink-soft:  #5a6473;          /* meta + secondary text */
  --muted:     #8a8f9a;
  --line:      #e3e3e1;
  --line-soft: #f1f1ef;

  /* Brand — interactive blue, used on links / CTAs / "See offer" buttons */
  --brand:      #1e6bd6;         /* desaturated, NOT TPG's saturated cyan */
  --brand-deep: #154fa3;
  --brand-soft: #eef3fb;

  /* Trust accent — re-introduced from Quiet Ledger absence */
  --gold:      #b8842a;          /* Verified chip, Editor's Pick, affiliate * */
  --gold-soft: #f3ead6;

  /* Signal */
  --red:       #c8412d;          /* live, expiry, "needs verification" */
  --green:     #2d7a4a;          /* "Excellent" sub-rating only */
}
```

Five working colours: navy ink, white surface, brand blue, trust
gold, signal red. Plus `--band` cool-grey for section breaks. Each
colour does one job. Yellow / honey is *not* adopted (we use gold
instead — closer to our existing variable, fewer hex codes to retune).

### Type pair

- **Display.** Fraunces 700 (heavier than today's 400/500). We do
  not migrate to Tiempos / Publico — both are paid Klim / Commercial
  Type families and the licensing cost is not justified pre-revenue.
  Fraunces at 700 reads at the same weight class as Tiempos; the
  reader cannot tell.
- **Body / UI.** DM Sans 400 / 500 / 600 stays. We do not migrate to
  Graphik / Inter; same licensing reasoning. DM Sans is the closest
  free-tier humanist sans we already load.
- **Eyebrow.** DM Sans 700 caps, 1.8px tracking, sized 11–12px.
  Coloured `--brand` (TPG-aligned eyebrow colouring) — *the single
  exception* to "blue is interactive only." Documented in the brand
  rules as such.
- **Body size bump.** From 15px to 16px. TPG body is 17–18px; we
  meet halfway. Improves legibility on long-form reviews.
- **Tabular numerals.** `font-feature-settings: "tnum" 1` on
  `.dp-stats`, `.dp-data-table td.num`, `.dp-tracker-row-amount`.

### Homepage IA — 6 sections

A re-expansion from Quiet Ledger's 4. TPG runs 7–8; we land at 6.

1. **Top utility bar.** Single line: "AED-first. UAE-eligibility-led.
   No advertorial." Background `--ink` deep navy, text white. 36px
   tall.
2. **Header.** Wordmark left, primary nav centre, search + "Subscribe"
   secondary CTA right. Sticky on scroll.
3. **Hero band — typographic.** `--band` cool-grey background, 360px
   tall desktop. Eyebrow + headline + lede + dateline + two CTAs
   ("Read", "Subscribe"). No photo.
4. **Featured cards — 4-up, card-art-led.** "This week's editor's
   picks". Card-art tiles with eyebrow ("Best for X"), card name,
   3-stat strip, "See offer at [Bank]" outbound link. This is the
   visual interest of the page.
5. **Latest analysis — 3-up grid + side column.** Three article
   tiles + a single side column running "Salary transfer this week"
   (the live tracker preview). Replaces Quiet Ledger's combined
   tracker+rail module.
6. **Category bands — 3 horizontal scrollers.** "Bank cards",
   "Airline programmes", "UAE life". Each a 4–6 tile horizontal
   scroller on mobile, 4-up grid on desktop.
7. **Newsletter band — quiet, no modal.** `--band` background, single
   line headline, email input, "Subscribe" CTA. No photographic
   background. No interrupting modal.
8. **Footer — multi-column dark.** `--ink` background. Four columns:
   Sections / Cards / Trust / Contact. Trust column carries
   "Editorial Guidelines", "How We Make Money", "Methodology",
   "Privacy".

(Items 1–2 are chrome; the page itself runs sections 3–8.)

### Card review template

```
┌──────────────────────────────────────────────────────────────┐
│ [breadcrumb: Cards > Cashback > FAB Cashback Visa]           │
│ [eyebrow: "Best for AED Cashback" — brand blue]              │
│ Card Name (Fraunces 700, 36px)                               │
│ Lede — one sentence (DM Sans 16px, ink-soft)                 │
│ ─── Updated 2026-05-08 · Verified · By [Editor]              │
│                                                              │
│ ┌──────────┐  ┌────────────────────────────────────────┐    │
│ │          │  │ Annual fee │ Welcome bonus │ Earn rate │    │
│ │ card-art │  │ AED 525    │ AED 500       │ 5% / 1%   │    │
│ │ 320px    │  │            │               │           │    │
│ │          │  │ [Editor's Pick — gold pill, optional]   │    │
│ │          │  │ [See offer at FAB — brand blue button] │    │
│ └──────────┘  └────────────────────────────────────────┘    │
│                                                              │
│ ─── disclosure note: How we make money (link) ───            │
│                                                              │
│ Our take                                                     │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ "Our take" label · gold                              │    │
│ │ One paragraph editor verdict.                        │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ Pros / Cons (two columns, + and − glyphs)                    │
│                                                              │
│ Body prose — long-form review                                │
│                                                              │
│ Compare with similar cards (sticky right rail at ≥1024px)    │
└──────────────────────────────────────────────────────────────┘
```

`.dp-article-head` retained. `.dp-stats` retained (extended). `.dp-take`
retained but moves above the body, immediately after the disclosure
note. `.dp-proscons` retained. New: `.dp-card-hero-art` (320px card-
art block), `.dp-editors-pick` (gold pill), `.dp-cta-primary` (the
"See offer" button), `.dp-compare-rail` (sticky rail at ≥1024px),
`.dp-disclosure-bar` (top inline disclosure).

### Mobile rules

- Logo: 36 / 44 / 52 px continuous scale (carries over from Quiet
  Ledger; this was right and stays right).
- Hero band: collapses to 240px tall, headline drops to 28px, CTA
  pair stacks vertically.
- Card review hero: card-art moves above the stat strip; rail
  collapses to inline modules below the article foot.
- Featured-cards strip: 1-up at <640px, 2-up at 640–1023px, 4-up at
  ≥1024px.
- Bottom CTA: a single sticky "Subscribe" pill on long-form pages
  (re-introduced from Direction A; absent in Quiet Ledger).

### Navigation structure

Top nav, in order:
1. Cards
2. Banks
3. Airlines
4. Guides
5. Salary Transfer
6. Deals (when ≥3 live deals exist; auto-hidden otherwise)
7. About (right-edge)

Search and Subscribe sit right of the primary nav. Mobile drawer
keeps the same order.

---

## Doc-churn list

Specific clauses that change.

- **`CLAUDE.md` Part I § Non-negotiables #1 ("Dubai-first voice").**
  Unchanged.
- **`CLAUDE.md` Part II § "Editorial conventions baked into the
  UI".** The "two-accent system" line moves to a **three-accent
  system** (`--brand` blue, `--gold` trust, `--red` signal). The
  "long-form page skeleton" section gains `.dp-card-hero-art`,
  `.dp-cta-primary`, `.dp-disclosure-bar`, `.dp-editors-pick`,
  `.dp-compare-rail`. The Tailwind-slate-utility ban stays.
- **`BRAND_NOTES.md` §2 (palette).** Append the DP-TPG hybrid
  palette (above). Strike the Quiet Ledger "blue is interactive
  only" line; replace with: "blue is interactive *and* eyebrows;
  never on display type or backgrounds." Keep "each colour does one
  job" (now: blue → links/CTAs/eyebrows; gold → trust signals; red
  → live/expiry).
- **`BRAND_NOTES.md` §3 (tone).** Unchanged (HfP-dry voice retained;
  see "single biggest tradeoff" below for the open tension).
- **`EDITORIAL.md` § Visual standard.** The whole section is
  re-written against the spec above. Strike Quiet Ledger's "no
  exclamation marks" amplification (we don't need to over-restrain
  the tone if the chrome is louder). Strike "italic display words
  are removed" — display words can be italic again, but rarely.
- **`EDITORIAL.md` § Internal linking.** New clause: "Long-form
  reviews and guides target 20–35 internal links each, anchored on
  card slugs and 'best for X' hub URLs. SEO Strategist enforces on
  Stage 6 of the workflow."
- **`EDITORIAL.md` § Editor's Pick.** New clause: criterion list per
  "What we adapt" #4 above.
- **`EDITORIAL.md` § Affiliate disclosure.** New clause: top-of-page
  disclosure bar required on every card review page. Language as
  per "What we adapt" #5.
- **`SITE_ARCHITECTURE.md` §4 (homepage).** Re-written to the 6-
  section spec above (supersedes both the original 7-section and the
  Quiet Ledger 4-section spec).
- **`SITE_ARCHITECTURE.md` §5.3 (header).** Already wrong about the
  drawer; corrected by the same edit. Add the sticky-on-scroll
  behaviour.
- **`SITE_ARCHITECTURE.md` § new §7 (footer).** New section
  describing the multi-column dark footer.
- **`.council/04_content_taxonomy.md`.** Add "Best for X" categorical
  labels — cashback / Skywards / Etihad / new-resident / no-annual-
  fee / Islamic / business — as a defined enum a card can carry. Up
  to 2 per card.
- **`src/styles/global.css`.** Retune `--ink` to `#0a2540` (from
  `#0d1117`). Add `--band #f5f7fa`. Re-introduce `--gold` to UI on
  Verified chip, Editor's Pick pill, affiliate asterisk. Bump body
  size to 16px. Add `font-feature-settings: "tnum" 1` to numeric
  utilities. Add new components: `.dp-card-hero-art`, `.dp-cta-
  primary`, `.dp-disclosure-bar`, `.dp-editors-pick`, `.dp-compare-
  rail`, `.dp-card-tile-stats`, `.dp-band`, `.dp-utility-bar`.

---

## Implementation plan

Bite-size, in order. Acknowledges PRs #23 and #24 are visually
superseded.

1. **Token retune (1 PR, ~1 day).** `global.css` palette + body-size
   bump + tabular-numerals. No structural changes. Inherits across
   all `.dp-*` components automatically. Visual diff small but
   pervasive (every page shifts navy + 16px body).
2. **Header retune (~half day).** Add utility bar above header. Add
   sticky-on-scroll. Verify mobile drawer still opens.
3. **Footer rewrite (1 PR, ~1 day).** New multi-column dark footer
   with the four-column architecture. Pulls from a single
   `Footer.astro`.
4. **Homepage rewrite (1 PR, ~2 days).** `src/pages/index.astro`
   replaced against the 6-section spec. **Supersedes PR #23.**
   PR #23's hero, featured-cards, and category-band sections are
   re-implemented; the Quiet Ledger typographic-only treatment is
   replaced. The deal-rail bug from `index.astro:163-177` is
   resolved as a side-effect (the rail moves into a category band).
5. **Card review template (1 PR, ~2 days).** `CardReviewLayout.astro`
   gains `.dp-card-hero-art`, `.dp-disclosure-bar`, `.dp-editors-
   pick`, `.dp-compare-rail`. Card art comes from a new field in
   `cards.json` (`cardArtUrl`) — Technical Lead owns the schema
   change; provenance defaults to `needs-review` until editor
   confirms each one. Cards without art fall back gracefully to a
   typographic block.
6. **Card directory tile redesign (1 PR, ~1 day).** `.dp-dir-tile`
   gains a `.dp-card-tile-stats` variant for cards. The bank /
   airline / guide directories keep the existing typographic tile.
   Two tile types coexist; both follow the same outer shell.
7. **Trust pages retune (1 PR, ~half day).** **Supersedes PR #24.**
   The trust pages (`how-we-make-money`, `editorial-policy`,
   `team`, `about`) inherit the token retune for free; minor
   adjustments to type weights and the new `--ink` navy.
8. **`ArticleLayout.astro` rewrite (1 PR, ~1 day).** Carry over from
   the prior brief — drop `prose prose-slate`, mirror
   `CardReviewLayout`'s `.dp-article-head` + `.dp-prose` structure.
   Independent of the TPG direction; was always the right move.
9. **Internal-link density pass (editorial, ~3 days over 2 weeks).**
   SEO Strategist + section editors raise existing long-form
   reviews from ~10–20 internal links to 20–35. Not a code change.
10. **Disclosure bar component (~half day).** `.dp-disclosure-bar`
    ships across all card review pages with the launch-honest
    language ("DubaiPoints does not yet earn affiliate commissions...").

What inherits the retune for free: bank hubs, airline programmes,
guides directory, salary-transfer tracker (the `.dp-tracker-*`
classes pull from the tokens), valuations pages.

What breaks: `src/pages/index.astro` (rewritten in step 4); the
Quiet Ledger typographic-only treatment of recent commits (replaced).
Nothing else.

Total: ~9 PRs, ~10 working days end-to-end. Realistic to land in 3
weeks at solo-operator cadence.

---

## Editorial non-negotiables (fence)

This visual pivot does **not** touch the following Charter rules.
Listed plainly so a future contributor reading only this brief does
not relax them.

1. **AED-first pricing on every page.** The TPG visual adoption does
   not introduce USD anywhere on the site. Every card fee, every
   welcome-bonus equivalent, every salary band, every valuation is
   in AED. (`CLAUDE.md` Part I §"Non-negotiables" #1.)
2. **No advertorial-driven recommendations.** Adopting TPG's chrome
   does not mean adopting TPG's commercial model. Editor's Pick is
   editorial; "Best for X" is editorial; the disclosure bar is
   honest at launch. Sponsored placement above the fold is rejected
   (see "What we reject" #1). (`CLAUDE.md` Part I §"Non-negotiables"
   #5.)
3. **Chairman is the only publish gate.** No piece ships without
   `chairman-status: approved`. The visual redesign does not change
   the workflow; `/publish` still halts at the Chairman gate.
   (`CLAUDE.md` Part I §"Non-negotiables" #3.)
4. **Firecrawl is exclusive to the Research arm.** Section editors
   adopting TPG-style components do not gain scrape rights. The
   tool minimisation rule stands. (`CLAUDE.md` Part I §"Non-
   negotiables" #2 and #4.)
5. **Deterministic regex for typed numerics.** Nothing about TPG's
   visual chrome changes the LLM-extraction policy. Fees, salary
   bands, earn rates, AED amounts in `cards.json` continue to be
   parsed by `scripts/scrape/_lib.ts`, never by Firecrawl `/extract`.
   The `editorTake` paragraph remains the only LLM-seedable surface.
   (`CLAUDE.md` Part I §"Non-negotiables" #6.)
6. **`SCRAPED_FIELDS` does not get expanded as a side-effect of this
   redesign.** The `cardArtUrl` schema addition in step 5 above is a
   *new* field; it does not modify the existing scrape contract.
   `welcomeBonus` admission to `SCRAPED_FIELDS` remains a separately-
   fenced change requiring its own Chairman approval.
7. **No Tailwind-slate utilities in long-form pages or layouts.**
   Carries over from `EDITORIAL.md`. The TPG direction does not
   re-open this — `.dp-*` classes are still the only long-form
   idiom; we are extending the system, not abandoning it.

---

## Open questions for the Chairman

These should block sign-off until answered.

1. **Has Firecrawl re-verified the dossier?** The TPG dossier is
   recall-based. The Chairman should not lock in palette hex codes
   or font names against a recall source. A Firecrawl pass on the
   five dossier URLs takes 15 minutes and removes the caveat.
2. **Card-art licensing.** Do we have permission from the priority
   banks to render their card art on directory tiles and review
   pages? Standard practice but worth confirming (FAB and ENBD
   first; the other 9 banks as we expand). If the answer is "not
   yet", step 5 of the implementation plan blocks until it is.
3. **The voice question.** TPG's visual chrome and HfP's dry voice
   are not natural bedfellows. See "single biggest tradeoff" in the
   reply summary. The Chairman should explicitly resolve whether
   the editorial voice tracks the visual change or remains HfP-dry
   under loud chrome.

---

## Posture on the supersession

The Quiet Ledger work shipped in PR #23 and #24 is not wasted. The
token-system architecture (CSS custom properties, `.dp-*` class
namespace, the article-layout abstraction) is exactly what makes
this pivot a 9-PR job and not a rewrite. A site that hard-coded its
Quiet Ledger choices would need a full rebuild for this direction.
This one needs token retunes plus six new components.

The Chairman's override is therefore *cheap* in engineering terms
and *expensive* in editorial terms — the voice tension above is the
real cost. We should answer that tension before we ship the token
retune, not after.

End.
