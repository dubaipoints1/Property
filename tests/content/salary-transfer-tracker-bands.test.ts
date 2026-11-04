import assert from "node:assert/strict";
import { test } from "node:test";
import { findBand, type SalaryBand } from "../../src/lib/salaryTransfer.ts";
import {
  salaryBandsOverlap,
  selectTrackerReward,
  TRACKER_SALARY_BANDS,
} from "../../src/lib/salaryTransferTrackerBands.ts";

const tier = (
  minSalary: number,
  maxSalary: number | null,
  rewardAmount: number,
  rewardType: SalaryBand["rewardType"] = "cash",
): SalaryBand => ({ minSalary, maxSalary, rewardAmount, rewardType, monthsToPayout: 3 });

test("tracker includes a tier that starts partway through a browsing band", () => {
  const [, mid] = TRACKER_SALARY_BANDS;
  const lowerThreshold = tier(12500, 39999, 1000);
  const higherThreshold = tier(40000, null, 4000);
  assert.equal(selectTrackerReward([lowerThreshold, higherThreshold], mid, false), lowerThreshold);
  assert.equal(findBand([lowerThreshold, higherThreshold], 12499), null);
  assert.equal(findBand([lowerThreshold, higherThreshold], 12500), lowerThreshold);
});

test("same-band reward is the highest overlapping tier, not the highest campaign tier", () => {
  const [, , mid] = TRACKER_SALARY_BANDS;
  const first = tier(5000, 19999, 500);
  const second = tier(20000, 39999, 1000);
  const third = tier(40000, null, 4000);
  assert.equal(selectTrackerReward([first, second, third], mid, false), second);
  assert.equal(selectTrackerReward([first, second, third], null, false), third);
});

test("cash-only filters the shown reward tier rather than the whole offer", () => {
  const [low, mid] = TRACKER_SALARY_BANDS;
  const voucher = tier(5000, 7999, 1200, "voucher");
  const cash = tier(8000, 14999, 900);
  assert.equal(selectTrackerReward([voucher, cash], low, true), null);
  assert.equal(selectTrackerReward([voucher, cash], mid, true), cash);
  assert.equal(selectTrackerReward([voucher, cash], null, true), cash);
  assert.equal(selectTrackerReward([voucher, cash], null, false), voucher);
});

test("browse bands cover fractional salaries and leave each next threshold to its own band", () => {
  const [first, second, , , last] = TRACKER_SALARY_BANDS;
  assert.equal(salaryBandsOverlap(tier(7999, 7999, 1), first), true);
  assert.equal(salaryBandsOverlap(tier(7999.50, 7999.50, 1), first), true);
  assert.equal(salaryBandsOverlap(tier(7999.50, 7999.50, 1), second), false);
  assert.equal(findBand([tier(5000, 7999, 1)], 7999.50), null);
  assert.equal(salaryBandsOverlap(tier(8000, 8000, 1), first), false);
  assert.equal(salaryBandsOverlap(tier(8000, 8000, 1), second), true);
  assert.equal(salaryBandsOverlap(tier(60000, null, 1), last), true);
  assert.equal(salaryBandsOverlap(tier(10000, 49999, 1), last), false);
});

test("equal rewards prefer the lower applicable salary threshold", () => {
  const lower = tier(8000, 9999, 500);
  const higher = tier(10000, 14999, 500);
  assert.equal(selectTrackerReward([higher, lower], TRACKER_SALARY_BANDS[1], false), lower);
});
