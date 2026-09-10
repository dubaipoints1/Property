// External link sweep — checks every outbound <a href> in the built site
// against the live web and classifies what came back. Exists because the
// 2026-09-06 site UI/UX audit found that while check-links.mjs had made
// internal nav integrity mechanical, the ~150 distinct outbound URLs the
// publication leans on for provenance — bank Schedules of Fees, KFS and
// T&C PDFs, campaign pages, issuer press releases, regulator pages — had
// no check at all. Every AED figure on the site is traceable to one of
// those URLs; a dead sourceUrl quietly voids the trust claim the figure
// rests on, and a bank moving a PDF is exactly the kind of change nobody
// notices on a quiet week.
//
// Why this is NOT wired into build / postbuild / pr-checks:
//   - it needs egress, and the Claude Code web sandbox enforces a host
//     allowlist (CLAUDE.md § Network allowlist) that rejects nearly every
//     issuer host — so in-session it can only prove the allowlist exists;
//   - it is slow (network, per-host politeness delays) and third-party
//     flaky (bot walls, CDN challenges, 5xx blips), none of which should
//     ever redden a PR about a typo.
// It runs weekly in GitHub Actions (.github/workflows/link-audit.yml),
// whose runners have unrestricted egress, and writes to audit-output/
// (gitignored) — never to src/, public/ or the repo.
//
// Classification is deliberately conservative about the word "broken".
// A response only counts as broken when the target itself said so
// (4xx / 5xx) or never answered (timeout / DNS / connection error). A
// 403/429/503 wearing a bot-wall fingerprint (Cloudflare challenge,
// Akamai "Access Denied", DataDome, Incapsula, Distil) or the sandbox
// proxy's "Host not in allowlist" is `unverifiable`, not broken: it
// tells us nothing about whether the page exists, only that a machine
// was refused. A plain 429 is treated the same way (rate-limited says
// nothing about the target). A 2xx that landed on a different site is
// `redirect-cross-host` — the link works, but an editor should look at
// where it now goes.
//
// One environment rule sits on top. Node's fetch ignores HTTPS_PROXY and
// resolves hosts locally, and behind the sandbox's egress proxy the local
// resolver is not authoritative: on 2026-09-06 aecb.gov.ae and
// media.flydubai.com came back ENOTFOUND while www.adcb.com resolved and
// was intercepted with the same 403 — curl through the CONNECT proxy got
// 403 for all of them (and with NODE_USE_ENV_PROXY=1 the refusal is a
// bare "Request was cancelled"). So when an egress proxy is configured
// (HTTPS_PROXY / https_proxy, or CCR_AGENT_PROXY_ENABLED) any
// connection-level failure short of a timeout — DNS miss, refused
// CONNECT, re-terminated TLS — is also `unverifiable / egress-blocked`,
// and the report says so in meta.egressProxy. In GitHub Actions no proxy
// is set and ENOTFOUND stays `network` — a dead domain is the link-rot
// failure that most needs flagging, so the rule is deliberately scoped
// to proxied environments.
//
// Absolute links back to dubaipoints.ae itself are a separate list: they
// are verified against dist/ via hrefResolves (same rule as the internal
// sweep) and reported as `internalAbsolute`, since they are really
// internal links written the long way round.
//
// Same shape as check-links.mjs: exported pure functions unit-tested in
// tests/ci/external-links.test.ts, plus a thin CLI. Every JSON output is
// deterministic — sorted arrays, sorted keys, no per-item timestamps —
// so two runs against the same dist diff cleanly.
//
// Usage:
//   node scripts/ci/check-external-links.mjs [--dist dist]
//     [--out audit-output/links] [--concurrency 8] [--per-host 2]
//     [--host-delay 250] [--timeout 15000] [--retries 1]
//     [--exclude-host a,b] [--only-host h] [--limit n] [--ua "..."]
//     [--strict]
// Writes <out>/external-links.json + <out>/external-links.md.
// Exit 0 always, except 1 with --strict and broken > 0.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import { collectHtmlFiles, hrefResolves, parseRedirectSources } from "./check-links.mjs";

export const USER_AGENT = "DubaiPointsLinkAudit/1.0 (+https://dubaipoints.ae/about/)";

