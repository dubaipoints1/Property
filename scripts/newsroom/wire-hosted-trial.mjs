// Hosted read-only smoke: two passes over fixed public surfaces, with the
// first baseline held only in memory. Only aggregate counts leave this file.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { BATCHES, SOURCES } from "./wire-sources.mjs";
import { buildWireReport, probeFeedBatch } from "./wire.mjs";
import { PAGE_IDS, probeOfficialPage } from "./wire-pages.mjs";

const RSS_IDS = BATCHES.flatMap((batch) => batch.sourceIds);
const FAST_IDS = ["aeroroutes", "loyaltylobby", "what-s-on-uae",
  "time-out-dubai", "fintech-news-middle-east", "simple-flying"];
const PAGE_ID_SET = new Set(PAGE_IDS);
const OVERLAP = new Set(["signals-changed", "no-change-in-observed-window"]);
export const REPEAT_PAUSE_MS = 75_000;
if (RSS_IDS.length !== 43 || new Set(RSS_IDS).size !== 43
  || FAST_IDS.length !== 6 || !FAST_IDS.every((id) => RSS_IDS.includes(id))
  || PAGE_IDS.length !== 6 || PAGE_ID_SET.size !== 6
  || PAGE_IDS.some((id) => !SOURCES.some((source) => source.id === id && source.method === "manual"))) {
  throw new Error("Unexpected hosted trial source registry.");
}

function utcMillis(timestamp) {
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== timestamp) throw new Error("Invalid trial clock.");
  return ms;
}

async function collect({ profile, fetchBatch, fetchPage, now, baseline }) {
  const startedAt = now();
  const start = utcMillis(startedAt);
  const observations = [];
  for (const sourceIds of profile === "fast" ? [FAST_IDS] : BATCHES.map((b) => b.sourceIds)) {
    const rows = await fetchBatch(sourceIds);
    if (!Array.isArray(rows) || rows.length !== sourceIds.length
      || rows.some((row, i) => row?.sourceId !== sourceIds[i])) throw new Error("Incomplete RSS observations.");
    observations.push(...rows);
  }
  if (profile === "full") {
    for (const id of PAGE_IDS) {
      const row = await fetchPage(id);
      if (row?.sourceId !== id) throw new Error("Incomplete official-page observations.");
      observations.push(row);
    }
  }
  const finishedAt = now();
  const end = utcMillis(finishedAt);
  if (end < start || observations.some(row => utcMillis(row.observedAt) < start)) {
    throw new Error("Observation is not from this trial pass.");
  }
  const report = buildWireReport({ observations, baseline, asOf: finishedAt });
  const group = (isPage) => {
    const rows = report.receipts.filter(({ sourceId }) => PAGE_ID_SET.has(sourceId) === isPage);
    return {
      attempted: rows.length,
      usable: rows.filter((row) => row.status === "baseline-only" || OVERLAP.has(row.status)).length,
      compared: rows.filter((row) => OVERLAP.has(row.status)).length,
      gaps: rows.filter((row) => row.status === "coverage-gap").map((row) => row.sourceId),
      capped: rows.filter((row) => row.truncated).map((row) => row.sourceId),
    };
  };
  const rss = group(false);
  const officialPages = group(true);
  return { startedAt, finishedAt, rss, officialPages, report };
}

function totals(pass) {
  return {
    startedAt: pass.startedAt,
    finishedAt: pass.finishedAt,
    rss: pass.rss,
    officialPages: pass.officialPages,
    newBaselines: pass.report.receipts.filter(row => row.status === "baseline-only").length,
    sourcesWithOverlap: pass.report.receipts.filter(row => OVERLAP.has(row.status)).length,
    unchangedSources: pass.report.receipts.filter(row => row.status === "no-change-in-observed-window").length,
    noOverlap: pass.report.receipts.filter(row => row.status === "coverage-gap"
      && row.detail === "Source windows have no overlap; inspect before re-baselining.").map(row => row.sourceId),
  };
}

