import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inlineSalaryTrackerStyles, SALARY_TRACKER_STYLE_ROUTE } from "../../scripts/build/salary-tracker-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const routes = [SALARY_TRACKER_STYLE_ROUTE, "/salary-transfer/calculator/", "/salary-transfer/adib/", "/"];
const styleA = "/_astro/a.css", styleB = "/_astro/b.css";
const fonts = [
  "/_astro/newsreader-latin-wght-normal-site.foo.woff2",
  "/_astro/geist-latin-wght-normal-site.bar.woff2",
];
const links = [styleA, styleB].map(href => `<link rel="stylesheet" href="${href}">`);
const fontLinks = fonts.map(href => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`).join("");
const css = [`@font-face{font-family:News;src:url(${fonts[0]})}.one{color:var(--ink)}`,
  `@font-face{font-family:UI;src:url(${fonts[1]})}.two{color:var(--line)}`];
const tracker = '<section class="dpst dpst-responsive" aria-label="UAE salary-transfer offer tracker">Original offers and conditions</section>';
const fixture = (route: string, body = tracker) => '<!doctype html><html><head>' +
  `<link rel="canonical" href="https://dubaipoints.ae${route}"><script>window.theme="unchanged";</script>` +
  links[0] + '<title>Unchanged</title>' + fontLinks + links[1] + '</head><body>' + body + '</body></html>';

test("salary style delivery keeps cascade, executable scripts, body and existing font assets; other routes are untouched", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dp-salary-styles-"));
  try {
    await mkdir(join(dir, "_astro"));
    await writeFile(join(dir, styleA), css[0]);
    await writeFile(join(dir, styleB), css[1]);
    const files = routes.map(route => join(dir, route, "index.html"));
    for (let i = 0; i < routes.length; i++) {
      await mkdir(join(dir, routes[i]), { recursive: true });
      await writeFile(files[i], fixture(routes[i]));
    }
    for (const wrong of [fixture(routes[1]), fixture(routes[0], tracker.repeat(2)),
      fixture(routes[0], "<noscript>" + tracker + "</noscript>")]) {
      await writeFile(files[0], wrong);
      await assert.rejects(inlineSalaryTrackerStyles(dir), /route identity/);
      assert.equal(await readFile(files[0], "utf8"), wrong);
    }
    const before = fixture(routes[0]);
    await writeFile(files[0], before);
    const [result] = await inlineSalaryTrackerStyles(dir);
    assert.equal(result.inlinedCount, 2);
    const after = await readFile(files[0], "utf8");
    const markers = /<style data-dp-salary-tracker-css="([^"]+)" data-dp-css-sha256="[0-9a-f]{64}">([\s\S]*?)<\/style>/g;
    const styles = [...after.matchAll(markers)];
    assert.deepEqual(styles.map(item => [item[1], item[2]]), [[styleA, css[0]], [styleB, css[1]]]);
    assert.ok(after.indexOf(fontLinks) + fontLinks.length <= after.indexOf(styles[0][0]));
    assert.equal(after.replace(fontLinks, "").replace(markers, (_, href) => `<link rel="stylesheet" href="${href}">`), before.replace(fontLinks, ""));
    assert.deepEqual(extractInlineScripts(after), extractInlineScripts(before));
    assert.equal((await inlineSalaryTrackerStyles(dir))[0].inlinedCount, 0);
    assert.equal(await readFile(files[0], "utf8"), after);
    for (let i = 1; i < routes.length; i++) assert.equal(await readFile(files[i], "utf8"), fixture(routes[i]));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
