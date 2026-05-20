---
session: chairman-gate-phase-1
brief: card-data-audit-and-ui-programme
stage: 7
date: 2026-05-20
chair: chairman
verdict: approved
prs-in-scope: [112, 113, 114, 115]
---

# Chairman gate — Card data audit & UI programme

## 1. Verdict

**Approved.**

Phase 1 publishes. All four refusal triggers in the brief's
"Acceptance for the Chairman gate" section are clean. The data
audit is verifiable against the dossier on spot-check; the UX
Stage 5.5 fixes the Head of UX called P0/P1 have landed; the
Standards copy edits are in; Fact-Check passed post-redline.

This is the most substantive single programme on the site since
the Claude Design rollout. It earns the gate.

## 2. Per-trigger check (the brief's own four)

| # | Trigger | State | Verdict |
|---|---|---|---|
| 1 | Any `_provenance` map still has `scraped` entries on audited fields. | 0 / 582 provenance entries are `scraped`. Distribution: 418 editor-confirmed, 138 editor-corrected, 26 needs-review. | **Clean.** |
| 2 | Compare/finder pages don't pass Head of UX Stage 5.5. | Stage 5.5 verdict is `pass-with-edits`; Fix #1–#8 landed in PR #114; Fix #9 (SSR-rank) deferred per brief frontmatter; Fix #10 (no-action per UX) absorbed. | **Clean.** |
| 3 | Any AED figure on a card page disagrees with the audit dossier. | Spot-checks: FAB Elite minSalary now AED 40,000 (was 1,200) matches dossier swap-fix; Diners Club `network: "Diners Club"` matches dossier banner finding #2; Marriott Bonvoy World Elite welcome bonus `spend_threshold_aed: 55,000` (≈ USD 15,000) matches dossier per-card entry §16. | **Clean.** |
| 4 | Council sign-off block missing or incomplete in the PR. | Brief frontmatter carries the equivalent stage statuses: tech-status complete, ux-stage-5-5-status pass-with-edits, factcheck-status pass, standards-status pass-with-edits, chairman-status flipping to approved on this document. PR #114 carries the Council sign-off block; #115's body covers the follow-throughs. | **Clean.** |

## 3. Rulings on Standards' four open questions

### Q1 — Tagline regex decimal-clip risk

**Ruling: ticket as a follow-up; do not block.**

The current regex `/^[^.!?]+[.!?]/` in `SpecCard.astro` would clip
"earn 2.5x on dining" between "2" and "5x". Standards verified
none of the 7 sampled cards hit this; my own scan of the live
`editorTake` corpus didn't surface a hit either. But this is a
landmine — the moment an editor writes "2.5×" or "1.99% FX" in
the first sentence of an `editorTake`, the tagline truncates
silently. Tech Lead to open a low-priority ticket for the
tighter pattern `/^[^.!?]+[.!?](?:\s|$)/` and ship in the next
T1/T2 PR that touches the file. No standalone PR required; it
piggybacks the next change.

### Q2 — First-person "we" voice on tool-page leads

**Ruling: keep "we".**

The finder and compare pages must read as publication artefacts
(this is exactly the "comes back" lever in the brief). "Tell us
what you spend on and we'll rank the 34 UAE credit cards in our
database" is the publication's voice on a tool, not a SaaS form's
voice on itself. Strip it to third person and the page reads like
any other comparison aggregator on the open web; that is precisely
the register we are working to *not* be in. The "we" stays.

Standards is correct that house style for review prose is third
person — that does not extend to tool-page introductions, where
first-person plural is the editorial framing. I am adding this
explicitly to the standards register the next time
`01_editorial_standards.md` is amended: **tool-page leads and
methodology paragraphs use first-person plural; review prose
does not.** Standards Editor: please log this for the next
amendment cycle.

### Q3 — "Any employment" chip when `employmentTypes` includes `"any"`

**Ruling: omit the chip entirely when value is `"any"`.**

"Any employment" rendered as a constraint chip reads as a
constraint — which is the opposite of its semantic. The absence
of a constraint is the absence of a chip. Tech Lead to add a
guard in `EligibilityChips.astro` line 38:

```
for (const t of eligibility.employmentTypes ?? []) {
  if (t === "any") continue;
  qualifiers.push(EMPLOYMENT_LABELS[t] ?? t);
}
```

T1 fix. Should ship in the same follow-up PR as Q1's regex
tighten. Does not block this gate; the current state is mildly
odd, not wrong.

### Q4 — Stats-strip label parity (compare: "Cards covered" vs finder: "Cards in database")

**Ruling: standardise on "Cards covered".**

