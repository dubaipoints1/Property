import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file: string) => readFileSync(path.join(root, file));
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(read("src/assets/fonts/home-normal.manifest.json").toString("utf8"));
const shared = JSON.parse(read("src/assets/fonts/font-subsets.manifest.json").toString("utf8"));

function expandRanges(value: string): number[] {
  const codes: number[] = [];
  for (const part of value.split(",")) {
    const match = /^U\+([A-F0-9]{4,6})(?:-([A-F0-9]{4,6}))?$/.exec(part);
    assert.ok(match, `exact cmap range: ${part}`);
    const first = Number.parseInt(match[1], 16);
    const last = Number.parseInt(match[2] ?? match[1], 16);
    assert.ok(first <= last && last <= 0x10ffff);
    for (let code = first; code <= last; code++) codes.push(code);
  }
  assert.equal(new Set(codes).size, codes.length);
  return codes;
}

test("home normal is the same reviewed variable source with a smaller, hash-bound WOFF2", () => {
  assert.equal(manifest.version, 1);
  assert.equal(manifest.family, "Newsreader Variable");
  assert.equal(manifest.style, "normal");
  assert.equal(manifest.sourceVersion, "5.3.0");
  assert.equal(manifest.sourceUrl, "https://cdn.jsdelivr.net/npm/@fontsource-variable/newsreader@5.3.0/files/newsreader-latin-wght-normal.woff2");
  const source = read(manifest.source);
  const output = read(`src/assets/fonts/${manifest.file}`);
  assert.equal(hash(source), manifest.sourceSha256);
  assert.equal(source.length, manifest.sourceBytes);
  assert.equal(hash(output), manifest.sha256);
  assert.equal(output.length, manifest.bytes);
  assert.equal(output.toString("ascii", 0, 4), "wOF2");
  assert.equal(output.readUInt32BE(4), 0x00010000);
  assert.equal(output.readUInt32BE(8), output.length);
  const originalShared = shared.faces.find((face: any) => face.family === manifest.family && face.style === "normal");
  assert.equal(originalShared.sourceSha256, manifest.sourceSha256);
  assert.ok(originalShared.bytes - output.length > 10 * 1024, "measured file-byte saving, not a wire or score claim");
  assert.ok(output.length < source.length);
});

test("home normal preserves full axes, original names, metrics, hinting, outlines and layout", () => {
  const proof = manifest.invariants;
  for (const key of ["axesEqual", "namedInstancesEqual", "nameRecordsEqual", "horizontalMetricsEqual", "lineMetricsEqual", "hintingBytecodeEqual", "globalHintingTablesEqual", "cmapEqual", "outlinesAndVariableAdvancesEqual"]) {
    assert.equal(proof[key], true, key);
  }
  assert.deepEqual(proof.outputAxes, proof.sourceAxes);
  assert.equal(proof.sourceAxes.length, 1);
  assert.deepEqual(proof.sourceAxes[0].slice(0, 4), ["wght", 200, 400, 800]);
  assert.deepEqual(proof.outlineWeights, [200, 300, 400, 450, 500, 600, 700, 800]);
  assert.equal(proof.outlineGlyphWeightPairs, proof.outputGlyphs * proof.outlineWeights.length);
  assert.deepEqual(proof.layoutTablesRetained, { GSUB: true, GPOS: true, GDEF: true });
  for (const flag of ["--layout-features=*", "--layout-scripts=*", "--hinting", "--name-IDs=*", "--name-languages=*", "--no-recalc-timestamp", "--no-recalc-bounds"]) assert.ok(manifest.subsetFlags.includes(flag));
});

test("home corpus records raw Unicode spaces, complete ASCII and exact observed cmap instead of a Latin guess", () => {
  const corpus = manifest.corpus;
  assert.equal(corpus.htmlFile, "index.html");
  assert.match(corpus.htmlSha256, /^[a-f0-9]{64}$/);
  assert.ok(corpus.htmlBytes > 10000);
  assert.equal(corpus.unicodeWhitespacePreserved, true);
  assert.equal(corpus.nbSpaceCount, corpus.texts.reduce((total: number, text: string) => total + [...text].filter(char => char === "\u00a0").length, 0));
  assert.ok(corpus.nbSpaceCount > 0, "the current homepage contains real non-breaking spaces");
  assert.ok(corpus.texts.some((text: string) => /AED\u00a0\d/.test(text)), "currency spacing remains a real NBSP, not a normal-space substitute");
  assert.ok(corpus.texts.some((text: string) => /^ +Cards +$/.test(text)), "ordinary raw spaces are not silently stripped");
  const serialised = Buffer.from(JSON.stringify(corpus.texts, null, 2) + "\n");
  assert.equal(hash(serialised), corpus.textSha256);
  const observed = new Set<number>(Array.from({ length: 95 }, (_, index) => index + 32));
  for (const text of corpus.texts) for (const char of text) if (char.codePointAt(0)! >= 32) observed.add(char.codePointAt(0)!);
  assert.deepEqual([...observed].sort((a, b) => a - b), corpus.inputCodepoints);
  for (let code = 32; code <= 126; code++) assert.ok(manifest.invariants.codepoints.includes(code));
  assert.ok(manifest.invariants.codepoints.includes(0x00a0));
  assert.ok(corpus.inputCodepoints.includes(0x2192));
  assert.ok(!manifest.invariants.codepoints.includes(0x2192), "unsupported arrows retain the original fallback, not a claimed glyph");
  const sharedNormal = shared.faces.find((face: any) => face.family === manifest.family && face.style === "normal");
  assert.ok(sharedNormal.invariants.codepoints.includes(0x00e9), "the shared face retains diacritics not requested by this homepage corpus");
});

