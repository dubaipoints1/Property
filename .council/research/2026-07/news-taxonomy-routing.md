---
author: technical-lead
session: 2026-07-27-travel-news-desks-strategy
date: 2026-07-27
status: delivered (analysis + proof on branch claude/session-handoff-june-10-9ufa50)
---

# News taxonomy & routing — decision brief + proof notes

Technical Lead deliverable for the 2026-07-27 council session
(`.council/sessions/2026-07-27-travel-news-desks-strategy.md`). Part A
is this analysis; Part B (the proof slice) ships on branch
`claude/session-handoff-june-10-9ufa50` and is referenced throughout.

---

## 1. Taxonomy decision: optional `beat` field, not enum extension

**Decision: add an optional `beat: z.enum(["banking", "airline",
"hotel"])` field to the news schema. Do not add "airline"/"hotel" to
`NEWS_CATEGORY`.**

### Why the enum extension loses

`NEWS_CATEGORY` today answers one question — *what kind of story is
this?* — with values `deal-update`, `card-launch`, `regulation`,
`programme-change`, `salary-transfer`, and the generic `news`. Adding
"airline" and "hotel" to that enum would make the field answer two
questions at once (*story type* OR *desk*), and the collision is not
hypothetical — it exists in the current seven posts:

| Post | Category today | Desk |
|---|---|---|
| `emirates-skywards-season-of-rewards-2026` | `programme-change` | airline |
| `adcb-365-cashback-earn-table-rebalance-2026` | `programme-change` | banking |
| `emirates-islamic-switch-welcome-extended-30-september` | `deal-update` | banking |
| `enbd-bonus-interest-salary-transfer-explained` | `salary-transfer` | banking |
| `mashreq-cashback-category-rate-cut-13-june-2026` | `programme-change` | banking |
| `may-2026-welcome-cycles-end-31-may` | `programme-change` | banking |
| `dubaipoints-newsroom-launch` | `news` | none (publication note) |

The Skywards post is the tell: it is an *airline-desk*
*programme-change*. Under the enum-extension proposal it would have to
give up its type (`programme-change`) to gain a desk (`airline`), or
vice versa. Every future airline devaluation, hotel promo, or carrier
deal-update hits the same fork. Category values also surface in reader-
facing chrome (card eyebrows, article crumbs, RSS `<category>`) and in
the ArticleLayout crumb — repurposing their semantics mid-flight risks
silent regressions across those surfaces.

### Why optional (not defaulted)

`beat` is optional with no default because at least one post —
`dubaipoints-newsroom-launch` — genuinely belongs to no desk; it is a
publication note. Defaulting to `banking` would misfile that class of
post and force a sentinel value later. Optional-with-no-default means:
no beat → appears only on `/news/`; beat set → appears on `/news/` and
its desk index. Zod keeps the enum closed, so a typo in frontmatter
fails `astro check` at build time (fail-fast, same posture as L2).

### Classification applied in the proof

Five posts → `beat: banking` (the four issuer stories + the ENBD
salary-transfer explainer), one → `beat: airline` (Skywards Season of
Rewards), `dubaipoints-newsroom-launch` left beatless. Zero hotel posts
— which is exactly what the hotel desk index now says out loud.

### Beat vs a future third axis

If desks later need sub-beats (e.g. airline desk splitting Skywards vs
Etihad Guest), that is `relatedPrograms` — which already exists as a
reference field — not a new enum value. `beat` should stay a closed
three-value set until a desk actually exists to own a fourth value;
extending it is a schema change and therefore T3.

---

## 2. Routing plan

### 2.1 Filtered indexes (shipped in proof)

Three new static routes, all thin pages over one shared layout:

```
src/layouts/NewsIndexLayout.astro     # composition + styles, lifted from
                                      # the old /news/index.astro (Phase F.4)
src/pages/news/index.astro            # all posts, activeDesk="all"
src/pages/news/banking/index.astro    # beat === "banking"
src/pages/news/airlines/index.astro   # beat === "airline"
src/pages/news/hotels/index.astro     # beat === "hotel" (0 posts → empty state)
```

Notes:

- **Shared layout, not copy-paste.** The news index carried ~400 lines
  of scoped CSS; triplicating it was the alternative. `/guides/`
  still holds its own copy of the same idiom — if that drifts too, the
  next refactor lifts both into an `ArticleIndexLayout` (the F.4
  comment already anticipated this).
