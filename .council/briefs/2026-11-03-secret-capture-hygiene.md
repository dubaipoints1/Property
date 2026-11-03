---
slug: secret-capture-hygiene
vertical: travel-experiences
assigned-editor: travel-experiences-editor
research-status: complete
seo-status: complete
draft-status: complete
factcheck-status: passed
tech-status: passed-local-ci-pending
chairman-status: approved
target-publish: 2026-11-03
---

# Prevent API keys entering research captures

Chairman direction in-session, 2026-11-03: “i have no idea what it is can you fix it”.
Tier T3: a new CI check within the existing validation workflow.

## Problem and evidence

GitHub alert #1 points to `candidates/dnata-home.html:39` in historical commit
`5328b17201d6a6c5e64d4ff92f20407ba8e21740` (“Logo candidates”). The capture's
title and canonical identify dnata Travel. Its `GoogleMapsAPIKey` value matches
the value currently in that site's publicly served HTML, confirmed by hash
comparison without displaying or using the value. GitHub reports validity
unknown. No Google-style key was found in any fetched remote branch tip;
the offending file is absent from current `main`. Push protection is enabled.

## Scope and acceptance

- Keep raw candidates local and reject forced-in HTML/JSON captures in CI.
- Detect Google-style key strings in tracked text without logging values.
- Run on `push` to Codex as well as Claude branches, plus PRs and main.
- Prove detection and log redaction with a synthetic runtime-only fixture.
- Record the third-party-source alert disposition; do not claim revocation,
  ownership, absence of misuse or removal from historical objects.

No website UI, financial data, credentials, history rewrite or Claude branch
change is required. Standard full validation and Council review precede merge.

## Council review and validation

The three Council review tasks covered every required T3 role; the final
outcomes and limitations are recorded in
`.council/sessions/2026-11-03-secret-capture-hygiene.md`.
All reviewers passed after the Technical Lead's three edge cases were fixed.
Local check: zero errors/warnings, ten existing hints. Build: passed, including
20,165 resolved internal links. Four scanner tests, including two real-CLI
regressions, passed.
The full local suite had a macOS Bash compatibility failure in the unchanged
automation-state script; Linux/Node 22 CI remains required before merge.

## Sources

- GitHub alert #1 and its locations API (authenticated read, value excluded).
- Historical HTML inspected from the identified blob; value never logged.
- https://www.dnatatravel.com (public HTML, exact key hash comparison).
- https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret
- https://developers.google.com/maps/api-security-best-practices
