import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const assets = path.join(root, "src/assets/fonts");
const manifest = JSON.parse(readFileSync(path.join(assets, "font-subsets.manifest.json"), "utf8"));
const css = readFileSync(path.join(root, "src/styles/font-delivery.css"), "utf8");
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");

// Read only the WOFF2 header/directory, not compressed outlines. The directory
// format/known tag order follows the installed FontTools woff2.py. The recorded
// offline HarfBuzz/FontTools proof, bound to these binary hashes, checks deeper
// shaping/axis/outline invariants; CI does not pretend to rerun that toolchain.
const knownTags = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
];

function woff2Tags(data: Buffer): string[] {
  assert.ok(data.length >= 48);
  assert.equal(data.toString("ascii", 0, 4), "wOF2");
  assert.equal(data.readUInt32BE(4), 0x00010000, "TrueType, not a substituted format");
  assert.equal(data.readUInt32BE(8), data.length, "header records exact delivered bytes");
  let offset = 48;
  const uintBase128 = () => {
    for (let index = 0; index < 5; index++) {
      assert.ok(offset < data.length, "bounded WOFF2 directory");
      const byte = data[offset++];
      assert.ok(index !== 0 || byte !== 0x80, "no leading-zero UIntBase128");
      if (!(byte & 0x80)) return;
    }
    assert.fail("invalid UIntBase128");
  };
  const tags = [];
  for (let index = 0; index < data.readUInt16BE(12); index++) {
    assert.ok(offset < data.length);
    const flags = data[offset++];
    const tagIndex = flags & 0x3f;
    const tag = tagIndex === 63 ? data.toString("ascii", offset, offset += 4) : knownTags[tagIndex];
    assert.equal(tag.length, 4);
    tags.push(tag);
    uintBase128();
    const version = flags >> 6;
    if ((tag === "glyf" || tag === "loca") ? version !== 3 : version !== 0) uintBase128();
  }
  assert.equal(new Set(tags).size, tags.length, "no duplicate font tables");
  return tags;
}

function expandRanges(value: string): number[] {
  const result = [];
  for (const part of value.split(",")) {
    const match = /^U\+([A-F0-9]{4,6})(?:-([A-F0-9]{4,6}))?$/.exec(part);
    assert.ok(match, `valid exact unicode range: ${part}`);
    const first = Number.parseInt(match[1], 16);
    const last = Number.parseInt(match[2] ?? match[1], 16);
    assert.ok(first <= last && last <= 0x10ffff);
    for (let code = first; code <= last; code++) result.push(code);
  }
  assert.equal(new Set(result).size, result.length, "no overlapping ranges");
  return result;
}

test("shared delivery binaries match the reviewed source/output identities and retain variable/layout tables", () => {
  assert.equal(manifest.version, 1);
  assert.equal(manifest.faces.length, 3);
  for (const face of manifest.faces) {
    const source = readFileSync(path.join(root, face.source));
    const output = readFileSync(path.join(assets, face.file));
    assert.equal(hash(source), face.sourceSha256);
    assert.equal(hash(output), face.sha256);
    assert.equal(source.length, face.sourceBytes);
    assert.equal(output.length, face.bytes);
    assert.ok(output.length < source.length, "actually smaller, not an unmeasured replacement");
    const tags = woff2Tags(output);
    for (const tag of ["fvar", "gvar", "GSUB", "GPOS", "GDEF", "name", "cmap", "hmtx"]) {
      assert.ok(tags.includes(tag), `${face.file} retains ${tag}`);
    }
    assert.equal(face.sourceVersion, "5.3.0");
  }
  assert.equal(manifest.summary.sourceBytes, manifest.faces.reduce((n: number, f: any) => n + f.sourceBytes, 0));
  assert.equal(manifest.summary.subsetBytes, manifest.faces.reduce((n: number, f: any) => n + f.bytes, 0));
  assert.equal(manifest.summary.savingBytes, manifest.summary.sourceBytes - manifest.summary.subsetBytes);
});

