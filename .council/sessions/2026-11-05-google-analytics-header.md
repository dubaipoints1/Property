---
slug: google-analytics-header
convened-by: technical-lead
topic: Install the owner's existing standard Google tag
convened: 2026-11-05
participants: head-of-research, seo-strategist, fact-checker, standards-editor, head-of-ux, technical-lead, growth-analytics-lead, business-realestate-editor, managing-editor, chairman
deliverable-shape: full-implementation
status: reviewed-awaiting-release-checks
---

# Council: existing Google Analytics tag

## Scope and decision

Owner's direct instruction to add his supplied standard tag is the new
website-installation authority; the earlier disabled-consent branch is
retained separately and is not in this release. Google account settings
stay unchanged. No new credential/property, consent framework, advertising
destination, financial data/formula, homepage redesign or paid tool.
The [brief](../briefs/2026-11-05-google-analytics-header.md) records the
standard tag's processing limits and the Chairman's in-session direction.

## Actual role reviews

- `google_tag_technical`: Technical Lead implemented CSP and regression
  tests. Node22 analytics/build regression28/28 passed; independently
  inspected all322 compiled production HTML files. Exactly one correct
  loader/config in head before styles on each, inline hash authorised,
  CSP1,717/2,000characters. No remote/account changes. Technical pass is
  implementation/artifact only; live receipt remains separate.
- `google_tag_council_review`: independently inspected actual source diff
  and free official Google sources. Standards/business editor pass on
  cookie, URL/device and query disclosure; Fact-Check pass for changed
  Google claims; Growth pass without exact-person/all-bot/backfill claims;
  SEO source pass on unchanged metadata/schema/navigation; UX source pass
  on existing semantic trust layout, with no rendered/device certification.
- Root convenor: Head-of-Research verified official Google installation/
  CSP and Cloudflare automatic build-variable documentation; Managing
  Editor reconciled the fresh owner direction, separated the former draft,
  integrated public disclosure and release sequence. Chairman approved the
  specifically supplied tag in-session, not unrelated scope. These are
  exercised agent roles, not ten separate human reviewers.

## Local verification

Astro check:184files,0errors/0warnings,4existinghints. CF-production-mode
build:322pages;22,428internal links resolved. Independent head scan as
above. Cloudflare-main predicate and default/preview exclusion tested.
No JavaScript unsafe-inline/eval, frame or form permissions were added;
existing img-src https: remains broad, so no all-ad-egress claim is made.

Local full suite still has the previously recorded macOS Bash3
automation-state empty-array failure. No test has been skipped or
relaxed. Require genuinely executed Linux check/build/test success and
actual Council body validation for this exact head before normal merge.

## Release ledger

Pre-merge Linux/Council/Cloudflare-preview checks, protected merge,
production deployment and live Google detection/ingestion are external
gates, recorded in the PR's final release note when actually observed.
Source/build presence alone is not confirmation that Google received data.
No full physical-iPhone, legal/privacy compliance or revenue claim.
