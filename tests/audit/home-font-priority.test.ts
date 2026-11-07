import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");

test("only the homepage prioritises its unchanged above-fold italic variable face", () => {
  const layout = read("src/layouts/BaseLayout.astro");
  const module = read("src/lib/fontDelivery.ts");
  const css = read("src/styles/home-global.css");
  assert.match(module, /import newsreaderItalicHomeSubset from "\.\.\/assets\/fonts\/newsreader-latin-wght-italic-home\.woff2\?url"/);
  assert.match(css, /font-style: italic;[\s\S]*?font-display: swap;[\s\S]*?font-weight: 200 800;[\s\S]*?src: url\("\.\.\/assets\/fonts\/newsreader-latin-wght-italic-home\.woff2"\)/);
  assert.equal((layout.match(/href=\{newsreaderItalicHomeSubset\}/g) ?? []).length, 1);
  assert.match(layout, /!runwayInterior && <link rel="preload" href=\{newsreaderItalicHomeSubset\} as="font" type="font\/woff2" crossorigin/);
  assert.match(layout, /!systemTypography && \([\s\S]*?href=\{newsreaderLatinSubset\}[\s\S]*?href=\{geistLatinSubset\}[\s\S]*?href=\{newsreaderItalicHomeSubset\}/);
  assert.ok(read("src/styles/font-delivery.css").includes("newsreader-latin-wght-italic-site.woff2"), "interior/shared fallback is retained");
  for (const original of ["newsreader/wght.css", "newsreader/wght-italic.css", "geist/wght.css"]) {
    assert.ok(layout.indexOf(`@fontsource-variable/${original}`) < layout.indexOf('import "~/styles/font-delivery.css"'));
  }
});

test("home face is licensed, smaller and uses only the exact proved same-axis cmap", () => {
  const manifest = JSON.parse(read("src/assets/fonts/home-italic.manifest.json"));
  const bytes = readFileSync(new URL(`../../src/assets/fonts/${manifest.file}`, import.meta.url));
  const source = readFileSync(new URL(`../../${manifest.source}`, import.meta.url));
  const notice = readFileSync(new URL(`../../src/assets/fonts/${manifest.licence.file}`, import.meta.url));
  const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
  assert.equal(sha(bytes), manifest.sha256);
  assert.equal(bytes.length, manifest.bytes);
  assert.ok(bytes.length < 25000);
  assert.equal(sha(source), manifest.sourceSha256);
  assert.equal(sha(notice), manifest.licence.sha256);
  assert.equal(manifest.licence.spdx, "OFL-1.1");
  assert.equal(manifest.licence.reservedFontNamesDeclaredInSuppliedNotice, false);
  for (const key of ["axesEqual", "nameRecordsEqual", "namedInstancesEqual", "horizontalMetricsEqual", "lineMetricsEqual", "hintingBytecodeEqual", "globalHintingTablesEqual", "cmapEqual"]) assert.equal(manifest.invariants[key], true, key);
  assert.deepEqual(manifest.invariants.sourceAxes, manifest.invariants.outputAxes);
  assert.equal(manifest.shaping.allEqual, true);
  assert.ok(manifest.shaping.stringsCompared > 2000);
  assert.ok(manifest.shaping.glyphsCompared > 20000);
  assert.ok(read("src/styles/home-global.css").includes(`unicode-range: ${manifest.invariants.unicodeRange};`));
  for (const text of manifest.corpus.texts) for (const char of text) assert.ok(manifest.corpus.inputCodepoints.includes(char.codePointAt(0)));
});
