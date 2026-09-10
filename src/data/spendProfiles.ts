/**
 * Named spend profiles for /calculator/.
 *
 * The kredit.ae compare pages price both cards across named household
 * profiles and say which one the figure was modelled on. That framing is the
 * one thing from the 10 September 2026 teardown worth taking whole: a reward
 * figure with no stated spend behind it is not a figure. These presets are
 * that statement. Each is an editorial modelling assumption in round
 * dirhams — a starting point the reader edits, not a claim about anyone's
 * household — and the calculator labels them as such.
 *
 * No preset comes from a competitor's numbers. They were chosen to spread
 * the seven categories the calculator models so that different cards rise
 * to the top under different profiles; tests/calculator/presets.test.ts
 * asserts that spread rather than trusting it.
 */
import type { SpendProfile } from "~/components/islands/RewardsCalculator";

export interface SpendPreset {
  id: string;
  label: string;
  /** One clause on who this profile stands in for. */
  note: string;
  spend: SpendProfile;
}

export const SPEND_PRESETS: readonly SpendPreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    note: "the calculator's default mix",
    spend: { dining: 1500, groceries: 2000, fuel: 800, travel: 1000, online: 1500, utilities: 600, entertainment: 400 },
  },
  {
    id: "grocery-household",
    label: "Grocery-led household",
    note: "supermarkets and fuel carry the month",
    spend: { dining: 800, groceries: 3500, fuel: 1200, travel: 500, online: 1000, utilities: 900, entertainment: 300 },
  },
  {
    id: "eats-out",
    label: "Eats out most nights",
    note: "dining is the largest line",
    spend: { dining: 3000, groceries: 800, fuel: 500, travel: 800, online: 1200, utilities: 500, entertainment: 600 },
  },
  {
    id: "frequent-flyer",
    label: "Frequent flyer",
    note: "flights and hotels dominate",
    spend: { dining: 1500, groceries: 1200, fuel: 600, travel: 5000, online: 1500, utilities: 600, entertainment: 400 },
  },
  {
    id: "online-first",
    label: "Online-first shopper",
    note: "most retail is delivered",
    spend: { dining: 1000, groceries: 1200, fuel: 400, travel: 600, online: 4000, utilities: 600, entertainment: 500 },
  },
  {
    id: "new-arrival",
    label: "New arrival, light spend",
    note: "first months in the UAE, no big lines yet",
    spend: { dining: 600, groceries: 1200, fuel: 400, travel: 200, online: 600, utilities: 500, entertainment: 200 },
  },
] as const;

export function presetTotal(p: SpendPreset): number {
  return Object.values(p.spend).reduce((a, b) => a + b, 0);
}
