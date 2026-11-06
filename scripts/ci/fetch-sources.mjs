// Primary-source reader — prints the readable text of public pages (and
// PDFs) into a GitHub Actions log, so a Claude Code web session can read a
// source it cannot fetch itself.
//
// Why it exists: the web sandbox's egress allowlist rejects nearly every
// issuer host (CLAUDE.md § Network allowlist), and on 26 September 2026 the
// Firecrawl balance went negative, which took away the only other channel.
// That left the news desks with a digest of flydubai headlines they could
// cite but not read. Actions runners have ordinary egress, and a session
// can read a run's log through the GitHub API, so this closes the gap at no
// credit cost: dispatch `.github/workflows/fetch-sources.yml` with the
// URLs, read the job log.
//
// Deterministic and read-only. No LLM anywhere (Charter §6): this prints
// what the page says, and every figure still comes from reading it. It never
// writes to the repo.
//
// Usage: SOURCE_URLS="https://a https://b" node scripts/ci/fetch-sources.mjs
// Optional evidence (manual only): SOURCE_ARCHIVE=1 writes a fresh fixed child
// of RUNNER_TEMP, with decoded response bytes/full extracted text and manifest.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, lstatSync, realpathSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { decodeEntities } from "./check-external-links.mjs";

export const USER_AGENT =
  "Mozilla/5.0 (compatible; DubaiPointsSourceReader/1.0; +https://dubaipoints.ae/about/)";
export const MAX_URLS = 10;
export const MAX_CHARS = 20000;
// Terms PDFs run long, and UAE banks print them bilingual side by side, so
// pdftotext doubles every clause. ENBD's payroll-cashback T&Cs reached the
// clawback clauses only after 20,000 characters (1 October 2026).
export const MAX_PDF_CHARS = 80000;
// Explicit evidence-capture mode only. Default log-only behaviour is unchanged.
export const ARCHIVE_DIRECTORY = "dubaipoints-source-archive";
export const MAX_ARCHIVE_BODY_BYTES = 20 * 1024 * 1024;
export const MAX_ARCHIVE_TEXT_BYTES = 20 * 1024 * 1024;
export const MAX_ARCHIVE_BATCH_BYTES = 100 * 1024 * 1024;
export const MAX_ARCHIVE_REDIRECTS = 5;
const MAX_ARCHIVE_MANIFEST_BYTES = 1024 * 1024;
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const SOURCE_READER_VERSION = "fetch-sources/archive-v1";
const HTML_EXTRACTOR_VERSION = "htmlToText/v1";
const SOURCE_READER_SHA256 = sha256(readFileSync(new URL(import.meta.url)));
// Bind the complete local module graph, including the imported entity decoder
// and its own static import. Built-ins are identified by the Node version.
const EXTRACTION_SOURCE_SHA256 = Object.freeze(Object.fromEntries([
  "fetch-sources.mjs", "check-external-links.mjs", "check-links.mjs",
].map(file => [`scripts/ci/${file}`, sha256(readFileSync(new URL(file, import.meta.url)))])));
const EXTRACTION_BUNDLE_SHA256 = sha256(JSON.stringify(EXTRACTION_SOURCE_SHA256));

/** https URLs only, deduped, capped — anything else is refused, not fetched. */
export function parseUrls(raw) {
  const out = [];
  const refused = [];
  for (const tok of String(raw ?? "").split(/\s+/).filter(Boolean)) {
    let ok = false;
    try {
      ok = new URL(tok).protocol === "https:";
    } catch {
      ok = false;
    }
    if (!ok) refused.push(tok);
    else if (!out.includes(tok)) out.push(tok);
  }
  return { urls: out.slice(0, MAX_URLS), refused, dropped: Math.max(0, out.length - MAX_URLS) };
}

