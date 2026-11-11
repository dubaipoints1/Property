import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FIRST_CARD_STYLE_ROUTE, inlineFirstCardStyles } from "../../scripts/build/first-card-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const route = "/guides/expat-starter-first-credit-card/";
const canonical = `<link rel="canonical" href="https://dubaipoints.ae${route}">`;
const article = '<article class="dp-reading-shell" data-astro-cid-test>';
const first = '<link rel="stylesheet" href="/_astro/first.css">';
const second = '<link rel="stylesheet" href="/_astro/second.css">';
const css = ['@font-face{font-family:Geist;src:url("/_astro/geist.woff2")}', '.dp-reading-shell{color:var(--ink)}'];
const html = `<!doctype html><html><head>${canonical}${first}<link rel="preload" href="/_astro/geist.woff2" as="font" crossorigin><script>window.theme="light";</script>${second}</head><body>${article}<h1>First card</h1><p>Original prose</p></article></body></html>`;
const marker = /<style data-dp-first-card-css="([^"]+)" data-dp-css-sha256="([a-f0-9]{64})">([\s\S]*?)<\/style>/g;

async function fixture(fn: (dist: string, guide: string, assets: string[]) => Promise<void>) {
  const dist = await mkdtemp(path.join(os.tmpdir(), "dp-first-card-style-"));
  const guide = path.join(dist, route.slice(1), "index.html");
  const assets = ["first.css", "second.css"].map(name => path.join(dist, "_astro", name));
  try {
    await mkdir(path.dirname(guide), { recursive: true });
    await mkdir(path.join(dist, "_astro"), { recursive: true });
    await writeFile(guide, html);
    await Promise.all(assets.map((file, i) => writeFile(file, css[i])));
    await fn(dist, guide, assets);
  } finally {
    await rm(dist, { recursive: true, force: true }); // Only this test's private fixture.
  }
}

test("first-card route only: exact CSS bytes and order, original scripts, other pages and assets untouched", async () => fixture(async (dist, guide, assets) => {
  assert.equal(FIRST_CARD_STYLE_ROUTE, route);
  const untouched = ["index.html", "guides/expat-starter/index.html", "airlines/skywards/index.html"];
  for (const rel of untouched) {
    const file = path.join(dist, rel);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html); // Even identical-looking copies outside the allowlist are not touched.
  }
  const [report] = await inlineFirstCardStyles(dist);
  assert.equal(report.route, route);
  assert.equal(report.inlinedCount, 2);
  const after = await readFile(guide, "utf8");
  const styles = [...after.matchAll(marker)];
  assert.deepEqual(styles.map(match => match[3]), css);
  for (const [_, , sha, text] of styles) assert.equal(createHash("sha256").update(text).digest("hex"), sha);
  assert.equal(after.replace(marker, (_, href) => `<link rel="stylesheet" href="${href}">`), html);
  assert.deepEqual(extractInlineScripts(after), extractInlineScripts(html));
  for (const rel of untouched) assert.equal(await readFile(path.join(dist, rel), "utf8"), html);
  assert.deepEqual(await Promise.all(assets.map(file => readFile(file, "utf8"))), css);
  assert.equal((await inlineFirstCardStyles(dist))[0].inlinedCount, 0);
  assert.equal(await readFile(guide, "utf8"), after);
}));

test("first-card identity rejects wrong, duplicate and example canonicals and missing actual article", async () => fixture(async (dist, guide) => {
  for (const wrong of [
    html.replace(canonical, ""),
    html.replace(canonical, canonical + canonical),
    html.replace(canonical, `<!--${canonical}-->`),
    html.replace(canonical, canonical.replace("dubaipoints.ae", "example.org")),
    html.replace(article, `<!--${article}--><article class="wrong">`),
    html.replace(article, `<script>window.example=${JSON.stringify(article)}</script><article class="wrong">`),
    html.replace(article, '<article class="wrong">').replace("</head>", `<script>window.example=${JSON.stringify("<body>" + article)}</script></head>`),
    html.replace(article, `<template>${article}</article></template><article class="wrong">`),
  ]) {
    await writeFile(guide, wrong);
    await assert.rejects(inlineFirstCardStyles(dist), /route identity/);
    assert.equal(await readFile(guide, "utf8"), wrong);
  }
}));

test("a body-like string in an actual head script is preserved but not used as the body boundary", async () => fixture(async (dist, guide) => {
  const withExample = html.replace("</head>", '<script>window.example="<body>";</script></head>');
  await writeFile(guide, withExample);
  await inlineFirstCardStyles(dist);
  const after = await readFile(guide, "utf8");
  assert.equal(after.replace(marker, (_, href) => `<link rel="stylesheet" href="${href}">`), withExample);
}));

test("a missing, unsafe or symlinked CSS input fails before changing the first-card output", async () => fixture(async (dist, guide, assets) => {
  await unlink(assets[1]);
  await assert.rejects(inlineFirstCardStyles(dist));
  await writeFile(assets[1], '.x{background:url(../asset.png)}');
  await assert.rejects(inlineFirstCardStyles(dist), /root-absolute/);
  await unlink(assets[1]);
  await symlink(assets[0], assets[1]);
  await assert.rejects(inlineFirstCardStyles(dist), /contained|symlink/);
  assert.equal(await readFile(guide, "utf8"), html);
}));

test("first-card delivery runs after programme and home delivery, before index, CSP and links", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  const order = ["home-style-delivery.mjs", "programme-style-delivery.mjs", "first-card-style-delivery.mjs",
    "pagefind --site dist", "csp-hashes.mjs", "check-links.mjs"].map(name => pkg.scripts.postbuild.indexOf(name));
  assert.ok(order.every((pos, i) => pos >= 0 && (i === 0 || pos > order[i - 1])));
});
