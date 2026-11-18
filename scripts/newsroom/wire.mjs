import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { requestArchiveBody, validateArchiveUrl } from "../ci/fetch-sources.mjs";
import { hasLatin } from "../news-monitor/_feeds.mjs";
import { canonicalUrl, plainText } from "../news-monitor/_pipeline.mjs";
import { scanMetadata } from "../news-monitor/_xml.mjs";
import { validateQueue } from "./report.mjs";
import { BATCHES, SOURCES } from "./wire-sources.mjs";

const DEFAULT_ROWS = 25;
// The 13 November receipt had eight feeds larger than the default window.
// Extend only the exact registered sources, with bounded headroom.
const LONG_FEED_ROWS = new Map([
  ["schiphol-airport", 64], ["al-khaleej-tourism-and-aviation", 64],
  ["hfp", 40], ["mainly-miles", 96],
  ["time-out-dubai", 192], ["finance-middle-east-banking-and-insurance", 224],
  ["ch-aviation", 64], ["aerotime", 128],
]);
const rowLimit = id => LONG_FEED_ROWS.get(id) ?? DEFAULT_ROWS;
const historyLimit = id => Math.max(150, rowLimit(id) * 2);
const MAX_JSON = 4 * 1024 * 1024;
const MAX_FEED = 4 * 1024 * 1024;
const MAX_BATCH = 9;
const MAX_CONCURRENT = 4;
const ids = new Map(SOURCES.map(row => [row.id, row]));
const batchIds = new Map(BATCHES.map(batch => [batch.id, batch.sourceIds]));
const hash = value => createHash("sha256").update(value).digest("hex");
const host = url => new URL(url).hostname.replace(/^www\./, "");
const assert = (ok, message) => { if (!ok) throw Error(message); };
const object = value => value && typeof value === "object" && !Array.isArray(value);
const timestamp = value => typeof value === "string" &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const excluded = /\b(?:syria(?:n)?|damascus|aleppo|latakia|accident|crash|emergenc(?:y|ies)|diversion|diverted|hijack\w*|terror\w*|violence|assault|safety incident|security incident|(?:staff|crew) misconduct)\b|سوري[اة]|دمشق|حلب|اللاذقية|حادث|تحطم|طوارئ|اختطاف|اعتداء|إرهاب/i;
const needsScope = /\b(?:disruption|suspend(?:s|ed|ing)?|suspension|closure|cancel(?:s|led|lation)?)\b/i;
const locality = /\b(?:UAE|United Arab Emirates|Dubai|Abu Dhabi|Sharjah|Ajman|Ras Al Khaimah|RAK|Fujairah|Umm Al Quwain|Al Ain|DXB|AUH|SHJ|DWC|Yas Island)\b|الإمارات|دبي|أبو ظبي|أبوظبي|الشارقة|عجمان|رأس الخيمة|الفجيرة|أم القيوين/i;
const soon = /\b(?:register by|book by|ends? (?:on|soon)|expir\w*|deadline|last chance|cut-?off|forfeit\w*|devalu\w*)\b/i;
const action = /\b(?:earn\w*|redeem\w*|redemption|bonus|transfer\w*|status match|award|points|miles|avios|registration|discount|offer)\b/i;

function parseLocal(file) {
  const bytes = readFileSync(file);
  assert(bytes.length <= MAX_JSON, "Local input exceeds size limit.");
  return JSON.parse(bytes.toString("utf8"));
}

// The Dutch-language feed hosts point to their English publisher newsrooms.
// This applies to article identities only, never outbound feed redirects.
const articleHosts = new Map([["klm", "news.klm.com"], ["schiphol-airport", "news.schiphol.com"]]);
const ihgArticlePath = /^\/en\/news-and-media\/news-releases\/\d{4}\/[a-z0-9][a-z0-9-]*\/?$/i;
function publisherArticleUrl(source, value) {
  const legacyIhg = source.id === "ihg-emeaa-newsroom" && typeof value === "string" &&
    value.startsWith("http://www.ihgplc.com/en/news-and-media/news-releases/");
  const url = canonicalUrl(legacyIhg ? value.replace(/^http:/, "https:") : value);
  if (!url) return null;
  const parsed = new URL(url);
  if (legacyIhg && !ihgArticlePath.test(parsed.pathname)) return null;
  return host(url) === host(source.url) || parsed.hostname === articleHosts.get(source.id) ? url : null;
}

