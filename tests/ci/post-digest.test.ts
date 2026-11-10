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

// The fallback executes the production jq selector over realistic issue JSON,
// rather than conveniently returning an issue number irrespective of scope.
// STUB_FAIL: list, fallback-list, comment, edit, create-labelled, create-unlabelled.
const STUB = `#!/usr/bin/env bash
printf '%s' "$*" | tr '\\n' ' ' >> "$STUB_LOG"
printf '\\n' >> "$STUB_LOG"
fails() { case " $STUB_FAIL " in *" $1 "*) return 0;; esac; return 1; }
[ "$1" = "issue" ] || { echo "stub: unknown command" >&2; exit 2; }
case "$2" in
  list)
    if [[ "$*" == *"--label "* ]]; then
      [[ "$*" == *"--state open --limit 1 --json number --jq "* ]] || { echo "stub: bad labelled list" >&2; exit 2; }
      fails list && exit 1
      [ -n "$STUB_OPEN" ] && echo "$STUB_OPEN"
    else
      [[ "$3 $4 $5 $6 $7 $8 $9" == "--state open --limit 100 --json number,title,body,labels,author,state,createdAt --jq" ]] || { echo "stub: bad fallback list" >&2; exit 2; }
      fails fallback-list && exit 1
      printf '%s' "$STUB_FALLBACK_JSON" | jq -r "\${!#}" || exit $?
    fi
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
    cp "$6" "$STUB_CAPTURE"
    if [ "$7" = "--label" ]; then fails create-labelled && exit 1
    else fails create-unlabelled && exit 1; fi
    exit 0 ;;
esac
echo "stub: unknown subcommand" >&2; exit 2
`;

function run(open: string, fail: string, bodyText = "# digest\n",
  options: { fallback?: any[]; label?: string } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "post-digest-"));
  try {
    const bin = join(dir, "bin");
    spawnSync("mkdir", [bin]);
    writeFileSync(join(bin, "gh"), STUB);
    chmodSync(join(bin, "gh"), 0o755);
    const body = join(dir, "digest.md");
    writeFileSync(body, bodyText);
    const log = join(dir, "calls.log");
    const capture = join(dir, "created-body.md");
    const r = spawnSync(
      "bash",
      [SCRIPT, options.label ?? "news-digest", "News digest: 2026-09-26-0949", body],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          STUB_LOG: log,
          STUB_OPEN: open,
          STUB_FAIL: fail,
          STUB_FALLBACK_JSON: JSON.stringify(options.fallback ?? []),
          STUB_CAPTURE: capture,
        },
      },
    );
    const calls = existsSync(log)
      ? readFileSync(log, "utf8").trim().split("\n")
      : [];
    return { status: r.status, out: r.stdout + r.stderr, calls,
      createdBody: existsSync(capture) ? readFileSync(capture, "utf8") : null,
      originalBody: readFileSync(body, "utf8") };
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
  assert.deepEqual(ops(r.calls), ["issue list", "issue list", "issue create"]);
  assert.match(r.calls[2], /--label news-digest$/);
  assert.equal(r.createdBody, "<!-- dubaipoints:rolling-digest:news-digest -->\n\n# digest\n");
  assert.equal(r.originalBody, "# digest\n");
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
  assert.deepEqual(ops(r.calls), ["issue list", "issue list", "issue create"]);
});

test("a refused label falls back to an unlabelled issue", () => {
  const r = run("", "create-labelled");
  assert.equal(r.status, 0, r.out);
  assert.equal(r.calls.length, 4);
  assert.doesNotMatch(r.calls[3], /--label/);
});

