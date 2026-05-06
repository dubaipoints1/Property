# Site Architecture & Mobile UX Strategy

Companion to `PLAN.md` and `BRAND_NOTES.md`. This document defines the
information architecture, mobile experience, and competitor-informed design
decisions for dubaipoints.ae. It explicitly **preserves** existing brand and
technical decisions already shipped in this repo, and corrects gaps (notably
mobile responsiveness in the current `Header.astro`).

---

## 1. Preserved brand & technical decisions

The following are **locked in** and are not to be changed by this document:

| Asset / decision | Source | Status |
|---|---|---|
| Logo wordmark `public/logo.svg` and white variant `public/logo-white.svg` | shipped | **keep** |
| Brand colour electric blue `#1e6bd6` (`var(--ink)` blue accents) | `BRAND_NOTES.md` §2 option C | **keep** |
| Tagline: "UAE rewards, banking and travel decoded" (homepage) / "UAE Miles · Deals · Banking Hacks" (masthead) | `BRAND_NOTES.md` §4 / `Header.astro:119` | **keep** |
| Tone: HfP-dry, evidence-led | `BRAND_NOTES.md` §3 | **keep** |
| Stack: Astro 5 + TS strict + Tailwind 4 + MDX + Pagefind + Cloudflare Pages | `PLAN.md` Stack | **keep** |
| Content collections: `banks`, `cards`, `programs`, `deals`, `guides`, `salaryTransferOffers`, `salaryTransferOfferHistory`, `bankReputation` | `src/content.config.ts` | **keep** |
| Editorial principles: AED-first, sourced, date-stamped, no affiliate-driven recommendations | `PLAN.md` Editorial | **keep** |
| Primary nav structure: News / Cards / Airlines / Banks / Guides + Salary tracker CTA | `Header.astro:2-8` | **keep** |
| **Promo Codes — REMOVED** from architecture. Promo content, where relevant, lives inside `deals/` posts as inline merchant codes, never as a top-level destination. | this doc | **new** |

---

## 2. Competitor analysis — what to emulate, what to improve

### Head for Points (HfP) — `headforpoints.com`
- **Emulate:** dense, opinionated card reviews with explicit "would I get this?" verdicts; comment-driven authority; daily news cadence; tag-based archive depth.
- **Improve:** their mobile experience is cluttered (sidebar widgets stacked under articles, ad-heavy). We will keep the article body single-column on mobile with a clean post-article "related" rail, no sidebar republished beneath.

### The Points Guy (TPG) — `thepointsguy.com`
- **Emulate:** sortable comparison tables, programme transfer-partner matrices, polished card-detail pages.
- **Improve:** TPG's tone has drifted into marketing-speak and their affiliate disclosures are easy to miss. Our tone stays HfP-dry and our affiliate disclosure (when introduced) is inline above the recommendation, not in a footer link.

### PointsMilesAndBling (PMB) — UAE incumbent
- **Emulate:** UAE-specific card and programme coverage; salary-transfer-aware framing; bilingual reader sensitivity.
- **Improve:** PMB's IA buries evergreen guides under chronological news; mobile typography is small and line-length is uncontrolled; comparison tables don't scroll cleanly on phones. We surface evergreen guides on the homepage (see §4), cap article line-length at 65ch, and ship horizontally-scrollable comparison tables with sticky first columns.

### DearestDubai — UAE lifestyle deals
- **Emulate:** strong deals discoverability, clear merchant logos, expiry-aware listings.
- **Improve:** DearestDubai monetises lifestyle deals with no financial uplift. Our `deals/` posts always close with a one-line "Pay smart: best UAE card for this category" link back into `cards/` — converting lifestyle traffic into points-and-cards depth.