export const SELF_HOSTS = ["dubaipoints.ae", "www.dubaipoints.ae"];

/** Severity order used to sort the report: worst first, ok last. */
export const STATE_ORDER = [
  "client-error",
  "server-error",
  "timeout",
  "network",
  "redirect-cross-host",
  "unverifiable",
  "ok",
];

// ---------------------------------------------------------------------------
// HTML / URL helpers
// ---------------------------------------------------------------------------

const NAMED_ENTITIES = {
  amp: "&",
  quot: '"',
  lt: "<",
  gt: ">",
  apos: "'",
};

/** Decode the entities Astro emits inside href attributes (&amp; &#39; &quot; &lt; &gt; &#x2F; …). */
export function decodeEntities(s) {
  if (typeof s !== "string" || !s.includes("&")) return s;
  // Single pass so "&amp;quot;" decodes to "&quot;" rather than to a bare quote.
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    const b = body.toLowerCase();
    if (b.startsWith("#x")) return String.fromCodePoint(parseInt(b.slice(2), 16));
    if (b.startsWith("#")) return String.fromCodePoint(parseInt(b.slice(1), 10));
    return Object.hasOwn(NAMED_ENTITIES, b) ? NAMED_ENTITIES[b] : whole;
  });
}

/**
 * Normalise a raw href into a comparable absolute http(s) URL string:
 * trim, entity-decode, protocol-relative → https, fragment stripped,
 * query kept, host lower-cased by the URL parser. Returns null for
 * anything that is not http(s) (mailto:, tel:, root-relative, junk).
 */
export function normaliseUrl(raw) {
  if (typeof raw !== "string") return null;
  let s = decodeEntities(raw.trim());
  if (!s) return null;
  if (s.startsWith("//")) s = `https:${s}`;
  let url;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  url.hash = "";
  return url.href;
}

/** Lower-cased hostname of a URL, or null if it does not parse. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function siteKey(input) {
  if (typeof input !== "string") return null;
  const host = hostOf(input) ?? input.trim().toLowerCase();
  if (!host) return null;
  return host.replace(/^www\./, "");
}

/** Same site, ignoring a leading www. and case. Accepts URLs or bare hosts. */
export function sameSite(a, b) {
  const ka = siteKey(a);
  const kb = siteKey(b);
  return ka !== null && kb !== null && ka === kb;
}

