# kredit.ae — competitor teardown

**Date:** 10 September 2026
**Requested by:** Chairman, in-session — "Look at this website looks like
ours anything we can use? Scrape the whole site and sublinks. And then apply."
**Method:** Firecrawl map (sitemap mode, 2,000-URL cap) plus targeted page
scrapes. 5 credits.
**Owner:** Head of Research (orchestrating session).
**Governs:** 2026-07-27 news sourcing ladder; 29 August §3 competitor ruling;
Charter §"Non-negotiables" 5.

---

## 1. What it is

`kredit.ae` is a commercial affiliate comparison site operated by **SMART
SPEND - FZCO** (licence 68272, IFZA, Dubai Silicon Oasis). Its own footer
states the model plainly: it earns a commission when users click certain
links, apply, are approved, or open an account, and that "compensation may
affect how and where products appear on the site".

It is not a peer publication. It is a lead generator with an editorial layer
on top, and that distinction decides most of what follows.

### Scale, against ours

| | kredit.ae | dubaipoints.ae |
|---|---|---|
| Indexed URLs | 2,000+ (map cap; likely more) | 212 after this sprint |
| Card detail pages | 144 | 58 |
| Merchant offer pages | 1,295 | — |
| Programmatic facet pages | ~306 | 8 |
| Head-to-head pages | 41 | 10 after this sprint |
| Calculators | 5 | 2 |
| Blog posts | 104 | 17 news + 21 guides |
| Loyalty programme pages | 13 | 12 |

Their facet strategy is the bulk of the difference: bank × benefit
(`adcb-airport-lounge-access`, `adib-valet-parking`, `cbd-golf`), bank ×
salary (`adcb-salary5000`, `adcb-salary25000`), merchant (`carrefour`,
`noon`, `amazon`, `talabat`, `choithrams`, `apple-store`, `aster-pharmacy`,
`6th-street`, `adnoc`, `careem`), network, and nationality. They also ship
misspelling redirects — `/kredit-cards`, `/credti-cards`, `/creditcards`,
`/credit-cars`.

## 2. What we took

Three patterns, each because our existing data already supported it. Nothing
below reproduces their copy, their markup or any of their figures.

**Head-to-head pages with a stable URL.** Their strongest surface: 41 pages
at `/credit-cards/compare/<a>-vs-<b>`, each pricing both cards across seven
named spending profiles, showing the modelled month, and stating a verdict.
We had no pair URL at all — `/cards/compare/` is a picker, useful once a
reader is already on it and invisible to anyone searching for two named
cards. We now ship ten curated pairs, each with a written verdict, reusing
`CardComparison.astro`. Curated rather than generated: 57 reviewed cards
make 1,596 pairs, and a page each would be 1,596 templated sentences.

**Perk facet pages.** Their 306 facets are mostly thin, but the idea is
sound and we already held the data — `_features` is a typed union of
fourteen perk types and `getCardsWithFeature()` had zero call sites. Three
pages ship (lounge access, golf, travel insurance); the other eleven types
cover one to five cards each and stay as chips.

**A named denominator for earn rates.** Their compare pages state the
spending profile a figure was priced on. That framing is what prompted
checking ours, and ours turned out not to have a denominator at all — see §4.

## 3. What we declined, and why

Recorded so nobody re-proposes them from the same source.

| Declined | Reason |
|---|---|
| The affiliate apply flow, 1,295 offer pages, partner perks | Charter §"Non-negotiables" 5. No advertorial-driven recommendations. Their whole page count rests on a model we do not run. |
| Card ratings out of 5 (they publish e.g. "4.1/5") | The 2026-05-25 amendment makes the first published card score precedent-setting and returns it to the Chairman. Not a session's call. |
| The card-picker quiz | Duplicates `/cards/finder/`. |
| Programmatic facet expansion at their scale | 306 facets against 58 cards produces pages listing one or two cards. The 2026-07-27 honest-nav rule. |
| Every figure on the site | The 2026-07-27 sourcing ladder: competitor coverage is story discovery and credit only, never a number and never a structure. Their fee, rate and salary figures are not a citable fact base for us. |
| Misspelling redirects | Real but marginal. `public/_redirects` exists if it is ever worth a slot. |

## 4. What the exercise actually surfaced

**The valuable output of this teardown was not their content. It was four
defects on our side, found by comparing their card-value code path to ours.**
Three were live in production.

**4.1 — `/calculator/` published reward figures up to 100× too high.**
It told readers that AED 7,800 of monthly spend earned "48,300 % cashback ≈
AED 48,300" a month on the RAKBANK World card. `earnRates` is a bare number
and `earnUnit` is prose, so nothing in L2 stated whether `1.5` meant 1.5
percent, 1.5 points per AED 1, 1.5 miles per AED 10, or 1.5 miles per USD 1.
The calculator multiplied spend by the rate for all four alike. Percentage
cards came out 100× high, Etihad Guest co-brands 10× on the denominator
alone, and Skywards and Bonvoy treated dirhams as dollars. Severity: P0, same
class as F-002 — a false financial figure served to readers.

