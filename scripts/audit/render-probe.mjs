// Render probe — drives headless Chromium over every built route and records
// what a reader would actually hit: horizontal overflow per viewport,
// heading order, image alt/dimensions, link names, tap-target sizes, focus
// rings, console/network errors, LCP/CLS, font availability, motion under
// prefers-reduced-motion, axe violations (light) and colour-contrast (dark),
// plus fold screenshots. Exists because the 2026-09-06 site UI/UX audit
// found that the only evidence for "does the site render properly" was a
// human clicking through a handful of pages — a 220-route site cannot be
// audited that way twice, and nothing in check / test / build looks at a
// rendered page at all.
//
// Shape: one JSON per route under <out>/routes/<slug>.json (written
// atomically, so a killed run resumes where it stopped), merged at the end
// into probes.json + summary.md. All classification lives in
// scripts/audit/_lib.mjs (unit-tested); this file only gathers raw facts in
// the page and calls those helpers. Output is deterministic — sorted
// arrays, rounded numbers, one run-level timestamp in meta, none per item.
//
// Not wired into build/postbuild/pr-checks on purpose: it takes ~10-15 min
// for the full site at concurrency 4. Run it from a workstation or a
// dedicated workflow after `npm run build`.
//
// Usage:
//   node scripts/audit/render-probe.mjs                # every route, all checks
//   node scripts/audit/render-probe.mjs --quick --limit 3 --out audit-output/render-smoke
//   node scripts/audit/render-probe.mjs --sample --themes light,dark
//   node scripts/audit/render-probe.mjs --help
//
// Serves dist/ itself with http-server (WITHOUT -s, so a miss is a real 404)
// unless --base is given. External hosts (Google Fonts, Cloudflare beacon)
// are blocked by default because this sandbox cannot reach them; the mode
// is recorded in meta.externalMode so nobody reads a fonts finding as real.
// Exit 0 = every selected route probed, 1 = a route errored after retries
// or the run could not start.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { collectHtmlFiles } from "../ci/check-links.mjs";
import {
  DEFAULT_TEMPLATE,
  analyseHeadings,
  classifyImage,
  classifyLink,
  classifyTapTarget,
  clsFromShifts,
  deriveRoutes,
  detectPlaywrightChromium,
  pickOverflowOffenders,
  renderRenderSummaryMd,
  resolveSampleRoutes,
  round,
  routeToSlug,
  stableSort,
  stableStringify,
  startStaticServer,
  sumBytesBefore,
  summariseProbes,
  templateForRoute,
} from "./_lib.mjs";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const SAMPLE_FILE = path.join(HERE, "routes.sample.json");

export const ALL_CHECKS = [
  "overflow",
  "headings",
  "images",
  "links",
  "tap",
  "focus",
  "console",
  "metrics",
  "fonts",
  "motion",
  "axe",
  "screens",
  "menu",
];
export const DEFAULT_VIEWPORTS = [360, 390, 768, 1024, 1280, 1440];
export const DEFAULT_AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const SCREEN_WIDTHS = [390, 1280];
const DARK_WIDTHS = [390, 1280];
const CAP = 25; // max entries kept per per-route list

const HELP = `render-probe — headless render audit of the built site (see header comment)

  --base <url>            serve target; default spawns http-server on --dist
  --dist <dir>            built site (default dist)
  --out <dir>             output root (default audit-output/render)
  --routes a,b            explicit routes    | --routes-file <path> (JSON array or lines)
  --sample                routes.sample.json | (default: every route in dist)
  --match <regex>         keep routes matching   --limit n   --shard i/n
  --viewports 360,390,768,1024,1280,1440
  --themes light,dark     --checks ${ALL_CHECKS.join(",")}
  --screens fold|full|none          --full-page-routes <list|@sample>
  --axe-dark contrast|full|none     --axe-tags ${DEFAULT_AXE_TAGS.join(",")}
  --external block|allow  (default block: cross-origin requests aborted)
  --concurrency 4 --nav-timeout 30000 --route-timeout 90000 --retries 2
  --force (re-probe existing) --clean (wipe --out first) --headed --chrome <path>
  --quick                 viewports 390,1280; theme light; no motion/menu/dark; fold screens
`;

// ---------------------------------------------------------------------------
// CLI parsing (exported so a test can pin the --quick semantics)
// ---------------------------------------------------------------------------

function list(v) {
  return v === undefined ? undefined : String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

function int(v, fallback) {
  if (v === undefined) return fallback;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`expected an integer, got ${v}`);
  return n;
}

