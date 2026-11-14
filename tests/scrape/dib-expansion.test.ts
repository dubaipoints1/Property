import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DIB_NEW_CARD_KFS, parseDibExpansion } from "../../scripts/scrape/_dib-expansion.ts";
import { getCardData } from "../../src/lib/cardsData";
import { annualFeeLabel, cardComparisonRows } from "../../src/lib/cardsDataFormat";
import { cardSearchMetadata } from "../../src/lib/cardSearchMetadata";

const consumer = "dib-consumer-cashback-platinum";
const shams = "dib-shams-platinum";
const fresh = () => JSON.parse(readFileSync(new URL("./fixtures/2026-11-dib-two-cards.json", import.meta.url), "utf8")).sources;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

test("DIB fee differences survive schema, public results and metadata", () => {
  const c = getCardData(consumer)!;
  const s = getCardData(shams)!;
  assert.ok(c && s);
  assert.equal(c.eligibility.minSalary, null);
  assert.equal(s.eligibility.minSalary, null);
  assert.equal(annualFeeLabel(c).qual, "first-year offer pending");
  assert.equal(annualFeeLabel(s).qual, "year 2+");
  assert.match(cardSearchMetadata(c).description, /first-year offer pending/);
  assert.ok(cardSearchMetadata(c).description.length <= 155);
  assert.equal(cardComparisonRows(c, s).find(row => row.key === "annualFee")?.winner, "none");
  const neutral = getCardData("citi-premier")!;
  assert.equal(cardComparisonRows(s, neutral).find(row => row.key === "annualFee")?.winner, "none");
  assert.deepEqual(c._fieldEvidence, parseDibExpansion(fresh(), consumer)?.evidence);
  assert.deepEqual(s._fieldEvidence, parseDibExpansion(fresh(), shams)?.evidence);
  const layout = readFileSync(new URL("../../src/layouts/CardReviewLayout.astro", import.meta.url), "utf8");
  assert.match(layout, /slug === "dib-consumer-cashback-platinum" \|\| slug === "dib-shams-platinum"/);
  const block = readFileSync(new URL("../../src/components/cards/FeeBlock.astro", import.meta.url), "utf8");
  assert.match(block, /resolved\?\.standardFeeConditions \? annualFeeLabel\(resolved\)\.qual/);
  assert.match(block, /scopeQualifier && <div class="joining">\{scopeQualifier\}/);
});
const alter = (id: string, callback: (s: string) => string, repin = true) => {
  const sources = fresh();
  const s = sources.find((x: { id: string }) => x.id === id);
  const before = s.text;
  s.text = callback(s.text);
  assert.notEqual(before, s.text);
  if (repin) s.fixtureTextSha256 = hash(s.text);
  return sources;
};

test("DIB parses distinct, VAT-inclusive amounts and only the proved SHAMS waiver", () => {
  const c = parseDibExpansion(fresh(), consumer);
  const s = parseDibExpansion(fresh(), shams);
  assert.ok(c && s);
  assert.equal(c.annualFee, 261.45);
  assert.equal(c.annualFeeWaiver, undefined);
  assert.equal(c.firstYearWaiverStatus, "limited offer, applicability unconfirmed");
  assert.equal(s.annualFee, 208.95);
  assert.equal(s.annualFeeWaiver?.year_one_waived, true);
  assert.equal(s.annualFeeWaiver?.ongoing_threshold_aed, 15_000);
  for (const x of [c, s]) {
    assert.equal(x.vatPolicy, "inclusive");
    assert.ok(!Object.hasOwn(x, "minSalary"));
    assert.ok(!Object.hasOwn(x, "welcomeBonus"));
    assert.ok(x.evidence.annualFee.some(r => r.sourceUrl === DIB_NEW_CARD_KFS && r.sourceRepresentation === "pdftotext-layout"));
    for (const pin of [...x.evidence.annualFee, ...(x.evidence.annualFeeWaiver ?? [])]) {
      assert.equal(hash(pin.rawText), pin.rawTextSha256);
      assert.ok(pin.firstLine > 0);
      assert.ok(pin.lastLine >= pin.firstLine);
      assert.ok(Date.parse(pin.capturedAt));
      if (pin.sourceRepresentation === "pdftotext-layout") assert.equal(pin.sourceExtraction, "pdftotext-layout");
      else assert.equal(pin.sourceEndByte! - pin.sourceStartByte!, Buffer.byteLength(pin.rawText));
    }
  }
});

test("DIB declines mixed tiers, conflicting tariffs, tampered pins and uncertain offers", () => {
  assert.equal(parseDibExpansion(fresh(), "dib-shams-signature"), null);
  assert.equal(parseDibExpansion(alter("consumer-apply", s => s.replace("consumer-platinum-card", "consumer-reward-card")), consumer), null);
  assert.equal(parseDibExpansion(alter("consumer-notice-fee", s => s.replace("AED 261.45", "AED 262.45")), consumer), null);
  assert.equal(parseDibExpansion(alter("consumer-net-fee", s => s.replace("excluding VAT", "including VAT")), consumer), null);
  assert.equal(parseDibExpansion(alter("shams-waiver", s => s + "\n" + s), shams), null);
  assert.equal(parseDibExpansion(alter("shams-waiver", s => s.replace("15,000", "30,000"), false), shams), null);
  assert.equal(parseDibExpansion(alter("dib-kfs-fee-columns", s => s.replaceAll("Platinum", "Signature")), shams), null);
  assert.equal(parseDibExpansion(alter("dib-kfs-shams-footnote", s => s.replace("208.95", "523.95")), shams), null);
  const sources = fresh();
  const fee = sources.find((x: { id: string }) => x.id === "dib-kfs-fee-columns");
  assert.equal(parseDibExpansion([...sources, fee], shams), null);
  assert.equal(parseDibExpansion(sources.filter((x: { id: string }) => x.id !== "shams-waiver"), shams), null);
});
