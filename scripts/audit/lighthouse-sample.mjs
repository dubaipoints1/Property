// Lighthouse sample — runs Lighthouse (performance / accessibility /
// best-practices / SEO) against one representative route per template and
// writes a scores table plus a budget verdict. Exists because the
// 2026-09-06 site UI/UX audit had no performance numbers at all: every
// speed claim was anecdotal, and the render probe measures LCP/CLS with no
// throttling, which flatters a static site. Lighthouse's simulated mobile
// throttling is the pessimistic figure the Council should argue from.
//
// Design notes:
//   - one Chrome per run, routes sequential — Lighthouse owns the browser
//     and parallel runs skew each other's CPU throttling;
//   - needs the full Chromium binary with --headless=new (the Playwright
//     headless shell has no DevTools performance domain); found via
//     detectPlaywrightChromium() unless --chrome is given;
//   - serves dist/ itself with http-server (no gzip/brotli, no CDN), so
//     byte figures are PESSIMISTIC relative to Cloudflare Pages — the
//     budget is a floor to argue from, not a production measurement;
//   - the pure helpers (lhrToRow, evaluateBudget, pickMedianRun,
//     renderScoresTableMd) live in scripts/audit/_lib.mjs and are tested in
//     tests/audit/lighthouse-lib.test.ts.
//
// Usage:
//   node scripts/audit/lighthouse-sample.mjs                         # sample, mobile+desktop
//   node scripts/audit/lighthouse-sample.mjs --routes / --presets mobile --runs 1 --out audit-output/lh-smoke
//   node scripts/audit/lighthouse-sample.mjs --assert --budget-mobile-perf 95 --budget-above-fold-kb 200
//
// Exit 1 only with --assert and at least one budget breach (or a fatal
// start-up error); a route that fails to audit is recorded as a row with
// an error and nulls, never swallowed.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import lighthouse from "lighthouse";
import * as chromeLauncherModule from "chrome-launcher";
import { collectHtmlFiles } from "../ci/check-links.mjs";
import {
  DEFAULT_TEMPLATE,
  deriveRoutes,
  detectPlaywrightChromium,
  evaluateBudget,
  lhrToRow,
  pickMedianRun,
  renderScoresTableMd,
  resolveSampleRoutes,
  routeToSlug,
  stableSort,
  stableStringify,
  startStaticServer,
  templateForRoute,
} from "./_lib.mjs";

const chromeLauncher = chromeLauncherModule.launch ? chromeLauncherModule : chromeLauncherModule.default;
const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const CHROME_FLAGS = ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"];

const HELP = `lighthouse-sample — Lighthouse over one route per template (see header comment)

  --base <url>              serve target; default spawns http-server on --dist
  --dist <dir>              built site (default dist)
  --out <dir>               output root (default audit-output/lighthouse)
  --sample-file <path>      default scripts/audit/routes.sample.json
  --routes a,b              explicit routes instead of the sample
  --presets mobile,desktop  (default both)
  --runs n                  runs per route/preset; median by performance kept (default 1)
  --html                    also write the HTML report per route/preset
  --assert                  exit 1 on any budget breach
  --budget-mobile-perf 95   --budget-above-fold-kb 200
  --chrome <path>           full Chrome/Chromium binary (default: Playwright's)
`;

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
      out: { type: "string", default: "audit-output/lighthouse" },
      "sample-file": { type: "string", default: path.join(HERE, "routes.sample.json") },
      routes: { type: "string" },
      presets: { type: "string", default: "mobile,desktop" },
      runs: { type: "string", default: "1" },
      html: { type: "boolean", default: false },
      assert: { type: "boolean", default: false },
      "budget-mobile-perf": { type: "string", default: "95" },
      "budget-above-fold-kb": { type: "string", default: "200" },
      chrome: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });
  const presets = list(values.presets);
  for (const p of presets) if (!["mobile", "desktop"].includes(p)) throw new Error(`unknown preset "${p}"`);
  return {
    help: values.help,
    base: values.base ?? null,
    dist: values.dist,
    out: values.out,
    sampleFile: values["sample-file"],
    routes: list(values.routes) ?? null,
    presets,
    runs: Math.max(1, int(values.runs, 1)),
    html: values.html,
    assert: values.assert,
    budget: { mobilePerf: int(values["budget-mobile-perf"], 95), aboveFoldKb: int(values["budget-above-fold-kb"], 200) },
    chrome: values.chrome ?? null,
  };
}