export function parseCliOptions(argv) {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    options: {
      base: { type: "string" },
      dist: { type: "string", default: "dist" },
      out: { type: "string", default: "audit-output/render" },
      routes: { type: "string" },
      "routes-file": { type: "string" },
      sample: { type: "boolean", default: false },
      match: { type: "string" },
      limit: { type: "string" },
      shard: { type: "string" },
      viewports: { type: "string" },
      themes: { type: "string" },
      checks: { type: "string" },
      screens: { type: "string" },
      "full-page-routes": { type: "string" },
      "axe-dark": { type: "string" },
      "axe-tags": { type: "string" },
      external: { type: "string" },
      concurrency: { type: "string" },
      "nav-timeout": { type: "string" },
      "route-timeout": { type: "string" },
      retries: { type: "string" },
      force: { type: "boolean", default: false },
      clean: { type: "boolean", default: false },
      headed: { type: "boolean", default: false },
      chrome: { type: "string" },
      quick: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  const quick = values.quick;
  const opts = {
    help: values.help,
    base: values.base ?? null,
    dist: values.dist,
    out: values.out,
    routes: list(values.routes) ?? null,
    routesFile: values["routes-file"] ?? null,
    sample: values.sample,
    match: values.match ? new RegExp(values.match) : null,
    limit: values.limit === undefined ? null : int(values.limit),
    shard: null,
    viewports: (list(values.viewports) ?? (quick ? ["390", "1280"] : DEFAULT_VIEWPORTS.map(String)))
      .map((v) => int(v))
      .sort((a, b) => a - b),
    themes: list(values.themes) ?? (quick ? ["light"] : ["light", "dark"]),
    checks: list(values.checks) ?? (quick ? ALL_CHECKS.filter((c) => c !== "motion" && c !== "menu") : ALL_CHECKS),
    screens: values.screens ?? "fold",
    fullPageRoutes: values["full-page-routes"] ?? "@sample",
    axeDark: values["axe-dark"] ?? "contrast",
    axeTags: list(values["axe-tags"]) ?? DEFAULT_AXE_TAGS,
    external: values.external ?? "block",
    concurrency: int(values.concurrency, 4),
    navTimeout: int(values["nav-timeout"], 30000),
    routeTimeout: int(values["route-timeout"], 90000),
    retries: int(values.retries, 2),
    force: values.force,
    clean: values.clean,
    headed: values.headed,
    chrome: values.chrome ?? null,
    quick,
  };
  if (values.shard) {
    const m = /^(\d+)\/(\d+)$/.exec(values.shard);
    if (!m) throw new Error(`--shard expects i/n, got ${values.shard}`);
    opts.shard = { index: Number(m[1]), total: Number(m[2]) };
  }
  for (const c of opts.checks) {
    if (!ALL_CHECKS.includes(c)) throw new Error(`unknown check "${c}" (known: ${ALL_CHECKS.join(", ")})`);
  }
  if (!["fold", "full", "none"].includes(opts.screens)) throw new Error(`--screens must be fold|full|none`);
  if (!["contrast", "full", "none"].includes(opts.axeDark)) throw new Error(`--axe-dark must be contrast|full|none`);
  if (!["block", "allow"].includes(opts.external)) throw new Error(`--external must be block|allow`);
  return opts;
}

// ---------------------------------------------------------------------------
// Route selection
// ---------------------------------------------------------------------------

function readSample() {
  return JSON.parse(readFileSync(SAMPLE_FILE, "utf8"));
}

function readRoutesFile(file) {
  const body = readFileSync(file, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  }
  if (!Array.isArray(parsed)) throw new Error(`${file}: expected an array of routes`);
  return parsed.map((e) => (typeof e === "string" ? { route: e, template: null } : { route: e.route, template: e.template ?? null }));
}

/** @returns {{ selected: Array<{route, template}>, fullPage: Set<string>, sampleMissing: string[] }} */
export function selectRoutes(opts, distDir, log = () => {}) {
  const allRoutes = deriveRoutes(collectHtmlFiles(distDir));
  const sample = readSample();
  const resolved = resolveSampleRoutes(sample, allRoutes);
  let picked;
  if (opts.routes) picked = opts.routes.map((r) => ({ route: r, template: null }));
  else if (opts.routesFile) picked = readRoutesFile(opts.routesFile);
  else if (opts.sample) {
    picked = resolved.routes;
    for (const t of resolved.missing) log(`[render] sample template "${t}" has no built route — skipped`);
  } else picked = allRoutes.map((route) => ({ route, template: null }));

  const sampleTemplate = new Map(resolved.routes.map((r) => [r.route, r.template]));
  let selected = picked.map((e) => ({
    route: e.route,
    template: e.template ?? sampleTemplate.get(e.route) ?? templateForRoute(e.route) ?? DEFAULT_TEMPLATE,
  }));
  if (opts.match) selected = selected.filter((e) => opts.match.test(e.route));
  if (opts.shard) selected = selected.filter((_, i) => i % opts.shard.total === opts.shard.index - 1);
  if (opts.limit !== null) selected = selected.slice(0, opts.limit);

  let fullPage;
  if (opts.screens === "full") fullPage = new Set(selected.map((e) => e.route));
  else if (opts.fullPageRoutes === "@sample") fullPage = new Set(resolved.routes.map((r) => r.route));
  else fullPage = new Set(list(opts.fullPageRoutes) ?? []);
  return { selected, fullPage, sampleMissing: resolved.missing };
}

// ---------------------------------------------------------------------------
// In-page scripts (serialised by Playwright; must be self-contained)
// ---------------------------------------------------------------------------

function initScript({ theme }) {
  try {
    localStorage.setItem("dp-theme", theme);
  } catch {
    /* storage unavailable */
  }
  const dp = { lcp: [], shifts: [], theme };
  dp.sel = function sel(el) {
    if (!el || el.nodeType !== 1) return null;
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && depth < 5) {
      const tag = cur.tagName.toLowerCase();
      if (tag === "html" || tag === "body") {
        parts.unshift(tag);
        break;
      }
      if (cur.id) {
        parts.unshift(`${tag}#${cur.id}`);
        break;
      }
      let part = tag;
      const cls = Array.from(cur.classList)
        .filter((c) => !/^(astro-|is-|has-)/.test(c))
        .slice(0, 2);
      if (cls.length) part += `.${cls.join(".")}`;
      const parent = cur.parentElement;
      if (parent) {
        const sibs = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
        if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      cur = parent;
      depth += 1;
    }
    return parts.join(" > ");
  };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) dp.lcp.push({ startTime: e.startTime, size: e.size, element: e.element || null });
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* unsupported */
  }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) dp.shifts.push({ value: e.value, startTime: e.startTime, hadRecentInput: !!e.hadRecentInput });
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    /* unsupported */
  }
  window.__dp = dp;
}

