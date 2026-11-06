// scripts/ci/fetch-sources.mjs — the Actions-side primary-source reader.
// Pure parts only: URL intake (refuses anything but https, caps at ten)
// and the HTML → text reduction a session will read facts from.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync, deflateSync, brotliCompressSync } from "node:zlib";
import {
  parseUrls,
  htmlToText,
  decodeTypography,
  extractLinks,
  readSource,
  renderSource,
  MAX_URLS,
  MAX_CHARS,
  MAX_PDF_CHARS,
  isPublicAddress,
  validateArchiveUrl,
  readArchiveSource,
  createSourceArchive,
  decodeArchiveBody,
  ARCHIVE_DIRECTORY,
  MAX_ARCHIVE_BODY_BYTES,
  MAX_ARCHIVE_TEXT_BYTES,
  MAX_ARCHIVE_BATCH_BYTES,
  // eslint-disable-next-line import/extensions
} from "../../scripts/ci/fetch-sources.mjs";

test("parseUrls keeps https only, dedupes, caps, and reports what it refused", () => {
  const { urls, refused, dropped } = parseUrls(
    "https://news.flydubai.com/a  http://x.example/  https://news.flydubai.com/a  file:///etc/passwd  not-a-url",
  );
  assert.deepEqual(urls, ["https://news.flydubai.com/a"]);
  assert.deepEqual(refused, ["http://x.example/", "file:///etc/passwd", "not-a-url"]);
  assert.equal(dropped, 0);
  const many = Array.from({ length: MAX_URLS + 3 }, (_, i) => `https://e.example/${i}`).join(" ");
  const capped = parseUrls(many);
  assert.equal(capped.urls.length, MAX_URLS);
  assert.equal(capped.dropped, 3);
  assert.deepEqual(parseUrls(undefined).urls, []);
});

