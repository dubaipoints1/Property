import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { REPEAT_PAUSE_MS, runHostedTrial } from "../../scripts/newsroom/wire-hosted-trial.mjs";
import { SOURCES } from "../../scripts/newsroom/wire-sources.mjs";

const timestamp = "2026-11-18T09:00:00.000Z";
function observation(id: string, kind: "usable" | "gap" = "usable") {
  const source = SOURCES.find((s) => s.id === id)!;
  return {
    sourceId: id, observedAt: timestamp, surfaceUrl: source.url, status: kind,
    items: kind === "usable" ? [{ title: "Private-bound test title", url: source.url }] : [],
    detail: "Private-bound observation detail",
  };
}

test("full hosted trial covers reviewed feeds and pages, exposing only aggregate baseline results", async () => {
  const r = await runHostedTrial({
    fetchBatch: async (ids: string[]) => ids.map((id) => observation(id, id === "simple-flying" ? "gap" : "usable")),
    fetchPage: async (id: string) => observation(id),
    now: () => timestamp,
  });
  assert.deepEqual(r.rss, { attempted: 43, usable: 42, compared: 0, gaps: ["simple-flying"], capped: [] });
  assert.equal(r.officialPages.attempted, 6);
  assert.equal(r.officialPages.usable, 6);
  assert.equal(r.state, "partial-baseline");
  assert.equal(r.newBaselines, 48);
  assert.equal(r.unverifiedLeads, 0);
  assert.equal(r.publicationReady, false);
  assert.doesNotMatch(JSON.stringify(r), /Private-bound|https?:\/\/|nextBaseline/);
});

test("fast cycle does not call page sources and distinguishes total coverage failure", async () => {
  const r = await runHostedTrial({
    profile: "fast",
    fetchBatch: async (ids: string[]) => ids.map((id) => observation(id, "gap")),
    fetchPage: async () => { throw new Error("No page expected"); },
    now: () => timestamp,
  });
  assert.equal(r.rss.attempted, 6);
  assert.equal(r.rss.usable, 0);
  assert.equal(r.officialPages.attempted, 0);
  assert.equal(r.state, "all-gaps");
});

test("refuses incomplete batches and does not accept arbitrary profiles or publish", async () => {
  await assert.rejects(runHostedTrial({ profile: "fast", fetchBatch: async () => [] }), /Incomplete RSS/);
  await assert.rejects(runHostedTrial({ profile: "https://example.com" }), /Unknown hosted trial profile/);
});

test("two passes compare the first in-memory baseline and withhold duplicates and gaps", async () => {
  const times = [timestamp, "2026-11-18T09:02:00.000Z"];
  const makeItem = (sourceId: string, path: string, title = "Private-bound Dubai fixture") =>
    ({ url: new URL(path, SOURCES.find(s => s.id === sourceId)!.url).href, title });
  let pass = 0;
  const row = (id: string) => {
    const original = observation(id);
    const result = { ...original, observedAt: times[pass], items: [makeItem(id, "/" + id)] };
    if (!pass && id === "turning-left-for-less") {
      return { ...result, status: "gap", items: [] };
    }
    if (!pass) return result;
    if (id === "simple-flying") return { ...result, items: [makeItem(id, "/no-overlap")] };
    if (id === "time-out-dubai") result.items.unshift(makeItem(id, "/new-dubai-item"));
    if (id === "loyaltylobby") result.items[0].title = "Private-bound changed Dubai terms";
    if (id === "hospitality-net-hotel-openings") {
      result.items.unshift(makeItem(id, "/hospitality-net-middle-east-africa"));
    }
    return result;
  };
  const r = await runHostedTrial({ mode: "repeat", fetchBatch: async ids => ids.map(row),
    fetchPage: async id => ({ ...observation(id), observedAt: times[pass] }),
    now: () => times[pass],
    sleep: async ms => { assert.equal(ms, REPEAT_PAUSE_MS); pass++; } });
  assert.equal(pass, 1);
  assert.equal(r.first.rss.usable, 42);
  assert.equal(r.first.newBaselines, 48);
  assert.equal(r.second?.rss.usable, 42);
  assert.equal(r.second?.officialPages.usable, 6);
  assert.equal(r.second?.newBaselines, 1);
  assert.equal(r.second?.sourcesWithOverlap, 47);
  assert.equal(r.second?.rss.compared, 41);
  assert.equal(r.second?.officialPages.compared, 6);
  assert.equal(r.second?.unchangedSources, 44);
  assert.deepEqual(r.second?.noOverlap, ["simple-flying"]);
  assert.equal(r.newToBothPasses, 1);
  assert.equal(r.materialChanges, 1);
  assert.equal(r.priorUrlResightingsSuppressed, 1);
  assert.equal(r.unverifiedLeads, 2);
  assert.equal(r.state, "compared-with-unverified-changes");
  assert.equal(r.editorialQueueSupplied, false);
  assert.equal(r.publicationReady, false);
  assert.doesNotMatch(JSON.stringify(r), /Private-bound|https?:\/\/|nextBaseline/);
});