async function scrollProbeInPage({ stepMs, maxSteps }) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const step = Math.max(200, window.innerHeight);
  const total = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  let y = 0;
  let steps = 0;
  while (y < total && steps < maxSteps) {
    y += step;
    window.scrollTo(0, y);
    await sleep(stepMs);
    steps += 1;
  }
  window.scrollTo(0, 0);
  await sleep(stepMs);
  return { scrollHeight: total, steps };
}

async function collectFactsInPage({ wantFonts }) {
  const sel = window.__dp.sel;
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return (r.width > 0 || r.height > 0) && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const out = { title: document.title };

  out.headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
    .filter(visible)
    .map((h) => ({ level: Number(h.tagName[1]), text: clean(h.textContent).slice(0, 80) }));

  out.images = Array.from(document.images).map((img) => {
    const cs = getComputedStyle(img);
    return {
      selector: sel(img),
      src: (img.currentSrc || img.getAttribute("src") || "").slice(0, 200),
      alt: img.hasAttribute("alt") ? img.getAttribute("alt") : null,
      hasWidth: img.hasAttribute("width"),
      hasHeight: img.hasAttribute("height"),
      hasAspectRatio: !!cs.aspectRatio && cs.aspectRatio !== "auto",
      naturalWidth: img.naturalWidth,
      complete: img.complete,
      loading: img.getAttribute("loading"),
      role: img.getAttribute("role"),
      isHidden: !visible(img) || img.getAttribute("aria-hidden") === "true" || !!img.closest('[aria-hidden="true"]'),
    };
  });

  out.links = Array.from(document.querySelectorAll("a[href]"))
    .filter(visible)
    .map((a) => {
      const labelledby = a.getAttribute("aria-labelledby");
      const href = a.getAttribute("href") || "";
      let external = false;
      try {
        const u = new URL(href, location.href);
        external = /^https?:$/.test(u.protocol) && u.origin !== location.origin;
      } catch {
        /* unparsable href */
      }
      return {
        selector: sel(a),
        href: href.slice(0, 200),
        external,
        text: a.textContent || "",
        ariaLabel: a.getAttribute("aria-label"),
        ariaLabelledbyText: labelledby
          ? labelledby.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || "").join(" ")
          : "",
        title: a.getAttribute("title"),
        imgAlts: Array.from(a.querySelectorAll("img,svg")).map((i) =>
          i.tagName.toLowerCase() === "svg"
            ? i.getAttribute("aria-label") || ((i.querySelector("title") || {}).textContent || "")
            : i.getAttribute("alt") || "",
        ),
      };
    });

  out.fonts = null;
  if (wantFonts) {
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]);
    } catch {
      /* ignore */
    }
    const loaded = [];
    document.fonts.forEach((f) => {
      if (f.status === "loaded") loaded.push(`${f.family.replace(/^"|"$/g, "")} ${f.weight} ${f.style}`);
    });
    out.fonts = { loaded: Array.from(new Set(loaded)).sort(), check: document.fonts.check('600 16px "DM Sans"') };
  }

  const nav = performance.getEntriesByType("navigation")[0];
  const lcpList = window.__dp.lcp;
  const last = lcpList[lcpList.length - 1];
  out.metrics = {
    lcpMs: last ? last.startTime : null,
    lcpElement: last && last.element ? sel(last.element) : null,
    shifts: window.__dp.shifts.slice(0, 500),
    domNodes: document.getElementsByTagName("*").length,
    resources: performance.getEntriesByType("resource").map((e) => ({ endMs: e.responseEnd, bytes: e.transferSize || 0 })),
    navBytes: nav ? nav.transferSize || 0 : 0,
    loadMs: nav ? nav.loadEventEnd : null,
    animationsRunning: document.getAnimations().filter((a) => a.playState === "running").length,
  };
  return out;
}

