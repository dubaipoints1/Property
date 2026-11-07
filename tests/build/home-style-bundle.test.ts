import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { bundleHomeStyles, transformHomeStyleBundle } from "../../scripts/build/home-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const hash = (css: string) => createHash("sha256").update(css).digest("hex");
const assets = new Map([
  ["/_astro/base.css", '@font-face{font-family:Newsreader;src:url("/_astro/font.woff2")} .same{color:red}'],
  ["/_astro/page.css", ".same{color:blue}@media(max-width:500px){.same{color:green}}"],
  ["/_astro/home.css", ":root{--container-listing:1180px;--dp-ui-control:44px}.dp-strategy{display:block}.same{color:inherit}"],
]);
const tags = [...assets].map(([href, css]) => `<link rel="stylesheet" href="${href}"${href.endsWith("home.css") ? ` data-dp-home-style="route-v1" data-dp-css-sha256="${hash(css)}"` : ""}>`).join("\n");
const fixture = (links = tags) => `<!doctype html><html><head><meta charset="utf-8"><script>window.before=1;</script>${links}<script>window.after=1;</script></head><body><h1>Complete content</h1><noscript>Readable</noscript></body></html>`;
const lookup = (href: string) => assets.get(href);

test("joins complete CSS bytes in cascade order, preserving every non-link head/body byte", () => {
  const html = fixture();
  const result = transformHomeStyleBundle(html, lookup);
  assert.equal(result.combinedCount, 3);
  assert.equal(result.css, [...assets.values()].join("\n"));
  assert.equal(result.cssBytes, Buffer.byteLength(result.css));
  assert.equal(result.sha256, hash(result.css));
  assert.ok(result.href.includes(result.sha256.slice(0, 20)));
  assert.equal((result.html.match(/rel="stylesheet"/g) ?? []).length, 1);
  const tag = result.html.match(/<link[^>]*data-dp-home-bundle[^>]*>/)![0];
  assert.equal(result.html.replace(tag, tags), html);
  assert.doesNotMatch(tag, /onload|media=|preload|async|defer|disabled/);
  assert.deepEqual(extractInlineScripts(result.html), extractInlineScripts(html));
});

test("bundle is deterministic and idempotent only with the exact fingerprint", () => {
  const first = transformHomeStyleBundle(fixture(), lookup);
  assert.equal(transformHomeStyleBundle(fixture(), lookup).html, first.html);
  const again = transformHomeStyleBundle(first.html, href => href === first.href ? first.css : undefined);
  assert.equal(again.html, first.html);
  assert.equal(again.combinedCount, 0);
  assert.throws(() => transformHomeStyleBundle(first.html, () => first.css + " "), /fingerprint/);
  assert.throws(() => transformHomeStyleBundle(first.html.replace("complete-v1", "complete-v2"), () => first.css), /marker/);
  assert.throws(() => transformHomeStyleBundle(first.html.replace("</head>", '<link rel="stylesheet" href="/_astro/extra.css"></head>'), lookup), /Ambiguous/);
});

test("never moves CSS across scripts, styles, comments, metadata or unknown link semantics", () => {
  for (const node of ['<script>window.middle=1;</script>', '<style>.same{color:black}</style>', '<!-- maintain boundary -->', '<meta name="x" content="y">']) {
    assert.throws(() => transformHomeStyleBundle(fixture(tags.replace("\n", node)), lookup), /not adjacent/);
  }
  for (const attribute of [' media="screen"', ' disabled', ' integrity="x"', ' onload="x"']) {
    assert.throws(() => transformHomeStyleBundle(fixture(tags.replace('href="/_astro/base.css"', `href="/_astro/base.css"${attribute}`)), lookup), /semantics/);
  }
  assert.throws(() => transformHomeStyleBundle(fixture(tags.replace('route-v1', 'bad')), lookup), /route/);
  assert.throws(() => transformHomeStyleBundle(fixture(tags.replace('data-dp-css-sha256="', 'data-dp-css-sha256="bad')), lookup), /fingerprint/);
  for (const css of ['@import "x.css";', '.x{background:url(relative.png)}', '@charset "UTF-8";.x{}', '@namespace svg "http://www.w3.org/2000/svg";svg|a{}', undefined]) {
    assert.throws(() => transformHomeStyleBundle(fixture(), href => href === "/_astro/base.css" ? css : lookup(href)));
  }
  for (const rel of ["StyleSheet", "STYLESHEET", "alternate stylesheet", "stylesheet alternate", " stylesheet", "stylesheet "]) {
    assert.throws(() => transformHomeStyleBundle(fixture(tags.replace('rel="stylesheet"', `rel="${rel}"`)), lookup), /semantics/);
    const first = transformHomeStyleBundle(fixture(), lookup);
    assert.throws(() => transformHomeStyleBundle(first.html.replace("</head>", `<link rel="${rel}" href="/_astro/extra.css"></head>`), () => first.css), /semantics/);
  }
});

async function temporary(run: (dist: string) => Promise<void>) {
  const folder = await mkdtemp(path.join(os.tmpdir(), "dp-css-bundle-"));
  try {
    await mkdir(path.join(folder, "_astro"));
    await mkdir(path.join(folder, "cards"));
    await writeFile(path.join(folder, "index.html"), fixture());
    await writeFile(path.join(folder, "cards/index.html"), "unchanged interior");
    for (const [href, css] of assets) await writeFile(path.join(folder, "_astro", path.basename(href)), css);
    await run(folder);
  } finally { await rm(folder, { recursive: true, force: true }); }
}

test("file runner adds only the cache asset and replaces homepage links; repeat verifies without writes", async () => temporary(async dist => {
  const first = await bundleHomeStyles(dist);
  assert.equal(await readFile(path.join(dist, "index.html"), "utf8"), first.html);
  assert.equal(await readFile(path.join(dist, "_astro", path.basename(first.href)), "utf8"), first.css);
  assert.equal(await readFile(path.join(dist, "cards/index.html"), "utf8"), "unchanged interior");
  for (const [href, css] of assets) assert.equal(await readFile(path.join(dist, "_astro", path.basename(href)), "utf8"), css);
  assert.equal((await bundleHomeStyles(dist)).combinedCount, 0);
}));

test("unsafe/symlinked inputs and existing destination mismatch leave HTML unchanged", async () => {
  await temporary(async dist => {
    const source = path.join(dist, "_astro/base.css");
    await rm(source);
    await symlink(path.join(dist, "_astro/page.css"), source);
    await assert.rejects(bundleHomeStyles(dist), /Unsafe/);
    assert.equal(await readFile(path.join(dist, "index.html"), "utf8"), fixture());
  });
  await temporary(async dist => {
    const expected = transformHomeStyleBundle(fixture(), lookup);
    await writeFile(path.join(dist, "_astro", path.basename(expected.href)), "not the generated bytes");
    await assert.rejects(bundleHomeStyles(dist), /differs/);
    assert.equal(await readFile(path.join(dist, "index.html"), "utf8"), fixture());
  });
  await temporary(async dist => {
    const html = fixture(tags.replace('rel="stylesheet"', 'rel="StyleSheet"'));
    await writeFile(path.join(dist, "index.html"), html);
    await assert.rejects(bundleHomeStyles(dist), /semantics/);
    assert.equal(await readFile(path.join(dist, "index.html"), "utf8"), html);
  });
});
