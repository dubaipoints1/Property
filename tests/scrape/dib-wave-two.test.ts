import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DIB_WAVE_TWO, parseDibWaveTwo } from "../../scripts/scrape/_dib-wave-two";
import { getCardData } from "../../src/lib/cardsData";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { buildFeeIndex, toRow } from "../../src/lib/feeIndex";
import data from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-dib-wave-two.json";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
type Slug = keyof typeof DIB_WAVE_TWO;
function altered(id: string, f: (s: string) => string) {
  return fixture.sources.map(s => {
    const text = s.id === id ? f(s.text) : s.text;
    return { ...s, text, fixtureTextSha256: hash(text) };
  });
}

test("DIB wave two: the exact sources regenerate every public amount and citation", () => {
  for (const slug of Object.keys(DIB_WAVE_TWO) as Slug[]) {
    const p = parseDibWaveTwo(fixture.sources, slug);
    assert.ok(p);
    const c = data[slug];
    assert.equal(c.annualFee.amount, p.annualFee);
    assert.equal(c.eligibility.minSalary, null);
    assert.equal("publishedMinMonthlyIncome" in c.eligibility ? c.eligibility.publishedMinMonthlyIncome : null, p.income);
    assert.deepEqual("annualFeeWaiver" in c ? c.annualFeeWaiver : undefined, p.waiver);
    assert.equal(c.fxFee, null);
    assert.deepEqual(c.earnRates, { everythingElse: null });
    assert.deepEqual(c.sources, p.sources);
    assert.deepEqual(JSON.parse(JSON.stringify(c._fieldEvidence)), JSON.parse(JSON.stringify(p.evidence)));
    assert.equal(c.applyUrl, p.productUrl);
    assert.equal(c.refreshMode, "manual-primary");
    assert.ok(c.sources.includes(p.application));
  }
  assert.equal(data["dib-prime-platinum"].annualFee.amount, 0);
  assert.notEqual(data["dib-shams-signature"].annualFee.amount, data["dib-shams-infinite"].annualFee.amount);
  assert.equal("annualFeeWaiver" in data["dib-shams-signature"], false);
  assert.equal("annualFeeWaiver" in data["dib-shams-infinite"], false);
});

test("DIB wave two: rejects adjacent tier, fee mismatch and unverified application sources", () => {
  const signature = "dib-shams-signature", infinite = "dib-shams-infinite", prime = "dib-prime-platinum";
  assert.equal(parseDibWaveTwo(altered("signature-waiver", s => s.replace("30,000", "60,000")), signature), null);
  assert.equal(parseDibWaveTwo(altered("offer-fees", s => s.replace("AED 699", "AED 499")), infinite), null);
  assert.equal(parseDibWaveTwo(altered("soc-fees", s => s.replace("523.95", "733.95")), signature), null);
  assert.equal(parseDibWaveTwo(altered("kfs-fees", s => s.replace("Platinum", "Gold")), prime), null);
  assert.equal(parseDibWaveTwo(altered("prime-landing", s => s.replace("Prime Platinum", "Prime Gold")), prime), null);
  assert.equal(parseDibWaveTwo(altered("prime-salary", s => s.replace("Minimum Salary", "Monthly Spend")), prime), null);
  assert.equal(parseDibWaveTwo(fixture.sources.filter(s => s.id !== "offer-vat"), infinite), null);
  assert.equal(parseDibWaveTwo(altered("offer-scope", s => s.replace("31 December", "30 December")), infinite), null);
});

test("DIB wave two: first-year and renewal semantics survive shared UI bindings", () => {
  const layout = readFileSync(new URL("../../src/layouts/CardReviewLayout.astro", import.meta.url), "utf8");
  for (const slug of ["dib-shams-signature", "dib-shams-infinite"] as const) {
    assert.equal(data[slug].standardFeeConditions, "renewal-only");
    assert.equal("annualFeeWaiver" in data[slug], false);
    assert.match(data[slug]._fieldEvidence["annualFeeWaiver.conditionalOffer"][2].rawText, /Limited time period/);
    assert.match(finderEvidence(getCardData(slug)!).feeNotes[0], /^Standard renewal fee from year two: .*; first-year terms pending\.$/);
    const c = { ...getCardData(slug)!, slug };
    assert.equal(toRow(c).annualFee, null);
    assert.match(toRow(c).renewalOnlyFeeLabel ?? "", /from year two$/);
    assert.equal(toRow(c).firstYearAnnualFeeStatus, "pending");
    assert.equal(buildFeeIndex([c]).annualFeeSampleSize, 0);
    assert.match(layout, new RegExp('slug === "' + slug + '"'));
  }
});
