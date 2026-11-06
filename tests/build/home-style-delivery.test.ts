import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rename, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { transformHomepageStyles, inlineHomeStyles } from "../../scripts/build/home-style-delivery.mjs";
import { extractInlineScripts, findInlineHandlers, hashSource } from "../../scripts/build/csp-hashes.mjs";

const cssA = '/* exact compiled bytes */\n@layer base{:root{--ink:#19282a}}\n@font-face{font-family:Newsreader;src:url("/_astro/newsreader.woff2")}';
const cssB = '.hero{background:url(/images/stock/night.jpg)}\n.hero::after{content:"DubaiPoints — UAE"}';
const cssByHref = new Map([["/_astro/a.123.css", cssA], ["/_astro/b.456.css", cssB]]);
const linkA = '<link rel="stylesheet" href="/_astro/a.123.css">';
const linkB = '<link href="/_astro/b.456.css" rel="stylesheet">';
const marker = /<style data-dp-home-css="([^"]+)" data-dp-css-sha256="([^"]+)">([\s\S]*?)<\/style>/g;
const hash = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const documentWith = (links: string) => `<!doctype html><html lang="en" data-theme="dark"><head>
<meta charset="utf-8"><title>DubaiPoints — UAE</title><meta name="description" content="Dated and sourced.">
<link rel="canonical" href="https://dubaipoints.ae/"><link rel="preload" href="/_astro/newsreader.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.dataset.theme="dark";</script>
<!-- <link rel="stylesheet" href="/_astro/comment-only.css"> -->
<script type="application/ld+json">{"@type":"WebSite","name":"DubaiPoints"}</script>
<style>.already-inline{color:inherit}</style>${links}</head>
<body><header>DubaiPoints</header><main><h1>Fly further. Pay less.</h1><a href="#tools">Start with a tool</a><section id="tools">Tools</section><noscript>Static content is available.</noscript></main><footer><a href="/about/">About</a></footer></body></html>`;

test("home CSS transformation preserves exact compiled rules, order and all other HTML bytes", () => {
  const before = documentWith(`${linkA}<script>window.stage="between";</script>${linkB}`);
  const reads: string[] = [];
  const result = transformHomepageStyles(before, (href: string) => { reads.push(href); return cssByHref.get(href); });
  assert.deepEqual(reads, ["/_astro/a.123.css", "/_astro/b.456.css"]);
  assert.equal(result.inlinedCount, 2);
  const matches = [...result.html.matchAll(marker)];
  assert.equal(matches.length, 2);
  assert.deepEqual(matches.map(match => match[1]), reads);
  assert.deepEqual(matches.map(match => match[3]), [cssA, cssB]);
  assert.deepEqual(matches.map(match => match[2]), [hash(cssA), hash(cssB)]);
  const reconstructed = result.html.replace(marker, (_all: string, href: string) => href === reads[0] ? linkA : linkB);
  assert.equal(reconstructed, before, "metadata, theme script, JSON-LD, font preloads, inline styles and body remain exact");
  assert.deepEqual(result.styles, [
    { href: reads[0], bytes: Buffer.byteLength(cssA), sha256: hash(cssA) },
    { href: reads[1], bytes: Buffer.byteLength(cssB), sha256: hash(cssB) },
  ]);
  assert.equal(result.cssBytes, Buffer.byteLength(cssA) + Buffer.byteLength(cssB));
  assert.equal(result.htmlBytesBefore, Buffer.byteLength(before));
  assert.equal(result.htmlBytesAfter, Buffer.byteLength(result.html));
});

test("inlined styles work without a fetch/defer/onload script and retain executable CSP inventory", () => {
  const before = documentWith(`${linkA}${linkB}`);
  const result = transformHomepageStyles(before, (href: string) => cssByHref.get(href));
  assert.doesNotMatch(result.html, /<link\b[^>]*rel="stylesheet"(?![^>]*comment-only)/);
  assert.ok(result.html.indexOf(`<style data-dp-home-css=`) < result.html.indexOf("</head>"));
  assert.ok(result.html.includes("<noscript>Static content is available.</noscript>"));
  assert.deepEqual(findInlineHandlers(result.html), findInlineHandlers(before));
  const scripts = (html: string) => extractInlineScripts(html).map(script => ({
    attrs: script.attrs, body: script.body, executable: script.executable,
    hash: script.executable ? hashSource(script.body) : undefined,
  }));
  assert.deepEqual(scripts(result.html), scripts(before));
});

test("comment, script, existing style and body text are not mistaken for delivery links", () => {
  const fake = '<link rel="stylesheet" href="/_astro/not-a-real-style.css">';
  const before = documentWith(linkA)
    .replace("</head>", `<script>window.literal=${JSON.stringify(fake)};</script></head>`)
    .replace("<body>", `<body>${fake}`);
  const reads: string[] = [];
  const result = transformHomepageStyles(before, (href: string) => { reads.push(href); return cssByHref.get(href); });
  assert.deepEqual(reads, ["/_astro/a.123.css"]);
  assert.equal(result.html.slice(result.html.indexOf("<body>")), before.slice(before.indexOf("<body>")));
  assert.ok(result.html.includes(`window.literal=${JSON.stringify(fake)}`));
  assert.ok(result.html.includes(".already-inline{color:inherit}"));
});

test("verified delivery markers are deterministic, idempotent and reject tampering", () => {
  const before = documentWith(`${linkA}${linkB}`);
  const first = transformHomepageStyles(before, (href: string) => cssByHref.get(href));
  const repeatFromSource = transformHomepageStyles(before, (href: string) => cssByHref.get(href));
  assert.equal(first.html, repeatFromSource.html);
  assert.equal(first.fingerprint, repeatFromSource.fingerprint);
  const second = transformHomepageStyles(first.html, () => { throw Error("idempotent run must not read CSS again"); });
  assert.equal(second.html, first.html);
  assert.equal(second.inlinedCount, 0);
  assert.equal(second.fingerprint, first.fingerprint);
  assert.deepEqual(second.styles, first.styles);
  assert.throws(() => transformHomepageStyles(first.html.replace("--ink:#19282a", "--ink:#ffffff"), () => cssA), /fingerprint/i);
  assert.throws(() => transformHomepageStyles(first.html.replace('data-dp-home-css="/_astro/a.123.css"', 'data-dp-home-css="/_astro/../escape.css"'), () => cssA), /safe|traversal/i);
});

test("unsupported stylesheet semantics and malformed attributes fail closed", () => {
  const tags = [
    '<link rel="alternate stylesheet" href="/_astro/a.css">',
    '<link rel="stylesheet" href="/_astro/a.css" media="print">',
    '<link rel="stylesheet" href="/_astro/a.css" disabled>',
    '<link rel="stylesheet" href="/_astro/a.css" integrity="sha256-demo">',
    '<link rel="stylesheet" href="/_astro/a.css" crossorigin>',
    '<link rel="stylesheet" href="/_astro/a.css" title="Alternative">',
    '<link rel="stylesheet" href="/_astro/a.css" onload="ready()">',
    '<link rel="stylesheet" href="/_astro/a.css" href="/_astro/b.css">',
    '<link rel="stylesheet">',
  ];
  for (const tag of tags) {
    let reads = 0;
    assert.throws(() => transformHomepageStyles(documentWith(tag), () => { reads++; return cssA; }), undefined, tag);
    assert.equal(reads, 0, "reject semantics before reading any asset");
  }
});

test("stylesheet hrefs reject external, relative, traversal, encoded, query and fragment inputs", () => {
  for (const href of [
    "https://cdn.example/a.css", "//cdn.example/a.css", "a.css", "../a.css",
    "/_astro/../a.css", "/_astro/%2e%2e/a.css", "/_astro/a.css?v=1", "/_astro/a.css#theme",
    "/_astro/nested/a.css", "/_astro/a\\b.css", "/_astro/a.css%00", "/_astro/a&b.css",
  ]) assert.throws(() => transformHomepageStyles(documentWith(`<link rel="stylesheet" href="${href}">`), () => cssA), undefined, href);
});

test("unknown CSS imports, URL bases, source maps and raw HTML terminators fail closed", () => {
  const cssCases = [
    '@import "other.css";', '@IMPORT url("/_astro/other.css");',
    '@\\69mport "relative.css";', '@im\\70ort "relative.css";',
    '.a{background:u\\72l(relative.png)}', '.a{background:u\\000072l(relative.png)}',
    '.a{background:image-set("relative.png" 1x)}', '.a{background:-webkit-image-set("relative.png" 1x)}',
    '.a{background:image-set("/images/photo.png" 1x)}', '.a{background:image-set("data:image/png;base64,AAAA" 1x)}',
    '.a{src:url(font.woff2)}', '.a{src:url("../font.woff2")}', '.a{src:url(\'/font.woff2\')}/*# sourceMappingURL=a.css.map */',
    '.a{src:url(//cdn.example/font.woff2)}', '.a{src:url("https://cdn.example/font.woff2")}',
    '.a{src:url("#local-fragment")}', '.a{src:url("\\2f font.woff2")}', '.a{src:url ("/_astro/font.woff2")}',
    '.a::after{content:"</style><script>bad()</script>"}', '.a{/* </STYLE > */color:inherit}',
    '.a::after{content:"<script>"}', '.a::after{content:"</script>"}',
    "", undefined, Buffer.from(".a{color:inherit}"),
  ];
  for (const css of cssCases) assert.throws(() => transformHomepageStyles(documentWith(linkA), () => css), undefined, String(css));
  // Root-absolute and data URLs retain their exact CSS bytes, with no
  // generic rewriting of Vite asset paths or embedded resources.
  const supported = '.a{src:url("/_astro/font.woff2")} .b{background:url("data:image/png;base64,AAAA")}';
  assert.ok(transformHomepageStyles(documentWith(linkA), () => supported).html.includes(supported));
  const escapedSelectors = '.md\\:grid{display:grid}.w-\\[1px\\]{width:1px}.quote::after{content:"@\\69mport is text"}/* @\\69mport is a comment */';
  assert.ok(transformHomepageStyles(documentWith(linkA), () => escapedSelectors).html.includes(escapedSelectors), "ordinary selector escapes, quoted text and comments remain byte-exact");
});

async function withBuildFixture(run: (state: { root: string; dist: string; index: string; interior: string; html: string }) => Promise<void>, html = documentWith(`${linkA}${linkB}`)) {
  const root = await mkdtemp(path.join(os.tmpdir(), "dubaipoints-home-style-test-"));
  const dist = path.join(root, "dist");
  const index = path.join(dist, "index.html");
  const interior = path.join(dist, "cards", "index.html");
  try {
    await mkdir(path.join(dist, "_astro"), { recursive: true });
    await mkdir(path.join(dist, "cards"));
    await writeFile(index, html);
    await writeFile(interior, "<!doctype html><head><link rel=stylesheet href=/_astro/a.123.css></head><body>Interior unchanged</body>");
    for (const [href, css] of cssByHref) await writeFile(path.join(dist, "_astro", path.posix.basename(href)), css);
    await run({ root, dist, index, interior, html });
  } finally {
    // Only this test's newly created, isolated fixture directory is removed.
    await rm(root, { recursive: true, force: true });
  }
}

test("file runner writes only homepage and retains reusable assets and every interior byte", async () => withBuildFixture(async state => {
  const interiorBefore = await readFile(state.interior);
  const assetBefore = await Promise.all([...cssByHref.keys()].map(href => readFile(path.join(state.dist, "_astro", path.posix.basename(href)))));
  const first = await inlineHomeStyles(state.dist);
  assert.equal(first.inlinedCount, 2);
  assert.equal(await readFile(state.index, "utf8"), first.html);
  assert.deepEqual(await readFile(state.interior), interiorBefore);
  const assetsAfter = await Promise.all([...cssByHref.keys()].map(href => readFile(path.join(state.dist, "_astro", path.posix.basename(href)))));
  assert.deepEqual(assetsAfter, assetBefore);
  const second = await inlineHomeStyles(state.dist);
  assert.equal(second.inlinedCount, 0);
  assert.equal(await readFile(state.index, "utf8"), first.html);
}));

test("a later missing or unsafe stylesheet cannot leave a partially transformed homepage", async () => {
  await withBuildFixture(async state => {
    await unlink(path.join(state.dist, "_astro", "b.456.css"));
    await assert.rejects(inlineHomeStyles(state.dist));
    assert.equal(await readFile(state.index, "utf8"), state.html);
  });
  await withBuildFixture(async state => {
    await writeFile(path.join(state.dist, "_astro", "b.456.css"), '@import "late.css";');
    await assert.rejects(inlineHomeStyles(state.dist), /@import/);
    assert.equal(await readFile(state.index, "utf8"), state.html);
  });
  await withBuildFixture(async state => {
    await writeFile(path.join(state.dist, "_astro", "b.456.css"), Buffer.from([0xff]));
    await assert.rejects(inlineHomeStyles(state.dist));
    assert.equal(await readFile(state.index, "utf8"), state.html);
  });
});

test("file runner rejects symlinked CSS, asset directories and homepage without writing through them", async () => {
  await withBuildFixture(async state => {
    const outside = path.join(state.root, "outside.css");
    await writeFile(outside, cssB);
    const asset = path.join(state.dist, "_astro", "b.456.css");
    await unlink(asset);
    await symlink(outside, asset);
    await assert.rejects(inlineHomeStyles(state.dist), /escaped|real|symlink/i);
    assert.equal(await readFile(state.index, "utf8"), state.html);
    assert.equal(await readFile(outside, "utf8"), cssB);
  });
  await withBuildFixture(async state => {
    const original = path.join(state.dist, "_astro");
    const outside = path.join(state.root, "outside-astro");
    await rename(original, outside);
    await symlink(outside, original, "dir");
    await assert.rejects(inlineHomeStyles(state.dist), /real|symlink/i);
    assert.equal(await readFile(state.index, "utf8"), state.html);
  });
  await withBuildFixture(async state => {
    const outside = path.join(state.root, "outside.html");
    await writeFile(outside, state.html);
    await unlink(state.index);
    await symlink(outside, state.index);
    await assert.rejects(inlineHomeStyles(state.dist), /regular|within|symlink/i);
    assert.equal(await readFile(outside, "utf8"), state.html);
  });
});

test("build pipeline delivers home CSS before Pagefind and CSP without replacing the normal safety gates", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  const script = pkg.scripts.postbuild as string;
  const prune = script.indexOf("scripts/build/prune-internal-pages.mjs");
  const delivery = script.indexOf("scripts/build/home-style-delivery.mjs");
  const pagefind = script.indexOf("pagefind --site dist");
  const csp = script.indexOf("scripts/build/csp-hashes.mjs");
  const links = script.indexOf("scripts/ci/check-links.mjs");
  assert.ok(prune >= 0 && prune < delivery && delivery < pagefind && pagefind < csp && csp < links);
});
