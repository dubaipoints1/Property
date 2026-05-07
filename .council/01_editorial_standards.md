# Editorial Standards — dubaipoints.ae

_The non-negotiable house style. Every Council member writes against
this; the Fact-Checker enforces it; the Chairman has waiver authority._

---

## 1. Currency and pricing

- **AED is the primary currency on every page.** Always.
  - Format: `AED 1,500` (space, no decimal unless cents matter).
  - For an international audience, append USD in parentheses on first
    mention only: `AED 1,500 (~USD 408)`. Never lead with USD.
  - Convert at the day's mid-market rate via `xe.com` or the Central
    Bank of the UAE published rate; cite the rate and date in the
    article footer when it materially affects the recommendation.
- **AED prices in tables use tabular figures.** `font-feature-settings:
  "tnum"` is set in `.dp-data-table`; do not override.
- **No "K" or "M" abbreviations in prices.** `AED 1,500,000`, not
  `AED 1.5M`. Headlines are exempt only when space is binding.
- **Per-period pricing must be explicit.** `AED 525 / year` not
  `AED 525*` with a footnote.
- **Loyalty currencies are written out on first mention**: "30,000
  Skywards Miles", then "30,000 Miles" or "30k Miles" thereafter.
  Never invent units — match the issuing programme's own naming.

## 2. UAE proper nouns and place names

- Spell Dubai neighbourhoods per the RTA convention: **Jumeirah**, **Al
  Barsha**, **Business Bay**, **Downtown Dubai**, **Dubai Marina**.
- Acronyms only after first full mention. **Jumeirah Lake Towers
  (JLT)**, then JLT. Same for **DIFC**, **DMCC**, **JAFZA**, **DLD**,
  **DET**, **RTA**, **DEWA**, **DHA**.
- Emirates are **Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras
  Al Khaimah, Fujairah** — written in full on first mention. **RAK** is
  acceptable thereafter.
- Bank short names: **FAB**, **ENBD**, **ADCB**, **DIB**, **CBD**,
  **ADIB**, **RAKBANK** (one word, all caps). Always spell out on first
  mention.
- Airline programmes: **Emirates Skywards**, **Etihad Guest**, **Qatar
  Privilege Club** (Avios as the currency since 2022 transition),
  **Saudia Alfursan**.

## 3. Dates

- **Body copy:** `2 March 2026` (day-month-year, no comma).
- **Religious / cultural pieces:** dual dating where relevant —
  `15 Ramadan 1447 / 2 March 2026`.
- **Frontmatter / data:** ISO 8601 — `2026-03-02`. Zod's
  `z.coerce.date()` accepts this.
- **Last-verified dates** appear in card review footers as `Last
  verified: 2 March 2026`. The UI flags anything older than 90 days.
- **Date ranges** use an en dash: `2 March – 14 April 2026`. No
  hyphen.

## 4. Audience segments

We write for three distinct readers; never blur them:

1. **UAE residents (expat dominant).** Default audience for cards,
   salary-transfer, banking, real estate, schooling, healthcare. Assume
   AED salaries, UAE bank accounts, residency visa.
2. **GCC neighbours.** Saudi/Kuwait/Qatar/Bahrain/Oman residents who
   visit Dubai for tourism, shopping, medical, property. Pricing in AED
   first, with mention of regional convertibility where useful.
3. **International tourists.** Short-stay visitors. AED-first; USD in
   parentheses on first mention; visa rules and entry requirements
   front-loaded.

If a piece serves more than one segment, say so explicitly in the lede.

## 5. Sourcing

- **Every numerical claim** (fee, salary band, transit time, occupancy
  cap, visa fee) must be traceable to a primary source. Primary sources
  are bank `*.ae` pages, government portals (`gov.ae`, `mohre.gov.ae`,
  `dxb.com`, `visitdubai.com`, `dlds.dubai.gov.ae`), official airline
  loyalty terms, or an official PDF (Schedule of Charges, KFS).
- **Wikipedia is never a primary source.** Acceptable as a starting
  point, never as the citation.
- **Login-walled content is off-limits.** Do not scrape, do not
  paywall-bypass, do not summarise content gated behind authentication.
- **Date-stamp every claim.** Pricing changes; visa rules change;
  loyalty programme partners change. The Fact-Checker assumes anything
  unstamped is stale.