// `\shref` (not bare `href`) so a `data-href="…"` attribute cannot be
// mistaken for the real one; the lookahead keeps `<abbr>`/`<address>` out.
const ANCHOR_HREF_RE = /<a(?=\s)[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/**
 * Every absolute http(s) <a href> in an HTML string, in document order.
 * <link>, <script>, <img> etc. are ignored on purpose — this sweep is
 * about links a reader can click. Root-relative hrefs are the internal
 * sweep's job. Absolute links to our own host are flagged
 * `internal-absolute` so they can be verified against dist instead.
 *
 * @returns {Array<{url: string, file: string, kind: "external"|"internal-absolute"}>}
 */
export function extractExternalLinks(html, file, { selfHosts = SELF_HOSTS } = {}) {
  const self = new Set(selfHosts.map((h) => h.toLowerCase()));
  const out = [];
  for (const m of html.matchAll(ANCHOR_HREF_RE)) {
    const raw = m[1] ?? m[2] ?? "";
    const url = normaliseUrl(raw);
    if (!url) continue;
    const host = hostOf(url);
    if (!host) continue;
    out.push({ url, file, kind: self.has(host) ? "internal-absolute" : "external" });
  }
  return out;
}

/**
 * Dedupe extracted links by URL. `sources` keeps the first `maxSources`
 * distinct files that link to it (in encounter order — the CLI feeds
 * files sorted, so this is deterministic); `sourceCount` is the number
 * of distinct files, so the report can say "and 9 more".
 *
 * @returns {Map<string, {url: string, host: string, sources: string[], sourceCount: number}>}
 */
export function aggregateLinks(entries, maxSources = 3) {
  const map = new Map();
  const seenFiles = new Map(); // url → Set(file)
  for (const { url, file } of entries) {
    let agg = map.get(url);
    if (!agg) {
      agg = { url, host: hostOf(url), sources: [], sourceCount: 0 };
      map.set(url, agg);
      seenFiles.set(url, new Set());
    }
    const files = seenFiles.get(url);
    if (files.has(file)) continue;
    files.add(file);
    agg.sourceCount += 1;
    if (agg.sources.length < maxSources) agg.sources.push(file);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Response classification
// ---------------------------------------------------------------------------

function headersToObject(headers) {
  const out = {};
  if (!headers) return out;
  const iter = typeof headers.entries === "function" ? headers.entries() : Object.entries(headers);
  for (const [k, v] of iter) out[String(k).toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
  return out;
}

const EGRESS_RE = /host not in allowlist|host_not_allowed|proxy response \(403\)|connect tunnel failed/i;

/**
 * Is this process behind an egress proxy that resolves hosts on the
 * client's behalf? If so a connection-level failure says nothing about
 * the target (see header). Pure — pass an env object in tests.
 * @returns {boolean}
 */
export function detectEgressProxy(env = process.env) {
  return Boolean(env.HTTPS_PROXY || env.https_proxy || env.CCR_AGENT_PROXY_ENABLED === "1");
}

/**
 * Bot-wall fingerprints. Any of these on a 403/429/503 means a machine
 * was refused, which says nothing about whether the page exists.
 * @returns {string|null} detail label
 */
function botWallDetail(status, headers, body) {
  const server = headers.server ?? "";
  if (headers["cf-mitigated"] === "challenge") return "cloudflare-challenge";
  if (/just a moment/i.test(body)) return "cloudflare-challenge";
  if (/attention required/i.test(body)) return "cloudflare-block";
  if (status === 403 && /cloudflare/i.test(server)) return "cloudflare-403";
  if (/akamaighost/i.test(server)) return "akamai";
  if (/access denied/i.test(body) && /reference #/i.test(body)) return "akamai";
  if (Object.keys(headers).some((k) => k.startsWith("x-datadome"))) return "datadome";
  if (headers["x-iinfo"] !== undefined || /incapsula/i.test(headers["x-cdn"] ?? "") || /incapsula/i.test(body)) {
    return "incapsula";
  }
  if (/pardon our interruption/i.test(body)) return "distil";
  return null;
}

/**
 * Turn a fetch outcome into a state. Pure — feed it recorded responses.
 *
 * @param {{status?: number|null, originalUrl?: string, finalUrl?: string|null,
 *   headers?: Headers|Record<string,string>, bodySnippet?: string,
 *   error?: string|null, timedOut?: boolean}} r
 * @param {{proxied?: boolean}} [opts] — `proxied` (from detectEgressProxy)
 *   makes a non-timeout connection failure `unverifiable / egress-blocked`
 *   instead of `network`.
 * @returns {{state: string, detail: string}}
 */
export function classifyResponse(r, { proxied = false } = {}) {
  const headers = headersToObject(r.headers);
  const body = r.bodySnippet ?? "";
  const status = typeof r.status === "number" ? r.status : null;
  const error = r.error ? String(r.error) : "";

  // The sandbox proxy answers for blocked hosts with a 403 and a plain-text
  // body; a CONNECT-mode proxy surfaces as a network error instead. Both
  // are our egress, not the target.
  if (EGRESS_RE.test(body) || headers["x-deny-reason"] === "host_not_allowed" || EGRESS_RE.test(error)) {
    return { state: "unverifiable", detail: "egress-blocked" };
  }
  if (r.timedOut) return { state: "timeout", detail: "no response within timeout" };
  // Behind an egress proxy neither the local resolver nor a refused
  // connection is authoritative about the target.
  if (proxied && status === null) return { state: "unverifiable", detail: "egress-blocked" };
  if (status === null) return { state: "network", detail: r.error ? String(r.error) : "no response" };

  if (status === 403 || status === 429 || status === 503) {
    const wall = botWallDetail(status, headers, body);
    if (wall) return { state: "unverifiable", detail: wall };
    if (status === 429) return { state: "unverifiable", detail: "rate-limited" };
  }

  let landed = r.finalUrl || null;
  if (!landed && headers.location && r.originalUrl) {
    try {
      landed = new URL(headers.location, r.originalUrl).href;
    } catch {
      landed = null;
    }
  }
  const crossHost = Boolean(landed && r.originalUrl && !sameSite(r.originalUrl, landed));

  if (status >= 200 && status < 400) {
    if (crossHost) return { state: "redirect-cross-host", detail: `lands on ${landed}` };
    return { state: "ok", detail: String(status) };
  }
  if (status >= 400 && status < 500) return { state: "client-error", detail: String(status) };
  if (status >= 500) return { state: "server-error", detail: String(status) };
  return { state: "network", detail: `unexpected status ${status}` };
}

/** Only states where the target itself failed count as broken. */
export function isBroken(state) {
  return state === "client-error" || state === "server-error" || state === "timeout" || state === "network";
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

/**
 * Per-host politeness: at most `perHost` in flight per host and at least
 * `delayMs` between request starts to the same host. Hosts are
 * independent of each other; the pool's global concurrency sits above.
 */
export class HostScheduler {
  constructor({ perHost = 2, delayMs = 250 } = {}) {
    this.perHost = Math.max(1, perHost);
    this.delayMs = Math.max(0, delayMs);
    this.hosts = new Map();
  }

  _state(host) {
    let s = this.hosts.get(host);
    if (!s) {
      s = { active: 0, lastStart: -Infinity, queue: [], timer: null };
      this.hosts.set(host, s);
    }
    return s;
  }

  acquire(host) {
    return new Promise((resolve) => {
      this._state(host).queue.push(resolve);
      this._pump(host);
    });
  }

  release(host) {
    const s = this._state(host);
    s.active = Math.max(0, s.active - 1);
    this._pump(host);
  }

  _pump(host) {
    const s = this._state(host);
    while (s.queue.length && s.active < this.perHost) {
      const wait = s.lastStart + this.delayMs - Date.now();
      if (wait > 0) {
        if (!s.timer) {
          s.timer = setTimeout(() => {
            s.timer = null;
            this._pump(host);
          }, wait);
        }
        return;
      }
      s.active += 1;
      s.lastStart = Date.now();
      s.queue.shift()();
    }
  }
}

const BODY_CAP = 8 * 1024;
const HEAD_FALLBACK_STATUSES = new Set([403, 404, 405, 501]);

function describeError(err) {
  const cause = err && typeof err === "object" ? err.cause : undefined;
  const code = (cause && cause.code) || (err && err.code) || null;
  const msg = (cause && cause.message) || (err && err.message) || String(err);
  const name = err && err.name ? err.name : "Error";
  return code && !msg.includes(code) ? `${code} ${msg}` : `${name === "Error" ? "" : `${name}: `}${msg}`;
}

async function readSnippet(body, cap = BODY_CAP) {
  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (total < cap) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength)));
  return new TextDecoder("utf-8", { fatal: false }).decode(buf.subarray(0, cap));
}

/**
 * HEAD first (cheap, polite); fall back to a GET that reads at most 8 KB
 * of body and then cancels when HEAD is refused (405/501), when the
 * server 403/404s a HEAD it would 200 a GET for (common on CDNs and
 * document servers), or on a network error. The snippet is what the
 * bot-wall and egress fingerprints are matched against.
 *
 * @returns {Promise<{status: number|null, finalUrl: string|null, headers: Record<string,string>,
 *   bodySnippet: string, method: "HEAD"|"GET", error: string|null, timedOut: boolean}>}
 */
export async function fetchWithPolicy(url, { timeoutMs = 15000, ua = USER_AGENT, fetchImpl = fetch } = {}) {
  const attempt = async (method) => {
    const ac = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ac.abort();
    }, timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method,
        redirect: "follow",
        signal: ac.signal,
        headers: {
          "user-agent": ua,
          accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
          "accept-language": "en-AE,en;q=0.9",
        },
      });
      let bodySnippet = "";
      if (method === "GET" && res.body) bodySnippet = await readSnippet(res.body);
      else if (res.body) await res.body.cancel().catch(() => {});
      return {
        status: res.status,
        finalUrl: res.url || url,
        headers: headersToObject(res.headers),
        bodySnippet,
        method,
        error: null,
        timedOut: false,
      };
    } catch (err) {
      return {
        status: null,
        finalUrl: null,
        headers: {},
        bodySnippet: "",
        method,
        error: describeError(err),
        timedOut,
      };
    } finally {
      clearTimeout(timer);
    }
  };

  const head = await attempt("HEAD");
  if (head.timedOut) return head;
  if (head.error || HEAD_FALLBACK_STATUSES.has(head.status)) return attempt("GET");
  return head;
}