function itemFor(source, value) {
  assert(object(value), "Malformed source item.");
  const url = publisherArticleUrl(source, value.url);
  const title = plainText(value.title);
  assert(url && title, "Invalid publisher item identity or title.");
  // This is a scoped, operator-supplied change label from a public HTML
  // section, not a full-page hash or an independently verified claim.
  const note = plainText(value.note, 600);
  const reportedAt = plainText(value.reportedAt, 120) || null;
  return { url, title, note, reportedAt };
}

function validateObservations(rows, { baseline = false, asOf = null } = {}) {
  assert(Array.isArray(rows) && rows.length <= SOURCES.length, "Invalid observation list.");
  const seen = new Set();
  return rows.map(row => {
    assert(object(row) && ids.has(row.sourceId) && !seen.has(row.sourceId), "Invalid or duplicate observation source.");
    seen.add(row.sourceId);
    assert(timestamp(row.observedAt), "Observation timestamp must be explicit UTC ISO.");
    if (asOf) assert(Date.parse(row.observedAt) <= Date.parse(asOf), "Observation timestamp is in the future.");
    const source = ids.get(row.sourceId);
    assert(row.surfaceUrl === source.url, "Observation must identify the exact configured source surface.");
    const limit = rowLimit(row.sourceId);
    assert(["usable", "gap"].includes(row.status) && Array.isArray(row.items) && row.items.length <= limit,
      "Invalid observation status/items.");
    assert(row.status === "usable" ? row.items.length > 0 : !row.items.length, "Empty or partial observation cannot establish a baseline.");
    const window = row.window;
    if (window != null) {
      assert(source.method === "rss" && row.status === "usable" && object(window) &&
        Number.isSafeInteger(window.limit) && window.limit > 0 && window.limit <= limit &&
        Number.isSafeInteger(window.returned) && window.returned > 0 && window.returned <= MAX_FEED &&
        window.inspected === Math.min(window.limit, window.returned) && row.items.length <= window.inspected,
      "Invalid RSS observation window counts.");
    }
    const completedWindowLimit = row.completedWindowLimit;
    if (completedWindowLimit != null) {
      assert(baseline && window != null && Number.isSafeInteger(completedWindowLimit) &&
        completedWindowLimit >= DEFAULT_ROWS && completedWindowLimit <= window.limit,
      "Invalid RSS baseline window checkpoint.");
    }
    const items = row.items.map(value => itemFor(source, value)).filter(item => !source.latinOnly || hasLatin(item.title));
    assert(row.status === "gap" || items.length, "No usable language edition in the bounded source window.");
    assert(new Set(items.map(item => item.url)).size === items.length, "Duplicate item URLs in one source observation.");
    const history = row.history ?? [];
    assert(Array.isArray(history) && history.length <= historyLimit(row.sourceId) && (baseline || !history.length), "Invalid snapshot history.");
    const parsedHistory = new Map();
    for (const entry of history) {
      const url = publisherArticleUrl(source, entry?.url);
      assert(url && /^[a-f0-9]{64}$/.test(entry?.signature) && !parsedHistory.has(url),
        "Invalid or duplicate snapshot history entry.");
      parsedHistory.set(url, entry.signature);
    }
    return { sourceId: row.sourceId, surfaceUrl: source.url, observedAt: row.observedAt, status: row.status,
      items, detail: plainText(row.detail, 240) || null,
      ...(window != null ? { window: { limit: window.limit, returned: window.returned, inspected: window.inspected } } : {}),
      ...(completedWindowLimit != null ? { completedWindowLimit } : {}),
      ...(baseline ? { history: [...parsedHistory].map(([url, signature]) => ({ url, signature })) } : {}) };
  });
}

const signature = item => hash(JSON.stringify([item.title, item.note]));

function editorialIndex(queue, seenState) {
  const known = new Map();
  for (const item of validateQueue(queue).items) {
    for (const src of item.sources) {
      const key = canonicalUrl(src.url);
      if (key) known.set(key, [...(known.get(key) ?? []), { id: item.id, stage: item.stage }]);
    }
  }
  if (seenState != null) {
    assert(object(seenState) && object(seenState.seen), "Invalid existing RSS seen state.");
    for (const rows of Object.values(seenState.seen)) {
      assert(Array.isArray(rows) && rows.every(row => typeof row === "string"), "Invalid existing RSS history.");
      for (const url of rows) {
        const key = canonicalUrl(url);
        if (key && !known.has(key)) known.set(key, [{ id: null, stage: "seen-by-existing-rss" }]);
      }
    }
  }
  return known;
}

