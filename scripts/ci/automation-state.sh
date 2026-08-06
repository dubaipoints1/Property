#!/usr/bin/env bash
# Read/write machine state on the unprotected `automation-state` branch.
#
# WHY THIS EXISTS. `council-signoff` is a required status check on main,
# and required checks block *every* direct push — including the
# github-actions bot. Classic branch protection has no per-actor bypass
# for status checks, and this repo's ruleset bypass picker does not offer
# the GitHub Actions app (checked 6 August 2026). So the workflows that
# used to commit dedupe state, digests and run logs straight to main
# (monitor, news-monitor, provision-monitors, scrape diagnostics) write
# to `automation-state` instead. Main only changes via pull request.
#
# The branch is an orphan: it shares no history with main and carries
# only machine-written files. Nothing under scripts/monitor/ or the site
# build reads from it implicitly — workflows call `restore` to overlay
# the state paths into the working tree before running, and `save` to
# push what a run wrote. Humans browse it on GitHub or via
# `git fetch origin automation-state`.
#
# Usage (from repo root, with push credentials configured — in Actions
# that is the persisted checkout token):
#   automation-state.sh restore <path>...
#   automation-state.sh save "<commit message>" <path>...
#
# Implementation notes, because the plumbing is deliberate:
# - A temporary GIT_INDEX_FILE keeps both subcommands from touching the
#   caller's index or checkout branch. `save` never checks the state
#   branch out at all.
# - `save` retries on non-fast-forward: the monitor and news-monitor
#   crons can overlap, and losing a push race must not lose the run's
#   state. Each retry re-reads the branch tip and re-applies this run's
#   paths on top.
# - Paths absent from the working tree are skipped, not errors: the
#   first run after a fresh provision has no state.json yet, and scrape
#   diagnostics exist only after the scrape step ran.

set -euo pipefail

BRANCH="automation-state"
REF="refs/heads/$BRANCH"
export GIT_AUTHOR_NAME="dubaipoints-automation"
export GIT_AUTHOR_EMAIL="info@dubaipoints.ae"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

die() { echo "[automation-state] ERROR: $*" >&2; exit 1; }
note() { echo "[automation-state] $*"; }

branch_exists() {
  git fetch origin "+$REF:refs/remotes/origin/$BRANCH" 2>/dev/null
}

# Build a commit from the working-tree copies of the given paths, layered
# on top of $1 (a tree-ish, or empty for an orphan root), and print the
# new commit id. Skips paths missing from the working tree.
build_commit() {
  local base="$1" msg="$2"; shift 2
  local tmp_index tree parent_args=()
  tmp_index="$(mktemp)"
  # Subshell so GIT_INDEX_FILE never leaks to the caller's git.
  tree=$(
    export GIT_INDEX_FILE="$tmp_index"
    if [ -n "$base" ]; then
      git read-tree "$base^{tree}"
    else
      git read-tree --empty
    fi
    for p in "$@"; do
      if [ -e "$p" ]; then
        git add -f -- "$p"
      else
        note "skip: $p not in working tree" >&2
      fi
    done
    git write-tree
  )
  rm -f "$tmp_index"
  if [ -n "$base" ]; then
    if [ "$tree" = "$(git rev-parse "$base^{tree}")" ]; then
      echo ""  # no change
      return 0
    fi
    parent_args=(-p "$base")
  fi
  git commit-tree "${parent_args[@]}" -m "$msg" "$tree"
}

bootstrap() {
  note "branch $BRANCH not found — bootstrapping orphan from working tree"
  local commit
  commit="$(build_commit "" "state: bootstrap automation-state branch" "$@")"
  [ -n "$commit" ] || die "bootstrap produced no commit"
  # Race-safe creation: if another run bootstrapped first, adopt theirs.
  if git push origin "$commit:$REF" 2>/dev/null; then
    note "bootstrapped $BRANCH at $commit"
  else
    branch_exists || die "could not create or fetch $BRANCH"
    note "another run bootstrapped $BRANCH first — using it"
  fi
  git fetch origin "+$REF:refs/remotes/origin/$BRANCH"
}

cmd_restore() {
  [ "$#" -ge 1 ] || die "restore needs at least one path"
  if ! branch_exists; then
    bootstrap "$@"
  fi
  local p
  for p in "$@"; do
    if git cat-file -e "origin/$BRANCH:$p" 2>/dev/null; then
      git restore --source "origin/$BRANCH" -- "$p"
      note "restored $p from $BRANCH"
    else
      note "skip restore: $p not on $BRANCH yet"
    fi
  done
}

cmd_save() {
  [ "$#" -ge 2 ] || die "save needs a message and at least one path"
  local msg="$1"; shift
  if ! branch_exists; then
    bootstrap "$@"
    # Bootstrap already captured the working tree; nothing further to do.
    return 0
  fi
  local attempt commit
  for attempt in 1 2 3; do
    commit="$(build_commit "origin/$BRANCH" "$msg" "$@")"
    if [ -z "$commit" ]; then
      note "no state changes to save"
      return 0
    fi
    if git push origin "$commit:$REF" 2>/dev/null; then
      note "saved state as $commit (attempt $attempt)"
      return 0
    fi
    note "push race on attempt $attempt — refetching"
    git fetch origin "+$REF:refs/remotes/origin/$BRANCH"
  done
  die "could not push state after 3 attempts"
}

case "${1:-}" in
  restore) shift; cmd_restore "$@" ;;
  save)    shift; cmd_save "$@" ;;
  *) die "usage: automation-state.sh restore <path>... | save <msg> <path>..." ;;
esac