function overflowInPage() {
  const sel = window.__dp.sel;
  const innerWidth = window.innerWidth;
  const cands = [];
  const idx = new Map();
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > innerWidth + 1) {
      idx.set(el, cands.length);
      cands.push({ el, selector: sel(el), left: r.left, right: r.right, width: r.width });
      if (cands.length >= 300) break;
    }
  }
  const rects = cands.map((c) => {
    let p = c.el.parentElement;
    let parentIndex = -1;
    while (p) {
      if (idx.has(p)) {
        parentIndex = idx.get(p);
        break;
      }
      p = p.parentElement;
    }
    return { selector: c.selector, left: c.left, right: c.right, width: c.width, parentIndex };
  });
  return {
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    innerWidth,
    rects,
  };
}

function tapTargetsInPage() {
  const sel = window.__dp.sel;
  const SELECTOR = 'a,button,input,select,textarea,summary,[role="button"],[tabindex]:not([tabindex="-1"])';
  const out = [];
  for (const el of document.querySelectorAll(SELECTOR)) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || el.hidden || el.closest('[aria-hidden="true"]')) continue;
    if (el.type === "hidden") continue;
    // A checkbox or radio is typically 13x13, but the label that wraps it
    // (or points at it with `for`) is the thing a finger actually hits —
    // clicking anywhere in the label activates the control. Measuring the
    // input alone reported a 13px target where the real one was 316x28,
    // which is most of the 2026-09-06 audit's 13,038-target count (F-026).
    // Measure the label when there is one and it contains the input's box.
    let r = el.getBoundingClientRect();
    let hitVia = null;
    if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio")) {
      const label =
        el.closest("label") ||
        (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
      if (label) {
        const lr = label.getBoundingClientRect();
        const contains =
          lr.width > 0 && lr.height > 0 &&
          lr.left <= r.left + 1 && lr.right >= r.right - 1 &&
          lr.top <= r.top + 1 && lr.bottom >= r.bottom - 1;
        if (contains && (lr.width > r.width || lr.height > r.height)) {
          r = lr;
          hitVia = "label";
        }
      }
    }
    if (r.width === 0 || r.height === 0) continue;
    let inTextBlock = false;
    const parent = el.parentElement;
    if (parent) {
      for (const n of parent.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          inTextBlock = true;
          break;
        }
      }
    }
    out.push({
      selector: sel(el),
      w: Math.round(r.width),
      h: Math.round(r.height),
      hitVia,
      display: cs.display,
      inTextBlock,
      text: String(el.getAttribute("aria-label") || el.textContent || el.value || "").replace(/\s+/g, " ").trim().slice(0, 40),
    });
    if (out.length >= 400) break;
  }
  return out;
}

function resetFocusInPage() {
  window.scrollTo(0, 0);
  const b = document.body;
  b.setAttribute("tabindex", "-1");
  b.focus();
  b.removeAttribute("tabindex");
}

function activeElementInPage() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { atBody: true };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const ringOutline = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
  const ringShadow = cs.boxShadow !== "none";
  return {
    atBody: false,
    selector: window.__dp.sel(el),
    text: String(el.getAttribute("aria-label") || el.textContent || el.value || "").replace(/\s+/g, " ").trim().slice(0, 50),
    visibleRing: ringOutline || ringShadow,
    ringSource: ringOutline ? "outline" : ringShadow ? "box-shadow" : null,
    invisible: (r.width === 0 && r.height === 0) || cs.opacity === "0" || cs.visibility === "hidden",
    inViewport: r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth,
  };
}

function animationsInPage() {
  const sel = window.__dp.sel;
  return document
    .getAnimations()
    .filter((a) => a.playState === "running")
    .map((a) => ({
      animationName: a.animationName || (a.transitionProperty ? `transition:${a.transitionProperty}` : a.constructor.name),
      selector: sel(a.effect && a.effect.target),
    }));
}

async function axeInPage({ runOnly }) {
  /* global axe */
  const r = await axe.run(document, { runOnly, resultTypes: ["violations", "incomplete"] });
  const map = (v) => ({
    id: v.id,
    impact: v.impact || null,
    help: v.help,
    helpUrl: v.helpUrl,
    nodeCount: v.nodes.length,
    nodes: v.nodes.slice(0, 10).map((n) => ({
      target: n.target.map((t) => (Array.isArray(t) ? t.join(" >>> ") : String(t))).join(" "),
      failureSummary: String(n.failureSummary || "").slice(0, 300),
    })),
  });
  return { violations: r.violations.map(map), incomplete: r.incomplete.map(map), passes: r.passes.length };
}

// ---------------------------------------------------------------------------
// Per-route probe
// ---------------------------------------------------------------------------

function pushCapped(arr, item) {
  if (arr.length < CAP) arr.push(item);
}

function attachListeners(page, baseUrl, rec) {
  const rel = (u) => (u.startsWith(baseUrl) ? u.slice(baseUrl.length) || "/" : u);
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (/ERR_BLOCKED_BY_CLIENT/.test(text)) return;
    if (type === "error") pushCapped(rec.errors, { text: text.slice(0, 300) });
    else if (type === "warning") rec.warnings += 1;
  });
  page.on("pageerror", (err) => pushCapped(rec.pageErrors, { text: String(err && err.message ? err.message : err).slice(0, 300) }));
  page.on("requestfailed", (req) => {
    const err = (req.failure() || {}).errorText || "";
    if (/BLOCKED_BY_CLIENT|ERR_ABORTED/.test(err)) return;
    pushCapped(rec.failedRequests, { url: rel(req.url()).slice(0, 200), error: err });
  });
  page.on("response", (res) => {
    if (res.status() >= 400) pushCapped(rec.httpErrors, { url: rel(res.url()).slice(0, 200), status: res.status() });
  });
}

