# Fact-check log: motoring taxonomy — PR #309

_Session: `.council/sessions/2026-08-05-motoring-taxonomy.md`._
_Brief: `.council/briefs/2026-08-05-uae-car-running-costs-guide.md`._
_Dossier: **none exists** (`.council/research/2026-08/` holds only
`monitoring-design.md`)._
_Draft: `src/content/guides/expat-starter-car-costs.mdx`._
_Checked: 2026-08-05 by fact-checker._

## Verdict

**FAIL.** Three §10 kill-list hits. Every individual number in the
guide is correct; the guide is nonetheless wrong, because it presents
correct numbers in an order and with a recommendation that our own L2
layer contradicts. This is a one-hour fix, not a re-source — see
"Remediation" at the foot.

---

## 1. Card figures — all four verified against L2

`src/data/cards.json` is the authoritative layer. Every quoted pair
matches.

| Card | Guide says | L2 `earnRates.fuel` | L2 `annualFee.amount` | L2 `earnUnit` | `lastVerified` | Result |
|---|---|---|---|---|---|---|
| `emirates-islamic-switch-cashback` | 8% cashback, AED 313.95 | `8` | `313.95` | `% cashback` | 2026-08-04 | PASS |
| `hsbc-live-plus` | 5% cashback, AED 313.95 | `5` | `313.95` | `% cashback` | 2026-08-04 | PASS |
| `adib-cashback-visa` | 4% cashback, AED 103.95 | `4` | `103.95` | `% cashback` | 2026-08-04 | PASS |
| `dib-consumer-cashback` | 3% cashback, AED 210 | `3` | `210` | `% cashback` | 2026-08-04 | PASS |

`lastVerified` is 2026-08-04 on all four — one day old at publish.
Comfortably inside the 90-day window. §10 `lastVerified` check: PASS.

Provenance on the fee and earn-rate fields is `editor-confirmed` or
`editor-corrected` throughout (EI, HSBC, ADIB, DIB), so no
LLM-extracted typed numeric has leaked. §6 / Charter LLM-extraction
policy: PASS.

### 1a. KILL-LIST HIT — the table is ranked by a number that does not decide the outcome

The table is ordered 8% → 5% → 4% → 3%, and the piece then tells the
reader (§"What to actually do", item 1):

> **Pick the card before the first tank, not after.** Fuel recurs
> weekly; a two-point difference in rate compounds faster than any
> annual-fee saving.

That is a recommendation toward the top row. Our own L2 `_caps` block
says the top row is the worst card in the table. The caps are in
`cards.json`, verified, `editor-confirmed`, and the guide does not use
them:

| Card | Fuel rate | `_caps.per_category.fuel.monthly_aed` | Fuel spend that hits the cap | Max fuel cashback / yr | Annual fee | Net yr 2 |
|---|---|---|---|---|---|---|
| EI Switch | 8% | **100** | AED 1,250/mo | AED 1,200 | 313.95 | **AED 886** |
| HSBC Live+ | 5% | **200** | AED 4,000/mo | AED 2,400 | 313.95 | **AED 2,086** |
| ADIB Cashback | 4% | **300** | AED 7,500/mo | AED 3,600 | 103.95 | **AED 3,496** |
| DIB Consumer | 3% | **100** | AED 3,333/mo | AED 1,200 | 210 | **AED 990** |

The guide's ranking is precisely inverted. The card it puts first
returns roughly a quarter of what the card it puts third returns, and
costs three times as much to hold. The rate does not compound, because
it stops compounding at AED 100 of cashback — for the 8% card, in the
second week of the month.

Charter §10: *"A recommendation that contradicts a card's own KFS
without an explicit explanation."* This is that, and the aggravating
factor is that the contradicting data is already in our own repository,
already verified, and simply not consulted.

### 1b. The 8% is a mode, not a rate — and the guide knows this argument

`emirates-islamic-switch-cashback.perks[0]`:

> "Switchable rewards: choose Lifestyle or Travel each month in the EI+
> app — you earn the accelerated rates of only the chosen category in a
> given month, not both."

The 8% fuel rate exists only in Lifestyle mode, selected monthly, and
only above AED 2,500 of posted spend in that calendar month
(`_caps.min_monthly_spend_to_qualify_aed: 2500`).

The guide's very next paragraph runs the heading **"A conditional rate
is not the same as a rate"** — and applies it to a card it is *not*
recommending (ENBD Duo) while withholding it from the card at the top
of its own table. Applying a standard to the competitor and not to the
pick is the shape of the problem, whatever the intent behind it.