- **Route/param collision:** none. `/news/[slug].astro` generates paths
  only for existing post ids; `airlines`, `hotels`, `banking` are
  directory indexes and no post id can shadow them (verified in build:
  all three emit `dist/news/<desk>/index.html` alongside the 7 post
  pages).
- **Desk tabs restored honestly.** Phase F.4 removed the tabs because
  they pivoted the reader off-section. The desk tabs now link to real
  filtered routes with an active state (All news / Banking / Airlines /
  Hotels), so the "no fictional facet routes" objection no longer
  applies.
- **Empty state.** Per the SalaryTransferHistoryLayout `.dp-hist-empty`
  precedent (10 June 2026 fresh-eyes audit), a desk with zero posts
  renders an honest card: "No hotel stories filed yet." — eyebrow,
  plain statement, useful onward links (Bonvoy guide, newsletter, RSS),
  no fake teasers. Copy arrives per-desk through a named slot; the
  layout styles slotted content via wrapper-bounded `:global()`
  selectors. All colours are existing tokens; dark mode inherits via
  the token system (no new hues, per the no-third-hue rule).
- **Trending rail fallback** keeps the existing behaviour: a desk with
  posts shows its own top 5; an empty desk shows "From the guides
  desk" instead of an empty rail.

### 2.2 RSS per beat (planned, not in proof)

`src/pages/rss.xml.ts` is hand-rolled (no `@astrojs/rss`) and already
notes that per-band salary-transfer feeds will land as separate routes.
Same pattern for beats:

- `src/pages/rss/news/banking.xml.ts`, `airline.xml.ts`,
  `hotel.xml.ts` — or one `src/pages/rss/news/[beat].xml.ts` with
  `getStaticPaths` over the `NEWS_BEAT` values (preferred; one file).
- Extract `xmlEscape` / `cdata` / item-serialisation from `rss.xml.ts`
  into a small shared helper (e.g. `src/lib/rssHelpers.ts`) rather than
  copy-pasting; the site-wide feed keeps aggregating everything.
- Feed `<category>` keeps emitting the *category* value; the beat is
  the feed itself. Empty hotel feed is a valid RSS channel with zero
  items — fine, and honest.
- Each desk index gets a `<link rel="alternate"
  type="application/rss+xml">` in head plus the visible RSS CTA
  pointing at its own feed (today the empty-state CTA points at the
  site-wide `/rss.xml`; swap once per-beat feeds exist).

This is new-route work → ships with the T3 batch below.

### 2.3 Nav rewiring (shipped in proof)

`Header.astro` `travelPanel` (mobile overlay "Travel" group — note the
desktop mega-nav never exposed these rows; this panel is mobile-only
today):

