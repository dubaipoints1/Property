import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { stockSrcset } from "../../src/lib/stockDerivatives";
import { getStockEntry } from "../../src/lib/stockManifest";
import { assetJob, referencedCompactAssets } from "../../scripts/images/build-compact-assets.mjs";

test("homepage poster uses same-source responsive WebP delivery and an unchanged original fallback", async () => {
  const source = await readFile(new URL("../../src/components/HomeJourneyHero.astro", import.meta.url), "utf8");
  assert.match(source, /stockSrcset\(poster, import\.meta\.env\.PROD \? "feature" : undefined\)/);
  assert.match(source, /<picture>[\s\S]*<source type="image\/webp" srcset=\{posterWebpSrcset\} sizes=\{posterSizes\}/);
  assert.match(source, /src=\{`\/\$\{poster\.file\}`\}[\s\S]*width=\{poster\.width\} height=\{poster\.height\} fetchpriority="high"/);
  assert.match(source, /max-aspect-ratio: 4\/3\) 134vh, 100vw/);
  assert.match(source, /\.journey-poster, \.journey-video \{[^}]*object-fit: cover/);
  assert.doesNotMatch(source, /images\/ai\/compact\/[^" ]+\.webp/); // No guessed hard-coded derivative.
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
