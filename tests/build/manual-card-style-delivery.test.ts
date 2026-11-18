import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inlineManualCardStyles } from "../../scripts/build/manual-card-style-delivery.mjs";
import { MANUAL_CARD_STYLE_ROUTES } from "../../scripts/build/manual-card-style-routes.mjs";

const assets = ["/_astro/base.a1.css", "/_astro/review.a2.css"];
const fonts = ["/_astro/newsreader-latin-wght-normal-site.a1.woff2", "/_astro/geist-latin-wght-normal-site.a2.woff2"];
const rules = fonts.map((f, i) => '@font-face{font-family:example' + i + ';src:url("' + f + '")} .rule' + i + '{color:red}');
const style = (href: string) => '<link rel="stylesheet" href="' + href + '">';
const heads = Object.entries(MANUAL_CARD_STYLE_ROUTES);
const body = (route: string, heading: string) => '<body><h1>' + heading + '</h1>' +
  (route.startsWith("/banks/") ? '<article class="dp-bank-body"><section id="bank-cards"></section>' : '<article class="dp-cr-body">') +
  '<p>Card content</p></article></body></html>';
const hint = (f: string) => '<link rel="preload" href="' + f + '" as="font" type="font/woff2" crossorigin>';
const script = '<script>window.dataLayer=[]</script>';
const content = (route: string, heading: string) => '<html><head><link rel="canonical" href="https://dubaipoints.ae' + route + '">' +
  style(assets[0]) + script + style(assets[1]) + fonts.map(hint).join("") + '</head>' + body(route, heading);
const html = (dir: string, route: string) => join(dir, route.slice(1), "index.html");

test("scoped card stylesheet delivery refuses hidden identity and preserves adjacent routes, style bytes and scripts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dp-manual-style-"));
  try {
    await mkdir(join(dir, "_astro"));
    for (const [i, asset] of assets.entries()) await writeFile(join(dir, asset.slice(1)), rules[i]);
    for (const [route, title] of heads) {
      await mkdir(join(dir, route.slice(1)), { recursive: true });
      await writeFile(html(dir, route), content(route, title));
    }
    const [last, title] = heads.at(-1)!;
    const invalid = content(last, title).replace("<h1>", "<noscript><h1>").replace("</h1>", "</h1></noscript>");
    await writeFile(html(dir, last), invalid);
    await writeFile(html(dir, "/"), "unchanged homepage");
    await assert.rejects(inlineManualCardStyles(dir), /route identity/);
    assert.equal(await readFile(html(dir, heads[0][0]), "utf8"), content(...heads[0]));
    await writeFile(html(dir, last), content(last, title));
    const result = await inlineManualCardStyles(dir);
    assert.deepEqual(result.map(row=>row.route), heads.map(([route])=>route));
    for (const [route, title] of heads) {
      const after = await readFile(html(dir, route), "utf8");
      assert.ok(after.endsWith(body(route, title)));
      assert.ok(after.includes(script));
      assert.ok(after.indexOf(hint(fonts[1])) < after.indexOf("<style"));
      const blocks = [...after.matchAll(/<style data-dp-manual-card-css="([^"]+)" data-dp-css-sha256="[a-f\d]{64}">([\s\S]*?)<\/style>/g)];
      assert.deepEqual(blocks.map(row=>row[1]),assets);
      assert.deepEqual(blocks.map(row=>row[2]),rules);
    }
    assert.equal(await readFile(html(dir, "/"), "utf8"), "unchanged homepage");
    assert.ok((await inlineManualCardStyles(dir)).every(row=>row.inlinedCount===0));
  } finally {
    await rm(dir, { recursive: true, force: true }); // Isolated mock only.
  }
});
