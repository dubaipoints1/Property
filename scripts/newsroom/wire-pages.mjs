// Local discovery-only adapters. Read fixed public surfaces; return only a
// publisher URL, fixed review label and digest of meaningful visible fields.
import { createHash } from "node:crypto";
import { decodeTypography, requestArchiveBody, validateArchiveUrl } from "../ci/fetch-sources.mjs";
import { xmlText } from "../news-monitor/_xml.mjs";
import { SOURCES } from "./wire-sources.mjs";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_FIELDS = 120;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const MASK = /<!--[\s\S]*?-->|<(script|style|noscript|template|svg|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const TAG = String.raw`<(\/?)([a-z][a-z0-9:-]*)\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>`;

const clean = text => xmlText(decodeTypography(text.replace(
  /<\/?(?:h[1-6]|p|li|ol|ul|br|hr|div|section|tr|td|table|dt|dd)\b[^>]*>/gi, " "
))).replace(/[\s\u00a0]+/g, " ").trim().normalize("NFC");

function attr(markup, name) {
  // Tokenise attribute names so e.g. data-class cannot masquerade as class.
  for (const m of markup.matchAll(/\s+([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+)))?/g)) {
    if (m[1].toLowerCase() === name) return m[2] ?? m[3] ?? m[4] ?? "";
  }
  return null;
}
const hasClass = (attrs, which) => (attr(attrs, "class") ?? "").split(/\s+/).includes(which);

function elements(html, tag, choose = () => true) {
  const results = [], pending = [];
  for (const m of html.matchAll(new RegExp(TAG, "gi"))) {
    if (m[2].toLowerCase() !== tag) continue;
    if (m[1]) {
      const start = pending.pop();
      if (start?.use) results.push({ attrs: start.attrs, inner: html.slice(start.bodyStart, m.index),
        start: start.index, end: m.index + m[0].length });
      continue;
    }
    const use = choose(m[3]);
    if (!m[3].trimEnd().endsWith("/")) {
      pending.push({ index: m.index, use, attrs: m[3], bodyStart: m.index + m[0].length });
    } else if (use) return null;
  }
  if (pending.some(start => start.use) || results.length > MAX_FIELDS) return null;
  return results.sort((a, b) => a.start - b.start);
}

function articlePath(raw, base, allowedPath) {
  if (!raw) return null;
  try {
    const u = new URL(clean(raw), base);
    if (u.origin !== base.origin || u.username || u.password || !allowedPath.test(u.pathname)) return null;
    return u.pathname.replace(/\/$/, "");
  } catch { return null; }
}

function stableUnique(pairs, minimum) {
  const map = new Map();
  for (const [key, value] of pairs) {
    if (!key || !value || value.length > 8000 || (map.has(key) && map.get(key) !== value)) return null;
    map.set(key, value);
  }
  return map.size >= minimum && map.size <= MAX_FIELDS ?
    [...map].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0) : null;
}

function newsroom(html, base, moduleClass, headingClass, routePattern, heading) {
  const modules = elements(html, "div", a => hasClass(a, moduleClass));
  if (modules?.length !== 1) return null;
  const heads = elements(modules[0].inner, "h2");
  if (heads?.filter(h => clean(h.inner) === heading).length !== 1) return null;
  const anchors = elements(modules[0].inner, "a"), rows = [];
  if (!anchors) return null;
  for (const a of anchors) {
    const titles = elements(a.inner, "h3", x => hasClass(x, headingClass));
    if (!titles || titles.length > 1) return null;
    if (titles.length) rows.push([articlePath(attr(a.attrs, "href"), base, routePattern), clean(titles[0].inner)]);
  }
  return stableUnique(rows, 2);
}

function fabOffers(html, base) {
  const heads = elements(html, "h1");
  if (heads?.filter(h => clean(h.inner) === "A fantastic range of offers for our FAB customers").length !== 1) return null;
  const cards = elements(html, "a", x => hasClass(x, "offer-card-grid-item"));
  if (!cards?.length) return null;
  return stableUnique(cards.map(card => [
    articlePath(attr(card.attrs, "href"), base, /^\/en-ae\/personal\/credit-cards\/offers\/[a-z0-9-]+\/?$/i),
    clean(card.inner),
  ]), 3);
}

function airRewards(html) {
  const titles = elements(html, "h1", x => hasClass(x, "field-title"))
    ?.filter(h => clean(h.inner) === "AirRewards Terms and Conditions");
  if (titles?.length !== 1) return null;
  const fields = elements(html, "div", x => hasClass(x, "field-content"));
  // CMS places the rules in the field-content element immediately after H1.
  const field = fields?.find(x => x.start >= titles[0].end && !html.slice(titles[0].end, x.start).trim());
  const text = field?.inner && clean(field.inner);
  if (!field || !/^\s*<ol\b/i.test(field.inner) ||
    !text || text.length < 500 || text.length > 50000 ||
    !/^General AirRewards is a Loyalty Program/i.test(text) || !/Changes to Program Rules/i.test(text)) return null;
  return [text];
}

