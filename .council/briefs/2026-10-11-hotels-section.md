---
slug: hotels-section
tier: T3
owner: technical-lead
section: travel-experiences
opened: 2026-10-11
status: shipped
chairman-status: approved
chairman-direction: "all and then merge it" — Chairman in-session, 11 October 2026, replying to the offer "Hotels section: Marriott, Hilton and Accor currently sit under Airlines. I could write proper pages for them and move them to their own Hotels section"
---

# Hotels section: hotel programmes move from /airlines/ to /hotels/

## Decision

The three hotel loyalty programmes leave the `/airlines/` namespace and get
their own section. This closes the URL half of the 15 September 2026 R5
ruling ("fix the label now; hotels move to /hotels/ when their briefs
exist"), which had kept them under `/airlines/` with a "Hotel programmes"
heading as a stopgap.

## What shipped

- **Routes.** `/hotels/` (directory: `dp-article is-wide` + `dp-dir-grid`,
  `CollectionPage` + `BreadcrumbList` schema) and `/hotels/<slug>/` for
  `marriott-bonvoy`, `hilton-honors` and `accor-all`, rendered by the
  existing `AirlineProgramLayout` with `section="hotels"`, which gives
  them a "Hotels" breadcrumb (visible and in JSON-LD) and a `/hotels/<slug>/`
  canonical.
- **One list.** `HOTEL_PROGRAMME_IDS` in `src/lib/programmes.ts` is the only
  place that says which programmes are hotels. `/airlines/[slug]`,
  `/airlines/`, `/hotels/[slug]`, `/hotels/`, the homepage directory count
  and `resolveDealIssuer()` (`programmeHref()`) all read it.
- **`/airlines/`** now lists airline programmes only, with one pointer tile
  across to `/hotels/`.
- **Redirects** (`public/_redirects`, 301, with and without trailing slash):

  | From | To |
  |---|---|
  | `/airlines/marriott-bonvoy` | `/hotels/marriott-bonvoy/` |
  | `/airlines/hilton-honors` | `/hotels/hilton-honors/` |
  | `/airlines/accor-all` | `/hotels/accor-all/` |

- **Internal links** in programme, card, news and guide MDX, `/topics/`,
  `/news/hotels/` and the header's Points + Miles panel now point at
  `/hotels/<slug>/`. The Travel panel's "Hotel programmes" row and a new
  "All hotel programmes" row point at `/hotels/`. The footer's Explore
  column splits "Miles & hotel programmes" into "Airline programmes" and
  "Hotel programmes".
- **Audit harness.** `scripts/audit/_lib.mjs` maps `/hotels/` and
  `/hotels/<slug>/` to their templates.

## Honest-nav check (2026-07-27 rule)

Every new link points at a page that exists in the build: the directory and
three programme hubs. No hotel reviews, staycations or property pages are
promised.

## Not changed

Historical audit and research files under `.council/` keep their old
`/airlines/<hotel>/` URLs as the record of what was live at the time. The
Marriott logo stays at `public/logos/airlines/marriott-bonvoy.svg` (an asset
path, not a page URL).