test("all original names, weight axes, line/advance/outline and hinting proof results remain recorded", () => {
  for (const face of manifest.faces) {
    const proof = face.invariants;
    for (const key of ["axesEqual", "namedInstancesEqual", "nameRecordsEqual", "horizontalMetricsEqual", "lineMetricsEqual", "hintingBytecodeEqual", "globalHintingTablesEqual", "cmapEqual", "outlinesAndVariableAdvancesEqual"]) {
      assert.equal(proof[key], true, `${face.file}: ${key}`);
    }
    assert.deepEqual(proof.outputAxes, proof.sourceAxes);
    assert.equal(proof.sourceAxes.length, 1);
    assert.equal(proof.sourceAxes[0][0], "wght");
    assert.deepEqual(proof.sourceAxes[0].slice(1, 4), face.family === "Newsreader Variable" ? [200, 400, 800] : [100, 400, 900]);
    assert.equal(proof.outlineGlyphWeightPairs, proof.outputGlyphs * proof.outlineWeights.length);
    assert.ok(proof.outlineWeights.includes(450), "not only endpoints or the default instance");
  }
});

test("real shaping proof covers the full site plus every-page weighted kerning/ligature/numeric cases", () => {
  assert.deepEqual(manifest.tools, { fontTools: "4.68.0", brotli: "1.2.1", harfBuzz: "hb-shape (HarfBuzz) 14.2.1" });
  assert.ok(manifest.corpus.htmlPages >= 322);
  assert.ok(manifest.corpus.htmlTextNodesDeduplicated > 16000);
  assert.ok(manifest.corpus.sourceUiFiles > 100);
  assert.ok(manifest.corpus.representativeStrings > 300, "shared headers/footers are intentionally deduplicated");
  assert.equal(manifest.corpus.representativePageCoverage, manifest.corpus.htmlPages);
  assert.equal(manifest.corpus.representativeWindowsCollected, manifest.corpus.htmlPages * 3);
  assert.match(manifest.corpus.representativeSelection, /every page.*start, midpoint, end.*deduplicated/);
  for (const face of manifest.faces) {
    const proof = face.shaping;
    assert.equal(proof.allEqual, true);
    assert.match(proof.compared, /Glyph identity.*clusters.*advances.*offsets.*extents/);
    const full = proof.cases.filter((c: any) => c.corpus === "all-supported-body-ui");
    assert.equal(full.length, 1);
    assert.equal(full[0].weight, 400);
    assert.equal(full[0].features, "default");
    assert.ok(full[0].strings > 16000);
    for (const weight of face.invariants.outlineWeights) {
      const cases = proof.cases.filter((c: any) => c.corpus === "every-page-representatives-and-layout-fixtures" && c.weight === weight);
      assert.deepEqual(cases.map((c: any) => c.features), ["default", "kern-ligatures-off", "layout-on-tabular", "proportional-oldstyle"]);
      assert.ok(cases.every((c: any) => c.strings > 300 && c.glyphs > 0));
    }
    assert.equal(proof.stringsCompared, proof.cases.reduce((n: number, c: any) => n + c.strings, 0));
    assert.equal(proof.glyphsCompared, proof.cases.reduce((n: number, c: any) => n + c.glyphs, 0));
    assert.match(proof.limits, /Not proof for every possible/);
  }
});

