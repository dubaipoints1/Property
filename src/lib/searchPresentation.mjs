/**
 * Presentation only: Pagefind remains the sole source of search results.
 * API contract: https://pagefind.app/docs/api/ (search + result.data()).
 * No financial values, index, analytics events or query storage live here.
 */
export const SEARCH_GROUPS = [
  { id: "cards", label: "Cards & banks" },
  { id: "programmes", label: "Programmes" },
  { id: "news", label: "News" },
  { id: "tools", label: "Tools" },
  { id: "guides", label: "Guides" },
  { id: "deals", label: "Deals" },
  { id: "publication", label: "About DubaiPoints" },
];

export function normaliseSearchQuery(value = "") {
  return String(value).trim().replace(/\s+/g, " ").slice(0, 160);
}

/** Only link to the publication, including when testing a local index. */
export function searchResultHref(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, "https://dubaipoints.ae");
    if (url.protocol !== "https:" || !["dubaipoints.ae", "www.dubaipoints.ae"].includes(url.hostname) || url.username || url.password || url.port) return null;
    if (!value.startsWith("/") && !value.startsWith("https://")) return null;
    return url.pathname + url.hash;
  } catch { return null; }
}

export function searchGroupForUrl(value) {
  const href = searchResultHref(value);
  if (!href) return null;
  const path = href.split("#")[0];
  // Decision tools sit inside card routes as well as /calculator/.
  if (/^\/(?:calculator|salary-transfer|transfer-finder|valuations)(?:\/|$)/.test(path) ||
      /^\/cards\/(?:finder|compare|fees)(?:\/|$)/.test(path)) return "tools";
  if (/^\/(?:cards|banks)(?:\/|$)/.test(path)) return "cards";
  if (/^\/(?:airlines|hotels)(?:\/|$)/.test(path)) return "programmes";
  if (/^\/news(?:\/|$)/.test(path)) return "news";
  if (/^\/guides(?:\/|$)/.test(path)) return "guides";
  if (/^\/deals(?:\/|$)/.test(path)) return "deals";
  return "publication";
}

/** Excerpts are treated as text, never executable HTML from the index. */
export function searchResultText(value) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
    const point = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : "";
  }).replace(/\s+/g, " ").trim();
}

/**
 * Pagefind supplies section matches, including a possible duplicate page
 * result. Keep only real, distinct heading fragments on that same page.
 * Contract: https://pagefind.app/docs/sub-results/ .
 * @returns {Array<{href: string, title: string, excerpt: string}>}
 */
export function searchSubResults(record) {
  const pageHref = searchResultHref(record?.url);
  if (!pageHref || !Array.isArray(record?.sub_results)) return [];
  const pagePath = pageHref.split("#")[0];
  const pageTitle = searchResultText(record.meta?.title);
  const seen = new Set([pageHref]);
  const results = [];
  for (const section of record.sub_results) {
    const href = searchResultHref(section?.url);
    const title = searchResultText(section?.title);
    if (!href || !href.includes("#") || href.split("#")[0] !== pagePath || seen.has(href) || !title || title === pageTitle) continue;
    seen.add(href);
    results.push({ href, title, excerpt: searchResultText(section.plain_excerpt ?? section.excerpt) });
  }
  return results;
}

/** Keep Pagefind relevance order within each section; never re-rank cards. */
export function groupSearchResults(records) {
  const seen = new Set();
  /** @type {Array<{id: string, label: string, results: Array<{href: string, title: string, excerpt: string, subResults: Array<{href: string, title: string, excerpt: string}>}>}>} */
  const groups = SEARCH_GROUPS.map((group) => ({ ...group, results: [] }));
  for (const record of records) {
    const href = searchResultHref(record?.url);
    if (!href || seen.has(href)) continue;
    const title = searchResultText(record.meta?.title);
    if (!title) continue;
    seen.add(href);
    const group = groups.find((candidate) => candidate.id === searchGroupForUrl(href));
    group?.results.push({ href, title, excerpt: searchResultText(record.plain_excerpt ?? record.excerpt), subResults: searchSubResults(record) });
  }
  return groups.filter((group) => group.results.length);
}

/**
 * Browsers retain failed ES-module imports by URL for the document's life.
 * Retry only an import failure with one of two bounded keys on the SAME
 * index path. Relative Pagefind imports still resolve under /pagefind/.
 * A successful module is reused; search/data errors never advance the key.
 */
export function createPagefindIndexLoader(importModule) {
  const urls = [
    "/pagefind/pagefind.js",
    "/pagefind/pagefind.js?dp-search-retry=1",
    "/pagefind/pagefind.js?dp-search-retry=2",
  ];
  let failedImports = 0;
  let modulePromise;
  return {
    canRetry() { return failedImports < urls.length; },
    load() {
      if (modulePromise) return modulePromise;
      if (failedImports >= urls.length) return Promise.reject(new Error("Reload search to try loading the index again."));
      const url = urls[failedImports];
      modulePromise = Promise.resolve().then(() => importModule(url)).catch((error) => {
        failedImports += 1;
        modulePromise = undefined;
        throw error;
      });
      return modulePromise;
    },
  };
}

/**
 * Cache the real index, retry a failed import, and reject late responses.
 * A superseded request returns null even when its index request fails.
 */
export function createSearchSession(loadIndex) {
  let revision = 0;
  let indexPromise;
  return {
    invalidate() { revision += 1; },
    async search(value) {
      const ticket = ++revision;
      const query = normaliseSearchQuery(value);
      if (!query) return { query, results: [] };
      try {
        if (!indexPromise) indexPromise = Promise.resolve().then(loadIndex).catch((error) => { indexPromise = undefined; throw error; });
        const index = await indexPromise;
        if (ticket !== revision) return null;
        const response = await index.search(query);
        return ticket === revision ? { query, results: response.results } : null;
      } catch (error) {
        if (ticket !== revision) return null;
        throw error;
      }
    },
  };
}
