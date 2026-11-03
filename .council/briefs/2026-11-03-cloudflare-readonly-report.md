---
slug: cloudflare-readonly-report
vertical: travel-experiences
assigned-editor: travel-experiences-editor
research-status: complete
seo-status: complete
draft-status: complete
factcheck-status: complete
tech-status: complete
chairman-status: approved
target-publish: 2026-11-03
sources-required: 0
---

# Read existing Cloudflare analytics privately

## Owner direction and scope

Mostafa requested a Cloudflare connection and visitor statistics, saved the
read-only API token in GitHub, then clarified: “the reason i gave you access
to the cloudflare was so you can access teh analytics of mywebsite”. This
is the Stage 7 approval for this bounded read-only integration under the
2026-08-06 Charter amendment, not approval for account writes or new tracking.
GitHub remains public; Mostafa states that he does not pay for GitHub.

## Done when

- Main-only manual dispatch reads the existing site with the saved secret.
- The token never appears in logs, source, reports or chat.
- Only a selected report encrypted for a fresh local recipient key leaves
  the runner; plaintext metrics, raw response bodies and private keys do not.
- Exact Pages production-domain identity is checked; ambiguity fails closed.
- Actual provider metrics, coverage and unavailable states remain distinct.
  Visits, page views and unique visitors are not interchangeable.
- Tests and real push-triggered validation pass, all T3 roles review, and a
  live dispatch establishes actual access or an explicit limitation.

## Out of scope

Changing visibility, subscriptions, permissions, DNS, hosting settings,
tracking/beacons or public pages; GA4; schedules; collecting other sites;
claiming access, monthly unique people or historic numbers from mock tests.

## Primary references

- Cloudflare GraphQL authentication:
  https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/
- GraphQL schema introspection:
  https://developers.cloudflare.com/analytics/graphql-api/getting-started/querying-basics/
- Pages API deployment reads:
  https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/list/
- Cloudflare Web Analytics metric definitions:
  https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/

Head of Research: current primary documentation and existing Pages check link
support the implementation perimeter. No inferred typed site data is added.
SEO spec: n/a, internal operational tooling, no public route or metadata.

## Initial diagnostic release boundary

The first release establishes the exact Pages identity and reads the live RUM
schema privately. It deliberately executes no guessed metrics query. A later
query must use fields verified from that schema and return separately reviewed,
provider-labelled metrics. The owner request is not complete until that live
data read succeeds or a concrete limitation is reported. No monthly unique
visitor number is inferred from schema, visits, page views or a green job.
