import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderDigest } from "../../scripts/news-monitor/_pipeline.mjs";

test("current news instructions remove numerical ceilings but retain human publication and source gates", () => {
  const charter = readFileSync("CLAUDE.md", "utf8");
  assert.match(charter, /2026-11-07 — No numerical weekly news ceiling/);
  assert.match(charter, /There is no fixed numerical weekly ceiling on airline or hotel news/);
  for (const desk of ["airline", "hotel"]) {
    const agent = readFileSync(`.claude/agents/${desk}-news-editor.md`, "utf8");
    assert.match(agent, /Cadence: no fixed numerical weekly limit or volume quota/);
    assert.doesNotMatch(agent, /- Cadence: 2–3 stories\/week/);
  }
  const digest = renderDigest({
    health: { checkedAt: "2026-11-07T12:00:00Z", status: "ok", usableFeeds: 0, configuredFeeds: 0, newLeads: 0, inspectedWindowPerFeed: 25, results: [] },
    triage: { items: [] },
  });
  assert.match(digest, /removed numerical weekly news ceilings/);
  assert.doesNotMatch(digest, /weekly ceiling \(2–3 airline/);
  assert.match(digest, /Fact-Checker\/Council\/Chairman publication gates/);
  assert.match(digest, /No automatic article, publication, paid activation or newsletter/);
});
