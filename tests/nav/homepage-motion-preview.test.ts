// Private-preview source contracts, not a runtime/Safari certificate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const source = () => read("src/pages/dev/homepage-motion/[direction].astro");

test("motion alternatives remain actual private routes and retain ordinary destinations", () => {
  const text = source();
  assert.match(text, /getStaticPaths/);
  for (const id of ["aperture", "mosaic", "cinema"]) assert.ok(text.includes(`"${id}"`));
  assert.match(text, /noindex,nofollow/);
  assert.match(read("astro.config.mjs"), /!page\.includes\("\/dev\/"\)/);
  assert.match(read("scripts/build/prune-internal-pages.mjs"), /INTERNAL_ROUTE_DIRS = \["dev"/);
  assert.match(text, /\/cards\/finder\//);
  assert.match(text, /\/news\//);
});

test("video markup does not initiate a reel fetch or autoplay", () => {
  const text = source();
  const video = text.match(/<video\b[\s\S]*?<\/video>/)?.[0];
  assert.ok(video, "real video preview, not just a still mockup");
  assert.doesNotMatch(video, /\ssrc\s*=|<source\b|\sautoplay(?:\s|=|>)/i);
  assert.match(video, /preload="none"/);
  assert.match(video, /playsinline/);
  assert.match(text, /hero-journey-scrub-720\.mp4/);
});

test("scroll loading has user-intent and motion/visibility cancellation guards", () => {
  const text = source();
  assert.match(text, /isTrusted/);
  assert.match(text, /prefers-reduced-motion/);
  assert.match(text, /visibilitychange/);
  assert.match(text, /cancelAnimationFrame/);
  assert.match(text, /\.pause\(\)/);
  assert.match(text, /addEventListener\("(?:click|pointerdown)"/);
  assert.match(text, /event\.defaultPrevented/);
  assert.doesNotMatch(text, /target\.closest\("a, button, input/);
  assert.match(text, /contentHeight <= stage\.clientHeight/);
  assert.match(text, /min-block-size: 44px/);
});

test("animation stays local and does not lock scrolling or introduce an idle timer", () => {
  const text = source();
  assert.doesNotMatch(text, /setInterval\(|window\.scrollTo\(|document\.body\.style|style\.overflow\s*=/);
  assert.doesNotMatch(text, /from ["'](?:gsap|motion|framer-motion|react|lenis)["']/);
  assert.doesNotMatch(text, /googletagmanager|gtag\(|localStorage|sessionStorage|fetch\(/);
  assert.match(text, /<ImageCredit/);
});
