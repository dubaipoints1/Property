# Site audit — 29 August 2026

**Trigger:** owner request ("do a full site audit, there are some pictures on
articles not relevant. Also I want to change the front page").
**Scope:** full route inventory (~202 pages), imagery library (111 manifest
entries), navigation integrity, content staleness, half-shipped surfaces.
**Outcome:** the fixes below shipped on `claude/website-audit-redesign-ne5ljn`
in the same pass; the deferred queue is at the end.

---

## 1. Findings fixed in this pass

### 1.1 Critical — factual

- **The site-wide header served retracted valuations for 2½ months.** The
  mega-menu carried Skywards "3.5 fils · DP value" and Etihad Guest "2.8
  fils" — the exact figures the Fact-Checker redlined on 11 June (published
  baseline: 2.0). The valuations page was fixed then; the nav carried its own
  copies and nobody owned them. **Fix:** baselines extracted to
  `src/lib/valuations.ts`; header and `/valuations/` render from the same
  rows; `tests/nav/header.test.ts` fails on any hard-coded fils figure in nav
  chrome. This is the audit's structural lesson: *chrome is data, and data
  that lives in two places will fork.*
- **Every social share rendered without a preview.** `og:image` pointed at an
  SVG, which X/Facebook/LinkedIn/WhatsApp do not render. **Fix:** rasterised
  to `public/og-default.png` (1200×630), recoloured from the pre-ratification
  green accents to navy/gold, dimensions meta added.
- **Three card reviews still cited the closed 31 May welcome cycle** as their
  reference figure (fab-cashback, hsbc-live-plus, rakbank-world) — audit
  rec #7 from 22 Aug, never landed. All three L2 records carry deliberate
  editor nulls; the prose now says plainly that no welcome offer is live.
- **The Etihad fare-sale story (window closed 31 July) carried no
  `staleAfter`**, so the expiry sweep could not see it. Backfilled.

### 1.2 Navigation / IA

- "Award vs cash calculator" label (renamed 22 Aug) was only half-applied —
  the points panel still carried the old name. Fixed.
- `/topics/` listed flydubai OPEN, Saudia Alfursan and Air Arabia Airewards
  as browsable topics with no content behind them (honest-nav violation),
  and mis-linked Qatar Privilege Club to the generic index. Fixed; hotel
  programmes (which do have pages) surfaced instead.
- Hilton Honors and Accor ALL had pages but no header presence. Added.
- `/cards/finder/` had **zero inbound links** and a meta description
  claiming "34 cards" against 58 rendered. Fixed both (header row added;
  count now computed).
- `/valuations/` linked its own methodology to `/editorial-policy/` instead
  of `/valuations/methodology/`, and claimed its rows were "drawn from
  /airlines/ collection" (false — editor-curated). Both fixed.
- **Recurrence guard:** `scripts/ci/check-links.mjs` now sweeps every
  internal href in `dist/` on every build (14,020 links, 0 broken at time
  of writing) — honest-nav is now mechanical, not aspirational.

### 1.3 Front page

Rebuilt per the ratified-but-never-executed May briefs (Quiet Ledger
4-section spec + TPG typographic-hero ruling): ten bands → five sections,
~970 lines of one-off scoped CSS → ~230, page adopts the shipped-but-idle
`.dp-featured-band` / `.dp-story-card` / `.dp-dir-tile` primitives, and the
"Friday brief is preparing for launch" copy now gates on
`PUBLIC_BUTTONDOWN_USERNAME` instead of being hard-coded. Verified in both
themes at 360/768/1280 against the built output. `SITE_ARCHITECTURE.md`'s
implementation-status table updated (it also falsely claimed the removed
`bankReputation` collection ships — corrected there and in
`00_state_of_the_site.md`).

### 1.4 Imagery (the owner's complaint — confirmed, and narrower than it looked)

Cross-referencing the owner's concern against the July audit
(`2026-07/image-relevance-audit-2026-07-29.md`) mattered: several apparent
mismatches were **deliberate, hand-verified rulings** (FAB Elite's gym, the
Manchester United stadium, DIB's Al Fahidi wind tower — a Chairman ruling —
and the four-distinct-Etihad-aircraft set). Those were left alone. The
mosque question the exploration flagged as "unanswered" was in fact **ruled
and executed in July Round 5**; no action needed, recorded here so it isn't
re-litigated a third time.

What was genuinely wrong and is now fixed (22 accepted images across 27
workflow runs, every one eyeballed against the fetch-stock kill-list):

