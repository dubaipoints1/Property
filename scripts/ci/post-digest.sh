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

# Labels may be missing (monitor-health on 10 November 2026). Keep an exact
# body identity as well, so the unlabelled fallback can be found next time.
# Only the workflow's fixed kebab-case labels enter this jq expression.
if [[ ! "$label" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "::error title=Digest identity invalid::Expected a fixed kebab-case digest label."
  exit 1
fi
marker="<!-- dubaipoints:rolling-digest:${label} -->"

# A failed lookup is not "no open issue" in any meaningful sense, but the
# safe reading of it is the same: open a new issue rather than drop the
# digest.
existing="$(gh issue list --label "$label" --state open --limit 1 \
  --json number --jq '.[0].number // empty' 2>/dev/null)" || existing=""

if [ -z "$existing" ]; then
  # A bounded, unfiltered open-issue read avoids depending on search indexing
  # of HTML comments. Match only this channel's marker on an Actions-authored,
  # unlabelled issue. One narrow migration rule recognises the actual older
  # health alerts; arbitrary unlabelled issues are never used as a fallback.
  fallback="$(gh issue list --state open --limit 100 \
    --json number,title,body,labels,author,state,createdAt --jq '
      if length >= 100 then "saturated" else
        map(select(.state == "OPEN" and (.labels | length) == 0)
          | select(.author.is_bot == true and .author.login == "app/github-actions")
          | select((.body // "" | startswith("'"$marker"'\n\n")) or
            ("'"$label"'" == "monitor-health"
             and (.title | test("^Monitor coverage alert: run [0-9]+$"))
             and (.body // "" | startswith("# Monitor health — "))
             and (.body // "" | contains("No monitor was created, executed, activated or reconfigured by this poll.")))))
        | sort_by(.createdAt) | reverse
        | if length == 0 then empty
          elif length > 1 and .[0].createdAt == .[1].createdAt then "ambiguous"
          elif length > 1 then "duplicate:" + (.[0].number | tostring)
          else .[0].number | tostring end
      end' 2>/dev/null)" || fallback="lookup-failed"
  case "$fallback" in
    duplicate:*)
      existing="${fallback#duplicate:}"
      echo "::warning title=${label} duplicate fallback alerts::Using the newest exact channel alert #${existing}; older open alerts remain unchanged." ;;
    saturated|ambiguous|lookup-failed)
      echo "::warning title=${label} fallback lookup incomplete::Could not establish an unambiguous rolling alert (${fallback}); preserving the new-issue delivery ladder." ;;
    "") ;;
    *[!0-9]*)
      echo "::warning title=${label} fallback identity invalid::Ignoring an unexpected lookup result; preserving the new-issue delivery ladder." ;;
    *) existing="$fallback" ;;
  esac
fi

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

# Tag only the new issue's copy; never edit the supplied digest or old alerts.
tagged_body="$(mktemp "${TMPDIR:-/tmp}/dubaipoints-digest.XXXXXX")" || exit 1
trap 'rm -f -- "$tagged_body"' EXIT
{ printf '%s\n\n' "$marker"; cat -- "$body"; } > "$tagged_body" || exit 1

gh issue create --title "$title" --body-file "$tagged_body" --label "$label" \
  || gh issue create --title "$title" --body-file "$tagged_body" \
  || { echo "::error title=${label} alert lost::Could not open an issue for ${body}. No successful issue delivery is established; inspect the caller's retained digest and acknowledgement state."; exit 1; }
