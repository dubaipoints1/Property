import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (file: string) => readFile(new URL(`../../${file}`, import.meta.url), "utf8");

test("editorial system asset remains interior-only and follows the reader-flow layer", async () => {
  const layout = await source("src/layouts/BaseLayout.astro");
  assert.match(layout, /const runwayInterior = Astro\.url\.pathname !== "\/"/);
  assert.match(layout, /runwayInterior && <link rel="stylesheet" href=\{editorialSystemCss\}/);
  assert.ok(layout.indexOf("href={editorialSystemCss}") > layout.indexOf("href={readerFlowCss}"));
});

test("shared control refinements use active theme tokens without another palette", async () => {
  const css = await source("src/styles/editorial-system.css");
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  assert.match(css, /--dp-ui-control:\s*46px/);
  assert.match(css, /:focus-visible[\s\S]*outline:\s*3px solid var\(--green\)/);
  assert.match(css, /\[aria-invalid="true"\]/);
  assert.match(css, /\[aria-busy="true"\]/);
  assert.match(css, /\[aria-disabled="true"\][\s\S]*opacity:\s*1/);
});

test("action feedback has keyboard and reduced-motion equivalents", async () => {
  const css = await source("src/styles/editorial-system.css");
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /a:is\(\.dp-ui-action, \.dp-task-link\):focus-visible \.dp-action-arrow/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.dp-action-arrow \{ transform: none !important/);
  assert.doesNotMatch(css, /animation:|scroll-behavior:|opacity:\s*0/);
});

test("task links retain real destinations, descriptive copy and decorative arrows", async () => {
  const links = await source("src/components/NextStepLinks.astro");
  assert.match(links, /<a href=\{i.href\} class="dp-task-link">/);
  assert.match(links, /<span class="t">\{i.title\}<\/span><span class="m">\{i.meta\}<\/span>/);
  assert.match(links, /class="dp-action-arrow" aria-hidden="true"/);
  assert.doesNotMatch(links, /href="#"|role="button"/);
});

test("project context records the actual stack, homepage boundary and preview hold", async () => {
  const context = JSON.parse(await source(".21st/design.json"));
  assert.ok(context.project.stack.includes("preact"));
  assert.ok(context.sources.tokens.includes("src/styles/runway-editorial.css"));
  assert.ok(context.constraints.must.some((line: string) => /before owner sees/.test(line)));
  assert.ok(context.constraints.must.some((line: string) => /one-band-or-all/.test(line)));
});

test("archive return anchors account for the real sticky header", async () => {
  const css = await source("src/styles/editorial-system.css");
  assert.match(css, /#news-edition-top\s*\{\s*scroll-margin-block-start: calc\(var\(--dp-sticky-header-height, 81px\) \+ 16px\)/);
});

test("new deal filters reset only the horizontal shortlist, not history restoration", async () => {
  const deals = await source("src/pages/deals/index.astro");
  assert.match(deals, /const apply = \(resetRail = false\)/);
  assert.match(deals, /if \(resetRail\)[\s\S]*track\.scrollLeft = 0/);
  assert.match(deals, /addEventListener\("change", \(\) => apply\(true\)\)/);
  assert.match(deals, /addEventListener\("pageshow", \(\) => apply\(\)\)/);
});