const RETRYABLE = new Set(["timeout", "network", "server-error"]);

/** Round-robin across hosts so a pool never idles behind one host's politeness queue. */
export function interleaveByHost(links) {
  const byHost = new Map();
  for (const l of [...links].sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0))) {
    const host = l.host ?? hostOf(l.url) ?? "";
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(l);
  }
  const queues = [...byHost.keys()].sort().map((h) => byHost.get(h));
  const out = [];
  let remaining = links.length;
  while (remaining > 0) {
    for (const q of queues) {
      if (q.length) {
        out.push(q.shift());
        remaining -= 1;
      }
    }
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Check a list of aggregated links with a worker pool bounded by
 * `concurrency` overall and a HostScheduler per host. Timeouts, network
 * errors and 5xx get `retries` more goes after `retryDelayMs`.
 * `egressProxy` (default false — the CLI passes detectEgressProxy())
 * is forwarded to classifyResponse as `proxied`.
 *
 * @param {Array<{url: string, host?: string, sources?: string[], sourceCount?: number}>} links
 * @returns {Promise<Array<{url, host, state, detail, status, finalUrl, method, attempts, sources, sourceCount}>>}
 */
export async function checkExternalLinks(links, opts = {}) {
  const {
    concurrency = 8,
    perHost = 2,
    hostDelayMs = 250,
    timeoutMs = 15000,
    retries = 1,
    retryDelayMs = 2000,
    ua = USER_AGENT,
    fetchImpl = fetch,
    egressProxy = false,
    onProgress = defaultProgress,
  } = opts;

  const scheduler = new HostScheduler({ perHost, delayMs: hostDelayMs });
  const queue = interleaveByHost(links);
  const results = new Array(queue.length);
  let next = 0;
  let done = 0;

  const worker = async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= queue.length) return;
      const link = queue[i];
      const host = link.host ?? hostOf(link.url) ?? "";
      let attempts = 0;
      let outcome;
      for (;;) {
        attempts += 1;
        await scheduler.acquire(host);
        let raw;
        try {
          raw = await fetchWithPolicy(link.url, { timeoutMs, ua, fetchImpl });
        } finally {
          scheduler.release(host);
        }
        const cls = classifyResponse({ ...raw, originalUrl: link.url }, { proxied: egressProxy });
        outcome = { raw, cls };
        if (!RETRYABLE.has(cls.state) || attempts > retries) break;
        await sleep(retryDelayMs);
      }
      const { raw, cls } = outcome;
      results[i] = {
        url: link.url,
        host,
        state: cls.state,
        detail: cls.detail,
        status: raw.status,
        finalUrl: raw.finalUrl && raw.finalUrl !== link.url ? raw.finalUrl : null,
        method: raw.method,
        attempts,
        sources: link.sources ?? [],
        sourceCount: link.sourceCount ?? (link.sources ? link.sources.length : 0),
      };
      done += 1;
      if (onProgress) onProgress({ done, total: queue.length, result: results[i] });
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, queue.length || 1)) }, worker));
  return results;
}