- **Affiliate or sponsorship disclosure** appears above the fold on
  the article, not in a footer link. Format: a single italic line —
  `_This article may contain affiliate links. We never receive payment
  for recommendations; the link only earns commission after you
  qualify and are approved by the issuer._`

## 6. Voice and tone

- **HfP-dry, evidence-led.** Skeptical of marketing copy; comfortable
  saying "this card is bad", "this offer rarely pays out", "the
  clawback terms make this hostile". Avoid exclamation marks. Avoid
  superlatives without quantification.
- **No orientalist tropes, ever.** Not "exotic", not "mysterious East",
  not "Arabian nights", not "oasis in the desert", not pyramids or
  camels metaphor unless the article is literally about them. The UAE
  is a country with cities, finance, schools, and traffic — write it
  that way.
- **Avoid lazy "luxury" framing.** Dubai is not a synonym for luxury,
  and not every reader is in the AED 50k+ band. Lead with the band the
  product targets, not with prestige cues.
- **British English** for fixed terms (programme, organisation,
  cheque, behaviour). Banking copy uses American spelling where the
  product itself does (e.g. "Bank of America" stays American). When in
  doubt, match the issuing institution.
- **Active voice, short sentences, low Latinate density.** Aim for a
  Flesch reading-ease score in the 50–60 band on review copy and 60–70
  on guide copy. The Fact-Checker scores a sample.

## 7. Numbers and units

- **Numerals from 10 onwards; words for one through nine** in body
  copy. Numerals in tables and headings.
- **Distances:** kilometres for ground, nautical miles only when
  referencing aviation. `45 minutes by car / 32 km from DXB`.
- **Times:** 24-hour for facts (`14:30`), 12-hour for editorial flow
  (`2:30 pm`). Pick one per article and stick with it.
- **Percentage signs** are tight: `5%` not `5 %`.

## 8. E-E-A-T discipline

Google's Experience-Expertise-Authoritativeness-Trustworthiness
heuristic shapes every byline:

- **Author bylines are real.** A council member name only — no "Dubai
  Points Editorial Team" stand-ins. The byline links to the council
  member profile under `/team/` showing credentials, residence
  history, and beats.
- **First-person experience is allowed and encouraged.** "I tested the
  Skywards Silver lounge at DXB Concourse B in March 2026" beats "the
  Silver lounge offers...". Tag clearly when the author has not
  personally tested a claim.
- **Disclose conflicts.** If the author holds the card under review,
  banks at the institution under review, or has been hosted by the
  property under review, disclose above the fold.
- **Last-verified date** is a trust artefact, not a footer
  decoration. Update it when you confirm; never copy it forward
  without verification.

## 9. Schema.org and metadata

Per the Technical Lead's specification, every published page emits the
appropriate JSON-LD:

- **Card review:** `Article` + `Review` + `BreadcrumbList`.
- **Guide:** `Article` + `FAQPage` (when an FAQ block exists) +
  `BreadcrumbList`.
- **Deal:** `Article` + `Offer` + `BreadcrumbList`.
- **Programme page:** `Article` + `BreadcrumbList`.
- **About / team:** `Organization` + `Person` for council bylines.

Meta title patterns:

- Card review: `[Card] Review (Month Year): [One-line verdict] | DubaiPoints`
- Guide: `[Topic]: A [Year] Guide for UAE Residents | DubaiPoints`
- Deal: `[Brand] Deal UAE — [Month Year] | DubaiPoints`
- Programme: `[Programme] Guide: Earn, Redeem, Transfer | DubaiPoints`

## 10. Things that get a piece killed at the Chairman gate

- A figure without a primary source.
- A `lastVerified` date older than 90 days at publish time.
- An affiliate link without inline disclosure above the fold.
- An orientalist headline or framing.
- A recommendation that contradicts a card's own KFS without an
  explicit explanation.
- A claim about a UAE regulation (visa, banking, real estate) that
  cannot be traced to the relevant authority.
- A loyalty-programme calculation using stale earn rates or pre-
  transition currencies (e.g. Qatar Privilege Club Qmiles instead of
  Avios).
- An LLM-extracted typed numeric (per CLAUDE.md LLM-extraction policy).

End.
