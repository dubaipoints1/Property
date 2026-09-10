// Static-config sweep — validates the three files that shape how Cloudflare
// Pages serves the built site but that no test looks at: public/_redirects
// (does every source still map to a page? do rules shadow real pages?),
// public/_headers (does it exist at all — it did not on 2026-09-06 — and
// does it carry the recommended baseline?), and the generated sitemap
// (does it agree with what dist/ actually contains?). Found during the
// 2026-09-06 site UI/UX audit.
//
// This script only READS. The recommended `_headers` block below is printed
// as a recommendation in the report; adding it to public/ changes production
// response headers and is a T3 change for the Chairman, not for a script.
//
// Usage: node scripts/audit/check-headers-redirects.mjs [--dist dist] [--out audit-output/static-config] [--strict]

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { collectHtmlFiles, hrefResolves } from "../ci/check-links.mjs";

export const RECOMMENDED_HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; form-action 'self' https://buttondown.com; frame-ancestors 'none'; base-uri 'self'
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`;

const RECOMMENDED_NAMES = ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options", "Strict-Transport-Security", "Content-Security-Policy-Report-Only"];
const KNOWN_HEADERS = new Set([...RECOMMENDED_NAMES, "Content-Security-Policy", "Cache-Control", "Access-Control-Allow-Origin", "X-Robots-Tag", "Link", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy", "Cross-Origin-Embedder-Policy", "Report-To", "Reporting-Endpoints", "Vary", "Content-Type"].map((h) => h.toLowerCase()));

/** Parse a Cloudflare Pages `_redirects` body into rules. */
export function parseRedirectRules(body) {
  const rules = [];
  body.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const parts = t.split(/\s+/);
    const status = parts[2] ? Number(parts[2].replace("!", "")) : 302;
    rules.push({ line: i + 1, source: parts[0], target: parts[1] ?? "", status, splat: parts[0].includes("*") || parts[0].includes(":") });
  });
  return rules;
}

/**
 * @returns {Array<{line:number, source:string, code:string, detail:string}>}
 * codes: target-missing | target-external | chain | loop | shadows-page | bad-status | over-limit
 */
export function validateRedirects(rules, distDir, { maxRules = 2000 } = {}) {
  const problems = [];
  const sources = new Map(rules.map((r) => [r.source, r]));
  if (rules.length > maxRules) problems.push({ line: 0, source: "*", code: "over-limit", detail: `${rules.length} rules > ${maxRules}` });
  for (const r of rules) {
    if (![200, 301, 302, 303, 307, 308, 404, 410].includes(r.status)) problems.push({ line: r.line, source: r.source, code: "bad-status", detail: String(r.status) });
    if (r.splat) continue;
    if (/^https?:\/\//.test(r.target)) { problems.push({ line: r.line, source: r.source, code: "target-external", detail: r.target }); continue; }
    if (r.target === r.source) problems.push({ line: r.line, source: r.source, code: "loop", detail: r.target });
    else if (sources.has(r.target) || sources.has(r.target.replace(/\/$/, ""))) problems.push({ line: r.line, source: r.source, code: "chain", detail: `→ ${r.target} is itself a source` });
    else if (r.target.startsWith("/") && !hrefResolves(distDir, r.target.split("?")[0])) problems.push({ line: r.line, source: r.source, code: "target-missing", detail: r.target });
    if (hrefResolves(distDir, r.source)) problems.push({ line: r.line, source: r.source, code: "shadows-page", detail: "a built page exists at the source path; Pages evaluates _redirects first" });
  }
  return problems;
}

/** Parse a Cloudflare Pages `_headers` body into [{path, headers:[{name,value}]}]. */
export function parseHeadersFile(body) {
  const blocks = [];
  let current = null;
  for (const raw of body.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) { current = { path: raw.trim(), headers: [] }; blocks.push(current); continue; }
    if (!current) continue;
    const idx = raw.indexOf(":");
    if (idx < 0) continue;
    current.headers.push({ name: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() });
  }
  return blocks;
}

/** @returns {{unknownHeaders: string[], duplicatePaths: string[], missingRecommended: string[]}} */
export function lintHeaders(blocks) {
  const seen = new Map();
  const unknown = new Set();
  const present = new Set();
  for (const b of blocks) {
    seen.set(b.path, (seen.get(b.path) || 0) + 1);
    for (const h of b.headers) {
      if (!KNOWN_HEADERS.has(h.name.toLowerCase())) unknown.add(h.name);
      if (b.path === "/*") present.add(h.name.toLowerCase());
    }
  }
  return {
    unknownHeaders: [...unknown].sort(),
    duplicatePaths: [...seen].filter(([, n]) => n > 1).map(([p]) => p).sort(),
    missingRecommended: RECOMMENDED_NAMES.filter((n) => !present.has(n.toLowerCase())),
  };
}

/** `<loc>` values of a sitemap, reduced to root-relative routes. */
export function extractSitemapLocs(xml) {
  const out = [];
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const u = m[1];
    try { const p = new URL(u).pathname; out.push(p); } catch { out.push(u); }
  }
  return out;
}

/** Routes present in dist (directory routes as "/x/", bare html as "/x.html"). */
export function distRoutes(distDir) {
  return collectHtmlFiles(distDir).map((f) => {
    const p = "/" + f.split(path.sep).join("/");
    return p.endsWith("/index.html") ? p.slice(0, -"index.html".length) : p;
  }).sort();
}

export function diffSitemap(distRoutesList, sitemapRoutes, excludeRegexes = [/^\/404\.html$/, /design-spike/, /style-guide/, /\/dev\//]) {
  const norm = (r) => (r.endsWith("/") || /\.\w+$/.test(r) ? r : r + "/");
  const excluded = (r) => excludeRegexes.some((re) => re.test(r));
  const built = new Set(distRoutesList.map(norm).filter((r) => !excluded(r)));
  const listed = new Set(sitemapRoutes.map(norm));
  return {
    inSitemapNotBuilt: [...listed].filter((r) => !built.has(r)).sort(),
    builtNotInSitemap: [...built].filter((r) => !listed.has(r)).sort(),
  };
}

export function buildStaticConfigReport({ redirects, headers, sitemap, robots }) {
  return { schemaVersion: 1, redirects, headers, sitemap, robots };
}

export function renderStaticConfigMd(report) {
  const L = [];
  L.push("# Static config sweep", "", "Generated by `scripts/audit/check-headers-redirects.mjs` (2026-09-06 site UI/UX audit). Read-only.", "");
  L.push("## _redirects", "", `Rules: ${report.redirects.rules.length}. Problems: ${report.redirects.problems.length}.`, "");
  for (const p of report.redirects.problems) L.push(`- line ${p.line} \`${p.source}\`: **${p.code}** — ${p.detail}`);
  L.push("", "## _headers", "");
  if (!report.headers.present) {
    L.push("`public/_headers` is **absent** — the site ships with Cloudflare Pages defaults only (no CSP, no nosniff, no Referrer-Policy, no HSTS directive from the app).", "", "Recommended starter (report-only CSP; adding it is a T3 production change for the Chairman, not for this script):", "", "```", RECOMMENDED_HEADERS.trimEnd(), "```");
  } else {
    L.push(`Blocks: ${report.headers.blocks.length}. Unknown header names: ${report.headers.lint.unknownHeaders.join(", ") || "none"}. Duplicate paths: ${report.headers.lint.duplicatePaths.join(", ") || "none"}. Missing recommended: ${report.headers.lint.missingRecommended.join(", ") || "none"}.`);
  }
  L.push("", "## Sitemap vs dist", "", `Sitemap routes: ${report.sitemap.count}. In sitemap but not built: ${report.sitemap.diff.inSitemapNotBuilt.length}. Built but not in sitemap: ${report.sitemap.diff.builtNotInSitemap.length}.`, "");
  for (const r of report.sitemap.diff.inSitemapNotBuilt) L.push(`- not built: \`${r}\``);
  for (const r of report.sitemap.diff.builtNotInSitemap) L.push(`- not listed: \`${r}\``);
  L.push("", "## robots.txt", "", report.robots.present ? "```\n" + report.robots.body.trim() + "\n```" : "**absent**", "");
  return L.join("\n");
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;