test("zero genuine changes or zero comparable sources are different outcomes", async () => {
  const t1 = "2026-11-18T09:02:00.000Z";
  for (const secondKind of ["usable", "gap"] as const) {
    let second = false;
    const r = await runHostedTrial({ mode: "repeat", profile: "fast",
      fetchBatch: async ids => ids.map(id => ({
        ...observation(id, second ? secondKind : "usable"),
        observedAt: second ? t1 : timestamp,
      })),
      now: () => second ? t1 : timestamp,
      sleep: async () => { second = true; } });
    assert.equal(r.second?.sourcesWithOverlap, secondKind === "usable" ? 6 : 0);
    assert.equal(r.unverifiedLeads, 0);
    assert.equal(r.state, secondKind === "usable" ? "compared-no-changes" : "no-comparable-sources");
  }
});

test("total first-pass gaps stop without a second public fetch", async () => {
  const r = await runHostedTrial({ mode: "repeat", profile: "fast",
    fetchBatch: async ids => ids.map(id => observation(id, "gap")),
    sleep: async () => { throw new Error("No second fetch expected."); }, now: () => timestamp });
  assert.equal(r.state, "missing-first-baseline");
  assert.equal(r.second, null);
  assert.equal(r.unverifiedLeads, 0);
});

test("hosted CLI refuses credentials and alternate invocations before fetching anything", () => {
  const script = fileURLToPath(new URL("../../scripts/newsroom/wire-hosted-trial.mjs", import.meta.url));
  for (const [args, env] of [
    [["full", "repeat"], { PATH: "/usr/bin:/bin", GH_TOKEN: "synthetic-do-not-print" }],
    [["fast", "repeat"], { PATH: "/usr/bin:/bin" }],
  ] as const) {
    const result = spawnSync(process.execPath, [script, ...args], { env, encoding: "utf8", timeout: 2000 });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr.trim(), "Hosted Newswire trial rejected its inputs or observations.");
  }
});

test("hosted workflow has no dispatch, schedule, or write permissions and only runs on creation", () => {
  const result = parse(readFileSync(new URL("../../.github/workflows/newswire-hosted-trial.yml", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(result.on), ["push"]);
  assert.deepEqual(result.on.push.branches, ["codex/newswire-hosted-oneoff-2026-11-20-f71b"]);
  assert.deepEqual(result.permissions, { contents: "read" });
  assert.match(result.jobs.probe.if, /github\.repository == 'dubaipoints1\/Property'/);
  assert.match(result.jobs.probe.if, /github\.ref == 'refs\/heads\/codex\/newswire-hosted-oneoff-2026-11-20-f71b'/);
  assert.match(result.jobs.probe.if, /github\.event\.created/);
  assert.match(result.jobs.probe.if, /github\.run_attempt == 1/);
  assert.equal(result.jobs.probe.steps[0].with["persist-credentials"], false);
  const workflow = JSON.stringify(result);
  assert.match(workflow, /CF-Pages-Skip/);
  assert.doesNotMatch(workflow, /secrets\.|workflow_dispatch|\btee\b|GH_TOKEN/);
  const collect = result.jobs.probe.steps.find(step => step.id === "collect");
  assert.match(collect.run, /env -i PATH="\$PATH" node scripts\/newsroom\/wire-hosted-trial\.mjs full repeat > "\$receipt"/);
  const artifact = result.jobs.probe.steps.find(step => step.uses?.startsWith("actions/upload-artifact@"));
  assert.match(artifact.with.path, /\/newswire-hosted-receipt\.json$/);
  assert.equal(artifact.with["retention-days"], 2);
});
