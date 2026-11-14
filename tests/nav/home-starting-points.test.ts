import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const home = read("src/pages/index.astro");

test("the existing homepage tools anchor exposes four different real starting paths", () => {
  const paths = home.match(/const STARTING_POINTS = \[([\s\S]*?)\n\];/)?.[1];
  assert.ok(paths);
  assert.deepEqual(Array.from(paths.matchAll(/href: "([^"]+)"/g), match => match[1]), [
    "/guides/expat-starter/",
    "/cards/finder/",
    "/salary-transfer/",
    "/transfer-finder/",
  ]);
  for (const path of [
    "src/content/guides/expat-starter.mdx",
    "src/pages/cards/finder/index.astro",
    "src/pages/salary-transfer/index.astro",
    "src/pages/transfer-finder.astro",
  ]) assert.ok(existsSync(new URL(`../../${path}`, import.meta.url)), path);

  const section = home.match(/<section\b[^>]*\bid="tools"[^>]*>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /aria-labelledby="hp-tools-h"/);
  assert.match(section, /<h2 id="hp-tools-h">/);
  assert.match(section, /STARTING_POINTS\.map/);
  assert.match(section, /<a href=\{t\.href\}>/);
  assert.match(home, /#tools\s*\{\s*scroll-margin-block-start:\s*calc\(var\(--dp-sticky-header-height\) \+ 16px\)/);
  assert.doesNotMatch(section, /data-hp-anim|<\s*(?:form|input|button|script|img|video)\b|client:|\bon\w+=/i);
});

test("starting paths reuse one section without moving the hero, proof or latest news", () => {
  const landmarks = ["<HomeJourneyHero />", 'class="hp-dusk"', 'id="tools"', 'id="latest"', 'id="hp-dir-h"'];
  const positions = landmarks.map(marker => {
    const first = home.indexOf(marker);
    assert.notEqual(first, -1, marker);
    assert.equal(first, home.lastIndexOf(marker), `${marker} must be unique`);
    return first;
  });
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  const hero = read("src/components/HomeJourneyHero.astro");
  for (const id of ["tools", "latest"]) assert.ok(hero.includes(`href="#${id}"`));
  const footer = read("src/components/Footer.astro");
  for (const route of ["/cards/compare/", "/calculator/", "/salary-transfer/calculator/"]) {
    assert.ok(footer.includes(`href: "${route}"`), `${route} remains reachable as a dedicated tool`);
  }
});
