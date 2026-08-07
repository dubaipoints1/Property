---
slug: integrity-conversion-sprint
vertical: business-realestate
assigned-editor: business-realestate-editor
research-status: pass
seo-status: pass
draft-status: complete
factcheck-status: pass
tech-status: pass
chairman-status: approved
target-publish: 2026-08-05
sources-required: 4
tier: T3
---

# Integrity and conversion sprint

## Chairman direction

The site owner directed implementation on 5 August 2026 after reviewing a
repository and deployed-site audit, and on 6 August directed the current
session to reconcile the intervening Claude work and audit the site. Under the
6 August Charter amendment, that in-session direction is Stage 7 approval for
the directed local scope. It does not authorise a push or deployment that was
not requested.

## The reader question

Can a reader trust that rates, verification claims and update cadences mean
exactly what the site says, and can they complete the primary subscription
journey without encountering unfinished or internal surfaces?

## In scope

- Preserve each card's actual earn-rate denominator on every rendered surface.
- Add regression coverage for AED 1, AED 10, AED 200, USD 1, percentage and
  unknown/multiplier unit shapes.
- Replace unsupported named-byline, all-source and daily-refresh claims with
  wording supported by the current publication and monitoring model.
- Add a Buttondown form that activates only when a verified public username is
  configured; retain an honest email fallback otherwise.
- Consolidate `/friday-brief/` into `/newsletter/` with a permanent redirect.
- Remove internal fixture routes before the production search index is built.
- Correct search guidance and the mobile quick-link overflow.
- Upgrade Astro and official integrations through their published migration
  path, then verify the complete site.

## Out of scope

- Adding salary-transfer offers without a bank-specific primary-source dossier.
- Flipping `needs-review` provenance without the required human verification.
- Inventing or assuming a Buttondown username, account setting or subscriber
  consent configuration.
- Publishing or deploying before the final Chairman gate.

## Chairman decision: organisational byline

On 5 August 2026 the Chairman selected the organisational-byline route. The
recorded amendment permits **DubaiPoints Editorial** only while the publication
has one editor whose personal name is intentionally not public. The byline may
not conceal another contributor, paid or AI-only authorship, or a material
conflict. Named contributors must use their real names. Trust-page structured
data remains `Organization`-only until a real named contributor profile exists.

## Buttondown primary-source record

- [Embedded HTML subscription form](https://docs.buttondown.com/building-your-subscriber-base):
  official endpoint and required email field.
- [GDPR and EU compliance](https://buttondown.com/legal/gdpr-eu-compliance):
  Buttondown stores a subscriber's email address, subscription IP and referrer
  metadata.
- [Sending emails](https://docs.buttondown.com/sending-emails): Buttondown
  automatically appends an unsubscribe link to sent emails.
- [Privacy features](https://buttondown.com/features/privacy): open, click and
  email-client data may be collected, and analytics/link tracking can be
  disabled.

The public form stays disabled until the public username, confirmation flow,
privacy disclosure, analytics setting and link-tracking setting are reviewed
against the intended launch configuration. No username is inferred in code.

## Done when

1. The Etihad Elevate sidebar says `per AED 10`, not `per AED 1`, and all other
   compact card surfaces preserve the stored denominator.
2. Automated tests cover unit parsing, comparison rendering and production-route
   pruning; the complete test, type-check and production-build suite passes.
3. Pagefind contains no `/dev/`, `/design-spike/` or `/style-guide/` result.
4. The homepage, team, editorial-policy, tracker and subscription copy no longer
   claim capabilities or attribution that are not currently present.
5. Desktop and 360px mobile probes pass without horizontal page overflow.

## Council sign-off

| Role | Status | Notes |
|---|---|---|
| Head of Research | **pass** | Official Buttondown sources and the activation boundary are recorded. |
| SEO Strategist | **pass** | Redirect, sitemap and Pagefind treatment are coherent. |
| Fact-Checker | **pass** | Launch state, cadence, VAT and valuation-status claims now match the evidenced implementation. |
| Standards Editor | **pass** | The Chairman-authorised organisational-byline amendment is narrow and implemented. |
| Head of UX | **pass** | 360px overflow, mobile navigation and dark-mode contrast evidence are clean. |
| Technical Lead | **pass** | Exact Node, test, check, build, Lighthouse, link and structured-data evidence satisfies Stage 7. |
| Growth & Analytics Lead | **pass** | The unconfigured state is honest; Buttondown activation remains a separate external gate. |
| Business & Real Estate Editor | **pass** | Earn-unit, tracker, fee/VAT and valuation-status boundaries are internally consistent. |
| Managing Editor | **pass** | All release blockers are closed and the branch may route to the Chairman. |
| Chairman | **approved** | In-session direction on 6 August 2026: reconcile the Claude changes, put the sessions on the same page, and audit the site. Approval covers the directed local scope; no push or deployment was requested. |

Council review: `.council/sessions/2026-08-05-integrity-conversion-review-synthesis.md`.

The renewed Council review and the 6 August reconciliation audit are recorded
in `.council/sessions/2026-08-06-main-reconciliation-site-audit.md`. Publication
state still requires separate verification; no push or deployment is implied.

## Remediation evidence — 5 August 2026

> Tech pass evidence on 2026-08-05.
> Runtime: Node 22.20.0 (`.nvmrc` exact).
> Build: ✓ check (0 errors, 0 warnings, 0 hints) ✓ build (175 generated;
> 172 public pages after pruning) ✓ test (285/285).
> Lighthouse mobile 13.4.1: performance 100; accessibility 100; best
> practices 100; SEO 100. FCP 0.9 s; LCP 1.7 s; TBT 0 ms; CLS 0.
> Schema: 280/280 JSON-LD blocks parsed across 172 HTML pages; zero unknown
> terms against the official Schema.org v30.0 JSON-LD context; `/team/`
> contains `Organization` and no `Person`. The hosted validator was not used
> because submitting unpublished built HTML to a third party was not
> authorised.
> Internal links: 28,892 checked; zero unresolved.
> Search: `/dev/`, `/design-spike/` and `/style-guide/` pruned before Pagefind.
> Dependency audit: zero known vulnerabilities.
> Responsive checks: 360 px page width equals scroll width; quick links are
> 11 px; configured dark-mode newsletter button contrast is 13.83:1.