if (isMain) {
  const { values } = parseArgs({ options: { dist: { type: "string", default: "dist" }, out: { type: "string", default: "audit-output/static-config" }, strict: { type: "boolean", default: false } } });
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const distDir = path.resolve(values.dist);
  if (!existsSync(distDir)) { console.error(`[static-config] dist not found at ${distDir}`); process.exit(1); }
  const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
  const redirectsBody = read(path.join(root, "public/_redirects")) ?? "";
  const rules = parseRedirectRules(redirectsBody);
  const headersBody = read(path.join(root, "public/_headers"));
  const blocks = headersBody ? parseHeadersFile(headersBody) : [];
  const sitemapFiles = existsSync(distDir) ? readdirSync(distDir).filter((f) => /^sitemap-\d+\.xml$/.test(f)) : [];
  const sitemapRoutes = sitemapFiles.flatMap((f) => extractSitemapLocs(readFileSync(path.join(distDir, f), "utf8")));
  const robotsBody = read(path.join(root, "public/robots.txt"));
  const report = buildStaticConfigReport({
    redirects: { rules, problems: validateRedirects(rules, distDir) },
    headers: { present: headersBody !== null, blocks, lint: lintHeaders(blocks) },
    sitemap: { files: sitemapFiles, count: sitemapRoutes.length, diff: diffSitemap(distRoutes(distDir), sitemapRoutes) },
    robots: { present: robotsBody !== null, body: robotsBody ?? "" },
  });
  mkdirSync(values.out, { recursive: true });
  writeFileSync(path.join(values.out, "static-config.json"), JSON.stringify(report, null, 2) + "\n");
  writeFileSync(path.join(values.out, "static-config.md"), renderStaticConfigMd(report) + "\n");
  const bad = report.redirects.problems.filter((p) => p.code !== "target-external").length + report.sitemap.diff.inSitemapNotBuilt.length;
  console.log(`[static-config] redirects ${rules.length} (${report.redirects.problems.length} problem(s)); _headers ${report.headers.present ? "present" : "ABSENT"}; sitemap ${sitemapRoutes.length} routes (${report.sitemap.diff.inSitemapNotBuilt.length} not built, ${report.sitemap.diff.builtNotInSitemap.length} not listed) → ${values.out}`);
  if (values.strict && bad) process.exit(1);
}
