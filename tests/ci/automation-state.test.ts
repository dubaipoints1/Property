// Regression guard for scripts/ci/automation-state.sh `save`.
//
// Two crons (monitor, news-monitor) write digests under the same
// directory and each `save`s that directory from its own working tree —
// a checkout of main plus whatever that run wrote. Before 14 September
// 2026 the script staged the directory with a plain `git add`, which
// also stages the *removal* of tracked files missing from the working
// tree, so every save deleted the digests the other cron had written
// since main's snapshot (106 files lost from the branch by 13 Sep).
//
// This test drives the real script against a throwaway bare "origin":
// run A saves digest-a, run B (a fresh clone that never had digest-a)
// saves digest-b, and both must survive on the state branch. A file B
// *did* rewrite must still take B's content.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../scripts/ci/automation-state.sh",
);

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@t",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@t",
    },
  }).trim();
}

function save(cwd: string, msg: string, ...paths: string[]): void {
  execFileSync("bash", [SCRIPT, "save", msg, ...paths], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("save never deletes state files written by another run", () => {
  const root = mkdtempSync(join(tmpdir(), "automation-state-"));
  try {
    const bare = join(root, "origin.git");
    git(root, "init", "-q", "--bare", "-b", "main", bare);

    // Seed main so clones have a checkout to work in.
    const a = join(root, "a");
    git(root, "clone", "-q", bare, a);
    writeFileSync(join(a, "README.md"), "seed\n");
    git(a, "add", "README.md");
    git(a, "commit", "-q", "-m", "seed");
    git(a, "push", "-q", "origin", "main");

    // Run A: writes digest-a and state v1, saves (bootstraps the branch).
    mkdirSync(join(a, ".council/monitoring"), { recursive: true });
    mkdirSync(join(a, "data/monitor"), { recursive: true });
    writeFileSync(join(a, ".council/monitoring/digest-a.md"), "a\n");
    writeFileSync(join(a, "data/monitor/state.json"), '{"v":1}\n');
    save(a, "run a", ".council/monitoring", "data/monitor");

    // Run B: a fresh clone of main — no digest-a in its working tree —
    // writes digest-b and state v2, saves the same directories.
    const b = join(root, "b");
    git(root, "clone", "-q", bare, b);
    mkdirSync(join(b, ".council/monitoring"), { recursive: true });
    mkdirSync(join(b, "data/monitor"), { recursive: true });
    writeFileSync(join(b, ".council/monitoring/digest-b.md"), "b\n");
    writeFileSync(join(b, "data/monitor/state.json"), '{"v":2}\n');
    save(b, "run b", ".council/monitoring", "data/monitor");

    git(b, "fetch", "-q", "origin", "automation-state");
    const files = git(b, "ls-tree", "-r", "--name-only", "origin/automation-state")
      .split("\n")
      .sort();
    assert.deepEqual(files, [
      ".council/monitoring/digest-a.md",
      ".council/monitoring/digest-b.md",
      "data/monitor/state.json",
    ]);
    assert.equal(
      git(b, "show", "origin/automation-state:data/monitor/state.json"),
      '{"v":2}',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
