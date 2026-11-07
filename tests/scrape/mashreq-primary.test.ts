import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { parseMashreqPrimaryCore, parseMashreqCreditLimitCondition, parseMashreqCashbackBaseConflict } from "../../scripts/scrape/_mashreq-primary.ts";
import type { PrimaryCardSource } from "../../scripts/scrape/_bank-parsers.ts";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const sources = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-mashreq-primary.json", "utf8")).sources
  .map((s: { textDeflateBase64: string }) => ({ ...s, text: inflateSync(Buffer.from(s.textDeflateBase64, "base64")).toString("utf8") }));
const get = (id: string): PrimaryCardSource => sources.find((s: {id: string}) => s.id === id);
const kfs = get("mashreq-card-kfs");
const slugs = ["mashreq-aura", "mashreq-aura-world", "mashreq-aura-world-elite", "mashreq-solitaire", "mashreq-platinum-plus"];
test("Mashreq named fee/rate scopes preserve source rows, currency, VAT and scheme caveats", () => {
  for (const s of sources) assert.equal(sha(s.text), s.fixtureTextSha256);
  for (const slug of slugs) {
    const result = parseMashreqPrimaryCore(get(slug + "-product"), kfs, slug);
    assert.ok(result, slug);
    assert.equal(result.fxFeeScope, "issuer-fx-charges-only"); assert.equal(result.fxFeeVatTreatment, "not-applicable");
    assert.ok(typeof result.earnRates.everythingElse === "number");
    for (const e of result.observations) {
      assert.equal(sha(e.rawText), e.rawTextSha256);
      const source = sources.find((s: PrimaryCardSource) => s.url === e.sourceUrl);
      assert.ok(source.text.split("\n").slice(e.firstLine - source.firstLine, e.lastLine - source.firstLine + 1).join("\n").includes(e.rawText));
    }
  }
});
test("Mashreq unknown caps and absent product salary remain unknown, not zero/no caps", () => {
  const aura = parseMashreqPrimaryCore(get("mashreq-aura-product"), kfs, "mashreq-aura")!;
  assert.equal(aura.minSalary, null); assert.equal(aura.creditLimitCondition!.numericCap, null);
  assert.equal(aura.earnRates.partnerBrands, undefined); assert.equal(aura.earnRates._caps, undefined);
  const cash = parseMashreqCreditLimitCondition(get("mashreq-cashback-product"));
  assert.ok(cash); assert.match(cash.rawText, /within the assigned credit limit/);
});
test("Mashreq mismatched identities, malformed primary fees and duplicated KFS rows fail closed", () => {
  const slug = "mashreq-aura", product = get(slug + "-product");
  const mutate = (text: string) => ({ ...kfs, text, fixtureTextSha256: sha(text) });
  assert.equal(parseMashreqPrimaryCore(product, mutate(kfs.text + kfs.text), slug), null);
  assert.equal(parseMashreqPrimaryCore(product, mutate(kfs.text.replace(/( +Aura +)Free for life/, "$1,")), slug), null);
  assert.equal(parseMashreqPrimaryCore({ ...product, url: product.url.replace("www.mashreq.com", "example.com") }, kfs, slug), null);
  const text = product.text.replace("within the assigned credit limit", "without any limit");
  assert.equal(parseMashreqCreditLimitCondition({ ...product, text, fixtureTextSha256: sha(text) }), null);
});
test("Mashreq each repeated fee-page header independently protects primary/supplementary order and VAT", () => {
  const marker = "Annual fee (primary) –                 Annual fee (supplementary)";
  const indexes = [...kfs.text.matchAll(/Annual fee \(primary\) – +Annual fee \(supplementary\)/g)].map(m => m.index!);
  assert.equal(indexes.length, 2);
  for (const index of indexes) {
    const changed = kfs.text.slice(0, index) + kfs.text.slice(index).replace(/Annual fee \(primary\) – +Annual fee \(supplementary\)/, marker.replace("(primary)", "(TEMP)").replace("(supplementary)", "(primary)").replace("(TEMP)", "(supplementary)"));
    const source = { ...kfs, text: changed, fixtureTextSha256: sha(changed) };
    for (const slug of slugs) assert.equal(parseMashreqPrimaryCore(get(slug + "-product"), source, slug), null, slug);
  }
});
test("Aura bank-channel bill-payment exclusions are mandatory, source-bound and visible", () => {
  for (const slug of slugs.filter(s => s.startsWith("mashreq-aura"))) {
    const product = get(slug + "-product"), parsed = parseMashreqPrimaryCore(product, kfs, slug)!;
    assert.match(parsed.pending.join(" "), /not earned on bill payments through Mashreq Mobile App or Online Banking/);
    assert.match(parsed.channelExclusion!.rawText, /not earned on bill payments/);
    const text = product.text.replace("not earned on bill payments", "earned on all bill payments");
    assert.equal(parseMashreqPrimaryCore({ ...product, text, fixtureTextSha256: sha(text) }, kfs, slug), null);
  }
});
test("Cashback product upper-bound versus named KFS exact UAE base is a hold, not a guaranteed overwrite", () => {
  const product = get("mashreq-cashback-product"), parsed = parseMashreqCashbackBaseConflict(product, kfs);
  assert.ok(parsed); assert.equal(parsed.state, "needs-review");
  assert.equal(parsed.productClaim.bound, "upper"); assert.equal(parsed.kfsClaim.bound, "exact");
  for (const e of [parsed.productClaim, parsed.kfsClaim]) assert.equal(sha(e.rawText), e.rawTextSha256);
  const text = kfs.text.replace("% on other spends in the UAE", "% on restaurant spends in the UAE");
  assert.equal(parseMashreqCashbackBaseConflict(product, { ...kfs, text, fixtureTextSha256: sha(text) }), null);
  const wrong = product.text.replace("up to ", "at least ");
  assert.equal(parseMashreqCashbackBaseConflict({ ...product, text: wrong, fixtureTextSha256: sha(wrong) }, kfs), null);
});
