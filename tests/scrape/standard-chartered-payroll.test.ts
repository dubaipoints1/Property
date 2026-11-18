import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { parseStandardCharteredPayroll } from "../../scripts/scrape/_standard-chartered-payroll.ts";

// A compact synthetic regression fixture with the contract's layout/markers.
// The real downloaded PDF and extracted text hashes are recorded in the
// 18 November salary source receipt.
const source = [
  "Campaign Period between 1st November 2026 and 31st January 2027, both days inclusive.",
  "7. Unrelated balance reward AED 9,000.",
  "9. Salary Transfer Cashback:",
  "i. Salary transfer of AED 30,000 to AED 74,999 will receive AED 2,000 cashback",
  "ii. Salary transfer of AED 75,000 and above will receive AED 4,000 cashback",
  "New customer rules are subject to six consecutive months of salary transfers commencing from the month after account opening",
  "Existing to Bank clients who have not transferred their salary in 2026 are considered separately.",
  "Payable using bank payroll rules, credited by the end of 7th month following the initial salary credit.",
  "10. In the event that an account closes, check the campaign rules.",
].join("\n");

test("parses only the salary clause and matches the tracker row", () => {
  const parsed = parseStandardCharteredPayroll(source);
  assert.ok(parsed);
  const file = new URL("../../src/content/salaryTransferOffers/standard-chartered-priority-2026-nov-2027-jan.mdx", import.meta.url);
  const frontmatter = readFileSync(file, "utf8").match(/^---\n([\s\S]+?)\n---/)?.[1];
  assert.ok(frontmatter);
  const row = parse(frontmatter);
  assert.equal(row.validFrom, parsed.validFrom);
  assert.equal(row.validUntil, parsed.validUntil);
  assert.equal(row.tenureMonths, parsed.tenureMonths);
  assert.match(row.requirements.join(" "), new RegExp(`in ${parsed.existingNoSalaryYear}`));
  assert.deepEqual(row.salaryBands, parsed.bands.map((band) => ({
    ...band, rewardType: "cash", monthsToPayout: parsed.monthsToPayout,
  })));
});

test("fails closed on a deposit excerpt, malformed number, changed qualification or dates", () => {
  for (const off of [
    source.replace("9. Salary Transfer Cashback:", "9. Fixed Deposit Cashback:"),
    source.replace("74,999", "74,99"),
    source.replace("six consecutive", "five consecutive"),
    source.replace("1st November", "31st November"),
    source.replace("75,000", "80,000"),
  ]) assert.equal(parseStandardCharteredPayroll(off), null);
});