// decodeEntities (shared with the link audit) knows only the entities that
// appear in hrefs. Press releases are full of typographic ones — the first
// run of this reader printed flydubai's text as "flydubai&rsquo;s".
const TYPOGRAPHIC = {
  nbsp: " ", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", apos: "'", copy: "\u00a9",
  reg: "\u00ae", trade: "\u2122", bull: "\u2022", middot: "\u00b7", eacute: "\u00e9",
};
export function decodeTypography(s) {
  return String(s).replace(/&([a-z]+);/gi, (whole, name) => TYPOGRAPHIC[name.toLowerCase()] ?? whole);
}

const BLOCK = /<\/?(p|div|section|article|header|footer|ul|ol|tr|table|h[1-6]|br|hr|blockquote|figure|figcaption|dd|dt)\b[^>]*>/gi;

/**
 * Readable text of an HTML page: the <article>, else <main>, else <body>;
 * script/style/noscript/svg/template/nav removed; block tags become line
 * breaks; entities decoded; whitespace collapsed.
 */
export function htmlToText(html) {
  let s = String(html ?? "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|noscript|svg|template|nav)\b[\s\S]*?<\/\1>/gi, "");
  const pick = (tag) => {
    const m = s.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return m ? m[1] : null;
  };
  const title = (s.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  s = pick("article") ?? pick("main") ?? pick("body") ?? s;
  s = s.replace(/<h([1-6])\b[^>]*>/gi, (_, n) => `\n${"#".repeat(Number(n))} `);
  s = s.replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/li>/gi, "");
  s = s.replace(BLOCK, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeTypography(decodeEntities(s));
  s = s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter((l, i, a) => l || (i > 0 && a[i - 1]))
    .join("\n")
    .trim();
  const t = decodeTypography(decodeEntities(title));
  return t && !s.startsWith(t) ? `# ${t}\n\n${s}` : s;
}

function pdfToText(buf, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), "src-"));
  try {
    const f = join(dir, "doc.pdf");
    writeFileSync(f, buf);
    return execFileSync("pdftotext", ["-layout", f, "-"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, ...options });
  } catch (e) {
    return `[pdftotext failed: ${e.message}]`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const MAX_LINKS = 80;

/**
 * The page's outbound links, so a session can follow an index page (a
 * regulator's circulars list, a newsroom) to the document itself — the
 * text alone names a circular but not where its PDF lives. Taken from the
 * whole body, not just <article>, because index pages rarely use one.
 * Resolved against the final URL, http(s) only, deduped, capped.
 */
export function extractLinks(html, baseUrl) {
  const body = String(html ?? "").replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, "");
  const out = [];
  const seen = new Set();
  for (const m of body.matchAll(/<a\b[^>]*?href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href;
    try {
      href = new URL(decodeEntities(m[2].trim()), baseUrl);
    } catch {
      continue;
    }
    if (href.protocol !== "http:" && href.protocol !== "https:") continue;
    href.hash = "";
    const key = href.href;
    if (seen.has(key)) continue;
    seen.add(key);
    const text = decodeTypography(decodeEntities(m[3].replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ").trim();
    out.push({ text: text.slice(0, 120), href: key });
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}

export async function readSource(url, { fetchImpl = fetch, timeoutMs = 30000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/pdf;q=0.9,*/*;q=0.8" },
    });
    const type = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    const isPdf = /pdf/i.test(type) || buf.subarray(0, 5).toString() === "%PDF-";
    const html = isPdf ? "" : buf.toString("utf8");
    const text = isPdf ? pdfToText(buf) : htmlToText(html);
    const links = isPdf ? [] : extractLinks(html, res.url || url);
    return { url, status: res.status, finalUrl: res.url || url, type, text, links };
  } catch (e) {
    return { url, status: null, finalUrl: null, type: null, text: `[fetch failed: ${e.name === "AbortError" ? "timeout" : e.message}]`, links: [] };
  } finally {
    clearTimeout(timer);
  }
}

export function renderSource(r) {
  const cap = /pdf/i.test(r.type ?? "") ? MAX_PDF_CHARS : MAX_CHARS;
  const body = r.text.length > cap ? `${r.text.slice(0, cap)}\n[… truncated at ${cap} characters]` : r.text;
  return [
    `===== SOURCE ${r.url}`,
    `status: ${r.status ?? "none"} · final: ${r.finalUrl ?? "—"} · type: ${r.type ?? "—"} · read: ${new Date().toISOString()}`,
    "",
    body,
    ...((r.links ?? []).length
      ? ["", `----- LINKS (${r.links.length}${r.links.length >= MAX_LINKS ? `, capped at ${MAX_LINKS}` : ""})`, ...r.links.map((l) => `- ${l.text || "(no text)"} → ${l.href}`)]
      : []),
    `===== END ${r.url}`,
    "",
  ].join("\n");
}

function ipv6Words(address) {
  if (isIP(address) !== 6 || address.includes("%")) return null;
  const expand = part => part ? part.split(":").flatMap(word => {
    if (!word.includes(".")) return [Number.parseInt(word, 16)];
    const bytes = word.split(".").map(Number);
    return [bytes[0] * 256 + bytes[1], bytes[2] * 256 + bytes[3]];
  }) : [];
  const parts = address.split("::");
  const left = expand(parts[0]);
  if (parts.length === 1) return left.length === 8 ? left : null;
  const right = expand(parts[1]);
  return [...left, ...Array(8 - left.length - right.length).fill(0), ...right];
}

/** Conservative public-address validation, not proof of universal routability. */
export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2))))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113));
  }
  if (family === 6) {
    // Numeric words make compressed/expanded/zero-padded spellings identical.
    // Accept native global-unicast space conservatively, excluding the IETF
    // special-purpose block, documentation, 6to4 and retired 6bone space.
    const words = ipv6Words(address);
    if (!words || (words[0] & 0xe000) !== 0x2000) return false;
    return !(words[0] === 0x2001 && (words[1] <= 0x01ff || words[1] === 0x0db8))
      && ![0x2002, 0x3ffe, 0x3fff].includes(words[0]);
  }
  return false;
}

