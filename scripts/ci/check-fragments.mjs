// Fragment (anchor) sweep — validates every `#fragment` href in the built
// site against an `id` (or `<a name>`) on the target page. Exists because
// check-links.mjs deliberately strips fragments (its remit was "does the
// page exist"), which leaves the in-page navigation nobody re-tests —
// JumpToSection's `#earn-rates`-style links on 58 card reviews, the
// methodology anchors on the tools pages, footnote jumps in guides —
// with no guard at all. Found during the 2026-09-06 site UI/UX audit.
//
// Also reports root-relative <form action> targets that do not resolve,
// and GET search forms whose action is "/" (they post the query at the
// homepage, which ignores it).
//
// Same shape as check-links.mjs: pure functions unit-tested in
// tests/ci/fragments.test.ts, plus a thin CLI. Not wired into postbuild
// yet — promote it once the findings it surfaces are fixed, exactly as
// check-links.mjs was landed after the 29 Aug findings.
//
// Usage: node scripts/ci/check-fragments.mjs [distDir] [--json <path>]
// Exit 0 = clean, 1 = broken fragments listed on stderr.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectHtmlFiles, parseRedirectSources } from "./check-links.mjs";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", "#x2F": "/", "#x27": "'" };
export function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (ENTITIES[e] !== undefined) return ENTITIES[e];
    if (/^#x/i.test(e)) return String.fromCodePoint(parseInt(e.slice(2), 16));
    if (/^#/.test(e)) return String.fromCodePoint(parseInt(e.slice(1), 10));
    return m;
  });
}

/** Every id="…" and <a name="…"> value in an HTML string (entity-decoded). */
export function extractIds(html) {
  const ids = new Set();
  for (const m of html.matchAll(/\sid\s*=\s*"([^"]*)"/g)) ids.add(decodeEntities(m[1]));
  for (const m of html.matchAll(/\sid\s*=\s*'([^']*)'/g)) ids.add(decodeEntities(m[1]));
  for (const m of html.matchAll(/<a\s[^>]*\bname\s*=\s*"([^"]*)"/gi)) ids.add(decodeEntities(m[1]));
  ids.delete("");
  return ids;
}

/**
 * Fragment-bearing hrefs: "#f" (same page), "/x/#f", "/x#f". Skips "#",
 * "#top", text fragments ("#:~:text=") and non-root-relative targets.
 * @returns {Array<{href: string, path: string|null, fragment: string}>}
 */
export function extractFragmentHrefs(html) {
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/\shref\s*=\s*"([^"]*#[^"]*)"/g)) {
    const raw = decodeEntities(m[1]);
    if (seen.has(raw)) continue;
    seen.add(raw);
    const hash = raw.indexOf("#");
    const before = raw.slice(0, hash);
    const fragment = raw.slice(hash + 1);
    if (!fragment || fragment === "top" || fragment.startsWith(":~:")) continue;
    if (before && !before.startsWith("/")) continue; // absolute / external / relative-file hrefs are out of scope
    if (before.startsWith("//")) continue;
    out.push({ href: raw, path: before ? before.split("?")[0] : null, fragment: decodeURIComponent(fragment) });
  }
  return out;
}

/** Resolve a root-relative page path to its html file inside distDir, or null. */
export function resolveTargetFile(distDir, pagePath) {
  const target = path.join(distDir, decodeURIComponent(pagePath));
  if (!path.resolve(target).startsWith(path.resolve(distDir))) return null;
  if (existsSync(target) && !target.endsWith("/") && /\.html?$/.test(target)) return path.relative(distDir, target);
  const idx = path.join(target, "index.html");
  if (existsSync(idx)) return path.relative(distDir, idx);
  return null;
}

/** Root-relative <form action> targets with their method. */
export function extractFormActions(html) {
  const out = [];
  for (const m of html.matchAll(/<form\b([^>]*)>/gi)) {
    const attrs = m[1];
    const action = /\baction\s*=\s*"([^"]*)"/i.exec(attrs);
    const method = /\bmethod\s*=\s*"([^"]*)"/i.exec(attrs);
    if (!action) continue;
    const a = decodeEntities(action[1]);
    if (!a.startsWith("/") || a.startsWith("//")) continue;
    out.push({ action: a.split("#")[0], method: (method ? method[1] : "get").toLowerCase() });
  }
  return out;
}

