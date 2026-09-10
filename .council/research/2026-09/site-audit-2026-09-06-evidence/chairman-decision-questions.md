# Chairman — decision questions and gate note

**Audit:** 2026-09-06 site-wide UI/UX audit, 72 verified findings (F-001…F-072).
**Date:** 7 September 2026.
**Scope of this note:** the twelve `DECISION REQUIRED` findings, grouped into ten
rulings; the publish-blocking set for the next deploy; a five-line same-day
gate note.

Standing rule for everything in §1: these are Charter-level or
Chairman-sole-authority items. They are framed, not defaulted. A session that
picks an option here without a direction it can quote is committing the
discipline failure the 2026-08-06 amendment names.

On the approval mechanism: this note becomes Stage 7 approval for the hotfix
scope in §2 only when the Chairman says so in-session (2026-08-06 amendment).
The sign-off cell is filled on that word, with the mechanism and date in Notes;
the session does not fill it on the strength of this document. Per the
2026-08-07 amendment CI will not block a PR that omits the block — that makes
the block more, not less, mandatory.

---

## 1. Rulings required

### R1 — Palette: is a third hue ever permitted, and where? (F-005, F-006)

**Question.** Does the no-third-hue rule admit a data-visualisation exemption
for the AED value-breakdown bars, and does the light-theme tracker retire its
mint/green survivors — or is the rule absolute and both are remapped into the
navy and gold families?

**What the audit found.** `AEDValueBreakdown.astro` encodes polarity with
`#3f9068` green and `#b46a55` terracotta (F-005). The salary-transfer tracker
block still carries a light-theme `--mint` (`#8FD3B3`) and a `#235F46` green,
strong enough that a live branding extraction resolves the *site's* primary to
mint rather than navy (F-006). The dark theme already retired its teal on
25 July; the light theme did not follow. `#235F46` sits close to the
2026-05-09 "deep editorial green" that the 2026-05-16 navy directive
superseded — the tracker looks like a pre-16-May survivor, not a design choice.

**Options.**

- **(a) Enforce the rule as written.** Segment 2 → navy tint (`#5b7d93`), fee
  bar → `--ink-soft` with a diagonal hatch; retire `--mint`; restyle `.dpst`
  chips navy/gold. T2 (Standards + UX + section editor + Chairman). No Charter
  text changes. Cost: polarity in the value bar is carried by pattern and
  label rather than hue — which is also the accessible answer, since colour
  alone was never a compliant encoding.
- **(b) Narrow exemption for the value bar only, logged as an Amendment.**
  The bar keeps a two-hue positive/negative encoding as a declared
  data-visualisation palette; `--mint` and the tracker chips still go navy/gold.
  T2 for the code + a Chairman-authored Amendments entry. Cost: the "closed"
  two-family system acquires its first named exception; every future chart
  will cite it.
- **(c) Broader exemption for status semantics.** Value bar *and* tracker
  status chips (live / ended / paused) may use a traffic-light encoding. T2 +
  Amendment. Cost: the tracker stays visually a different publication from the
  rest of the site, which is precisely what F-006 measured.