const sensitiveParameter = /key|token|secret|password|signature|credential|session|auth/i;
function publicUrl(raw) {
  const url = new URL(raw);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (url.href.length > 8192 || url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw Error("Archive accepts credential-free public HTTPS URLs on the standard port only");
  }
  if (!host.includes(".") && !isIP(host)
    || /(?:^|\.)(?:localhost|local|internal|home|test|invalid|example)$/.test(host)
    || [...url.searchParams.keys()].some(key => sensitiveParameter.test(key))) {
    throw Error("Archive refused a non-public or credential-bearing source URL");
  }
  url.hash = "";
  return url;
}

function redactedUrl(raw) {
  try {
    const url = new URL(raw);
    url.username = ""; url.password = ""; url.search = ""; url.hash = "";
    return url.href;
  } catch { return "[refused source URL]"; }
}

function withAbort(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(Error("source timeout"));
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export async function validateArchiveUrl(raw, { lookupImpl = lookup, signal = new AbortController().signal } = {}) {
  const url = publicUrl(raw);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }]
    : await withAbort(Promise.resolve(lookupImpl(host, { all: true, verbatim: true })), signal);
  if (!Array.isArray(addresses) || !addresses.length || addresses.some(record => !isPublicAddress(record.address))) {
    throw Error("Archive refused a private, reserved or unresolved source address");
  }
  return { url, addresses };
}

