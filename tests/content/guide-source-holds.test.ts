import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("dining and fuel guides do not supply unrestricted Mashreq returns or a confirmed HSBC salary", () => {
  for (const name of ["dining", "fuel"]) {
    const guide = readFileSync(`src/content/guides/best-${name}-cards-uae-2026.mdx`, "utf8");
    const scenarioRow = guide.split("\n").find(line => line.startsWith("| [Mashreq Cashback]") && line.includes("Not estimated"));
    assert.ok(scenarioRow, name);
    assert.doesNotMatch(scenarioRow, /\bAED\s+[\d,]+/, name);
    assert.match(guide, /assigned credit limit/);
    assert.match(guide, /salary\s+eligibility remains pending|Salary eligibility is pending|Salary\s+eligibility is pending/i);
    assert.doesNotMatch(guide, /uncapped 5%|no cap and no floor|no monthly cap|no fee and no fine print/);
  }
});

test("fuel guide retains current ADCB provider/channel restrictions and correction scope", () => {
  const guide = readFileSync("src/content/guides/best-fuel-cards-uae-2026.mdx", "utf8");
  assert.match(guide, /Salik must be paid directly through the provider or Dubai\s+Now/);
  assert.match(guide, /not all digital spending or app-store\s+payments/);
  assert.match(guide, /not a full re-verification/);
});