function assess(source, item, existing) {
  const input = `${item.title} ${item.note} ${item.url}`;
  const scope = locality.test(input) ? "UAE marker; applicability unconfirmed"
    : "Establish UAE-resident, property or itinerary relevance";
  if (excluded.test(input)) return { disposition: "excluded", scope };
  if (existing.length) return { disposition: "reconcile-existing", scope, next: "Compare with the existing record; never reopen a hold automatically." };
  if (needsScope.test(input)) return { disposition: "scope-review", scope, next: "Check for an excluded incident or disruption before commissioning." };
  const rewardsAction = (source.beat === "hotels" || source.beat === "points") && action.test(input);
  if (source.method === "rss" && (source.scopeCheck || source.beat === "hotels") && !locality.test(input) && !rewardsAction) {
    return { disposition: "scope-review", scope, next: "Check for a UAE connection or meaningful rewards change; do not commission from a generic headline." };
  }
  const priority = soon.test(input) ? "check-now" : "routine-review";
  return { disposition: "needs-source-review", priority, scope,
    next: source.role === "discovery"
      ? "Read the full discovery source and seek the issuer or authority's announcement and terms. Confirm UAE applicability."
      : "Open the full official source and linked terms; establish the reader action and caveats.",
    question: source.question,
    formatHint: source.signal === "rules" ? "quick-hit first; analysis only if supported"
      : source.signal === "offer" ? "quick-hit; matched comparison only with evidence" : "quick-hit or standard",
  };
}

