import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { transformHomeStyleRoute, routeHomeStyles } from "../../scripts/build/home-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const root = new URL("../../", import.meta.url);
const read = (file: string) => readFile(new URL(file, root), "utf8");
const route = ':root{--container-listing:1180px;--dp-ui-control:44px}.dp-strategy{display:block}';
const full = `${route}.dpst{display:grid}${".interior{color:inherit}".repeat(20)}`;
const rest = '.header{font-family:Newsreader;src:url("/_astro/newsreader.woff2")}';
const assets = new Map([["/_astro/home.123.css", route], ["/_astro/global.456.css", full], ["/_astro/rest.789.css", rest]]);
const meta = '<meta name="dp-home-style-asset" content="/_astro/home.123.css">';
const globalLink = '<link rel="stylesheet" href="/_astro/global.456.css">';
const restLink = '<link rel="stylesheet" href="/_astro/rest.789.css">';
const fixture = (tags = `${restLink}<script>window.between=1;</script>${globalLink}`) => `<!doctype html><html data-theme="dark"><head><meta charset="utf-8"><title>DubaiPoints</title><script>document.documentElement.dataset.theme="dark"</script>${meta}${tags}</head><body><h1>Fly further. Pay less.</h1><noscript>All content remains visible</noscript></body></html>`;
const lookup = (href: string) => assets.get(href);

