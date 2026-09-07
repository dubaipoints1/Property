// Unit tests for the external link sweep (scripts/ci/check-external-links.mjs).
// The sweep itself only runs weekly in Actions (link-audit.yml) because it
// needs egress the sandbox does not have; these pin the pure parsing,
// classification and scheduling rules — and the HEAD→GET fetch policy
// against a local http server — so a refactor can't silently turn a bot
// wall into a "broken" link or a broken link into an "ok".
//
// Nothing here touches the network: fetch behaviour is exercised against
// 127.0.0.1 and everything else through recorded responses / stub fetch.

import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  USER_AGENT,
  decodeEntities,
  normaliseUrl,
  extractExternalLinks,
  aggregateLinks,
  hostOf,
  sameSite,
  classifyResponse,
  detectEgressProxy,
  isBroken,
  HostScheduler,
  fetchWithPolicy,
  checkExternalLinks,
  checkInternalAbsolute,
  buildReport,
  renderExternalLinksMd,
  stableStringify,
  // eslint-disable-next-line import/extensions
} from "../../scripts/ci/check-external-links.mjs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("decodeEntities + normaliseUrl: entities, protocol-relative, fragment, non-http", () => {
  assert.equal(decodeEntities("a&amp;b=1&#39;x&#39; &quot;q&quot; &lt;t&gt; &#x2F;p"), "a&b=1'x' \"q\" <t> /p");
  assert.equal(decodeEntities("&amp;quot;"), "&quot;", "single pass — no double decode");
  assert.equal(decodeEntities("&unknown;"), "&unknown;");

  assert.equal(normaliseUrl("  https://www.adcb.com/en/sof.pdf#page=3  "), "https://www.adcb.com/en/sof.pdf");
  assert.equal(normaliseUrl("//cdn.example.com/x?y=1"), "https://cdn.example.com/x?y=1");
  assert.equal(normaliseUrl("https://Example.COM/A?b=c&amp;d=e"), "https://example.com/A?b=c&d=e");
  assert.equal(normaliseUrl("mailto:desk@dubaipoints.ae"), null);
  assert.equal(normaliseUrl("tel:+971"), null);
  assert.equal(normaliseUrl("/cards/"), null);
  assert.equal(normaliseUrl("javascript:void(0)"), null);
  assert.equal(normaliseUrl(""), null);
  assert.equal(hostOf("https://WWW.Bankfab.com/x"), "www.bankfab.com");
  assert.equal(hostOf("nonsense"), null);
  assert.equal(typeof USER_AGENT, "string");
  assert.match(USER_AGENT, /^DubaiPointsLinkAudit\//);
});

test("extractExternalLinks: <a href> only, root-relative and <link> ignored, self host flagged internal-absolute", () => {
  const html = `
    <link rel="canonical" href="https://dubaipoints.ae/cards/" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans" />
    <script src="https://static.cloudflareinsights.com/beacon.min.js"></script>
    <a href="/cards/">internal</a>
    <a class="x" data-href="https://decoy.example/" href="https://www.adcb.com/en/sof.pdf?v=46&amp;lang=en#p2">SoF</a>
    <a href='https://www.emiratesnbd.com/en/cards'>single quotes</a>
    <a href="//www.hsbc.ae/credit-cards/">protocol-relative</a>
    <a href="https://www.dubaipoints.ae/about/">self</a>
    <a href="mailto:x@y.z">mail</a>
    <a href="#top">frag</a>
    <abbr href="https://not-an-anchor.example/">abbr</abbr>
  `;
  const out = extractExternalLinks(html, "guides/x/index.html");
  assert.deepEqual(out, [
    { url: "https://www.adcb.com/en/sof.pdf?v=46&lang=en", file: "guides/x/index.html", kind: "external" },
    { url: "https://www.emiratesnbd.com/en/cards", file: "guides/x/index.html", kind: "external" },
    { url: "https://www.hsbc.ae/credit-cards/", file: "guides/x/index.html", kind: "external" },
    { url: "https://www.dubaipoints.ae/about/", file: "guides/x/index.html", kind: "internal-absolute" },
  ]);
  // Custom self host list.
  const custom = extractExternalLinks('<a href="https://staging.example/x">s</a>', "f.html", { selfHosts: ["staging.example"] });
  assert.equal(custom[0].kind, "internal-absolute");
});

