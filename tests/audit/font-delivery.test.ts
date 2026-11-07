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

test("the smaller shared normal-face preloads match delivery CSS while original Unicode fallback remains", () => {
  const latinFilename = "newsreader-latin-wght-normal.woff2";
  const fallbackCss = readFileSync(packagePath("wght.css"), "utf8");
  const deliveryCss = readFileSync(new URL("../../src/styles/font-delivery.css", import.meta.url), "utf8");
  const deliveryModule = readFileSync(new URL("../../src/lib/fontDelivery.ts", import.meta.url), "utf8");
  assert.ok(fallbackCss.includes(`./files/${latinFilename}`), "original complete Latin file remains available");
  assert.ok(baseLayout.includes('import "@fontsource-variable/geist/wght.css"'));
  assert.ok(baseLayout.indexOf('import "~/styles/font-delivery.css"') > baseLayout.indexOf('import "@fontsource-variable/geist/wght.css"'));
  for (const [family, exported] of [["newsreader", "newsreaderLatinSubset"], ["geist", "geistLatinSubset"]]) {
    const file = `${family}-latin-wght-normal-site.woff2`;
    assert.ok(deliveryCss.includes(`../assets/fonts/${file}`));
    assert.ok(deliveryModule.includes(`../assets/fonts/${file}?url`));
    assert.ok(baseLayout.includes(`href={${exported}} as="font" type="font/woff2" crossorigin`));
  }
  assert.ok(!baseLayout.includes(`/files/${latinFilename}?url`), "do not preload both original and subset");
  assert.equal([...baseLayout.matchAll(/rel="preload"[^>]+as="font"/g)].length, 3);
  assert.match(baseLayout, /!runwayInterior && <link rel="preload" href=\{newsreaderItalicHomeSubset\}/);
  assert.ok(!baseLayout.includes("newsreader-latin-opsz-normal.woff2"));
});
