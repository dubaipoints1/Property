// Audit harness — pure helpers shared by the render probe and the
// Lighthouse sampler. Exists because the 2026-09-06 site UI/UX audit
// needed a repeatable, machine-readable pass over every built route —
// overflow, heading order, link names, tap targets, focus rings, axe,
// dark-mode contrast, LCP/CLS — and the manual walk-through that preceded
// it could not be re-run or diffed. Everything that decides *what counts
// as a finding* lives here as a pure function so it is unit-tested in
// tests/audit/ and the browser scripts stay thin: they gather raw facts,
// this module classifies them.
//
// Rules of this file:
//   - node: builtins only (no playwright, no lighthouse) so tests import it
//     without a browser and the CLIs stay honest about what is pure;
//   - every helper that shapes JSON output is deterministic — sorted
//     arrays, rounded numbers, `stableStringify` for byte-identical files;
//   - the only impure helpers are detectPlaywrightChromium (default fs
//     lookups, injectable for tests) and startStaticServer (spawns
//     http-server for the CLIs, kept here so both CLIs share one copy).
//
// Consumers: scripts/audit/render-probe.mjs, scripts/audit/lighthouse-sample.mjs.
// Tests: tests/audit/render-lib.test.ts, tests/audit/lighthouse-lib.test.ts.

import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

// ---------------------------------------------------------------------------
// Generic utilities
// ---------------------------------------------------------------------------

/** Round to dp decimal places; passes null/undefined/NaN through as null. */
export function round(n, dp = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function toKeyArray(k) {
  return Array.isArray(k) ? k : [k];
}

function compareScalar(a, b) {
  const aNull = a === null || a === undefined;
  const bNull = b === null || b === undefined;
  if (aNull && bNull) return 0;
  if (aNull) return 1; // nulls last
  if (bNull) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}

/**
 * Stable sort by a key function. keyFn may return a scalar or an array of
 * scalars (compared element-wise); ties keep input order. Never mutates.
 */
export function stableSort(arr, keyFn = (x) => x) {
  return arr
    .map((v, i) => ({ v, i, k: toKeyArray(keyFn(v)) }))
    .sort((a, b) => {
      const n = Math.max(a.k.length, b.k.length);
      for (let j = 0; j < n; j += 1) {
        const c = compareScalar(a.k[j], b.k[j]);
        if (c !== 0) return c;
      }
      return a.i - b.i;
    })
    .map((x) => x.v);
}

function sortKeysDeep(v) {
  if (v === null || typeof v !== "object") return v;
  if (typeof v.toJSON === "function") return sortKeysDeep(v.toJSON());
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  const out = {};
  for (const k of Object.keys(v).sort()) {
    if (v[k] !== undefined) out[k] = sortKeysDeep(v[k]);
  }
  return out;
}

/** JSON.stringify with recursively sorted keys and 2-space indent. */
export function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value), null, 2);
}