test("htmlToText reads the article, drops chrome and scripts, keeps structure", () => {
  const html = `<html><head><title>Pokhara launch &amp; more</title><script>var x = "AED 999";</script></head>
  <body><nav>Home | Fleet</nav><article><h1>flydubai to Pokhara</h1>
  <p>Flights start on&nbsp;<strong>1 December</strong>.</p><ul><li>Three weekly</li><li>Boeing 737</li></ul>
  <!-- AED 1 --></article><footer>© flydubai</footer></body></html>`;
  const t = htmlToText(html);
  assert.match(t, /^# Pokhara launch & more/);
  assert.match(t, /# flydubai to Pokhara/);
  assert.match(t, /Flights start on 1 December\./);
  assert.match(t, /- Three weekly\n- Boeing 737/);
  assert.doesNotMatch(t, /AED 999|AED 1|Home \| Fleet|© flydubai/);
});

test("htmlToText falls back to <main>, then <body>", () => {
  assert.equal(htmlToText("<body><main><p>Main text</p></main><p>outside</p></body>"), "Main text");
  assert.equal(htmlToText("<body><p>Body text</p></body>"), "Body text");
});

test("readSource reports status and final URL, and never throws on failure", async () => {
  const ok = await readSource("https://e.example/a", {
    fetchImpl: (async () =>
      Object.defineProperty(new Response("<article><p>Hello</p></article>", { status: 200, headers: { "content-type": "text/html" } }), "url", {
        value: "https://e.example/b",
      })) as unknown as typeof fetch,
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.finalUrl, "https://e.example/b");
  assert.equal(ok.text, "Hello");
  const bad = await readSource("https://e.example/x", {
    fetchImpl: (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch,
  });
  assert.equal(bad.status, null);
  assert.match(bad.text, /fetch failed/);
  assert.match(renderSource(bad), /^===== SOURCE https:\/\/e\.example\/x\nstatus: none/);
});

test("typographic entities decode — the first live run printed flydubai&rsquo;s", () => {
  assert.equal(decodeTypography("flydubai&rsquo;s &ldquo;modern cabins&rdquo; &ndash; 25&nbsp;Sep"), "flydubai\u2019s \u201cmodern cabins\u201d \u2013 25 Sep");
  assert.equal(decodeTypography("&unknown;"), "&unknown;");
  assert.match(htmlToText("<article><p>Nepal&rsquo;s gateway</p></article>"), /Nepal\u2019s gateway/);
});

test("extractLinks resolves, dedupes and keeps only http(s) — so an index page leads to its documents", () => {
  const html = `<body><script>var a='<a href="/x">x</a>'</script>
    <a href="/docs/circular-7-2026.pdf">Circular No. 7/2026 &amp; annex</a>
    <a href='https://dct.gov.ae/docs/circular-7-2026.pdf#p2'>dup</a>
    <a href="mailto:press@example.com">mail</a><a href="javascript:void(0)">js</a>
    <a class="c" href="news/item?id=3"><span>Item</span> three</a></body>`;
  const links = extractLinks(html, "https://dct.gov.ae/en/media.centre/circulars.aspx");
  assert.deepEqual(links, [
    { text: "Circular No. 7/2026 & annex", href: "https://dct.gov.ae/docs/circular-7-2026.pdf" },
    { text: "Item three", href: "https://dct.gov.ae/en/media.centre/news/item?id=3" },
  ]);
});

test("renderSource prints a LINKS section only when there are links", async () => {
  const r = await readSource("https://e.example/a", {
    fetchImpl: (async () =>
      new Response('<article><p>Hi</p><a href="/doc.pdf">Doc</a></article>', { status: 200, headers: { "content-type": "text/html" } })) as unknown as typeof fetch,
  });
  const out = renderSource(r);
  assert.match(out, /----- LINKS \(1\)\n- Doc → https:\/\/e\.example\/doc\.pdf/);
  assert.doesNotMatch(renderSource({ ...r, links: [] }), /LINKS/);
});

test("renderSource gives PDFs a longer cap than HTML pages", () => {
  const long = "x".repeat(MAX_CHARS + 500);
  const html = renderSource({ url: "https://e.example/a", status: 200, finalUrl: "https://e.example/a", type: "text/html", text: long, links: [] });
  assert.match(html, new RegExp(`truncated at ${MAX_CHARS} characters`));
  const pdf = renderSource({ url: "https://e.example/a.pdf", status: 200, finalUrl: "https://e.example/a.pdf", type: "application/pdf", text: long, links: [] });
  assert.doesNotMatch(pdf, /truncated/);
  const huge = renderSource({ url: "https://e.example/b.pdf", status: 200, finalUrl: "https://e.example/b.pdf", type: "application/pdf", text: "y".repeat(MAX_PDF_CHARS + 1), links: [] });
  assert.match(huge, new RegExp(`truncated at ${MAX_PDF_CHARS} characters`));
});

const publicLookup = async () => [{ address: "8.8.8.8", family: 4 }];
const sourceUrl = "https://issuer.example.net/card/terms";
const digest = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const archiveResponse = (body: string | Buffer, status = 200, headers: Record<string, string> = {}) => ({
  body: Buffer.isBuffer(body) ? body : Buffer.from(body), status,
  headers: { "content-type": "text/html; charset=utf-8", ...headers },
});

test("archive intake rejects credentials, non-HTTPS, private/reserved addresses and unsafe DNS answers", async () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "192.168.1.1", "169.254.169.254", "100.64.0.1", "198.18.1.1", "192.0.2.1", "224.0.0.1", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "2001:db8::1", "2002:7f00:1::"]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(address), true, address);
  for (const url of ["http://issuer.example.net/a", "https://user:password@issuer.example.net/a", "https://issuer.example.net:8443/a", "https://localhost/a", "https://127.1/a", "https://[::1]/a", "https://2130706433/a", "https://issuer.example.net/a?apiKey=private", "https://issuer.example.net/a?access_token=private"]) {
    await assert.rejects(validateArchiveUrl(url, { lookupImpl: publicLookup }), undefined, url);
  }
  await assert.rejects(validateArchiveUrl(sourceUrl, { lookupImpl: async () => [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 }] }), /private|reserved/);
  const accepted = await validateArchiveUrl(sourceUrl, { lookupImpl: publicLookup });
  assert.deepEqual(accepted.addresses, await publicLookup());
});

