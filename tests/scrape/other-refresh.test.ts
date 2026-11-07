import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseCitiCashbackRefresh, parseFabExistingCurrentFees, parseScPlatinumXCurrentTerms, parseWioReducedCurrentRewards, type OtherRefreshSource } from "../../scripts/scrape/_other-refresh.ts";
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const envelope = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-other-refresh.json", "utf8"));
const sources: Array<OtherRefreshSource & { id: string }> = envelope.sources;
const get = (id: string): OtherRefreshSource => sources.find((s: { id: string }) => s.id === id);
const mutate = (s: OtherRefreshSource, text: string): OtherRefreshSource => ({ ...s, text, sourceTextSha256: sha(text), fixtureTextSha256: sha(text) });
test("source fixtures and every raw evidence span reproduce original line and byte positions", () => {
  for (const s of sources) { assert.equal(sha(s.text), s.fixtureTextSha256); assert.match(s.sourceTextSha256, /^[a-f0-9]{64}$/); }
  const results = [parseCitiCashbackRefresh(get("citi-kfs"), "2026-11-07"), parseFabExistingCurrentFees(get("fab-kfs"), get("fab-sof"), "fab-cashback"),
    parseScPlatinumXCurrentTerms(get("sc-product"), get("sc-guide")), parseWioReducedCurrentRewards(get("wio-kfs"))];
  for (const r of results) {
    assert.ok(r);
    for (const e of r.observations) {
      const s = sources.find((s: OtherRefreshSource) => s.url === e.sourceUrl);
      assert.equal(sha(e.rawText), e.rawTextSha256);
      assert.equal(Buffer.from(s.text).subarray(e.sourceStartByte - s.sourceStartByte, e.sourceEndByte - s.sourceStartByte).toString("utf8"), e.rawText);
      assert.equal(s.text.split("\n").slice(e.firstLine - s.firstLine, e.lastLine - s.firstLine + 1).join("\n"), e.rawText);
    }
  }
});
test("Citi rate is named, effective-date guarded and not inferred from APR", () => {
  const k = get("citi-kfs"), r = parseCitiCashbackRefresh(k, "2026-11-07"); assert.ok(r);
  assert.deepEqual(r.interestRate, { monthly: 3.69, annual: 44.28 }); assert.equal(r.minAge, 18); assert.equal(r.maxAge, 64);
  assert.equal(parseCitiCashbackRefresh(k, "2026-09-30"), null);
  assert.equal(parseCitiCashbackRefresh(mutate(k, k.text.replace("Citi Cash Back                             AED 300", "Other Product                              AED 300")), "2026-11-07"), null);
  assert.equal(parseCitiCashbackRefresh(mutate(k, k.text + k.text), "2026-11-07"), null);
});
test("FAB named annual fees stay inclusive while current FX is an issuer upper bound, never exact", () => {
  for (const [slug, fee] of [["fab-cashback", 315], ["fab-elite", 1260], ["fab-etihad-guest-infinite", 2625], ["fab-world-elite", null]] as const) {
    const r = parseFabExistingCurrentFees(get("fab-kfs"), get("fab-sof"), slug); assert.ok(r);
    assert.equal(r.annualFee, fee); assert.equal(r.fxFee, null); assert.equal(r.fxFeeUpperBound.amount, 2.74);
    assert.equal(r.fxFeeUpperBound.schemeCharges, "additional"); assert.equal(r.fxFeeUpperBound.vatTreatment, "inclusive");
  }
  const k = get("fab-kfs"); assert.equal(parseFabExistingCurrentFees(mutate(k, k.text.replace("Up to 2.74% + scheme charges", "2.74% + scheme charges")), get("fab-sof"), "fab-cashback"), null);
  assert.equal(parseFabExistingCurrentFees(k, get("fab-sof"), "fab-world-elite-select"), null);
});
test("SC monthly-spend tiers and channel caps cannot become an unconditional headline rate", () => {
  const r = parseScPlatinumXCurrentTerms(get("sc-product"), get("sc-guide")); assert.ok(r);
  assert.deepEqual(r.channels.online.map(t => t.percent), [0, 3, 5, 10]);
  assert.deepEqual(r.channels.online.map(t => t.minimumSpendAED), [0, 2500, 7500, 15000]);
  assert.deepEqual(r.channels.online.map(t => t.monthlyCashCapAED), [0, 100, 200, 400]);
  assert.equal(r.channels["mobile wallet"][3].monthlyCashCapAED, 200);
  assert.equal(r.fxFee, null); assert.equal(r.fxFeeUpperBound.amount, 2.99); assert.equal(r.fxFeeUpperBound.schemeCharges, "additional");
});
test("Wio named reduced categories do not fabricate an all-telecom rate or plan-independent return", () => {
  const r = parseWioReducedCurrentRewards(get("wio-kfs")); assert.ok(r);
  assert.deepEqual(r.reducedCategories, { government: 0.5, realEstate: 0.5, utilities: 0.5 });
  assert.equal(r.reducedCategories.telecom, undefined); assert.match(r.pending.join(" "), /DU is named/);
});
test("incomplete, wrong-host, credentialed and altered representations fail closed", () => {
  const k = get("citi-kfs");
  for (const bad of [{ ...k, sourceComplete: false }, { ...k, url: k.url.replace("www.citibank.ae", "example.com") },
    { ...k, url: k.url.replace("https://", "https://user@") }, { ...k, firstLine: 0 }, { ...k, sourceStartByte: -1 }, { ...k, text: k.text + " " }])
    assert.equal(parseCitiCashbackRefresh(bad, "2026-11-07"), null);
});
