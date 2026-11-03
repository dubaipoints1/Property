---
slug: cloudflare-readonly-report
convened-by: technical-lead
topic: Read existing Cloudflare analytics privately
convened: 2026-11-03
participants: head-of-research, fact-checker, technical-lead, growth-analytics-lead, standards-editor, head-of-ux, seo-strategist, travel-experiences-editor, managing-editor, chairman
deliverable-shape: full-implementation
status: initial-diagnostic-reviewed
---

# Council — private read-only Cloudflare report

Brief: `.council/briefs/2026-11-03-cloudflare-readonly-report.md`.
The owner locked the scope to existing Cloudflare analytics, confirmed that
he does not pay for GitHub, and explicitly rejected the diversion into
other analytics/visibility work. No scope decision remains for this bounded
read; any tracking, subscription or access change returns to the owner.

## Actual reviews

| Role | Review task | Outcome |
|---|---|---|
| Head of Research | Main session | Pass: official API schema, permissions and metric definitions establish the bounded diagnostic; runtime fields remain to be verified. |
| Technical Lead | security_release_review | Pass: actual final collector, workflow, crypto and tests inspected; 13 targeted and four adversarial mock checks pass. |
| Managing Editor | security_release_review | Pass: explicit owner direction supports Stage 7 for read-only scope under 2026-08-06 amendment. |
| Travel Section Editor | security_release_review | Pass: no public claims, financial data, imagery or licence change. |
| Growth & Analytics Lead | security_experience_review | Pass: no counts inferred; month UTC window unapplied and telemetry coverage unverified. |
| Standards Editor | security_experience_review | Pass: diagnostic, configuration, authentication and data availability kept distinct. |
| Head of UX | security_experience_review | Pass: operational clarity; no public UI impact. |
| SEO Strategist | security_experience_review | Pass: no routes, metadata, indexing or tracking change. |
| Fact-Checker | security_experience_review | Pass: five independent UTC month cases; configuration, schema access and metrics claims correctly bounded. |
| Chairman | Mostafa in-session | Approved: saved token and explicit direction to access existing website analytics. |

The implementation task security_technical_review did not approve its own
code as Technical Lead. That independent sign-off is security_release_review.

## Controls and evidence

- Main-only manual workflow; no branch, pull-request or scheduled collection.
- Step-scoped token; pinned actions, no dependency install, GitHub read-only
  token and no persisted checkout credential.
- Exact Pages domain identity; bounded API requests, rejected redirects,
  sanitised failures; no raw configuration or provider body persisted.
- RSA-OAEP/SHA256 + AES256-GCM encrypted report; per-run local private key,
  exact ciphertext-only artefact, one-day retention, private local readback.
- 13 targeted tests pass. Local full suite: 555/560 pass; five unchanged
  macOS Bash3/loopback failures are not counted green. Real Linux/Node22.20
  push CI must execute and pass before merge.
- Astro check: zero errors/warnings, ten existing hints. Build: 315 routes,
  313 indexed pages, valid CSP generation and 20,165 internal links.

## Release limits

This initial version reads Pages identity and RUM schema only. Metrics are
null and the requested previous calendar month is explicitly unapplied.
The live data query requires another technical/factual review once the
schema is available. No working analytics connection is claimed yet.
Internal-only commits use CF-Pages-Skip; no website deployment is needed.