function defaultProgress({ done, total, result }) {
  process.stderr.write(
    `[external-links] ${String(done).padStart(String(total).length)}/${total} ${result.state.padEnd(19)} ${result.url}${
      result.state === "ok" ? "" : `  (${result.detail})`
    }\n`,
  );
}

// ---------------------------------------------------------------------------
// Internal-absolute links (https://dubaipoints.ae/... written in prose)
// ---------------------------------------------------------------------------

/**
 * Verify absolute self-links against dist/ the way the internal sweep
 * does. Reported separately: they are not external, but they are also
 * not what the internal sweep looks at (it only reads root-relative hrefs).
 */
export function checkInternalAbsolute(links, distDir, redirectSources = new Set()) {
  const broken = [];
  const sorted = [...links].sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  for (const l of sorted) {
    let pathname;
    try {
      pathname = new URL(l.url).pathname;
    } catch {
      continue;
    }
    const resolves =
      redirectSources.has(pathname) ||
      redirectSources.has(pathname.replace(/\/$/, "")) ||
      hrefResolves(distDir, pathname);
    if (!resolves) broken.push({ url: l.url, path: pathname, sources: l.sources ?? [], sourceCount: l.sourceCount ?? 0 });
  }
  return { checked: sorted.length, broken };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeysDeep(value[k]);
    return out;
  }
  return value;
}