test("homepage copy consists only of complete exact source sections in their original order", async () => {
  const [global, home, utility] = await Promise.all([read("src/styles/global.css"), read("src/styles/home-global.css"), read("src/styles/editorial-utility.css")]);
  const dividerBefore = (label: string) => global.lastIndexOf("/* ═", global.indexOf(label));
  const sections = [
    ["foundation", global.slice(0, dividerBefore("Salary Transfer Tracker (Preact island)"))],
    ["strategy", global.slice(global.indexOf("/* ── .dp-strategy"), global.indexOf("/* ── .dp-tabs"))],
    ["back-to-top", global.slice(dividerBefore("Back-to-top button"), global.indexOf("/* Key conditions to know"))],
    ["image-theme-motion", global.slice(dividerBefore("IMAGE SKELETON / LOADING STATES"), dividerBefore("Cinematic page stage"))],
    ["utility", utility],
  ];
  let previous = -1;
  for (const [name, expected] of sections) {
    const start = `/* dp-home-section:${name}:start */\n`;
    const end = `/* dp-home-section:${name}:end */`;
    const position = home.indexOf(start);
    assert.ok(position > previous, `${name} preserves original cascade order`);
    const copied = home.slice(position + start.length, home.indexOf(end, position));
    assert.equal(copied.trimEnd(), expected.trimEnd(), `${name}: update source and explicit copy together; never prune selectors`);
    previous = position;
  }
  assert.doesNotMatch(home, /\.dpst\s*\{|\.dp-prose\s*\{|\.dp-cr-hero\.dp-cr-hero\s*\{/);
  assert.match(home, /@import "tailwindcss";/, "the original reset, layers and helpers are retained");
  assert.ok(Buffer.byteLength(home) < Buffer.byteLength(global) / 3);
});

test("cached route link replaces the full-site bundle in place and retains every other byte", () => {
  const before = fixture();
  const result = transformHomeStyleRoute(before, lookup);
  assert.equal(result.replacedCount, 1);
  assert.equal(result.cssBytes, Buffer.byteLength(route));
  assert.equal(result.originalBytes, Buffer.byteLength(full));
  const link = result.html.match(/<link[^>]*data-dp-home-style="route-v1"[^>]*>/)?.[0];
  assert.ok(link);
  assert.equal(result.html.replace(link, globalLink), before.replace(meta, ""));
  assert.match(link, /rel="stylesheet"/);
  assert.doesNotMatch(link, /onload=|media=|disabled|preload|async|defer/);
  assert.deepEqual(extractInlineScripts(result.html), extractInlineScripts(before));
  assert.equal(result.html.slice(result.html.indexOf("<body>")), before.slice(before.indexOf("<body>")));
  assert.ok(result.html.includes(restLink));
  assert.doesNotMatch(result.html, /data-dp-home-css=|<style/);
});

test("route delivery is deterministic and verified idempotent without silent marker tampering", () => {
  const result = transformHomeStyleRoute(fixture(), lookup);
  assert.equal(transformHomeStyleRoute(fixture(), lookup).html, result.html);
  const repeated = transformHomeStyleRoute(result.html, lookup);
  assert.equal(repeated.replacedCount, 0);
  assert.equal(repeated.html, result.html);
  assert.throws(() => transformHomeStyleRoute(result.html, () => `${route} `), /fingerprint/);
  assert.throws(() => transformHomeStyleRoute(result.html.replace("route-v1", "route-v2"), lookup), /marker/);
});

test("missing, duplicate or ambiguous route metadata and stylesheet semantics fail closed", () => {
  for (const html of [fixture().replace(meta, ""), fixture().replace(meta, meta + meta), fixture(globalLink + globalLink), fixture(restLink), fixture().replace(globalLink, globalLink.replace(">", ' media="print">'))]) {
    assert.throws(() => transformHomeStyleRoute(html, lookup));
  }
  for (const href of ["https://cdn.example/home.css", "../home.css", "/_astro/../home.css", "/_astro/home.css?v=1", "/_astro/%2e.css", "/_astro/home.css#x"]) {
    assert.throws(() => transformHomeStyleRoute(fixture().replace("/_astro/home.123.css", href), lookup));
  }
  for (const css of [full, `${route}@import "x.css";`, `${route}.x{background:url(relative.png)}`, undefined]) {
    assert.throws(() => transformHomeStyleRoute(fixture(), (href: string) => href === "/_astro/home.123.css" ? css : lookup(href)));
  }
});

async function withFixture(run: (state: { dist: string; index: string; interior: string }) => Promise<void>) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "dp-home-route-test-"));
  const dist = path.join(temporary, "dist");
  const index = path.join(dist, "index.html");
  const interior = path.join(dist, "cards/index.html");
  try {
    await mkdir(path.join(dist, "_astro"), { recursive: true });
    await mkdir(path.join(dist, "cards"));
    await writeFile(index, fixture());
    await writeFile(interior, fixture().replace(meta, ""));
    for (const [href, css] of assets) await writeFile(path.join(dist, "_astro", path.basename(href)), css);
    await run({ dist, index, interior });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

test("file runner changes homepage only, retaining all reusable CSS and interior bytes", async () => withFixture(async ({ dist, index, interior }) => {
  const interiorBefore = await readFile(interior);
  const first = await routeHomeStyles(dist);
  assert.equal(first.replacedCount, 1);
  assert.equal(await readFile(index, "utf8"), first.html);
  assert.deepEqual(await readFile(interior), interiorBefore);
  for (const [href, css] of assets) assert.equal(await readFile(path.join(dist, "_astro", path.basename(href)), "utf8"), css);
  assert.equal((await routeHomeStyles(dist)).replacedCount, 0);
}));

test("unsafe or symlinked route CSS cannot leave a partially changed homepage", async () => {
  await withFixture(async ({ dist, index }) => {
    await writeFile(path.join(dist, "_astro", "home.123.css"), '@import "no.css";');
    await assert.rejects(routeHomeStyles(dist));
    assert.equal(await readFile(index, "utf8"), fixture());
  });
  await withFixture(async ({ dist, index }) => {
    const outside = path.join(path.dirname(dist), "outside.css");
    await writeFile(outside, route);
    await rm(path.join(dist, "_astro", "home.123.css"));
    await symlink(outside, path.join(dist, "_astro", "home.123.css"));
    await assert.rejects(routeHomeStyles(dist), /escaped|real|symlink/);
    assert.equal(await readFile(index, "utf8"), fixture());
  });
});

test("BaseLayout offers the alternative only on the homepage without changing normal imports", async () => {
  const source = await read("src/layouts/BaseLayout.astro");
  assert.match(source, /import "~\/styles\/global\.css";/);
  assert.match(source, /import "~\/styles\/editorial-utility\.css";/);
  assert.match(source, /import homeGlobalCss from "~\/styles\/home-global\.css\?url&no-inline"/);
  assert.match(source, /!runwayInterior && <meta name="dp-home-style-asset" content=\{homeGlobalCss\}/);
  assert.doesNotMatch(source, /<link[^>]*href=\{homeGlobalCss\}/);
});
