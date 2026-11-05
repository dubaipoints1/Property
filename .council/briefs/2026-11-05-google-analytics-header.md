---
slug: google-analytics-header
vertical: business-realestate
assigned-editor: business-realestate-editor
research-status: complete
seo-status: reviewing
draft-status: complete
factcheck-status: reviewing
tech-status: reviewing
chairman-status: approved
target-publish: 2026-11-05
---

# Install the owner's existing Google Analytics tag

## Authority and changed decision

Mostafa explicitly directed: “just add that to the header so we have google
analytics working, the ask simple”, supplying the standard gtag.js snippet
for G-VS2RL6KX46. This is fresh direction to install and release that standard
tag, superseding the earlier *website activation* hold. His separate choice
to leave Google account settings unchanged stands. No property, stream,
API secret, advertising destination or Google setting is created/changed.
Chairman approval is the directed scope in-session, 2026-11-05, under the
6 August Charter amendment. It does not waive actual review or CI.

## Scope / acceptance

Use the supplied two-script tag once, high in shared BaseLayout head. Run
on Cloudflare main production only, excluding local/dev and branch previews
using CF's automatic build variables. Add the necessary narrow Google
Analytics script/connect CSP sources while preserving hashes and the header
limit. Leave Cloudflare tracking, site appearance, data and calculators
unchanged. State Google cookie/URL processing honestly in the existing
public trust page. Verify executed checks, protected merge, production tag
presence/CSP, and Google detection or event receipt before calling it live.

## Explicit trade-off / limits

This is the owner's standard immediate-loading tag, not the earlier
consent-controller proposal. Do not ship the separate disabled branch or
claim its query stripping, advertising denials, withdrawal or storage
limits apply. Existing automatic Google measurements remain as configured.
URLs/referrers can contain tool state; do not promise zero calculator/form
data, legal compliance, complete bot removal, exact natural persons or
historic traffic backfill. No consent/legal jurisdiction assessment is
certified by this release. Future reporting must retain known-bot and
recorded-user coverage qualifications.

## Sources / review

- Owner-provided standard snippet and direct instruction, 2026-11-05.
- https://developers.google.com/tag-platform/gtagjs — shared-head install.
- https://developers.google.com/tag-platform/security/guides/csp — GA CSP.
- https://developers.cloudflare.com/pages/configuration/build-configuration/ — CF_PAGES/CF_PAGES_BRANCH automatic variables.
- https://support.google.com/analytics/answer/11397207 — Google cookies.
- https://policies.google.com/technologies/partner-sites — provider disclosure.

Review tasks: independent Technical Lead CSP/runtime tests; independent
Standards/UX/SEO/FactCheck/Growth/business-editor review; root Research,
Managing Editor integration and release synthesis. These describe agent
roles exercised, not separate human reviewers. Exact findings and check
runs are recorded before merge. No production success pre-claimed.