test("aggregateLinks: dedupes by URL, keeps first 3 distinct sources, counts all", () => {
  const entries = [
    { url: "https://a.example/", file: "a.html", kind: "external" },
    { url: "https://a.example/", file: "a.html", kind: "external" }, // same file twice — one source
    { url: "https://a.example/", file: "b.html", kind: "external" },
    { url: "https://a.example/", file: "c.html", kind: "external" },
    { url: "https://a.example/", file: "d.html", kind: "external" },
    { url: "https://b.example/", file: "a.html", kind: "external" },
  ];
  const map = aggregateLinks(entries);
  assert.equal(map.size, 2);
  const a = map.get("https://a.example/");
  assert.deepEqual(a, { url: "https://a.example/", host: "a.example", sources: ["a.html", "b.html", "c.html"], sourceCount: 4 });
  assert.deepEqual(map.get("https://b.example/"), { url: "https://b.example/", host: "b.example", sources: ["a.html"], sourceCount: 1 });
  // maxSources is honoured.
  assert.deepEqual(aggregateLinks(entries, 1).get("https://a.example/").sources, ["a.html"]);
});

test("sameSite: www- and case-insensitive, URLs or bare hosts, never null-equal", () => {
  assert.equal(sameSite("https://www.adcb.com/a", "https://adcb.com/b"), true);
  assert.equal(sameSite("https://ADCB.com/", "http://www.adcb.COM/x"), true);
  assert.equal(sameSite("www.bankfab.com", "https://bankfab.com/"), true);
  assert.equal(sameSite("https://www.adcb.com/", "https://www.adib.ae/"), false);
  assert.equal(sameSite("https://a.example/", "https://cdn.a.example/"), false);
  assert.equal(sameSite("", ""), false);
  assert.equal(sameSite("nonsense", "nonsense"), true, "bare host strings compare as hosts");
});