/**
 * @returns {{ok: boolean, checked: number, broken: Array<{file, href, targetFile, fragment}>, missingTargets: Array<{file, href}>}}
 */
export function checkFragments(distDir, redirectSources = new Set()) {
  const idCache = new Map();
  const idsFor = (rel) => {
    if (!idCache.has(rel)) idCache.set(rel, extractIds(readFileSync(path.join(distDir, rel), "utf8")));
    return idCache.get(rel);
  };
  const broken = [];
  const missingTargets = [];
  let checked = 0;
  for (const file of collectHtmlFiles(distDir)) {
    const html = readFileSync(path.join(distDir, file), "utf8");
    for (const f of extractFragmentHrefs(html)) {
      let targetFile = file;
      if (f.path !== null) {
        if (redirectSources.has(f.path) || redirectSources.has(f.path.replace(/\/$/, ""))) continue;
      }
      checked += 1;
      if (f.path !== null) {
        targetFile = resolveTargetFile(distDir, f.path);
        if (!targetFile) { missingTargets.push({ file, href: f.href }); continue; }
      }
      if (!idsFor(targetFile).has(f.fragment)) broken.push({ file, href: f.href, targetFile, fragment: f.fragment });
    }
  }
  return { ok: broken.length === 0, checked, broken, missingTargets };
}

/** @returns {{missing: Array<{file, action, method}>, warnings: Array<{file, action, method, note}>}} */
export function checkFormActions(distDir) {
  const missing = [];
  const warnings = [];
  for (const file of collectHtmlFiles(distDir)) {
    const html = readFileSync(path.join(distDir, file), "utf8");
    for (const f of extractFormActions(html)) {
      const target = f.action.split("?")[0];
      if (!resolveTargetFile(distDir, target)) { missing.push({ file, ...f }); continue; }
      if (f.method === "get" && target === "/") warnings.push({ file, ...f, note: "GET form posts its query to the homepage, which ignores it" });
    }
  }
  return { missing, warnings };
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  const args = process.argv.slice(2);
  const jsonIdx = args.indexOf("--json");
  const jsonPath = jsonIdx >= 0 ? args[jsonIdx + 1] : null;
  const positional = args.filter((a, i) => a !== "--json" && i !== jsonIdx + 1);
  const distDir = positional[0] ?? fileURLToPath(new URL("../../dist/", import.meta.url));
  if (!existsSync(distDir)) {
    console.error(`[fragments] dist not found at ${distDir} — run npm run build first`);
    process.exit(1);
  }
  const redirectsPath = fileURLToPath(new URL("../../public/_redirects", import.meta.url));
  const redirectSources = existsSync(redirectsPath) ? parseRedirectSources(readFileSync(redirectsPath, "utf8")) : new Set();
  const result = checkFragments(distDir, redirectSources);
  const forms = checkFormActions(distDir);
  if (jsonPath) {
    mkdirSync(path.dirname(jsonPath), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify({ schemaVersion: 1, ...result, forms }, null, 2) + "\n");
  }
  if (forms.missing.length) {
    console.error(`[fragments] ${forms.missing.length} form action(s) do not resolve:`);
    for (const m of forms.missing) console.error(`  ${m.method.toUpperCase()} ${m.action}  (in ${m.file})`);
  }
  if (forms.warnings.length) {
    const files = new Set(forms.warnings.map((w) => w.file));
    console.warn(`[fragments] warning: ${forms.warnings.length} GET form(s) in ${files.size} page(s) post their query to "/"`);
  }
  if (result.missingTargets.length) {
    console.error(`[fragments] ${result.missingTargets.length} fragment href(s) point at pages that do not exist:`);
    for (const m of result.missingTargets) console.error(`  ${m.href}  (in ${m.file})`);
  }
  if (!result.ok) {
    console.error(`[fragments] ${result.broken.length} broken anchor(s):`);
    for (const b of result.broken) console.error(`  ${b.href}  (in ${b.file} → ${b.targetFile} has no id="${b.fragment}")`);
    process.exit(1);
  }
  console.log(`[fragments] OK — ${result.checked} fragment hrefs resolved`);
}
