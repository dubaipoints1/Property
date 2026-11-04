import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const packagePath = (path: string) => require.resolve(`@fontsource-variable/newsreader/${path}`);
const baseLayout = readFileSync(new URL("../../src/layouts/BaseLayout.astro", import.meta.url), "utf8");

function ranges(css: string) {
  return [...css.matchAll(/unicode-range:\s*([^;]+);/g)].map((match) => match[1]);
}

test("Newsreader's lighter normal and italic files keep the same script subsets and variable weights", () => {
  for (const suffix of ["", "-italic"]) {
    const original = readFileSync(packagePath(`opsz${suffix}.css`), "utf8");
    const light = readFileSync(packagePath(`wght${suffix}.css`), "utf8");
    assert.equal(ranges(light).length, 3);
    assert.deepEqual(ranges(light), ranges(original));
    assert.match(light, /font-family:\s*'Newsreader Variable'/);
    assert.match(light, /font-weight:\s*200 800/);
    assert.match(light, /font-display:\s*swap/);
    assert.ok(baseLayout.includes(`import "@fontsource-variable/newsreader/wght${suffix}.css"`));
    const style = suffix ? "italic" : "normal";
    const formerFile = packagePath(`files/newsreader-latin-opsz-${style}.woff2`);
    const lighterFile = packagePath(`files/newsreader-latin-wght-${style}.woff2`);
    assert.ok(statSync(lighterFile).size < statSync(formerFile).size * 0.5);
  }
});

test("the Latin Newsreader preload is the normal face actually used by CSS", () => {
  const latinFilename = "newsreader-latin-wght-normal.woff2";
  const css = readFileSync(packagePath("wght.css"), "utf8");
  assert.ok(css.includes(`./files/${latinFilename}`));
  assert.ok(baseLayout.includes(`/files/${latinFilename}?url`));
  assert.ok(!baseLayout.includes("newsreader-latin-opsz-normal.woff2"));
});
