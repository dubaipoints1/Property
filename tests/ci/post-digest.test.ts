// Regression guard for scripts/ci/post-digest.sh.
//
// Until 26 September 2026 every monitoring run opened a fresh GitHub
// issue, and the open list reached eleven digests in five days. The
// script now appends to the label's open issue instead — but the older
// guarantee still has to hold: a digest that cannot reach the rolling
// issue must fall through to a labelled issue, then an unlabelled one,
// then a red run. Never a silent green.
//
// The stand-in `gh` refuses any invocation it does not recognise, so the
// script cannot pass by calling something the real CLI would reject
// (see the poll.test.ts warning in CLAUDE.md: a fake more permissive than
// the service it stands for proves nothing).

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../scripts/ci/post-digest.sh",
);

// Emulates the four `gh` shapes the script uses. STUB_OPEN is the number of
// the open labelled issue (empty = none); STUB_FAIL lists operations that
// fail: list, comment, edit, create-labelled, create-unlabelled.
const STUB = `#!/usr/bin/env bash
echo "$*" >> "$STUB_LOG"
fails() { case " $STUB_FAIL " in *" $1 "*) return 0;; esac; return 1; }
[ "$1" = "issue" ] || { echo "stub: unknown command" >&2; exit 2; }
case "$2" in
  list)
    [[ "$*" == *"--label "*"--state open"*"--json number"*"--jq"* ]] || { echo "stub: bad list" >&2; exit 2; }
    fails list && exit 1
    [ -n "$STUB_OPEN" ] && echo "$STUB_OPEN"
    exit 0 ;;
  comment)
    [[ "$3" =~ ^[0-9]+$ && "$4" = "--body-file" && -s "$5" ]] || { echo "stub: bad comment" >&2; exit 2; }
    fails comment && exit 1
    exit 0 ;;
  edit)
    [[ "$3" =~ ^[0-9]+$ && "$4" = "--title" && -n "$5" ]] || { echo "stub: bad edit" >&2; exit 2; }
    fails edit && exit 1
    exit 0 ;;
  create)
    [[ "$3" = "--title" && -n "$4" && "$5" = "--body-file" && -s "$6" ]] || { echo "stub: bad create" >&2; exit 2; }
    if [ "$7" = "--label" ]; then fails create-labelled && exit 1
    else fails create-unlabelled && exit 1; fi
    exit 0 ;;
esac
echo "stub: unknown subcommand" >&2; exit 2
`;

function run(open: string, fail: string, bodyText = "# digest\n") {
  const dir = mkdtempSync(join(tmpdir(), "post-digest-"));
  try {
    const bin = join(dir, "bin");
    spawnSync("mkdir", [bin]);
    writeFileSync(join(bin, "gh"), STUB);
    chmodSync(join(bin, "gh"), 0o755);
    const body = join(dir, "digest.md");
    writeFileSync(body, bodyText);
    const log = join(dir, "calls.log");
    const r = spawnSync(
      "bash",
      [SCRIPT, "news-digest", "News digest: 2026-09-26-0949", body],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          STUB_LOG: log,
          STUB_OPEN: open,
          STUB_FAIL: fail,
        },
      },
    );
    const calls = existsSync(log)
      ? readFileSync(log, "utf8").trim().split("\n")
      : [];
    return { status: r.status, out: r.stdout + r.stderr, calls };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const ops = (calls: string[]) => calls.map((c) => c.split(" ").slice(0, 2).join(" "));

test("an open labelled issue gets the digest as a comment, no new issue", () => {
  const r = run("407", "");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue comment", "issue edit"]);
  assert.match(r.calls[1], /^issue comment 407 /);
  assert.match(r.calls[2], /^issue edit 407 --title News digest: 2026-09-26-0949$/);
});

test("no open issue opens a labelled one", () => {
  const r = run("", "");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue create"]);
  assert.match(r.calls[1], /--label news-digest$/);
});

test("a failed title edit warns but does not fail a delivered digest", () => {
  const r = run("407", "edit");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /::warning/);
  assert.equal(ops(r.calls).filter((o) => o === "issue create").length, 0);
});

test("an unreachable rolling issue falls through to a new issue", () => {
  const r = run("407", "comment");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue comment", "issue create"]);
});

test("a failed lookup is treated as no issue, never as delivered", () => {
  const r = run("407", "list");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue create"]);
});

test("a refused label falls back to an unlabelled issue", () => {
  const r = run("", "create-labelled");
  assert.equal(r.status, 0, r.out);
  assert.equal(r.calls.length, 3);
  assert.doesNotMatch(r.calls[2], /--label/);
});

test("when every path fails the run goes red, never a silent green", () => {
  const r = run("", "create-labelled create-unlabelled");
  assert.equal(r.status, 1);
  assert.match(r.out, /::error title=news-digest alert lost::/);
});

test("an empty digest file is an error, not an empty issue", () => {
  const r = run("407", "", "");
  assert.equal(r.status, 1);
  assert.deepEqual(r.calls, []);
});