### 1c. "The strongest fuel earners in our card database" is not true as written

The sentence introducing the table claims completeness. Cards in
`cards.json` with `earnRates.fuel` ≥ 4 that the table omits:

- `adcb-365-cashback` — **fuel 5%**, annual fee AED 383.25. This card
  is listed in the guide's own `relatedCards` frontmatter and then does
  not appear in the table. It also has no per-category fuel cap at all
  (`_caps` is a flat `monthly_max_aed: 1000` across all categories),
  which on the arithmetic above makes it a credible top pick.
- `emirates-nbd-lulu-247-platinum` — **fuel 4%**, annual fee AED 262.50,
  waiver note `"Free for life — no annual fee."`

Meanwhile `dib-consumer-cashback` at 3% is included. A table that
excludes two 4–5% earners and includes a 3% earner cannot be described
as "the strongest fuel earners in our card database." Either drop the
completeness claim or complete the table.

---

## 2. The ENBD Duo caution — verified, PASS

Guide: *"requires AED 5,000 minimum monthly spend — below which it
drops to 1.5% — and caps at 500 Plus Points per statement."*

`emirates-nbd-duo.earnUnit` reads, verbatim:

> `% as ENBD Plus Points (5% on grocery/electronics/utilities/education/fuel requires AED 5,000 minimum monthly spend — otherwise 1.5%; max 500 Plus Points per statement)`

All three conditions match exactly. The hedge "our data records that"
is the correct attribution posture for a value sourced to L2 rather
than re-pulled. **PASS.**

Two omissions worth an edit, neither a kill:

- `eligibility.minSalary: 12000` — double every other card in the piece
  (all four table cards are AED 5,000). "A good card for a heavy
  spender" understates the gate: most readers of an expat-starter guide
  cannot get this card at all.
- `annualFeeWaiver.notes` ends `"Abu Dhabi residents only."` This is a
  Dubai publication running a Dubai-framed guide. Naming a card most of
  the audience is geographically ineligible for, without saying so,
  is a reader-facing error even though the figures are right.
- Plus Points are quoted without an AED conversion, so the 500-point cap
  cannot be compared against the cashback table above it.

---

## 3. The uncited cap warning — the generalisation is safe, the omission is not

Guide: *"**Cashback rates are usually capped.** An 8% headline is a
monthly maximum, not an unlimited rate — check the card's own terms for
the cap and the qualifying-spend condition before assuming the top row
wins for your mileage."*

As a *generalisation* this needs no source. It is directionally true and
it is verifiable in-house: all five cashback cards examined for this
check carry a `_caps` block. §10's "figure without a primary source"
does not fire, because no figure is asserted.

The problem is the opposite of an unsourced claim. **We hold the exact
caps and chose to print a hedge instead.** The guide tells the reader to
go and look up something that is sitting, verified and
`editor-confirmed`, in `src/data/cards.json` — the file the table above
it was built from. "Check the card's own terms" is the sentence a
publication writes when it has not done the work; this one has done the
work and is declining to show it.

Add a cap column to the table. It is four numbers (100 / 200 / 300 /
100), all already verified, and it converts the guide's weakest section
into its strongest. It also resolves 1a: with the cap column visible,
the ranking corrects itself on the page and no reader is misdirected.

---

## 4. Modcare — cannot be verified from this session

**`modcare.ae` returns HTTP 403 to `WebFetch` from this environment**
(the allowlist condition documented in CLAUDE.md §"Network allowlist").
There is no dossier: `.council/research/2026-08/` contains only
`monitoring-design.md`. So every Modcare claim rests on the author's
unarchived reading of 5 August 2026, with no second pair of eyes
possible and nothing in the repository a future checker could re-read.

**Routing to Head of Research** for a Firecrawl pull of `modcare.ae` and
`modcare.ae/paint-protection-film/`, archived to
`.council/research/2026-08/`. Per §2 I do not hold Firecrawl. Until that
archive exists, the section is unverified — not disproved, unverified.

On the substance, assessed on its face:

**Faithful, and correctly framed.** The guide's construction is careful
in the way that matters. Every Modcare claim is explicitly attributed to
Modcare's own account of itself — "how they describe their own work",
"Modcare's answer is that", "they argue this avoids" — and the closing
callout states plainly that the claims are drawn from the company's
website, that we have not tested the work, and that this is not a
review. That is the correct treatment of marketing copy: reported as a
company's claim, never adopted as the publication's finding. Location
(Al Quoz Industrial Area 2), service list, coverage tiers, the SunTek /
STEK discussion, the finishes and the quote-only pricing are all
presented as descriptive and all carry that frame.