export async function runHostedTrial({ profile = "full", mode = "baseline", fetchBatch = probeFeedBatch,
  fetchPage = probeOfficialPage, now = () => new Date().toISOString(),
  sleep = milliseconds => delay(milliseconds + 100) } = {}) {
  if (!["fast", "rss", "full"].includes(profile)) throw new Error("Unknown hosted trial profile.");
  if (!["baseline", "repeat"].includes(mode)) throw new Error("Unknown hosted trial mode.");
  const args = { profile, fetchBatch, fetchPage, now };
  const first = await collect(args);
  const firstSummary = totals(first);
  const { startedAt, finishedAt, rss, officialPages } = firstSummary;
  const baselineState = rss.usable + officialPages.usable === 0 ? "all-gaps"
    : rss.gaps.length + officialPages.gaps.length > 0 ? "partial-baseline" : "baseline";
  if (mode === "repeat") {
    if (baselineState === "all-gaps") return {
      mode: "hosted-repeat-discovery-only", profile, state: "missing-first-baseline", first: firstSummary,
      second: null, newToBothPasses: 0, priorUrlResightingsSuppressed: 0,
      materialChanges: 0, unverifiedLeads: 0, editorialQueueSupplied: false, publicationReady: false,
    };
    await sleep(REPEAT_PAUSE_MS);
    const second = await collect({ ...args, baseline: first.report.nextBaseline });
    const elapsed = utcMillis(second.startedAt) - utcMillis(finishedAt);
    if (elapsed < REPEAT_PAUSE_MS) throw new Error("Second pass did not start after the bounded pause.");
    const secondSummary = totals(second);
    const previouslySeen = new Set(first.report.nextBaseline.sources.flatMap(s => s.items.map(i => i.url)));
    let newToBothPasses = 0;
    let priorUrlResightingsSuppressed = 0;
    let materialChanges = 0;
    for (const lead of second.report.leads) {
      // A newly seen URL in a second source may already have been present
      // in a first-pass source. It is not a new story for this trial.
      if (lead.sightings.some(s => s.kind === "material-signal-changed")) materialChanges++;
      else if (previouslySeen.has(lead.url)) priorUrlResightingsSuppressed++;
      else newToBothPasses++;
    }
    return {
      mode: "hosted-repeat-discovery-only", profile,
      state: secondSummary.sourcesWithOverlap === 0 ? "no-comparable-sources"
        : newToBothPasses + materialChanges > 0 ? "compared-with-unverified-changes" : "compared-no-changes",
      first: firstSummary, second: secondSummary, pauseMilliseconds: elapsed,
      newToBothPasses, priorUrlResightingsSuppressed, materialChanges,
      unverifiedLeads: newToBothPasses + materialChanges,
      editorialQueueSupplied: false, publicationReady: false,
    };
  }
  return {
    mode: "hosted-probe-baseline-only",
    profile,
    startedAt,
    finishedAt,
    state: baselineState,
    rss,
    officialPages,
    newBaselines: rss.usable + officialPages.usable,
    unverifiedLeads: 0,
    editorialQueueSupplied: false,
    publicationReady: false,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    // Standalone hosted entry is only the fixed full repeat. Keep profiles
    // injectable for offline fixtures, not for workflow input or CLI use.
    if (process.argv.length !== 4 || process.argv[2] !== "full" || process.argv[3] !== "repeat"
      || !process.env.PATH || Object.keys(process.env).some(name => name !== "PATH")) {
      throw new Error("Unexpected trial invocation or environment.");
    }
    const result = await runHostedTrial({ profile: "full", mode: "repeat" });
    const receipt = JSON.stringify(result, null, 2) + "\n";
    if (Buffer.byteLength(receipt) > 8192 || /https?:\/\//i.test(receipt)) {
      throw new Error("Invalid aggregate receipt.");
    }
    process.stdout.write(receipt);
    if (!result.second?.rss.compared || !result.second?.officialPages.compared) process.exitCode = 2;
  } catch {
    // Do not pass through an upstream body, request data or output path.
    console.error("Hosted Newswire trial rejected its inputs or observations.");
    process.exitCode = 1;
  }
}
