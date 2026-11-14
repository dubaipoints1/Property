import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FAB_REWARDS_WAVE2_PRODUCTS, parseFabRewardsWave2 } from "../../scripts/scrape/_fab-rewards-wave2";
import { getCardData } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum, cardHasUnresolvedTerms } from "../../src/lib/cardEligibility";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
type Source = Parameters<typeof parseFabRewardsWave2>[0][number];
const { sources }: { sources: Source[] } = JSON.parse(read("./fixtures/2026-11-fab-rewards-wave2.json"));
const slugs = Object.keys(FAB_REWARDS_WAVE2_PRODUCTS);
const mutate = (id: string, change: (s: Source) => Source) => sources.map(s => s.id === id ? change(s) : s);
const originalHash = (text: string) => createHash("sha256").update(text).digest("hex");
const remapText = (s: Source, text: string) => ({ ...s, text, fixtureTextSha256: originalHash(text) });

test("FAB next-wave fees and salary figures exactly replay the named, scoped evidence", () => {
  for (const slug of slugs) {
    const parsed = parseFabRewardsWave2(sources, slug);
    const card = getCardData(slug);
    assert.ok(parsed && card, slug);
    assert.equal(card.applyUrl, parsed.productUrl);
    assert.equal(card.kfsUrl, parsed.kfsUrl);
    assert.equal(card.annualFee.amount, parsed.annualFee);
    assert.equal(card._provenance.annualFee, "editor-confirmed");
    assert.equal(card.vatPolicy, "inclusive");
    assert.equal(card.eligibility.publishedMinMonthlyIncome, parsed.publishedIncome);
    assert.equal(card.eligibility.publishedIncomeBasis, "salary");
    assert.equal(card.eligibility.minSalary, null);
    assert.ok(!hasUsableSalaryMinimum(card));
    assert.ok(cardHasUnresolvedTerms(card));
    assert.equal(card.fxFee, null);
    assert.equal(card.joiningFee, undefined);
    assert.equal(card.welcomeBonus, "Welcome offer pending source review.");
    assert.equal(card._provenance.welcomeBonus, "needs-review");
    assert.equal(card.earnRates.everythingElse, null);
    assert.equal(card.scopedEarnRates, undefined);
    assert.deepEqual(card._fieldEvidence, parsed.evidence);
    assert.ok(read("../../src/content/banks/fab.mdx").includes("/cards/" + slug + "/"));
  }
  assert.deepEqual(slugs.map(slug => parseFabRewardsWave2(sources, slug)?.annualFee), [0, 0, 315]);
});

test("No sibling row, altered fee, ambiguous source or unrelated application can stand in for the exact FAB card", () => {
  const active = "fab-rewards-active";
  const du = "fab-du-titanium";
  const change = (s: Source) => remapText(s, s.text.replace("Active", "Indulge"));
  assert.equal(parseFabRewardsWave2(mutate("active-fee-row", change), active), null);
  assert.equal(parseFabRewardsWave2(mutate("active-fee-row", s => remapText(s, s.text.replace("315", "300"))), active), null);
  assert.equal(parseFabRewardsWave2(mutate("fab-fee-columns", s => remapText(s, s.text.replace("Inclusive", "Exclusive"))), du), null);
  assert.equal(parseFabRewardsWave2(mutate("du-apply", s => ({ ...s, text: s.text.replace("65DA", "FFFF") })), du), null);
  assert.equal(parseFabRewardsWave2([...sources, sources.find(s => s.id === "du-salary")!], du), null);
  assert.equal(parseFabRewardsWave2(mutate("active-gym-terms", s => remapText(s, s.text.replace("visit will become chargeable", "visit will be free"))), active), null);
  assert.equal(parseFabRewardsWave2(sources, "fab-cashback"), null);
});
