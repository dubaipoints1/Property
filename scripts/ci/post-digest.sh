#!/usr/bin/env bash
# Deliver a monitoring digest to a human as a GitHub issue — ONE rolling
# issue per label, not one issue per run.
#
#   post-digest.sh <label> <title> <body-file>
#
# Until 26 September 2026 every run opened a fresh issue. With the news
# monitor on two crons and the change poller on a third, that was up to
# four new issues a day, none ever closed, and by the 26th the open list
# was eleven digests deep — the reader stopped being able to tell what was
# new. So: if an issue carrying <label> is already open, the digest is
# appended to it as a comment (which notifies exactly like a new issue
# does) and the title is moved to the latest stamp. Closing the issue is
# how a human says "handled"; the next digest then opens a fresh one.
#
# The delivery guarantee is unchanged and is the load-bearing part: every
# path that cannot reach the rolling issue falls through to the old
# ladder — labelled issue, then unlabelled issue, then a red run. Never
# swallow a failure on this path; a digest nobody reads is the failure the
# monitoring pipeline exists to prevent (CLAUDE.md, "Monitoring").

set -uo pipefail

label="${1:?usage: post-digest.sh <label> <title> <body-file>}"
title="${2:?usage: post-digest.sh <label> <title> <body-file>}"
body="${3:?usage: post-digest.sh <label> <title> <body-file>}"

if [ ! -s "$body" ]; then
  echo "::error title=${label} alert lost::Digest file '$body' is missing or empty."
  exit 1
fi

# A failed lookup is not "no open issue" in any meaningful sense, but the
# safe reading of it is the same: open a new issue rather than drop the
# digest.
existing="$(gh issue list --label "$label" --state open --limit 1 \
  --json number --jq '.[0].number // empty' 2>/dev/null)" || existing=""

if [ -n "$existing" ]; then
  if gh issue comment "$existing" --body-file "$body"; then
    # Cosmetic: keeps the issue list showing the latest stamp. The digest
    # has already been delivered, so a failure here warns, never fails.
    gh issue edit "$existing" --title "$title" >/dev/null \
      || echo "::warning title=${label} title not updated::Digest appended to #${existing}, but its title still shows an older stamp."
    echo "Appended digest to open ${label} issue #${existing}."
    exit 0
  fi
  echo "::warning title=${label} rolling issue unreachable::Could not comment on #${existing}; opening a new issue instead."
fi

gh issue create --title "$title" --body-file "$body" --label "$label" \
  || gh issue create --title "$title" --body-file "$body" \
  || { echo "::error title=${label} alert lost::Could not open an issue for ${body}. The digest is committed to automation-state but nobody has been notified."; exit 1; }
