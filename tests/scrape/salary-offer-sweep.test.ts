import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { parseSalaryOfferSweepSource, type SalaryOfferSourceReceipt } from "../../scripts/scrape/_salary-offer-sweep.ts";

const { documents } = JSON.parse(readFileSync(new URL("./fixtures/salary-offer-sweep-2026-11-27.json", import.meta.url), "utf8")) as {
  documents: SalaryOfferSourceReceipt[];
};

function sourceAndRecord(id: string) {
  const document = documents.find((entry) => entry.id === id);
  assert.ok(document);
  const source = parseSalaryOfferSweepSource(document);
  assert.ok(source);
  const raw = readFileSync(new URL(`../../src/content/salaryTransferOffers/${id}.mdx`, import.meta.url), "utf8");
  const frontmatter = raw.match(/^---\r?\n([\s\S]+?)\r?\n---/)?.[1];
  assert.ok(frontmatter);
  const row = parse(frontmatter);
  assert.equal(row.sourceUrl, source.sourceUrl);
  assert.equal(row.validFrom, source.validFrom);
  assert.equal(row.sharia, false);
  assert.equal(row.creditCardRequired, false);
  assert.deepEqual(row.additionalProductsRequired, []);
  assert.deepEqual(row.salaryBands.map(({ components: _components, ...values }) => values), source.bands.map((band) => ({
    minSalary: band.minSalary, maxSalary: band.maxSalary, rewardAmount: band.rewardAmount,
    rewardType: "cash", monthsToPayout: source.monthsToPayout,
  })));
  return { source, row, raw };
}

test("RAKBANK conventional November bands retain the restricted tier and separate day clocks", () => {
  const { source, row } = sourceAndRecord("rakbank-nov-2026");
  assert.equal(source.id, "rakbank-nov-2026");
  assert.equal(row.validUntil, source.validUntil);
  assert.equal(row.tenureMonths, source.qualificationMonths);
  assert.deepEqual(row.salaryBands[0].components, [{
    label: "Restricted payroll tier", amount: source.bands[0].rewardAmount,
    requires: "RAKempower Payroll or RAKmore enrolment",
  }]);
  assert.ok(row.salaryBands.slice(1).every((band) => !band.components));
  assert.match(row.requirements.join(" "), new RegExp(`within ${source.firstSalaryDaysForNew} days of opening`));
  assert.match(row.clawbackTerms, new RegExp(`within ${source.payoutDays} days of the later`));
  assert.match(row.clawbackTerms, new RegExp(`within ${source.disputeDays} calendar days of the promotion\\s+ending`));
});

test("Mashreq post-August tracks base plus contingent early-bird, not an issuer end date", () => {
  const { source, row, raw } = sourceAndRecord("mashreq-2026");
  assert.equal(source.id, "mashreq-2026");
  assert.equal(source.validUntil, null);
  assert.match(raw, /does not publish a fixed end date/);
  assert.equal(row.tenureMonths, source.instalmentMonths);
  assert.deepEqual(row.salaryBands.map((band) => band.components), source.bands.map(({ base, early }) => [
    { label: "Joining bonus", amount: base },
    { label: "Early-bird cashback", amount: early, requires: `First salary credited within ${source.earlyBirdDays} days of opening your first account` },
  ]));
  assert.match(row.clawbackTerms, new RegExp(`${source.instalmentMonths} equal monthly instalments, starting within\\s+${source.payoutDays} days`));
  assert.match(row.clawbackTerms, new RegExp(`${source.clawbackWindowMonths}-month bonus period`));
});

test("HSBC existing Premier keeps campaign and document dates separate and no fixed payout months", () => {
  const { source, row } = sourceAndRecord("hsbc-premier-existing-2026");
  assert.equal(source.id, "hsbc-premier-existing-2026");
  assert.equal(row.validUntil, source.validUntil);
  assert.notEqual(row.validFrom, source.editionDate);
  // A monthly comparator horizon, not a bank promise of six calendar months.
  assert.equal(row.tenureMonths, source.retentionDays / 30);
  const cohortDate = new Date(`${source.openedBefore}T00:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  assert.match(row.requirements.join(" "), new RegExp(`opened before ${cohortDate}`));
  assert.match(row.requirements.join(" "), new RegExp(`dormant for more than ${source.dormantMonths} months`));
  assert.equal(source.qualificationMonths, 3);
  assert.match(row.requirements.join(" "), /three consecutive calendar months/);
  assert.match(row.clawbackTerms, new RegExp(`within ${source.payoutDays} calendar days after the third salary`));
  assert.match(row.clawbackTerms, new RegExp(`within\\s+${source.retentionDays} days of the first qualifying credit`));
});

test("source swaps, changed numbers, moved lines and unpinned Islamic receipts fail closed", () => {
  const [rak] = documents;
  assert.equal(documents.length, 3);
  assert.equal(parseSalaryOfferSweepSource({ ...rak, sourceUrl: documents[1].sourceUrl }), null);
  assert.equal(parseSalaryOfferSweepSource({ ...rak, pdfSha256: documents[1].pdfSha256 }), null);
  assert.equal(parseSalaryOfferSweepSource({ ...rak, layoutTextSha256: documents[1].layoutTextSha256 }), null);
  assert.equal(parseSalaryOfferSweepSource({ ...rak, id: "rakbank-islamic" }), null);
  assert.equal(parseSalaryOfferSweepSource({ ...rak, excerpts: rak.excerpts.map((entry) => entry.line === 76
    ? { ...entry, text: entry.text.replace("D 500", "D 9,999") } : entry) }), null);
  assert.equal(parseSalaryOfferSweepSource({ ...rak, excerpts: rak.excerpts.map((entry) => entry.line === 94
    ? { ...entry, line: 93 } : entry) }), null);
});