test("numeric IPv6 policy is invariant under compression, zero padding, case and embedded IPv4", async () => {
  const groups = [
    [false, ["2001::1", "2001:0:0:0:0:0:0:1", "2001:0000:0000:0000:0000:0000:0000:0001"]],
    [false, ["2001:db8::1", "2001:0DB8:0:0:0:0:0:1", "2001:0db8::0001"]],
    [false, ["2001:2::1", "2001:0002:0000:0:0:0:0:1"]],
    [false, ["3ffe::1", "3FFE:0000:0:0:0:0:0:0001"]],
    [false, ["3fff::1", "3FFF:0000:0:0:0:0:0:0001"]],
    [false, ["::ffff:127.0.0.1", "0:0:0:0:0:ffff:7f00:1", "::FFFF:7F00:0001"]],
    [true, ["2606:4700:4700::1111", "2606:4700:4700:0:0:0:0:1111"]],
    [true, ["2001:4860:4860::8888", "2001:4860:4860:0000:0000:0000:0000:8888"]],
  ] as const;
  for (const [expected, spellings] of groups) for (const address of spellings) {
    assert.equal(isPublicAddress(address), expected, address);
    if (!expected) await assert.rejects(validateArchiveUrl(sourceUrl, { lookupImpl: async () => [{ address, family: 6 }] }), /private|reserved/);
  }
});

test("archive follows only revalidated HTTPS public redirects and supplies pinned addresses to transport", async () => {
  const requests: string[] = [];
  const result = await readArchiveSource(sourceUrl, {
    lookupImpl: publicLookup,
    requestImpl: async (url: URL, options: { addresses: unknown }) => {
      requests.push(url.href);
      assert.deepEqual(options.addresses, await publicLookup());
      return requests.length === 1 ? archiveResponse("", 302, { location: "/final" }) : archiveResponse("<article><p>Full issuer terms.</p></article>");
    },
  });
  assert.deepEqual(requests, [sourceUrl, "https://issuer.example.net/final"]);
  assert.equal(result.capture.complete, true);
  assert.equal(result.finalUrl, requests[1]);
  assert.equal(result.capture.redirects.length, 1);
  for (const location of ["http://issuer.example.net/unsafe", "https://127.0.0.1/internal", "https://user:password@issuer.example.net/a"]) {
    let calls = 0;
    const blocked = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => { calls++; return archiveResponse("", 302, { location }); } });
    assert.equal(calls, 1, "redirect is refused before another network request");
    assert.equal(blocked.capture.complete, false);
    assert.doesNotMatch(JSON.stringify(blocked), /password/);
  }
  let calls = 0;
  const loop = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => { calls++; return archiveResponse("", 302, { location: "/loop" }); } });
  assert.equal(calls, 6);
  assert.equal(loop.capture.complete, false);
});

test("archive keeps complete HTML text beyond the log cap, exact response body and only safe headers", async () => {
  const body = `<article><h1>Terms</h1><p>${"Complete wording. ".repeat(2000)}</p><a href="/terms.pdf">PDF</a></article>`;
  const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse(body, 200, {
    etag: '"public-etag"', "last-modified": "Fri, 06 Nov 2026 12:00:00 GMT", "set-cookie": "DO-NOT-ARCHIVE", authorization: "DO-NOT-ARCHIVE",
  }) });
  assert.equal(result.capture.complete, true);
  assert.equal(result.capture.body.toString(), body);
  assert.ok(result.text.length > MAX_CHARS);
  assert.ok(result.text.endsWith("PDF"));
  assert.match(renderSource(result), /truncated at 20000 characters/);
  assert.equal(result.capture.headers.etag, '"public-etag"');
  assert.doesNotMatch(JSON.stringify(result.capture.headers), /DO-NOT-ARCHIVE|cookie|authorization/i);
  assert.match(result.capture.parserVersions.sourceReaderSha256, /^[a-f0-9]{64}$/);
  assert.match(result.capture.parserVersions.html, /htmlToText\/v1/);
  assert.ok(Number.isFinite(Date.parse(result.capture.fetchedAt)));
  assert.equal(result.capture.transportComplete, true);
  assert.equal(result.capture.extractionComplete, true);
  assert.equal(result.capture.contentUsability, "readable-output");
  assert.equal(result.capture.reviewRequired, true, "readable capture is not editorial verification");
});

