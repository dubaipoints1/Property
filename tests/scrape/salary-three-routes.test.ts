import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { parseSalaryThreeRouteSource, type SalaryThreeRouteReceipt } from "../../scripts/scrape/_salary-three-routes.ts";

const { documents } = JSON.parse(readFileSync(new URL("./fixtures/salary-three-routes-2026-11-28.json", import.meta.url), "utf8")) as {
  documents: SalaryThreeRouteReceipt[];
};

function sourceAndRecord(id: string) {
  const receipt = documents.find((entry) => entry.id === id);
  assert.ok(receipt);
  const source = parseSalaryThreeRouteSource(receipt);
  assert.ok(source);
  const raw = readFileSync(new URL(`../../src/content/salaryTransferOffers/${id}.mdx`, import.meta.url), "utf8");
  const frontmatter = raw.match(/^---\r?\n([\s\S]+?)\r?\n---/)?.[1];
  assert.ok(frontmatter);
  const row = parse(frontmatter);
  assert.equal(row.sourceUrl, source.sourceUrl);
  assert.equal(row.validFrom, source.validFrom);
  assert.equal(row.validUntil, source.validUntil ?? "2027-01-31");
  assert.equal(row.lastVerified, receipt.retrievedAt.slice(0, 10));
  assert.equal(row.sharia, true);
  assert.equal(row.creditCardRequired, source.creditCardRequired);
  assert.equal(row.tenureMonths, source.tenureMonths);
  assert.equal(row.archived, false);
  assert.deepEqual(row.additionalProductsRequired, []);
  assert.deepEqual(row.salaryBands, source.bands.map((band) => ({
    ...band, rewardType: "cash", monthsToPayout: source.monthsToPayout,
  })));
  return { source, row, raw };
}

test("Arrive publishes only the source table's salary component, with cohort and separate clocks", () => {
  const { source, row, raw } = sourceAndRecord("adib-arrive-2026");
  assert.equal(source.id, "adib-arrive-2026");
  assert.equal(source.startBasis, "announcement");
  assert.equal(source.validUntil, null);
  assert.deepEqual(source.bands.map((band) => band.rewardAmount), [375, 750, 1250, 3750]);
  assert.match(row.comparisonNote, /new-to-bank expatriates recently relocated to the UAE only/i);
  assert.equal(source.residencyEvidenceDays, 180);
  assert.match(row.requirements.join(" "), new RegExp(`Emirates ID and/or residency visa issued within the ${source.residencyEvidenceDays} days before onboarding`));
  assert.match(row.requirements.join(" "), /transfer three consecutive monthly salaries/);
  assert.match(row.requirements.join(" "), new RegExp(`within ${source.establishDays} calendar days of onboarding.+first ${source.tenureWindow} months`));
  assert.match(row.clawbackTerms, new RegExp(`within ${source.payoutDays} calendar days\\s+of the third qualifying salary, subject to assessment`));
  assert.match(row.clawbackTerms, /good standing at assessment and payment/);
  assert.match(raw, /does not publish a fixed\s+campaign end date/);
});

test("Islamic NEO uses only the verified 90-day salary totals and no credit card", () => {
  const { source, row, raw } = sourceAndRecord("mashreq-al-islami-neo-2026");
  assert.equal(source.id, "mashreq-al-islami-neo-2026");
  assert.equal(source.startBasis, "first-salary cohort");
  assert.equal(source.validUntil, null);
  assert.deepEqual(source.bands.map((band) => band.rewardAmount), [200, 600, 1800, 4000]);
  assert.match(row.comparisonNote, new RegExp(`within ${source.qualificationDays} days of opening the first account; no credit card`));
  assert.match(row.requirements.join(" "), /cannot be combined with another bank or subsidiary promotion/);
  assert.match(row.clawbackTerms, new RegExp(`${source.tenureMonths} equal monthly instalments, with\\s+the first within ${source.payoutDays} days of the first eligible salary transfer`));
  assert.match(row.clawbackTerms, /two consecutive months during the\s+12-month bonus period triggers recovery/);
  assert.equal(source.missedMonths, 2);
  assert.match(raw, /do not publish a fixed campaign end date/);
});

test("FAB Amana holds the new-card spend route and only the exact issuer illustrations", () => {
  const { source, row, raw } = sourceAndRecord("fab-islamic-amana-2026");
  assert.equal(source.id, "fab-islamic-amana-2026");
  assert.equal(source.validFrom, "2026-09-01");
  assert.equal(source.validUntil, "2026-12-31");
  assert.equal(source.illustrationOnly, true);
  assert.deepEqual(source.bands.map((band) => band.rewardAmount), [996, 2004, 4008, 6012, 8016, 9000]);
  assert.equal(source.bands[0].minSalary, 5000);
  assert.equal(source.rateBasisPoints, 167);
  assert.equal(source.monthlyCap, 750);
  assert.equal(source.totalCap, 9000);
  assert.match(row.comparisonNote, /new FAB Islamic credit card.+examples from the bank’s terms, not salary-band quotes/);
  assert.match(row.requirements.join(" "), new RegExp(`spend at least ${source.spendPercent}% of actual salary`));
  assert.match(row.requirements.join(" "), /No savings-only route is explained/);
  assert.match(row.clawbackTerms, new RegExp(`within ${source.payoutDays} calendar\\s+days after the end of the month`));
  assert.match(raw, /not quotes for every salary between them/);
});

test("all three receipt pins reject alterations, cross-cohort evidence and spoofed line identities", () => {
  assert.equal(documents.length, 3);
  for (const [index, receipt] of documents.entries()) {
    const other = documents[(index + 1) % documents.length];
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, id: "rak-islamic" }), null);
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, sourceUrl: other.sourceUrl }), null);
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, bytes: receipt.bytes + 1 }), null);
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, pdfSha256: other.pdfSha256 }), null);
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, layoutTextSha256: other.layoutTextSha256 }), null);
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, excerpts: [other.excerpts[0], ...receipt.excerpts.slice(1)] }), null);
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, excerpts: receipt.excerpts.slice(1) }), null);
    for (const key of ["anchor", "text"] as const) {
      const [first, ...next] = receipt.excerpts;
      assert.equal(parseSalaryThreeRouteSource({ ...receipt, excerpts: [{ ...first, [key]: first[key] + " extra" }, ...next] }), null);
    }
    assert.equal(parseSalaryThreeRouteSource({ ...receipt, dateWitness: other.dateWitness }), null);
  }
});
