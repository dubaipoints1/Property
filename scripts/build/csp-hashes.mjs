// Build-time Content-Security-Policy — appends the enforced CSP line to
// dist/_headers, with a script-src hash for every executable inline <script>
// the build actually rendered.
//
// Chairman direction, 11 October 2026 (in-session, "all and then merge it",
// replying to "Security headers: the site is missing one recommended
// protection against injected scripts"). Follows the R7 ruling of
// 15 September 2026, which held CSP back as its own item, and the inventory
// at .council/research/2026-09/csp-inline-script-inventory-2026-09-17.md,
// which found that the hashes must be generated from dist/ at build time:
// three of them are Astro's own island runtimes and change on any Astro
// upgrade or island edit, so a hand-maintained list would silently break.
//
// Runs in postbuild after Pagefind. Exits 1 if the header line would exceed
// Cloudflare Pages' 2,000-character per-header limit, or if dist/ still
// carries an inline event-handler attribute (onerror=, onload=, ...), which
// no hash or nonce can allow and which the policy would therefore disable.
//
// Usage: node scripts/build/csp-hashes.mjs [distDir]

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectHtmlFiles } from "../ci/check-links.mjs";

/** Cloudflare Pages limit on a single header line in `_headers`. */
export const MAX_HEADER_LENGTH = 2000;

/** Script `type` values a browser executes (plus absent / empty). */
const EXECUTABLE_TYPES = new Set([
  "",
  "module",
  "text/javascript",
  "application/javascript",
  "application/ecmascript",
  "text/ecmascript",
  "application/x-javascript",
  "text/x-javascript",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
]);

/** Read one attribute's value from a raw attribute string; null if absent. */
export function getAttr(attrs, name) {
  const re = new RegExp(`(?:^|\\s)${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?(?=\\s|$|/)`, "i");
  const m = attrs.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? "";
}

/**
 * Is a <script> with these raw attributes executable inline JavaScript?
 * External scripts (src=) are governed by source lists, not hashes; data
 * blocks (application/ld+json, application/json, ...) are never executed and
 * script-src does not apply to them.
 */
export function isExecutableInline(attrs) {
  if (getAttr(attrs, "src") !== null) return false;
  const type = getAttr(attrs, "type");
  if (type === null) return true;
  return EXECUTABLE_TYPES.has(type.trim().toLowerCase());
}

// One left-to-right pass over comments and script elements, whichever comes
// first. Order matters: an HTML comment that merely mentions
// `<script type="module">` (BaseLayout.astro has one) must be consumed as a
// comment, or the next real script's body would be mis-cut and mis-hashed;
// and `<!--` inside a script body is text, not a comment.
const TOKEN = /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

/** Every inline <script> in an HTML string: {attrs, body, executable}. */
export function extractInlineScripts(html) {
  const out = [];
  for (const m of html.matchAll(TOKEN)) {
    if (m[0].startsWith("<!--")) continue;
    const attrs = m[1];
    const body = m[2];
    out.push({ attrs, body, executable: isExecutableInline(attrs) });
  }
  return out;
}