### Synthesis — what dubaipoints.ae does that none of these do
1. **AED-first, every figure** (PMB does this inconsistently; HfP/TPG don't at all).
2. **UAE eligibility front-and-centre** on every card (min salary, salary-transfer status, residency).
3. **Salary-transfer tracker as a live product**, not a list of news posts — already scaffolded in `src/pages/salary-transfer/`.
4. **Date-stamped freshness signal** (`lastVerified`, with stale-flagging at 90 days) visible in the UI.

---

## 3. Sitemap (aligned with existing routes)

Top-level destinations match the shipped `Header.astro` nav. **Promo Codes is
intentionally absent.** Inline promo codes inside `deals/` posts remain
supported.

```
/                               Homepage (News + curated rails)
/cards/                         Cards index
  /cards/[slug]/                Individual card review
  /cards/compare/               Comparison tables
  /cards/best/                  Curated "best of" hubs (best-cashback, best-miles, best-no-salary-transfer)
/airlines/                      Programmes index
  /airlines/[program]/          Skywards, Etihad Guest, Qatar Privilege Club, Saudia Alfursan
  /airlines/[program]/sweet-spots/
/banks/                         Banks index
  /banks/[bank]/                Bank hub (cards + offers + reputation)
  /banks/[bank]/cards/          Bank's card lineup
/guides/                        Guides index (evergreen)
  /guides/expat-starter/        Expat onboarding pillar (key SEO cornerstone)
  /guides/[slug]/               Individual guides
/salary-transfer/               Salary transfer tracker (live)
  /salary-transfer/calculator/  AED-band calculator
  /salary-transfer/history/     Offer history archive
  /salary-transfer/offers/[slug]/
/deals/                         Deals feed (sorted by expiry)
  /deals/[slug]/                Individual deal posts (may contain inline promo codes)
/news/                          Daily news archive (also surfaced on /)
/about/                         Editorial policy, author bylines, contact
/newsletter/                    Buttondown signup with salary-band tagging
/search/                        Pagefind UI
/rss.xml                        Site-wide
/rss/salary-transfer/aed-[band].xml   Per-band RSS (BRAND_NOTES §7)
/sitemap.xml                    @astrojs/sitemap
```

**Slug rules:** lowercase, hyphenated, max 3–4 words per segment, no dates in
URLs (allows evergreen refresh without redirects).

---

## 4. Homepage (mobile-first hierarchy)

Designed for ≤390px viewport first, then progressively enhanced. Single
column on mobile, two columns ≥768px, three columns ≥1180px.

1. **Sticky utility + masthead** (collapses on scroll on mobile)
2. **Today's Best Deals rail** — horizontally-scrollable, snap-aligned, 3–5 cards. Single-tap to deal page. Visible above the fold on a 6" screen.
3. **Latest News (single tile)** — most recent post, full-width, with byline, publish date, and `lastVerified` badge.
4. **"New to the UAE?" band** — persistent entry into `/guides/expat-starter/`. SEO cornerstone and primary onboarding funnel.
5. **Salary-transfer tracker preview** — live snapshot of best current AED-band offers, links into `/salary-transfer/`.
6. **Card spotlights (2–3)** — curated card recommendations by category, surfaced from `cards/` collection.
7. **Recent posts feed** — mixed-vertical chronological list, paginated (10 per page).
8. **Most-read evergreen guides** — manually curated rail, refreshed monthly. Pads the experience on no-publish days.
9. **Newsletter inline signup** — Buttondown, with salary-band selection.
10. **Footer** — categories, About, Editorial Policy, Affiliate Disclosure (when introduced), Contact, sitemap, RSS.

**First-time visitor flow:** Today's Deals → "New to the UAE?" → Expat Starter Guide → cards/.
**Returning daily visitor flow:** Today's Deals → Latest News → newsletter.

---

## 5. Mobile-first design rules (concrete)

The current `Header.astro` is **not mobile-friendly** — fixed `padding: 0 32px`
and `gap: 28px` between nav links overflow narrow viewports, the masthead
logo is fixed at 54px, and there is no hamburger. The rules below define the
fix and apply site-wide.

### 5.1 Breakpoints
- `≤640px` — primary mobile target (one-handed, portrait)
- `641–1023px` — tablet / large phone landscape
- `≥1024px` — desktop

Use Tailwind 4's default breakpoints (`sm:`, `md:`, `lg:`, `xl:`). No custom
media queries unless a single component truly needs them.

### 5.2 Layout & touch
- All horizontal containers: `max-width: 100%; padding-inline: 16px` on mobile, `24px` on tablet, `32px` ≥1024px. Replace the current hard-coded `padding: 0 32px`.
- Tap targets ≥44×44px. Inline links inside body copy may be smaller but spaced ≥8px apart vertically.
- One-handed reach: primary CTAs sit in the lower-third of the viewport on long pages (sticky "Subscribe" footer bar on mobile only).
- No horizontal scrolling outside of intentionally scrollable rails (deals carousel, comparison tables).

### 5.3 Header (replacement spec for `Header.astro`)
- **Mobile (`<sm`):** sticky slim bar — logo (32px height), hamburger left, search icon right. No utility bar, no tagline, no inline nav links. Hamburger opens a full-screen drawer with the five nav items, salary-transfer CTA, newsletter CTA, and About/Sign-in.
- **Tablet/desktop:** current three-tier layout (utility / masthead / primary nav) with the existing widths.
- The "Live: salary transfer tracker" pulse remains on tablet/desktop only — too noisy on mobile.

### 5.4 Typography
- Body 16px / 1.6 line-height on mobile (never <16px — iOS auto-zooms inputs below 16px).
- Headlines fluid: `clamp(1.5rem, 5vw, 2.25rem)` for H1, scaled accordingly down.
- Line-length capped at 65ch on body copy regardless of viewport.
- System-font stack first; one display font (`font-display: swap`) for headings only.

### 5.5 Tables & rails
- Comparison tables (`/cards/compare/`): wrap in `overflow-x: auto` with sticky first column on mobile. Show 2–3 columns initially with a "+ add column" affordance.
- Deals carousel: CSS scroll-snap, no JS. Visible scroll indicators.
- Sweet-spot tables on programme pages: stacked-card view <sm, table view ≥md.

### 5.6 Performance budget (mobile)
- Lighthouse mobile ≥95 (already targeted in `PLAN.md` Phase 3).
- Hero/above-fold weight ≤200KB total.
- Images: `astro:assets` with WebP/AVIF, `loading="lazy"` below fold, explicit width/height to prevent CLS.
- No third-party scripts above the fold. Cloudflare Web Analytics is already deferred — keep it that way.
- Newsletter widget loaded only on user intent (click) on mobile; inlined ≥md.

---

## 6. Content vertical detail (no Promo Codes)

### `cards/` — Credit Cards
- Card reviews, "best of" hubs, comparison tables. Schema already in
  `src/content.config.ts`.
- Internal linking: every card review links to (i) the relevant programme in
  `airlines/`, (ii) the issuing bank in `banks/`, (iii) at least one guide in
  `guides/`, (iv) the salary-transfer offer for that bank if applicable.

### `airlines/` — Loyalty Programmes
- Programme deep-dives, transfer-partner matrices, sweet-spot redemption guides.
- Internal linking: each programme links to the cards that earn its currency
  and to recent news posts referencing it.

### `banks/` — Bank Hubs
- One hub per bank: cards lineup, current offers, salary-transfer position,
  reputation summary (`bankReputation` collection).
- Already prioritised list in `PLAN.md` Phase 2 — 11 banks.

### `salary-transfer/` — Live Tracker
- Tracker, calculator, history, individual offer pages. Per-AED-band RSS feeds
  (5k–8k, 8k–15k, 15k–30k, 30k–50k, 50k+).
- Newsletter segments mirror these bands.

### `deals/` — Deals & Lifestyle
- Daily deals across dining, coffee, retail, auto (PPF/detailing), entertainment.
- **Inline merchant promo codes are supported inside individual deal posts**
  but no `/promo-codes/` directory exists. Promo codes are a content artefact,
  not a navigation destination.
- Closing module on every deal post: *"Pay smart: best UAE card for this
  category"* — single-line link into `cards/`.

### `guides/` — Evergreen
- Long-form, `≥2,000` words, refreshed quarterly.
- **Cornerstone:** `/guides/expat-starter/` — the SEO and onboarding anchor.
  Sub-articles: first credit card, opening a UAE bank account, how points work
  in the UAE, common newcomer mistakes.

---

## 7. Monetization-readiness (zones, not commitments)

Per `PLAN.md` editorial principles, no affiliate links at launch. The
architecture reserves the following zones so they can be activated without a
re-template:

- **Z1** — Featured offer card on homepage (below recent posts).
- **Z2** — In-article contextual link after first H2.
- **Z3** — End-of-article "recommended card" widget.
- **Z4** — Sponsored-post format with distinct background tint, "Sponsored by"
  attribution, exclusion from "Today's Best Deals" hero.
- **Z5** — Newsletter sponsor slot (one per send).

**Labelling system:** `Editorial` (default, no badge) / `Affiliate` (grey
badge, inline disclosure above first paragraph) / `Sponsored` (orange badge,
distinct background) / `Partner Spotlight` (full disclosure block top and
bottom). Editorial hero and Latest News slot are **never** paid.

---

## 8. SEO architecture

- **Hub-and-spoke:** `/guides/expat-starter/` is the cornerstone hub; every
  daily news post, deal post, and card review must link upward to at least one
  guide.
- **UAE keyword clusters** (already implicit in PLAN.md vision): "best credit
  card UAE", "[bank] salary transfer", "Skywards miles redemption", "[bank]
  credit card review", "[brand] deal UAE".
- **Meta patterns:**
  - Card review: `[Card] Review (Month Year): [Verdict] | DubaiPoints`
  - Deal: `[Brand] Deal UAE — [Month Year] | DubaiPoints`
  - Guide: `[Topic]: A [Year] Guide for UAE Residents | DubaiPoints`
- **Schema.org:** `Article` + `FAQPage` on guides, `Review` on card reviews,
  `Offer` on deals.
- **Internationalisation-ready:** all routes are flat under `/`; future Arabic
  variant lives at `/ar/...` with `hreflang` pairs. No restructure required.

---

## 9. Verification checklist

- [x] Logo `/public/logo.svg` preserved; no alternative wordmark proposed.
- [x] Electric-blue `#1e6bd6` brand colour preserved.
- [x] Tagline preserved.
- [x] Existing nav (News / Cards / Airlines / Banks / Guides) preserved.
- [x] Existing content collections preserved; no schema changes proposed.
- [x] Promo Codes removed as a top-level destination.
- [x] Mobile-first rules (header replacement, breakpoints, type, tables, perf budget) defined.
- [x] Competitor analysis covers HfP, TPG, PMB, DearestDubai with specific emulate/improve points.
- [x] Salary-transfer tracker positioned as a live product, not buried.
- [x] Expat Starter Guide positioned as cornerstone.
- [x] Lighthouse mobile ≥95 budget aligned with `PLAN.md` Phase 3.
- [x] Monetization zones reserved without compromising editorial trust.

---

## 10. Implementation handoff

When ready to apply this document:

1. **Header rewrite** — replace `src/components/Header.astro` per §5.3 (mobile drawer + responsive padding). This is the single largest concrete change.
2. **Tailwind utilities** — extend `src/styles/global.css` with the §5 layout, type, and breakpoint conventions.
3. **Homepage rebuild** — implement §4 hierarchy in `src/pages/index.astro` using existing layout `HomepageLayout.astro`.
4. **Expat Starter cornerstone** — author the `/guides/expat-starter/` pillar and four spoke articles.
5. **Per-band RSS** — implement per `BRAND_NOTES.md` §7 in Phase 3.
6. **Verification** — Lighthouse mobile run, manual one-handed test on iPhone 14 (390px), Pagefind smoke test, all internal links resolve.
