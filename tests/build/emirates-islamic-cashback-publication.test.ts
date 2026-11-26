import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const slug = "emirates-islamic-cashback";
const review = `/cards/${slug}/`;
const dist = new URL("../../dist/", import.meta.url);
const page = (path: string) => new URL(`.${path}index.html`, dist);
const privateIssuerFields = /emiratesislamic\.ae|apply-now|sourceUrl|_fieldEvidence|_scraped_freetext/i;
const read = (path: string) => readFileSync(page(path), "utf8");

test("built EI Cashback review names the checked documents without bank links, art or Product Offers", { skip: !existsSync(page(review)) }, () => {
  const html = read(review);
  assert.match(html, /Issuer documents checked:/);
  assert.match(html, /Key Fact Statement \(KFS\) – Credit Cards/);
  assert.match(html, /Cards — Schedule of Charges/);
  assert.match(html, /first-year and renewal terms unconfirmed/);
  assert.doesNotMatch(html, privateIssuerFields);
  assert.doesNotMatch(html, new RegExp(`data-card-art="${slug}"`));
  const schema = Array.from(html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), m => JSON.parse(m[1]));
  const product = schema.flatMap(graph => graph["@graph"] ?? [graph]).find(item => item.sku === slug);
  assert.ok(product);
  assert.equal(Object.hasOwn(product, "offers"), false);
});

test("built listing, Finder, Compare and calculator preserve the text-only publication boundary", { skip: !existsSync(page(review)) }, () => {
  const candidateProductUrl = /emiratesislamic\.ae\/en\/cards\/credit-cards\/cashback-card\b/i;
  for (const route of ["/cards/", "/cards/fees/", "/banks/emirates-islamic/", "/cards/finder/", "/cards/compare/", "/calculator/"]) {
    const html = read(route);
    assert.doesNotMatch(html, candidateProductUrl, route);
  }
  const finder = read("/cards/finder/");
  const array = finder.match(/<script[^>]*\bid="finder-card-index"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(array);
  const record = JSON.parse(array).find((row: { slug: string }) => row.slug === slug);
  assert.ok(record);
  assert.doesNotMatch(JSON.stringify(record), privateIssuerFields);
  assert.equal(record.annualFee, null);

  const compare = read("/cards/compare/");
  const comparison = Array.from(compare.matchAll(/<article\b([^>]*data-slug="[^"]+"[^>]*)>([\s\S]*?)<\/article>/g));
  const col = (cardSlug: string) => comparison.find(m => m[1].includes(`data-slug="${cardSlug}"`))?.[2];
  const base = col(slug), sibling = col("emirates-islamic-cashback-plus");
  assert.ok(base && sibling);
  assert.match(base, /Listed standard annual fee before any waiver/);
  assert.doesNotMatch(base, /<dt>Standard renewal fee<\/dt>|Check issuer terms|emiratesislamic\.ae/);
  assert.match(sibling, /Check issuer terms/);

  const hydration = read("/calculator/").match(/<astro-island\b[^>]*\bprops="([^"]+)"/g);
  assert.ok(hydration);
  const attrs = hydration.find(m => m.includes(slug))?.match(/\bprops="([^"]+)"/)?.[1];
  assert.ok(attrs);
  const props = JSON.parse(attrs.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  const cards = props.cards?.[1] as Array<[number, { slug: [number, string] }]>;
  const calcRecord = cards.find(([, row]) => row.slug[1] === slug)?.[1];
  assert.ok(calcRecord);
  const calcSibling = cards.find(([, row]) => row.slug[1] === "emirates-islamic-cashback-plus")?.[1];
  assert.ok(calcSibling);
  assert.doesNotMatch(JSON.stringify(calcRecord), privateIssuerFields);
  assert.match(JSON.stringify(calcSibling), /emiratesislamic\.ae/);
});
