import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import compactAssets, { assetJob, referencedCompactAssets } from "../../scripts/images/build-compact-assets.mjs";
import { compactLogoSrcset, stockSrcset } from "../../src/lib/stockDerivatives";
import { getStockEntry } from "../../src/lib/stockManifest";

test("compact assets use only eligible manifest originals and the matching logo directory", () => {
  const e = getStockEntry("programme-skywards");
  assert.ok(e);
  const entries = new Map([[e.slug, e]]);
  assert.deepEqual(assetJob("images/stock/compact/programme-skywards-800.webp", entries),
    { source: e.file, width: 800 });
  assert.throws(() => assetJob("images/ai/compact/programme-skywards-800.webp", entries), /eligible manifest/);
  assert.throws(() => assetJob("images/stock/compact/not-in-manifest-240.webp", entries), /eligible manifest/);
  assert.throws(() => assetJob("logos/banks/compact/../../unapproved-192.png", entries), /Unexpected/);
  assert.deepEqual(assetJob("logos/banks/compact/emirates-nbd-192.png", entries),
    { source: "logos/banks/emirates-nbd.png", width: 192, logo: true });
  assert.deepEqual(assetJob("logos/partners/compact/mann-marzi-360.png", entries),
    { source: "logos/partners/mann-marzi.png", width: 360, logo: true });
});

test("planned delivery widths preserve ordered srcset candidates and the original fallback", () => {
  const e = getStockEntry("programme-skywards");
  assert.ok(e);
  const srcset = stockSrcset(e, "feature") ?? "";
  const urls = srcset.split(", ");
  const widths = urls.map((item) => Number(item.split(" ")[1].replace("w", "")));
  assert.deepEqual(widths, [...widths].sort((a, b) => a - b));
  assert.ok(widths.includes(800));
  assert.ok(widths.includes(960));
  assert.equal(urls.at(-1), `/${e.file} ${e.width}w`);
  assert.doesNotMatch(stockSrcset(e) ?? "", /\/compact\//);
  assert.equal(compactLogoSrcset("/logos/partners/air-arabia.svg"), undefined);
  assert.equal(compactLogoSrcset("/logos/partners/missing-test-logo.png"), undefined);
});

test("build hook emits same-source copies and keeps the approved original intact", async () => {
  const out = await mkdtemp(path.join(tmpdir(), "dp-compact-test-"));
  const candidates = [
    "images/stock/compact/programme-skywards-800.webp",
    "logos/partners/compact/mann-marzi-192.png",
  ];
  const logo = "public/logos/partners/mann-marzi.png";
  const before = await readFile(logo);
  const fixture = `<img srcset="/${candidates[0]} 800w, /original.jpg 1400w"><img srcset="/${candidates[1]} 192w">`;
  try {
    assert.deepEqual(referencedCompactAssets(fixture), candidates);
    await writeFile(path.join(out, "index.html"), fixture);
    await compactAssets().hooks["astro:build:done"]({ dir: pathToFileURL(out + path.sep), logger: { info() {} } });
    const photo = await sharp(path.join(out, candidates[0])).metadata();
    assert.equal(photo.format, "webp");
    assert.equal(photo.width, 800);
    const deliveredLogo = await sharp(path.join(out, candidates[1])).metadata();
    const originalLogo = await sharp(before).metadata();
    assert.equal(deliveredLogo.format, "png");
    assert.equal(deliveredLogo.width, 192);
    assert.equal(deliveredLogo.hasAlpha, originalLogo.hasAlpha);
    assert.ok(Math.abs(deliveredLogo.width! / deliveredLogo.height! - originalLogo.width! / originalLogo.height!) < 0.04);
    assert.ok((await stat(path.join(out, candidates[1]))).size < before.length);
    assert.deepEqual(await readFile(logo), before);
  } finally {
    await rm(out, { force: true, recursive: true });
  }
});