test("classifyResponse matrix — broken only when the target itself failed", () => {
  const u = "https://www.adcb.com/en/sof.pdf";
  const c = (r: Record<string, unknown>) => classifyResponse({ originalUrl: u, ...r });

  assert.deepEqual(c({ status: 200, finalUrl: u, headers: {} }), { state: "ok", detail: "200" });
  assert.deepEqual(c({ status: 200, finalUrl: "https://adcb.com/en/sof.pdf", headers: {} }), { state: "ok", detail: "200" }, "www. drop is same site");
  assert.equal(c({ status: 200, finalUrl: "https://www.adcbgroup.com/moved", headers: {} }).state, "redirect-cross-host");
  assert.equal(c({ status: 301, finalUrl: null, headers: { location: "https://other.example/x" } }).state, "redirect-cross-host");
  assert.equal(c({ status: 301, finalUrl: null, headers: { location: "/en/other" } }).state, "ok", "relative location stays on site");
  assert.deepEqual(c({ status: 404, headers: {} }), { state: "client-error", detail: "404" });
  assert.deepEqual(c({ status: 410, headers: {} }), { state: "client-error", detail: "410" });
  assert.deepEqual(c({ status: 503, headers: {}, bodySnippet: "Service Unavailable" }), { state: "server-error", detail: "503" });
  assert.deepEqual(c({ status: 500, headers: {} }), { state: "server-error", detail: "500" });

  // Bot walls: 403/429/503 with a fingerprint are unverifiable, not broken.
  assert.deepEqual(c({ status: 403, headers: { "cf-mitigated": "challenge", server: "cloudflare" } }), { state: "unverifiable", detail: "cloudflare-challenge" });
  assert.equal(c({ status: 503, headers: { server: "cloudflare" }, bodySnippet: "<title>Just a moment...</title>" }).detail, "cloudflare-challenge");
  assert.equal(c({ status: 403, headers: { server: "cloudflare" } }).detail, "cloudflare-403");
  assert.deepEqual(c({ status: 403, headers: { server: "AkamaiGHost" } }), { state: "unverifiable", detail: "akamai" });
  assert.equal(c({ status: 403, headers: {}, bodySnippet: "<h1>Access Denied</h1> Reference #18.2f4d1002" }).detail, "akamai");
  assert.equal(c({ status: 403, headers: { "x-datadome": "protected" } }).detail, "datadome");
  assert.equal(c({ status: 403, headers: { "x-iinfo": "1-2-3" } }).detail, "incapsula");
  assert.equal(c({ status: 429, headers: {}, bodySnippet: "Pardon Our Interruption" }).detail, "distil");
  assert.deepEqual(c({ status: 429, headers: {} }), { state: "unverifiable", detail: "rate-limited" });
  assert.equal(c({ status: 403, headers: {} }).state, "client-error", "a plain 403 with no fingerprint is the target's answer");
  // Headers instance works too.
  assert.equal(c({ status: 403, headers: new Headers({ Server: "AkamaiGHost" }) }).detail, "akamai");

  // Sandbox egress: proxy 403 body, x-deny-reason header, or a CONNECT-failure error string.
  const egress = { state: "unverifiable", detail: "egress-blocked" };
  assert.deepEqual(c({ status: 403, headers: { "content-type": "text/plain" }, bodySnippet: "Host not in allowlist: www.adcb.com. Add this host to your network egress settings to allow access." }), egress);
  assert.deepEqual(c({ status: 403, headers: { "x-deny-reason": "host_not_allowed" } }), egress);
  assert.deepEqual(c({ status: null, error: "TypeError: fetch failed: Proxy response (403) !== 200 when HTTP Tunneling" }), egress);
  assert.deepEqual(c({ status: null, error: "CONNECT tunnel failed, response 403" }), egress);

  // No answer at all.
  assert.deepEqual(c({ status: null, timedOut: true, error: "AbortError: This operation was aborted" }), { state: "timeout", detail: "no response within timeout" });
  assert.deepEqual(c({ status: null, error: "ENOTFOUND getaddrinfo ENOTFOUND nope.example" }), { state: "network", detail: "ENOTFOUND getaddrinfo ENOTFOUND nope.example" });

  // Proxied environment (sandbox): a connection-level failure short of a timeout is the
  // environment, not the target — Node's fetch resolves locally and the proxy answers CONNECT.
  const proxied = { proxied: true };
  assert.deepEqual(classifyResponse({ originalUrl: u, status: null, error: "TypeError: getaddrinfo ENOTFOUND aecb.gov.ae" }, proxied), egress);
  assert.deepEqual(classifyResponse({ originalUrl: u, status: null, error: "TypeError: Request was cancelled" }, proxied), egress);
  assert.equal(classifyResponse({ originalUrl: u, status: null, timedOut: true, error: "AbortError" }, proxied).state, "timeout", "timeouts stay timeouts even when proxied");
  assert.equal(classifyResponse({ originalUrl: u, status: 404, headers: {} }, proxied).state, "client-error", "proxied never reinterprets a real answer");
  assert.equal(classifyResponse({ originalUrl: u, status: 200, finalUrl: u, headers: {} }, proxied).state, "ok");
  assert.equal(detectEgressProxy({}), false);
  assert.equal(detectEgressProxy({ HTTPS_PROXY: "http://127.0.0.1:46401" }), true);
  assert.equal(detectEgressProxy({ https_proxy: "http://127.0.0.1:46401" }), true);
  assert.equal(detectEgressProxy({ CCR_AGENT_PROXY_ENABLED: "1" }), true);
  assert.equal(detectEgressProxy({ CCR_AGENT_PROXY_ENABLED: "0", HTTP_PROXY: "x" }), false, "plain-HTTP proxy alone is not egress evidence");

  for (const s of ["client-error", "server-error", "timeout", "network"]) assert.equal(isBroken(s), true, s);
  for (const s of ["ok", "redirect-cross-host", "unverifiable"]) assert.equal(isBroken(s), false, s);
});

test("HostScheduler never exceeds perHost in flight and spaces starts by delayMs", async () => {
  const s = new HostScheduler({ perHost: 2, delayMs: 10 });
  let active = 0;
  let peak = 0;
  const starts: number[] = [];
  const run = async (host: string) => {
    await s.acquire(host);
    active += 1;
    peak = Math.max(peak, active);
    starts.push(Date.now());
    await sleep(15);
    active -= 1;
    s.release(host);
  };
  const t0 = Date.now();
  await Promise.all(Array.from({ length: 6 }, () => run("a.example")));
  assert.equal(peak, 2, "at most perHost concurrent on one host");
  // 6 jobs at 2-wide with 15 ms bodies needs at least 3 rounds ≈ 45 ms; delay spacing adds more.
  assert.ok(Date.now() - t0 >= 40, `took ${Date.now() - t0}ms`);
  const sorted = [...starts].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) assert.ok(sorted[i] - sorted[i - 1] >= 8, "starts spaced by ~delayMs");

  // Hosts are independent: two hosts at perHost=1 still run side by side.
  const s2 = new HostScheduler({ perHost: 1, delayMs: 0 });
  let both = 0;
  let peak2 = 0;
  const run2 = async (host: string) => {
    await s2.acquire(host);
    both += 1;
    peak2 = Math.max(peak2, both);
    await sleep(15);
    both -= 1;
    s2.release(host);
  };
  await Promise.all([run2("a.example"), run2("b.example")]);
  assert.equal(peak2, 2);
});

