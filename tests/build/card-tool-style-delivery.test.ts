import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CARD_TOOL_STYLE_ROUTES, inlineCardToolStyles } from "../../scripts/build/card-tool-style-delivery.mjs";
import { transformCardToolStyles } from "../../scripts/build/home-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const finder = '<section class="dp-finder"><form>Finder controls</form></section>';
const compare = '<section class="dp-compare-grid" id="dp-compare-grid"><article>Compare column</article></section>';
const cssHrefs = ["/_astro/a.css", "/_astro/b.css"];
const css = [".one{color:var(--ink)}", ".two{color:var(--line)}"];
const link = (href: string) => '<link rel="stylesheet" href="' + href + '">';
const scripts = '<script>window.theme="unchanged";</script><script type="module" src="/_astro/route.js"></script>';
const fixture = (route: string, body: string) => '<!doctype html><html><head>' + link(cssHrefs[0]) +
  '<link rel="canonical" href="https://dubaipoints.ae' + route + '">' + scripts + link(cssHrefs[1]) +
  '</head><body class="dp-body dp-system-typography">' + body + '</body></html>';
const read = (href: string) => css[cssHrefs.indexOf(href)];
const markers = /<style data-dp-card-tool-css="([^"]+)" data-dp-css-sha256="[0-9a-f]{64}">([\s\S]*?)<\/style>/g;

test("card tool styling preserves exact CSS bytes/cascade, head scripts and unchanged body", () => {
  const original = fixture(CARD_TOOL_STYLE_ROUTES[0], finder);
  const result = transformCardToolStyles(original, read);
  assert.equal(result.inlinedCount, 2);
  const styles = [...result.html.matchAll(markers)];
  assert.deepEqual(styles.map(match => match[1]), cssHrefs);
  assert.deepEqual(styles.map(match => match[2]), css);
  assert.equal(result.html.replace(markers, (_, href) => link(href)), original);
  assert.deepEqual(extractInlineScripts(result.html), extractInlineScripts(original));
  assert.equal(transformCardToolStyles(result.html, () => { throw Error("unexpected CSS read"); }).html, result.html);
  assert.throws(() => transformCardToolStyles(original.replace("</head>", '<link rel="preload" as="font" href="/_astro/surprise.woff2"></head>'), read), /preload display fonts/);
  assert.throws(() => transformCardToolStyles(original.replace("</head>", "<noscript></noscript></head>"), read), /inert markup/);
});

test("exact tool identities fail closed in both routes before any change; homepage and assets remain untouched", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dp-card-tools-style-"));
  const one = join(dir, "cards/finder/index.html"), two = join(dir, "cards/compare/index.html");
  const homepage = join(dir, "index.html");
  try {
    await mkdir(join(dir, "cards/finder"), { recursive: true });
    await mkdir(join(dir, "cards/compare"), { recursive: true });
    await mkdir(join(dir, "_astro"));
    await writeFile(homepage, "untouched homepage");
    await Promise.all(cssHrefs.map((href, i) => writeFile(join(dir, href.slice(1)), css[i])));
    const validFinder = fixture(CARD_TOOL_STYLE_ROUTES[0], finder);
    const validCompare = fixture(CARD_TOOL_STYLE_ROUTES[1], compare);
    await writeFile(one, validFinder);
    for (const wrong of [validCompare.replace("dp-system-typography", "unreviewed-fonts"),
      fixture(CARD_TOOL_STYLE_ROUTES[1], "<noscript>" + compare + "</noscript>"),
      fixture(CARD_TOOL_STYLE_ROUTES[0], compare), fixture(CARD_TOOL_STYLE_ROUTES[1], finder)]) {
      await writeFile(two, wrong);
      await assert.rejects(inlineCardToolStyles(dir), /route identity/);
      assert.equal(await readFile(one, "utf8"), validFinder);
      assert.equal(await readFile(two, "utf8"), wrong);
    }
    await writeFile(two, validCompare);
    const result = await inlineCardToolStyles(dir);
    assert.deepEqual(result.map(r => [r.route,r.inlinedCount]), [["/cards/finder/", 2], ["/cards/compare/", 2]]);
    assert.equal(await readFile(homepage, "utf8"), "untouched homepage");
    assert.deepEqual(await Promise.all(cssHrefs.map(href => readFile(join(dir, href.slice(1)), "utf8"))), css);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