/** No network or writes. First captures are baselines, not a breaking-news list. */
export function buildWireReport({ observations = [], baseline = { schemaVersion: 1, sources: [] },
  queue = { schemaVersion: 1, items: [] }, seenState = null, asOf = null, recovery = new Map() } = {}) {
  assert(object(baseline) && baseline.schemaVersion === 1, "Invalid baseline version.");
  assert(asOf === null || timestamp(asOf), "Invalid report clock.");
  const before = validateObservations(baseline.sources, { baseline: true, asOf });
  assert(before.every(row => row.status === "usable"), "Baseline may contain only usable observations.");
  const current = validateObservations(observations, { asOf });
  const known = editorialIndex(queue, seenState);
  const lastGood = new Map(before.map(row => [row.sourceId, row]));
  const receipts = [];
  const leads = new Map();
  const exclusions = { count: 0 };
  for (const observed of current) {
    const source = ids.get(observed.sourceId);
    const old = lastGood.get(source.id);
    const baseReceipt = { sourceId: source.id, observedAt: observed.observedAt,
      previousUsableAt: old?.observedAt ?? null, inspected: observed.window?.inspected ?? observed.items.length,
      ...(observed.window ? { returned: observed.window.returned, accepted: observed.items.length,
        limit: observed.window.limit, truncated: observed.window.returned > observed.window.inspected } : {}),
      detail: observed.detail };
    if (old) assert(Date.parse(old.observedAt) < Date.parse(observed.observedAt), "Observation is not newer than its last usable baseline.");
    if (observed.status === "gap") { receipts.push({ ...baseReceipt, status: "coverage-gap" }); continue; }
    const oldByUrl = new Map(old?.items.map(item => [item.url, signature(item)]) ?? []);
    // A reviewed, source-specific checkpoint can restart tracking once, but
    // cannot recover missing entries or report the replacement window as news.
    const overlap = observed.items.findIndex(item => oldByUrl.has(item.url));
    const disjoint = old && overlap === -1;
    const rebaseline = disjoint && source.method === "rss" && recovery.get(source.id) === old.observedAt;
    if (disjoint && !rebaseline) {
      receipts.push({ ...baseReceipt, status: "coverage-gap", detail: "Source windows have no overlap; inspect before re-baselining." });
      continue;
    }
    const history = new Map((old?.history ?? []).map(entry => [entry.url, entry.signature]));
    for (const [url, digest] of oldByUrl) history.set(url, digest);
    const past = new Map(history);
    for (const item of observed.items) { history.delete(item.url); history.set(item.url, signature(item)); }
    // Record the widened limit only after seeing beyond the old cap. A
    // temporarily short response must not consume the migration boundary.
    const oldLimit = old?.completedWindowLimit ?? old?.window?.limit ?? DEFAULT_ROWS;
    const widened = Boolean(old && observed.window?.limit > oldLimit && observed.window.inspected > oldLimit);
    const completedWindowLimit = observed.window && old && observed.window.limit > oldLimit
      ? (widened ? observed.window.limit : oldLimit) : undefined;
    lastGood.set(source.id, { ...observed, history: [...history].slice(-historyLimit(source.id)).map(([url, signature]) => ({ url, signature })),
      ...(completedWindowLimit != null ? { completedWindowLimit } : {}) });
    if (rebaseline) {
      receipts.push({ ...baseReceipt, status: "rebaselined-after-gap",
        detail: "Tracking restarted with no backlog leads; missed interval remains unverified." });
      continue;
    }
    if (!old) { receipts.push({ ...baseReceipt, status: "baseline-only" }); continue; }
    // A wider view is not proof that old, previously invisible entries are
    // new. On the first wider scan, count unrecognised rows past the first
    // overlapping item only as baseline; rows ahead of that anchor remain
    // unverified discovery signals. Known item changes still pass through.
    let tailBaselined = 0;
    let changes = 0;
    for (const [index, item] of observed.items.entries()) {
      const previous = past.get(item.url);
      if (previous === signature(item)) continue;
      if (widened && index >= overlap && !past.has(item.url)) { tailBaselined++; continue; }
      changes++;
      const existing = known.get(item.url) ?? [];
      const evaluation = assess(source, item, existing);
      if (evaluation.disposition === "excluded") { exclusions.count++; continue; }
      const sighting = { sourceId: source.id, beat: source.beat, sourceRole: source.role, sourceMethod: source.method, observedAt: observed.observedAt,
        kind: previous ? "material-signal-changed" : "new-to-observed-window", reportedAt: item.reportedAt, evaluation };
      // Do not merge two independent story ideas solely on one headline.
      const key = item.url;
      const lead = leads.get(key) ?? { url: item.url, title: item.title, verified: false, existing, sightings: [] };
      lead.sightings.push(sighting);
      leads.set(key, lead);
    }
    receipts.push({ ...baseReceipt, status: changes ? "signals-changed" : "no-change-in-observed-window", changes,
      ...(widened ? { widened: true, tailBaselined } : {}) });
  }
  return { mode: "private-read-only-preview", publicationReady: false,
    scope: "Local observations only; feed timestamps are discovery metadata, not verified publication times.",
    dedupeBasis: { editorialQueue: true, existingRssHistorySupplied: seenState !== null,
      latestSignaturesPerSource: 150, widerHistoryBySource: Object.fromEntries(
        [...LONG_FEED_ROWS.keys()].filter(id => historyLimit(id) > 150).map(id => [id, historyLimit(id)])) },
    sources: SOURCES, batches: BATCHES, unobservedSourceIds: SOURCES.filter(source => !current.some(row => row.sourceId === source.id)).map(source => source.id),
    receipts, exclusions, leads: [...leads.values()],
    nextBaseline: { schemaVersion: 1, sources: [...lastGood.values()] } };
}