**One sentence crosses the line.** In the hand-cut bullet:

> "Whichever method an installer uses, ask which — it is the single
> biggest determinant of how the result looks up close."

The first clause is the guide's own voice giving generic advice: fine.
The second is a technical assertion — a superlative, "the single biggest
determinant" — presented as the publication's finding. Its only source
is the marketing argument of a company that sells the hand-cut method.
That is a vendor's positioning laundered into an editorial fact, and it
is the one place the section stops reporting and starts endorsing.
Delete the superlative or attribute it. The same bullet then contradicts
itself three lines later — the "Installation over brand" bullet says fit,
clarity, heat performance, warranty and edge work decide the outcome,
which cannot both be true alongside a single biggest determinant.

**A marketing page can support**: that a company says it does X, that it
lists tiers A–E, that it publishes no prices, that it is at address Y,
that its phone number is Z. **It cannot support**: that the method works,
that it is better than the alternative, or that the company is good at
it. The draft respects that boundary everywhere except the sentence
above.

**Against the brief's own bar.** The brief (§"If a provider is named")
required that any named business carry "published price, warranty terms,
a source URL, and a verification date. Nothing softer." The guide has
the source URL and the date. There is no published price — Modcare
quotes per vehicle, which the guide states honestly, but honesty about
the absence does not satisfy the requirement. There are no warranty
terms; warranty appears only as advice to the reader ("ask about... the
warranty behind the film"). Two of four conditions are unmet. That is a
matter for the Chairman under the brief, not a §10 kill, and I record it
without ruling on it.

**Contact details** (+971 52 1279834, the `wa.me` link, the mailto, the
Instagram handle) are internally consistent across the draft — the tel:
href, the WhatsApp number and the printed number all agree. Not
independently confirmed, per the 403 above.

---

## 5. §10 kill-list

| Check | Result |
|---|---|
| A figure without a primary source | **PASS** — every figure traces to L2, provenance `editor-confirmed`/`editor-corrected`, `lastVerified` 2026-08-04. |
| `lastVerified` older than 90 days | **PASS** — one day old. |
| Affiliate link without inline disclosure above the fold | **PASS on the letter, see note below.** |
| Orientalist headline or framing | **PASS.** The Gulf-conditions paragraph (heat, UV, airborne sand, construction traffic) is material and specific, not colour. |
| Recommendation contradicting a card's KFS | **FAIL — see 1a and 5b.** |
| UAE regulatory claim not traceable to an authority | **PASS** — and see 5c. |
| Stale earn rates / pre-transition currency | **PASS** — no programme arithmetic; Plus Points named correctly. |
| LLM-extracted typed numeric | **PASS.** |
| **A bank fee displayed without its VAT treatment** | **FAIL — see 5a.** |
| Image without a verifiable licence / unlabelled AI image | **n/a** — no images. |

### 5a. KILL-LIST HIT — VAT treatment absent from the fee column

§10, verbatim: *"A bank fee displayed without its VAT treatment. Site
convention is AED inclusive of 5% UAE VAT... the inclusive figure
carries an '(incl. VAT)' tag on the card review, AtAGlance tile, and
**comparison table**."*

The guide's fee column prints AED 313.95, AED 313.95, AED 103.95 and
AED 210 with no VAT tag. This is a comparison table by any reading. Two
of the four are the awkward cases the rule was written for: ADIB's
`vatPolicy` is `"exclusive"` (its own KFS says AED 99; AED 103.95 is our
conversion), and DIB's waiver note records the same AED 200 + VAT = AED
210 conversion. Add "(incl. VAT)" to the column header. Mechanical fix,
literal kill-list item.

### 5b. KILL-LIST HIT — the Salik advice is contradicted by two of the four cards recommended

Guide: *"**Salik top-ups usually earn too.** ... It generally will not
attract a fuel-category rate, but **it does earn your card's base
rate** — so routing it through the card with the best everyday return is
free money you are otherwise leaving behind."*

`earnRates.everythingElse` for the four cards in the table:

- `adib-cashback-visa` → **0**. `perks[1]`: *"Cashback is earned on those
  listed categories only; general and international spend earns
  nothing."* Salik is not among ADIB's five listed categories.
- `dib-consumer-cashback` → **0**. Salik *is* listed, at 3% capped at
  **AED 25/month** (`perks[0]`), and `perks[1]` adds that non-listed
  spend earns nothing.
- `hsbc-live-plus` → 0.5.
- `emirates-islamic-switch-cashback` → 1.

So on two of the four cards the guide recommends, the base rate on a
Salik top-up is **zero**, and the "free money you are otherwise leaving
behind" is nothing at all. On DIB it is capped at AED 25 a month — which
is a genuinely useful, verified figure the guide could have printed
instead of the generalisation. Same failure mode as 1a: a directional
claim asserted where L2 holds the specific answer, and the specific
answer contradicts it.

### 5c. The no-figures decision is correct — and it is not what makes the piece thin

The council asked whether omitting petrol price, Salik tariff and RTA
fee leaves the piece too thin. **The omission is the right call and I
would defend it against pressure to reverse it.**

The reasoning in the brief holds: UAE petrol prices reset monthly by the
Fuel Price Committee, Salik and RTA fees move by decree, and the `guides`
collection has no `lastVerified` and no drift flag. A quoted pump price
is wrong inside four weeks with nothing in the system to catch it —
Option 1 of the brief's three, chosen correctly. The table pointing at
salik.ae and rta.ae per line is the honest construction, and the callout
explaining *why* no price is printed is the kind of thing that earns a
reader's trust rather than spending it.

Thinness is a real risk here, but the volatile figures are not the cure
and would not have been. What makes the piece thin is that it withholds
the numbers it *does* hold, verified and drift-flagged, behind hedges:
the four cap figures (§3), the AED 25 Salik cap on DIB (§5b), the
minimum-spend gates, the year-one waivers. Print those and the guide is
substantial without carrying a single figure that can go stale — every
one of them sits behind the 90-day flag on `cards.json` and refreshes
with the weekly scrape. That is the version of this piece that works.

### 5d. Disclosure placement — compliant on the letter, wrong on the sequence

There is no affiliate link and no commercial relationship, so the §10
item does not fire and I do not rule it a kill. But the "No commercial
relationship" callout sits at line 143, *after* the entire Modcare
section including the phone number, WhatsApp link and Instagram handle.
A reader who acts on the contact details never reaches the disclosure.
The Charter's principle is disclosure *above* the fold of the thing
disclosed. Move the callout above the "A worked example" heading. The
wording itself is good — plain, complete, unhedged; disclosure wording
is the Standards Editor's ruling and I defer to it.

---

## `lastVerified` honesty

The `guides` schema has no `lastVerified` field, so there is no date to
audit. `publishedAt`/`updatedAt` are both 2026-08-05. The underlying
card data carries `lastVerified: 2026-08-04` on all five referenced
cards, scraped that day. Nothing dishonest. The schema gap the brief
raises is real but is out of scope for this session and does not block
this piece — the guide quotes no figure that can drift except the card
data, which is drift-flagged at source.

## Outcome

**FAIL** — three kill-list hits (1a/5b recommendation vs. KFS, 5a VAT
tag), plus one unverifiable section pending Research.

To be explicit about proportion, because a fail should not read as worse
than it is: no figure in this draft is wrong. The reporting is careful,
the Modcare framing is disciplined, the disclosure is honest, and the
decision to print no volatile figure is correct. The guide fails on how
it *uses* correct figures, not on whether it got them.

## Remediation — all of it inside an hour, none of it re-sourcing

1. Add a **"Monthly cap"** column: EI AED 100, HSBC AED 200, ADIB AED
   300, DIB AED 100. Re-order the table by net annual value, or keep
   rate order and add a line stating the cap decides it.
2. Tag the fee column **"(incl. VAT)"**.
3. Add `adcb-365-cashback` (5%, AED 383.25, no per-category fuel cap) —
   already in the frontmatter — or drop the words "the strongest fuel
   earners in our card database".
4. Note the EI card's Lifestyle/Travel mode switch and its AED 2,500
   qualifying spend, applying the guide's own "a conditional rate is not
   a rate" test to its own top row.
5. Fix the Salik claim: base rate is **0%** on ADIB and DIB; DIB pays 3%
   on Salik capped at AED 25/month.
6. Add ENBD Duo's AED 12,000 minimum salary and the Abu Dhabi residency
   condition.
7. Cut or attribute "the single biggest determinant of how the result
   looks up close".
8. Move the "No commercial relationship" callout above the Modcare
   heading.
9. **Head of Research**: Firecrawl `modcare.ae` + `/paint-protection-film/`,
   archive to `.council/research/2026-08/`. Section stays unverified
   until it lands.

Re-submit after 1–8; I will re-check in under a day. Item 9 gates only
the Modcare section, and the piece can ship without it if the Chairman
elects to cut the worked example.

_Fact-checker, 5 August 2026._