function finaliseConsole(rec) {
  const uniq = (arr, key) => {
    const seen = new Set();
    return stableSort(arr, key).filter((x) => {
      const k = JSON.stringify(x);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  return {
    errors: uniq(rec.errors, (e) => e.text),
    pageErrors: uniq(rec.pageErrors, (e) => e.text),
    failedRequests: uniq(rec.failedRequests, (e) => [e.url, e.error]),
    httpErrors: uniq(rec.httpErrors, (e) => [e.url, e.status]),
    externalBlocked: rec.externalBlocked,
    warnings: rec.warnings,
  };
}

async function newContext(browser, { theme, baseOrigin, external, rec }) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: theme,
    reducedMotion: "no-preference",
    serviceWorkers: "block",
  });
  await context.addInitScript(initScript, { theme });
  if (external === "block") {
    await context.route(
      (url) => /^https?:$/.test(url.protocol) && url.origin !== baseOrigin,
      (route) => {
        rec.externalBlocked += 1;
        route.abort("blockedbyclient").catch(() => {});
      },
    );
  }
  return context;
}

async function gotoRoute(page, url, navTimeout) {
  const response = await page.goto(url, { waitUntil: "load", timeout: navTimeout });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  return response ? response.status() : null;
}

async function setWidth(page, width) {
  await page.setViewportSize({ width, height: width <= 480 ? 844 : 900 });
  await page.waitForTimeout(200);
}

async function focusPass(page, presses) {
  await page.evaluate(resetFocusInPage);
  const stops = [];
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(activeElementInPage);
    if (info.atBody) break;
    stops.push({ index: i + 1, ...info, atBody: undefined });
  }
  const failures = stops.filter((s) => !s.visibleRing || s.invisible).map((s) => ({
    index: s.index,
    selector: s.selector,
    text: s.text,
    invisible: s.invisible,
    visibleRing: s.visibleRing,
  }));
  await page.evaluate(resetFocusInPage);
  return { stops, failures };
}

async function menuProbe(page) {
  const label = 'label[aria-controls="dp-nav-overlay"]';
  if (!(await page.$(label))) return null;
  const checked = () => page.evaluate(() => !!(document.getElementById("dp-nav-toggle") || {}).checked);
  const set = (v) => page.evaluate((val) => {
    const t = document.getElementById("dp-nav-toggle");
    if (t) t.checked = val;
  }, v);
  const tryKey = async (key) => {
    await set(false);
    try {
      await page.focus(label, { timeout: 2000 });
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
      return await checked();
    } catch {
      return false;
    }
  };
  const enterOpens = await tryKey("Enter");
  const spaceOpens = await tryKey("Space");
  await set(true);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const escapeCloses = !(await checked());
  await set(false);
  await page.evaluate(resetFocusInPage);
  return { enterOpens, spaceOpens, escapeCloses };
}

async function runAxe(page, runOnly) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const res = await page.evaluate(axeInPage, { runOnly });
  const byId = (arr) => stableSort(arr, (v) => v.id);
  return { violations: byId(res.violations), incomplete: byId(res.incomplete), passes: res.passes };
}

async function screenshot(page, file, fullPage) {
  mkdirSync(path.dirname(file), { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: file, fullPage, animations: "disabled", caret: "hide", timeout: 20000 });
}

/**
 * Probe one route. `contexts` collects every BrowserContext opened so the
 * caller can close them on timeout. Returns the schema-v1 route record.
 */