- **14 pages shipped with no image at all** — 7 of the 8 news stories filed
  since 4 August (the newest, most-promoted content was the only content
  without photography), one deal, the al-hilal/liv/wio bank hubs (which
  render *no hero at all* when the manifest slug is missing) and the three
  liv/wio cards. All filled.
- **Genuine topic mismatches replaced:** ADIB cashback (Abu Dhabi
  architecture → school-stationery still life for its education category),
  two of the three near-identical ADCB Abu Dhabi cityscapes (→ Sheikh Zayed
  Road interchange at night; sand-drifted desert road), ENBD Visa Infinite
  (boardroom stock → empty premium lounge), ENBD Priority Banking (hotel
  lobby → fountain-pen still life), salary-transfer-mechanics guide (credit
  application form → calculator/rate-table desk), Skywards J-class guide
  (economy wing-view → Emirates A380).
- **Rejected along the way, before they shipped:** a California-plated GMC
  on a "desert road" query, a US passport on an ENBD card, Moroccan and
  Jordanian banknotes masquerading as dirhams, a Lufthansa CityLine economy
  cabin on the Skywards J guide, a Brazilian ATM keypad, a German PIN pad,
  a US-dollar collage. Every one confirms the July lesson: **subject match
  is not relevance — look at the picture.** Pexels has no honest AED
  banknote imagery; the currency-photo route is a dead end and the two
  salary stories use calculator/hourglass motifs instead.
- **Recurrence guard:** `tests/images/content-coverage.test.ts` — every
  content entry must have a manifest image or a recorded exception, so the
  next content wave cannot ship imageless silently.
- Housekeeping: orphaned `guide-uae-transfer-ratios-2026.jpg` deleted; three
  place-inaccurate alt texts corrected after looking at what actually
  arrived (JLT labelled as Marina, Al Reem labelled as Al Maryah, a 777 at
  an unidentifiable airport labelled "Dubai").

Known accepted imperfections (recorded, not hidden): the Etihad news story
and the July fare-sale story both show A6-APF (different photos); the deal
and FAB Infinite pages both show A6-BNB; the IHG key-card frame reads
mid-market rather than premium. None worth further churn this pass.

## 2. Deferred queue (next sessions, in priority order)

1. **Valuations table is 3/7 dead columns** — Floor/Ceiling/Δ90d render "—"
   for all 10 rows; the methodology promise says "Q3 2026", which expires
   30 September. Either land the methodology or cut the columns. (T3,
   Fact-Checker + Chairman.)
2. **News 31-August expiry cliff** — four stories go stale simultaneously
   in two days; the owning desks should re-check and bump or archive them
   when the sweep fires Tuesday.
3. **Stale guides corpus** — 13 of 21 guides past 90 days; the four oldest
   (expat-starter series, 115 days) are the most-promoted content in the
   header mega-menus. The July image audit also wanted the three aerial
   skylines in that series differentiated at next refresh.
4. **Calculator consolidation** (audit rec #17): `/calculator/` vs
   `/salary-transfer/calculator/` — merge or canonicalise. The homepage
   rebuild gave `/calculator/` its first persistent nav link, which makes
   the duplication more visible, not less.
5. **Trust-page stamps**: `/press/` and `/tip/` lastUpdated 2026-05-09.
6. **/news/banking/ is a near-orphan** (reachable only from the news layout
   switcher, unlike its sibling desks in the header).
7. **63 of 111 stock images were fetched in May** and pass 90 days next
   month; no mechanism watches image age the way `lastVerified` is watched.
   Consider an age column in the coverage test or a quarterly sweep.
8. **Per-page OG images** — every page still shares `og-default.png`; the
   manifest images could feed `ogImage` per template.

## 3. Firecrawl playground features (owner question, ruled against the Charter)

- **SEO Audit** — usable now, on our own site; charter-clean. Route the
  output to the SEO Strategist.
- **Competitive Intel** — story discovery/structure only per the 2026-07-27
  sourcing ladder; never a citable number; Head of Research only (§2).
- **Deep Research / Market Research** — prose dossier seeding only; §6 bans
  LLM extraction for typed numerics without exception.
- **Website Design Clone** — mockup/reference only per the 2026-07-25
  ruling; generated code never enters the repo.
- **Lead Research** — no editorial use.
- Budget note: these are agent-driven and burn credits fast; the monitors
  already consume ~800–1,150/month of the 5,000 plan. Playground use should
  be deliberate, not exploratory.

— Session audit, 29 August 2026. Chairman direction for the scope was given
in-session the same day (front-page rebuild; fix all images; critical + nav
fixes; imagery rulings above).