/** JSON with recursively sorted keys and 2-space indent — byte-identical for equal data. */
export function stableStringify(obj) {
  return JSON.stringify(sortKeysDeep(obj), null, 2);
}

function compareLinks(a, b) {
  const ra = STATE_ORDER.indexOf(a.state);
  const rb = STATE_ORDER.indexOf(b.state);
  if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
  return a.url < b.url ? -1 : a.url > b.url ? 1 : 0;
}

/**
 * @param {Array} results from checkExternalLinks
 * @param {{generatedAt?: string, commit?: string|null, distDir?: string, ua?: string, durationMs?: number,
 *   egressProxy?: boolean, options?: object, internalAbsolute?: {checked: number, broken: Array}}} meta
 */
export function buildReport(results, meta = {}) {
  const links = [...results].sort(compareLinks).map((r) => ({
    url: r.url,
    host: r.host ?? hostOf(r.url),
    state: r.state,
    detail: r.detail,
    status: r.status ?? null,
    finalUrl: r.finalUrl ?? null,
    method: r.method ?? null,
    attempts: r.attempts ?? 1,
    sources: [...(r.sources ?? [])],
    sourceCount: r.sourceCount ?? (r.sources ? r.sources.length : 0),
  }));
  const byState = {};
  for (const l of links) byState[l.state] = (byState[l.state] ?? 0) + 1;
  const internalAbsolute = meta.internalAbsolute ?? { checked: 0, broken: [] };
  return {
    schemaVersion: 1,
    meta: {
      generatedAt: meta.generatedAt ?? new Date().toISOString(),
      commit: meta.commit ?? null,
      distDir: meta.distDir ?? null,
      ua: meta.ua ?? USER_AGENT,
      durationMs: Math.round(meta.durationMs ?? 0),
      egressProxy: Boolean(meta.egressProxy),
      options: meta.options ?? {},
      counts: {
        total: links.length,
        broken: links.filter((l) => isBroken(l.state)).length,
        byState,
        internalAbsoluteChecked: internalAbsolute.checked,
        internalAbsoluteBroken: internalAbsolute.broken.length,
      },
    },
    links,
    internalAbsolute: {
      checked: internalAbsolute.checked,
      broken: [...internalAbsolute.broken].sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0)),
    },
  };
}

const mdCell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

function sourcesCell(l) {
  const shown = (l.sources ?? []).map((s) => `\`${s}\``).join(", ");
  const more = (l.sourceCount ?? 0) - (l.sources ?? []).length;
  return more > 0 ? `${shown} +${more} more` : shown || "—";
}

