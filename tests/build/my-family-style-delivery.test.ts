import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { inlineMyFamilyStyles, MY_FAMILY_STYLE_ROUTE } from "../../scripts/build/my-family-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const route = "/news/skywards-my-family-pooling-pause/";
const canonical = `<link rel="canonical" href="https://dubaipoints.ae${route}">`;
const styleLink = (href: string) => `<link rel="stylesheet" href="${href}">`;
const hrefs = ["/_astro/a.css", "/_astro/b.css"];
const css = ['@font-face{font-family:Geist;src:url("/_astro/geist.woff2")}', '.dp-reading-shell{color:var(--ink)}'];
const article = '<article class="dp-reading-shell" data-astro-cid-test>';
const original = `<!doctype html><html><head>${canonical}${styleLink(hrefs[0])}<script>window.dataLayer=[];</script>${styleLink(hrefs[1])}<script defer src="/_astro/existing-beacon.js"></script></head><body class="dp-system-typography">${article}<h1>My Family</h1><p>Accepted copy</p></article></body></html>`;
const marker = /<style data-dp-my-family-css="([^"]+)" data-dp-css-sha256="([a-f0-9]{64})">([\s\S]*?)<\/style>/g;

async function fixture(run: (dist: string, file: string) => Promise<void>) {
  const dist = await mkdtemp(path.join(os.tmpdir(), "dp-my-family-style-"));
  const file = path.join(dist, route.slice(1), "index.html");
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await mkdir(path.join(dist, "_astro"));
    await writeFile(file, original);
    await Promise.all(hrefs.map((href, i) => writeFile(path.join(dist, href.slice(1)), css[i])));
    await run(dist, file);
  } finally {
    await rm(dist, { recursive: true, force: true }); // Only the private test fixture.
  }
}

test("My Family only: exact compiled cascade, body, tracking and sibling output", async () => fixture(async (dist, file) => {
  assert.equal(MY_FAMILY_STYLE_ROUTE, route);
  const siblings = ["index.html", "news/index.html", "news/other/index.html"];
  for (const rel of siblings) {
    const sibling = path.join(dist, rel);
    await mkdir(path.dirname(sibling), { recursive: true });
    await writeFile(sibling, original);
  }
  assert.equal((await inlineMyFamilyStyles(dist))[0].inlinedCount, 2);
  const after = await readFile(file, "utf8");
  const rows = [...after.matchAll(marker)];
  assert.deepEqual(rows.map(row => row[1]), hrefs);
  assert.deepEqual(rows.map(row => row[3]), css);
  for (const [, , digest, source] of rows) assert.equal(digest, createHash("sha256").update(source).digest("hex"));
  assert.equal(after.replace(marker, (_, href) => styleLink(href)), original);
  assert.deepEqual(extractInlineScripts(after), extractInlineScripts(original));
  assert.doesNotMatch(after, /as="font"/);
  for (const rel of siblings) assert.equal(await readFile(path.join(dist, rel), "utf8"), original);
  assert.deepEqual(await Promise.all(hrefs.map(href => readFile(path.join(dist, href.slice(1)), "utf8"))), css);
  assert.equal((await inlineMyFamilyStyles(dist))[0].inlinedCount, 0);
  assert.equal(await readFile(file, "utf8"), after);
}));

test("My Family delivery rejects a wrong canonical, inert head and example-only article", async () => fixture(async (dist, file) => {
  for (const [bad, message] of [
    [original.replace(canonical, canonical.replace(route, "/news/other/")), /route identity/],
    [original.replace(article, `<!--${article}--><article>`), /route identity/],
    [original.replace(styleLink(hrefs[0]), `<noscript>${styleLink(hrefs[0])}</noscript>`), /inert markup/],
  ] as const) {
    await writeFile(file, bad);
    await assert.rejects(inlineMyFamilyStyles(dist), message);
    assert.equal(await readFile(file, "utf8"), bad);
  }
}));

test("My Family delivery fails closed for relative CSS URLs", async () => fixture(async (dist, file) => {
  await writeFile(path.join(dist, hrefs[1].slice(1)), '.x{background:url(../image.webp)}');
  await assert.rejects(inlineMyFamilyStyles(dist), /root-absolute/);
  assert.equal(await readFile(file, "utf8"), original);
}));

test("My Family delivery runs before Pagefind, CSP hashes and link validation", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  const order = ["cards-style-delivery.mjs", "my-family-style-delivery.mjs", "pagefind --site dist",
    "csp-hashes.mjs", "check-links.mjs"].map(name => pkg.scripts.postbuild.indexOf(name));
  assert.ok(order.every((pos, i) => pos >= 0 && (!i || pos > order[i - 1])));
});
