# Source note — flydubai OPEN (read 20 Oct 2026): no programme to profile

Brief asked for a `flydubai-open` programme page. **None was created**,
because flydubai's own site no longer carries an OPEN programme: flydubai
customers earn and spend **Emirates Skywards** miles, which we already
cover at `/airlines/skywards/`.

## Channels

1. `fetch-sources.yml` run 39438665021 (job 118682378194), 20 Oct 2026
   14:23–14:24 UTC: `https://www.flydubai.com/en/open/`,
   `/en/open/about-open/`, `/en/open/terms-and-conditions/` — all
   `[fetch failed: timeout]` (flydubai.com tarpits data-centre clients, as
   CLAUDE.md records for emirates.com / etihad.com).
2. Firecrawl `firecrawl_scrape` of `https://www.flydubai.com/en/open/`
   (`formats: ["markdown"]`, 1 credit, scrapeId
   01a159b3-a912-726a-a57f-890ec3a4d9d4): HTTP 200, but the final URL was
   **`https://www.flydubai.com/en/skywards/about-skywards/`**.

## What the redirect target says (verbatim)

> # About Skywards
>
> Discover the benefits of Emirates Skywards, designed to reward you every time you fly or shop with our global programme partners.

> ## EARNING MILES
>
> Earn both Skywards Miles and Tier Miles on flydubai and Emirates flights.

> ## MEMBERSHIP TIERS
>
> Four levels of exclusive benefits designed to make your travels more rewarding. Build up your Tier Miles balance by flying with Emirates and flydubai to enjoy a higher level of privileges from Blue to Silver, Gold and Platinum tier status.

Page metadata description: "Earn Skywards Miles every time you fly with
flydubai. The number of miles you earn per flight depends on your route &
fare. Join the Emirates Skywards loyalty programme now."

Site navigation on that page: About Skywards, Earning Miles, Spending
Miles, Membership tiers, Programme partners, Membership benefits,
Skywards FAQs, Contact Skywards, Skywards T&Cs — all under
`flydubai.com/en/skywards/`. No OPEN section.

## Consequences in this change

- No `src/content/programs/flydubai-open.mdx`.
- `src/lib/valuations.ts`: the "flydubai · OPEN · Pending" row is removed;
  flydubai earn is Skywards, which already has a row.
- `src/pages/press.astro` and `src/pages/404.astro` no longer name
  "flydubai OPEN" as a programme we cover.