/** Markdown companion to the JSON: broken → unverifiable by host → cross-host → internal-absolute → ok. */
export function renderExternalLinksMd(report) {
  const { meta, links, internalAbsolute } = report;
  const broken = links.filter((l) => isBroken(l.state));
  const unverifiable = links.filter((l) => l.state === "unverifiable");
  const redirected = links.filter((l) => l.state === "redirect-cross-host");
  const ok = links.filter((l) => l.state === "ok");
  const out = [];

  out.push("# External link audit", "");
  out.push(
    `Generated ${meta.generatedAt}${meta.commit ? ` · commit \`${meta.commit}\`` : ""} · ${meta.counts.total} distinct URL(s) · ${(
      meta.durationMs / 1000
    ).toFixed(1)}s`,
  );
  out.push("");
  const byState = Object.entries(meta.counts.byState ?? {}).sort(([a], [b]) => compareLinks({ state: a, url: "" }, { state: b, url: "" }));
  out.push(`Counts: ${byState.map(([s, n]) => `${s} ${n}`).join(" · ") || "none"}`);
  out.push("");
  if (meta.egressProxy) {
    out.push(
      "**Egress-proxied run.** This process sat behind a proxy that resolves hosts on its behalf (the Claude Code sandbox allowlist), so `egress-blocked` entries — proxy 403s and DNS misses alike — describe the environment, not the targets. Run `.github/workflows/link-audit.yml` for a real answer.",
      "",
    );
  }

  out.push(`## Broken (${broken.length})`, "");
  if (broken.length) {
    out.push("A 4xx/5xx from the target, or no answer at all. Each needs an editor: find the moved page, or archive the claim.", "");
    out.push("| URL | State | Detail | Method | Sources |", "|---|---|---|---|---|");
    for (const l of broken) {
      out.push(`| ${mdCell(l.url)} | ${l.state} | ${mdCell(l.detail)} | ${l.method ?? "—"} | ${sourcesCell(l)} |`);
    }
  } else {
    out.push("_None._");
  }
  out.push("");

  out.push(`## Unverifiable (${unverifiable.length})`, "");
  if (unverifiable.length) {
    out.push(
      "Bot walls, rate limits and egress blocks. Not evidence the page is gone — a human with a browser can settle each host in a minute.",
      "",
    );
    const byHost = new Map();
    for (const l of unverifiable) {
      if (!byHost.has(l.host)) byHost.set(l.host, []);
      byHost.get(l.host).push(l);
    }
    for (const host of [...byHost.keys()].sort()) {
      const list = byHost.get(host);
      const details = [...new Set(list.map((l) => l.detail))].sort().join(", ");
      out.push(`### ${host} (${list.length}) — ${details}`, "");
      for (const l of list) out.push(`- ${l.url}${l.status ? ` — ${l.status}` : ""} · ${sourcesCell(l)}`);
      out.push("");
    }
  } else {
    out.push("_None._", "");
  }

  out.push(`## Cross-host redirects (${redirected.length})`, "");
  if (redirected.length) {
    out.push("The link works but lands on a different site. Worth a look: a moved brand domain is fine, a redirect to a homepage is a soft 404.", "");
    out.push("| URL | Lands on | Sources |", "|---|---|---|");
    for (const l of redirected) out.push(`| ${mdCell(l.url)} | ${mdCell(l.finalUrl ?? l.detail)} | ${sourcesCell(l)} |`);
  } else {
    out.push("_None._");
  }
  out.push("");

  out.push(`## Internal absolute links (${internalAbsolute.checked} checked, ${internalAbsolute.broken.length} broken)`, "");
  out.push("`https://dubaipoints.ae/...` written out in full — verified against dist like the internal sweep. Prefer root-relative hrefs.", "");
  if (internalAbsolute.broken.length) {
    out.push("| URL | Path | Sources |", "|---|---|---|");
    for (const b of internalAbsolute.broken) out.push(`| ${mdCell(b.url)} | ${mdCell(b.path)} | ${sourcesCell(b)} |`);
  } else {
    out.push("_All resolve._");
  }
  out.push("");

  out.push(`## OK (${ok.length})`, "");
  out.push(`${ok.length} link(s) answered 2xx on the same site.`, "");
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function gitCommit() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : null;
  }
}

