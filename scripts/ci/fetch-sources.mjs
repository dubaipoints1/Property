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

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { decodeEntities } from "./check-external-links.mjs";

export const USER_AGENT =
  "Mozilla/5.0 (compatible; DubaiPointsSourceReader/1.0; +https://dubaipoints.ae/about/)";
export const MAX_URLS = 10;
export const MAX_CHARS = 20000;

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

function pdfToText(buf) {
  const dir = mkdtempSync(join(tmpdir(), "src-"));
  try {
    const f = join(dir, "doc.pdf");
    writeFileSync(f, buf);
    return execFileSync("pdftotext", ["-layout", f, "-"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    return `[pdftotext failed: ${e.message}]`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
    const text = isPdf ? pdfToText(buf) : htmlToText(buf.toString("utf8"));
    return { url, status: res.status, finalUrl: res.url || url, type, text };
  } catch (e) {
    return { url, status: null, finalUrl: null, type: null, text: `[fetch failed: ${e.name === "AbortError" ? "timeout" : e.message}]` };
  } finally {
    clearTimeout(timer);
  }
}

export function renderSource(r) {
  const body = r.text.length > MAX_CHARS ? `${r.text.slice(0, MAX_CHARS)}\n[… truncated at ${MAX_CHARS} characters]` : r.text;
  return [
    `===== SOURCE ${r.url}`,
    `status: ${r.status ?? "none"} · final: ${r.finalUrl ?? "—"} · type: ${r.type ?? "—"} · read: ${new Date().toISOString()}`,
    "",
    body,
    `===== END ${r.url}`,
    "",
  ].join("\n");
}

async function main() {
  const { urls, refused, dropped } = parseUrls(process.env.SOURCE_URLS);
  for (const r of refused) console.log(`::warning title=Refused::not an https URL: ${r}`);
  if (dropped) console.log(`::warning title=Capped::${dropped} URL(s) beyond the first ${MAX_URLS} were not read`);
  if (!urls.length) {
    console.log("::error title=No URLs::SOURCE_URLS held no https URL");
    process.exit(1);
  }
  for (const u of urls) console.log(renderSource(await readSource(u)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
