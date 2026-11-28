import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyCoverage,
  coverageGuardError,
  SALARY_OFFER_ADVERTISED_WITHOUT_CURRENT_TERMS,
  SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH,
  SALARY_OFFER_REVIEW_PENDING_BANKS,
} from "../../src/lib/salaryTransferCoverage.ts";

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

test("an issuer with cards can have an explicit salary-offer review hold without implying no offer", () => {
  const input = {
    coveredBanks: ["fab", "nbf"],
    liveOfferBanks: ["fab"],
    lapsedOfferBanks: [],
    checkedWithoutLiveOffer: [],
    advertisedWithoutCurrentTerms: [],
    reviewPendingBanks: ["nbf"],
  };
  const c = classifyCoverage(input);
  assert.deepEqual(c.reviewPending, ["nbf"]);
  assert.deepEqual(c.tracked, ["fab"]);
  assert.deepEqual(c.checkedWithoutLiveOffer, []);
  assert.equal(coverageGuardError(c, 2), null);
  assert.match(coverageGuardError(classifyCoverage({ ...input, upcomingOfferBanks: ["nbf"] }), 2) ?? "", /nbf in more than one bucket/);
});

test("an upcoming offer classifies without being counted as live or lapsed", () => {
  const c = classifyCoverage({
    coveredBanks: ["dib", "fab"],
    liveOfferBanks: ["fab"],
    lapsedOfferBanks: ["dib"],
    upcomingOfferBanks: ["dib", "fab"],
    checkedWithoutLiveOffer: [],
    advertisedWithoutCurrentTerms: [],
  });
  assert.deepEqual(c.tracked, ["fab"]);
  assert.deepEqual(c.upcoming, ["dib"]);
  assert.deepEqual(c.lapsed, []);
  assert.equal(coverageGuardError(c, 2), null);
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

test("limited campaign coverage is tracked separately from outstanding bank terms or reviews", () => {
  const coveredBanks = [
    "adcb", "adib", "al-masraf", "fab", "mashreq",
    ...SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH, "nbq",
  ];
  const c = classifyCoverage({
    coveredBanks,
    liveOfferBanks: ["adib", "fab", "fab", "mashreq", "mashreq"],
    lapsedOfferBanks: [],
    checkedWithoutLiveOffer: SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH,
    advertisedWithoutCurrentTerms: SALARY_OFFER_ADVERTISED_WITHOUT_CURRENT_TERMS,
    reviewPendingBanks: SALARY_OFFER_REVIEW_PENDING_BANKS,
  });
  assert.deepEqual(c.tracked, ["adib", "fab", "mashreq"]);
  assert.deepEqual(c.advertisedWithoutCurrentTerms, ["adcb", "al-masraf"]);
  assert.deepEqual(c.reviewPending, ["nbq"]);
  assert.equal(coverageGuardError(c, coveredBanks.length), null);
});