async function probeRoute(browser, item, slug, ctx, contexts) {
  const { opts, baseUrl, baseOrigin, outDir, fullPage } = ctx;
  const has = (c) => opts.checks.includes(c);
  const url = baseUrl + item.route;
  const rec = { errors: [], pageErrors: [], failedRequests: [], httpErrors: [], externalBlocked: 0, warnings: 0 };
  const record = {
    route: item.route,
    slug,
    template: item.template,
    title: null,
    status: "ok",
    error: null,
    httpStatus: null,
    viewports: {},
    screenshots: {},
  };
  const shot = (theme, w, kind) => path.join("screens", slug, `${theme}-${w}-${kind}.png`);
  const wantsShots = has("screens") && opts.screens !== "none";

  // ---- light context ------------------------------------------------------
  const light = await newContext(browser, { theme: "light", baseOrigin, external: opts.external, rec });
  contexts.push(light);
  const page = await light.newPage();
  attachListeners(page, baseUrl, rec);
  record.httpStatus = await gotoRoute(page, url, opts.navTimeout);
  await page.evaluate(scrollProbeInPage, { stepMs: 150, maxSteps: 40 });
  await page.waitForTimeout(300);

  const facts = await page.evaluate(collectFactsInPage, { wantFonts: has("fonts") });
  record.title = facts.title;

  if (has("headings")) {
    const levels = facts.headings.map((h) => h.level);
    record.headings = { ...analyseHeadings(levels), levels, texts: facts.headings.map((h) => h.text) };
  }
  if (has("images")) {
    const issues = [];
    for (const img of facts.images) {
      const codes = classifyImage(img);
      if (codes.length) issues.push({ selector: img.selector, src: img.src, codes, loading: img.loading });
    }
    record.images = { total: facts.images.length, hidden: facts.images.filter((i) => i.isHidden).length, issues };
  }
  if (has("links")) {
    const issues = [];
    for (const l of facts.links) {
      const c = classifyLink(l);
      if (c) issues.push({ selector: l.selector, href: l.href, code: c.code, text: c.text ?? null });
    }
    record.links = { total: facts.links.length, external: facts.links.filter((l) => l.external).length, issues };
  }
  if (has("fonts")) {
    const loaded = facts.fonts ? facts.fonts.loaded : [];
    const dmSans600 = loaded.some((f) => /^DM Sans (600|[0-5]\d\d [6-9]\d\d|[0-5]\d\d 9\d\d)/.test(f) || /^DM Sans 600/.test(f));
    record.fonts = {
      mode: opts.external === "block" ? "external-blocked" : "external-allowed",
      loaded,
      dmSans600Available: dmSans600 || (opts.external === "allow" && !!facts.fonts?.check),
      checkResult: facts.fonts ? facts.fonts.check : null,
    };
  }
  if (has("metrics")) {
    const m = facts.metrics;
    const transferred = m.navBytes + m.resources.reduce((n, r) => n + r.bytes, 0);
    record.metrics = {
      lcpMs: round(m.lcpMs, 0),
      lcpElement: m.lcpElement,
      cls: clsFromShifts(m.shifts),
      domNodes: m.domNodes,
      requests: m.resources.length + 1,
      transferredBytes: transferred,
      aboveFoldBytes: m.lcpMs === null ? null : m.navBytes + sumBytesBefore(m.resources, m.lcpMs),
      loadMs: round(m.loadMs, 0),
    };
  }

  // ---- viewport loop (no reload) ---------------------------------------
  for (const w of opts.viewports) {
    await setWidth(page, w);
    const v = {};
    if (has("overflow")) {
      const o = await page.evaluate(overflowInPage);
      v.overflow = {
        scrollWidth: o.scrollWidth,
        innerWidth: o.innerWidth,
        overflow: o.scrollWidth > o.innerWidth,
        offenders: pickOverflowOffenders(o.rects, o.innerWidth),
      };
    }
    if (has("tap") && w <= 480) {
      const targets = await page.evaluate(tapTargetsInPage);
      const classified = targets.map((t) => ({ ...t, code: classifyTapTarget(t) }));
      const failing = classified.filter((t) => t.code === "small" || t.code === "below-44");
      v.tapTargets = {
        checked: classified.length,
        ok: classified.filter((t) => t.code === "ok").length,
        exempt: classified.filter((t) => t.code === "exempt-inline").length,
        below44: failing.length,
        small: stableSort(failing, (t) => [Math.min(t.w, t.h), t.selector])
          .slice(0, CAP)
          .map((t) => ({ selector: t.selector, w: t.w, h: t.h, text: t.text, code: t.code })),
      };
    }
    if (wantsShots && SCREEN_WIDTHS.includes(w)) {
      const relFold = shot("light", w, "fold");
      await screenshot(page, path.join(outDir, relFold), false);
      record.screenshots[`light-${w}-fold`] = relFold;
      if (fullPage.has(item.route)) {
        const relFull = shot("light", w, "full");
        await screenshot(page, path.join(outDir, relFull), true);
        record.screenshots[`light-${w}-full`] = relFull;
      }
    }
    record.viewports[String(w)] = v;
  }

  // ---- focus + menu ----------------------------------------------------------
  if (has("focus")) {
    await setWidth(page, 1280);
    const desktop = await focusPass(page, 15);
    await setWidth(page, 390);
    const mobile = await focusPass(page, 10);
    record.focus = { desktop, mobile };
  }
  if (has("menu")) {
    await setWidth(page, 390);
    record.menu = await menuProbe(page);
  }

  // ---- axe (light) -----------------------------------------------------
  if (has("axe")) {
    await setWidth(page, 1280);
    record.axe = { light: await runAxe(page, { type: "tag", values: opts.axeTags }) };
  }

  // ---- motion --------------------------------------------------------------
  if (has("motion")) {
    await setWidth(page, 1280);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "load", timeout: opts.navTimeout });
    await page.waitForTimeout(500);
    const reduced = await page.evaluate(animationsInPage);
    const uniq = new Map(reduced.map((a) => [`${a.animationName}|${a.selector}`, a]));
    record.motion = {
      animationsNoPreference: facts.metrics.animationsRunning,
      animationsReduced: reduced.length,
      reducedOffenders: stableSort([...uniq.values()], (a) => [a.animationName, a.selector]).slice(0, CAP),
    };
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  if (has("console")) record.console = finaliseConsole(rec);
  await light.close();
  contexts.splice(contexts.indexOf(light), 1);

  // ---- dark context ----------------------------------------------------
  if (opts.themes.includes("dark")) {
    const darkRec = { errors: [], pageErrors: [], failedRequests: [], httpErrors: [], externalBlocked: 0, warnings: 0 };
    const dark = await newContext(browser, { theme: "dark", baseOrigin, external: opts.external, rec: darkRec });
    contexts.push(dark);
    const dpage = await dark.newPage();
    await gotoRoute(dpage, url, opts.navTimeout);
    await dpage.waitForTimeout(300);
    for (const w of DARK_WIDTHS) {
      await setWidth(dpage, w);
      if (has("overflow")) {
        const o = await dpage.evaluate(overflowInPage);
        (record.viewports[String(w)] ??= {}).overflowDark = {
          scrollWidth: o.scrollWidth,
          innerWidth: o.innerWidth,
          overflow: o.scrollWidth > o.innerWidth,
          offenders: pickOverflowOffenders(o.rects, o.innerWidth),
        };
      }
      if (wantsShots) {
        const relFold = shot("dark", w, "fold");
        await screenshot(dpage, path.join(outDir, relFold), false);
        record.screenshots[`dark-${w}-fold`] = relFold;
        if (fullPage.has(item.route)) {
          const relFull = shot("dark", w, "full");
          await screenshot(dpage, path.join(outDir, relFull), true);
          record.screenshots[`dark-${w}-full`] = relFull;
        }
      }
    }
    if (has("axe") && opts.axeDark !== "none") {
      await setWidth(dpage, 1280);
      const runOnly =
        opts.axeDark === "full" ? { type: "tag", values: opts.axeTags } : { type: "rule", values: ["color-contrast"] };
      const res = await runAxe(dpage, runOnly);
      record.axe = { ...(record.axe ?? {}), dark: { mode: opts.axeDark, violations: res.violations, incomplete: res.incomplete } };
    }
    await dark.close();
    contexts.splice(contexts.indexOf(dark), 1);
  }
  return record;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function makeBrowserSupplier(launchOpts, log) {
  let browser = null;
  let launching = null;
  return {
    async get() {
      if (browser && browser.isConnected()) return browser;
      if (!launching) {
        if (browser) log("[render] browser disconnected — relaunching");
        launching = chromium.launch(launchOpts).then(
          (b) => {
            browser = b;
            launching = null;
            b.on("disconnected", () => {
              if (browser === b) browser = null;
            });
            return b;
          },
          (e) => {
            launching = null;
            throw e;
          },
        );
      }
      return launching;
    },
    version() {
      return browser && browser.isConnected() ? browser.version() : null;
    },
    async close() {
      if (browser) await browser.close().catch(() => {});
      browser = null;
    },
  };
}

