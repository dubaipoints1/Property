# Measurement readiness and concurrent merge observations — 2026-11-10

Author: Codex AI delegate `release10_exact_head_review`. This delegate was
independent of PR530's implementation authors, but authored the new offline
readiness tool below and therefore does **not** independently approve it.
Root/another reviewer must review that implementation before release.

## Concurrent PR530 merge: actual sequence, not a reconstructed gate

Read-only GitHub observations:

- Exact reviewed PR head was `f87d28e06ee9931a7583aa8b7c13338952bc1fdd`.
  Both push/PR validations genuinely executed installation, source guards,
  Astro check, build and tests before the merge. PR run42849975161's actual
  test log showed 1,189 passes, zero failures/skips; both validations
  completed by 16:00:38 UTC.
- Login `Yazco1` marked PR530 ready at 16:01:53 UTC, merged it at
  **16:02:29 UTC** to `c8e309c1e5069da689b637b69125476dfd291c0e`, and
  deleted its head branch at 16:02:37 UTC. These are the API's actor and
  timestamps, not proof of who physically operated that login. This
  delegate/root did not execute that merge.
- The genuinely executed **pre-merge** Council run42850488864 completed at
  16:02:18 UTC. Its captured body still had Chairman `pending`, and the
  parser explicitly rejected it at 16:02:15 UTC. The advisory workflow's
  green status does **not** establish approved-body acceptance before merge.
- The later approved PR body, its 16:05 Council evaluation, and root's
  subsequent record-only commit031d1e8 are later evidence. They must not be
  presented as gates completed before the earlier merge.
- Merged-main validation42850599571 genuinely executed installation,
  guards, check, build and tests, completing successfully at 16:04:27 UTC.
  Cloudflare's commit check reports success at 16:04:53 UTC for deployment
  `cf96cb99-08c6-4391-aea6-326b822034ae`. This is hosting-check metadata,
  not this delegate's inspection of Production environment, commit aliases
  or canonical browser runtime. Root must record those observations separately.

Evidence: [PR530](https://github.com/dubaipoints1/Property/pull/530),
[pre-merge validation](https://github.com/dubaipoints1/Property/actions/runs/42849975161),
[pre-merge Council](https://github.com/dubaipoints1/Property/actions/runs/42850488864),
[merged-main validation](https://github.com/dubaipoints1/Property/actions/runs/42850599571),
read 2026-11-10. No PR, issue, workflow, branch or account mutation was made
by this reconciliation.

## Current measurement authority

The owner explicitly reiterated: **leave tracking settings unchanged**.
The owner is not sure whether an existing Search Console property exists;
do not turn that uncertainty into either a verified absence or access.
The 9 November measurement protocol's source/report limitations remain.
No new tag, event, property, consent/filter/redaction setting, account
switch, ownership verification, DNS edit or analytics worker is authorised
by this diagnostic. No private audience totals or visitor inputs are saved.

## Implemented local readiness check

Run manually from the repository:

```sh
node scripts/analytics/readiness.mjs
node scripts/analytics/readiness.mjs --json
```

The tool reads seven fixed source files under the selected repository.
Real paths outside it, missing/non-file inputs and oversized sources fail
closed with non-reflective errors. It does not execute the inspected
source, inspect environment values/credentials, fetch an account, send
telemetry, read a visitor export or write a report. JSON/Markdown output
contains named source checks and outstanding evidence—not source contents,
identifiers, financial query values or visitor totals. It is opt-in, not
a new CI/release gate or scheduled monitoring job.

Actual current output recognises the shared standard Google bootstrap,
production/main source predicate and Cloudflare environment/production
gate. These are recognisable source patterns, **not proof of fresh live
delivery, configured environment values or hosting-side beacon injection**.
Changed/unrecognised patterns require manual review; this is not a general
JavaScript semantic analyser or a substitute for existing runtime tests.

The output explicitly retains:

1. **Plausible financial-query risk.** The real journey code writes the
   `salary`, `cv_spend` and `st_salary` keys; Tracker/Calculator update
   browser history; the standard tag remains live source wiring. Google's
   default page location contains the URL query, and Enhanced Measurement
   can independently send history pageviews even when the config disables
   its own initial pageview. This establishes a code/documentation risk,
   **not an observation of transmitted real visitor values**. The separate
   uninstalled review planner does not protect the live standard tag.
2. **Known bots are not all automation.** Google's automatic exclusion is
   for known bots; owner/developer/browser-QA exclusion has not been
   validated here. Cloudflare's bot filter must be checked on each actual
   dashboard read. This tool cannot promise bot-free people counts.
3. **Missing measurement evidence.** No fresh GA4 report, internal/QA filter
   evidence, Cloudflare period/filter read, Search Console property/query
   report or fictional-value network test was obtained. Missing access is
   not zero traffic, and a source-only report cannot manufacture queries.
4. **Metric separation.** GA4 Total users differs from Active users;
   Cloudflare visits/views are not unique people. Do not sum daily/page
   users, extrapolate a partial installation month, or infer applications,
   approvals, commission or cash received from navigation.

Current primary documentation was read through ordinary free public
browsing, with no paid Firecrawl call:

- [Google user metrics](https://support.google.com/analytics/answer/12253918?hl=en).
- [Google known-bot exclusion](https://support.google.com/analytics/answer/9888366?hl=en).
- [Google pageview defaults and independent history events](https://developers.google.com/analytics/devguides/collection/ga4/views).
- [Search Console performance scope](https://support.google.com/webmasters/answer/7576553?hl=en).

## Executed tests and remaining work

Ran the new readiness file with the three existing analytics test files:
**31 passed, zero failures/skips**. Eight new cases cover actual source
wiring, query/history risk, unknown-source holds, changed-pattern negative
cases, no arbitrary source/value echo, metric/access limitations, CLI
input/error handling and absence of execution/network/environment/write
mechanisms. An initial negative fixture replaced a comment rather than
the real Cloudflare expression; the fixture was corrected to mutate the
actual expression, then the full four-file run passed. No production
behaviour was changed to satisfy it. The local CLI genuinely executed.

This is not independent review of the new tool, a full repository suite,
an Astro/build/browser check, an account connection, a completed audience
report or a production release. Root owns integration, independent review
and subsequent genuine release gates. With settings held unchanged and
Search Console access uncertain, current permitted progress is an honest
readiness/measurement protocol—not a claim that all measurement gaps are fixed.
