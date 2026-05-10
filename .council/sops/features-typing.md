# SOP — Typing `_features` from `_scraped_freetext.perks`

**Owner**: Managing Editor (Stage 6 of `02_workflow.md`).
**Tier**: T1 (typing one card's features) / T2 (a bank's worth at once).
**Charter constraints**:
- §6 LLM-extraction policy — typed numerics (e.g. `cover_aed`, `discount_pct`,
  `visits_per_year`) **must** come from the bank's primary source, never
  from an LLM. The SOP below explicitly forbids LLM-typing.
- §2 Firecrawl exclusivity — re-pulling a source for verification routes
  to Head of Research.

## Why this SOP exists

The L2 schema in `src/lib/cardsData.ts` defines a typed 14-variant
discriminated union (`_features`) for card benefits. The matcher reads
**only** this typed array; the free-text `perks[]` is a fallback for
benefits not yet typed. Today, **0 of 25 cards have populated `_features`**.
Every reader-facing perk filter (lounge access, cinema BOGO, golf
discount, etc.) is blocked until this gap closes.

The scraper writes free-text perks to `_scraped_freetext.perks`. The
editor reads those, types them into the 14-variant `_features` array,
and marks the field `editor-confirmed` in `_provenance`.

## When to invoke

- **New scrape lands** — a `propose-changes.ts` PR opens a new card or
  refreshes an existing card's `_scraped_freetext.perks`. Editor types
  features before approving the PR.
- **Backfill sprint** — bulk-typing the 25 existing cards over a
  scheduled editorial week (Stage 3 of the Q3 plan).
- **Drift refresh** — quarterly, sample one card per bank; re-read
  `_scraped_freetext.perks` against current bank product page; update
  `_features` if the bank's offer changed.

## Process — single card

1. **Read the source.** Open the card's `cards.json` entry. Look at:
   - `_scraped_freetext.perks` — raw bullet text the scraper found
   - `sources[]` — the URL(s) the scraper read from
   - `kfsUrl` — the Key Facts Statement PDF
2. **Open the bank's live product page** in a separate tab. Verify the
   scraper's free-text matches what's currently published. If the bank
   page disagrees, flag the field as `needs-review` in `_provenance`
   and route to Head of Research for a fresh Firecrawl pull.
3. **For each perk in the free-text**, decide which of the 14 typed
   variants applies. See the variant cheatsheet below.
4. **Append a typed entry** to `_features[]`. Required fields per
   variant are non-negotiable (Zod will reject the PR otherwise);
   optional fields are populated when the source is explicit.
5. **Update `_provenance`**: set `_provenance["_features"] =
   "editor-confirmed"`. If you confirmed the source line by line, also
   bump `_lastReviewed` to today's date.
6. **Mark dropped free-text**: when a perk in `_scraped_freetext.perks`
   has been fully typed, leave the free-text in place (it's the audit
   trail) but ensure the typed `_features` entry covers the same scope.
7. **Editor's call**: don't invent. If the bank page is ambiguous,
   leave the perk in free-text only and flag the typed gap in the PR
   body. Future-you (or another editor) types it after a primary-source
   re-confirm.

## The 14 variants — cheatsheet

For each variant: trigger phrases in free-text → required typed fields.

### 1 · `cinema_bogo`
- **Triggers**: "1+1 cinema", "buy-one-get-one VOX", "free movie ticket
  every Tuesday", "BOGO at Reel"
- **Required**: `operator` (string — "VOX", "Reel", "Roxy"), `max_per_month`
  (`number` or `"unlimited"`)
- **Optional**: `fb_discount_pct`, `min_monthly_spend_aed`, `notes`
- **Editor judgement**: cinema "free ticket" with a min-spend requirement
  → set `min_monthly_spend_aed`. "Unlimited" or "every visit" → set
  `max_per_month: "unlimited"`.

### 2 · `entertainer_bogo`
- **Triggers**: "The Entertainer membership included", "Entertainer Premium",
  "free Entertainer subscription"
- **Required**: `program` (defaults to "The Entertainer")
- **Optional**: `scope` ("unlimited" | "limited"), `notes`
- **Editor judgement**: card-tier-locked entitlements → `scope: "limited"`
  with `notes` explaining; full membership → `scope: "unlimited"` (default).

### 3 · `lounge_access`
- **Triggers**: "DragonPass", "Priority Pass", "Marhaba lounges",
  "complimentary airport lounge", "X visits per year"
- **Required**: `network` (string), `scope` (`"unlimited"` or
  `{ visits_per_year: <number> }`)
- **Optional**: `geo` (defaults to `["UAE"]`), `notes`
- **Editor judgement**: "free lounge access" with no number = `unlimited`.
  Explicit count ("8 visits") = `{ visits_per_year: 8 }`. Geographic
  scope ("global lounges") = `geo: ["global"]`.

### 4 · `hotel_discount`
- **Triggers**: "20% off Address hotels", "Atlantis stay discount",
  "MAF F&B discount"
- **Required**: `operator`, `discount_pct`
- **Optional**: `scope` (free-text qualifier — "F&B only", "stays only")
- **Editor judgement**: separate F&B and stay percentages → file two
  features. Single percentage covers both → one feature with
  `scope: "stays + F&B"`.

### 5 · `hotel_earn_boost`
- **Triggers**: "earn 5x at Marriott", "10% bonus on Hilton stays"
- **Required**: `operator`, `earn_pct`
- **Editor judgement**: this is points-on-top, distinct from
  `hotel_discount` (which is cash off).