async function loadDesktopConfig() {
  try {
    const m = await import("lighthouse/core/config/desktop-config.js");
    return m.default ?? m;
  } catch {
    return { extends: "lighthouse:default", settings: { formFactor: "desktop", screenEmulation: { disabled: true } } };
  }
}

function gitShort() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function chromeVersionOf(lhr) {
  const m = /Chrome\/([\d.]+)/.exec(lhr?.environment?.hostUserAgent ?? "");
  return m ? m[1] : null;
}

export async function main(argv, log = (s) => console.error(s)) {
  const opts = parseCliOptions(argv);
  if (opts.help) {
    console.log(HELP);
    return 0;
  }
  const distDir = path.resolve(REPO_ROOT, opts.dist);
  if (!existsSync(distDir)) {
    log(`[lighthouse] dist not found at ${distDir} — run npm run build first`);
    return 1;
  }
  const outDir = path.resolve(REPO_ROOT, opts.out);
  mkdirSync(outDir, { recursive: true });
  const started = Date.now();

  let routes;
  if (opts.routes) {
    routes = opts.routes.map((route) => ({ route, template: templateForRoute(route) ?? DEFAULT_TEMPLATE }));
  } else {
    const sample = JSON.parse(readFileSync(path.resolve(REPO_ROOT, opts.sampleFile), "utf8"));
    const resolved = resolveSampleRoutes(sample, deriveRoutes(collectHtmlFiles(distDir)));
    for (const t of resolved.missing) log(`[lighthouse] sample template "${t}" has no built route — skipped`);
    routes = resolved.routes;
  }
  if (!routes.length) {
    log("[lighthouse] no routes selected");
    return 1;
  }

  let server = null;
  let baseUrl = opts.base;
  if (!baseUrl) {
    server = await startStaticServer({ distDir });
    baseUrl = server.baseUrl;
    log(`[lighthouse] serving ${path.relative(REPO_ROOT, distDir)} at ${baseUrl} (uncompressed — figures are pessimistic)`);
  }
  baseUrl = baseUrl.replace(/\/$/, "");

  const chromePath = opts.chrome ?? detectPlaywrightChromium() ?? undefined;
  const desktopConfig = opts.presets.includes("desktop") ? await loadDesktopConfig() : null;
  const results = new Map(); // `${route}|${preset}` → [{lhr, html} | {error}]
  const key = (r, p) => `${r}|${p}`;

  try {
    for (let run = 1; run <= opts.runs; run += 1) {
      const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: CHROME_FLAGS });
      log(`[lighthouse] run ${run}/${opts.runs}: chrome pid ${chrome.pid} on port ${chrome.port}`);
      try {
        for (const { route } of routes) {
          for (const preset of opts.presets) {
            const url = baseUrl + route;
            const t0 = Date.now();
            try {
              const rr = await lighthouse(
                url,
                { port: chrome.port, output: opts.html ? ["json", "html"] : ["json"], logLevel: "error", onlyCategories: CATEGORIES },
                preset === "desktop" ? desktopConfig : undefined,
              );
              const reports = Array.isArray(rr.report) ? rr.report : [rr.report];
              (results.get(key(route, preset)) ?? results.set(key(route, preset), []).get(key(route, preset))).push({
                lhr: rr.lhr,
                html: opts.html ? reports[1] ?? null : null,
              });
              const perf = rr.lhr?.categories?.performance?.score;
              log(`[lighthouse] ${route} ${preset} perf=${perf === null || perf === undefined ? "–" : Math.round(perf * 100)} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
            } catch (err) {
              const msg = String(err && err.message ? err.message : err).split("\n")[0].slice(0, 300);
              (results.get(key(route, preset)) ?? results.set(key(route, preset), []).get(key(route, preset))).push({ error: msg });
              log(`[lighthouse] ${route} ${preset} FAILED: ${msg}`);
            }
          }
        }
      } finally {
        await chrome.kill();
      }
    }
  } finally {
    if (server) server.close();
  }

  const rows = [];
  let chromeVersion = null;
  let lighthouseVersion = require("lighthouse/package.json").version;
  for (const { route, template } of routes) {
    for (const preset of opts.presets) {
      const slug = routeToSlug(route);
      const attempts = results.get(key(route, preset)) ?? [];
      const good = attempts.filter((a) => a.lhr);
      if (!good.length) {
        rows.push({
          route,
          preset,
          template,
          performance: null,
          accessibility: null,
          bestPractices: null,
          seo: null,
          lcpMs: null,
          cls: null,
          tbtMs: null,
          aboveFoldKb: null,
          requests: null,
          totalKb: null,
          error: attempts[0]?.error ?? "no result",
        });
        continue;
      }
      const median = pickMedianRun(good.map((g) => g.lhr));
      const chosen = good.find((g) => g.lhr === median) ?? good[0];
      writeFileSync(path.join(outDir, `${slug}.${preset}.json`), JSON.stringify(chosen.lhr, null, 2));
      if (opts.html && chosen.html) writeFileSync(path.join(outDir, `${slug}.${preset}.html`), chosen.html);
      if (opts.runs > 1) {
        good.forEach((g, i) => writeFileSync(path.join(outDir, `${slug}.${preset}.run${i + 1}.json`), JSON.stringify(g.lhr, null, 2)));
      }
      chromeVersion ??= chromeVersionOf(chosen.lhr);
      lighthouseVersion = chosen.lhr.lighthouseVersion ?? lighthouseVersion;
      rows.push({ ...lhrToRow(chosen.lhr, preset), route, template, runs: good.length });
    }
  }
  const sortedRows = stableSort(rows, (r) => [r.route, r.preset]);
  const budget = evaluateBudget(sortedRows, opts.budget);
  const meta = {
    generatedAt: new Date().toISOString(),
    commit: gitShort(),
    baseUrl,
    distDir: path.relative(REPO_ROOT, distDir) || ".",
    lighthouseVersion,
    chromeVersion,
    chromePath: chromePath ?? null,
    presets: opts.presets,
    runs: opts.runs,
    routesTotal: routes.length,
    budget: opts.budget,
    server: opts.base ? `external (${opts.base})` : "http-server (uncompressed)",
    note: "Local http-server serves uncompressed bytes with no CDN cache; byte/LCP figures are pessimistic relative to Cloudflare Pages.",
    durationMs: Date.now() - started,
  };
  writeFileSync(path.join(outDir, "lighthouse.scores.json"), `${stableStringify({ schemaVersion: 1, meta, rows: sortedRows, budget })}\n`);
  writeFileSync(path.join(outDir, "scores.md"), renderScoresTableMd(sortedRows, budget, meta));

  const rel = (p) => path.relative(process.cwd(), p);
  console.log(`[lighthouse] ${sortedRows.length} row(s) in ${(meta.durationMs / 1000).toFixed(1)} s → ${rel(path.join(outDir, "scores.md"))}`);
  for (const r of sortedRows) {
    console.log(
      `[lighthouse] ${r.route} ${r.preset}: perf ${r.performance ?? "–"} a11y ${r.accessibility ?? "–"} bp ${r.bestPractices ?? "–"} seo ${r.seo ?? "–"}` +
        ` lcp ${r.lcpMs ?? "–"}ms cls ${r.cls ?? "–"} above-fold ${r.aboveFoldKb ?? "–"}KB` +
        (r.error ? ` error: ${r.error}` : ""),
    );
  }
  console.log(`[lighthouse] budget ${budget.ok ? "OK" : `${budget.breaches.length} breach(es)`} (mobile perf >= ${opts.budget.mobilePerf}, above-fold <= ${opts.budget.aboveFoldKb} KB)`);
  return opts.assert && !budget.ok ? 1 : 0;
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`[lighthouse] fatal: ${err && err.stack ? err.stack : err}`);
      process.exit(1);
    },
  );
}
