import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { EXPAT_STARTER_STYLE_ROUTE, inlineExpatStarterStyles } from "../../scripts/build/expat-starter-style-delivery.mjs";

const route = "/guides/expat-starter/";
const canonical = `<link rel="canonical" href="https://dubaipoints.ae${route}">`;
const article = '<article class="dp-reading-shell" data-astro-cid-guide>';
const link = (href: string) => `<link rel="stylesheet" href="${href}">`;
const hrefs = ["/_astro/reading.css", "/_astro/layout.css"];
const fontHrefs = ["newsreader-latin-wght-normal-site", "geist-latin-wght-normal-site", "newsreader-latin-wght-italic-site"]
  .map(name => `/_astro/${name}.test.woff2`);
const fontLink = (href: string) => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
const originalFonts = fontHrefs.slice(0, 2).map(fontLink).join("");
const prioritisedFonts = fontHrefs.map(fontLink).join("");
const css = [fontHrefs.map(href => `@font-face{font-family:Guide;src:url(${href})}`).join(""),
  ".dp-reading-shell{color:var(--ink)}"];
const inline = "<style>.dp-next-links{display:grid}</style>";
const html = `<!doctype html><html><head>${canonical}${link(hrefs[0])}${originalFonts}${inline}<script>window.theme="light";</script>${link(hrefs[1])}</head><body>${article}<h1>Expat Starter</h1><a href="/guides/expat-starter-first-credit-card/">First card</a></article></body></html>`;
const marker = /<style data-dp-expat-starter-css="([^"]+)" data-dp-css-sha256="([a-f0-9]{64})">([\s\S]*?)<\/style>/g;

async function fixture(fn: (dist: string, guide: string, assets: string[]) => Promise<void>) {
  const dist = await mkdtemp(path.join(os.tmpdir(), "dp-expat-starter-style-"));
  const guide = path.join(dist, route.slice(1), "index.html");
  const assets = hrefs.map(href => path.join(dist, href.slice(1)));
  try {
    await mkdir(path.dirname(guide), { recursive: true });
    await mkdir(path.join(dist, "_astro"));
    await writeFile(guide, html);
    await Promise.all(assets.map((file, i) => writeFile(file, css[i])));
    await fn(dist, guide, assets);
  } finally {
    await rm(dist, { recursive: true, force: true }); // Only this test's private fixture.
  }
}

test("only the exact Expat Starter route is rewritten, preserving every cascade position and asset", async () => fixture(async (dist, guide, assets) => {
  assert.equal(EXPAT_STARTER_STYLE_ROUTE, route);
  const other = ["index.html", "guides/expat-starter-first-credit-card/index.html", "airlines/skywards/index.html"];
  for (const rel of other) {
    const file = path.join(dist, rel);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  const [report] = await inlineExpatStarterStyles(dist);
  const after = await readFile(guide, "utf8");
  assert.equal(report.route, route);
  assert.equal(report.inlinedCount, hrefs.length);
  assert.deepEqual([...after.matchAll(marker)].map(([, href, sha, text]) => [href, sha, text]),
    hrefs.map((href, i) => [href, createHash("sha256").update(css[i]).digest("hex"), css[i]]));
  assert.equal(after.replace(marker, (_, href) => link(href)),
    html.replace(link(hrefs[0]) + originalFonts, prioritisedFonts + link(hrefs[0])));
  assert.deepEqual(await Promise.all(other.map(file => readFile(path.join(dist, file), "utf8"))), other.map(() => html));
  assert.deepEqual(await Promise.all(assets.map(file => readFile(file, "utf8"))), css);
  assert.equal((await inlineExpatStarterStyles(dist))[0].inlinedCount, 0);
  assert.equal(await readFile(guide, "utf8"), after);
}));

test("an unfamiliar or duplicate preload fails before any output is rewritten", async () => fixture(async (dist, guide) => {
  for (const input of [
    html.replace(originalFonts, ""),
    html.replace(originalFonts, originalFonts + fontLink(fontHrefs[2])),
    html.replace(fontLink(fontHrefs[0]), fontLink("/_astro/unexpected.test.woff2")),
  ]) {
    await writeFile(guide, input);
    await assert.rejects(inlineExpatStarterStyles(dist), /font preload identity mismatch/);
    assert.equal(await readFile(guide, "utf8"), input);
  }
}));

test("wrong or inert guide identity and inert head markup fail without output changes", async () => fixture(async (dist, guide) => {
  for (const input of [
    html.replace(canonical, canonical.replace(route, "/guides/expat-starter-first-credit-card/")),
    html.replace(canonical, `<!--${canonical}-->`),
    html.replace(canonical, canonical + canonical),
    html.replace(article, `<template>${article}</article></template><article>`),
    html.replace(inline, `<noscript>${link(hrefs[0])}</noscript>`),
    html.replace(inline, `<template>${link(hrefs[0])}</template>`),
  ]) {
    await writeFile(guide, input);
    await assert.rejects(inlineExpatStarterStyles(dist), /route identity|inert markup/);
    assert.equal(await readFile(guide, "utf8"), input);
  }
}));

test("unsafe or symlinked compiled input cannot partially rewrite the guide", async () => fixture(async (dist, guide, assets) => {
  await writeFile(assets[1], ".dp-reading-shell{background:url(../image.webp)}");
  await assert.rejects(inlineExpatStarterStyles(dist), /root-absolute/);
  await unlink(assets[1]);
  await symlink(assets[0], assets[1]);
  await assert.rejects(inlineExpatStarterStyles(dist), /contained|symlink/);
  assert.equal(await readFile(guide, "utf8"), html);
}));

test("Expat Starter delivery runs after existing delivery and before search, CSP and link guards", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  const offsets = ["first-card-style-delivery.mjs", "expat-starter-style-delivery.mjs", "pagefind --site dist",
    "csp-hashes.mjs", "check-links.mjs"].map(name => pkg.scripts.postbuild.indexOf(name));
  assert.ok(offsets.every((offset, index) => offset >= 0 && (!index || offset > offsets[index - 1])));
});