/** The CSP source expression for a script body: 'sha256-<base64>'. */
export function hashSource(body) {
  return `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;
}

/** Inline event-handler attributes (on*=) found in an HTML string. */
export function findInlineHandlers(html) {
  const out = [];
  // Markup only: comments and script bodies are text, not attributes.
  const markup = html.replace(TOKEN, (m) => (m.startsWith("<!--") ? "" : m.replace(/>[\s\S]*$/, ">")));
  for (const tag of markup.matchAll(/<[a-z][^\s>/]*\b[^>]*>/gi)) {
    for (const a of tag[0].matchAll(/\s(on[a-z]+)\s*=/gi)) out.push(a[1].toLowerCase());
  }
  return out;
}

/**
 * Third-party origins the site really uses. Kept short on purpose; adding
 * one is a policy change and belongs in review.
 *  - Cloudflare Web Analytics: the beacon script (BaseLayout.astro, only
 *    when PUBLIC_CF_BEACON_TOKEN is set in production) and its RUM POST.
 *  No form posts off-site since the newsletter was removed (14 October
 *  2026), so form-action is 'self' only.
 */
export const THIRD_PARTY = {
  scriptSrc: ["https://static.cloudflareinsights.com"],
  connectSrc: ["https://cloudflareinsights.com"],
  formAction: [],
};

/** Assemble the policy value from a sorted, de-duplicated hash list. */
export function buildPolicy(hashes) {
  const directives = [
    ["default-src", ["'self'"]],
    // 'wasm-unsafe-eval' lets Pagefind instantiate its WebAssembly search
    // core; it does not permit eval() of JavaScript strings.
    ["script-src", ["'self'", "'wasm-unsafe-eval'", ...THIRD_PARTY.scriptSrc, ...hashes]],
    // Inline style attributes and <style> blocks are everywhere (Astro
    // scoped styles, per-page tokens). The risk CSP addresses here is script.
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "https:"]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", ["'self'", ...THIRD_PARTY.connectSrc]],
    ["media-src", ["'self'"]],
    ["frame-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'", ...THIRD_PARTY.formAction]],
    ["object-src", ["'none'"]],
    ["upgrade-insecure-requests", []],
  ];
  return directives.map(([d, v]) => (v.length ? `${d} ${v.join(" ")}` : d)).join("; ");
}

/**
 * Insert (or replace) the CSP header inside the `/*` block of a `_headers`
 * body. Throws if there is no `/*` block to put it in.
 */
export function injectHeader(headersBody, line) {
  const lines = headersBody.split("\n");
  const start = lines.findIndex((l) => l.trim() === "/*" && !/^\s/.test(l));
  if (start < 0) throw new Error("no `/*` block in _headers");
  let end = start + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  const block = lines
    .slice(start + 1, end)
    .filter((l) => !/^\s*Content-Security-Policy(-Report-Only)?\s*:/i.test(l));
  return [...lines.slice(0, start + 1), ...block, line, ...lines.slice(end)].join("\n");
}

/** Scan a dist directory: hashes, counts, and any handler attributes found. */
export function scanDist(distDir) {
  const hashes = new Set();
  let executable = 0;
  let data = 0;
  const handlers = [];
  for (const rel of collectHtmlFiles(distDir)) {
    const html = readFileSync(path.join(distDir, rel), "utf8");
    for (const s of extractInlineScripts(html)) {
      if (getAttr(s.attrs, "src") !== null) continue;
      if (s.executable) {
        executable++;
        hashes.add(hashSource(s.body));
      } else data++;
    }
    for (const h of findInlineHandlers(html)) handlers.push(`${rel}: ${h}`);
  }
  return { hashes: [...hashes].sort(), executable, data, handlers };
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  const distDir = path.resolve(process.argv[2] ?? fileURLToPath(new URL("../../dist/", import.meta.url)));
  const headersPath = path.join(distDir, "_headers");
  if (!existsSync(headersPath)) {
    console.error(`[csp] ${headersPath} not found — public/_headers should be copied by Astro`);
    process.exit(1);
  }
  const { hashes, executable, data, handlers } = scanDist(distDir);
  if (handlers.length) {
    console.error(`[csp] ${handlers.length} inline event-handler attribute(s) in dist/ — the policy would disable them:`);
    for (const h of handlers.slice(0, 20)) console.error(`  ${h}`);
    process.exit(1);
  }
  const line = `  Content-Security-Policy: ${buildPolicy(hashes)}`;
  if (line.length > MAX_HEADER_LENGTH) {
    console.error(`[csp] header line is ${line.length} characters (> ${MAX_HEADER_LENGTH}, Cloudflare's limit) with ${hashes.length} hashes`);
    process.exit(1);
  }
  writeFileSync(headersPath, injectHeader(readFileSync(headersPath, "utf8"), line));
  console.log(
    `[csp] ${hashes.length} script hash(es) from ${executable} executable inline script(s) (${data} data block(s) skipped); header ${line.length} chars → dist/_headers`,
  );
}