test("archive identity hashes bind every local helper module actually imported by the extractor", async () => {
  const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("<article>Terms &amp; conditions</article>") });
  const identity = result.capture.parserVersions;
  const files = ["scripts/ci/fetch-sources.mjs", "scripts/ci/check-external-links.mjs", "scripts/ci/check-links.mjs"];
  assert.deepEqual(Object.keys(identity.localModuleSha256), files);
  for (const file of files) {
    const bytes = await readFile(new URL(`../../${file}`, import.meta.url));
    assert.equal(identity.localModuleSha256[file], digest(bytes), file);
    const imports = [...bytes.toString("utf8").matchAll(/^import[\s\S]*?from\s+["'](\.\/[a-zA-Z0-9_.-]+)["'];/gm)].map(match => match[1]);
    for (const dependency of imports) assert.ok(files.includes(`scripts/ci/${dependency.slice(2)}`), `identity includes ${dependency}`);
  }
  assert.equal(identity.sourceReaderSha256, identity.localModuleSha256[files[0]]);
  assert.equal(identity.extractionBundleSha256, digest(JSON.stringify(identity.localModuleSha256)));
});

test("401/403, HTML WAF, invalid encoding, PDF parse errors and limits are incomplete rather than verified", async () => {
  for (const response of [
    archiveResponse("<article>Unauthorised</article>", 401), archiveResponse("<article>Forbidden</article>", 403),
    archiveResponse("<article>Request accepted for processing</article>", 202),
    archiveResponse("<html><title>Just a moment...</title><body><script src='/cdn-cgi/challenge-platform/x'></script>Checking browser</body></html>"),
    archiveResponse("<article>Terms</article>", 200, { "content-type": "text/html; charset=iso-8859-1" }),
    archiveResponse(Buffer.from([0xff, 0xfe]), 200),
    archiveResponse("<html><title>Access Denied</title></html>", 200, { "content-type": "application/pdf" }),
    archiveResponse("%PDF-1.7 fake", 200, { "content-type": "application/pdf" }),
  ]) {
    const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => response, pdfTextImpl: () => "[pdftotext failed: invalid document]", pdfVersionImpl: () => "fixture-pdftotext" });
    assert.equal(result.capture.complete, false);
    assert.ok(result.capture.incompleteReasons.length);
    assert.ok(Buffer.isBuffer(result.capture.body), "error response bytes remain available as incomplete evidence");
  }
  const oversized = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("123456"), maxBytes: 5 });
  assert.equal(oversized.capture.complete, false);
  const timeout = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: () => new Promise(() => {}), timeoutMs: 10 });
  assert.deepEqual(timeout.capture.incompleteReasons, ["timeout"]);
  const secret = await readArchiveSource("https://user:secret@issuer.example.net/a?token=private", { lookupImpl: publicLookup });
  assert.doesNotMatch(JSON.stringify(secret), /user:secret|token=private/);
});

