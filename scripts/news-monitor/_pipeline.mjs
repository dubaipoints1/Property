// Deterministic intake only: no article fetch, LLM, typed financial data or
// publication. Public feed metadata is untrusted data, never instructions.
import { isIP } from "node:net";
import { scanMetadata, relevanceFor, suggestedDesk } from "./_feeds.mjs";

export const LIMITS = Object.freeze({ bytes: 4 * 1024 * 1024, timeoutMs: 20_000, redirects: 3, items: 25, seen: 300, url: 4096, title: 500 });
const TRACKING = /^(?:utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid)$/i;

export function plainText(value, limit = LIMITS.title) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, limit);
}

export function markdownText(value) {
  return plainText(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/([\\`*_{}\[\]|#])/g, "\\$1").replace(/@/g, "@\u200b");
}

export function canonicalUrl(value) {
  if (typeof value !== "string" || value.length > LIMITS.url || /[\u0000-\u0020\u007f<>"`\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
      isIP(host.replace(/^\[|\]$/g, "")) || !host.includes(".") ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host)) return null;
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    return url.href;
  } catch { return null; }
}

// Safe GitHub Markdown destination, preserving the URL's identity. No raw
// feed URL can break out of its link or become an issue/team mention.
export function markdownUrl(url) {
  return url.replace(/[()\[\]<>@]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function feedShape(xml) {
  return scanMetadata(xml, { maxItems: 0 }).status;
}

export async function fetchFeed(feed, fetchImpl = fetch, limits = LIMITS) {
  const initial = canonicalUrl(feed.url);
  if (!initial) throw new Error("invalid configured HTTPS feed URL");
  let url = initial;
  const signal = AbortSignal.timeout(limits.timeoutMs);
  for (let redirects = 0; redirects <= limits.redirects; redirects++) {
    const response = await fetchImpl(url, {
      headers: { "user-agent": "dubaipoints-news-monitor/1.1 (+https://dubaipoints.ae)" },
      redirect: "manual", signal,
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      const next = location && canonicalUrl(new URL(location, url).href);
      // Only the declared host (or its www alias) is trusted for redirects.
      if (!next || new URL(next).hostname.replace(/^www\./, "") !== new URL(initial).hostname.replace(/^www\./, "")) throw new Error("unexpected feed redirect; verify destination before accepting it");
      url = next;
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
    if (response.status !== 200) { await response.body?.cancel(); throw new Error(`incomplete/unexpected HTTP ${response.status}`); }
    const announced = Number(response.headers.get("content-length"));
    if (announced > limits.bytes) { await response.body?.cancel(); throw new Error("feed exceeds response-byte limit"); }
    if (!response.body) throw new Error("empty response body");
    const chunks = [];
    let bytes = 0;
    const reader = response.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > limits.bytes) throw new Error("feed exceeds response-byte limit");
        chunks.push(value);
      }
    } catch (error) { await reader.cancel(); throw error; }
    return { xml: Buffer.concat(chunks).toString("utf8"), bytes, finalUrl: url };
  }
  throw new Error("feed redirect limit exceeded");
}

export async function discover({ feeds, state, now, fetchImpl = fetch, limits = LIMITS }) {
  if (!state || typeof state.seen !== "object" || state.seen === null || Array.isArray(state.seen) ||
    Object.values(state.seen).some((keys) => !Array.isArray(keys) || keys.some((key) => typeof key !== "string"))) throw new Error("Invalid existing news state; refusing to reset deduplication history");
  const sightings = new Map();
  const results = [];
  for (const feed of feeds) {
    const result = { sourceId: feed.id, source: plainText(feed.name), feedUrl: feed.url, tier: feed.tier,
      status: "failed", parsed: 0, inspected: 0, usable: 0, relevant: 0, newSightings: 0, alreadySeen: 0, passedOver: 0, rejected: 0, undated: 0, bytes: 0 };
    try {
      const { xml, bytes } = await fetchFeed(feed, fetchImpl, limits);
      result.bytes = bytes;
      const scanned = scanMetadata(xml, { maxBytes: limits.bytes, maxItems: limits.items });
      const shape = scanned.status;
      if (shape !== "items") { result.status = shape; result.reason = shape === "empty" ? "Feed envelope has no items; coverage unconfirmed, not a no-new result." : "Body is not a supported complete RSS/Atom feed."; results.push(result); continue; }
      const parsed = scanned.items;
      result.parsed = scanned.count;
      const seen = new Set((state.seen[feed.id] ?? []).map(canonicalUrl).filter(Boolean));
      const bucket = state.seen[feed.id] ?? [];
      for (const item of parsed.slice(0, limits.items)) {
        result.inspected++;
        const title = plainText(item.title);
        const link = canonicalUrl(item.link);
        if (!title || !link) { result.rejected++; continue; }
        result.usable++;
        const relevance = relevanceFor(feed, title);
        if (!relevance.keep) { if (relevance.reason.startsWith("Passed over")) result.passedOver++; continue; }
        result.relevant++;
        const date = plainText(item.date, 120);
        const parsedDate = Date.parse(date);
        const publishedAt = Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : null;
        if (!publishedAt) result.undated++;
        const isNew = !seen.has(link);
        if (isNew) {
          bucket.push(link);
          seen.add(link);
          result.newSightings++;
        } else result.alreadySeen++;
        let lead = sightings.get(link);
        if (!lead) {
          lead = { status: "discovered-unread", verified: false, discoveredAt: now.toISOString(), desk: suggestedDesk(title),
            title, link, publishedAt, reportedDate: date || null, relevanceReason: relevance.reason, sources: [], newThisRun: false };
          sightings.set(link, lead);
        }
        lead.newThisRun ||= isNew;
        if (!lead.sources.some((source) => source.sourceId === feed.id)) lead.sources.push({ sourceId: feed.id, source: plainText(feed.name),
          tier: feed.tier, feedUrl: feed.url, reportedLink: item.link, reportedDate: date || null, publishedAt });
      }
      if (bucket.length) state.seen[feed.id] = bucket.slice(-limits.seen);
      result.status = result.usable ? (result.rejected || result.undated ? "degraded" : "ok") : "invalid";
      if (!result.usable) result.reason = "No usable title/public HTTPS article links in the inspected window.";
      else if (result.rejected || result.undated) result.reason = "Some metadata was unsafe, incomplete or undated; inspect coverage before relying on this source.";
    } catch (error) {
      // Never persist raw exception text, which can include an untrusted URL.
      result.reason = /^(HTTP \d+|incomplete\/unexpected HTTP \d+|feed exceeds response-byte limit|empty response body|unexpected feed redirect; verify destination before accepting it|feed redirect limit exceeded|invalid configured HTTPS feed URL)$/.test(error.message)
        ? error.message : error.name === "TimeoutError" || error.name === "AbortError" ? "Feed request timed out." : "Feed transport/read failed; check source availability from the runner.";
    }
    results.push(result);
  }
  const items = [...sightings.values()].filter((lead) => lead.newThisRun).map(({ newThisRun, ...lead }) => lead);
  const usableFeeds = results.filter((result) => result.status === "ok" || result.status === "degraded").length;
  const coverageGaps = results.filter((result) => result.status !== "ok");
  return { state, health: { schemaVersion: 1, checkedAt: now.toISOString(), status: usableFeeds === 0 ? "failed" : coverageGaps.length ? "degraded" : "ok", usableFeeds, configuredFeeds: feeds.length,
    newLeads: items.length, inspectedWindowPerFeed: limits.items, results }, triage: { schemaVersion: 1, checkedAt: now.toISOString(), status: "discovered-unread", verified: false,
    note: "Latest-run snapshot only, not a managed backlog. Read full sources, resolve UAE eligibility and desk/currency ownership, fact-check and obtain existing Council approval before drafting/publishing. No newsletter.", items },
    exitCode: usableFeeds === 0 ? 1 : 0 };
}

export function renderDigest({ health, triage }) {
  const lines = [`# News discovery — ${health.checkedAt}`, "", `Coverage: ${health.status.toUpperCase()} · ${health.usableFeeds}/${health.configuredFeeds} feeds usable · ${health.newLeads} new unread leads.`, "",
    `Mode: ${health.mode ?? "test"} · run: ${markdownText(health.runId ?? "local")} · state basis: ${markdownText(health.stateBasis ?? "test fixture")}.`, "",
    "All items are DISCOVERED / UNREAD / NOT VERIFIED. A primary feed is source provenance, not a verified story. Secondary news may be cited only after reading, with named inline attribution under the 27 September 2026 amendment. Primary first when readable; original wording; state what remains unconfirmed.", "",
    "The Chairman removed numerical weekly news ceilings on 7 November 2026. Publish only useful, original, source-checked stories; no volume quota. Existing Fact-Checker/Council/Chairman publication gates and incident/safety/security exclusion remain. No automatic article, publication, paid activation or newsletter.", "", "## Feed health", "",
    "| Feed | Outcome | Parsed / inspected | Relevant / new sightings | Coverage note |", "|---|---|---|---|---|"];
  for (const row of health.results) lines.push(`| ${markdownText(row.source)} | ${row.status} | ${row.parsed} / ${row.inspected} | ${row.relevant} / ${row.newSightings} | ${markdownText(row.reason ?? "Healthy read; zero new sightings means no new lead, not a failure.")} |`);
  lines.push("", `Only the first ${health.inspectedWindowPerFeed} items per feed are inspected (existing bounded window). Parsed totals are not full coverage. Rejected metadata, missing dates and passed-over incident candidates are counted in latest-health.json.`, "");
  if (health.status !== "ok") lines.push("## Coverage gaps — action required", "", "Check the affected public feed from the runner; distinguish transport/blocked access from a dead source. Do not reset state, provision a monitor, retry a paid route or substitute a guessed URL. Zero usable feeds makes this run fail after saving diagnostics.", "");
  for (const item of triage.items) {
    lines.push(`## ${markdownText(item.title)}`, "", `Suggested desk: ${item.desk} · state: discovered-unread · NOT VERIFIED`, "",
      `[Open source article](${markdownUrl(item.link)})`, "", `Reported date: ${markdownText(item.reportedDate ?? "unknown")} (feed metadata; not independently confirmed).`, "",
      markdownText(item.relevanceReason), "", "Provenance:");
    for (const source of item.sources) lines.push(`- ${markdownText(source.source)} (${source.tier}; ${markdownText(source.sourceId)}) · ${markdownText(source.reportedDate ?? "date unknown")}`);
    lines.push("");
  }
  if (!triage.items.length) lines.push("No new unread leads in the inspected windows. This does not mean no relevant news exists.", "");
  return `${lines.join("\n")}\n`;
}
