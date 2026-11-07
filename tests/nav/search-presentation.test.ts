import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPagefindIndexLoader, createSearchSession, groupSearchResults, normaliseSearchQuery, searchGroupForUrl, searchResultHref, searchResultText, searchSubResults } from "../../src/lib/searchPresentation.mjs";

test("search normalises whitespace, preserves exact-phrase quotes, and bounds queries", () => {
  assert.equal(normaliseSearchQuery('  "salary   transfer"  '), '"salary transfer"');
  assert.equal(normaliseSearchQuery("x".repeat(200)).length, 160);
  assert.equal(normaliseSearchQuery(" \n\t "), "");
});

test("search links admit only local publication pages and strip query values", () => {
  assert.equal(searchResultHref("/cards/finder/?salary=5000#results"), "/cards/finder/#results");
  assert.equal(searchResultHref("https://dubaipoints.ae/airlines/skywards/"), "/airlines/skywards/");
  assert.equal(searchResultHref("https://www.dubaipoints.ae/news/"), "/news/");
  for (const value of ["javascript:alert(1)", "//outside.example/x", "https://outside.example/x", "https://dubaipoints.ae@outside.example/x", "https://a@dubaipoints.ae/x", "http://dubaipoints.ae/x", "/\\outside.example/x", "news/"]) {
    assert.equal(searchResultHref(value), null, value);
  }
});

test("grouping covers tools nested under cards, programmes, and all editorial sections", () => {
  const cases = [
    ["/cards/finder/", "tools"], ["/cards/compare/", "tools"], ["/cards/fees/", "tools"],
    ["/salary-transfer/", "tools"], ["/salary-transfer/calculator/", "tools"], ["/calculator/cash-or-miles/", "tools"],
    ["/transfer-finder/", "tools"], ["/valuations/", "tools"], ["/cards/adcb-365/", "cards"],
    ["/banks/adcb/", "cards"], ["/airlines/skywards/", "programmes"], ["/hotels/hilton-honors/", "programmes"],
    ["/news/uae/", "news"], ["/guides/expat-starter/", "guides"], ["/deals/offer/", "deals"], ["/about/", "publication"],
  ];
  for (const [url, group] of cases) assert.equal(searchGroupForUrl(url), group, url);
  assert.equal(searchGroupForUrl("https://outside.example/cards/"), null);
});

test("text presentation decodes entities without passing through HTML", () => {
  assert.equal(searchResultText("Cash &amp; <mark>miles</mark> &#8212; &#x41;"), "Cash & miles — A");
  assert.equal(searchResultText("&#99999999; &#xD800;"), "");
  // Encoded tags remain text, not DOM. The UI assigns this to textContent.
  assert.equal(searchResultText("&lt;img src=x onerror=alert(1)&gt;"), "<img src=x onerror=alert(1)>");
});

test("result grouping keeps Pagefind relevance order within sections, deduplicates canonical URLs and drops unsafe entries", () => {
  const record = (url: string, title: string, excerpt = "A result") => ({ url, meta: { title }, plain_excerpt: excerpt });
  const grouped = groupSearchResults([
    record("/news/one/", "News one"), record("/cards/two/", "Card two"), record("/cards/one/", "Card one"),
    record("https://dubaipoints.ae/cards/two/?unwanted=value", "Duplicate"),
    record("/cards/finder/", "Finder"), record("/airlines/skywards/", "Skywards"),
    record("https://outside.example/", "Unsafe"), record("/guides/empty/", ""),
  ]);
  assert.deepEqual(grouped.map((group) => group.id), ["cards", "programmes", "news", "tools"]);
  assert.deepEqual(grouped[0].results.map((result) => result.title), ["Card two", "Card one"]);
  assert.equal(grouped.flatMap((group) => group.results).length, 5);
});

test("real Pagefind section matches keep heading links/excerpts without repeating the page heading", () => {
  const record = {
    url: "/airlines/skywards/", meta: { title: "Emirates Skywards" }, plain_excerpt: "Page summary",
    sub_results: [
      { title: "Emirates Skywards", url: "/airlines/skywards/", plain_excerpt: "Duplicate page hit" },
      { title: "Emirates Skywards", url: "/airlines/skywards/#main-title", plain_excerpt: "Duplicate h1" },
      { title: "How to earn", url: "/airlines/skywards/#how-to-earn", plain_excerpt: "Earn &amp; transfer miles." },
      { title: "Expiry policy", url: "https://dubaipoints.ae/airlines/skywards/?unwanted=profile#programme-expiry", excerpt: "Miles <mark>expire</mark>." },
      { title: "Duplicate expiry", url: "/airlines/skywards/#programme-expiry", plain_excerpt: "Repeated" },
    ],
  };
  const sections = searchSubResults(record);
  assert.deepEqual(sections, [
    { href: "/airlines/skywards/#how-to-earn", title: "How to earn", excerpt: "Earn & transfer miles." },
    { href: "/airlines/skywards/#programme-expiry", title: "Expiry policy", excerpt: "Miles expire." },
  ]);
  assert.deepEqual(groupSearchResults([record])[0].results[0].subResults, sections);
});

