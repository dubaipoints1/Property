import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyCoverage, coverageGuardError } from "../../src/lib/salaryTransferCoverage.ts";

const covered = ["adcb", "adib", "dib", "fab", "rakbank", "standard-chartered"];

test("a lapsed, unarchived offer classifies as lapsed instead of breaking the guard", () => {
  const c = classifyCoverage({
    coveredBanks: covered,
    liveOfferBanks: ["dib", "fab"],
    lapsedOfferBanks: ["rakbank"],
    checkedWithoutLiveOffer: ["adcb", "adib"],
    advertisedWithoutCurrentTerms: ["standard-chartered"],
  });
  assert.deepEqual(c.tracked, ["dib", "fab"]);
  assert.deepEqual(c.lapsed, ["rakbank"]);
  assert.deepEqual(c.unclassified, []);
  assert.equal(coverageGuardError(c, covered.length), null);
});

test("a bank with no classification at all is still a build error", () => {
  const c = classifyCoverage({
    coveredBanks: covered,
    liveOfferBanks: ["dib", "fab"],
    lapsedOfferBanks: [],
    checkedWithoutLiveOffer: ["adcb", "adib"],
    advertisedWithoutCurrentTerms: ["standard-chartered"],
  });
  assert.deepEqual(c.unclassified, ["rakbank"]);
  assert.match(coverageGuardError(c, covered.length) ?? "", /misses rakbank/);
});

test("a bank that is live and lapsed at once counts as tracked only", () => {
  const c = classifyCoverage({
    coveredBanks: ["fab"],
    liveOfferBanks: ["fab"],
    lapsedOfferBanks: ["fab"],
    checkedWithoutLiveOffer: [],
    advertisedWithoutCurrentTerms: [],
  });
  assert.deepEqual(c.tracked, ["fab"]);
  assert.deepEqual(c.lapsed, []);
});

test("a bank named in two editorial lists is reported as an overlap", () => {
  const c = classifyCoverage({
    coveredBanks: ["adcb", "fab"],
    liveOfferBanks: ["fab"],
    lapsedOfferBanks: [],
    checkedWithoutLiveOffer: ["adcb"],
    advertisedWithoutCurrentTerms: ["adcb"],
  });
  assert.deepEqual(c.overlaps, ["adcb"]);
  assert.match(coverageGuardError(c, 2) ?? "", /more than one bucket/);
});

test("output is sorted and de-duplicated regardless of input order", () => {
  const c = classifyCoverage({
    coveredBanks: ["z", "a", "m"],
    liveOfferBanks: ["m", "a", "a"],
    lapsedOfferBanks: ["z", "z"],
    checkedWithoutLiveOffer: [],
    advertisedWithoutCurrentTerms: [],
  });
  assert.deepEqual(c.tracked, ["a", "m"]);
  assert.deepEqual(c.lapsed, ["z"]);
});
