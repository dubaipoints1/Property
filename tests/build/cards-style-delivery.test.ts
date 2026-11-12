import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { inlineCardsStyles, CARDS_STYLE_ROUTE } from "../../scripts/build/cards-style-delivery.mjs";
import { transformCardsStyles } from "../../scripts/build/home-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const canonical = '<link rel="canonical" href="https://dubaipoints.ae/cards/">';
const cssLink = (href: string) => '<link rel="stylesheet" href="' + href + '">';
const font = (name: string) => '/_astro/' + name + '-latin-wght-normal-site.fixture.woff2';
const fontLink = (href: string) => '<link rel="preload" href="' + href + '" as="font" type="font/woff2" crossorigin>';
const hints = [font("newsreader"), font("geist")].map(fontLink);
const links = ["/_astro/a.css", "/_astro/b.css"];
const css = [
  "@font-face{font-family:Newsreader;src:url(" + font("newsreader") + ")}",
  "@font-face{font-family:Geist;src:url(" + font("geist") + ")}",
];
const picks = '<section class="cards-top-picks" data-top-picks>';
const comparison = '<section class="cards-compare-section">';
const inline = /<style data-dp-cards-css="([^"]+)" data-dp-css-sha256="[0-9a-f]{64}">([\s\S]*?)<\/style>/g;
const body = "<body>" + picks + "<p>Original picks</p></section>" + comparison +
  '<template><p>Artwork fallback</p></template></section><script>window.cards=true;</script></body></html>';
const script = '<script>window.timing="unchanged";</script>';
const head = cssLink(links[0]) + canonical + hints.join("") + script + cssLink(links[1]);
const html = "<!doctype html><html><head>" + head + "</head>" + body;
const read = (href: string) => css[links.indexOf(href)];

test("Cards keeps stylesheet bytes/order, scripts and body and moves exactly the existing two font hints", () => {
  const first = transformCardsStyles(html, read);
  assert.equal(first.inlinedCount, 2);
  const styles = [...first.html.matchAll(inline)];
  assert.deepEqual(styles.map(match => match[1]), links);
  assert.deepEqual(styles.map(match => match[2]), css);
  const normal = first.html.replace(inline, (_, href) => cssLink(href));
  assert.equal(normal, "<!doctype html><html><head>" + hints.join("") + cssLink(links[0]) + canonical + script +
    cssLink(links[1]) + "</head>" + body);
  assert.deepEqual(extractInlineScripts(first.html), extractInlineScripts(html));
  assert.equal(transformCardsStyles(first.html, () => { throw Error("unexpected CSS read"); }).html, first.html);
});

test("Cards rejects mismatched, repeated and inert font/style inputs", () => {
  assert.throws(() => transformCardsStyles(html.replace(hints[0], ""), read), /font preload identity/);
  assert.throws(() => transformCardsStyles(html.replace(hints[0], hints[0] + hints[0]), read), /font preload identity/);
  assert.throws(() => transformCardsStyles(html.replace(hints[0], fontLink(font("fake"))), read), /font preload identity/);
  assert.throws(() => transformCardsStyles(html.replace(hints[0], "<template>" + hints[0] + "</template>"), read), /inert markup/);
  assert.throws(() => transformCardsStyles(html, href => href === links[1] ? ".x{background:url(../image.webp)}" : read(href)), /root-absolute/);
});

test("only the exact Cards route is changed; spoofed identities fail without writing", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "dp-cards-style-"));
  const route = path.join(dir, "cards/index.html");
  const home = path.join(dir, "index.html");
  const asset = path.join(dir, "_astro");
  try {
    assert.equal(CARDS_STYLE_ROUTE, "/cards/");
    await mkdir(path.dirname(route));
    await mkdir(asset);
    await writeFile(home, html);
    for (let i = 0; i < links.length; i++) await writeFile(path.join(dir, links[i].slice(1)), css[i]);
    for (const wrong of [html.replace(canonical, ""), html.replace(picks, "<!--" + picks + "-->"), html.replace(comparison, "<template>" + comparison + "</template>")]) {
      await writeFile(route, wrong);
      await assert.rejects(inlineCardsStyles(dir), /route identity/);
      assert.equal(await readFile(route, "utf8"), wrong);
    }
    await writeFile(route, html);
    assert.equal((await inlineCardsStyles(dir))[0].inlinedCount, 2);
    assert.equal(await readFile(home, "utf8"), html);
    assert.deepEqual(await Promise.all(links.map(href => readFile(path.join(dir, href.slice(1)), "utf8"))), css);
  } finally { await rm(dir, { recursive: true, force: true }); } // This test's own isolated fixture.
});
