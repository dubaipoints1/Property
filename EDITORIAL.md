# Editorial cadence and process

Companion to `PLAN.md`, `BRAND_NOTES.md`, and `SITE_ARCHITECTURE.md`. This
file is the operating doc for what we publish, when, and how.

## Weekly cadence

A solo-operator publication needs a cadence template that is sustainable,
covers every vertical at least once a fortnight, and forces evergreen
authority work onto the calendar.

| Day | Slot | Output |
|---|---|---|
| Mon | Bank / salary transfer | One news post or offer update |
| Tue | Deal / lifestyle | One deal post or merchant promo update |
| Wed | Card or airline programme | One review, refresh, or sweet-spot piece |
| Thu | Lifestyle deal roundup or news | One post, light editorial |
| **Fri** | **Weekly recap** | "This week on DubaiPoints" — one short post linking the week's items + the newsletter / WhatsApp send |

Saturdays and Sundays — no scheduled publishing; reserved for planning,
verification refreshes, and quarterly artifacts (valuations etc).

## Friday recap

Every Friday, publish a short "This week on DubaiPoints" post under the
`/guides/` collection (or a dedicated `/weekly/` collection in a later
phase). Format:

- Title: `This week on DubaiPoints — [Month] [Day], [Year]`
- 4–6 bullet points, one per published item that week
- One "Verdict of the week" — the single recommendation we'd give a
  reader who only has time to read one thing
- One "Heads-up" — the thing landing next week worth knowing about
- Cross-posted as the week's newsletter send (Buttondown) and WhatsApp
  broadcast

The recap surfaces in the homepage **"This week on DubaiPoints"** band
automatically because it's an entry in the `guides` collection (sorted by
`updatedAt`). When `/weekly/` becomes its own content collection, the
homepage band switches to read from it.

## Quarterly artifacts

- **AED Valuations** — first formal sampling Q3 2026, then quarterly on
  the first Friday of January, April, July, October. Methodology page:
  `/valuations/methodology/`. Data module: `src/lib/valuations.ts`.
- **Card lineup refresh** — every quarter, sweep all live card MDX for
  rate / fee / welcome-bonus drift; refresh `lastVerified`.
- **Salary-transfer offer scrape** — weekly via Firecrawl scraper (see
  `PLAN.md` Phase 2).

## Verification rhythm

- Card MDX older than 90 days flagged as "Needs verification" in the UI
  via the existing `lastVerified` field.
- Salary-transfer offers re-checked on each Buttondown send.
- AECB / DFSA / UAE Central Bank rule changes monitored continuously;
  affected guide pages flagged for refresh within 7 days.

## Channels

- **Site** — primary, all evergreen content lives here.
- **Newsletter (Buttondown)** — Friday recap + tagged segment sends to
  AED-band subscribers when an offer drops for their band.
- **WhatsApp broadcast** — same Friday recap, abbreviated, link to site.
  Trial scale: free WhatsApp Business broadcast list; upgrade to a paid
  API tier (Twilio or 360dialog) past 256 subscribers.
- **RSS** — site-wide and per-AED-band, generated at build time (see
  `BRAND_NOTES.md` §7).