"Cards in database" leaks the implementation underneath the
publication. "Cards covered" reads as editorial scope ("here is
what this publication covers"), which is the framing that holds
across both the tool-page stats strip and any future hub-page
banner. Tech Lead to rename in `src/pages/cards/finder/index.astro`
line 121. T1 fix. Same follow-up PR as Q1 and Q3.

## 4. Brand-voice observations

Two notes the Standards pass didn't catch — neither blocking:

1. **The SpecCard tagline fallback string format ("5× on Dining —
   AED 525 a year.") is dry to the point of mechanical** when the
   MDX `editorTake` is absent. Readable, not memorable. Once the
   MDX corpus is fuller — i.e. once Phase 2 banks have editorial
   layers — the fallback will rarely fire and this becomes moot.
   No action this gate. Section Editor: keep the fallback in mind
   as you commission MDX prose for the 14 cards that don't yet
   have an `editorTake`.

2. **The `welcomeBonus.notes` field on Marriott Bonvoy World Elite
   is 261 characters of dense prose** ("100,000 Marriott Bonvoy
   points on activation + joining fee payment, plus 100,000 bonus
   on USD$15,000 spend in first 3 billing statements. Automatic
   Gold Elite status + fast track to Platinum. 15 Elite Night
   Credits/year. 1 Free Night Award (50,000-point value) on
   anniversary."). This will render in `WelcomeBonusCallout.astro`
   and will overflow the callout's design budget at narrow widths.
   Not a gate-blocker; the callout still functions. Phase 2 should
   commission a one-line `welcomeBonus.headline` field (≤ 90 chars,
   reader-eye magnet) with the long `notes` field demoted to a
   collapsible "fine print" disclosure underneath. Add to the
   schema-additions list below.

## 5. Phase 2 directive

The operator's bar — **"all UAE banks, big or small"** — is on. I
ratify it. The Managing Editor is to open a Phase 2 brief track on
the strength of this gate, structured as follows.

### Priority order

The dossier's three-phase plan is the right shape. Confirmed:

- **Phase 2a (next sprint)** — Mashreq, ADIB, DIB, RAKBank,
  Emirates Islamic, ADCB. Friendly + friendly-medium Firecrawl
  profiles per `firecrawl-bank-urls.md`. Estimated 40–60 net new
  cards. **Single brief per bank**, not one brief for all six —
  each bank's KFS PDF + product-page pull is a discrete unit of
  research and deserves its own dossier.
- **Phase 2b (sprint+1)** — CBD, HSBC, Standard Chartered UAE,
  Citibank UAE. JS-rendered pages may need Firecrawl `actions`;
  this is a Head of Research call per bank.
- **Phase 2c (sprint+2)** — Liv, Mashreq Neo, Wio, UAB, SIB, Ajman.
  Mobile-app-first products. Press-release sourcing may be
  primary here; flag any card where the bank does not publish a
  product page at all, and decide on a case-by-case basis whether
  it carries enough public-source weight to enter the dataset.

### Schema-additions calendar

Three schema additions surfaced in the dossier are sequenced into
Phase 2:

1. **`joiningFee?: { amount: number; currency: "AED" }`** — ship
   in Phase 2a's first PR. Affects Skywards Infinite, Marriott
   Bonvoy World Elite, U by Emaar Infinite, dnata World, Etihad
   Inspire and likely many Phase 2a cards. Tech Lead owns; T3
   tier (Zod schema change).

2. **`eligibility.invitationOnly?: boolean`** — ship in Phase 2a.
   FAB World Elite is the single current case; Phase 2 will
   surface more (HSBC Premier Mastercard Black; Citibank Prestige;
   likely Mashreq Solitaire). T3 tier.

3. **`discontinuedForNewApplicants?: { date: string; note: string }`**
   — ship in Phase 2a. Manchester United is the case; ENBD's
   apparent rationalisation of affinity products suggests this
   field will see more use through 2026. T3 tier.

The fourth schema gap from the dossier — `minMonthlySpend` on
earn-rate categories — is **deferred to Phase 2b**. It's a
genuine reader-protection field (the Duo 5% earn that needs AED
5k/mo is currently invisible in the matcher's ranking) but the
schema change is heavier (touches the discriminated union of
`_features`) and the brief queue should not block on it. Phase 2a
captures these constraints in `_caps.min_monthly_spend_to_qualify_aed`
free-form until Phase 2b types it properly.

The fifth gap — `network` as a tuple — is **deferred indefinitely**.
Duo is currently the only dual-network product; the matcher
treats it as a string "Diners Club + Mastercard" and that works.
Re-open if a second dual-network product enters the dataset.

### `welcomeBonus.headline` field (added to the Phase 2a schema work)

Per brand-voice observation §2 above: add an optional
`welcomeBonus.headline?: string` (max 90 chars) for the reader-eye
magnet, with the existing `notes` field demoted to "fine print".
Tech Lead + Standards Editor jointly own the spec.

### Scope guardrails

- **No affiliate links in Phase 2.** Disclosure policy unchanged.
  Phase 2 is data + UI scaling, not monetisation onboarding. A
  separate brief opens that conversation in Q3 if at all.
- **Phase 2 dossiers follow the post-completion pattern** — a
  banner-findings summary, per-bank table, T&C-gotcha capture,
  per-card entries. The Phase 1 dossier is the template.
- **Each Phase 2 PR carries the Council sign-off block** per
  CLAUDE.md §"PR body template". Under-tiering at the gate will be
  flagged; expect every Phase 2 PR to be T3.
- **The `firecrawl-bank-urls.md` file** becomes load-bearing
  documentation through Phase 2 and should not be amended without
  Head of Research sign-off. Friendly/medium/hard ratings are the
  Council's institutional memory for which CDNs cooperate with
  Firecrawl on which day.

### Sequencing note for the Managing Editor

Open the Phase 2a brief on **2026-05-27** (Phase 1 publish date)
or shortly after. Phase 2a's research dossier should ship within
2 weeks of brief-open; the UI workstream can run in parallel
because the L2 schema is now stable through the three Phase 2
additions named above.

## 6. Sign-off

The brief frontmatter is flipped to `chairman-status: approved` on
the strength of this document. PRs #112–#115 are merged and Phase
1 publishes against `target-publish: 2026-05-27`.

Two follow-up tickets are on the Tech Lead's bench:

- **Ticket A (T1):** combined fix — tagline regex tighten
  (Q1) + omit "any" employment chip (Q3) + label parity rename to
  "Cards covered" (Q4). Single PR, T1 tier (section editor +
  Chairman sign-off), targeting next deploy window.

- **Ticket B (T3):** Phase 2a schema additions — `joiningFee`,
  `eligibility.invitationOnly`, `discontinuedForNewApplicants`,
  `welcomeBonus.headline`. Full council sign-off; opens with the
  Phase 2a Mashreq brief.

— Chairman, 2026-05-20.
