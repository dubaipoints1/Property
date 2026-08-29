// Internal link sweep — validates every root-relative href in the built
// site against the build output itself. Exists because nav chrome is
// data (arrays in Header.astro / Footer.astro) that no schema validates:
// the retracted Skywards 3.5-fils valuation and a dead-labelled
// calculator row both survived two months in the header because nothing
// asserted on nav integrity (found in the 29 Aug 2026 site audit).
// Honest-nav is a stated editorial non-negotiable; this makes the
// "every link goes somewhere real" half of it mechanical.
//
// Checks dist/**/*.html for href="/..." and asserts each target
// resolves to a file in dist/, a directory with index.html, or a
// redirect source in public/_redirects. External links, fragments,
// mailto: and protocol-relative URLs are out of scope.
//
// Same shape as check-news-expiry.mjs: pure functions unit-tested in
// tests/ci/links.test.ts, plus a thin CLI.
//
// Usage: node scripts/ci/check-links.mjs [distDir]
// Exit 0 = clean, 1 = broken links listed on stderr.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Directories inside dist that are generated tooling output, not pages.
const SKIP_DIRS = new Set(["pagefind", "_astro"]);

/** Recursively collect .html files under dir (relative paths). */
export function collectHtmlFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...collectHtmlFiles(path.join(dir, entry.name), base));
    } else if (entry.name.endsWith(".html")) {
      out.push(path.relative(base, path.join(dir, entry.name)));
    }
  }
  return out;
}

/**
 * Extract root-relative hrefs from an HTML string, normalised: fragment
 * and query stripped, duplicates removed. Protocol-relative (`//…`),
 * absolute-URL, mailto:, tel: and pure-fragment hrefs are excluded.
 */
export function extractInternalHrefs(html) {
  const hrefs = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const raw = m[1];
    if (!raw.startsWith("/") || raw.startsWith("//")) continue;
    const clean = raw.split("#")[0].split("?")[0];
    if (clean) hrefs.add(clean);
  }
  return [...hrefs];
}

/** Parse redirect source paths (first column) from a _redirects file body. */
export function parseRedirectSources(body) {
  const sources = new Set();
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    sources.add(t.split(/\s+/)[0]);
  }
  return sources;
}

/** Does href resolve inside distDir (file, or directory with index.html)? */
export function hrefResolves(distDir, href) {
  const target = path.join(distDir, decodeURIComponent(href));
  // Guard against traversal out of dist.
  if (!path.resolve(target).startsWith(path.resolve(distDir))) return false;
  if (!existsSync(target)) {
    // /foo (no trailing slash) may still be the directory route /foo/.
    return existsSync(path.join(target, "index.html"));
  }
  const st = statSync(target);
  if (st.isDirectory()) return existsSync(path.join(target, "index.html"));
  return true;
}

/**
 * @returns {{ok: boolean, broken: Array<{file: string, href: string}>, checked: number}}
 */
export function checkLinks(distDir, redirectSources = new Set()) {
  const broken = [];
  let checked = 0;
  for (const file of collectHtmlFiles(distDir)) {
    const html = readFileSync(path.join(distDir, file), "utf8");
    for (const href of extractInternalHrefs(html)) {
      checked += 1;
      if (redirectSources.has(href) || redirectSources.has(href.replace(/\/$/, ""))) continue;
      if (!hrefResolves(distDir, href)) broken.push({ file, href });
    }
  }
  return { ok: broken.length === 0, broken, checked };
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  const distDir = process.argv[2] ?? fileURLToPath(new URL("../../dist/", import.meta.url));
  if (!existsSync(distDir)) {
    console.error(`[links] dist not found at ${distDir} — run npm run build first`);
    process.exit(1);
  }
  const redirectsPath = fileURLToPath(new URL("../../public/_redirects", import.meta.url));
  const redirectSources = existsSync(redirectsPath)
    ? parseRedirectSources(readFileSync(redirectsPath, "utf8"))
    : new Set();
  const { ok, broken, checked } = checkLinks(distDir, redirectSources);
  if (!ok) {
    console.error(`[links] ${broken.length} broken internal link(s):`);
    for (const b of broken) console.error(`  ${b.href}  (in ${b.file})`);
    process.exit(1);
  }
  console.log(`[links] OK — ${checked} internal links resolved`);
}