**4.2 — the calculator's valuations contradicted `/valuations/`.** A private
`AED_PER_UNIT` table priced a mile at 4 fils against the 2.0 we publish, and
hotel points at 0.8 against Bonvoy's 2.5, while calling them "conservative"
and linking the methodology page as though they derived from it. Directly
against Chairman ruling 2 of 12 June 2026. Its programme matching was a
regex over programme and unit text, which caught "Voyager Miles" on the word
*miles* and priced it as Skywards; Voyager has no published baseline.

**4.3 — the `EarnRates` schema was silently deleting data.** Zod strips
undeclared keys. The schema declared nine categories against the twenty-five
`cards.json` carries, so `partnerBrands` was dropped on **22 cards** — every
co-brand review among them. `EarnRateTable.astro` had carried a comment
since 20 May 2026 saying the partner row existed so the headline rate
"doesn't silently drop from the table"; it dropped anyway, one layer
earlier, for sixteen weeks. `utilities` (12 cards) and `insurance` (9) went
the same way, with thirteen more behind them.

**4.4 — `/cards/compare/`'s query state could not render.** The page read
`Astro.url.searchParams` in a static build, where params are always empty.
The picker's "Update comparison" button returned the same three cards every
time and the deck's claim that "the URL is shareable" was not true.

Two smaller ones fell out alongside: the calculator ignored a card's own
`utilities` rate (12 cards publish one, 10 below their base rate), and three
cards carried an `earnUnit` that contradicted their own review prose or was
missing entirely.

All six are fixed in PR #351 with tests that fail on recurrence — including
a per-card assertion that every card's earn-unit wording parses, so an
unfamiliar new card fails the suite rather than quietly earning a wrong
number.

## 5. Honest note on the comparison

Their compare pages are better than ours were, and it is worth saying why
rather than only what we copied. They price both cards across seven named
household profiles, show the modelled month beside the result, net the
annual fee, and state which card wins each profile and why. That is a real
editorial method, not a template. Ours states a verdict and a spec table.
The method is adoptable and is not adopted here; it needs per-profile
modelling our data supports but our editorial capacity has not yet been
pointed at.

Against that: their figures carry no provenance a reader can trace, no
per-field verification date, and no correction log, and their ranking sits
behind a disclosed commercial arrangement. Those are the things we compete
on, and they are the reason the fixes in §4 mattered more than anything we
brought back.

## 5a. Their accountability surface against ours

Checked 10 September after the Chairman asked who operates the site.

kredit.ae names **nobody**. `/about` is anonymous prose — "we're a team of
people who, just like you, were tired of..." — with no founder, no editor and
no bios. `/contacts` is two email addresses and five social links. Every
article is bylined "Kredit" or "Kredit editorial team" against a generic
avatar. The only identifying facts anywhere are the footer's: SMART SPEND -
FZCO, licence 68272, IFZA.

| | kredit.ae | dubaipoints.ae |
|---|---|---|
| Accountability routes | 4 — `/about`, `/contacts`, `/credit-cards/how-we-rank`, `/credit-cards/how-we-rate` | 9 |
| Named or explained byline | Organisational, unexplained | Organisational, with `/team/` stating the single-editor position per the 2026-08-05 amendment |
| Corrections log | None | Public, dated, counted |
| Per-field provenance | None | 1,008 tagged fields |
| Commercial model | Affiliate, commission on applications | No revenue |

They out-scale us roughly ten to one on pages. We are far ahead on the axis
the 2026-06-12 ruling names as our trust posture. That asymmetry is the
finding, and it is what the F-051 work on 10 September acted on: the
accountability existed but a reader could not see it, because every trust
page opened with a title, a date and body copy.

**A name collision worth recording.** Searching "SMART SPEND" surfaces a UK
warning-list entry for "Smart Spend Limited (clone of FCA authorised firm)".
That is a different company — different jurisdiction, different legal form —
and nothing connects it to the Dubai FZCO. Nothing adverse was found about
the operator itself. Noted so a future reader running the same search does
not draw the wrong conclusion.

## 6. Credits

| Call | Credits |
|---|---|
| `map` sitemap-only, 2,000 URLs | 1 |
| `map` default, 300 URLs | 1 |
| `scrape` homepage (markdown + links) | 1 |
| `scrape` one compare page | 1 |
| `scrape` `etihad.com/en-ae/offers` (unrelated F-016 re-check) | 1 |
| **Total** | **5** |

Well inside the 1,000-credit ceiling set for the September audit, of which
roughly 490 had been spent.
