import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";

// Bounded 7 November issuer-source and visual acceptance cohort, not a rule
// that an unresolved future card must have invented/substitute imagery.
const reviewedSlugs = [
  "adib-aldar-visa-infinite",
  "adib-aldar-visa-platinum",
  "adib-booking-visa-signature",
  "adib-etihad-guest-gold",
  "adib-etihad-guest-infinite",
  "adib-etihad-guest-platinum",
  "adib-exceed-visa",
  "adib-marriott-bonvoy-visa-infinite",
  "adib-marriott-bonvoy-visa-signature",
  "adib-share-visa-infinite",
  "adib-share-visa-platinum",
  "adib-skywards-visa-signature",
  "adib-smiles-visa-classic",
  "adib-smiles-visa-signature",
  "hsbc-cash-plus",
  "hsbc-skywards-infinite",
  "hsbc-skywards-signature"
];

test("the accepted seventeen-card image cohort retains source identity and truthful dimensions", async () => {
  const sources = JSON.parse(readFileSync("data/card-art/sources.json", "utf8"));
  const manifest = JSON.parse(readFileSync("data/card-art/manifest.json", "utf8"));
  for (const slug of reviewedSlugs) {
    const source = sources[slug], item = manifest[slug];
    assert.ok(source && item, slug);
    assert.equal(item.url, source.url, slug);
    assert.equal(item.page, source.page, slug);
    assert.equal(item.fetchedAt, "2026-11-07", slug);
    assert.equal(new URL(item.url).protocol, "https:");
    const expectedHost = slug.startsWith("adib-") ? "www.adib.ae" : "www.hsbc.ae";
    assert.equal(new URL(item.url).hostname, expectedHost, slug);
    assert.equal(new URL(item.page).hostname, expectedHost, slug);
    assert.equal(item.file, `images/cards/${slug}.webp`);
    assert.equal(source.crop, undefined, "No unreviewed crop instructions: " + slug);
    const image = await sharp("public/" + item.file).metadata();
    assert.equal(image.format, "webp", slug);
    assert.equal(image.width, item.width, slug);
    assert.equal(image.height, item.height, slug);
    assert.ok(item.width >= 200 && item.height > 0, slug);
    if (item.width > 360) {
      const thumb = await sharp(`public/images/cards/thumb/${slug}.webp`).metadata();
      assert.equal(thumb.width, 360, slug);
      assert.ok(Math.abs(thumb.height - item.height * 360 / item.width) <= 1, slug);
    }
  }
});

test("comparison identity art gives unlike card shapes a larger uniform contained frame", () => {
  const component = readFileSync("src/components/cards/CompareCardArt.astro", "utf8");
  assert.match(component, /\(max-width: 640px\) 128px, 144px/);
  assert.match(component, /inline-size: 144px/);
  assert.match(component, /inline-size: 128px/);
  assert.match(component, /aspect-ratio: 4 \/ 3/);
  assert.match(component, /max-inline-size: 100%/);
  assert.match(component, /object-fit: contain/);
  assert.doesNotMatch(component, /object-fit: cover/);
});