### 6 · `golf`
- **Triggers**: "X% off golf", "complimentary green fees at Y courses"
- **Required**: `discount_pct`
- **Optional**: `courses_count`, `scope` ("UAE" default | "global")
- **Editor judgement**: "complimentary" = 100% discount. Specific course
  count given → set `courses_count`.

### 7 · `status_match`
- **Triggers**: "Skywards Silver year one", "Etihad Guest Gold tier
  upgrade", "U by Emaar Platinum status"
- **Required**: `program`, `tier`
- **Optional**: `duration` ("year_one" default | "ongoing")
- **Editor judgement**: KFS that says "first year only" → `year_one`.
  Permanent grant tied to card tier → `ongoing`.

### 8 · `insurance_life`
- **Triggers**: "AED 500,000 life cover", "free life insurance"
- **Required**: `cover_aed` (must be exact AED value from the source)
- **Editor judgement**: never round. If the bank says "up to AED 500,000",
  set `cover_aed: 500000`.

### 9 · `insurance_travel`
- **Triggers**: "complimentary travel insurance", "trip cancellation
  cover", "lost-baggage cover"
- **Required**: nothing structurally; `scope` is the only field and
  is optional.
- **Editor judgement**: this variant is a flag — its presence means the
  card has *some* travel-insurance benefit. Specific limits go in
  `notes`.

### 10 · `concierge`
- **Triggers**: "24/7 concierge", "Visa concierge", "Mastercard concierge"
- **Required**: nothing; `scope` defaults to `"24/7"`
- **Editor judgement**: business-hours-only concierge → `scope:
  "business_hours"`.

### 11 · `transit_card`
- **Triggers**: "tap to ride RTA", "linked Nol functionality",
  "auto-pay Salik"
- **Required**: `networks` (array — pick from `Nol`, `Salik`, `RTA bus`,
  `Dubai Ferry`, `RTA parking`)
- **Editor judgement**: only set what the bank explicitly enumerates.
  Don't infer (e.g. "Nol-enabled" doesn't mean RTA bus is included
  unless the bank says so).

### 12 · `valet`
- **Triggers**: "free valet at Dubai Mall", "complimentary valet at
  Mall of the Emirates"
- **Required**: `location` (string)
- **Editor judgement**: list each location as a separate feature when
  the bank lists them separately; combine into one with `scope` only
  when the bank phrases it as a category ("any participating mall").

### 13 · `roadside_assistance`
- **Triggers**: "roadside assistance", "puncture cover", "tow service"
- **Required**: nothing; `scope` defaults to `"uae"`
- **Editor judgement**: "GCC roadside" = `scope: "gcc"`. International =
  `scope: "global"`.

### 14 · `travel_desk_discount`
- **Triggers**: "X% off flights via Y travel desk", "holiday booking
  discount"
- **Required**: `flights_pct`, `holiday_pct`
- **Optional**: `desk_name`
- **Editor judgement**: this variant is for partner-travel-desk
  bookings, NOT general airline earn rates. If the bank just earns
  more miles on travel spend, that's an `earnRates.travel` value, not
  a `_features` entry.

## What's NOT a `_features` entry

- **Earn rates** — those go in `earnRates.<category>` (typed numbers).
- **Welcome bonus** — that's the `welcomeBonus` field (structured object).
- **Annual fee waivers** — `annualFeeWaiver` (structured object).
- **Generic marketing fluff** — "world-class service", "premium
  benefits", "tailored for you". Drop these from `perks[]` after the
  scrape; they shouldn't appear in either layer.
- **Eligibility nuance** — "Premier customers only", "Sharia compliant".
  Use `sharia: boolean` (Stage 1) or `eligibility.documents[]` for
  doc requirements.

## Provenance discipline

- After typing, **always** set `_provenance["_features"] = "editor-confirmed"`
  in `cards.json`. Without this, the matcher treats the field as
  potentially scraped and may filter the card from features-based
  queries.
- If you typed against the bank's product page **today**, also bump
  `_lastReviewed` to today's date. The schema requires this field as of
  Stage 1.
- Keep `_scraped_freetext.perks` in place — it's the audit trail. If
  scraper output changes the free-text and your typed `_features` was
  derived from the prior version, the next propose-changes PR will show
  the diff and you re-confirm.

## Council sign-off in the PR

When typing `_features` for a card or a bank's worth of cards, the PR
body must carry:

```markdown
## Council sign-off

**Tier**: T1 (single card) | T2 (bank batch)
**Brief**: .council/sops/features-typing.md

| Role | Status | Notes |
|---|---|---|
| Section editor | pass | Typed N features across M cards. |
| Standards Editor (Stage 6.5) | n/a | No reader-facing copy change. |
| Fact-Checker (Stage 6) | pass | Each typed feature confirmed against `sources[]`. |
| Chairman (Stage 7) | **approved** |  |
```

## What this SOP deliberately does NOT do

- **Does not authorise LLM typing.** Charter §6 forbids LLM for typed
  numerics. Asking an LLM "what kind of feature is this perk?" is
  forbidden — the editor reads the source, decides, and types.
- **Does not require typing every free-text perk.** Some bank perks
  don't fit any of the 14 variants. Leave them in `perks[]` only and
  surface a "consider new variant" note in the PR for council review.
- **Does not invent units.** The `REWARD_UNIT` enum (15 values) is
  closed; new currencies require a Charter amendment.

End.