test("CSS ranges equal the actual proved cmap, including canonical closure, without broad unsupported blocks", () => {
  const blocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(match => match[1]);
  assert.equal(blocks.length, 3);
  blocks.forEach((block, index) => {
    const face = manifest.faces[index];
    assert.ok(block.includes(`font-family: "${face.family}";`));
    assert.ok(block.includes(`font-style: ${face.style};`));
    assert.ok(block.includes("font-display: swap;"));
    assert.ok(block.includes(`font-weight: ${face.invariants.sourceAxes[0][1]} ${face.invariants.sourceAxes[0][3]};`));
    assert.ok(block.includes(`url("../assets/fonts/${face.file}") format("woff2-variations")`));
    const declared = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
    assert.equal(declared, face.invariants.unicodeRange);
    assert.deepEqual(expandRanges(declared!), face.invariants.codepoints);
    for (let code = 32; code <= 126; code++) assert.ok(face.invariants.codepoints.includes(code));
    assert.ok(face.invariants.codepoints.includes(0x0308));
    assert.ok(face.invariants.codepoints.includes(0x00c4), "A + diaeresis retains its composed cmap alternative");
    assert.ok(!face.invariants.codepoints.includes(0x0416), "Cyrillic remains in its original fallback face");
    assert.doesNotMatch(block, /\blocal\(|font-synthesis|size-adjust|ascent-override|descent-override/);
  });
});

test("original OFL notices and source metadata travel with every modified font", () => {
  for (const face of manifest.faces) {
    const licence = readFileSync(path.join(assets, face.licence.file));
    const original = readFileSync(path.join(root, face.licence.source));
    assert.equal(face.licence.spdx, "OFL-1.1");
    assert.equal(hash(licence), face.licence.sha256);
    assert.deepEqual(licence, original);
    const family = face.sourcePackage.split("/").at(-1);
    const publicNotice = readFileSync(path.join(root, "public/licenses/fonts", `${family}-OFL.txt`));
    assert.deepEqual(publicNotice, original, "complete notices are actually included in public output, not just private source assets");
    assert.match(licence.toString(), /SIL OPEN FONT LICENSE Version 1\.1/);
    assert.match(licence.toString(), /Copyright/);
    assert.equal(face.licence.reservedFontNamesDeclaredInSuppliedNotice, false);
    assert.match(face.sourceUrl, /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/(newsreader|geist)@5\.3\.0\/files\/.+\.woff2$/);
  }
});

test("existing production font-notice artefacts contain the complete exact supplied OFL texts", { skip: !existsSync(path.join(root, "dist/index.html")) }, () => {
  for (const family of ["newsreader", "geist"]) {
    const source = readFileSync(path.join(root, `node_modules/@fontsource-variable/${family}/LICENSE`));
    const published = readFileSync(path.join(root, `dist/licenses/fonts/${family}-OFL.txt`));
    assert.deepEqual(published, source, "a licence URL alone is not substituted for the supplied complete notice");
  }
});

test("the shared integration keeps fallback faces, two shared normal preloads and one home-only italic preload", () => {
  const layout = readFileSync(path.join(root, "src/layouts/BaseLayout.astro"), "utf8");
  const module = readFileSync(path.join(root, "src/lib/fontDelivery.ts"), "utf8");
  const subsetImport = layout.indexOf('import "~/styles/font-delivery.css";');
  assert.ok(subsetImport > 0, "integration import is explicit");
  for (const name of ["@fontsource-variable/newsreader/wght.css", "@fontsource-variable/newsreader/wght-italic.css", "@fontsource-variable/geist/wght.css"]) {
    const index = layout.indexOf(`import "${name}";`);
    assert.ok(index >= 0 && index < subsetImport, "original complete Unicode faces precede overrides");
  }
  for (const [name, file] of [["newsreaderLatinSubset", "newsreader-latin-wght-normal-site.woff2"], ["geistLatinSubset", "geist-latin-wght-normal-site.woff2"]]) {
    assert.ok(module.includes(`../assets/fonts/${file}?url`));
    assert.ok(layout.includes(`href={${name}} as="font" type="font/woff2" crossorigin`));
  }
  const fontPreloads = [...layout.matchAll(/<link rel="preload"[^>]+as="font"[^>]*\/>/g)].map(match => match[0]);
  assert.equal(fontPreloads.length, 3);
  assert.equal(fontPreloads.filter(link => /href=\{(?:newsreaderLatinSubset|geistLatinSubset)\}/.test(link)).length, 2);
  assert.match(layout, /\{!runwayInterior && <link rel="preload" href=\{newsreaderItalicHomeSubset\} as="font" type="font\/woff2" crossorigin \/>\}/);
  assert.match(module, /newsreader-latin-wght-italic-home\.woff2\?url/);
  assert.doesNotMatch(module, /newsreader-latin-wght-italic-site\.woff2\?url/);
  assert.doesNotMatch(layout, /@fontsource-variable\/.+woff2\?url/);
});