function skywards(html) {
  const heads = elements(html, "h1");
  if (heads?.filter(h => /^Emirates Skywards Program(?:me)? Updates$/i.test(clean(h.inner))).length !== 1) return null;
  const sections = elements(html, "div", x => hasClass(x, "enhanced-text-section"));
  if (!sections?.length) return null;
  const rows = [];
  for (const section of sections) {
    const titles = elements(section.inner, "span", x => hasClass(x, "enhanced-text-title__title"));
    const copy = elements(section.inner, "div", x => hasClass(x, "enhanced-text-section__text--latest"));
    if (titles?.length !== 1 || copy?.length !== 1) return null;
    rows.push([clean(titles[0].inner), clean(copy[0].inner)]);
  }
  return stableUnique(rows, 2);
}

function ghaUpdates(html) {
  const titles = elements(html, "h1", a => hasClass(a, "title-program"))
    ?.filter(h => /^A quick tour of what['’]s new$/i.test(clean(h.inner)));
  if (titles?.length !== 1) return null;
  const heads = elements(html, "h2", a => hasClass(a, "text-primary"));
  const fields = elements(html, "div", a =>
    hasClass(a, "ez-richtext-container") && hasClass(a, "table-richtext"));
  if (!heads?.length || !fields) return null;
  const rows = [];
  for (const h of heads) {
    // Exclude navigation and the intro: only same-template rich text
    // directly adjacent to a programme update heading is monitored.
    if (h.start <= titles[0].start) continue;
    const copy = fields.find(x => x.start >= h.end && !html.slice(h.end, x.start).trim());
    if (!copy) return null;
    rows.push([clean(h.inner), clean(copy.inner)]);
  }
  return stableUnique(rows, 3);
}

const adapters = new Map([
  ["emirates-press", ["Emirates newsroom: check published headlines", (html, base) => newsroom(
    html, base, "pp-headline-tiles__latest-stories", "pp-tile-item-heading", /^\/media-centre\/[a-z0-9-]+\/?$/i, "Latest Stories")]],
  ["air-arabia-press", ["Air Arabia newsroom: check published headlines", (html, base) => newsroom(
    html, base, "pp-headline-block__more-news", "pp-block-item-heading", /^\/[a-z0-9-]+\/?$/i, "More News")]],
  ["fab-offers", ["FAB offer cards: check issuer changes", fabOffers]],
  ["airrewards-terms", ["AirRewards programme terms: check official changes", airRewards]],
  ["skywards-updates", ["Skywards programme notices: check official changes", skywards]],
  ["gha-updates", ["GHA DISCOVERY programme notices: check official changes", ghaUpdates]],
]);
export const PAGE_IDS = Object.freeze([...adapters.keys()]);

export async function probeOfficialPage(sourceId, { validate = validateArchiveUrl, request = requestArchiveBody,
  clock = () => new Date().toISOString() } = {}) {
  const source = SOURCES.find(x => x.id === sourceId && x.method === "manual"), adapter = adapters.get(sourceId);
  if (!source || !adapter) throw new Error("Expected a registered official page adapter.");
  const base = new URL(source.url), narrow = url => url.origin === base.origin && !url.username && !url.password &&
    !url.search && url.pathname.replace(/\/$/, "") === base.pathname.replace(/\/$/, "");
  const signal = AbortSignal.timeout(12_000);
  const report = (status, items, detail) => ({ sourceId, surfaceUrl: source.url, observedAt: clock(), status, items, detail });
  const gap = detail => report("gap", [], detail);
  let current = base.href;
  try {
    for (let redirects = 0; redirects <= 2; redirects++) {
      const { url, addresses } = await validate(current, { signal });
      if (!narrow(url)) return gap("Official page route identity changed.");
      const { status, headers, body } = await request(url, { addresses, signal, maxBytes: MAX_BYTES });
      if (REDIRECTS.has(status)) {
        if (!headers.location || redirects === 2) return gap("Official page redirect unavailable or over limit.");
        const next = new URL(headers.location, url);
        if (!narrow(next)) return gap("Official page redirect changed route identity.");
        next.hash = "";
        current = next.href;
        continue;
      }
      if (status !== 200 || headers["content-range"] ||
        !/^text\/html(?:[;\s]|$)/i.test(headers["content-type"] ?? "") ||
        !Buffer.isBuffer(body) || !body.length || body.length > MAX_BYTES) return gap("Official page did not return complete bounded HTML.");
      const html = new TextDecoder("utf-8", { fatal: true }).decode(body);
      if (!/<html\b/i.test(html) || !/<\/html\s*>\s*$/i.test(html) ||
        /<title\b[^>]*>\s*(?:just a moment|access denied|attention required|forbidden|404\b|page not found)/i.test(html)) {
        return gap("Official page incomplete, blocked or not the expected surface.");
      }
      const visible = html.replace(MASK, "");
      if (/<!--|<\/?(?:script|style|noscript|template|svg|nav)\b/i.test(visible)) {
        return gap("Official page contains incomplete or ambiguous non-content markup.");
      }
      const scoped = adapter[1](visible, base);
      if (!scoped?.length) return gap("Official page structure missing, empty, inconsistent or changed.");
      const digest = createHash("sha256").update(JSON.stringify(scoped)).digest("hex");
      return report("usable", [{ url: source.url, title: adapter[0], note: `Scoped HTML SHA-256: ${digest}` }],
        "Official page fingerprint only; read original source and linked terms before commissioning.");
    }
  } catch {
    return gap(signal.aborted ? "Official page timed out." : "Official page transport, decoding or structure failed.");
  }
  return gap("Official page redirect unavailable or over limit.");
}
