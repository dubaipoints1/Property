// scripts/ci/fetch-sources.mjs — the Actions-side primary-source reader.
// Pure parts only: URL intake (refuses anything but https, caps at ten)
// and the HTML → text reduction a session will read facts from.

import { test } from "node:test";
import assert from "node:assert/strict";
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
