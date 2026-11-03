# Council review — research capture hygiene

Date: 2026-11-03. Tier: T3. Scope: owner-directed repair of secret-scanning
alert #1 and a targeted recurrence check. Approval: Mostafa's in-session
“i have no idea what it is can you fix it”, under the 2026-08-06 amendment.

## Actual specialist reviews

| Role | Reviewer task | Final outcome |
|---|---|---|
| Head of Research | security_technical_review | Pass: source attribution is bounded; no key use or ownership claim. |
| Fact-Checker | security_technical_review | Pass after corrections: rejection/redaction claims match the implementation. |
| Technical Lead | security_technical_review | Pass: four targeted tests and clean repository scan; full Linux CI still required. |
| Standards Editor | security_experience_review | Pass: no revocation, purge or confirmed-owner claim. |
| Head of UX | security_experience_review | Pass: bounded no public UI impact; operational directions are clear. |
| SEO Strategist | security_experience_review | Pass: no route, metadata, structured-data or linking impact. |
| Growth & Analytics Lead | security_experience_review | Pass: no analytics, distribution or paid-service change. |
| Travel Section Editor | security_release_review | Pass: no public travel, imagery, licensing or financial-data change. |
| Managing Editor | security_release_review | Pass: scope and owner direction are sufficient; CI must actually run. |
| Chairman | Mostafa, in-session | Approved for the directed security repair. |

## Findings corrected before release

The Technical Lead reproduced three bypasses: binary/symlink paths skipped
the capture rule; key-shaped filenames could be logged; newline-containing
capture paths evaded the regex. The final code and real-CLI tests cover each.
The experience review's workflow-comment clarification was also applied.

## Evidence and limits

- All fetched remote branch tips were scanned for Google-style key strings
  using Git's filename-only output; none was found.
- Historical dnata capture and currently public dnata homepage contained an
  identical key, compared by hash with no Google API request or value output.
- GitHub reports validity unknown; push protection is already enabled.
- The historical object remains retrievable. Provider ownership, restrictions,
  validity, revocation status and misuse are not established by this review.
- Local Astro check: zero errors/warnings, ten existing hints. Build passed:
  315 routes, 313 indexed pages, CSP validation and 20,165 internal links.
- Four targeted scanner tests passed. Full local suite: 542/547 initially
  passed; four loopback-listener tests passed on an authorised rerun; the
  unchanged automation-state test requires Linux Bash. Do not count it green
  until the GitHub Linux/Node 22 validation workflow executes successfully.

## Alert disposition after release

Once CI passes and the prevention change is merged, closing alert #1 as
`wont_fix` is an administrative disposition for a third-party historical
capture. Record that no revocation was performed by this session and provider
status remains unknown. Do not mark it `false_positive` or `revoked`, claim
credential remediation, rewrite Git history or contact the source owner under
this approval. No Claude branch needs modifying.
