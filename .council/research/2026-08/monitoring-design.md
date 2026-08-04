# Event-driven monitoring — design note

_2 August 2026. Owner: Head of Research (Firecrawl surface, §2) with
Technical Lead (workflows). Tier: T3._

## The problem

Two gaps, both structural rather than accidental.

**Card data was refreshed by a blind sweep.** `scrape.yml` ran monthly
across all 12 banks and opened a PR if `cards.json` moved. Between runs
we had no idea what a bank had done. The 2026-05-29 emergency §10
correction — ADCB's FX fee published as 0.525% when the Schedule of Fees
said 2.99% — is precisely the failure this cadence guarantees: the error
was live until a sweep happened to run.

**Offers and benefits were not watched at all.** Confirmed while
planning this change: **0 of 52 cards carry a `urls.welcome`**, and no
offers or promotions URL appears anywhere in
`scripts/scrape/banks/*.urls.json`. The pipeline only ever looked at
product pages and fee PDFs. Welcome bonuses and limited-time offers —
the fastest-moving and most reader-relevant facts on the site — had no
source under observation. The deals desk had the same hole: it empties
when a deal expires with nothing feeding it.

## The change

Firecrawl `/monitor` watches named URLs on a schedule, diffs each check
against the previous snapshot, and reports per-page `same` / `changed` /
`new` / `removed` / `error`. Four monitors now cover the sources, and
the scrape runs *in response* to a change rather than on a calendar.

| Monitor | URLs | Cadence | Routing |
|---|---|---|---|
| `dubaipoints-fee-docs` | 10 | daily | issue + auto-scrape that bank |
| `dubaipoints-product-pages` | 52 | weekly | issue + auto-scrape that bank |
| `dubaipoints-offers` | per `offers.registry.json` | daily | issue → editor |
| `dubaipoints-press-rooms` | 9 | daily | news digest → desks |

The auto-scrape reuses the `bank` input **already present** on
`scrape.yml`. No new scraping code, no new data path, and the Chairman
merge gate is untouched.

## Why it is built this way — Charter §6

§6 bans LLM extraction for typed numerics: fees, salary bands, earn
rates and amounts "require deterministic regex parsers … so each value
has a traceable source line".

Firecrawl's JSON-mode change tracking would hand us
`{"annualFee": {"previous": "AED 500", "current": "AED 750"}}` directly.
It is the most convenient feature on offer and we **do not use it**.

- Monitors run **markdown mode only** — a deterministic unified diff.
- Each monitor's `goal` drives Firecrawl's judge, used **only** to
  suppress alert noise. Where the judge rules a change meaningless the
  poller skips the alert; it is never allowed to assert a value.
- **Nothing in `scripts/monitor/` writes to `cards.json`.**

The monitor answers *"did something move?"*. The deterministic scraper
answers *"what is it now?"*. Keeping those separate is what preserves
per-field provenance.

## Why offers alert but never auto-scrape

The scrape merge contract holds that typed editor fields
(`welcomeBonus`, `annualFeeWaiver`, `_features`) are never written by
the scraper — it produces free-text equivalents under
`_scraped_freetext.*` for an editor to type up by hand. Dispatching a
scrape on an offers change would fight that contract. Offers therefore
route to a human, and flag the deals desk.

## Budget

Verified against Firecrawl's published pricing: *"Scrape monitor — 1
credit per URL per check"*, plus *"1 additional credit per changed page
that the judge validates"*.

| Monitor | Credits/month |
|---|---|
| fee-docs (10 × daily) | ~300 |
| product-pages (52 × weekly) | ~224 |
| press-rooms (9 × daily) | ~270 |
| offers (once populated) | ~360 |
| **Total** | **~794 now, ~1,154 with offers** |

Against the 5,000/month Hobby plan. The press-room monitor is
cost-neutral — it replaces the hand-rolled tier that was already
spending the same.

`setup.mjs` refuses to provision above `MAX_ESTIMATED_CREDITS` (1,600)
using the API's own `estimatedCreditsPerMonth`, which guards the one
real unknown: **PDF billing**. Most fee schedules are PDFs and the docs
only say format add-ons cost the "same as standalone scrape". If PDFs
bill per page, monitor A could cost well above 300 — the FAB
consolidated KFS and Standard Chartered price guide are long documents.
The first check's `actualCredits` gives the true figure and cadence is
tuned from that, not from this estimate.

## Consequential changes

- **`scrape.yml`: monthly → quarterly.** It is now the backstop for what
  monitors structurally cannot see — a restructured page, a moved URL, a
  monitor that silently stopped — not the mechanism.
- **`news-monitor.mjs` loses its press tier**, which moves to
  `dubaipoints-press-rooms`. The hand-rolled version scraped each press
  index and diffed headline links itself; that heuristic is what
  surfaced "Visit our Facebook page" as a story on its first live run.
  The free RSS discovery tier is unchanged, and the file now needs no
  Firecrawl key at all. Press findings still land at
  `.council/monitoring/digest-<stamp>.md`, so nothing downstream changed.

## Baseline behaviour

A monitor's first observed check reports every page as `new` — that is
the baseline snapshot, not 62 simultaneous changes. `poll.mjs` records
the baseline and dispatches nothing. This is asserted in verification
step 4 because getting it wrong would fire 12 scrapes and 12 PRs on day
one.

## Open items

- `offers.registry.json` ships empty. Populating it requires running
  `discover-offers.mjs` and **confirming each candidate by hand** — a
  monitor pointed at the wrong page is worse than no monitor, because we
  would then trust it. The offers monitor is skipped until it has URLs.
- **`welcomeBonus` Charter/code drift**, found while planning:
  `SCRAPED_FIELDS` at `propose-changes.ts:68` includes `welcomeBonus`,
  but CLAUDE.md states it was removed in `e291a87` and that re-adding it
  is "a fenced contract change requiring Chairman approval". Code and
  Charter disagree. Out of scope here; needs its own ruling.
- Web-scale search monitoring (a standing web search rather than named
  pages) deferred until the named-page monitors prove their real burn.