test("obvious JavaScript/login/soft-404 shells are readable transport but unusable source content", async () => {
  const cases = [
    ["html-javascript-shell", "<html><title>Issuer app</title><body><div id='root'></div><noscript>You need to enable JavaScript to run this app.</noscript><script src='/app.js'></script></body></html>"],
    ["html-javascript-shell", "<article>Please turn on JavaScript to continue.</article>"],
    ["html-javascript-shell", '<html><title>Issuer app</title><body><div id="root"></div><script src="app.js"></script></body></html>'],
    ["html-soft-404", "<html><title>Page not found | Issuer</title><body>Try another page.</body></html>"],
    ["html-soft-404", "<html><title>404 — Issuer</title><body>Sorry.</body></html>"],
    ["html-authentication-shell", "<html><title>Sign in | Issuer</title><body><form><input type='password'></form></body></html>"],
    ["html-authentication-shell", '<article><form><label>Secure access</label><input type="password"></form></article>'],
  ];
  for (const [reason, html] of cases) {
    const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse(html) });
    assert.equal(result.capture.transportComplete, true);
    assert.equal(result.capture.complete, false);
    assert.equal(result.capture.contentUsability, "unusable-or-review-required");
    assert.ok(result.capture.incompleteReasons.includes(reason), reason);
    assert.equal(result.capture.reviewRequired, true);
  }
});

test("206 or Content-Range cannot be full-document evidence even when PDF extraction succeeds", async () => {
  for (const [status, headers] of [[206, {}], [200, { "content-range": "bytes 0-99/1000" }], [206, { "content-range": "bytes 0-99/1000" }]] as const) {
    const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup,
      requestImpl: async () => archiveResponse("%PDF-1.7 partial", status, { "content-type": "application/pdf", ...headers }),
      pdfTextImpl: () => "Apparently readable terms", pdfVersionImpl: () => "fixture-pdftotext" });
    assert.equal(result.capture.extractionComplete, true);
    assert.equal(result.capture.transportComplete, false);
    assert.equal(result.capture.complete, false);
    assert.ok(result.capture.incompleteReasons.includes("partial-response"));
    if (headers["content-range"]) assert.equal(result.capture.headers["content-range"], headers["content-range"]);
  }
});

test("PDF magic preserves complete uncapped deterministic text and records parser version", async () => {
  const text = "Full PDF terms\n".repeat(7000);
  const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("%PDF-1.7 fixture", 200, { "content-type": "application/octet-stream" }),
    pdfTextImpl: () => text, pdfVersionImpl: () => "pdftotext fixture-version" });
  assert.equal(result.capture.complete, true);
  assert.equal(result.capture.format, "pdf");
  assert.equal(result.text, text);
  assert.ok(result.text.length > MAX_PDF_CHARS);
  assert.equal(result.capture.parserVersions.pdf, "pdftotext fixture-version");
  const tooLong = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("%PDF-1.7 fixture"),
    pdfTextImpl: () => "x".repeat(MAX_ARCHIVE_TEXT_BYTES + 1), pdfVersionImpl: () => "fixture" });
  assert.equal(tooLong.capture.complete, false);
  assert.ok(tooLong.capture.incompleteReasons.includes("derived-text-byte-limit"));
  assert.equal(tooLong.text, "", "no truncated artifact is presented as complete text");
});

test("HTTP content decoding is exact and rejects unsupported encodings or expansion beyond the body bound", () => {
  const raw = Buffer.from("<article>Exact response-body bytes — UAE.</article>");
  for (const [encoding, compressed] of [["gzip", gzipSync(raw)], ["deflate", deflateSync(raw)], ["br", brotliCompressSync(raw)]] as const) {
    assert.deepEqual(decodeArchiveBody(compressed, encoding), raw);
    assert.throws(() => decodeArchiveBody(compressed, encoding, raw.length - 1));
  }
  assert.deepEqual(decodeArchiveBody(raw), raw);
  assert.throws(() => decodeArchiveBody(raw, "identity", raw.length - 1), /byte limit/);
  assert.throws(() => decodeArchiveBody(raw, "unknown"), /unsupported/);
});

async function withArchiveTemp(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "dp-source-archive-test-"));
  try { await run(directory); }
  finally { await rm(directory, { recursive: true, force: true }); }
}

