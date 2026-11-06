import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { stockAvifSrcset, stockSrcset } from "../../src/lib/stockDerivatives";
import { getStockEntry } from "../../src/lib/stockManifest";
import compactAssets, { assetJob, referencedCompactAssets } from "../../scripts/images/build-compact-assets.mjs";

test("homepage poster uses same-source responsive WebP delivery and an unchanged original fallback", async () => {
  const source = await readFile(new URL("../../src/components/HomeJourneyHero.astro", import.meta.url), "utf8");
  assert.match(source, /stockSrcset\(poster, import\.meta\.env\.PROD \? "feature" : undefined\)/);
  assert.match(source, /<picture>[\s\S]*<source type="image\/webp" srcset=\{posterWebpSrcset\} sizes=\{posterSizes\}/);
  assert.match(source, /src=\{`\/\$\{poster\.file\}`\}[\s\S]*width=\{poster\.width\} height=\{poster\.height\} fetchpriority="high"/);
  assert.match(source, /max-aspect-ratio: 4\/3\) 134vh, 100vw/);
  assert.match(source, /\.journey-poster, \.journey-video \{[^}]*object-fit: cover/);
  assert.doesNotMatch(source, /images\/ai\/compact\/[^" ]+\.webp/); // No guessed hard-coded derivative.
});

test("AVIF is progressive and production-only, before unchanged WebP and original fallback", async () => {
  const source = await readFile(new URL("../../src/components/HomeJourneyHero.astro", import.meta.url), "utf8");
  assert.match(source, /stockAvifSrcset\(poster, import\.meta\.env\.PROD \? "feature" : undefined\)/);
  assert.match(source, /posterAvifSrcset && <source type="image\/avif" srcset=\{posterAvifSrcset\} sizes=\{posterSizes\}/);
  assert.ok(source.indexOf('<source type="image/avif"') < source.indexOf('<source type="image/webp"'));
  assert.match(source, /src=\{`\/\$\{poster\.file\}`\} alt="" width=\{poster\.width\} height=\{poster\.height\} fetchpriority="high" decoding="async"/);
  const hook = await readFile(new URL("../../scripts/images/build-compact-assets.mjs", import.meta.url), "utf8");
  assert.match(hook, /\.avif\(\{ quality: 50, effort: 6, chromaSubsampling: "4:4:4" \}\)/, "explicit approved encoder settings; Sharp metadata does not expose AVIF chroma subsampling");
  const poster = getStockEntry("hero-card-desk");
  assert.ok(poster);
  assert.equal(stockAvifSrcset(poster), undefined, "dev cannot emit build-only AVIF URLs");
  assert.equal(stockSrcset(poster), "/images/ai/thumb/hero-card-desk.webp 640w, /images/ai/md/hero-card-desk.webp 1200w, /images/ai/hero-card-desk.jpg 1365w");
  assert.doesNotMatch(stockSrcset(poster, "feature") ?? "", /\.avif/);
});

test("AVIF candidates have ascending known truthful widths and require the matching manifest source", () => {
  const poster = getStockEntry("hero-card-desk");
  assert.ok(poster);
  const entries = new Map([[poster.slug, poster]]);
  const srcset = stockAvifSrcset(poster, "feature");
  assert.ok(srcset);
  const candidates = srcset.split(", ");
  const widths = candidates.map(candidate => Number.parseInt(candidate.split(" ")[1]));
  assert.deepEqual(widths, [400, 800, 960, 1200, 1365]);
  for (const [index, candidate] of candidates.entries()) {
    const asset = candidate.split(" ")[0].slice(1);
    assert.deepEqual(assetJob(asset, entries), { source: poster.file, width: widths[index], format: "avif" });
  }
  assert.equal(stockAvifSrcset({ ...poster, width: 399 }, "feature"), undefined);
  assert.equal(stockAvifSrcset({ ...poster, width: 800 }, "feature"), "/images/ai/compact/hero-card-desk-400.avif 400w, /images/ai/compact/hero-card-desk-800.avif 800w");
  assert.doesNotMatch(stockAvifSrcset({ ...poster, width: 1400 }, "feature") ?? "", /1365w/, "1365 is optional original size, not another invented full-size descriptor");
  assert.equal(stockAvifSrcset({ ...poster, file: "images/ai/another-source.jpg" }, "feature"), undefined);
  assert.equal(stockAvifSrcset({ ...poster, file: "images/ai/../ai/hero-card-desk.jpg" }, "feature"), undefined);
  assert.equal(stockAvifSrcset({ ...poster, slug: "../hero-card-desk" }, "feature"), undefined);
});

test("unknown AVIF widths, traversal, source mismatch and upscaling requests fail closed", () => {
  const poster = getStockEntry("hero-card-desk");
  assert.ok(poster);
  const entries = new Map([[poster.slug, poster]]);
  for (const width of [0, 240, 1000, 1366, 1600]) {
    const asset = `images/ai/compact/hero-card-desk-${width}.avif`;
    assert.deepEqual(referencedCompactAssets(`<source srcset="/${asset} ${width}w">`), [asset], "unknown emitted widths reach validation rather than silently becoming missing assets");
    assert.throws(() => assetJob(asset, entries), /Unsupported AVIF/);
  }
  assert.throws(() => assetJob("images/ai/compact/hero-card-desk-0400.avif", entries), /Unsupported AVIF/);
  assert.throws(() => assetJob("images/ai/compact/../../outside-960.avif", entries), /Unexpected/);
  assert.throws(() => assetJob("images/stock/compact/hero-card-desk-960.avif", entries), /eligible manifest/);
  assert.throws(() => assetJob("images/ai/compact/not-in-manifest-960.avif", entries), /eligible manifest/);
  const asset = "images/ai/compact/hero-card-desk-1200.avif";
  for (const changed of [
    { ...poster, width: 1199 },
    { ...poster, width: Number.NaN },
    { ...poster, slug: "other" },
    { ...poster, file: "images/ai/other.jpg" },
    { ...poster, file: "images/ai/../../outside.jpg" },
  ]) assert.throws(() => assetJob(asset, new Map([[poster.slug, changed]])), /eligible manifest/);
  assert.throws(() => assetJob("images/ai/compact/hero-card-desk-1365.avif", new Map([[poster.slug, { ...poster, width: 1400 }]])), /eligible manifest/);
});

test("requested-only hook emits actual proportional AVIFs and leaves original and WebP files untouched", async () => {
  const poster = getStockEntry("hero-card-desk");
  assert.ok(poster);
  const out = await mkdtemp(path.join(tmpdir(), "dp-hero-avif-test-"));
  const sourcePath = path.join("public", poster.file);
  const sourceBefore = await readFile(sourcePath);
  const webpBefore = await readFile("public/images/ai/md/hero-card-desk.webp");
  const srcset = stockAvifSrcset(poster, "feature");
  assert.ok(srcset);
  const fixture = `<picture><source type="image/avif" srcset="${srcset}"><img src="/${poster.file}"></picture>`;
  const requested = referencedCompactAssets(fixture);
  assert.equal(requested.length, 5);
  try {
    await writeFile(path.join(out, "index.html"), fixture);
    await compactAssets().hooks["astro:build:done"]({ dir: pathToFileURL(out + path.sep), logger: { info() {} } });
    const outputNames = await readdir(path.join(out, "images/ai/compact"));
    assert.deepEqual(outputNames.sort(), requested.map(asset => path.basename(asset)).sort(), "do not generate unrequested derivatives");
    for (const asset of requested) {
      const data = await readFile(path.join(out, asset));
      const metadata = await sharp(data).metadata();
      const width = Number.parseInt(/-(\d+)\.avif$/.exec(asset)![1]);
      assert.equal(metadata.format, "heif");
      assert.equal(metadata.compression, "av1", "AV1-in-HEIF, not a renamed WebP");
      assert.equal(data.toString("ascii", 4, 8), "ftyp");
      assert.equal(data.toString("ascii", 8, 12), "avif");
      assert.equal(metadata.width, width);
      assert.equal(metadata.height, Math.round(poster.height * width / poster.width));
      assert.ok(metadata.width! <= poster.width);
      assert.ok(data.length < sourceBefore.length);
    }
    assert.deepEqual(await readFile(sourcePath), sourceBefore);
    assert.deepEqual(await readFile("public/images/ai/md/hero-card-desk.webp"), webpBefore);
  } finally {
    await rm(out, { force: true, recursive: true });
  }
});

test("the existing build hook recognises eligible poster candidates in picture source markup", () => {
  const poster = getStockEntry("hero-card-desk");
  assert.ok(poster);
  const candidates = (stockSrcset(poster, "feature") ?? "").split(", ")
    .filter(candidate => /\.webp\s+\d+w$/.test(candidate));
  assert.ok(candidates.some(candidate => candidate.endsWith(" 1200w")));
  assert.ok(candidates.some(candidate => candidate.endsWith(" 960w")));
  assert.ok(candidates.every(candidate => candidate.includes(`/${poster.slug}`)));
  const html = `<picture><source type="image/webp" srcset="${candidates.join(", ")}"><img src="/${poster.file}" width="${poster.width}" height="${poster.height}"></picture>`;
  const requested = referencedCompactAssets(html);
  assert.equal(requested.length, 3);
  const entries = new Map([[poster.slug, poster]]);
  for (const requestedPath of requested) {
    assert.equal(assetJob(requestedPath, entries).source, poster.file);
  }
});