test("home normal records real shaping parity at all reviewed weights and feature settings with bounded claims", () => {
  assert.deepEqual(manifest.tools, { fontTools: "4.68.0", brotli: "1.2.1", harfBuzz: "hb-shape (HarfBuzz) 14.2.1" });
  const proof = manifest.shaping;
  assert.equal(proof.allEqual, true);
  assert.match(proof.compared, /Glyph identity.*clusters.*advances.*offsets.*extents/);
  const full = proof.cases.filter((entry: any) => entry.corpus === "all-supported-body-ui");
  assert.equal(full.length, 1);
  assert.equal(full[0].weight, 400);
  assert.equal(full[0].features, "default");
  assert.ok(full[0].strings > 250 && full[0].glyphs > 5000);
  for (const weight of manifest.invariants.outlineWeights) {
    const cases = proof.cases.filter((entry: any) => entry.corpus === "homepage-body-ui-and-layout-fixtures" && entry.weight === weight);
    assert.deepEqual(cases.map((entry: any) => entry.features), ["default", "kern-ligatures-off", "layout-on-tabular", "proportional-oldstyle"]);
    assert.ok(cases.every((entry: any) => entry.strings >= full[0].strings && entry.glyphs > 0));
  }
  assert.equal(proof.stringsCompared, proof.cases.reduce((total: number, entry: any) => total + entry.strings, 0));
  assert.equal(proof.glyphsCompared, proof.cases.reduce((total: number, entry: any) => total + entry.glyphs, 0));
  assert.match(proof.limits, /homepage.*Not proof for every possible.*browser rasteriser.*fallback.*diacritics/);
});

test("home normal exact cmap is route-only, retains swap and does not pin new metrics or weights", () => {
  const home = read("src/styles/home-global.css").toString("utf8");
  const blocks = [...home.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(match => match[1]);
  const matching = blocks.filter(block => block.includes(`../assets/fonts/${manifest.file}`));
  assert.equal(matching.length, 1);
  const block = matching[0];
  assert.ok(block.includes('font-family: "Newsreader Variable";'));
  assert.ok(block.includes("font-style: normal;"));
  assert.ok(block.includes("font-display: swap;"));
  assert.ok(block.includes("font-weight: 200 800;"));
  assert.ok(block.includes(`url("../assets/fonts/${manifest.file}") format("woff2-variations")`));
  const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
  assert.equal(range, manifest.invariants.unicodeRange);
  assert.deepEqual(expandRanges(range!), manifest.invariants.codepoints);
  assert.doesNotMatch(block, /\blocal\(|font-synthesis|size-adjust|ascent-override|descent-override/);
  assert.ok(!read("src/styles/font-delivery.css").includes(manifest.file), "shared/interior CSS never selects the home-only asset");
  const layout = read("src/layouts/BaseLayout.astro").toString("utf8");
  assert.match(layout, /const newsreaderNormalPreload = runwayInterior \? newsreaderLatinSubset : newsreaderNormalHomeSubset;/);
  assert.match(layout, /href=\{newsreaderNormalPreload\} as="font"/);
  assert.equal([...layout.matchAll(/<link rel="preload"[^>]+as="font"[^>]*\/>/g)].length, 3);
});

test("home normal redistribution retains exact supplied OFL notices and source licence metadata", () => {
  const original = read(manifest.licence.source);
  const notice = read(`src/assets/fonts/${manifest.licence.file}`);
  assert.deepEqual(notice, original);
  assert.deepEqual(read("public/licenses/fonts/newsreader-OFL.txt"), original);
  assert.equal(hash(original), manifest.licence.sha256);
  assert.equal(manifest.licence.spdx, "OFL-1.1");
  assert.equal(manifest.licence.reservedFontNamesDeclaredInSuppliedNotice, false);
  assert.match(original.toString("utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
});
