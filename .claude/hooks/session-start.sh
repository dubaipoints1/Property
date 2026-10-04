#!/bin/bash
# SessionStart: install dependencies in Claude Code cloud sessions so
# `npm run check`, `npm test` and `npm run build` work from the first turn.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Chromium is pre-installed in the web container; never let a postinstall
# fetch another copy (CLAUDE.md, "Audit harness").
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# npm install (not ci) so the cached container state is reused between sessions.
npm install --no-audit --no-fund
