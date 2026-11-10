# Monitoring repair and current collection evidence

Date: 2026-11-10. Author: Codex AI delegate `monitor10_repair`.
Scope: Technical/monitoring implementation and bounded read-only observations;
not independent approval of my own code, paid recovery, whole-card verification
or publication. Root owns cross-review and release.

## Fresh observations supersede the morning snapshot

The earlier 09:35 Dubai hand-off correctly found no 10 November sweep at that
time. It is no longer the latest state. I read the actual completed logs and
canonical `automation-state` health/triage through authenticated GitHub reads:

- Scheduled monitor run [42818765529](https://github.com/dubaipoints1/Property/actions/runs/42818765529),
  created 12:47:36 UTC on 10 November, genuinely executed the poll, alert
  delivery, diagnostic retention and state save. Its failure is deliberate:
  two latest due collections are still `skipped_no_credits`. Delivery and
  acknowledgement succeeded; state save `b8fe40ac722c24d1c137be3a7cedd4a0c3ba8560`.
- **Salary transfer:** latest due/observed 8 November 11:00 UTC was
  credit-skipped; latest successful retained collection is 22 October,
  21 pages. The next recorded scheduled run is 22 November 11:00 UTC.
- **Weekly press rooms:** latest due/observed 5 November 10:00 UTC was
  credit-skipped; latest successful retained collection is 29 October,
  two pages. Next recorded scheduled run is 12 November 10:00 UTC.
- **Press rooms actually recovered for their recorded latest due slot:**
  9 November 14:00 UTC completed, eight pages, zero reported errors. Check
  `01a1c09f-70cb-739b-b16e-0abf4afb156b`. Offers likewise completed at its
  9 November 13:00 UTC slot, 12 pages, check
  `01a1c067-6b39-75e6-bde9-3bdb624b9dd7`. This is actual scheduled collection
  evidence, not an inference from main's v2 endpoint change or a successful
  read-only poll. Neither is a fresh verification of every card/offer field.
- Fee documents, product pages and programme offers are current only at their
  respective retained cadences: 1 November/12 pages, 1 November/57 pages and
  4 November/six pages. No new collection was claimed for a no-new-check poll.
- Scheduled RSS [42824186681](https://github.com/dubaipoints1/Property/actions/runs/42824186681)
  genuinely ran 10 November 13:24 UTC: seven of seven feeds usable, three new
  unread leads. The digest was delivered to
  [issue528/comment6768498591](https://github.com/dubaipoints1/Property/issues/528#issuecomment-6768498591),
  then state saved as `b4c0ac8e2f334e38d8b3e41065f96930e8137558`.
  Saved titles concern flydubai's Riga/Salzburg/Vilnius announcement, an
  Avios-to-Accor conversion explainer and a British Airways reward-seat Q&A.
  These are discovery metadata only: article bodies, UAE applicability and
  any numerical terms were not read or verified by this monitoring task.

Times above describe the snapshots, not a new service-level promise. The two
credit-skipped checks do not establish the current account balance. No
monitor was forced, provisioned, re-targeted, activated or re-scheduled by me;
no paid Firecrawl/provider call was made. Existing normal schedules remain.

## Proven rolling-alert defect

The current monitor poll delivered its health warning, but GitHub rejected
the missing `monitor-health` label. The safe fallback created unlabelled
[issue532](https://github.com/dubaipoints1/Property/issues/532). The preceding
run had already created unlabelled issue529 for the same channel. Both are
open, authored by `app/github-actions`, and have the exact health-alert title
and scope lines. A subsequent `--label monitor-health` lookup cannot find
either, so every continuing outage can produce another unlabelled issue.
This is a rolling-identity defect, **not lost alert delivery**.

`scripts/ci/post-digest.sh` now preserves the existing labelled lookup and
delivery ladder while adding:

- an immutable channel marker on a newly created issue's copied body; the
  original caller digest is never altered;
- a bounded read of at most 100 open issues when labelled lookup finds none,
  accepting only an unlabelled, open Actions-authored exact-channel marker;
- a narrow migration predicate for the observed older monitor-health format,
  requiring its exact title pattern, heading and scope sentence;
- deterministic newest-created selection among known same-channel duplicates,
  with a warning; old issues are not closed, relabelled or rewritten;
- no reuse when the inspection saturates, newest timestamps tie or lookup
  fails. A warning retains the labelled-to-unlabelled-to-red delivery ladder;
  closed, human-authored, other-bot, merely similar and other-channel issues
  are never selected;
- a failure message that does not falsely assert a remote state commit before
  the caller's delivery/acknowledgement transaction has completed.

Read-only execution of the **same jq selector against actual GitHub issue
metadata** returned `duplicate:532`; no comment, title, issue, label or state
was changed by that diagnostic.

## Verification and remaining review

- `bash -n scripts/ci/post-digest.sh` passes.
- Fifteen focused digest regression tests pass. The stand-in refuses unknown
  CLI shapes and runs the production selector over realistic JSON using jq,
  rather than returning convenient preselected issue numbers. It checks the
  copied marker and preservation of the caller's body.
- The combined monitoring, delivery and digest suite executed **142 tests,
  142 pass, zero failures/skips**, using local mock servers/CLI only. Cases
  retain retryable unacknowledged detail failures, real pagination contracts,
  stale/run/path guards, salary/offer alert-only routing, dry-run suppression,
  and failed delivery/dispatch/save boundaries. This is not a live dispatch
  of the new code or proof that the two held provider collections recovered.
- No poller, provider configuration, workflow schedule, credentials, canonical
  machine state, card data, analytics or news queue was edited by this task.

Independent Technical/Council review, root's full checks, genuine exact-head
CI and authorised protected release remain separate gates. The two source
collection holds stay open until a genuinely successful relevant collection
or a separately approved recovery configuration supplies evidence; they must
not be marked repaired merely because this delivery-code change passes.