export async function probeRegisteredFeed(sourceId, { validate = validateArchiveUrl, request = requestArchiveBody } = {}) {
  const source = ids.get(sourceId);
  assert(source?.method === "rss", "Only a registered RSS source can be probed.");
  const observedAt = () => new Date().toISOString();
  const signal = AbortSignal.timeout(12_000);
  const gap = detail => ({ sourceId: source.id, surfaceUrl: source.url, observedAt: observedAt(), status: "gap", items: [], detail });
  let current = source.url;
  let phase = "DNS or public address validation";
  try {
    for (let hop = 0; hop <= 2; hop++) {
      phase = "DNS or public address validation";
      const { url, addresses } = await validate(current, { signal });
      phase = "HTTPS transport or body read";
      const { body, status, headers } = await request(url, { addresses, signal, maxBytes: MAX_FEED });
      phase = "redirect validation";
      if ([301, 302, 303, 307, 308].includes(status)) {
        const next = headers.location && canonicalUrl(new URL(headers.location, current).href);
        if (!next || host(next) !== host(source.url)) return gap("Unexpected feed redirect.");
        current = next;
        continue;
      }
      if (status !== 200 || headers["content-range"]) return gap(`Incomplete feed response (HTTP ${status}).`);
      phase = "UTF-8 decoding";
      const xml = new TextDecoder("utf-8", { fatal: true }).decode(body);
      phase = "XML or metadata handling";
      const limit = rowLimit(source.id);
      const scanned = scanMetadata(xml, { maxBytes: MAX_FEED, maxItems: limit });
      if (scanned.status !== "items") return gap("No supported complete, non-empty feed.");
      const items = [];
      const urls = new Set();
      for (const raw of scanned.items) {
        if (source.latinOnly && !hasLatin(raw.title)) continue;
        const candidate = publisherArticleUrl(source, raw.link);
        if (!candidate || !plainText(raw.title)) return gap("Incomplete or unexpected article metadata.");
        if (urls.has(candidate)) continue;
        urls.add(candidate);
        items.push({ url: candidate, title: raw.title, reportedAt: raw.date });
      }
      if (!items.length) return gap("No usable language edition in the bounded source window.");
      return { sourceId: source.id, surfaceUrl: source.url, observedAt: observedAt(), status: "usable", items,
        window: { limit, returned: scanned.count, inspected: scanned.items.length },
        detail: `${scanned.count} entries in the feed; inspected first ${scanned.items.length}. Metadata only.` };
    }
    return gap("Feed redirect limit exceeded.");
  } catch (error) {
    // Only fixed phase labels and selected error codes; never log request
    // details, remote content, addresses, or arbitrary exception messages.
    const code = ["ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ECONNREFUSED", "ERR_SSL_WRONG_VERSION_NUMBER",
      "CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "ETIMEDOUT"].includes(error?.code) ? ` (${error.code})` : "";
    return gap(signal.aborted ? `Feed timed out during ${phase}.` : `Feed failed during ${phase}${code}.`);
  }
}

export async function probeFeedBatch(sourceIds, probe = probeRegisteredFeed) {
  assert(Array.isArray(sourceIds) && sourceIds.length <= MAX_BATCH &&
    new Set(sourceIds).size === sourceIds.length &&
    sourceIds.every(id => ids.get(id)?.method === "rss"), "Expected at most nine distinct, registered RSS source IDs.");
  const rows = [];
  for (let i = 0; i < sourceIds.length; i += MAX_CONCURRENT) {
    rows.push(...await Promise.all(sourceIds.slice(i, i + MAX_CONCURRENT).map(id => probe(id))));
  }
  return rows;
}

export async function main(args = process.argv.slice(2)) {
  const opts = new Map(), feeds = new Set();
  const supported = ["--observations", "--baseline", "--queue", "--seen-state", "--probe", "--batch"];
  for (let i = 0; i < args.length; i += 2) {
    const [flag, value] = args.slice(i, i + 2);
    assert(supported.includes(flag) && value && !value.startsWith("--"), "Expected a supported option and its value.");
    if (flag === "--probe") {
      assert(ids.get(value)?.method === "rss" && !feeds.has(value), "Probe requires one distinct, registered RSS source ID.");
      feeds.add(value);
    } else {
      assert(!opts.has(flag), "Duplicate option.");
      opts.set(flag, value);
    }
  }
  if (opts.has("--batch")) {
    const batch = batchIds.get(opts.get("--batch"));
    assert(batch && !feeds.size, "Choose one registered batch without individual probes.");
    for (const id of batch) feeds.add(id);
  }
  const input = flag => opts.has(flag) ? parseLocal(opts.get(flag)) : undefined;
  const observations = input("--observations") ?? [];
  const baseline = input("--baseline");
  const queue = input("--queue") ?? parseLocal(".council/newsroom/queue.json");
  const seenState = input("--seen-state");
  // Fail invalid/stale inputs before sending any request.
  buildWireReport({ observations, baseline, queue, seenState, asOf: new Date().toISOString() });
  assert(!observations.some(row => feeds.has(row.sourceId)), "A source cannot be both supplied and probed.");
  const results = await probeFeedBatch([...feeds]);
  const report = buildWireReport({ observations: [...observations, ...results], baseline, queue, seenState, asOf: new Date().toISOString() });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.receipts.some(row => row.status === "coverage-gap")) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await main(); } catch (error) { console.error(`News wire preview refused: ${error.message}`); process.exitCode = 1; }
}