export function decodeArchiveBody(body, encoding = "identity", maxBytes = MAX_ARCHIVE_BODY_BYTES) {
  if (!Buffer.isBuffer(body) || body.length > maxBytes) throw Error("source body exceeds archive byte limit");
  const options = { maxOutputLength: maxBytes };
  let decoded = body;
  if (encoding === "gzip") decoded = gunzipSync(body, options);
  else if (encoding === "deflate") decoded = inflateSync(body, options);
  else if (encoding === "br") decoded = brotliDecompressSync(body, options);
  else if (encoding !== "identity") throw Error("unsupported source content encoding");
  if (decoded.length > maxBytes) throw Error("decoded source body exceeds archive byte limit");
  return decoded;
}

// The HTTPS transport pins the previously checked address set via lookup.
// It never sends credentials/cookies, follows redirects, or uses proxy env vars.
export function requestArchiveBody(url, { addresses, signal, maxBytes = MAX_ARCHIVE_BODY_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(url, {
      method: "GET", signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/pdf;q=0.9,*/*;q=0.8", "accept-encoding": "identity" },
      lookup: (_hostname, options, callback) => {
        const selected = options.family ? addresses.filter(item => item.family === options.family) : addresses;
        if (!selected.length) return callback(Error("No validated source address for requested family"));
        if (options.all) callback(null, selected);
        else callback(null, selected[0].address, selected[0].family);
      },
    }, res => {
      const headers = {};
      for (const name of ["content-type", "content-length", "content-encoding", "content-range", "etag", "last-modified", "location"]) {
        const value = res.headers[name];
        if (typeof value === "string") headers[name] = value;
      }
      const status = res.statusCode ?? 0;
      // Redirect bodies are not needed. The next URL is validated before GET.
      if ([301, 302, 303, 307, 308].includes(status)) {
        res.destroy();
        resolve({ status, headers, body: Buffer.alloc(0) });
        return;
      }
      if (Number(headers["content-length"]) > maxBytes) {
        res.destroy(); reject(Error("source body exceeds archive byte limit")); return;
      }
      const chunks = [];
      let bytes = 0;
      res.on("data", chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) res.destroy(Error("source body exceeds archive byte limit"));
        else chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => {
        try {
          const wireBody = Buffer.concat(chunks);
          const encoding = (headers["content-encoding"] ?? "identity").toLowerCase().trim();
          const body = decodeArchiveBody(wireBody, encoding, maxBytes);
          resolve({ status, headers, body });
        } catch (error) { reject(error); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function wafPage(html, text) {
  return /<title\b[^>]*>\s*(?:just a moment|attention required|access denied|forbidden|request rejected|error\s*403)\b/i.test(html)
    || (text.length < 2000 && /cf-chl-|challenge-platform|_Incapsula_Resource|the requested url was rejected|verify (?:that )?you are (?:a )?human/i.test(html));
}

function unusableHtmlReasons(html, text) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const markup = html.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, "");
  const reasons = [];
  if (wafPage(html, text)) reasons.push("html-access-challenge");
  if (/\b(?:404|page (?:was )?not found|page (?:is )?(?:unavailable|does not exist)|content not found)\b/i.test(title)
    || text.length < 2000 && /\b(?:the page you (?:requested|are looking for) (?:could not be found|does not exist)|sorry[,]? (?:this|that) page (?:does not exist|could not be found))\b/i.test(text)) reasons.push("html-soft-404");
  if (/\b(?:log[ -]?in|sign[ -]?(?:in|on))\b/i.test(title)
    || text.length < 3000 && /<input\b[^>]*\btype\s*=\s*["']?password\b/i.test(markup)) reasons.push("html-authentication-shell");
  if (text.length < 2000 && /(?:enable|turn on|requires?|need(?:s)?|must (?:be )?enabled)[^<\n.]{0,60}javascript|javascript[^<\n.]{0,60}(?:disabled|enable|turn on|required)/i.test(markup)
    || text.length < 300 && /<(?:div|main)\b[^>]*\bid\s*=\s*(["'])(?:root|app|__next|__nuxt)\1[^>]*>\s*<\/(?:div|main)>/i.test(markup) && /<script\b/i.test(html)) reasons.push("html-javascript-shell");
  return reasons;
}

function parserIdentity(html, pdf) {
  return { sourceReader: SOURCE_READER_VERSION, sourceReaderSha256: SOURCE_READER_SHA256,
    localModuleSha256: EXTRACTION_SOURCE_SHA256, extractionBundleSha256: EXTRACTION_BUNDLE_SHA256,
    html, pdf, node: process.version };
}

function pdfVersion() {
  const run = spawnSync("pdftotext", ["-v"], { encoding: "utf8", maxBuffer: 128 * 1024, timeout: 2000 });
  return run.status === 0 ? `${run.stdout ?? ""}${run.stderr ?? ""}`.split(/\r?\n/)[0].trim() : "unavailable";
}

/** Optional public-source evidence capture; no source is published or typed into site data. */
export async function readArchiveSource(rawUrl, {
  lookupImpl = lookup, requestImpl = requestArchiveBody, timeoutMs = 30000,
  pdfTextImpl = (body, { timeoutMs }) => pdfToText(body, { maxBuffer: MAX_ARCHIVE_TEXT_BYTES, timeout: timeoutMs }),
  pdfVersionImpl = pdfVersion, maxBytes = MAX_ARCHIVE_BODY_BYTES,
} = {}) {
  const started = Date.now();
  const readStartedAt = new Date().toISOString();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let requested = redactedUrl(rawUrl);
  let current = requested;
  const redirects = [];
  try {
    requested = publicUrl(rawUrl).href;
    current = requested;
    let response;
    for (let hops = 0; ; hops++) {
      const validated = await validateArchiveUrl(current, { lookupImpl, signal: ctrl.signal });
      response = await withAbort(Promise.resolve(requestImpl(validated.url, { addresses: validated.addresses, signal: ctrl.signal, maxBytes })), ctrl.signal);
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      if (hops >= MAX_ARCHIVE_REDIRECTS || !response.headers.location) throw Error("source redirect limit or missing location");
      const next = publicUrl(new URL(response.headers.location, current).href).href;
      redirects.push({ from: current, to: next, status: response.status });
      current = next;
    }
    if (!Buffer.isBuffer(response.body) || response.body.length > maxBytes) throw Error("invalid or oversized source body");
    const body = response.body;
    const type = response.headers["content-type"] ?? "";
    const isPdf = body.subarray(0, 5).toString() === "%PDF-";
    const html = isPdf ? "" : body.toString("utf8");
    const format = isPdf ? "pdf" : /html/i.test(type) || /<(?:!doctype\s+html|html|body|article|main)\b/i.test(html) ? "html" : "bin";
    const remaining = Math.max(1, timeoutMs - (Date.now() - started));
    let text = isPdf ? pdfTextImpl(body, { timeoutMs: remaining }) : format === "html" ? htmlToText(html) : "";
    const reasons = [];
    const transportComplete = response.status !== 206 && !response.headers["content-range"];
    if (response.status !== 200) reasons.push(`http-${response.status}`);
    if (!transportComplete) reasons.push("partial-response");
    if (!body.length) reasons.push("empty-body");
    if (format === "bin") reasons.push("unsupported-content-format");
    if (/pdf/i.test(type) && !isPdf) reasons.push("pdf-content-mismatch");
    if (format === "html") reasons.push(...unusableHtmlReasons(html, text));
    if (format === "html" && /charset\s*=\s*["']?(?!utf-?8\b|us-ascii\b)[\w-]+/i.test(type)) reasons.push("unsupported-html-charset");
    if (format === "html") {
      try { new TextDecoder("utf-8", { fatal: true }).decode(body); }
      catch { reasons.push("invalid-utf8-html"); }
    }
    if (typeof text !== "string" || /^\[pdftotext failed:/i.test(text)) reasons.push("extraction-failed");
    if (typeof text !== "string") text = "";
    if (Buffer.byteLength(text) > MAX_ARCHIVE_TEXT_BYTES) { text = ""; reasons.push("derived-text-byte-limit"); }
    if (!text.trim()) reasons.push("empty-extracted-text");
    const links = format === "html" ? extractLinks(html, current) : [];
    const headers = {};
    for (const key of ["content-type", "content-length", "content-encoding", "content-range", "etag", "last-modified"]) {
      if (typeof response.headers[key] === "string") headers[key] = response.headers[key];
    }
    return {
      url: requested, status: response.status, finalUrl: current, type, text, links,
      capture: { body, format, readStartedAt, fetchedAt: new Date().toISOString(), headers, redirects,
        transportComplete, extractionComplete: !reasons.some(reason => /^(?:extraction-failed|derived-text-byte-limit|unsupported-content-format|invalid-utf8-html|unsupported-html-charset|empty-extracted-text)$/.test(reason)),
        contentUsability: reasons.length === 0 ? "readable-output" : "unusable-or-review-required", reviewRequired: true,
        complete: reasons.length === 0, incompleteReasons: reasons,
        bodyRepresentation: "HTTP-decoded response-body bytes; not compressed wire bytes",
        parserVersions: parserIdentity(format === "html" ? `${HTML_EXTRACTOR_VERSION}; UTF-8 decode` : null, isPdf ? pdfVersionImpl() : null) },
    };
  } catch (error) {
    return { url: requested, status: null, finalUrl: null, type: null,
      text: `[archive fetch failed: ${ctrl.signal.aborted ? "timeout" : error.message}]`, links: [],
      capture: { body: null, format: "bin", readStartedAt, fetchedAt: null, headers: {}, redirects, complete: false,
        transportComplete: false, extractionComplete: false, contentUsability: "unusable-or-review-required", reviewRequired: true,
        incompleteReasons: [ctrl.signal.aborted ? "timeout" : "fetch-or-policy-failed"],
        bodyRepresentation: "HTTP-decoded response-body bytes; not compressed wire bytes",
        parserVersions: parserIdentity(null, null) } };
  } finally { clearTimeout(timer); }
}

/** A fresh fixed child of runner temp only; refuse existing paths/symlinks. */
export function createSourceArchive(runnerTemp = tmpdir()) {
  if (resolve(runnerTemp) !== runnerTemp || lstatSync(runnerTemp).isSymbolicLink()) throw Error("Archive runner temp must be an absolute non-symlink directory");
  const parent = realpathSync(runnerTemp);
  if (!lstatSync(parent).isDirectory()) throw Error("Archive parent must be a real runner temporary directory");
  const directory = join(parent, ARCHIVE_DIRECTORY);
  mkdirSync(directory, { mode: 0o700 }); // no recursive/overwrite: EEXIST also rejects symlinks
  if (lstatSync(directory).isSymbolicLink() || realpathSync(directory) !== directory) throw Error("Unsafe archive output directory");
  const records = [];
  let totalBytes = 0;
  const put = (name, content) => {
    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) throw Error("Unsafe source archive filename");
    if (realpathSync(directory) !== directory || lstatSync(directory).isSymbolicLink()) throw Error("Archive output directory changed");
    writeFileSync(join(directory, name), content, { flag: "wx", mode: 0o600 });
  };
  return {
    directory,
    add(result) {
      if (records.length >= MAX_URLS) throw Error("Archive URL limit exceeded");
      const capture = result.capture;
      if (!capture || (capture.body !== null && !Buffer.isBuffer(capture.body))) throw Error("Invalid source capture");
      const text = Buffer.from(result.text ?? "", "utf8");
      const links = Buffer.from(JSON.stringify(result.links ?? [], null, 2) + "\n");
      const body = capture.body;
      const size = (body?.length ?? 0) + text.length + links.length;
      const reasons = [...capture.incompleteReasons];
      const withinBounds = (body?.length ?? 0) <= MAX_ARCHIVE_BODY_BYTES && text.length <= MAX_ARCHIVE_TEXT_BYTES
        && totalBytes + size <= MAX_ARCHIVE_BATCH_BYTES - MAX_ARCHIVE_MANIFEST_BYTES;
      if (!withinBounds) reasons.push("archive-batch-or-file-byte-limit");
      const base = `${String(records.length + 1).padStart(2, "0")}-${sha256(result.url).slice(0, 16)}`;
      const files = withinBounds ? { body: body ? `${base}.response.${capture.format}` : null, text: `${base}.text.txt`, links: `${base}.links.json` } : {};
      if (withinBounds) {
        if (body) put(files.body, body);
        put(files.text, text); put(files.links, links);
        totalBytes += size;
      }
      const record = { requestedUrl: result.url, finalUrl: result.finalUrl, status: result.status, type: result.type,
        ...capture, body: undefined, complete: capture.complete && withinBounds, incompleteReasons: reasons, files,
        bodyBytes: body?.length ?? null, bodySha256: body ? sha256(body) : null,
        textBytes: text.length, textSha256: sha256(text), linksBytes: links.length, linksSha256: sha256(links) };
      records.push(record);
      return withinBounds;
    },
    finish(summary = {}) {
      const manifest = { schemaVersion: 1, purpose: "Manual public-source evidence only; not verified site data or publication",
        createdAt: new Date().toISOString(), bodyRepresentation: "HTTP-decoded response-body bytes; not compressed wire bytes",
        extractionPolicy: "Full uncapped output of existing deterministic article/main/body HTML reduction or pdftotext -layout, within recorded byte limits; links capped at 80; raw body retained separately",
        limits: { urls: MAX_URLS, bodyBytes: MAX_ARCHIVE_BODY_BYTES, textBytes: MAX_ARCHIVE_TEXT_BYTES, batchBytes: MAX_ARCHIVE_BATCH_BYTES },
        totalFileBytes: totalBytes, ...summary, records };
      const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
      if (bytes.length > MAX_ARCHIVE_MANIFEST_BYTES || totalBytes + bytes.length > MAX_ARCHIVE_BATCH_BYTES) throw Error("Archive manifest exceeds total batch bound");
      put("manifest.json", bytes);
      return manifest;
    },
  };
}

async function main() {
  const { urls, refused, dropped } = parseUrls(process.env.SOURCE_URLS);
  const archive = process.env.SOURCE_ARCHIVE === "1" ? createSourceArchive(process.env.RUNNER_TEMP || tmpdir()) : null;
  for (const r of refused) console.log(archive ? "::warning title=Refused::not a public HTTPS source URL (input not echoed)" : `::warning title=Refused::not an https URL: ${r}`);
  if (dropped) console.log(`::warning title=Capped::${dropped} URL(s) beyond the first ${MAX_URLS} were not read`);
  if (!urls.length) {
    console.log("::error title=No URLs::SOURCE_URLS held no https URL");
    process.exit(1);
  }
  let attempted = 0;
  for (const u of urls) {
    const result = archive ? await readArchiveSource(u) : await readSource(u);
    attempted++;
    if (archive) {
      // Public HTML is untrusted input, not an Actions workflow command.
      const logToken = randomUUID();
      console.log(`::stop-commands::${logToken}`);
      console.log(renderSource(result)); // the original deliberate caps remain
      console.log(`::${logToken}::`);
    } else console.log(renderSource(result));
    if (archive && !archive.add(result)) break;
  }
  if (archive) {
    const manifest = archive.finish({ attempted, refusedCount: refused.length, droppedCount: dropped, notAttempted: urls.length - attempted });
    console.log(`[source-archive] ${manifest.records.length} public source attempt(s); evidence complete=${manifest.records.filter(record => record.complete).length}; files=${manifest.totalFileBytes} B. No canonical data changed.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