/** Median of a numeric array (ignores null/undefined/NaN); null on empty. */
export function median(nums) {
  const xs = (nums ?? []).filter((n) => typeof n === "number" && !Number.isNaN(n)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

/** Nearest-rank percentile (p in 0..1); null on empty. */
export function percentile(nums, p) {
  const xs = (nums ?? []).filter((n) => typeof n === "number" && !Number.isNaN(n)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const rank = Math.min(xs.length, Math.max(1, Math.ceil(p * xs.length)));
  return xs[rank - 1];
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Map a dist-relative HTML path to the route the server serves it at.
 *   "index.html"          → "/"
 *   "cards/x/index.html"  → "/cards/x/"
 *   "404.html"            → "/404.html"
 */
export function routeFromHtmlPath(rel) {
  const p = String(rel).split(path.sep).join("/").replace(/^\/+/, "");
  if (p === "index.html") return "/";
  if (p.endsWith("/index.html")) return `/${p.slice(0, -"index.html".length)}`;
  return `/${p}`;
}

/** Sorted, de-duplicated routes for a list of dist-relative HTML files. */
export function deriveRoutes(htmlFiles) {
  return [...new Set(htmlFiles.map(routeFromHtmlPath))].sort();
}

function safeSegment(s) {
  return s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Filesystem-safe slug for a route, readable and injective over the routes a
 * static build produces (path segments never contain "__").
 *   "/"                 → "root"
 *   "/cards/x/"         → "cards__x"
 *   "/404.html"         → "404.html"
 *   "/search/?q=a b"    → "search__q-a-b"
 */
export function routeToSlug(route) {
  const r = String(route);
  if (r === "/" || r === "") return "root";
  const qIndex = r.indexOf("?");
  const pathPart = qIndex === -1 ? r : r.slice(0, qIndex);
  const query = qIndex === -1 ? "" : r.slice(qIndex + 1);
  const segments = pathPart.split("/").filter(Boolean).map(safeSegment).filter(Boolean);
  let slug = segments.join("__") || "root";
  if (query) slug += `__${safeSegment(decodeURIComponentSafe(query))}`;
  return slug;
}

function decodeURIComponentSafe(s) {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}

/**
 * Generic path-pattern → template label rules so every route gets a label
 * even when it is not in routes.sample.json. First match wins; callers fall
 * back to "Custom page".
 */
export const TEMPLATE_RULES = [
  { template: "Homepage", route: "/" },
  { template: "404", route: "/404.html" },
  { template: "Island-heavy (finder)", route: "/cards/finder/" },
  { template: "Compare", route: "/cards/compare/" },
  { template: "ComparisonTableLayout", match: "^/cards/(miles|cashback|islamic)/$" },
  { template: "ComparisonTableLayout", match: "^/cards/salary/\\d+/$" },
  { template: "Directory (salary bands)", route: "/cards/salary/" },
  { template: "Directory (cards)", route: "/cards/" },
  { template: "CardReviewLayout", match: "^/cards/[^/]+/$" },
  { template: "Directory (guides)", route: "/guides/" },
  { template: "ArticleLayout (guide)", match: "^/guides/[^/]+/$" },
  { template: "NewsIndexLayout", route: "/news/" },
  { template: "NewsIndexLayout", match: "^/news/(airlines|banking|hotels)/$" },
  { template: "ArticleLayout (news)", match: "^/news/[^/]+/$" },
  { template: "Deals", route: "/deals/" },
  { template: "ArticleLayout (deal)", match: "^/deals/[^/]+/$" },
  { template: "Directory (banks)", route: "/banks/" },
  { template: "BankHubLayout", match: "^/banks/[^/]+/$" },
  { template: "Directory (programmes)", route: "/airlines/" },
  { template: "AirlineProgramLayout", match: "^/airlines/[^/]+/$" },
  { template: "SalaryTransferHistoryLayout", match: "^/salary-transfer/history/" },
  { template: "SalaryTransferCalculatorLayout", match: "^/salary-transfer/calculator/$" },
  { template: "SalaryTransferTrackerLayout", route: "/salary-transfer/" },
  { template: "SalaryTransferTrackerLayout", match: "^/salary-transfer/(aed-|[a-z-]+/$)" },
  { template: "Search (pagefind runtime)", match: "^/search/" },
  { template: "Rewards calculator", route: "/calculator/" },
  {
    template: "TrustPageLayout",
    match:
      "^/(about|corrections|editorial-policy|editorial-policy/how-we-score|glossary|how-we-make-money|newsletter|partnership|press|team|tip|valuations/methodology)/$",
  },
];

export const DEFAULT_TEMPLATE = "Custom page";

/** First rule whose exact `route` or regex `match` fits → its template, else null. */
export function templateForRoute(route, rules = TEMPLATE_RULES) {
  for (const rule of rules) {
    if (rule.route !== undefined && rule.route === route) return rule.template;
    if (rule.match !== undefined && new RegExp(rule.match).test(route)) return rule.template;
  }
  return null;
}

function routePathOnly(route) {
  const q = route.indexOf("?");
  return q === -1 ? route : route.slice(0, q);
}

/**
 * Resolve a routes.sample.json list against the routes actually built.
 * Explicit `route` entries are kept when the route (or its path without
 * query) exists; `match` entries take the first sorted route matching the
 * regex. Sample order is preserved (it is curated most-important-first, so
 * `--limit` keeps the templates that matter); duplicate routes keep the
 * first label. Templates with no built route are reported in `missing`.
 */
export function resolveSampleRoutes(sample, allRoutes) {
  const built = new Set(allRoutes);
  const sorted = [...allRoutes].sort();
  const routes = [];
  const missing = [];
  const seen = new Set();
  for (const entry of sample) {
    let route = null;
    if (entry.route !== undefined) {
      if (built.has(entry.route) || built.has(routePathOnly(entry.route))) route = entry.route;
    } else if (entry.match !== undefined) {
      const re = new RegExp(entry.match);
      route = sorted.find((r) => re.test(r)) ?? null;
    }
    if (route === null) {
      missing.push(entry.template);
      continue;
    }
    if (seen.has(route)) continue;
    seen.add(route);
    routes.push({ route, template: entry.template });
  }
  return { routes, missing };
}

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

/**
 * levels: heading levels in document order, e.g. [1, 2, 4, 2, 3].
 * A skip is any step that goes deeper by more than one level.
 */
export function analyseHeadings(levels) {
  const ls = (levels ?? []).map(Number);
  const skips = [];
  for (let i = 1; i < ls.length; i += 1) {
    if (ls[i] > ls[i - 1] + 1) skips.push({ index: i, from: ls[i - 1], to: ls[i] });
  }
  return {
    h1Count: ls.filter((l) => l === 1).length,
    firstIsH1: ls.length > 0 && ls[0] === 1,
    skips,
  };
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const GENERIC_LINK_TEXT = new Set([
  "read more",
  "click here",
  "here",
  "more",
  "learn more",
  "link",
  "this",
  "details",
  "continue reading",
  "view",
  "see more",
  "go",
]);

/** trim, collapse whitespace, lowercase, strip trailing punctuation/arrows. */
export function normaliseLinkText(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s.,;:!?\-–—→›»…>]+$/u, "")
    .trim();
}

/**
 * Accessible name in ARIA precedence: aria-labelledby > aria-label > text
 * content > img alt > title. Returns {name, source}; name "" when nothing
 * contributes.
 */
export function computeLinkName({ text, ariaLabel, ariaLabelledbyText, title, imgAlts } = {}) {
  const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
  const candidates = [
    ["aria-labelledby", clean(ariaLabelledbyText)],
    ["aria-label", clean(ariaLabel)],
    ["text", clean(text)],
    ["img-alt", clean((imgAlts ?? []).filter(Boolean).join(" "))],
    ["title", clean(title)],
  ];
  for (const [source, name] of candidates) {
    if (name) return { name, source };
  }
  return { name: "", source: null };
}

/** null when the link name is fine, else {code:"empty-name"} | {code:"generic-text", text}. */
export function classifyLink(nameParts) {
  const { name } = computeLinkName(nameParts);
  if (!name) return { code: "empty-name" };
  const text = normaliseLinkText(name);
  if (!text) return { code: "empty-name" };
  if (GENERIC_LINK_TEXT.has(text)) return { code: "generic-text", text };
  return null;
}

// ---------------------------------------------------------------------------
// Tap targets (WCAG 2.5.8 minimum 24px; house target 44px)
// ---------------------------------------------------------------------------

/**
 * "exempt-inline" — inline element inside a run of text (WCAG exemption);
 * "small"         — either dimension under 24px;
 * "below-44"      — under the 44px house minimum;
 * "ok"            — 44px or more on both axes.
 */
export function classifyTapTarget({ w, h, display, inTextBlock } = {}) {
  if (inTextBlock && String(display ?? "").startsWith("inline") && display !== "inline-block") {
    return "exempt-inline";
  }
  const minSide = Math.min(Number(w) || 0, Number(h) || 0);
  if (minSide < 24) return "small";
  if (minSide < 44) return "below-44";
  return "ok";
}

// ---------------------------------------------------------------------------
// Overflow
// ---------------------------------------------------------------------------

/**
 * rects: [{selector, left, right, width, parentIndex}] where parentIndex is
 * the index (in `rects`) of the nearest ancestor that is also in the list,
 * or -1. Keeps elements whose right edge exceeds innerWidth + tolerance,
 * drops descendants of another offender (the ancestor is the actionable
 * one), sorts by overrun desc, caps at max.
 */
export function pickOverflowOffenders(rects, innerWidth, { max = 10, tolerance = 1 } = {}) {
  const offending = (r) => r && r.right > innerWidth + tolerance;
  const kept = [];
  rects.forEach((r, i) => {
    if (!offending(r)) return;
    let p = r.parentIndex;
    let hops = 0;
    while (p !== undefined && p !== null && p >= 0 && p < rects.length && hops < 1000) {
      if (offending(rects[p])) return;
      p = rects[p].parentIndex;
      hops += 1;
    }
    kept.push({
      selector: r.selector,
      overrun: round(r.right - innerWidth, 1),
      width: round(r.width, 1),
      left: round(r.left, 1),
      right: round(r.right, 1),
      index: i,
    });
  });
  return stableSort(kept, (o) => [-o.overrun, o.selector])
    .slice(0, max)
    .map(({ index, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Codes (sorted): "missing-alt" (alt attribute absent; alt="" is decorative
 * and fine), "missing-dimensions" (no width+height and no aspect-ratio, so
 * it can shift layout), "not-loaded" (finished loading with no pixels, or
 * still pending and not lazy). Hidden/presentational images return [].
 */
export function classifyImage({
  alt,
  hasWidth,
  hasHeight,
  hasAspectRatio,
  naturalWidth,
  complete,
  loading,
  role,
  isHidden,
} = {}) {
  if (isHidden || role === "presentation" || role === "none") return [];
  const codes = [];
  if (alt === null || alt === undefined) codes.push("missing-alt");
  if (!(hasWidth && hasHeight) && !hasAspectRatio) codes.push("missing-dimensions");
  const failed = complete === true && (naturalWidth ?? 0) === 0;
  const pending = complete === false && loading !== "lazy";
  if (failed || pending) codes.push("not-loaded");
  return codes.sort();
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/**
 * CLS per the session-window definition: shifts without recent input,
 * grouped into windows that close after a 1 s gap or 5 s total; the score
 * is the largest window sum, rounded to 3 dp.
 */
export function clsFromShifts(shifts) {
  let best = 0;
  let sum = 0;
  let windowStart = null;
  let prev = null;
  const xs = stableSort((shifts ?? []).filter((s) => s && !s.hadRecentInput), (s) => s.startTime);
  for (const s of xs) {
    const t = Number(s.startTime) || 0;
    const v = Number(s.value) || 0;
    if (windowStart === null || t - prev >= 1000 || t - windowStart > 5000) {
      windowStart = t;
      sum = 0;
    }
    sum += v;
    prev = t;
    if (sum > best) best = sum;
  }
  return round(best, 3);
}

/** Sum of bytes for entries that finished at or before tMs. */
export function sumBytesBefore(entries, tMs) {
  let total = 0;
  for (const e of entries ?? []) {
    if (typeof e.endMs === "number" && e.endMs <= tMs) total += Number(e.bytes) || 0;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Browser discovery
// ---------------------------------------------------------------------------

/**
 * Find a full Chromium binary (Lighthouse needs the real chrome with
 * --headless=new, not the headless shell). Precedence:
 * DP_CHROME_PATH > CHROME_PATH > highest chromium-<rev>/chrome-linux/chrome
 * under PLAYWRIGHT_BROWSERS_PATH, then ~/.cache/ms-playwright > null.
 * fs access is injectable for tests.
 */
export function detectPlaywrightChromium({
  env = process.env,
  listDir = (d) => {
    try {
      return readdirSync(d);
    } catch {
      return [];
    }
  },
  exists = existsSync,
} = {}) {
  for (const key of ["DP_CHROME_PATH", "CHROME_PATH"]) {
    const p = env[key];
    if (p && exists(p)) return p;
  }
  const roots = [];
  if (env.PLAYWRIGHT_BROWSERS_PATH) roots.push(env.PLAYWRIGHT_BROWSERS_PATH);
  roots.push(path.join(env.HOME || homedir(), ".cache", "ms-playwright"));
  for (const root of roots) {
    const revs = listDir(root)
      .map((name) => /^chromium-(\d+)$/.exec(name))
      .filter(Boolean)
      .map((m) => Number(m[1]))
      .sort((a, b) => b - a);
    for (const rev of revs) {
      const dir = path.join(root, `chromium-${rev}`);
      const candidates = [
        path.join(dir, "chrome-linux", "chrome"),
        path.join(dir, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"),
        path.join(dir, "chrome-win", "chrome.exe"),
      ];
      const hit = candidates.find((c) => exists(c));
      if (hit) return hit;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Static server (shared by both CLIs)
// ---------------------------------------------------------------------------

/** Ask the OS for a free TCP port on 127.0.0.1. */
export function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/**
 * Spawn `http-server <dist> -a 127.0.0.1 -p <port> -c-1 --silent` and wait
 * for GET / to answer 200. Deliberately WITHOUT -s: the SPA flag would
 * serve index.html for unknown paths and hide real 404s. http-server does
 * not serve dist/404.html for misses either, so probe /404.html directly.
 */
export async function startStaticServer({ distDir, port, timeoutMs = 15000 } = {}) {
  const require = createRequire(import.meta.url);
  const bin = path.join(path.dirname(require.resolve("http-server/package.json")), "bin", "http-server");
  const p = port ?? (await getFreePort());
  const child = spawn(process.execPath, [bin, distDir, "-a", "127.0.0.1", "-p", String(p), "-c-1", "--silent"], {
    stdio: "ignore",
  });
  const baseUrl = `http://127.0.0.1:${p}`;
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });
  const close = () => {
    if (!exited) {
      try {
        child.kill("SIGTERM");
      } catch {
        /* already gone */
      }
    }
  };
  process.once("exit", close);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (exited) throw new Error("http-server exited before it started serving");
    try {
      const res = await fetch(`${baseUrl}/`, { method: "GET" });
      if (res.status === 200) return { baseUrl, port: p, close };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  close();
  throw new Error(`http-server did not answer on ${baseUrl} within ${timeoutMs} ms`);
}

// ---------------------------------------------------------------------------
// Aggregation of render probes
// ---------------------------------------------------------------------------

const IMPACT_RANK = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function impactRank(impact) {
  return IMPACT_RANK[impact] ?? 4;
}

function worstImpact(a, b) {
  return impactRank(a) <= impactRank(b) ? a : b;
}

function groupAxe(entries) {
  // entries: [{route, violation}]
  const byId = new Map();
  for (const { route, violation: v } of entries) {
    const cur = byId.get(v.id) ?? {
      id: v.id,
      impact: v.impact ?? null,
      help: v.help ?? "",
      helpUrl: v.helpUrl ?? "",
      routes: new Set(),
      nodeCount: 0,
      example: null,
    };
    cur.impact = cur.impact ? worstImpact(cur.impact, v.impact ?? cur.impact) : (v.impact ?? null);
    cur.routes.add(route);
    cur.nodeCount += v.nodeCount ?? (v.nodes ? v.nodes.length : 0);
    if (!cur.example && v.nodes && v.nodes[0]) cur.example = { route, target: v.nodes[0].target };
    byId.set(v.id, cur);
  }
  return stableSort(
    [...byId.values()].map((g) => ({
      ...g,
      routes: [...g.routes].sort(),
      routeCount: g.routes.size,
    })),
    (g) => [impactRank(g.impact), g.id],
  );
}

function statsOf(nums) {
  return { median: round(median(nums), 3), p75: round(percentile(nums, 0.75), 3) };
}

/**
 * Roll per-route probe records (schema v1, see render-probe.mjs) up into
 * the cross-route view the summary is written from. Pure; every array is
 * sorted so the JSON is stable.
 */
export function summariseProbes(probes) {
  const routes = stableSort(probes ?? [], (p) => p.route);
  const done = routes.filter((p) => p.status === "ok");
  const errored = routes.filter((p) => p.status !== "ok");

  const byRoute = [];
  const overflowByViewport = {};
  const axeEntries = [];
  const darkEntries = [];
  const genericMap = new Map();
  const imagesMap = new Map();
  const focusFailures = [];
  const motionOffenders = [];
  const metricsByTemplateRaw = {};
  const menuFailures = [];
  const headingIssues = [];

  const totals = {
    routes: routes.length,
    done: done.length,
    errored: errored.length,
    findings: 0,
    overflowRoutes: 0,
    axeViolationRoutes: 0,
    axeViolationNodes: 0,
    darkContrastRoutes: 0,
    imageIssues: 0,
    linkIssues: 0,
    focusFailures: 0,
    consoleErrors: 0,
    pageErrors: 0,
    failedRequests: 0,
    httpErrors: 0,
    headingIssues: 0,
    motionOffenders: 0,
    tapTargetIssues: 0,
    menuFailures: 0,
  };

  for (const p of done) {
    const overflowViewports = [];
    let tapIssues = 0;
    for (const [w, v] of Object.entries(p.viewports ?? {})) {
      for (const [key, theme] of [
        ["overflow", "light"],
        ["overflowDark", "dark"],
      ]) {
        const o = v[key];
        if (o && o.scrollWidth > o.innerWidth) {
          overflowViewports.push(`${w}${theme === "dark" ? "-dark" : ""}`);
          (overflowByViewport[w] ??= []).push({
            route: p.route,
            theme,
            scrollWidth: o.scrollWidth,
            innerWidth: o.innerWidth,
            offender: o.offenders?.[0]?.selector ?? null,
            overrun: o.offenders?.[0]?.overrun ?? round(o.scrollWidth - o.innerWidth, 1),
          });
        }
      }
      tapIssues += v.tapTargets?.below44 ?? 0;
    }
    totals.tapTargetIssues += tapIssues;

    const axeV = p.axe?.light?.violations ?? [];
    for (const violation of axeV) axeEntries.push({ route: p.route, violation });
    const darkV = p.axe?.dark?.violations ?? [];
    for (const violation of darkV) darkEntries.push({ route: p.route, violation });
    const axeNodes = axeV.reduce((n, v) => n + (v.nodeCount ?? 0), 0);

    for (const issue of p.links?.issues ?? []) {
      const label = issue.code === "generic-text" ? issue.text : "(empty)";
      const key = `${issue.code}|${label}`;
      const cur = genericMap.get(key) ?? { code: issue.code, text: label, count: 0, routes: new Set(), example: null };
      cur.count += 1;
      cur.routes.add(p.route);
      if (!cur.example) cur.example = { route: p.route, selector: issue.selector, href: issue.href };
      genericMap.set(key, cur);
    }

    for (const issue of p.images?.issues ?? []) {
      for (const code of issue.codes ?? []) {
        const cur = imagesMap.get(code) ?? { code, count: 0, routes: new Set(), examples: [] };
        cur.count += 1;
        cur.routes.add(p.route);
        if (cur.examples.length < 5) cur.examples.push({ route: p.route, selector: issue.selector, src: issue.src });
        imagesMap.set(code, cur);
      }
    }

    let focusFail = 0;
    for (const mode of ["desktop", "mobile"]) {
      const f = p.focus?.[mode];
      if (!f) continue;
      const failures = f.failures ?? [];
      const invisible = failures.filter((s) => s.invisible).length;
      focusFail += failures.length;
      if (failures.length) {
        focusFailures.push({
          route: p.route,
          mode,
          failureCount: failures.length,
          invisibleCount: invisible,
          examples: failures.slice(0, 5).map((s) => ({ selector: s.selector, text: s.text, invisible: !!s.invisible })),
        });
      }
    }

    if ((p.motion?.animationsReduced ?? 0) > 0) {
      motionOffenders.push({
        route: p.route,
        animationsNoPreference: p.motion.animationsNoPreference ?? null,
        animationsReduced: p.motion.animationsReduced,
        offenders: p.motion.reducedOffenders ?? [],
      });
    }

    const h = p.headings ?? {};
    const headingProblems = [];
    if (h.h1Count !== undefined && h.h1Count !== 1) headingProblems.push(`h1Count=${h.h1Count}`);
    if (h.firstIsH1 === false) headingProblems.push("first heading is not h1");
    if ((h.skips ?? []).length) headingProblems.push(`${h.skips.length} level skip(s)`);
    if (headingProblems.length) headingIssues.push({ route: p.route, problems: headingProblems });

    if (p.menu && (!p.menu.enterOpens || !p.menu.spaceOpens || !p.menu.escapeCloses)) {
      menuFailures.push({ route: p.route, ...p.menu });
    }

    const c = p.console ?? {};
    const consoleErrors = (c.errors ?? []).length;
    const pageErrors = (c.pageErrors ?? []).length;
    const failedRequests = (c.failedRequests ?? []).length;
    const httpErrors = (c.httpErrors ?? []).length;

    const tpl = p.template ?? DEFAULT_TEMPLATE;
    const m = p.metrics ?? {};
    const raw = (metricsByTemplateRaw[tpl] ??= { routes: 0, lcpMs: [], cls: [], domNodes: [], transferredBytes: [] });
    raw.routes += 1;
    if (typeof m.lcpMs === "number") raw.lcpMs.push(m.lcpMs);
    if (typeof m.cls === "number") raw.cls.push(m.cls);
    if (typeof m.domNodes === "number") raw.domNodes.push(m.domNodes);
    if (typeof m.transferredBytes === "number") raw.transferredBytes.push(m.transferredBytes);

    const linkIssues = (p.links?.issues ?? []).length;
    const imageIssues = (p.images?.issues ?? []).length;
    const findingCount =
      overflowViewports.length +
      axeV.length +
      darkV.length +
      imageIssues +
      linkIssues +
      focusFail +
      consoleErrors +
      pageErrors +
      failedRequests +
      httpErrors +
      headingProblems.length +
      ((p.motion?.animationsReduced ?? 0) > 0 ? 1 : 0) +
      tapIssues +
      (p.menu && (!p.menu.enterOpens || !p.menu.spaceOpens || !p.menu.escapeCloses) ? 1 : 0);

    byRoute.push({
      route: p.route,
      template: tpl,
      status: p.status,
      httpStatus: p.httpStatus ?? null,
      findingCount,
      overflowViewports,
      axeViolations: axeV.length,
      darkContrastViolations: darkV.length,
      imageIssues,
      linkIssues,
      focusFailures: focusFail,
      consoleErrors,
      headingProblems,
      tapTargetIssues: tapIssues,
      lcpMs: m.lcpMs ?? null,
      cls: m.cls ?? null,
    });

    totals.findings += findingCount;
    if (overflowViewports.length) totals.overflowRoutes += 1;
    if (axeV.length) totals.axeViolationRoutes += 1;
    totals.axeViolationNodes += axeNodes;
    if (darkV.length) totals.darkContrastRoutes += 1;
    totals.imageIssues += imageIssues;
    totals.linkIssues += linkIssues;
    totals.focusFailures += focusFail;
    totals.consoleErrors += consoleErrors;
    totals.pageErrors += pageErrors;
    totals.failedRequests += failedRequests;
    totals.httpErrors += httpErrors;
    totals.headingIssues += headingProblems.length;
    if ((p.motion?.animationsReduced ?? 0) > 0) totals.motionOffenders += 1;
  }
  totals.menuFailures = menuFailures.length;

  for (const w of Object.keys(overflowByViewport)) {
    overflowByViewport[w] = stableSort(overflowByViewport[w], (o) => [o.route, o.theme]);
  }

  const metricsByTemplate = {};
  for (const tpl of Object.keys(metricsByTemplateRaw).sort()) {
    const r = metricsByTemplateRaw[tpl];
    metricsByTemplate[tpl] = {
      routes: r.routes,
      lcpMs: statsOf(r.lcpMs),
      cls: statsOf(r.cls),
      domNodes: statsOf(r.domNodes),
      transferredBytes: statsOf(r.transferredBytes),
    };
  }

  return {
    totals,
    byRoute: stableSort(byRoute, (r) => r.route),
    overflowByViewport,
    axeByRule: groupAxe(axeEntries),
    genericTextByLabel: stableSort(
      [...genericMap.values()].map((g) => ({ ...g, routes: [...g.routes].sort(), routeCount: g.routes.size })),
      (g) => [-g.count, g.code, g.text],
    ),
    imagesByCode: stableSort(
      [...imagesMap.values()].map((g) => ({ ...g, routes: [...g.routes].sort(), routeCount: g.routes.size })),
      (g) => g.code,
    ),
    focusFailures: stableSort(focusFailures, (f) => [f.route, f.mode]),
    motionOffenders: stableSort(motionOffenders, (m) => m.route),
    darkContrastByRule: groupAxe(darkEntries),
    metricsByTemplate,
    headingIssues: stableSort(headingIssues, (h) => h.route),
    menuFailures: stableSort(menuFailures, (m) => m.route),
    erroredRoutes: stableSort(
      errored.map((p) => ({ route: p.route, error: p.error ?? "unknown", attempts: p.attempts ?? null })),
      (e) => e.route,
    ),
  };
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function fmtInt(n) {
  return n === null || n === undefined ? "–" : String(Math.round(n));
}

function fmtKb(bytes) {
  return bytes === null || bytes === undefined ? "–" : `${(bytes / 1024).toFixed(1)} KB`;
}

/** Markdown rendering of summariseProbes() output plus run meta. */
export function renderRenderSummaryMd(summary, meta = {}) {
  const L = [];
  const t = summary.totals;
  L.push("# Render probe summary");
  L.push("");
  L.push("Generated by `scripts/audit/render-probe.mjs` (2026-09-06 site UI/UX audit). Numbers describe the local");
  L.push("`http-server` build of `dist/`, not production; external hosts were " +
    (meta.externalMode === "allow" ? "allowed." : "**blocked** (fonts fall back to system stacks)."));
  L.push("");
  L.push("## Run");
  L.push("");
  L.push("| Field | Value |");
  L.push("|---|---|");
  for (const [k, v] of Object.entries({
    generatedAt: meta.generatedAt,
    commit: meta.commit,
    baseUrl: meta.baseUrl,
    distDir: meta.distDir,
    playwright: meta.playwrightVersion,
    chromium: meta.chromiumVersion,
    axe: meta.axeVersion,
    externalMode: meta.externalMode,
    viewports: (meta.viewports ?? []).join(", "),
    themes: (meta.themes ?? []).join(", "),
    checks: (meta.checks ?? []).join(", "),
    routes: `${meta.routesDone ?? t.done} done / ${meta.routesErrored ?? t.errored} errored / ${meta.routesTotal ?? t.routes} total`,
    durationMs: meta.durationMs,
  })) {
    L.push(`| ${k} | ${mdEscape(v ?? "–")} |`);
  }
  L.push("");
  L.push("## Totals");
  L.push("");
  L.push("| Metric | Count |");
  L.push("|---|---|");
  for (const [k, v] of Object.entries(t)) L.push(`| ${k} | ${v} |`);
  L.push("");

  L.push("## Routes with horizontal overflow, per viewport");
  L.push("");
  const vps = Object.keys(summary.overflowByViewport).sort((a, b) => Number(a) - Number(b));
  if (!vps.length) L.push("None.");
  for (const w of vps) {
    L.push(`### ${w}px`);
    L.push("");
    L.push("| Route | Theme | scrollWidth | innerWidth | Top offender | Overrun |");
    L.push("|---|---|---|---|---|---|");
    for (const o of summary.overflowByViewport[w]) {
      L.push(`| ${o.route} | ${o.theme} | ${o.scrollWidth} | ${o.innerWidth} | \`${mdEscape(o.offender)}\` | ${o.overrun}px |`);
    }
    L.push("");
  }
  L.push("");

  L.push("## axe violations by rule (light)");
  L.push("");
  if (!summary.axeByRule.length) L.push("None.");
  else {
    L.push("| Rule | Impact | Routes | Nodes | Example target | Help |");
    L.push("|---|---|---|---|---|---|");
    for (const r of summary.axeByRule) {
      const ex = r.example ? `${r.example.route} → \`${mdEscape(r.example.target)}\`` : "–";
      L.push(`| ${r.id} | ${r.impact ?? "–"} | ${r.routeCount} | ${r.nodeCount} | ${ex} | [rule](${r.helpUrl}) |`);
    }
  }
  L.push("");

  L.push("## Images by issue code");
  L.push("");
  if (!summary.imagesByCode.length) L.push("None.");
  else {
    L.push("| Code | Images | Routes | Example |");
    L.push("|---|---|---|---|");
    for (const g of summary.imagesByCode) {
      const ex = g.examples[0] ? `${g.examples[0].route} → \`${mdEscape(g.examples[0].src)}\`` : "–";
      L.push(`| ${g.code} | ${g.count} | ${g.routeCount} | ${ex} |`);
    }
  }
  L.push("");

  L.push("## Generic / empty link text by label");
  L.push("");
  if (!summary.genericTextByLabel.length) L.push("None.");
  else {
    L.push("| Label | Code | Links | Routes | Example |");
    L.push("|---|---|---|---|---|");
    for (const g of summary.genericTextByLabel) {
      const ex = g.example ? `${g.example.route} → \`${mdEscape(g.example.selector)}\`` : "–";
      L.push(`| ${mdEscape(g.text)} | ${g.code} | ${g.count} | ${g.routeCount} | ${ex} |`);
    }
  }
  L.push("");

  L.push("## Focus failures (no visible ring, or focus landed on an invisible element)");
  L.push("");
  if (!summary.focusFailures.length) L.push("None.");
  else {
    L.push("| Route | Mode | Failures | Invisible stops | Examples |");
    L.push("|---|---|---|---|---|");
    for (const f of summary.focusFailures) {
      const ex = f.examples.map((e) => `\`${mdEscape(e.selector)}\`${e.invisible ? " (invisible)" : ""}`).join(", ");
      L.push(`| ${f.route} | ${f.mode} | ${f.failureCount} | ${f.invisibleCount} | ${ex} |`);
    }
  }
  L.push("");

  L.push("## Motion offenders (animations still running under prefers-reduced-motion)");
  L.push("");
  if (!summary.motionOffenders.length) L.push("None.");
  else {
    L.push("| Route | Running (no preference) | Running (reduce) | Animations |");
    L.push("|---|---|---|---|");
    for (const m of summary.motionOffenders) {
      const names = m.offenders.map((o) => `${o.animationName} on \`${mdEscape(o.selector)}\``).join(", ");
      L.push(`| ${m.route} | ${m.animationsNoPreference ?? "–"} | ${m.animationsReduced} | ${names} |`);
    }
  }
  L.push("");

  L.push("## Dark-mode contrast by rule");
  L.push("");
  if (!summary.darkContrastByRule.length) L.push("None (or dark theme not probed).");
  else {
    L.push("| Rule | Impact | Routes | Nodes | Example target | Help |");
    L.push("|---|---|---|---|---|---|");
    for (const r of summary.darkContrastByRule) {
      const ex = r.example ? `${r.example.route} → \`${mdEscape(r.example.target)}\`` : "–";
      L.push(`| ${r.id} | ${r.impact ?? "–"} | ${r.routeCount} | ${r.nodeCount} | ${ex} | [rule](${r.helpUrl}) |`);
    }
  }
  L.push("");

  L.push("## Heading structure issues");
  L.push("");
  if (!summary.headingIssues.length) L.push("None.");
  else {
    L.push("| Route | Problems |");
    L.push("|---|---|");
    for (const h of summary.headingIssues) L.push(`| ${h.route} | ${h.problems.join("; ")} |`);
  }
  L.push("");

  L.push("## Mobile menu keyboard probe failures");
  L.push("");
  if (!summary.menuFailures.length) L.push("None (or menu check not run).");
  else {
    L.push("| Route | Enter opens | Space opens | Escape closes |");
    L.push("|---|---|---|---|");
    for (const m of summary.menuFailures) L.push(`| ${m.route} | ${m.enterOpens} | ${m.spaceOpens} | ${m.escapeCloses} |`);
  }
  L.push("");

  L.push("## Medians per template (light, 1280px)");
  L.push("");
  const tpls = Object.keys(summary.metricsByTemplate);
  if (!tpls.length) L.push("None.");
  else {
    L.push("| Template | Routes | LCP median / p75 | CLS median / p75 | DOM nodes median | Transferred median |");
    L.push("|---|---|---|---|---|---|");
    for (const tpl of tpls) {
      const m = summary.metricsByTemplate[tpl];
      L.push(
        `| ${mdEscape(tpl)} | ${m.routes} | ${fmtInt(m.lcpMs.median)} / ${fmtInt(m.lcpMs.p75)} ms | ` +
          `${m.cls.median ?? "–"} / ${m.cls.p75 ?? "–"} | ${fmtInt(m.domNodes.median)} | ${fmtKb(m.transferredBytes.median)} |`,
      );
    }
  }
  L.push("");

  L.push("## Errored routes");
  L.push("");
  if (!summary.erroredRoutes.length) L.push("None.");
  else {
    L.push("| Route | Attempts | Error |");
    L.push("|---|---|---|");
    for (const e of summary.erroredRoutes) L.push(`| ${e.route} | ${e.attempts ?? "–"} | ${mdEscape(e.error)} |`);
  }
  L.push("");

  L.push("## Per-route roll-up");
  L.push("");
  L.push("| Route | Template | Findings | Overflow | axe | Dark | Images | Links | Focus | Console | LCP ms | CLS |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of summary.byRoute) {
    L.push(
      `| ${r.route} | ${mdEscape(r.template)} | ${r.findingCount} | ${r.overflowViewports.join(" ") || "–"} | ${r.axeViolations} | ` +
        `${r.darkContrastViolations} | ${r.imageIssues} | ${r.linkIssues} | ${r.focusFailures} | ${r.consoleErrors} | ` +
        `${fmtInt(r.lcpMs)} | ${r.cls ?? "–"} |`,
    );
  }
  L.push("");
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// Lighthouse helpers
// ---------------------------------------------------------------------------

function scoreOf(lhr, cat) {
  const s = lhr?.categories?.[cat]?.score;
  return typeof s === "number" ? Math.round(s * 100) : null;
}

function numericOf(lhr, audit) {
  const v = lhr?.audits?.[audit]?.numericValue;
  return typeof v === "number" ? v : null;
}

function networkItems(lhr) {
  return lhr?.audits?.["network-requests"]?.details?.items ?? [];
}

/** Route (path + query) an LHR was run against. */
export function routeFromLhr(lhr) {
  const u = lhr?.finalDisplayedUrl ?? lhr?.finalUrl ?? lhr?.requestedUrl ?? "";
  try {
    const url = new URL(u);
    return `${url.pathname}${url.search}`;
  } catch {
    return u || null;
  }
}

/**
 * Bytes transferred by requests that had finished by the LCP time — the
 * "above the fold" weight a reader pays before the hero renders. Null when
 * the LHR has no LCP.
 */
export function aboveFoldBytesFromLhr(lhr) {
  const lcp = numericOf(lhr, "largest-contentful-paint");
  if (lcp === null) return null;
  return sumBytesBefore(
    networkItems(lhr).map((it) => ({ endMs: it.networkEndTime, bytes: it.transferSize })),
    lcp,
  );
}

/** One scores.md / scores.json row per LHR. Rounded, no timestamps. */
export function lhrToRow(lhr, preset) {
  const items = networkItems(lhr);
  const totalBytes =
    numericOf(lhr, "total-byte-weight") ?? items.reduce((n, it) => n + (Number(it.transferSize) || 0), 0);
  const above = aboveFoldBytesFromLhr(lhr);
  return {
    route: routeFromLhr(lhr),
    preset,
    performance: scoreOf(lhr, "performance"),
    accessibility: scoreOf(lhr, "accessibility"),
    bestPractices: scoreOf(lhr, "best-practices"),
    seo: scoreOf(lhr, "seo"),
    lcpMs: round(numericOf(lhr, "largest-contentful-paint"), 0),
    cls: round(numericOf(lhr, "cumulative-layout-shift"), 3),
    tbtMs: round(numericOf(lhr, "total-blocking-time"), 0),
    aboveFoldKb: above === null ? null : round(above / 1024, 1),
    requests: items.length,
    totalKb: round(totalBytes / 1024, 1),
  };
}

/**
 * Budget: mobile performance >= mobilePerf (desktop is informational);
 * above-fold weight <= aboveFoldKb on every preset. A row with no
 * performance score (errored run) breaches, so --assert cannot pass on a
 * run that never measured anything.
 */
export function evaluateBudget(rows, { mobilePerf = 95, aboveFoldKb = 200 } = {}) {
  const breaches = [];
  for (const r of stableSort(rows ?? [], (x) => [x.route, x.preset])) {
    if (r.preset === "mobile" && (r.performance === null || r.performance < mobilePerf)) {
      breaches.push({ route: r.route, preset: r.preset, metric: "performance", value: r.performance, limit: mobilePerf });
    }
    if (typeof r.aboveFoldKb === "number" && r.aboveFoldKb > aboveFoldKb) {
      breaches.push({ route: r.route, preset: r.preset, metric: "aboveFoldKb", value: r.aboveFoldKb, limit: aboveFoldKb });
    }
  }
  return { ok: breaches.length === 0, breaches };
}

/** The run whose performance score is the median (lower-middle on even counts). */
export function pickMedianRun(lhrs) {
  const xs = (lhrs ?? []).filter(Boolean);
  if (xs.length === 0) return null;
  const scored = xs.filter((l) => typeof l?.categories?.performance?.score === "number");
  if (scored.length === 0) return xs[0];
  const sorted = stableSort(scored, (l) => l.categories.performance.score);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Markdown scores table; a Budget section appears only when there are breaches. */
export function renderScoresTableMd(rows, budgetResult, meta = {}) {
  const L = [];
  L.push("# Lighthouse sample");
  L.push("");
  L.push("Generated by `scripts/audit/lighthouse-sample.mjs` (2026-09-06 site UI/UX audit).");
  L.push(
    `Served by ${meta.server ?? "http-server (uncompressed)"} — no gzip/brotli, no CDN cache — so byte and LCP figures are **pessimistic** relative to Cloudflare Pages.`,
  );
  if (meta.lighthouseVersion) L.push(`Lighthouse ${meta.lighthouseVersion}; ${meta.runs ?? 1} run(s) per route/preset, median by performance.`);
  L.push("");
  L.push("| Route | Preset | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms | Above-fold KB | Requests | Total KB |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
  const d = (v) => (v === null || v === undefined ? "–" : String(v));
  for (const r of stableSort(rows ?? [], (x) => [x.route, x.preset])) {
    L.push(
      `| ${r.route} | ${r.preset} | ${d(r.performance)} | ${d(r.accessibility)} | ${d(r.bestPractices)} | ${d(r.seo)} | ` +
        `${d(r.lcpMs)} | ${d(r.cls)} | ${d(r.tbtMs)} | ${d(r.aboveFoldKb)} | ${d(r.requests)} | ${d(r.totalKb)} |` +
        (r.error ? ` error: ${mdEscape(r.error)}` : ""),
    );
  }
  L.push("");
  if (budgetResult && !budgetResult.ok) {
    L.push("## Budget");
    L.push("");
    L.push("| Route | Preset | Metric | Value | Limit |");
    L.push("|---|---|---|---|---|");
    for (const b of budgetResult.breaches) {
      L.push(`| ${b.route} | ${b.preset} | ${b.metric} | ${d(b.value)} | ${b.limit} |`);
    }
    L.push("");
  }
  return L.join("\n");
}
