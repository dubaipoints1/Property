import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import {
  getSalaryTransferTimeline,
  getSalaryTransferTimelines,
} from "../../src/lib/salaryTransferTimeline.ts";

// Parse the exact source-backed campaign records rather than building
// convenient fixtures that could drift from what the site renders.
function readCampaign(id: string) {
  const file = ["salaryTransferOffers", "salaryTransferOfferHistory"]
    .map((folder) => new URL(`../../src/content/${folder}/${id}.mdx`, import.meta.url))
    .find((url) => existsSync(url));
  if (!file) return undefined;
  const raw = readFileSync(file, "utf8").match(/^---\n([\s\S]+?)\n---/)?.[1];
  assert.ok(raw, `Missing frontmatter for ${id}`);
  const data = parse(raw) as {
    bank: string;
    sourceUrl: string;
    validFrom: string;
    validUntil: string;
    requirements: string[];
    clawbackTerms: string;
  };
  return { ...data, id, bankSlug: data.bank };
}

const cases = [
  ["emirates-islamic-2026-oct-2027-mar", "published", /within 60 days of meeting/, /12 months after the payout month/],
  ["fab-20-percent-2026", "published", /within 45 calendar days after each qualifying month/, /forfeits the unpaid cashback/],
  ["hsbc-new-to-bank-2026-sep-dec", "published", /within 90 calendar days after/, /within 180 days of first funding/],
  ["mashreq-2026", "not-published", /12 equal monthly instalments/, /two consecutive months in the first year/],
  ["dib-xtra-2026", "not-published", /later applicable bundle or spend window/, /withhold or reverse/],
  ["emirates-nbd-payroll-cashback-2026-q4", "published", /after 150 calendar days from your first salary/, /12 consecutive salaries/],
] as const;

test("the six campaign timelines preserve their own payment clocks and retention tests", () => {
  const campaigns = cases.flatMap(([id]) => {
    const campaign = readCampaign(id);
    return campaign ? [campaign] : [];
  });
  const timelines = getSalaryTransferTimelines(campaigns);
  for (const [id, endDate, payout, keep] of cases) {
    // A renamed or retired archive must not block a later campaign build.
    if (!campaigns.some((campaign) => campaign.id === id)) continue;
    const timeline = timelines[id];
    assert.ok(timeline, `Recheck summary and source fingerprint for ${id}`);
    assert.equal(timeline.endDate, endDate, id);
    assert.equal(timeline.steps.length, 4, id);
    assert.match(timeline.steps[2], payout, id);
    assert.match(timeline.steps[3], keep, id);
  }
});

test("a changed source, campaign, dates or fine print fails closed", (t) => {
  const fab = readCampaign("fab-20-percent-2026");
  if (!fab) return t.skip("FAB source campaign no longer exists under this ID");
  assert.ok(getSalaryTransferTimeline(fab));
  for (const changed of [
    { ...fab, id: "fab-new-offer" },
    { ...fab, bankSlug: "dib" },
    { ...fab, sourceUrl: "https://www.bankfab.com/updated-terms" },
    { ...fab, validUntil: "2027-01-01" },
    { ...fab, requirements: ["Revised monthly save condition"] },
    { ...fab, clawbackTerms: "New clawback provision" },
  ]) {
    assert.equal(getSalaryTransferTimeline(changed), undefined);
  }
});

test("Astro ISO dates and YAML whitespace do not invalidate unchanged terms", (t) => {
  const fab = readCampaign("fab-20-percent-2026");
  if (!fab) return t.skip("FAB source campaign no longer exists under this ID");
  const reformatted = {
    ...fab,
    validFrom: `${fab.validFrom}T00:00:00.000Z`,
    validUntil: `${fab.validUntil}T00:00:00.000Z`,
    clawbackTerms: fab.clawbackTerms.replace(/\s+/g, " "),
  };
  assert.deepEqual(getSalaryTransferTimeline(reformatted), getSalaryTransferTimeline(fab));
});
