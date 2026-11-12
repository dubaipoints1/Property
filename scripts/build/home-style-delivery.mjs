// Homepage-only CSS delivery. The original exact-inline experiment remains
// exported and tested below for its historical audit. The active CLI now
// substitutes a smaller external route asset at the original link position;
// every interior HTML file and reusable full-site asset stays untouched.
import { createHash } from "node:crypto";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TOKEN = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<link\b[^>]*>/gi;
const hash = value => createHash("sha256").update(value, "utf8").digest("hex");
const byteLength = value => Buffer.byteLength(value, "utf8");

function attributes(tag, name) {
  const opening = new RegExp(`^<${name}\\b([\\s\\S]*?)>`, "i").exec(tag);
  if (!opening) throw Error(`Malformed ${name} tag in homepage head`);
  const source = opening[1].replace(/\/$/, "");
  const attrs = new Map();
  const pattern = /\s+([^\s=<>"'`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>"'`=]+)))?/gy;
  let position = 0;
  while (position < source.length) {
    if (!source.slice(position).trim()) break;
    pattern.lastIndex = position;
    const match = pattern.exec(source);
    if (!match) throw Error(`Unsupported ${name} attributes in homepage head`);
    const key = match[1].toLowerCase();
    if (attrs.has(key)) throw Error(`Duplicate ${name} attribute: ${key}`);
    attrs.set(key, match[2] ?? match[3] ?? match[4] ?? null);
    position = pattern.lastIndex;
  }
  return attrs;
}

function safeAssetHref(href) {
  if (typeof href !== "string" || !/^\/_astro\/[A-Za-z0-9_.-]+\.css$/.test(href)
    || path.posix.basename(href).includes("..")) {
    throw Error("Homepage CSS must be a safe /_astro/basename.css path without queries, fragments or traversal");
  }
  return href;
}

function stylesheetHref(tag) {
  const attrs = attributes(tag, "link");
  const rel = attrs.get("rel");
  if (typeof rel !== "string" || !rel.toLowerCase().split(/\s+/).includes("stylesheet")) return null;
  if (rel.toLowerCase() !== "stylesheet" || attrs.size !== 2 || !attrs.has("href")) {
    throw Error("Unsupported homepage stylesheet semantics; only rel=stylesheet and href are permitted");
  }
  return safeAssetHref(attrs.get("href"));
}

// CSS identifiers may hide import/function names behind hex escapes. Inspect
// names without rewriting any bytes; quoted strings/comments are not tokens.
// Selector escapes (for example Tailwind's .md\:grid or .w-\[1px\]) remain
// valid because they are neither at-keywords nor escaped function names.
function rejectEscapedCssSyntax(css) {
  const isName = character => typeof character === "string"
    && (/[A-Za-z0-9_-]/.test(character) || character.charCodeAt(0) >= 128);
  const consumeEscape = start => {
    let cursor = start + 1;
    if (cursor >= css.length || /[\n\r\f]/.test(css[cursor])) throw Error("Unsupported CSS identifier escape");
    if (/[0-9A-Fa-f]/.test(css[cursor])) {
      let digits = 0;
      while (cursor < css.length && digits < 6 && /[0-9A-Fa-f]/.test(css[cursor])) { cursor += 1; digits += 1; }
      if (cursor < css.length && /[\t\n\r\f ]/.test(css[cursor])) {
        if (css[cursor] === "\r" && css[cursor + 1] === "\n") cursor += 1;
        cursor += 1;
      }
      return cursor;
    }
    return cursor + 1;
  };
  const consumeName = start => {
    let end = start;
    let escaped = false;
    while (end < css.length) {
      if (css[end] === "\\") { escaped = true; end = consumeEscape(end); }
      else if (isName(css[end])) end += 1;
      else break;
    }
    return { end, escaped };
  };
  let cursor = 0;
  while (cursor < css.length) {
    if (css[cursor] === "/" && css[cursor + 1] === "*") {
      const end = css.indexOf("*/", cursor + 2);
      if (end < 0) throw Error("Unterminated compiled CSS comment");
      cursor = end + 2;
      continue;
    }
    if (css[cursor] === '"' || css[cursor] === "'") {
      const quote = css[cursor++];
      let closed = false;
      while (cursor < css.length) {
        if (css[cursor] === "\\") cursor += 2;
        else if (css[cursor++] === quote) { closed = true; break; }
      }
      if (!closed) throw Error("Unterminated compiled CSS string");
      continue;
    }
    if (css[cursor] === "@") {
      const name = consumeName(cursor + 1);
      if (name.escaped) throw Error("Escaped CSS at-keyword requires review before homepage inlining");
      cursor = Math.max(cursor + 1, name.end);
      continue;
    }
    if (isName(css[cursor]) || css[cursor] === "\\") {
      const name = consumeName(cursor);
      if (name.escaped && css[name.end] === "(") throw Error("Escaped CSS function name requires review before homepage inlining");
      const functionName = css.slice(cursor, name.end).toLowerCase();
      // image-set() accepts bare quoted URLs as well as url() tokens. Their
      // base would move when embedded, so leave every form behind this gate
      // until explicitly supported rather than attempting a generic rewrite.
      if (css[name.end] === "(" && ["image-set", "-webkit-image-set"].includes(functionName)) {
        throw Error("Unsupported CSS image-set() requires review before homepage inlining");
      }
      cursor = name.end;
      continue;
    }
    cursor += 1;
  }
}

function checkCss(css) {
  if (typeof css !== "string" || !css.trim()) throw Error("Missing or non-string compiled homepage CSS");
  rejectEscapedCssSyntax(css);
  // Fail closed instead of rewriting unknown generated CSS or accidentally
  // closing an HTML raw-text element. These patterns are absent in the
  // current Vite output; an upstream change must receive deliberate review.
  if (/@import\b/i.test(css)) throw Error("Compiled homepage CSS must not contain @import");
  if (/@namespace\b/i.test(css)) throw Error("Compiled homepage CSS must not contain @namespace");
  if (/sourceMappingURL/i.test(css)) throw Error("Compiled homepage CSS must not contain sourceMappingURL");
  if (/<\/style\b|<\/?script\b/i.test(css)) throw Error("Unsafe HTML/script text in compiled homepage CSS");
  const urls = [...css.matchAll(/\burl\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^()'"\s]*))\s*\)/gi)];
  if (urls.length !== (css.match(/\burl\s*\(/gi) ?? []).length) throw Error("Unsupported CSS url() syntax");
  for (const match of urls) {
    const url = match[1] ?? match[2] ?? match[3];
    if (url.includes("\\") || !((url.startsWith("/") && !url.startsWith("//")) || /^data:/i.test(url))) {
      throw Error("Homepage CSS url() must remain root-absolute or data:; relative/external URLs require review");
    }
    if (url.startsWith("//")) throw Error("Homepage CSS must not add an external URL");
  }
}

function splitHead(html) {
  if (typeof html !== "string") throw Error("Homepage HTML must be a string");
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html);
  if (!head) throw Error("Homepage head not found");
  const start = head.index + head[0].indexOf(">") + 1;
  return { before: html.slice(0, start), head: head[1], after: html.slice(start + head[1].length) };
}

/**
 * Pure transformation. readCss(href) returns the exact compiled CSS string.
 * Every stylesheet is validated before a result is returned. Existing
 * verified markers make a second run a no-op, without reading CSS again.
 */
function transformCompiledStyles(html, readCss, scope) {
  const parts = splitHead(html);
  const marker = `data-dp-${scope}-css`;
  const markerPattern = new RegExp(`\\b${marker}\\s*=`, "i");
  const styles = [];
  let inlinedCount = 0;
  const head = parts.head.replace(TOKEN, token => {
    if (/^<link\b/i.test(token)) {
      const href = stylesheetHref(token);
      if (!href) return token;
      const css = readCss(href);
      checkCss(css);
      const sha256 = hash(css);
      styles.push({ href, bytes: byteLength(css), sha256 });
      inlinedCount += 1;
      return `<style ${marker}="${href}" data-dp-css-sha256="${sha256}">${css}</style>`;
    }
    if (/^<style\b/i.test(token) && markerPattern.test(token)) {
      const attrs = attributes(token, "style");
      if (attrs.size !== 2 || !attrs.has("data-dp-css-sha256")) throw Error("Unsupported homepage inline CSS marker");
      const href = safeAssetHref(attrs.get(marker));
      const css = token.slice(token.indexOf(">") + 1, token.lastIndexOf("</"));
      checkCss(css);
      const sha256 = hash(css);
      if (attrs.get("data-dp-css-sha256") !== sha256) throw Error("Homepage inline CSS fingerprint mismatch");
      styles.push({ href, bytes: byteLength(css), sha256 });
    }
    return token;
  });
  if (!styles.length) throw Error("No compiled homepage stylesheets or verified inline markers found");
  const transformed = parts.before + head + parts.after;
  return {
    html: transformed,
    styles,
    inlinedCount,
    cssBytes: styles.reduce((sum, style) => sum + style.bytes, 0),
    htmlBytesBefore: byteLength(html),
    htmlBytesAfter: byteLength(transformed),
    fingerprint: hash(styles.map(style => `${style.href}\0${style.sha256}\n`).join("")),
  };
}

// Keep the historical homepage transform's public contract and output exact.
export function transformHomepageStyles(html, readCss) {
  return transformCompiledStyles(html, readCss, "home");
}

// The programme runner supplies its own explicit route/identity preflight.
// Share the same fail-closed CSS validator; do not maintain a weaker copy.
export function transformProgrammeStyles(html, readCss) {
  return transformCompiledStyles(html, readCss, "programme");
}

// The first-card guide has its own exact route and identity preflight.
export function transformFirstCardStyles(html, readCss) {
  return transformCompiledStyles(html, readCss, "first-card");
}

// My Family is text-led: preserve the original typography and resource hints.
export function transformMyFamilyStyles(html, readCss) {
  if (/<(?:template|noscript)\b/i.test(splitHead(html).head)) {
    throw Error("My Family head contains unsupported inert markup");
  }
  return transformCompiledStyles(html, readCss, "my-family");
}

// Cards keeps the exact stylesheet order and the two existing normal
// font hints. Move those hints before the CSS bytes so the document
// preload scanner can discover them immediately.
export function transformCardsStyles(html, readCss) {
  if (/<(?:template|noscript)\b/i.test(splitHead(html).head)) {
    throw Error("Cards head contains unsupported inert markup");
  }
  const result = transformCompiledStyles(html, readCss, "cards");
  const parts = splitHead(result.html);
  const tokens = [...parts.head.matchAll(TOKEN)].map(match => match[0]);
  const styles = tokens.filter(token => token.startsWith("<style data-dp-cards-css="));
  const fontLink = /^<link rel="preload" href="(\/_astro\/(?:newsreader|geist)-latin-wght-normal-site\.[A-Za-z0-9_-]+\.woff2)" as="font" type="font\/woff2" crossorigin>$/;
  const hints = tokens.filter(token => {
    if (!/^<link\b/i.test(token)) return false;
    const attrs = attributes(token, "link");
    return attrs.get("rel") === "preload" && attrs.get("as") === "font";
  });
  const fonts = hints.map(token => fontLink.exec(token)?.[1]);
  if (fonts.length !== 2 || !fonts[0]?.includes("/newsreader-") || !fonts[1]?.includes("/geist-") ||
      !fonts.every(href => styles.some(style => style.includes(href)))) {
    throw Error("Cards font preload identity mismatch");
  }
  let inserted = false;
  const head = parts.head.replace(TOKEN, token => {
    if (hints.includes(token)) return "";
    if (!inserted && token === styles[0]) {
      inserted = true;
      return hints.join("") + token;
    }
    return token;
  });
  if (!inserted) throw Error("Cards inline styles not found");
  result.html = parts.before + head + parts.after;
  result.htmlBytesAfter = byteLength(result.html);
  return result;
}

// The Expat Starter runner supplies its own exact route and identity preflight.
export function transformExpatStarterStyles(html, readCss) {
  // The shared transformer is for a flat, generated head, not inert markup.
  if (/<(?:template|noscript)\b/i.test(splitHead(html).head)) {
    throw Error("Expat Starter head contains unsupported inert markup");
  }
  const result = transformCompiledStyles(html, readCss, "expat-starter");
  const parts = splitHead(result.html);
  const fontLink = /^<link rel="preload" href="(\/_astro\/[A-Za-z0-9_.-]+\.woff2)" as="font" type="font\/woff2" crossorigin>$/;
  const expectedNames = ["newsreader-latin-wght-normal-site", "geist-latin-wght-normal-site", "newsreader-latin-wght-italic-site"];
  const styles = [...parts.head.matchAll(TOKEN)].map(match => match[0])
    .filter(token => token.startsWith("<style data-dp-expat-starter-css="));
  const fonts = expectedNames.map(name => {
    const pattern = new RegExp(`url\\(["']?(\\/_astro\\/${name}\\.[A-Za-z0-9_-]+\\.woff2)["']?\\)`, "g");
    const urls = [...new Set(styles.flatMap(style => [...style.matchAll(pattern)].map(match => match[1])))];
    if (urls.length !== 1) throw Error(`Expat Starter compiled font identity mismatch: ${name}`);
    return urls[0];
  });
  const firstStyle = styles[0];
  const seen = [];
  let inserted = false;
  const head = parts.head.replace(TOKEN, token => {
    const font = fontLink.exec(token);
    if (font) {
      seen.push(font[1]);
      return "";
    }
    if (/^<link\b/i.test(token)) {
      const attrs = attributes(token, "link");
      if (attrs.get("rel") === "preload" && attrs.get("as") === "font") {
        throw Error("Expat Starter font preload identity mismatch");
      }
    }
    if (!inserted && token === firstStyle) {
      inserted = true;
      return fonts.map(href => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`).join("") + token;
    }
    return token;
  });
  // Only the two existing normals, or all three on an idempotent second run.
  const expected = result.inlinedCount ? fonts.slice(0, 2) : fonts;
  if (!inserted || seen.length !== expected.length || !seen.every((href, i) => href === expected[i])) {
    throw Error("Expat Starter font preload identity mismatch");
  }
  result.html = parts.before + head + parts.after;
  result.htmlBytesAfter = byteLength(result.html);
  return result;
}

/** Only dist/index.html is writable; all reads and checks precede one write. */
export async function inlineHomeStyles(distDir) {
  const root = await realpath(path.resolve(distDir));
  const indexPath = path.join(root, "index.html");
  const indexInfo = await lstat(indexPath);
  if (!indexInfo.isFile() || indexInfo.isSymbolicLink() || await realpath(indexPath) !== indexPath) {
    throw Error("Homepage output must be a regular index.html within dist");
  }
  const decode = bytes => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const html = decode(await readFile(indexPath));
  const { head } = splitHead(html);
  const pending = new Set();
  for (const match of head.matchAll(TOKEN)) {
    if (!/^<link\b/i.test(match[0])) continue;
    const href = stylesheetHref(match[0]);
    if (href) pending.add(href);
  }
  const cssByHref = new Map();
  if (pending.size) {
    const astroRoot = path.join(root, "_astro");
    const astroInfo = await lstat(astroRoot);
    if (!astroInfo.isDirectory() || astroInfo.isSymbolicLink() || await realpath(astroRoot) !== astroRoot) {
      throw Error("Homepage stylesheet directory must be a real dist/_astro directory");
    }
    for (const href of pending) {
      const file = path.join(astroRoot, path.posix.basename(href));
      const info = await lstat(file);
      const resolved = await realpath(file);
      if (!info.isFile() || info.isSymbolicLink() || path.dirname(resolved) !== astroRoot) {
        throw Error("Homepage stylesheet escaped the real dist/_astro directory");
      }
      cssByHref.set(href, decode(await readFile(resolved)));
    }
  }
  const result = transformHomepageStyles(html, href => cssByHref.get(href));
  if (result.html !== html) await writeFile(indexPath, result.html, "utf8");
  return result;
}

const ROUTE_TOKEN = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<link\b[^>]*>|<meta\b[^>]*>/gi;
const ROUTE_MARKER = "route-v1";
const isFullSiteBundle = css => /\.dpst\s*\{/.test(css)
  && css.includes("--container-listing:") && css.includes("--dp-ui-control:");

/**
 * Replace only the homepage's full-site rule bundle, never filter selectors.
 * The smaller stylesheet is explicitly authored from complete shared source
 * sections. Its synchronous link occupies the old link's exact position.
 */
export function transformHomeStyleRoute(html, readCss) {
  const parts = splitHead(html);
  const tokens = [...parts.head.matchAll(ROUTE_TOKEN)];
  const assetTags = tokens.filter(match => /^<meta\b/i.test(match[0])
    && attributes(match[0], "meta").get("name") === "dp-home-style-asset");
  const delivered = tokens.filter(match => /^<link\b/i.test(match[0])
    && attributes(match[0], "link").has("data-dp-home-style"));
  if (assetTags.length === 0 && delivered.length === 1) {
    const attrs = attributes(delivered[0][0], "link");
    if (attrs.size !== 4 || attrs.get("rel") !== "stylesheet"
      || attrs.get("data-dp-home-style") !== ROUTE_MARKER) throw Error("Invalid homepage route delivery marker");
    const href = safeAssetHref(attrs.get("href"));
    const css = readCss(href);
    checkCss(css);
    if (attrs.get("data-dp-css-sha256") !== hash(css)) throw Error("Homepage route CSS fingerprint mismatch");
    return { html, href, cssBytes: byteLength(css), replacedCount: 0, originalBytes: null, sha256: hash(css) };
  }
  if (assetTags.length !== 1 || delivered.length) throw Error("Expected exactly one undelivered homepage style asset");
  const meta = attributes(assetTags[0][0], "meta");
  if (meta.size !== 2 || !meta.has("content")) throw Error("Invalid homepage style asset metadata");
  const href = safeAssetHref(meta.get("content"));
  const routeCss = readCss(href);
  checkCss(routeCss);
  if (isFullSiteBundle(routeCss) || !routeCss.includes("--container-listing:")
    || !routeCss.includes("--dp-ui-control:") || !/\.dp-strategy\s*\{/.test(routeCss)) {
    throw Error("Homepage route CSS is not the expected explicit shared-section asset");
  }
  const candidates = [];
  for (const token of tokens) {
    if (!/^<link\b/i.test(token[0])) continue;
    const originalHref = stylesheetHref(token[0]);
    if (!originalHref) continue;
    const css = readCss(originalHref);
    checkCss(css);
    if (isFullSiteBundle(css)) candidates.push({ token, href: originalHref, css });
  }
  if (candidates.length !== 1) throw Error("Expected exactly one full-site homepage stylesheet to replace");
  const original = candidates[0];
  if (byteLength(routeCss) >= byteLength(original.css)) throw Error("Homepage route CSS must be smaller than the full-site bundle");
  const sha256 = hash(routeCss);
  const link = `<link rel="stylesheet" href="${href}" data-dp-home-style="${ROUTE_MARKER}" data-dp-css-sha256="${sha256}">`;
  const head = parts.head.replace(ROUTE_TOKEN, token => token === assetTags[0][0] ? ""
    : token === original.token[0] ? link : token);
  return {
    html: parts.before + head + parts.after,
    href, sha256, cssBytes: byteLength(routeCss), replacedCount: 1,
    originalBytes: byteLength(original.css),
  };
}

/** Preflight all reads before a single homepage-only write. */
export async function routeHomeStyles(distDir) {
  const root = await realpath(path.resolve(distDir));
  const indexPath = path.join(root, "index.html");
  const indexInfo = await lstat(indexPath);
  if (!indexInfo.isFile() || indexInfo.isSymbolicLink() || await realpath(indexPath) !== indexPath) {
    throw Error("Homepage output must be a regular index.html within dist");
  }
  const decode = bytes => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const html = decode(await readFile(indexPath));
  const { head } = splitHead(html);
  const pending = new Set();
  for (const match of head.matchAll(ROUTE_TOKEN)) {
    if (/^<meta\b/i.test(match[0])) {
      const attrs = attributes(match[0], "meta");
      if (attrs.get("name") === "dp-home-style-asset") pending.add(safeAssetHref(attrs.get("content")));
    } else if (/^<link\b/i.test(match[0])) {
      const attrs = attributes(match[0], "link");
      if (attrs.has("data-dp-home-style")) pending.add(safeAssetHref(attrs.get("href")));
      else {
        const href = stylesheetHref(match[0]);
        if (href) pending.add(href);
      }
    }
  }
  const astroRoot = path.join(root, "_astro");
  const astroInfo = await lstat(astroRoot);
  if (!astroInfo.isDirectory() || astroInfo.isSymbolicLink() || await realpath(astroRoot) !== astroRoot) {
    throw Error("Homepage stylesheet directory must be a real dist/_astro directory");
  }
  const cssByHref = new Map();
  for (const href of pending) {
    const file = path.join(astroRoot, path.posix.basename(href));
    const info = await lstat(file);
    const resolved = await realpath(file);
    if (!info.isFile() || info.isSymbolicLink() || path.dirname(resolved) !== astroRoot) {
      throw Error("Homepage stylesheet escaped the real dist/_astro directory");
    }
    cssByHref.set(href, decode(await readFile(resolved)));
  }
  const result = transformHomeStyleRoute(html, href => cssByHref.get(href));
  if (result.html !== html) await writeFile(indexPath, result.html, "utf8");
  return result;
}

/** Join complete, adjacent homepage stylesheets in their existing order.
 * No selectors/rules are removed or moved across a script/style/other node.
 * Relative/external URL and unknown link semantics fail closed above.
 */
function isBundleStyleLink(tag) {
  const rel = attributes(tag, "link").get("rel");
  if (typeof rel !== "string" || !rel.toLowerCase().split(/\s+/).includes("stylesheet")) return false;
  // Detect every case-insensitive stylesheet link, then fail closed on
  // unreviewed semantics; never silently leave one outside the bundle.
  if (rel !== "stylesheet") throw Error("Unsupported homepage stylesheet rel semantics before bundling");
  return true;
}

export function transformHomeStyleBundle(html, readCss) {
  const parts = splitHead(html);
  const links = [...parts.head.matchAll(ROUTE_TOKEN)]
    .filter(match => /^<link\b/i.test(match[0]))
    .filter(match => isBundleStyleLink(match[0]));
  if (!links.length) throw Error("Missing complete homepage stylesheets");
  const marked = links.filter(match => attributes(match[0], "link").has("data-dp-home-bundle"));
  if (marked.length) {
    if (marked.length !== 1 || links.length !== 1) throw Error("Ambiguous homepage CSS bundle");
    const attrs = attributes(marked[0][0], "link");
    if (attrs.size !== 5 || attrs.get("data-dp-home-bundle") !== "complete-v1"
      || attrs.get("data-dp-home-style") !== ROUTE_MARKER) throw Error("Invalid homepage CSS bundle marker");
    const href = safeAssetHref(attrs.get("href"));
    const css = readCss(href);
    checkCss(css);
    if (attrs.get("data-dp-css-sha256") !== hash(css)) throw Error("Homepage CSS bundle fingerprint mismatch");
    return { html, href, css, sha256: hash(css), cssBytes: byteLength(css), combinedCount: 0, sources: [] };
  }
  if (links.length < 2) throw Error("Expected multiple complete homepage stylesheets before bundling");
  const sources = [];
  let routeCount = 0;
  for (let index = 0; index < links.length; index++) {
    const match = links[index];
    const attrs = attributes(match[0], "link");
    if (attrs.has("data-dp-home-style")) {
      if (attrs.size !== 4 || attrs.get("data-dp-home-style") !== ROUTE_MARKER) throw Error("Invalid route CSS before bundling");
      routeCount++;
    } else if (attrs.size !== 2) throw Error("Unsupported homepage stylesheet semantics before bundling");
    const href = safeAssetHref(attrs.get("href"));
    const css = readCss(href);
    checkCss(css);
    if (/@charset\b/i.test(css)) throw Error("CSS charset semantics require review before bundling");
    if (attrs.has("data-dp-css-sha256") && attrs.get("data-dp-css-sha256") !== hash(css)) throw Error("Route CSS fingerprint mismatch before bundling");
    if (index) {
      const previous = links[index - 1];
      if (parts.head.slice(previous.index + previous[0].length, match.index).trim()) {
        throw Error("Homepage stylesheets are not adjacent; never move CSS across another head node");
      }
    }
    sources.push({ href, css, bytes: byteLength(css), sha256: hash(css) });
  }
  if (routeCount !== 1) throw Error("Expected one verified explicit homepage route stylesheet");
  const css = sources.map(source => source.css).join("\n");
  const sha256 = hash(css);
  const href = `/_astro/home-delivery.${sha256.slice(0, 20)}.css`;
  const tag = `<link rel="stylesheet" href="${href}" data-dp-home-style="${ROUTE_MARKER}" data-dp-home-bundle="complete-v1" data-dp-css-sha256="${sha256}">`;
  const first = links[0];
  const last = links.at(-1);
  const head = parts.head.slice(0, first.index) + tag + parts.head.slice(last.index + last[0].length);
  return { html: parts.before + head + parts.after, href, css, sha256,
    cssBytes: byteLength(css), combinedCount: links.length,
    sources: sources.map(({ css: _css, ...source }) => source) };
}

export async function bundleHomeStyles(distDir) {
  const root = await realpath(path.resolve(distDir));
  const indexPath = path.join(root, "index.html");
  const astroRoot = path.join(root, "_astro");
  for (const file of [indexPath, astroRoot]) {
    const info = await lstat(file);
    if (info.isSymbolicLink() || await realpath(file) !== file) throw Error("Bundle paths must not be symlinks");
    if (file === indexPath ? !info.isFile() : !info.isDirectory()) throw Error("Invalid homepage bundle path");
  }
  const decode = bytes => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const html = decode(await readFile(indexPath));
  const cssByHref = new Map();
  for (const match of splitHead(html).head.matchAll(ROUTE_TOKEN)) {
    if (!/^<link\b/i.test(match[0])) continue;
    if (!isBundleStyleLink(match[0])) continue;
    const attrs = attributes(match[0], "link");
    const href = safeAssetHref(attrs.get("href"));
    const file = path.join(astroRoot, path.posix.basename(href));
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink() || await realpath(file) !== file) throw Error("Unsafe bundle source asset");
    cssByHref.set(href, decode(await readFile(file)));
  }
  const result = transformHomeStyleBundle(html, href => cssByHref.get(href));
  if (result.html !== html) {
    const destination = path.join(astroRoot, path.posix.basename(result.href));
    try { await writeFile(destination, result.css, { encoding: "utf8", flag: "wx" }); }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      const info = await lstat(destination);
      if (!info.isFile() || info.isSymbolicLink() || await realpath(destination) !== destination
        || decode(await readFile(destination)) !== result.css) throw Error("Existing bundle destination is unsafe or differs");
    }
    await writeFile(indexPath, result.html, "utf8");
  }
  return result;
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;
if (isMain) {
  const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
  const html = await readFile(path.join(dist, "index.html"), "utf8");
  const bundled = [...splitHead(html).head.matchAll(ROUTE_TOKEN)].some(match => /^<link\b/i.test(match[0])
    && attributes(match[0], "link").has("data-dp-home-bundle"));
  if (!bundled) {
    const route = await routeHomeStyles(dist);
    console.log(`[home-style-delivery] explicit shared route CSS ${route.originalBytes ?? "unchanged"} → ${route.cssBytes} B`);
  }
  const result = await bundleHomeStyles(dist);
  console.log(`[home-style-delivery] ${result.combinedCount} complete adjacent stylesheets → cached ${result.href}; ${result.cssBytes} B; sha256 ${result.sha256}`);
}