test("when every path fails the run goes red, never a silent green", () => {
  const r = run("", "create-labelled create-unlabelled");
  assert.equal(r.status, 1);
  assert.match(r.out, /::error title=news-digest alert lost::/);
  assert.doesNotMatch(r.out, /digest is committed to automation-state/);
  assert.match(r.out, /inspect the caller's retained digest and acknowledgement state/);
});

test("an empty digest file is an error, not an empty issue", () => {
  const r = run("407", "", "");
  assert.equal(r.status, 1);
  assert.deepEqual(r.calls, []);
});

const alert = (number: number, overrides: Record<string, unknown> = {}) => ({
  number,
  title: "Monitor coverage alert: run 42818765529",
  body: "<!-- dubaipoints:rolling-digest:monitor-health -->\n\n# Monitor health — 2026-11-10T12:47:51.683Z\n\nNo monitor was created, executed, activated or reconfigured by this poll.\n",
  labels: [],
  author: { is_bot: true, login: "app/github-actions" },
  state: "OPEN",
  createdAt: "2026-11-10T12:48:04Z",
  ...overrides,
});

test("a missing label reuses this channel's exact unlabelled Actions alert", () => {
  const r = run("", "", "# digest\n", { label: "monitor-health", fallback: [alert(532)] });
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue list", "issue comment", "issue edit"]);
  assert.match(r.calls[2], /^issue comment 532 /);
  assert.equal(r.createdBody, null);
});

test("actual legacy health alerts migrate deterministically to the newest open bot alert", () => {
  const legacy = (number: number, createdAt: string) => alert(number, {
    createdAt,
    body: "# Monitor health — 2026-11-10T12:47:51.683Z\n\nNo monitor was created, executed, activated or reconfigured by this poll.\n",
  });
  const r = run("", "", "# digest\n", { label: "monitor-health", fallback: [
    legacy(529, "2026-11-09T13:04:00Z"), legacy(532, "2026-11-10T12:48:04Z"),
  ] });
  assert.equal(r.status, 0, r.out);
  assert.match(r.calls[2], /^issue comment 532 /);
  assert.match(r.out, /duplicate fallback alerts/);
  assert.equal(r.createdBody, null);
});

test("closed, cross-channel, labelled, human and merely similar alerts are never reused", () => {
  const candidates = [
    alert(1, { state: "CLOSED" }),
    alert(2, { author: { is_bot: false, login: "reader" } }),
    alert(3, { labels: [{ name: "unrelated" }] }),
    alert(4, { body: "<!-- dubaipoints:rolling-digest:news-digest -->" }),
    alert(5, { body: "# Monitor health — copied heading without the exact scope line" }),
    alert(6, { author: { is_bot: true, login: "another-bot" } }),
    alert(7, { body: "Diagnostics quoting a marker:\n<!-- dubaipoints:rolling-digest:monitor-health -->\n\n# unrelated" }),
    alert(8, { body: "<!-- dubaipoints:rolling-digest:news-digest -->\n\n<!-- dubaipoints:rolling-digest:monitor-health -->\n\n# unrelated" }),
    alert(9, { body: "<!-- dubaipoints:rolling-digest:monitor-health -->\n# missing canonical separator" }),
  ];
  const r = run("", "", "# digest\n", { label: "monitor-health", fallback: candidates });
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue list", "issue create"]);
  assert.match(r.createdBody!, /^<!-- dubaipoints:rolling-digest:monitor-health -->/);
});

test("an unambiguous tagged news fallback also survives refused labels", () => {
  const r = run("", "", "# digest\n", { fallback: [alert(710, {
    body: "<!-- dubaipoints:rolling-digest:news-digest -->\n\n# news",
    title: "News digest: 2026-11-10-1324",
  })] });
  assert.equal(r.status, 0, r.out);
  assert.match(r.calls[2], /^issue comment 710 /);
});

test("saturated, tied and failed fallback reads keep the delivery ladder, never choose arbitrarily", () => {
  for (const variant of ["saturated", "tied", "failed"]) {
    const fallback = variant === "saturated"
      ? Array.from({ length: 100 }, (_, index) => alert(index + 1))
      : [alert(1), alert(2)];
    const r = run("", variant === "failed" ? "fallback-list" : "", "# digest\n", {
      label: "monitor-health", fallback,
    });
    assert.equal(r.status, 0, `${variant}: ${r.out}`);
    assert.deepEqual(ops(r.calls), ["issue list", "issue list", "issue create"], variant);
    assert.match(r.out, /fallback lookup incomplete/, variant);
  }
});

test("a failed fallback comment still attempts both issue-creation paths", () => {
  const r = run("", "comment create-labelled", "# digest\n", {
    label: "monitor-health", fallback: [alert(532)],
  });
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(ops(r.calls), ["issue list", "issue list", "issue comment", "issue create", "issue create"]);
  assert.doesNotMatch(r.calls[4], /--label/);
});

test("an invalid channel identifier fails before any GitHub operation", () => {
  const r = run("", "", "# digest\n", { label: "news-digest\";unrelated" });
  assert.equal(r.status, 1);
  assert.deepEqual(r.calls, []);
  assert.match(r.out, /Digest identity invalid/);
});