function splitList(values) {
  return (values ?? [])
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;

if (isMain) {
  const { values } = parseArgs({
    options: {
      dist: { type: "string", default: "dist" },
      out: { type: "string", default: path.join("audit-output", "links") },
      concurrency: { type: "string", default: "8" },
      "per-host": { type: "string", default: "2" },
      "host-delay": { type: "string", default: "250" },
      timeout: { type: "string", default: "15000" },
      retries: { type: "string", default: "1" },
      "exclude-host": { type: "string", multiple: true },
      "only-host": { type: "string" },
      limit: { type: "string" },
      ua: { type: "string", default: USER_AGENT },
      strict: { type: "boolean", default: false },
    },
    strict: true,
  });

  const t0 = Date.now();
  const distDir = path.resolve(values.dist);
  if (!existsSync(distDir)) {
    console.error(`[external-links] dist not found at ${distDir} — run npm run build first`);
    process.exit(1);
  }
  const num = (k, fallback) => {
    const n = Number(values[k]);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const options = {
    concurrency: Math.max(1, num("concurrency", 8)),
    perHost: Math.max(1, num("per-host", 2)),
    hostDelayMs: num("host-delay", 250),
    timeoutMs: Math.max(1, num("timeout", 15000)),
    retries: num("retries", 1),
    excludeHosts: splitList(values["exclude-host"]),
    onlyHost: values["only-host"] ? values["only-host"].toLowerCase() : null,
    limit: values.limit ? Math.max(0, num("limit", 0)) : null,
  };

  const files = collectHtmlFiles(distDir).sort();
  const entries = [];
  for (const file of files) entries.push(...extractExternalLinks(readFileSync(path.join(distDir, file), "utf8"), file));
  const external = [...aggregateLinks(entries.filter((e) => e.kind === "external")).values()];
  const internalAbs = [...aggregateLinks(entries.filter((e) => e.kind === "internal-absolute")).values()];

  let selected = external.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  if (options.onlyHost) selected = selected.filter((l) => sameSite(l.host, options.onlyHost));
  if (options.excludeHosts.length) selected = selected.filter((l) => !options.excludeHosts.some((h) => sameSite(l.host, h)));
  if (options.limit !== null) selected = selected.slice(0, options.limit);

  const redirectsPath = fileURLToPath(new URL("../../public/_redirects", import.meta.url));
  const redirectSources = existsSync(redirectsPath) ? parseRedirectSources(readFileSync(redirectsPath, "utf8")) : new Set();

  const egressProxy = detectEgressProxy();
  console.error(
    `[external-links] ${files.length} html files · ${external.length} distinct external URL(s) (${selected.length} selected) · ${internalAbs.length} internal-absolute`,
  );
  if (egressProxy) {
    console.error("[external-links] egress proxy detected — proxy 403s and DNS misses will be reported as unverifiable/egress-blocked, not broken");
  }

  const results = await checkExternalLinks(selected, {
    concurrency: options.concurrency,
    perHost: options.perHost,
    hostDelayMs: options.hostDelayMs,
    timeoutMs: options.timeoutMs,
    retries: options.retries,
    ua: values.ua,
    egressProxy,
  });
  const internalAbsolute = checkInternalAbsolute(internalAbs, distDir, redirectSources);

  const report = buildReport(results, {
    generatedAt: new Date().toISOString(),
    commit: gitCommit(),
    distDir: path.relative(process.cwd(), distDir) || ".",
    ua: values.ua,
    durationMs: Date.now() - t0,
    egressProxy,
    options,
    internalAbsolute,
  });

  const outDir = path.resolve(values.out);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "external-links.json"), `${stableStringify(report)}\n`);
  writeFileSync(path.join(outDir, "external-links.md"), `${renderExternalLinksMd(report)}\n`);

  const { counts } = report.meta;
  const byState = Object.entries(counts.byState)
    .sort(([a], [b]) => compareLinks({ state: a, url: "" }, { state: b, url: "" }))
    .map(([s, n]) => `${s} ${n}`)
    .join(" · ");
  console.error(`[external-links] ${counts.total} checked — ${byState || "nothing to check"}`);
  if (counts.broken) {
    console.error(`[external-links] ${counts.broken} broken:`);
    for (const l of report.links.filter((x) => isBroken(x.state))) {
      console.error(`  ${l.state} ${l.detail}  ${l.url}  (in ${l.sources[0] ?? "?"})`);
    }
  }
  if (counts.internalAbsoluteBroken) {
    console.error(`[external-links] ${counts.internalAbsoluteBroken} internal-absolute link(s) do not resolve in dist:`);
    for (const b of report.internalAbsolute.broken) console.error(`  ${b.url}  (in ${b.sources[0] ?? "?"})`);
  }
  console.error(`[external-links] wrote ${path.relative(process.cwd(), outDir)}/external-links.{json,md} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  if (values.strict && counts.broken > 0) process.exit(1);
}
