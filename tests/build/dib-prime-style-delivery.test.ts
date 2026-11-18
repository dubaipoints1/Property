import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DIB_PRIME_STYLE_ROUTES, inlineDibPrimeStyles } from "../../scripts/build/dib-prime-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const headings = {
  "/banks/dib/": "Dubai Islamic Bank",
  "/cards/dib-prime-gold/": "DIB Prime Gold Card",
  "/cards/dib-prime-signature/": "DIB Prime Signature Card",
  "/cards/dib-prime-infinite/": "DIB Prime Infinite Card",
};
type Route = keyof typeof headings;
const routes = Object.keys(headings) as Route[];
const neighbours = ["/", "/cards/", "/cards/finder/", "/cards/dib-prime-platinum/", "/banks/adib/"];
const hrefs = ["/_astro/base.a1.css", "/_astro/detail.b2.css"];
const fonts = ["/_astro/newsreader-latin-wght-normal-site.a1.woff2", "/_astro/geist-latin-wght-normal-site.b2.woff2"];
const script = '<script>window.dataLayer=[];</script>';
const css = [
  '@font-face{font-family:Newsreader;src:url("' + fonts[0] + '")} .sample{color:red}',
  '@font-face{font-family:Geist;src:url("' + fonts[1] + '")} .sample{color:blue}',
];
const hint = (href: string) => '<link rel="preload" href="' + href + '" as="font" type="font/woff2" crossorigin>';
const link = (href: string) => '<link rel="stylesheet" href="' + href + '">';
const canonical = (route: string) => '<link rel="canonical" href="https://dubaipoints.ae' + route + '">';
const html = (route: Route) => '<!doctype html><html><head>' + canonical(route) + link(hrefs[0])
  + script + fonts.map(hint).join("") + link(hrefs[1]) + '</head><body><h1>' + headings[route]
  + (route === "/banks/dib/" ? '</h1><article class="dp-bank-body"><section id="bank-cards"></section>'
    : ' source profile (November 2026)</h1><article class="dp-cr-body">')
  + '<p>Exact editorial copy.</p></article><script defer src="/site.js"></script></body></html>';
const file = (dir: string, route: string) => path.join(dir, route.slice(1), "index.html");
const style = /<style data-dp-dib-prime-css="([^"]+)" data-dp-css-sha256="([0-9a-f]{64})">([\s\S]*?)<\/style>/g;

async function fixture(run: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "dp-dib-prime-style-"));
  try {
    for (const route of [...routes, ...neighbours]) {
      await mkdir(path.dirname(file(dir, route)), { recursive: true });
      await writeFile(file(dir, route), Object.hasOwn(headings, route) ? html(route as Route) : "untouched " + route);
    }
    await mkdir(path.join(dir, "_astro"));
    await Promise.all(hrefs.map((href, i) => writeFile(path.join(dir, href.slice(1)), css[i])));
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true }); // Private fixture only.
  }
}

test("DIB CSS delivery changes four exact routes only; cascade, stylesheet bytes, body, scripts and normal fonts survive", async () => fixture(async dir => {
  assert.deepEqual(DIB_PRIME_STYLE_ROUTES, routes);
  assert.deepEqual((await inlineDibPrimeStyles(dir)).map(row => [row.route, row.inlinedCount]), routes.map(route => [route, 2]));
  const updated = new Map<string, string>();
  for (const route of routes) {
    const after = await readFile(file(dir, route), "utf8");
    updated.set(route, after);
    const markers = [...after.matchAll(style)];
    assert.deepEqual(markers.map(row => row[1]), hrefs);
    assert.deepEqual(markers.map(row => row[3]), css);
    for (const [, , digest, source] of markers) assert.equal(digest, createHash("sha256").update(source).digest("hex"));
    const restored = after.replace(style, (_, href) => link(href)).replace(fonts.map(hint).join(""), "")
      .replace(script, script + fonts.map(hint).join(""));
    assert.equal(restored, html(route));
    assert.deepEqual(extractInlineScripts(after), extractInlineScripts(html(route)));
    assert.ok(after.indexOf(hint(fonts[1])) < after.indexOf("<style"));
  }
  for (const sibling of neighbours) assert.equal(await readFile(file(dir, sibling), "utf8"), "untouched " + sibling);
  assert.deepEqual(await Promise.all(hrefs.map(href => readFile(path.join(dir, href.slice(1)), "utf8"))), css);
  assert.ok((await inlineDibPrimeStyles(dir)).every(row => row.inlinedCount === 0));
  for (const [route, after] of updated) assert.equal(await readFile(file(dir, route), "utf8"), after);
}));

test("A changed route, missing font, or unsupported later stylesheet fails before any route is written", async () => fixture(async dir => {
  const last = "/cards/dib-prime-infinite/";
  const broken = [
    [html(last).replace(canonical(last), canonical("/cards/dib-prime-platinum/")), /route identity/],
    [html(last).replace(headings[last], headings["/cards/dib-prime-signature/"]), /route identity/],
    [html(last).replace("<h1>", "<!--<h1>").replace("</h1>", "</h1>-->"), /route identity/],
    [html(last).replace(hint(fonts[0]), ""), /font preload identity/],
    [html(last).replace(link(hrefs[1]), '<link rel="stylesheet" media="print" href="' + hrefs[1] + '">'), /stylesheet semantics/],
  ] as const;
  for (const [bad, message] of broken) {
    await writeFile(file(dir, last), bad);
    await assert.rejects(inlineDibPrimeStyles(dir), message);
    assert.equal(await readFile(file(dir, last), "utf8"), bad);
    for (const route of routes.slice(0, -1)) assert.equal(await readFile(file(dir, route), "utf8"), html(route));
  }
}));

test("The exact route transform runs before Pagefind, CSP and link validation", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  const order = ["my-family-style-delivery.mjs", "dib-prime-style-delivery.mjs", "pagefind --site dist",
    "csp-hashes.mjs", "check-links.mjs"].map(name => pkg.scripts.postbuild.indexOf(name));
  assert.ok(order.every((pos, i) => pos >= 0 && (!i || pos > order[i - 1])));
});