**Charter refs.** Amendments 2026-07-25 ruling 2 ("Any future colour outside
these two families … requires an explicit Chairman ruling before merge");
Part II "Two-accent system" (each colour has a single job); Amendments
2026-05-09 and 2026-05-16 (palette history); Chairman mandate — authorises
any change to the design idiom in `src/styles/global.css`.

**Adjacent, not a ruling.** F-004's proposed `--gold-ink` (`#8a6118`) is a
darker shade of the gold family for ≤14px labels, not a new hue. It proceeds
inside its T2 PR unless the Chairman wishes to reserve the token name.

**Why not defaulted.** The 25 July amendment reserves this question to the
Chairman in terms. Option (a) is the only one a session could ship without
touching the Charter, but shipping it silently would also foreclose (b) and
(c) without the Chairman having seen the trade.

---

### R2 — Homepage: which page is the ratified one, and what does the H1 say? (F-033, F-052; F-040 wording)

**Question.** Does the record catch up to the shipped eight-band homepage
(photo hero, boxed idiom, gold band exception, italic two-beat H1) by a dated
Amendment, or does the page return toward the ratified four-section Quiet
Ledger spec — and, either way, does the H1 gain a topical noun?

**What the audit found.** The record contradicts itself three times over.
SITE_ARCHITECTURE.md:281-301 ratifies a four-section homepage with "no images,
no hero photography". The implementation-status row at :343 says the 29 Aug
rebuild shipped "as 5 sections … typographic hero, no photo". The live page has
eight bands and a photo hero. The overriding 29 Aug direction exists only as a
code comment in `index.astro` (F-033). Separately, SITE_ARCHITECTURE §5.4
(2026-05-08 append) removed italic display words site-wide, and the H1 uses an
italic `<em>`; F-040 also reports the `<em>` is announced as "Payless" because
of how the space is set. The H1 "Fly further. Pay less." carries none of the
title's terms and no topical noun (F-052).

**Options.**

- **(a) Ratify the shipped page.** Supersede SITE_ARCHITECTURE §4 with a
  description of the eight bands; log the 29 Aug direction (photo hero, boxed
  idiom, gold band exception, italic em) as a dated CLAUDE.md Amendment. T1 doc
  change, Chairman-authored; zero code. Cost: the 2026-05-08 Quiet Ledger
  homepage decision is formally reversed and the §5.4 italic rule needs a
  carve-out.
- **(b) Return to the four-section spec.** T3 — new homepage sections are full
  council; the tools band, start-here directory and trust close go. Cost:
  large rebuild; F-021/F-032/F-047 lose their surfaces and would need
  re-framing; it discards direction the Chairman gave nine days ago.
- **(c) Ratify with pruning.** Keep hero + live desk + latest analysis + trust
  / newsletter close as the spine; direct Head of UX + Standards to fold the
  remaining bands (the audit's F-053, F-066 observations point where). T3
  because it changes sections above and below the fold; Amendment as in (a).

**H1 sub-ruling** (composition was the Chairman's 29 Aug direction, so wording
escalates):

- (i) keep "Fly further. Pay less."; fix only the space/nowrap bug (F-040). T2.
- (ii) "Fly further. *On a Dubai salary.*" — keeps the two-beat, adds the
  noun. T2 (Standards + UX + Chairman).
- (iii) another line of the Chairman's choosing.

**Charter refs.** Chairman mandate — "Own the homepage and any pillar-page IA
change"; tier-escalation trigger "anything that changes the homepage above the
fold"; Amendments 2026-05-25 (layout amendment, palette unchanged); Amendments
2026-07-25 ruling 3 (v0 output is a mockup; placeholder copy must not survive
translation); SITE_ARCHITECTURE.md:281-301 and :343; SITE_ARCHITECTURE §5.4
append (italic display words removed).

**Why not defaulted.** The homepage is the one page the Charter names as the
Chairman's own. Only he can say whether 29 Aug superseded 8 May. The H1 is his
sentence. Writing SITE_ARCHITECTURE to match the page without a ruling would
launder a code comment into policy.

---

### R3 — Newsletter: launch it, or stop the chrome from promising it? (F-012; F-042, F-043)

**Question.** Does the Friday brief launch now (Buttondown configured, list
live), or does every "Join brief" CTA in the header, first mobile-overlay row,
footer and homepage band come down or change state until it does — and what is
the product called in chrome?

**What the audit found.** The primary chrome CTA on every route lands on
`/newsletter/`, which says the brief has not launched (F-012). "Join brief" is
a mystery label that wraps at 1280px (F-042). The homepage states launch-pending
three times while two CTAs still say "Join" (F-043). The fallback mailto is
indistinguishable from body text (F-022, proceeds regardless).

**Options.**

- **(a) Launch.** Configure the Buttondown env var; Technical Lead confirms
  double opt-in and the privacy page describes the processing; Growth &
  Analytics owns the list. Chrome then tells the truth with a label change
  only. T2 chrome + a privacy-posture check (a Technical Lead escalation item).
  Cost: commits the Chairman to the weekly Friday send named in his own
  operating rhythm — an editorial obligation, not a config change.
- **(b) Hold launch; make chrome honest.** Gate label and visibility on
  `newsletterLive`: hide the header pill and footer CTA until live; keep
  `/newsletter/` as a pre-launch page with the underlined mailto. Delete the
  hero micro block (F-043). T2 (Standards + UX + Chairman — header is above
  the fold on every route). Cost: loses the one acquisition CTA the site has,
  though it currently acquires nothing.
- **(c) Hold launch; keep a visible CTA, relabelled.** "Newsletter" or
  "Newsletter — launching soon". T2. Cost: still routes readers to a dead end;
  the honest-nav rule exists for exactly this.

**Label sub-ruling.** "Join brief" (product-name-first, needs the reader to
know what the brief is) versus "Newsletter" (job-first). Standards Editor
recommends "Newsletter"; the Chairman may want "Friday brief" kept as the
product name on the page and "Newsletter" in chrome.

**Charter refs.** Amendments 2026-07-27 ruling 4 (honest-nav: navigation may
only link to content that exists); Chairman mandate — homepage above the fold;
escalation paths — Growth & Analytics; Technical Lead → privacy/cookie posture;
Chairman operating rhythm ("read the Friday recap before it sends").

**Why not defaulted.** Launching a subscriber list creates a data-processing
obligation and a weekly editorial commitment. Taking the CTA down changes the
header on 199 routes. Neither is a session's call; the mechanical parts
(F-043 hero block deletion, F-042 `nowrap`, F-022 underline) are, and they
proceed.

---

### R4 — Calculators: one tool or two? (F-032; F-021)

**Question.** Do `/calculator/` (spend-return) and
`/salary-transfer/calculator/` (salary-transfer reward) stay two tools with
honest names and a nav slot each, or merge under `/salary-transfer/calculator/`
behind a mode switch?

**What the audit found.** Open since 22 August and still open on 29 August
(two sessions have deferred it). The 29 Aug rebuild gave `/calculator/` its
first nav link and mislabelled it "Welcome-bonus calculator" — a tool that
states on its own page it does not score welcome bonuses (F-021). One
salary-transfer product carries seven different labels across chrome (F-031,
proceeds regardless).

**Options.**

- **(a) Keep both; relabel; give `/calculator/` an honest nav slot.**
  "Spend-return calculator / See which card pays back most on your monthly
  spend" at index.astro:422-423 and :274-275; a nav row of the same name. T2.
- **(b) Merge.** One island under `/salary-transfer/calculator/` with a
  spend / salary mode switch; 301 `/calculator/`. T3 — route removal, redirect
  map, island rework. Cost: a slug rename after publish (Chairman-only) and a
  salary-transfer URL hosting a tool that has nothing to do with salary
  transfer.
- **(c) Keep both; relabel; no new nav slot.** Revisit when a welcome-offer
  break-even tool — a new brief — exists and the tools band has three honest
  entries. T2.

**Charter refs.** Chairman decision rights — slug renames after publish
(redirect map owned by Technical Lead); Amendments 2026-07-27 ruling 4
(honest-nav, applied to labels naming what they link to); 29 Aug audit §2.4
(known-open).

**Why not defaulted.** It has been defaulted twice already; that is why it is
still open and why a false label reached the homepage. The relabel (F-021) is
not contingent and ships this week whichever option is chosen.

---

### R5 — Hotel programmes: do they keep living under `/airlines/`? (F-030)

**Question.** Do Marriott Bonvoy, Hilton Honors and Accor ALL move out of
`/airlines/` — to a renamed `/programmes/` (all six programme URLs move) or a
new `/hotels/` (three move) — or do the URLs stay and only the nav label
"In the programme directory" is made honest?

**Options.**

- **(a) Rename `/airlines/` → `/programmes/`** (or `/loyalty/`) with 301s for
  all six current URLs in `public/_redirects`; update the programs collection
  base path, header arrays, footer "Programmes" column, sitemap,
  BreadcrumbList. T3. Cost: every programme URL changes; SEO equity on the
  airline set is put at risk to fix three hotel pages.
- **(b) Split by currency.** Airlines stay at `/airlines/`; hotel programmes
  move to `/hotels/` with three 301s. Mirrors the desk boundary ("currency
  governs") and the existing `/news/airlines/` / `/news/hotels/` split. T3,
  smaller blast radius, but it is a new top-level destination.
- **(c) URLs unchanged; fix the label and directory heading.** Nav row reads
  what it links to; `/airlines/` gains a "Hotel programmes" sub-heading. T2.
  Cost: the URL keeps telling readers and search engines that Bonvoy is an
  airline.

**Charter refs.** Chairman decision rights — slug renames after publish;
Chairman mandate — adoption of a new top-level vertical; Amendments 2026-07-27
rulings 1 and 4 (currency governs; honest-nav; de-scoped hotel programme rows
return only behind real briefs); SITE_ARCHITECTURE 2026-05-08 §3 ("no new
top-level destinations").

**Why not defaulted.** Slug renames after publish and new top-level routes are
both enumerated Chairman-only decisions. SEO Strategist proposes; the Chairman
rules; Technical Lead owns the redirect map.

---

### R6 — Schema: which §9 is canonical? (F-035)

**Question.** Is the written §9 structured-data spec the standard the 24
non-compliant templates must be brought up to, or is what ships the standard
and §9 is rewritten to match — or is a reconciled spec drafted first?

**Options.**

- **(a) Ship is canonical.** Rewrite §9 to describe current output; then add
  the items that need no ruling. T2 for the additions + a standards amendment.
  Cost: ratifies drift as policy.
- **(b) Spec is canonical.** Bring every template up to §9 with a
  schema-per-template test. T3 (touches every layout). Cost: largest
  implementation; some §9 entities may no longer match the site (e.g. author
  data must be `Organization` only under the 2026-08-05 byline exception).
- **(c) Reconcile first.** Technical Lead + SEO Strategist draft a reconciled
  §9 within the week; Chairman ratifies; implementation is T3 behind it.

**Proceeds regardless (no ruling needed, per the finding):** `CollectionPage` +
`BreadcrumbList` on the directories, `BreadcrumbList` on the tracker family,
fill or delete `sameAs`.

**Charter refs.** Chairman "does not freelance" — schema implementation is
Technical Lead's; Council table — SEO Strategist owns schema spec; Amendments
2026-08-05 (§8: structured author data is `Organization` only until a named
contributor is published); §6 (schema numerics come from L2, never
LLM-extracted); Charter amendment procedure.

**Why not defaulted.** §9 is house standard. Two candidate specs disagree, and
silently picking one is exactly how the drift happened.

---

### R7 — Security headers: does `public/_headers` ship, and with what in it? (F-041)

**Question.** Does the site adopt `public/_headers` now — and if so, the full
printed recommendation including HSTS and a report-only CSP, or a conservative
subset?

**Options.**

- **(a) Full recommendation.** X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy, X-Frame-Options, HSTS, report-only CSP; observe reports
  for two weeks before enforcing. T3 (Chairman + Technical Lead, per Part II).
  Cost: HSTS `max-age` is a commitment that is slow to walk back; a CSP report
  endpoint is a new outbound data flow (privacy posture); inline scripts — the
  theme toggle and F-007's proposed nav script — need hashes or nonces before
  enforcement.
- **(b) Static five, no CSP, short HSTS.** The four content/referrer/frame/
  permissions headers plus HSTS with a short `max-age` and no preload. Still
  T3, materially lower risk; CSP returns as a separate item once the inline
  script inventory is known.
- **(c) Defer to Q4** alongside the F-010 image pipeline work, which also
  touches every page's asset URLs.

**Charter refs.** Part II "Audit harness" ("`public/_headers` is still a
recommendation … adding it is a T3 production change"); Technical Lead
escalation — privacy/cookie posture; Chairman decision rights — changes
materially affecting hosting.

**Why not defaulted.** Named T3 in the Charter. HSTS has lock-in; CSP can
silently break the islands and the theme toggle; a reporting endpoint is a
privacy decision.

---

### R8 — Self-monitor: should the site watch itself through Firecrawl? (F-060)

**Question.** Is a Firecrawl monitor on dubaipoints.ae provisioned, and if so
before or after the credit-budget verification hold clears?

**Options.**

- **(a) Provision now** via `scripts/monitor/setup.mjs`. T3. Cost: F-020
  reports the key already carries 42 monitors at an API-estimated 20,920
  credits/month against a documented 5,000-credit plan, with fee-docs billing
  ~5× its estimate. Adding a monitor to a budget in verification hold is
  spending money nobody has counted.
- **(b) Defer until F-020 clears** (plan tier confirmed; ownership of the
  other 37 monitors established). Revisit with real numbers.
- **(c) Decline.** The deterministic audit harness (`npm run audit:all` in
  Actions) is the site's self-check at zero credits; a Firecrawl judge
  watching our own pages introduces an LLM opinion loop the §6 boundary was
  built to keep out of the pipeline.

**Charter refs.** Non-negotiable 2 (Firecrawl exclusive to the Research arm);
Part II "Monitoring" — budget paragraph and `MAX_ESTIMATED_CREDITS`; "The §6
boundary is the whole design"; Part II "Audit harness".

**Why not defaulted.** The user chose propose-only. Credits are money; the
budget is unverified; and it is a posture question whether the site should
monitor itself with the same tool it uses on issuers.

---

### R9 — Deals: does a three-deal desk keep a primary nav slot? (F-047; F-013 sub-question)

**Question.** Does the lifestyle desk commit to a deals cadence sufficient to
justify a primary nav slot, a homepage directory tile and a Travel-panel row
before the DSF season — or does `/deals/` leave the nav until it has volume?

**Options.**

- **(a) Commit the desk to a cadence** (≥ 6 live deals, a ceiling like the
  news desks' 2–3/week) under a brief, before DSF. Resourcing decision, not a
  code change; the nav stays.
- **(b) Drop the nav slot and the Travel row until volume.** The route, the
  homepage live-desk deals column and the RSS band stay. T2 chrome (Standards +
  UX + section editor + Chairman). Cost: the first time the site removes a
  vertical from primary navigation.
- **(c) Keep the slot; make the count honest** ("Deals · 3 live") and let the
  number argue for itself. T2.

**Sub-question (from F-013).** Expired deals: 301 to `/deals/` or keep as
dated records with an "Ended" banner? The house has a precedent — salary-
transfer offers move to a history collection and render a dated "ended"
sentence rather than vanish. The section editor can follow it, but the
Chairman should say so once so it is a rule, not a habit.

**Charter refs.** Chairman decision rights — adoption or removal of a
top-level vertical; Amendments 2026-07-27 rulings 1 and 4 (cadence ceilings;
honest-nav); Non-negotiable 1 (DSF enters the calendar by default).

**Why not defaulted.** Removing a vertical from navigation is Chairman-only;
committing a desk to a cadence is a resourcing decision between Managing
Editor and Chairman. A session can do neither.

---

### R10 — Valuations: fulfil the Q3 promise or retract it? (F-018)

**Question.** Do floor/ceiling valuations land for the ten programmes before
the 30 September methodology promise expires, or are the three empty columns
cut and the promise re-dated or withdrawn?

**What the audit found.** Three of seven columns are dashes on every row. The
methodology page promises them "in Q3". The ten baselines cross 90 days on
8 September — tomorrow — so the staleness chip goes amber whichever way this
is ruled.

**Options.**

- **(a) Fulfil.** Fact-Checker derives floor/ceiling for all ten under the
  2026-06-12 baseline ruling (cost-basis fils values; cash-fare-avoidance
  figures labelled, never the baseline; every number traceable, no LLM
  extraction). T3 — the first published valuation ranges are precedent-setting
  in the same way the 2026-05-25 amendment treated the first card-review
  score. Cost: three weeks of Fact-Checker time against a hard date.
- **(b) Cut the columns; re-date the promise** to Q4 with one honest sentence
  on why. T2 (Standards + UX + section editor + Chairman). Cost: a public
  commitment slips, visibly.
- **(c) Cut the columns; withdraw the promise;** log it in the corrections
  record. T2. Cost: retraction of a stated commitment — honest, and in keeping
  with the 2026-06-12 ruling 3 posture (claim only what the site can
  demonstrate).

**Regardless of ruling:** Fact-Checker re-verifies the ten baselines this week
(a re-verification, not a re-derivation — T1 `lastVerified` bumps where the
source is unchanged).

**Charter refs.** Amendments 2026-06-12 ruling 2 (baseline) and ruling 3
(trust posture); Non-negotiable 6 (§6 typed numerics); Part II editorial
guarantees (90-day freshness); Chairman "does not freelance" — never overrule
the Fact-Checker without a logged paragraph; Amendments 2026-05-25 (first
score returns to the Chairman).

**Why not defaulted.** A dated public promise is editorial posture; whether the
site keeps, moves or withdraws it is the Chairman's word to readers.
Publishing valuation ranges for the first time sets precedent. And the ruling
has a real deadline: if (a) is to be possible it must be given this week.

---

## 2. Publish-blocking for the next deploy

**Blocking:** **F-001**, **F-002**.

- **F-001** — main has been unbuildable since 1 September; production is the
  30 August artefact. The fix is already on the branch
  (`src/lib/salaryTransferCoverage.ts`, `getLapsedUnarchivedOffers()`, five
  tests). Everything else in this audit reaches a reader only after this
  merges.
- **F-002** — the RAKBANK salary-transfer offer ended 31 August and is shown
  as live on the tracker, the homepage live desk, the RAKBANK page and — the
  part a reader can act on — ranked in the calculator. A reader could move
  their salary for a reward that no longer exists. That is the false statement
  test met squarely. The archive move (`salaryTransferOffers` →
  `salaryTransferOfferHistory`, `archived: true`, reason "campaign ended
  31 Aug 2026") ships in the same PR as F-001; the build warns until it does.

**Same day, not blocking:** **F-017** (four 31-August news stories in the
future tense). It is a false tense with the date visible, not an actionable
product claim, and holding the P0 for two desks' edits would keep F-002 live
longer. It is the next PR behind the hotfix, today.

**Considered and not blocking:** F-021 (mislabelled tile — reader discovers
the mismatch on the next page, no financial claim); F-014 (build-month stamps
imply verification — see gate line 3, it is first in the week's queue because
the hotfix deploy will restamp pages "September 2026"); F-023 (mooted by
F-002 for now); F-016 (dead citations are not false statements; six 404s go in
the T1 batch, the rest are on verification hold).

**Tier and sign-off for the hotfix PR.** T2, not T1: the hotfix renders a new
dated "ended" sentence, and new chrome strings under-tier a T1 by the
Charter's own rule. Required: business-realestate editor, Head of UX, Standards
Editor, Chairman. Technical Lead lists in the PR body everything merged to main
since 1 September — it all deploys with this and the Chairman should know what
lands.

---

## 3. Gate note — 7 September 2026 (same-day rubric)

1. **Ships now (P0 hotfix, one PR, T2):** F-001 + F-002 together, build
   warning-free; the PR body lists everything merged since 1 Sept because it
   all deploys; nothing else rides. Approval is on the Chairman's word
   in-session.
2. **Today, next PR behind it (T1 batch, section editors + Chairman):** F-017
   four 31-Aug stories bumped or archived; F-009, F-011, F-015, F-028, F-036,
   F-037, F-045, F-046; F-016's six confirmed 404s.
3. **Within the week (one T2 PR per owner; Standards + UX + section editor +
   Chairman):** F-014 first — this deploy restamps pages "September 2026"
   without re-verifying anything — then F-003, F-004 (gold-ink is a
   within-family shade), F-007, F-008, F-019, F-021 relabel, F-022, F-023,
   F-024, F-025, F-026, F-031, F-043, F-040 spacing only, F-044, F-053,
   F-055; Fact-Checker re-verifies the ten valuation baselines (cross 90 days
   tomorrow).
4. **Verification holds report back by Wednesday 9 Sept before anything
   spends credits:** F-020 (Technical Lead: plan tier, whose 37 monitors,
   fee-docs billing) and F-048 (Growth: Search Console); F-060 does not move
   until F-020 clears.
5. **Waits for rulings R1–R10, due Friday 11 Sept:** F-005/F-006, F-033/F-052
   (+ F-040 wording), F-012 (+ F-042 label), F-032, F-030, F-035, F-041,
   F-047 (+ F-013 archive rule), F-060, F-018 — F-018 cannot slip past Friday
   if fulfilling the 30 Sept promise is to remain an option; T3 work (F-010
   image derivatives, F-034's §9 title ceiling, whatever R2/R5/R6/R7 produce)
   queues behind via `/council`.

— Chairman, 7 September 2026.
