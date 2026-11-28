import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { rankOffers, scoreOffer, type SalaryTransferOffer } from "../../src/lib/salaryTransfer.ts";
import { compareSalaryOffersByReward, salaryOfferComparisonNote } from "../../src/lib/salaryTransferRules.ts";
import { salaryJourneyHref } from "../../src/lib/readerJourneyState.ts";

const ids = ["adib-arrive-2026", "mashreq-al-islami-neo-2026", "fab-islamic-amana-2026"];

function offer(id: string): SalaryTransferOffer {
  const mdx = readFileSync(new URL(`../../src/content/salaryTransferOffers/${id}.mdx`, import.meta.url), "utf8");
  const yaml = mdx.match(/^---\n([\s\S]+?)\n---/)?.[1];
  assert.ok(yaml);
  const data = parse(yaml);
  return { ...data, id, bankSlug: data.bank, bankName: data.bank };
}

test("all three exact issuer routes are reference only even with a matching salary and selected card", () => {
  const campaigns = ids.map(offer);
  assert.equal(new Set(campaigns.map(({ bankSlug }) => bankSlug)).size, 3);
  const input = { monthlySalary: 50000, willingProducts: ["credit_card"] as const, willStay12Months: true, shariaOnly: true, cashOnly: true };
  for (const campaign of campaigns) {
    assert.ok(campaign.comparisonNote?.trim(), campaign.id);
    const scenario = { ...input, willingProducts: [...input.willingProducts] };
    const result = scoreOffer(campaign, scenario);
    assert.equal(result.status, "conditional", campaign.id);
    assert.equal(result.rawRewardAED, 0, campaign.id);
    assert.equal(result.cashEquivalentAED, 0, campaign.id);
    assert.deepEqual(result.breakdown, [], campaign.id);
    assert.ok(result.reasons.includes(campaign.comparisonNote!), campaign.id);
    assert.equal(salaryOfferComparisonNote(campaign, result.matchedBand!), campaign.comparisonNote);
    // Known specialised routes fail closed even if a note is mistakenly
    // removed or the issuer link changes in a later edit.
    for (const changed of [{ ...campaign, comparisonNote: undefined }, { ...campaign, sourceUrl: "https://example.com/changed" }]) {
      assert.equal(scoreOffer(changed, scenario).cashEquivalentAED, 0);
    }
  }
  const ordinary = offer("mashreq-2026");
  const inputWithoutCard = { ...input, willingProducts: [], shariaOnly: false };
  assert.equal(rankOffers([...campaigns, ordinary], inputWithoutCard)[0]?.offer.id, ordinary.id);
  assert.equal(scoreOffer(campaigns[2]!, inputWithoutCard).status, "disqualified");
  const row = (o: SalaryTransferOffer) => ({ offer: o, reward: o.salaryBands.at(-1)! });
  assert.ok(campaigns.every((campaign) => compareSalaryOffersByReward(row(campaign), row(ordinary)) > 0));
});

test("exact offer anchor survives tracker-to-detail context", () => {
  const href = salaryJourneyHref("/salary-transfer/fab/#fab-islamic-amana-2026", {
    sharia: true, noCard: false, cash: true, sort: "value", offer: "fab-islamic-amana-2026",
  });
  const url = new URL(href, "https://dubaipoints.ae");
  assert.equal(url.hash, "#fab-islamic-amana-2026");
  assert.equal(url.searchParams.get("st_offer"), "fab-islamic-amana-2026");
  assert.equal(url.searchParams.get("st_sharia"), "true");
});