function writeAtomic(file, body) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, body);
  renameSync(tmp, file);
}

async function probeWithRetries(item, slug, ctx) {
  const maxAttempts = ctx.opts.retries + 1;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const contexts = [];
    try {
      const browser = await ctx.browsers.get();
      const result = await withTimeout(
        probeRoute(browser, item, slug, ctx, contexts),
        ctx.opts.routeTimeout,
        `route timed out after ${ctx.opts.routeTimeout} ms`,
      );
      return { ...result, attempts: attempt };
    } catch (err) {
      lastError = err;
      ctx.log(`[render] ${item.route} attempt ${attempt}/${maxAttempts} failed: ${String(err && err.message ? err.message : err).split("\n")[0]}`);
    } finally {
      for (const c of contexts) await c.close().catch(() => {});
    }
  }
  return {
    route: item.route,
    slug,
    template: item.template,
    status: "error",
    error: String(lastError && lastError.message ? lastError.message : lastError).split("\n")[0].slice(0, 300),
    attempts: maxAttempts,
  };
}

async function worker(queue, ctx) {
  for (;;) {
    const item = queue.shift();
    if (!item) return;
    const slug = routeToSlug(item.route);
    const file = path.join(ctx.routesDir, `${slug}.json`);
    if (!ctx.opts.force && existsSync(file)) {
      try {
        const prev = JSON.parse(readFileSync(file, "utf8"));
        if (prev.status === "ok") {
          ctx.progress.skipped += 1;
          ctx.log(`[render] skip ${item.route} (exists; --force to redo)`);
          continue;
        }
      } catch {
        /* unreadable → redo */
      }
    }
    const t0 = Date.now();
    const record = await probeWithRetries(item, slug, ctx);
    writeAtomic(file, `${stableStringify(record)}\n`);
    ctx.progress.done += 1;
    if (record.status !== "ok") ctx.progress.errored += 1;
    ctx.log(
      `[render] ${ctx.progress.done + ctx.progress.skipped}/${ctx.progress.total} ${item.route} ${record.status}` +
        ` (${((Date.now() - t0) / 1000).toFixed(1)} s)`,
    );
  }
}

function gitShort() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function mergeRouteFiles(routesDir) {
  const out = [];
  for (const name of readdirSync(routesDir)) {
    if (!name.endsWith(".json")) continue;
    try {
      out.push(JSON.parse(readFileSync(path.join(routesDir, name), "utf8")));
    } catch {
      /* skip corrupt file */
    }
  }
  return stableSort(out, (r) => r.route);
}

