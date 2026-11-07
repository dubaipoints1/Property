import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { parseFabPrimaryCore } from "../../scripts/scrape/_fab-primary.ts";
import type { PrimaryCardSource } from "../../scripts/scrape/_bank-parsers.ts";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const sources = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-fab-primary.json", "utf8")).sources
  .map((s: { textDeflateBase64: string }) => ({ ...s, text: inflateSync(Buffer.from(s.textDeflateBase64, "base64")).toString("utf8") }));
const get = (id: string): PrimaryCardSource => sources.find((s: { id: string }) => s.id === id);
const mutate = (source: PrimaryCardSource, text: string) => ({ ...source, text, fixtureTextSha256: sha(text) });
const parse = (slug: string, override: Partial<{ product: PrimaryCardSource; literal: PrimaryCardSource; soc: PrimaryCardSource; kfs: PrimaryCardSource }> = {}) =>
  parseFabPrimaryCore(override.product ?? get(slug + "-product"), override.literal ?? get(slug + "-literal-description"), override.soc ?? get("fab-card-soc"), override.kfs ?? get("fab-card-kfs"), slug, get("fab-travel-benefits"));
test("FAB named primary-fee columns, explicit-AED product fields and source spans are reproducible", () => {
  for (const s of sources) assert.equal(sha(s.text), s.fixtureTextSha256);
  for (const slug of ["fab-travel", "fab-rewards-indulge"]) {
    const result = parse(slug); assert.ok(result, slug);
    assert.ok(result.observations.some(e => e.field === "annualFee.amount" && e.vatTreatment === "inclusive"));
    assert.ok(result.observations.some(e => e.field === "eligibility.minSalary" && e.unit === "AED monthly salary"));
    for (const e of result.observations) {
      assert.equal(sha(e.rawText), e.rawTextSha256);
      const s = sources.find((s: PrimaryCardSource) => s.url === e.sourceUrl && s.sourceTextSha256 === e.sourceTextSha256);
      assert.ok(s.text.split("\n").slice(e.firstLine - s.firstLine, e.lastLine - s.firstLine + 1).join("\n").includes(e.rawText));
    }
  }
});
test("FAB upper-bound issuer charges are never flattened into exact FX; true Travel zero needs both sources", () => {
  const indulge = parse("fab-rewards-indulge")!;
  assert.equal(indulge.fxFee, null); assert.ok(indulge.fxFeeUpperBound);
  assert.equal(indulge.fxFeeUpperBound.schemeCharges, "additional");
  const travel = parse("fab-travel")!;
  assert.equal(travel.fxFee, 0); assert.equal(travel.fxFeeUpperBound, undefined);
  const kfs = get("fab-card-kfs");
  assert.equal(parse("fab-travel", { kfs: mutate(kfs, kfs.text.replace("Bank charges and scheme charges not applicable", "Bank charges not applicable")) }), null);
});
test("FAB wrong product, malformed fees, inconsistent visible salary and missing AED unit fail closed", () => {
  const slug = "fab-rewards-indulge", soc = get("fab-card-soc"), literal = get(slug + "-literal-description"), product = get(slug + "-product");
  assert.equal(parse(slug, { soc: mutate(soc, soc.text.replace(/FAB Rewards Indulge +Free +Free/, "FAB Rewards Indulge , Free")) }), null);
  assert.equal(parse(slug, { literal: mutate(literal, literal.text.replaceAll('"currency": "AED"', '"currency": "USD"')) }), null);
  assert.equal(parse(slug, { product: mutate(product, product.text.replace(/##  [\d,]+\r?\n\r?\nMinimum Monthly Salary/, "##  ,\n\nMinimum Monthly Salary")) }), null);
  assert.equal(parse(slug, { literal: { ...literal, url: literal.url.replace("www.bankfab.com", "example.com") } }), null);
  assert.equal(parse(slug, { soc: mutate(soc, soc.text + soc.text) }), null);
});
test("FAB conditional boosts and native-point caps remain explicitly unmodelled", () => {
  const travel = parse("fab-travel")!, indulge = parse("fab-rewards-indulge")!;
  assert.equal(travel.earnRates.airfare, undefined); assert.equal(travel.earnRates.international, undefined);
  assert.equal(Object.hasOwn(indulge.earnRates, "_caps"), false);
  assert.match(indulge.pending.join(" "), /native FAB Rewards/);
  assert.match(travel.pending.join(" "), /domestic only/);
});