test("fetchWithPolicy against a local server: HEAD 405 → GET fallback, 8 KB body cap, timeout aborts", async () => {
  const big = "x".repeat(20 * 1024);
  const seen: string[] = [];
  const hanging = new Set<http.ServerResponse>();
  const server = http.createServer((req, res) => {
    seen.push(`${req.method} ${req.url}`);
    const url = req.url ?? "/";
    if (url.startsWith("/head405")) {
      if (req.method === "HEAD") {
        res.writeHead(405, { allow: "GET" });
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": "text/html" });
      res.end(big);
      return;
    }
    if (url.startsWith("/ok")) {
      res.writeHead(200, { "content-type": "text/html", "x-test": "1" });
      res.end(req.method === "HEAD" ? undefined : "<html>ok</html>");
      return;
    }
    if (url.startsWith("/hang")) {
      hanging.add(res); // never answered
      return;
    }
    if (url.startsWith("/redirect")) {
      res.writeHead(302, { location: "/ok" });
      res.end();
      return;
    }
    res.writeHead(404);
    res.end("nope");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const addr = server.address() as { port: number };
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    const head = await fetchWithPolicy(`${base}/ok`, { timeoutMs: 2000 });
    assert.equal(head.status, 200);
    assert.equal(head.method, "HEAD");
    assert.equal(head.headers["x-test"], "1");
    assert.equal(head.bodySnippet, "");
    assert.equal(head.error, null);
    assert.equal(head.timedOut, false);

    const fb = await fetchWithPolicy(`${base}/head405`, { timeoutMs: 2000 });
    assert.equal(fb.status, 200);
    assert.equal(fb.method, "GET", "405 on HEAD falls back to GET");
    assert.equal(fb.bodySnippet.length, 8 * 1024, "body read is capped at 8 KB");
    assert.deepEqual(seen.filter((s) => s.endsWith("/head405")), ["HEAD /head405", "GET /head405"]);

    const nf = await fetchWithPolicy(`${base}/missing`, { timeoutMs: 2000 });
    assert.equal(nf.status, 404);
    assert.equal(nf.method, "GET", "404 on HEAD is re-checked with GET");
    assert.equal(nf.bodySnippet, "nope");

    const rd = await fetchWithPolicy(`${base}/redirect`, { timeoutMs: 2000 });
    assert.equal(rd.status, 200);
    assert.equal(rd.finalUrl, `${base}/ok`, "redirects are followed and the landing URL reported");

    const t0 = Date.now();
    const hang = await fetchWithPolicy(`${base}/hang`, { timeoutMs: 100 });
    const elapsed = Date.now() - t0;
    assert.equal(hang.status, null);
    assert.equal(hang.timedOut, true);
    assert.ok(hang.error, "error string recorded");
    assert.ok(elapsed < 1500, `timed out promptly (${elapsed}ms)`);
    assert.equal(classifyResponse({ ...hang, originalUrl: `${base}/hang` }).state, "timeout");

    // The user-agent is sent.
    const uaSeen: string[] = [];
    server.prependListener("request", (req) => uaSeen.push(String(req.headers["user-agent"])));
    await fetchWithPolicy(`${base}/ok`, { timeoutMs: 2000, ua: "TestUA/1" });
    assert.deepEqual(uaSeen, ["TestUA/1"]);
  } finally {
    for (const res of hanging) res.destroy();
    server.closeAllConnections();
    server.close();
  }
});

test("checkExternalLinks retries transient failures; buildReport orders by severity then url and counts broken", async () => {
  // Stub fetch: scripted per URL, transient 503 clears on the second GET.
  const calls: Record<string, number> = {};
  const script: Record<string, () => Response | Promise<Response>> = {
    "https://b.example/ok": () => new Response(null, { status: 200 }),
    "https://a.example/gone": () => new Response("Not Found", { status: 404 }),
    "https://c.example/flaky": () => {
      // HEAD 503 (5xx does not trigger the GET fallback), then the retry HEAD 200.
      return new Response(null, { status: calls["https://c.example/flaky"] >= 2 ? 200 : 503 });
    },
    "https://d.example/wall": () => new Response("<title>Just a moment...</title>", { status: 403, headers: { server: "cloudflare" } }),
    "https://e.example/moved": () => Object.defineProperty(new Response(null, { status: 200 }), "url", { value: "https://f.example/landing" }),
  };
  const fetchImpl = async (url: string, init: RequestInit) => {
    calls[url] = (calls[url] ?? 0) + 1;
    if (url === "https://nx.example/") throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND nx.example" } });
    const res = await script[url]();
    if (init.method === "HEAD" && res.body) await res.body.cancel();
    return res;
  };
  const links = [
    { url: "https://e.example/moved", host: "e.example", sources: ["e.html"], sourceCount: 1 },
    { url: "https://b.example/ok", host: "b.example", sources: ["b.html"], sourceCount: 1 },
    { url: "https://nx.example/", host: "nx.example", sources: ["n.html"], sourceCount: 1 },
    { url: "https://d.example/wall", host: "d.example", sources: ["d.html"], sourceCount: 1 },
    { url: "https://a.example/gone", host: "a.example", sources: ["a.html", "z.html"], sourceCount: 5 },
    { url: "https://c.example/flaky", host: "c.example", sources: ["c.html"], sourceCount: 1 },
  ];
  const results = await checkExternalLinks(links, {
    concurrency: 3,
    perHost: 1,
    hostDelayMs: 0,
    timeoutMs: 1000,
    retries: 1,
    retryDelayMs: 5,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    onProgress: null,
  });
  assert.equal(results.length, 6);
  const byUrl = Object.fromEntries(results.map((r: { url: string }) => [r.url, r]));
  assert.equal(byUrl["https://c.example/flaky"].state, "ok");
  assert.equal(byUrl["https://c.example/flaky"].attempts, 2, "one retry after a 5xx");
  assert.equal(byUrl["https://a.example/gone"].attempts, 1, "4xx is not retried");
  assert.equal(byUrl["https://nx.example/"].state, "network");
  assert.equal(byUrl["https://nx.example/"].attempts, 2, "network errors get one retry");
  assert.equal(byUrl["https://d.example/wall"].state, "unverifiable");
  assert.equal(byUrl["https://e.example/moved"].state, "redirect-cross-host");
  assert.equal(byUrl["https://e.example/moved"].finalUrl, "https://f.example/landing");

  // Same DNS failure under egressProxy: unverifiable, no retry burned.
  const proxiedRun = await checkExternalLinks([links[2]], {
    concurrency: 1,
    hostDelayMs: 0,
    retries: 1,
    retryDelayMs: 5,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    egressProxy: true,
    onProgress: null,
  });
  assert.equal(proxiedRun[0].state, "unverifiable");
  assert.equal(proxiedRun[0].detail, "egress-blocked");
  assert.equal(proxiedRun[0].attempts, 1);

  const report = buildReport(results, { generatedAt: "2026-09-06T00:00:00.000Z", commit: "abc1234", distDir: "dist", durationMs: 1234.6 });
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(
    report.links.map((l: { url: string }) => l.url),
    [
      "https://a.example/gone", // client-error
      "https://nx.example/", // network
      "https://e.example/moved", // redirect-cross-host
      "https://d.example/wall", // unverifiable
      "https://b.example/ok", // ok
      "https://c.example/flaky", // ok (url tie-break)
    ],
  );
  assert.equal(report.meta.counts.total, 6);
  assert.equal(report.meta.counts.broken, 2);
  assert.deepEqual(report.meta.counts.byState, { "client-error": 1, network: 1, "redirect-cross-host": 1, unverifiable: 1, ok: 2 });
  assert.equal(report.meta.durationMs, 1235);
  assert.equal(report.meta.egressProxy, false, "off unless the caller says so");
  assert.equal(buildReport([], { egressProxy: true }).meta.egressProxy, true);
  assert.equal(report.links[0].sourceCount, 5);
  assert.deepEqual(report.links[0].sources, ["a.html", "z.html"]);

  // Deterministic serialisation: permuted input keys → byte-identical JSON.
  const a = stableStringify({ z: 1, a: { d: [{ y: 1, x: 2 }], c: null } });
  const b = stableStringify({ a: { c: null, d: [{ x: 2, y: 1 }] }, z: 1 });
  assert.equal(a, b);
  assert.equal(stableStringify(report), stableStringify(JSON.parse(JSON.stringify(report))));

  // Internal-absolute links verified against a fixture dist (+ redirect sources honoured).
  const dist = mkdtempSync(path.join(tmpdir(), "extlinks-"));
  mkdirSync(path.join(dist, "about"), { recursive: true });
  writeFileSync(path.join(dist, "about", "index.html"), "<p>about</p>");
  const ia = checkInternalAbsolute(
    [
      { url: "https://dubaipoints.ae/about/", sources: ["x.html"], sourceCount: 1 },
      { url: "https://dubaipoints.ae/missing/", sources: ["y.html"], sourceCount: 1 },
      { url: "https://dubaipoints.ae/friday-brief", sources: ["z.html"], sourceCount: 1 },
    ],
    dist,
    new Set(["/friday-brief"]),
  );
  assert.equal(ia.checked, 3);
  assert.deepEqual(ia.broken, [{ url: "https://dubaipoints.ae/missing/", path: "/missing/", sources: ["y.html"], sourceCount: 1 }]);
});

test("renderExternalLinksMd lists each broken link with its source, groups unverifiable by host", () => {
  const results = [
    { url: "https://www.adcb.com/old.pdf", host: "www.adcb.com", state: "client-error", detail: "404", status: 404, method: "GET", attempts: 1, sources: ["cards/adcb-traveller/index.html", "banks/adcb/index.html"], sourceCount: 4 },
    { url: "https://www.emiratesnbd.com/a", host: "www.emiratesnbd.com", state: "unverifiable", detail: "akamai", status: 403, method: "GET", attempts: 1, sources: ["a.html"], sourceCount: 1 },
    { url: "https://www.emiratesnbd.com/b", host: "www.emiratesnbd.com", state: "unverifiable", detail: "akamai", status: 403, method: "GET", attempts: 1, sources: ["b.html"], sourceCount: 1 },
    { url: "https://www.hsbc.ae/x", host: "www.hsbc.ae", state: "unverifiable", detail: "egress-blocked", status: 403, method: "GET", attempts: 1, sources: ["c.html"], sourceCount: 1 },
    { url: "https://old.example/x", host: "old.example", state: "redirect-cross-host", detail: "lands on https://new.example/x", status: 200, finalUrl: "https://new.example/x", method: "HEAD", attempts: 1, sources: ["d.html"], sourceCount: 1 },
    { url: "https://fine.example/", host: "fine.example", state: "ok", detail: "200", status: 200, method: "HEAD", attempts: 1, sources: ["e.html"], sourceCount: 1 },
  ];
  const report = buildReport(results, {
    generatedAt: "2026-09-06T00:00:00.000Z",
    commit: "abc1234",
    durationMs: 1000,
    internalAbsolute: { checked: 2, broken: [{ url: "https://dubaipoints.ae/missing/", path: "/missing/", sources: ["n.html"], sourceCount: 1 }] },
  });
  const md = renderExternalLinksMd(report);

  assert.match(md, /^# External link audit/m);
  assert.match(md, /## Broken \(1\)/);
  assert.match(md, /\| https:\/\/www\.adcb\.com\/old\.pdf \| client-error \| 404 \| GET \| `cards\/adcb-traveller\/index\.html`, `banks\/adcb\/index\.html` \+2 more \|/);
  assert.match(md, /## Unverifiable \(3\)/);
  assert.match(md, /### www\.emiratesnbd\.com \(2\) — akamai/);
  assert.match(md, /### www\.hsbc\.ae \(1\) — egress-blocked/);
  assert.match(md, /## Cross-host redirects \(1\)/);
  assert.match(md, /\| https:\/\/old\.example\/x \| https:\/\/new\.example\/x \| `d\.html` \|/);
  assert.match(md, /## Internal absolute links \(2 checked, 1 broken\)/);
  assert.match(md, /\| https:\/\/dubaipoints\.ae\/missing\/ \| \/missing\/ \| `n\.html` \|/);
  assert.match(md, /## OK \(1\)/);
  // Section order: broken before unverifiable before redirects before ok.
  const idx = (s: string) => md.indexOf(s);
  assert.ok(idx("## Broken") < idx("## Unverifiable") && idx("## Unverifiable") < idx("## Cross-host") && idx("## Cross-host") < idx("## OK"));
  // Empty report renders without throwing and says so.
  const empty = renderExternalLinksMd(buildReport([], { generatedAt: "2026-09-06T00:00:00.000Z", durationMs: 0 }));
  assert.match(empty, /## Broken \(0\)\n\n_None\._/);
  assert.doesNotMatch(md, /Egress-proxied run/);
  assert.match(renderExternalLinksMd(buildReport([], { egressProxy: true })), /\*\*Egress-proxied run\.\*\*/);
});