export async function main(argv, log = (s) => console.error(s)) {
  const opts = parseCliOptions(argv);
  if (opts.help) {
    console.log(HELP);
    return 0;
  }
  const distDir = path.resolve(REPO_ROOT, opts.dist);
  if (!existsSync(distDir)) {
    log(`[render] dist not found at ${distDir} — run npm run build first`);
    return 1;
  }
  const outDir = path.resolve(REPO_ROOT, opts.out);
  if (opts.clean) rmSync(outDir, { recursive: true, force: true });
  const routesDir = path.join(outDir, "routes");
  mkdirSync(routesDir, { recursive: true });

  const started = Date.now();
  const { selected, fullPage } = selectRoutes(opts, distDir, log);
  if (!selected.length) {
    log("[render] no routes selected");
    return 1;
  }

  let server = null;
  let baseUrl = opts.base;
  if (!baseUrl) {
    server = await startStaticServer({ distDir });
    baseUrl = server.baseUrl;
    log(`[render] serving ${path.relative(REPO_ROOT, distDir)} at ${baseUrl}`);
  }
  baseUrl = baseUrl.replace(/\/$/, "");
  const baseOrigin = new URL(baseUrl).origin;

  const executablePath = opts.chrome ?? detectPlaywrightChromium() ?? undefined;
  const browsers = makeBrowserSupplier(
    { executablePath, headless: !opts.headed, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
    log,
  );

  const ctx = {
    opts,
    baseUrl,
    baseOrigin,
    outDir,
    routesDir,
    fullPage,
    browsers,
    log,
    progress: { total: selected.length, done: 0, skipped: 0, errored: 0 },
  };

  let chromiumVersion = null;
  const onSignal = async () => {
    log("[render] interrupted — closing browser");
    await browsers.close();
    if (server) server.close();
    process.exit(130);
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  try {
    await browsers.get();
    chromiumVersion = browsers.version();
    log(`[render] ${selected.length} route(s), viewports ${opts.viewports.join("/")}, themes ${opts.themes.join("/")}, checks ${opts.checks.join(",")}`);
    const queue = [...selected];
    await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.concurrency, queue.length)) }, () => worker(queue, ctx)));
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
    await browsers.close();
    if (server) server.close();
  }

  const routes = mergeRouteFiles(routesDir);
  const meta = {
    generatedAt: new Date().toISOString(),
    commit: gitShort(),
    baseUrl,
    distDir: path.relative(REPO_ROOT, distDir) || ".",
    playwrightVersion: require("playwright/package.json").version,
    chromiumVersion,
    axeVersion: require("axe-core/package.json").version,
    externalMode: opts.external,
    viewports: opts.viewports,
    themes: opts.themes,
    checks: opts.checks,
    screens: opts.screens,
    axeDark: opts.axeDark,
    axeTags: opts.axeTags,
    routesTotal: routes.length,
    routesDone: routes.filter((r) => r.status === "ok").length,
    routesErrored: routes.filter((r) => r.status !== "ok").length,
    selectedThisRun: selected.length,
    skippedExisting: ctx.progress.skipped,
    durationMs: Date.now() - started,
  };
  const summary = summariseProbes(routes);
  writeFileSync(path.join(outDir, "probes.json"), `${stableStringify({ schemaVersion: 1, meta, routes })}\n`);
  writeFileSync(path.join(outDir, "summary.md"), renderRenderSummaryMd(summary, meta));

  const t = summary.totals;
  const worst = summary.byRoute
    .slice()
    .sort((a, b) => b.findingCount - a.findingCount || (a.route < b.route ? -1 : 1))
    .slice(0, 3)
    .map((r) => `${r.route} (${r.findingCount})`)
    .join(", ");
  const rel = (p) => path.relative(process.cwd(), p);
  const lines = [
    `[render] ${ctx.progress.done} probed, ${ctx.progress.skipped} skipped, ${ctx.progress.errored} errored in ${(meta.durationMs / 1000).toFixed(1)} s — ${meta.routesTotal} route file(s) merged`,
    `[render] external=${opts.external} chromium=${chromiumVersion} axe=${meta.axeVersion}`,
    `[render] overflow routes ${t.overflowRoutes} | axe routes ${t.axeViolationRoutes} (${t.axeViolationNodes} nodes) | dark-contrast routes ${t.darkContrastRoutes}`,
    `[render] images ${t.imageIssues} | links ${t.linkIssues} | focus ${t.focusFailures} | tap ${t.tapTargetIssues} | headings ${t.headingIssues}`,
    `[render] console errors ${t.consoleErrors} | page errors ${t.pageErrors} | failed requests ${t.failedRequests} | http>=400 ${t.httpErrors}`,
    `[render] motion offenders ${t.motionOffenders} | menu failures ${t.menuFailures}`,
    `[render] worst: ${worst || "–"}`,
    `[render] summary  ${rel(path.join(outDir, "summary.md"))}`,
    `[render] probes   ${rel(path.join(outDir, "probes.json"))}`,
    `[render] screens  ${rel(path.join(outDir, "screens"))}/<slug>/<theme>-<width>-<fold|full>.png`,
  ];
  for (const l of lines) console.log(l);
  return ctx.progress.errored > 0 ? 1 : 0;
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`[render] fatal: ${err && err.stack ? err.stack : err}`);
      process.exit(1);
    },
  );
}