test("archive writes fixed safe filenames, exact bytes/hashes and a provenance manifest without overwrites", async () => withArchiveTemp(async directory => {
  const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("<article><p>Exact terms — AED 100.</p></article>") });
  const archive = createSourceArchive(directory);
  assert.equal(archive.add(result), true);
  const manifest = archive.finish({ attempted: 1 });
  const record = manifest.records[0];
  assert.equal(manifest.bodyRepresentation, "HTTP-decoded response-body bytes; not compressed wire bytes");
  assert.equal(record.bodySha256, digest(result.capture.body));
  assert.equal(record.textSha256, digest(result.text));
  assert.deepEqual(await readFile(join(archive.directory, record.files.body)), result.capture.body);
  assert.equal(await readFile(join(archive.directory, record.files.text), "utf8"), result.text);
  assert.equal(JSON.parse(await readFile(join(archive.directory, "manifest.json"), "utf8")).records[0].complete, true);
  assert.ok(manifest.totalFileBytes < MAX_ARCHIVE_BATCH_BYTES);
  assert.throws(() => createSourceArchive(directory), /EEXIST/);
  assert.throws(() => archive.finish(), /EEXIST/);
  for (const name of await readdir(archive.directory)) assert.match(name, /^[a-zA-Z0-9_.-]+$/);
}));

test("archive refuses existing symlink destinations and paths swapped to symlinks", async () => withArchiveTemp(async directory => {
  const outside = await mkdtemp(join(tmpdir(), "dp-source-archive-outside-"));
  try {
    await symlink(outside, join(directory, ARCHIVE_DIRECTORY));
    assert.throws(() => createSourceArchive(directory), /EEXIST/);
    assert.deepEqual(await readdir(outside), []);
    assert.throws(() => createSourceArchive(join(directory, ARCHIVE_DIRECTORY)), /non-symlink/);
    assert.throws(() => createSourceArchive("relative-runner-temp"), /absolute/);
    await rm(join(directory, ARCHIVE_DIRECTORY));
    const archive = createSourceArchive(directory);
    await rm(archive.directory, { recursive: true });
    await symlink(outside, archive.directory);
    const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("<article>Terms</article>") });
    assert.throws(() => archive.add(result), /changed|Unsafe/);
    assert.deepEqual(await readdir(outside), []);
  } finally { await rm(outside, { recursive: true, force: true }); }
}));

test("archive byte and count ceilings refuse excess evidence instead of silently truncating files", async () => withArchiveTemp(async directory => {
  const result = await readArchiveSource(sourceUrl, { lookupImpl: publicLookup, requestImpl: async () => archiveResponse("<article>Terms</article>") });
  const archive = createSourceArchive(directory);
  assert.equal(archive.add({ ...result, capture: { ...result.capture, body: Buffer.alloc(MAX_ARCHIVE_BODY_BYTES + 1) } }), false);
  for (let i = 1; i < MAX_URLS; i++) assert.equal(archive.add(result), true);
  assert.throws(() => archive.add(result), /URL limit/);
  const manifest = archive.finish();
  assert.equal(manifest.records[0].complete, false);
  assert.deepEqual(manifest.records[0].files, {});
  assert.match(manifest.records[0].incompleteReasons.join(), /byte-limit/);
}));

test("source evidence remains an explicit manual read-only opt-in with seven-day retention", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/fetch-sources.yml", import.meta.url), "utf8");
  const source = await readFile(new URL("../../scripts/ci/fetch-sources.mjs", import.meta.url), "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s+(?:schedule|push|pull_request):/);
  assert.match(workflow, /archive:[\s\S]*?type: boolean\n\s+default: false/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /if: \$\{\{ always\(\) && inputs\.archive \}\}/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/dubaipoints-source-archive\//);
  assert.match(source, /process\.env\.SOURCE_ARCHIVE === "1"/);
  assert.doesNotMatch(workflow.split("\n").filter(line => !line.trimStart().startsWith("#")).join("\n"), /secrets\.|git push|npm install|firecrawl/i);
});
