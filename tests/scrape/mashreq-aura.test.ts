import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MASHREQ_AURA_KFS, MASHREQ_AURA_PRODUCTS, MASHREQ_AURA_REDEMPTION, parseMashreqAura } from "../../scripts/scrape/_mashreq-aura.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const sources = () => read("./fixtures/2026-11-mashreq-aura.json").sources;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function change(id: string, map: (s: string) => string) {
  return sources().map(s => s.id !== id ? s : { ...s, text: map(s.text), fixtureTextSha256: hash(map(s.text)) });
}

test("exact Aura fees reconcile to named products and no held field is inferred", () => {
  const cards = read("../../src/data/cards.json");
  const hub = readFileSync(new URL("../../src/content/banks/mashreq.mdx", import.meta.url), "utf8");
  const entries = [
    ["mashreq-aura", 0], ["mashreq-aura-world", 525], ["mashreq-aura-world-elite", 1575],
  ] as const;
  for (const [slug, expected] of entries) {
    const record = cards[slug];
    const parsed = parseMashreqAura(sources(), slug);
    assert.ok(parsed, slug);
    assert.equal(parsed.annualFee, expected);
    assert.deepEqual(record.annualFee, { currency: "AED", amount: parsed.annualFee });
    assert.equal(record.vatPolicy, "inclusive");
    assert.equal(record.network, "Mastercard");
    assert.equal(record.applyUrl, parsed.productUrl);
    assert.ok(!record.applyUrl.includes("otp-send"));
    assert.equal(record.kfsUrl, MASHREQ_AURA_KFS);
    assert.ok(record.sources.includes(MASHREQ_AURA_REDEMPTION));
    assert.equal(hasUsableSalaryMinimum(record), false);
    assert.equal(record.eligibility.minSalary, null);
    assert.equal(record.eligibility.publishedMinMonthlyIncome, undefined);
    assert.equal(record.fxFee, null);
    assert.equal(record.welcomeBonus, undefined);
    assert.deepEqual(record.earnRates, { everythingElse: null });
    assert.ok(!record.categories.includes("cashback"));
    assert.deepEqual(record._fieldEvidence, parsed.evidence);
    assert.match(hub, new RegExp(`^  - ${slug}$`, "m"));
    assert.ok(hub.includes(`(/cards/${slug}/)`));
  }
  assert.deepEqual(Object.keys(MASHREQ_AURA_PRODUCTS), entries.map(([slug]) => slug));
});

test("Aura parser rejects tier relabelling, contradictory gross values and unlinked or cross-product documents", () => {
  const slug = "mashreq-aura-world";
  assert.equal(parseMashreqAura(change("mashreq-aura-kfs", x => x.replace("Aura World |", "Aura World Elite |")), slug), null);
  assert.equal(parseMashreqAura(change("mashreq-aura-kfs", x => x.replace("525 |", "500 |")), slug), null);
  assert.equal(parseMashreqAura(change("mashreq-aura-kfs", x => x.replace("(VAT inclusive)", "(before VAT)")), slug), null);
  assert.equal(parseMashreqAura(change(slug + "-fee", x => x.replace("149", "150")), slug), null);
  assert.equal(parseMashreqAura(change(slug + "-documents", x => x.replace("-aura-", "-generic-")), slug), null);
  assert.equal(parseMashreqAura(change(slug + "-apply", x => x.replace("mashreqauraworld", "mashreqaura")), slug), null);
  assert.equal(parseMashreqAura(change("mashreq-aura-redemption", x => x.replace("cannot", "can")), slug), null);
  assert.equal(parseMashreqAura(sources().map(s => s.id === slug + "-fee" ? { ...s, sourceBodySha256: "d".repeat(64) } : s), slug), null);
  assert.equal(parseMashreqAura([...sources(), ...sources().filter(s => s.id === "mashreq-aura-kfs")], slug), null);
  assert.equal(parseMashreqAura(sources(), "mashreq-solitaire"), null);
});