test("section links reject unsafe URLs, other pages, empty headings and fragment-less duplicate hits", () => {
  const record = {
    url: "/guides/example/", meta: { title: "Example" }, sub_results: [
      { title: "Script", url: "javascript:alert(1)#heading" },
      { title: "External", url: "https://outside.example/guides/example/#heading" },
      { title: "Protocol relative", url: "//outside.example/#heading" },
      { title: "Different page", url: "/guides/another/#heading" },
      { title: "No fragment", url: "/guides/example/?tracking=yes" },
      { title: "", url: "/guides/example/#empty-title" },
      { title: "&lt;img src=x onerror=alert(1)&gt;", url: "/guides/example/#safe-heading", plain_excerpt: "&lt;script&gt;not executable&lt;/script&gt;" },
    ],
  };
  assert.deepEqual(searchSubResults(record), [{
    href: "/guides/example/#safe-heading", title: "<img src=x onerror=alert(1)>", excerpt: "<script>not executable</script>",
  }]);
  assert.deepEqual(searchSubResults({ url: "/guides/example/", sub_results: null }), []);
  assert.deepEqual(searchSubResults({ url: "https://outside.example/", sub_results: [] }), []);
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test("blank search does not download the index; later searches share one index import", async () => {
  let imports = 0;
  const queries: string[] = [];
  const session = createSearchSession(async () => {
    imports += 1;
    return { search: async (query: string) => { queries.push(query); return { results: [] }; } };
  });
  assert.deepEqual(await session.search("  "), { query: "", results: [] });
  assert.equal(imports, 0);
  await session.search("skywards");
  await session.search("cashback");
  assert.equal(imports, 1);
  assert.deepEqual(queries, ["skywards", "cashback"]);
});

test("a late result never replaces a newer query", async () => {
  const first = deferred<{ results: string[] }>();
  const second = deferred<{ results: string[] }>();
  const started = deferred<void>();
  const session = createSearchSession(async () => ({ search: (query: string) => {
    if (query === "first") { started.resolve(); return first.promise; }
    return second.promise;
  } }));
  const a = session.search("first");
  await started.promise;
  const b = session.search("second");
  second.resolve({ results: ["new"] });
  assert.deepEqual(await b, { query: "second", results: ["new"] });
  first.resolve({ results: ["old"] });
  assert.equal(await a, null);
});

test("clearing while the index loads invalidates that request without issuing a search", async () => {
  const index = deferred<{ search: (query: string) => Promise<{ results: string[] }> }>();
  let searches = 0;
  const session = createSearchSession(() => index.promise);
  const pending = session.search("skywards");
  session.invalidate();
  index.resolve({ search: async () => { searches += 1; return { results: [] }; } });
  assert.equal(await pending, null);
  assert.equal(searches, 0);
});

test("failed index imports are retryable and current failures remain visible to the UI", async () => {
  let imports = 0;
  const session = createSearchSession(async () => {
    if (++imports === 1) throw new Error("offline");
    return { search: async () => ({ results: ["recovered"] }) };
  });
  await assert.rejects(session.search("skywards"), /offline/);
  assert.deepEqual(await session.search("skywards"), { query: "skywards", results: ["recovered"] });
  assert.equal(imports, 2);
});

test("a stale failure does not replace a newer search with an error", async () => {
  const old = deferred<{ results: string[] }>();
  const started = deferred<void>();
  const session = createSearchSession(async () => ({ search: (query: string) => {
    if (query === "old") { started.resolve(); return old.promise; }
    return Promise.resolve({ results: [] });
  } }));
  const pending = session.search("old");
  await started.promise;
  await session.search("new");
  old.reject(new Error("old failure"));
  assert.equal(await pending, null);
});

test("index import retry escapes the browser's failed-module URL cache, then reuses success", async () => {
  const importedUrls: string[] = [];
  const failedModuleCache = new Map<string, Error>();
  const module = { search: async () => ({ results: [] }) };
  const loader = createPagefindIndexLoader(async (url: string) => {
    importedUrls.push(url);
    if (failedModuleCache.has(url)) throw failedModuleCache.get(url);
    if (importedUrls.length === 1) {
      const failure = new Error("503");
      failedModuleCache.set(url, failure);
      throw failure;
    }
    return module;
  });
  await assert.rejects(loader.load(), /503/);
  assert.equal(await loader.load(), module);
  assert.equal(await loader.load(), module);
  assert.deepEqual(importedUrls, ["/pagefind/pagefind.js", "/pagefind/pagefind.js?dp-search-retry=1"]);
  assert.equal(loader.canRetry(), true);
});

test("bounded index loader permits only three import URLs and requires a new document after exhaustion", async () => {
  const importedUrls: string[] = [];
  const loader = createPagefindIndexLoader(async (url: string) => { importedUrls.push(url); throw new Error("offline"); });
  for (let attempt = 0; attempt < 3; attempt++) await assert.rejects(loader.load(), /offline/);
  assert.equal(loader.canRetry(), false);
  await assert.rejects(loader.load(), /Reload search/);
  assert.deepEqual(importedUrls, ["/pagefind/pagefind.js", "/pagefind/pagefind.js?dp-search-retry=1", "/pagefind/pagefind.js?dp-search-retry=2"]);
  for (const url of importedUrls) {
    assert.equal(new URL("pagefind.en.pf_meta", new URL(url, "https://dubaipoints.ae")).pathname, "/pagefind/pagefind.en.pf_meta");
    assert.equal(new URL(url, "https://dubaipoints.ae").pathname, "/pagefind/pagefind.js");
  }
});

test("concurrent index imports share one promise and count one rejection", async () => {
  const pending = deferred<unknown>();
  const urls: string[] = [];
  const loader = createPagefindIndexLoader((url: string) => { urls.push(url); return pending.promise; });
  const first = loader.load();
  const second = loader.load();
  assert.equal(first, second);
  pending.reject(new Error("offline"));
  await assert.rejects(first, /offline/);
  await assert.rejects(second, /offline/);
  assert.deepEqual(urls, ["/pagefind/pagefind.js"]);
  const retry = loader.load();
  await assert.rejects(retry, /offline/);
  assert.deepEqual(urls, ["/pagefind/pagefind.js", "/pagefind/pagefind.js?dp-search-retry=1"]);
});

test("search and result-data failures do not consume additional import URL attempts", async () => {
  const urls: string[] = [];
  let searches = 0;
  const loader = createPagefindIndexLoader(async (url: string) => {
    urls.push(url);
    return { search: async () => {
      if (++searches === 1) throw new Error("search fragment failed");
      return { results: [{ data: async () => { throw new Error("data fragment failed"); } }] };
    } };
  });
  const session = createSearchSession(loader.load);
  await assert.rejects(session.search("skywards"), /search fragment failed/);
  const response = await session.search("skywards");
  await assert.rejects(response.results[0].data(), /data fragment failed/);
  await session.search("cashback");
  assert.deepEqual(urls, ["/pagefind/pagefind.js"]);
  assert.equal(loader.canRetry(), true);
});

test("actual search surface uses one Pagefind API, accessible states and text-only rendering", () => {
  const source = readFileSync(new URL("../../src/components/search/SearchSurface.astro", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../src/pages/search.astro", import.meta.url), "utf8");
  assert.match(page, /<SearchSurface\s*\/>/);
  assert.match(source, /createPagefindIndexLoader\(\(indexUrl: string\) => import\(\/\* @vite-ignore \*\/ indexUrl\)\)/);
  assert.match(source, /createSearchSession\(indexLoader.load\)/);
  assert.match(source, /retry\.textContent = indexLoader\.canRetry\(\) \? "Try search again" : "Reload search"/);
  assert.match(source, /if \(indexLoader\.canRetry\(\)\) void run\(\);[\s\S]*?else form\.submit\(\)/);
  assert.match(source, /node\.textContent = text/);
  assert.match(source, /element\("details", "dp-search-section-matches"\)/);
  assert.match(source, /Jump to \$\{item.subResults.length\} matching/);
  assert.match(source, /disclosure.append\(sections\)/);
  assert.match(source, /for \(const match of item\.subResults\)/);
  assert.match(source, /element\("ul", "dp-search-subresults"\)/);
  assert.match(source, /jump\.href = match\.href/);
  assert.match(source, /element\("p", "dp-search-excerpt", match\.excerpt\)/);
  assert.doesNotMatch(source, /innerHTML|localStorage|sessionStorage|gtag|fetch\(/);
  assert.match(source, /data-search-status role="status" aria-live="polite"/);
  assert.match(source, /data-search-error hidden role="alert"/);
  assert.match(source, /data-search-empty hidden/);
  assert.match(source, /<noscript>/);
  assert.match(source, /class="pagefind-ui__search-input"[^>]*aria-label="Search DubaiPoints"/);
  assert.match(source, /version \+= 1;\s*session\.invalidate\(\)/);
  assert.match(source, /if \(ticket !== version\) return;/);
  assert.match(source, /Promise\.all\(references\.slice\(cursor, cursor \+ batchSize\)/);
});
