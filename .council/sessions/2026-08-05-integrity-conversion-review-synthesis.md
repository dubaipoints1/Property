# Council session synthesis: integrity and conversion sprint review

## Initial outcome — superseded by renewed review

**Not ready for the Chairman gate.** SEO passes. The remaining eight
non-Chairman roles return four `pass-with-edits` and four `fail` verdicts.
The automated test, type, build, route-pruning and Pagefind evidence is sound,
but it is not the complete T3 release standard.

## Role verdicts

| Role | Verdict | Reason |
|---|---|---|
| Head of Research | pass-with-edits | Record the official Buttondown source supporting processing and unsubscribe copy. |
| SEO Strategist | pass | Redirect, sitemap and Pagefind treatment are coherent. |
| Fact-Checker | fail | Pre-launch messaging conflicts with live weekly-email claims; the claimed 90-day re-verification cycle is not evidenced by the implementation. |
| Standards Editor | fail | `DubaiPoints Editorial` conflicts with the mandatory real-name byline rule. |
| Head of UX | pass-with-edits | Mobile quick links fall to 8px and the configured-form button fails dark-mode text contrast; 360px remains untested. |
| Technical Lead | fail | Tests/build pass, but the required Lighthouse, JSON-LD and target-Node evidence is incomplete. |
| Growth & Analytics Lead | pass-with-edits | Activation requires confirmed Buttondown privacy, confirmation and tracking settings. |
| Business & Real Estate Editor | pass-with-edits | Unit and tracker corrections are fit; global trust blockers prevent release. |
| Managing Editor | fail | Standards conflicts, stale trust-page dates and incomplete Stage 7 evidence block routing to the Chairman. |
| Chairman | pending | The Charter does not permit approval while required roles fail. |

## Release blockers

1. Resolve the byline conflict by publishing a real named byline or obtaining a
   Chairman-approved standards amendment. Do not invent attribution.
2. Align all newsletter surfaces with the actual pre-launch state.
3. Replace the unsupported rolling-cycle claim with evidenced mechanics, or
   implement and evidence the cycle.
4. Reconcile the methodology's `never in USD` rule with source-denominator
   preservation.
5. Correct the 8px mobile navigation treatment and dark-mode newsletter-button
   contrast; verify at 360px.
6. Refresh the altered trust-page dates honestly.
7. Record the Buttondown primary source and activation/privacy conditions.
8. Complete Stage 7 on Node 22.20.0, including Lighthouse mobile and JSON-LD
   validation.

## Backlog, not blockers

- Nine missing salary-transfer offers.
- Four unpriced welcome bonuses and the remaining `needs-review` fields.
- Buttondown account activation after the integration is approved.
- Pagefind Component UI migration and post-activation analytics events.

## Decision questions for the Chairman

1. Publish a real editor name, or authorise a narrowly documented amendment to
   the real-name byline standard?
2. Authorise a remediation pass for the eight code/copy/evidence blockers above?
3. After remediation and re-review, approve the Astro 7/Node 22, homepage,
   redirect and newsletter-posture changes for a pull request?

## Renewed outcome after remediation

**Ready for the Chairman gate.** All nine required non-Chairman roles pass the
exact working tree. The Chairman's organisational-byline decision has been
recorded as a narrow standards amendment. The Council verdict routes the branch
for approval; it does not itself authorise publication or repository actions.

| Role | Renewed verdict | Basis |
|---|---|---|
| Head of Research | pass | Official Buttondown sources and the activation boundary are recorded. |
| SEO Strategist | pass | Redirect, sitemap and Pagefind treatment remain coherent. |
| Fact-Checker | pass | Launch state, cadence, VAT and pre-sampling claims now match the evidence. |
| Standards Editor | pass | The organisational-byline exception is narrow, disclosed and implemented. |
| Head of UX | pass | 360px overflow, mobile navigation and dark-mode contrast checks pass. |
| Technical Lead | pass | Exact Node 22.20.0, 285/285 tests, clean check/build, Lighthouse, links and structured data satisfy Stage 7. |
| Growth & Analytics Lead | pass | The form remains honestly disabled until external settings are approved. |
| Business & Real Estate Editor | pass | Earn-rate, tracker, fee/VAT and valuation boundaries are fit. |
| Managing Editor | pass | The final affiliate-architecture mismatch is corrected; no release blocker remains. |
| Chairman | pending | Council routing is complete; PR/publication approval remains outstanding. |

## Evidence accepted in the renewed review

- Node 22.20.0; 285/285 tests; Astro check with zero errors, warnings or hints.
- 175 generated pages; 172 public pages after internal-route pruning.
- Lighthouse mobile: 100 performance, accessibility, best practices and SEO.
- 28,892 internal links checked with zero unresolved.
- 280 JSON-LD blocks parse cleanly. The prior offline official Schema.org v30
  term check is clean; `/team/` contains `Organization` and no `Person`.
- The hosted Schema.org validator was not used because external submission of
  unpublished HTML was not authorised. The Technical Lead accepted the local
  official-context validation as proportionate.

## External gates and backlog

- Keep `PUBLIC_BUTTONDOWN_USERNAME` blank until confirmation, privacy,
  analytics and link-tracking settings are approved.
- Backfill the nine banks without a live salary-transfer offer from
  bank-specific primary-source dossiers.
- Resolve four unpriced welcome bonuses and remaining substantive
  `needs-review` fields without inference.
- Treat Pagefind Component UI migration and post-activation analytics events as
  later work, not release blockers.
