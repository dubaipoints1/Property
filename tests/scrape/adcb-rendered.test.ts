import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseAdcbRenderedProduct, parseAdcb365CashbackGuide } from "../../scripts/scrape/_bank-parsers.ts";
const sources = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-adcb-rendered-products.json", "utf8")).sources;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
test("rendered primary evidence carries DOM text/snapshot identity, never a false HTTP body hash", () => {
  for (const source of sources) {
    assert.equal(source.sourceBodySha256, null);
    assert.equal(source.sourceRepresentation, "visible-main-dom-and-accessibility-snapshot");
    assert.equal(source.captureMethod, "normal-public-browser-ui");
    assert.equal(hash(source.text), source.fixtureTextSha256);
    assert.match(source.sourceSnapshotSha256, /^[a-f0-9]{64}$/);
    for (const e of parseAdcbRenderedProduct(source, source.id)) {
      assert.equal(e.sourceBodySha256, null);
      assert.equal(e.sourceSnapshotSha256, source.sourceSnapshotSha256);
      assert.equal(hash(e.rawText), e.rawTextSha256);
      assert.ok(source.text.split("\n").slice(e.firstLine - 1, e.lastLine).join("\n").includes(e.rawText));
    }
  }
});
test("365 standing category observations stay narrow and keep the salary-or-credit-limit distinction", () => {
  const source = sources.find((s: any) => s.id === "adcb-365-cashback");
  const parsed = parseAdcbRenderedProduct(source, source.id);
  for (const field of ["eligibility.salaryRoute", "eligibility.creditLimitAlternative", "annualFee.amount", "earnRates.digitalEntertainment", "earnRates.aiSubscriptions", "earnRates._caps.monthly_max_aed", "earnRates._caps.min_monthly_spend_to_qualify_aed"])
    assert.ok(parsed.some(e => e.field === field), field);
  assert.equal(parsed.some(e => ["eligibility.minSalary", "earnRates.online", "earnRates.entertainment"].includes(e.field)), false);
  assert.deepEqual(parseAdcbRenderedProduct({ ...source, sourceSnapshotSha256: undefined }, source.id), []);
  assert.deepEqual(parseAdcbRenderedProduct({ ...source, sourceRepresentation: "http-decoded-response-body" }, source.id), []);
});
test("collapsed unrecorded eligibility is not inferred; Betaqti's visible Keep in mind route is not missed", () => {
  const collapsed = sources.find((s: any) => s.id === "adcb-traveller");
  assert.deepEqual(parseAdcbRenderedProduct(collapsed, collapsed.id), []);
  for (const slug of ["adcb-lulu-platinum", "adcb-essential-cashback", "adcb-shukran", "adcb-talabat", "adcb-betaqti"]) {
    const source = sources.find((s: any) => s.id === slug);
    assert.deepEqual(parseAdcbRenderedProduct(source, slug).map(e => e.field), ["eligibility.salaryRoute", "eligibility.creditLimitAlternative"]);
  }
  const betaqti = sources.find((s: any) => s.id === "adcb-betaqti");
  const text = betaqti.text.replace("Keep in mind", "Unrelated offers");
  assert.deepEqual(parseAdcbRenderedProduct({ ...betaqti, text, fixtureTextSha256: hash(text) }, betaqti.id), []);
});
test("365 eligibility guide maps only the exact named reduced categories, not general entertainment or online", () => {
  const source = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-adcb-365-guide.json", "utf8")).sources[0];
  const parsed = parseAdcb365CashbackGuide(source);
  assert.deepEqual(parsed.map(e => e.field).sort(), ["autoDealers", "charity", "education", "government", "insurance", "realEstate", "telecom", "transport", "utilities"].map(k => `earnRates.${k}`).sort());
  for (const e of parsed) {
    assert.equal(hash(e.rawText), e.rawTextSha256);
    assert.ok(source.text.split("\n").slice(e.firstLine - 1, e.lastLine).join("\n").includes(e.rawText));
  }
  const mutate = (text: string) => ({ ...source, text, fixtureTextSha256: hash(text) });
  assert.deepEqual(parseAdcb365CashbackGuide(mutate(source.text.replace("•   Education", "•   Dining"))), []);
  assert.deepEqual(parseAdcb365CashbackGuide(mutate(source.text.replace("•   Education", "•   Utilities"))), []);
  assert.deepEqual(parseAdcb365CashbackGuide({ ...source, url: "https://example.com/home-digital-subscription-guide-en.pdf" }), []);
});
