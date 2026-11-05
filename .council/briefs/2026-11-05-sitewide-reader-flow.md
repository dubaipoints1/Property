---
slug: sitewide-reader-flow
vertical: travel-experiences
assigned-editor: travel-experiences-editor
tier: T3
chairman-status: approved
draft-status: complete
tech-status: pass
---

# Site-wide reader flow and continuity

Owner direction, 5 November 2026: “Yes do all for all pages and subpages
then qa that is what was done”. This follows the five-part live critique:
programme reading order, lighter browsing summaries, less repetitive panel
weight, preservation of tool context, and topic-relevant next steps.

## Reader question

What should I read or do next, and will the next page retain the choices
that brought me here? The site should support choosing a card, checking a
salary offer, using points, and finding a deal without restarting the task.

## Scope and boundaries

- Apply shared patterns across every applicable template and inventory all
  built pages and subpages, including utility, trust and recovery routes.
- Preserve the selected Runway palette, homepage hero/reel, site URLs,
  existing section anchors, data, ranking/calculation rules, disclosures and
  image sources. Do not add a library, analytics or credential use.
- Programme facts stay next to the relevant editorial section; one useful
  contents control and one true ending. Native HTML/no-JS must retain them.
- Card and salary context uses bounded URL parameters, not stored personal
  profiles or another tracking system. Default and invalid-query states
  remain usable. Show the estimate basis when it changes.
- Related actions use actual references and metadata; no invented claims or
  automated financial advice. Generic latest items are labelled as such.

## Done when

1. A route/family coverage matrix identifies the inherited change or the
   explicit reason a route is retained, and QA records every emitted page.
2. Rendered desktop/mobile and light/dark checks establish reading order,
   practical controls, keyboard navigation and comparable first-screen facts.
3. End-to-end tests verify state continuity, back/return links, related
   destinations, preserved numbers/anchors and no-JS behaviour.
4. Build, type/content, unit, internal-link/fragment, full route resize and
   representative accessibility checks are run, with limits and failures
   reported. Automated reflow alone is not a visual-flow sign-off.
5. The tested candidate and the homepage boundary are recorded clearly.
   Implementation/QA is not a claim that it is deployed.

## Completion record

The five accepted changes are implemented across the applicable templates.
Final local QA passed on 2026-11-05, including all 319 routes and the two
complete card/salary journeys. The full route inventory and bounded review
are in the linked session records:

- `.council/sessions/2026-11-05-sitewide-reader-flow.md`
- `.council/sessions/2026-11-05-reader-flow-route-inventory.md`

T3 review passed with the corrections recorded there. PR #515 still needs
executed final-head CI and a successful Cloudflare preview before normal
merge. Deployment and canonical production verification are separate.
