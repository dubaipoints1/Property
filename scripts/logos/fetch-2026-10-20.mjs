// Logo fetch for the 2026-10-20 Charter amendment ("Real brands in
// pictures"). Runs in GitHub Actions only: the web sandbox cannot reach
// Wikimedia or company websites.
//
// Reads scripts/logos/2026-10-20.json:
//   discover: [{ key, commons?: "search terms", site?: "https://..." }]
//     Prints Commons File: search hits (with licence) and <img>/<link>
//     candidates from the company's homepage that look like a logo. Pure
//     read; writes nothing. Used to find exact asset URLs by hand.
//   fetch: [{ path: "public/logos/partners/x.svg", url }]
//     Downloads each asset, checks the bytes really are SVG/PNG/WebP and
//     that the extension matches, and writes it. A failure is reported and
//     the rest continue; the step exits non-zero only if every fetch failed.
//
// Nothing here edits, recolours or redraws a mark: bytes are written as
// served. Every committed file is logged in public/logos/LICENSES.md.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 DubaiPointsLogoFetch/1.0 (+https://dubaipoints.ae)";
const cfg = JSON.parse(await readFile("scripts/logos/2026-10-20.json", "utf8"));

async function get(url, asText = true) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return asText ? r.text() : Buffer.from(await r.arrayBuffer());
}

async function commons(q) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: q,
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiextmetadatafilter: "LicenseShortName|DateTimeOriginal",
  }).forEach(([k, v]) => api.searchParams.set(k, v));
  const j = JSON.parse(await get(api.toString()));
  const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo?.[0] ?? {};
    const lic = ii.extmetadata?.LicenseShortName?.value ?? "?";
    console.log(`  C ${p.title} | ${ii.mime} ${ii.width}x${ii.height} | ${lic} | ${ii.url}`);
  }
  if (!pages.length) console.log("  C (no Commons hits)");
}

async function site(url, showInline = false) {
  const html = await get(url);
  const seen = new Set();
  const re = /(?:src|href|data-src|content|srcset)=["']([^"' ]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    const v = m[1];
    if (!/logo/i.test(v) && !/\.svg(\?|$)/i.test(v)) continue;
    let abs;
    try {
      abs = new URL(v, url).toString();
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);
    if (seen.size > 25) break;
    console.log(`  S ${abs}`);
  }
  const inline = inlineSvgs(html);
  console.log(`  S (${seen.size} candidates; ${inline.length} inline <svg>; html ${html.length} bytes)`);
  if (showInline) {
    inline.slice(0, 12).forEach((s, i) => {
      const open = s.match(/^<svg[^>]*>/i)[0].replace(/\s+/g, " ");
      const fills = [...new Set((s.match(/fill="#[0-9a-f]{3,6}"/gi) || []))].slice(0, 4).join(",");
      console.log(`  I[${i}] ${s.length}b ${open.slice(0, 160)} ${fills}`);
    });
  }
}

// Inline <svg> elements in page order, each sliced verbatim from the HTML
// (nested <svg> handled by depth counting). Used for header logos that a
// site ships inline rather than as a file.
function inlineSvgs(html) {
  const out = [];
  const re = /<\/?svg\b[^>]*>/gi;
  let depth = 0;
  let start = -1;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] !== "/") {
      if (depth === 0) start = m.index;
      if (!m[0].endsWith("/>")) depth++;
    } else if (depth > 0 && --depth === 0) {
      out.push(html.slice(start, m.index + m[0].length));
    }
  }
  return out;
}

for (const d of cfg.discover ?? []) {
  console.log(`\n=== ${d.key}`);
  if (d.commons) await commons(d.commons).catch((e) => console.log(`  C error: ${e.message}`));
  if (d.site) await site(d.site, d.inline).catch((e) => console.log(`  S error: ${e.message}`));
}

function sniff(buf) {
  const head = buf.subarray(0, 16).toString("latin1");
  if (buf[0] === 0x89 && head.slice(1, 4) === "PNG") return "png";
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return "webp";
  if (/<svg[\s>]/i.test(buf.toString("utf8", 0, Math.min(buf.length, 8192)))) return "svg";
  return null;
}

let ok = 0;
let failed = 0;
for (const f of cfg.fetch ?? []) {
  try {
    if (!/^public\/logos\/(partners|banks|airlines)\/[a-z0-9-]+\.(svg|png|webp)$/.test(f.path))
      throw new Error(`bad path ${f.path}`);
    let buf;
    if (f.inlineFrom) {
      // A header logo shipped inline in the page: the <svg> element is taken
      // verbatim. Only an xmlns is added when the page omitted it (inline
      // HTML does not need one; a standalone file does) — no path, colour
      // or geometry is touched.
      let svg = inlineSvgs(await get(f.inlineFrom))[f.index];
      if (!svg) throw new Error(`no inline svg #${f.index}`);
      if (!/xmlns=/.test(svg.match(/^<svg[^>]*>/i)[0]))
        svg = svg.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      buf = Buffer.from(svg, "utf8");
    } else {
      buf = await get(f.url, false);
    }
    const kind = sniff(buf);
    const ext = f.path.split(".").pop();
    if (kind !== ext) throw new Error(`content is ${kind ?? "unknown"}, path wants ${ext}`);
    await mkdir(dirname(f.path), { recursive: true });
    await writeFile(f.path, buf);
    console.log(`OK   ${f.path} (${buf.length} bytes) <- ${f.url ?? `${f.inlineFrom} inline #${f.index}`}`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${f.path} <- ${f.url}: ${e.message}`);
    failed++;
  }
}
console.log(`\nfetched ${ok}, failed ${failed}`);
if (failed && !ok) process.exit(1);
