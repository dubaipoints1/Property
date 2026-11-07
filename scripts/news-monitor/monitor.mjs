// Free, bounded RSS/Atom discovery. This never reads article bodies, writes
// site content, advances editorial approval or publishes. CLAUDE.md's
// 27 September 2026 attribution amendment governs later news reporting.
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { RSS_FEEDS } from "./_feeds.mjs";
import { discover, renderDigest } from "./_pipeline.mjs";

const STATE_PATH = "data/news-monitor/state.json";

export async function runMonitor({ feeds = RSS_FEEDS, now = new Date(), fetchImpl = fetch,
  dryRun = process.env.NEWS_MONITOR_DRY_RUN === "true", runId = process.env.GITHUB_RUN_ID ?? "local" } = {}) {
  const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, "utf8")) : { seen: {} };
  let previousHealth;
  try { previousHealth = JSON.parse(readFileSync("data/news-monitor/latest-health.json", "utf8")); } catch { /* first snapshot or unreadable diagnostics: report current coverage */ }
  const outcome = await discover({ feeds, state, now, fetchImpl });
  for (const snapshot of [outcome.health, outcome.triage]) {
    snapshot.runId = runId;
    snapshot.mode = dryRun ? "preview-dry-run" : "live-discovery";
    snapshot.stateBasis = dryRun ? "checked-out frozen seed; NOT current automation-state" : "restored automation-state (workflow); checked-out state when invoked locally";
  }
  mkdirSync("data/news-monitor", { recursive: true });
  if (!dryRun) writeFileSync(STATE_PATH, JSON.stringify(outcome.state, null, 2));
  writeFileSync("data/news-monitor/latest-health.json", `${JSON.stringify(outcome.health, null, 2)}\n`);
  writeFileSync("data/news-monitor/latest-triage.json", `${JSON.stringify(outcome.triage, null, 2)}\n`);
  const digest = renderDigest(outcome);
  if (dryRun) console.log("PREVIEW DRY RUN — no state/digest persistence, issue or publication. Deduplication uses the checked-out frozen seed, not current canonical state.");
  for (const row of outcome.health.results) console.log(`[rss] ${row.sourceId}: ${row.status} (${row.inspected} inspected, ${row.relevant} relevant, ${row.newSightings} new sightings)`);
  console.log(`Coverage ${outcome.health.status}: ${outcome.health.usableFeeds}/${feeds.length} usable; ${outcome.health.newLeads} new unread leads.`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, digest);
  if (outcome.health.status !== "ok") console.log("::warning::News feed coverage is incomplete; inspect the health summary. No-new is not a health failure.");
  // Existing rolling issue, with no repeated comments for an unchanged outage.
  // Every run still retains its diagnostic snapshots and reports coverage.
  const fingerprint = (health) => JSON.stringify(health?.results?.map((row) => [row.sourceId, row.status, row.reason ?? ""]) ?? []);
  const changedCoverage = fingerprint(previousHealth) !== fingerprint(outcome.health);
  const alertCoverage = changedCoverage && (outcome.health.status !== "ok" || (previousHealth && previousHealth.status !== "ok"));
  if (!dryRun && (outcome.triage.items.length || alertCoverage)) {
    const stamp = now.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
    const digestPath = `.council/monitoring/digest-${stamp}.md`;
    mkdirSync(".council/monitoring", { recursive: true });
    writeFileSync(digestPath, digest);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `digest_path=${digestPath}\n`);
    console.log(`Digest written: ${digestPath}`);
  } else if (!dryRun) console.log(outcome.health.status === "ok" ? "Healthy reads; no new items — no alert digest needed." : "Coverage gap unchanged; diagnostics retained, no duplicate alert comment.");
  // Advertise persistence only after all required local output is written.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `health_written=${runId}\n`);
    if (!dryRun) appendFileSync(process.env.GITHUB_OUTPUT, `state_written=${runId}\n`);
  }
  return outcome;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = (await runMonitor()).exitCode; }
  catch {
    // An unreadable/corrupt state is a hard failure, never a blank baseline.
    // Do not dump exception text: it could contain stored untrusted metadata.
    console.error("::error::News discovery could not safely read state or write diagnostics. Existing deduplication state was not intentionally reset; inspect this run before retrying.");
    process.exitCode = 1;
  }
}
