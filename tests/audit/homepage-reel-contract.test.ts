// Harness guards only; actual video decoding/native input still requires
// the opt-in built-browser audit. Importing its helpers must not launch it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import sharp from "sharp";
import { JOURNEY_SELECTORS, eligibleStageHeight, journeyScrollTarget, reelPath, runHomepageReelAudit, visualDifference } from "../../scripts/audit/homepage-reel.mjs";

const component = readFileSync("src/components/HomeJourneyHero.astro", "utf8");
const audit = readFileSync("scripts/audit/homepage-reel.mjs", "utf8");

test("audit selectors name the current production Journey Aperture composition", () => {
  for (const selector of Object.values(JOURNEY_SELECTORS)) {
    assert.ok(selector.startsWith("[data-") ? component.includes(selector.slice(1, -1)) : component.includes(selector.slice(1)), selector);
  }
  assert.doesNotMatch(audit, /data-reel(?:-|\])|hp-hero-ctas|hp-reel-title|\.is-scrub|has-reel-frame/);
  assert.equal(typeof runHomepageReelAudit, "function");
});

test("scrub geometry includes the real sticky header origin at every requested progress", () => {
  const phone = { scrollY: 0, rootTop: 104, rootHeight: 1472, stageHeight: 816, headerHeight: 104 };
  assert.equal(journeyScrollTarget(phone, 0), 0);
  assert.equal(journeyScrollTarget(phone, .5), 328);
  assert.equal(journeyScrollTarget(phone, 1), 656);
  const scrolled = { ...phone, scrollY: 200, rootTop: -96 };
  assert.equal(journeyScrollTarget(scrolled, .5), 328, "target is independent of current scroll position");
  assert.equal(journeyScrollTarget({ scrollY: 0, rootTop: 80, rootHeight: 1530, stageHeight: 820, headerHeight: 80 }, .65), 461.5);
  assert.throws(() => journeyScrollTarget(phone, -1));
  assert.throws(() => journeyScrollTarget(phone, NaN));
});

test("responsive media boundaries remain the three owned production files", () => {
  for (const width of [360, 390, 899]) assert.equal(reelPath(width), "/videos/hero-journey-scrub-720.mp4");
  for (const width of [900, 1440, 1599]) assert.equal(reelPath(width), "/videos/hero-journey-scrub.mp4");
  assert.equal(reelPath(1600), "/videos/hero-journey-scrub-2560.mp4");
});

test("content-fit guard tests eligible sticky height, never the final natural-height fallback", () => {
  assert.equal(eligibleStageHeight(390, 844, 104), 740);
  assert.equal(eligibleStageHeight(320, 700, 104), 640);
  assert.equal(eligibleStageHeight(1440, 1000, 80), 920);
  assert.match(component, /height: calc\(100svh - var\(--journey-header\)\)/);
  assert.match(component, /height: max\(640px, calc\(100svh - var\(--journey-header\)\)\)/);
  assert.doesNotMatch(audit, /contentHeight <= stage\.clientHeight/);
});

test("visual comparison reports actual differing pixels and rejects changed screenshot dimensions", async () => {
  const png = async (bytes: number[], width = 2) => sharp(Buffer.from(bytes), { raw: { width, height: 1, channels: 3 } }).png().toBuffer();
  const first = await png([10, 20, 30, 40, 50, 60]);
  assert.equal(await visualDifference(first, first), 0);
  assert.equal(await visualDifference(first, await png([10, 20, 30, 60, 50, 60])), 50);
  const resized = await png([10, 20, 30], 1);
  await assert.rejects(() => visualDifference(first, resized), /screenshot dimensions are unchanged/);
});

test("audit retains explicit trusted-input, complete-blob, failure-poster and static-mode assertions", () => {
  assert.match(audit, /Programmatic scrolling alone must not fetch media/);
  assert.match(audit, /Touch-down alone does not fetch the video/);
  assert.match(audit, /Only the completed local blob is assigned to video/);
  assert.match(audit, /classList\.contains\("is-ready"\).*opacity === "1"/);
  assert.match(audit, /Scrubbing does not refetch the full video/);
  assert.doesNotMatch(audit, /new Set\(requests\)/);
  assert.match(audit, /A failed fetch never attaches an incomplete video/);
  assert.match(audit, /enhancedPhones > 0 && enhancedDesktops > 0/);
  assert.match(audit, /difference < 0\.5/);
  assert.match(audit, /reducedMotion: "reduce"/);
  assert.match(audit, /javaScriptEnabled: false/);
});
