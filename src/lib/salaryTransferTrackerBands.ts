import type { SalaryBand } from "./salaryTransfer";

export interface SalaryRange {
  min: number;
  maxExclusive: number | null;
}

// Keep filter ranges and landing URLs in one place. These are navigation
// categories, not the eligibility thresholds of any bank's offer.
export const TRACKER_SALARY_BANDS = [
  { slug: "aed-5000-to-8000", label: "AED 5,000 to under 8,000", shortLabel: "AED 5k to <8k", min: 5000, maxExclusive: 8000 },
  { slug: "aed-8000-to-15000", label: "AED 8,000 to under 15,000", shortLabel: "AED 8k to <15k", min: 8000, maxExclusive: 15000 },
  { slug: "aed-15000-to-30000", label: "AED 15,000 to under 30,000", shortLabel: "AED 15k to <30k", min: 15000, maxExclusive: 30000 },
  { slug: "aed-30000-to-50000", label: "AED 30,000 to under 50,000", shortLabel: "AED 30k to <50k", min: 30000, maxExclusive: 50000 },
  { slug: "aed-50000-plus", label: "AED 50,000+", shortLabel: "AED 50k+", min: 50000, maxExclusive: null },
] as const satisfies readonly (SalaryRange & {
  slug: string;
  label: string;
  shortLabel: string;
})[];

export type TrackerSalaryBand = (typeof TRACKER_SALARY_BANDS)[number];

export function salaryBandsOverlap(
  tier: Pick<SalaryBand, "minSalary" | "maxSalary">,
  range: SalaryRange,
): boolean {
  return tier.minSalary < (range.maxExclusive ?? Infinity) &&
    range.min <= (tier.maxSalary ?? Infinity);
}

export function selectTrackerReward(
  tiers: readonly SalaryBand[],
  range: SalaryRange | null,
  cashOnly: boolean,
): SalaryBand | null {
  let best: SalaryBand | null = null;
  for (const tier of tiers) {
    if ((cashOnly && tier.rewardType !== "cash") || (range && !salaryBandsOverlap(tier, range))) continue;
    if (!best || tier.rewardAmount > best.rewardAmount ||
      (tier.rewardAmount === best.rewardAmount && tier.minSalary < best.minSalary)) {
      best = tier;
    }
  }
  return best;
}