| Row | Before | After |
|---|---|---|
| Airline news | `/news/` (mixed feed) | `/news/airlines/` |
| Airline reviews | `/airlines/` (mislabel) | relabelled **"Airline programmes"** → `/airlines/` |
| Airline deals | `/deals/` | kept (deals index is real) |
| All airline stories | `/airlines/` | `/news/airlines/` |
| Hotel news | `/news/` | `/news/hotels/` |
| Hotel reviews | `/airlines/` | **removed** (no content type) |
| UAE staycations | `/deals/` | **removed** (no content type) |
| Hotel programmes | — | added → `/airlines/` (mirrors pointsPanel's "All hotel programmes"; keeps the Hotels group from being two identical news links) |
| All hotel stories | `/airlines/` | `/news/hotels/` |
| Routes & destinations (From Dubai / From Abu Dhabi / GCC weekend / Long-haul awards) | `/airlines/` + `/deals/` | **entire group removed** — the group title promises route-hub content that does not exist; "GCC weekend" → `/deals/` was equally a false promise |

**For the Chairman (T2 flag):** nav copy is T2, so the removals, the
"Airline programmes" relabel, and the added "Hotel programmes" row all
need Standards + UX + section-editor + Chairman sign-off at the PR
gate. Recommendation stands per the session default: de-scoped rows
return only when their content types ship (hotel reviews, staycation
guides, route hubs are each future T3 briefs). If the Chairman prefers
fast-tracking any of them, the nav row returns in the same PR as the
first published piece of that type — never before.

One naming wrinkle worth recording: hotel programmes currently live
under the `/airlines/` route namespace (Marriott Bonvoy at
`/airlines/marriott-bonvoy/`). "Hotel programmes → /airlines/" is
honest about content but odd in the URL bar. A future T3 could
introduce `/programs/` or `/hotels/` with redirects in
`public/_redirects`; not urgent, flagged for the taxonomy owner.

---

## 3. Implementation sequence and tiers

| Stage | Work | Tier / gate | Status |
|---|---|---|---|
| 1 | `beat` field on news schema + frontmatter classification of 7 posts | T3 (schema change) — rides this session's council convening; proof on branch | **done (proof)** |
| 2 | `/news/banking/`, `/news/airlines/`, `/news/hotels/` filtered indexes + shared `NewsIndexLayout` + desk tabs + hotel empty state | T3 (new routes) — same council convening | **done (proof)** |
| 3 | Header travelPanel rewiring + row de-scoping | T2 (nav copy) — Standards + UX + section editor + Chairman explicitly at the PR gate | **done (proof, flagged)** |
| 4 | Per-beat RSS (`/rss/news/<beat>.xml`), helper extraction from `rss.xml.ts`, `rel=alternate` links on desk indexes | T3 (new routes) — separate PR after this one merges | queued |
| 5 | Agent files `.claude/agents/airline-news-editor.md`, `hotel-news-editor.md` | **Fenced — Chairman-gated**; drafts live in travel-experiences-editor's `travel-desks-spec.md`, files ship only on Chairman sign-off | with Chairman |
| 6 | Sourcing/monitoring pipeline (HfP/TPG/OMAAT discovery, Firecrawl targets, cost envelope) | Separate programme per head-of-research's `news-sourcing-policy.md`; any scrape-pipeline code change is additionally fenced per Charter (LLM-extraction policy, `scripts/scrape/` ownership) | with Head of Research |
| 7 | De-scoped content types (hotel reviews, staycations, route hubs) | Each a future T3 brief; nav rows return with first published piece | future briefs |

Sequencing rationale: stages 1–3 are one atomic PR because a beat field
without routes is dead weight, routes without nav are unreachable, and
nav without routes is the dishonesty we were convened to remove. RSS
(4) is additive and low-risk but touches a shared file (`rss.xml.ts`)
— cleaner as its own diff. Agent files (5) are hard-fenced and must
not ride an engineering PR.

---

## 4. Proof validation record (branch `claude/session-handoff-june-10-9ufa50`)

- `npm run check` — 0 errors, 0 warnings, 0 hints (103 files).
- `npm test` — 204/204 pass.
- `npm run build` — green; Pagefind postbuild indexed all pages.
- Built HTML verified: `dist/news/{airlines,hotels,banking}/index.html`
  all emitted; hotels renders "No hotel stories filed yet." + "Hotel
  desk · no stories yet"; airlines contains only the Skywards post
  (zero banking slugs); banking lists exactly the five banking posts;
  desk tabs render with correct active state on all four indexes.
- Nav grep: `Hotel reviews`, `UAE staycations`, `Routes &amp;
  destinations`, `>From Dubai<`, `>From Abu Dhabi<`, `GCC weekend`,
  `Long-haul awards`, `>Airline reviews<` — 0 occurrences across
  `dist/**/*.html`. New hrefs `/news/airlines/` and `/news/hotels/`
  present in the header of every built page.
- No new colours, no Tailwind palette utilities; empty state and tabs
  use existing tokens (`--paper`, `--line`, `--ink`, `--green`,
  `--shade-1`), so dark mode inherits for free.

> Tech pass on 2026-07-27.
> Build: ✓ check ✓ build ✓ test
> Lighthouse mobile: not run in this environment (no headless Chrome);
> the pages reuse the existing F.4 index composition byte-for-byte, so
> no budget change expected — Wednesday sample to confirm post-merge.
> Schema: content-collection Zod (beat enum) validates at build; no
> JSON-LD change (index pages carry none today — candidate:
> CollectionPage, agree with SEO Strategist before adding).
> Internal links: all new hrefs resolve in dist.
> Notes: PR is T3 with an explicit T2 nav-copy component; convenor
> opens the PR per session instructions.
