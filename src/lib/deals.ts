// Shared deal helpers: the live filter, days-left arithmetic and the
// sector labels the /deals/ filter row, the homepage and card reviews all
// read. The live filter is load-bearing (an expired deal sat on the
// homepage for a week in August 2026 before it existed), so it lives in
// one place rather than being re-typed per page.

import { getCollection, type CollectionEntry } from "astro:content";

export type Deal = CollectionEntry<"deals">;

export const SECTOR_LABELS: Record<NonNullable<Deal["data"]["sector"]>, string> = {
  dining: "Dining",
  groceries: "Groceries",
  "online-shopping": "Online shopping",
  travel: "Travel",
  "rides-delivery": "Rides & delivery",
  health: "Health & pharmacy",
  entertainment: "Entertainment",
  "fuel-auto": "Fuel & car",
  banking: "Bank offers",
};

const DAY_MS = 86_400_000;

export function isLive(d: Deal, nowMs = Date.now()): boolean {
  return !d.data.archived && d.data.expiresOn.getTime() >= nowMs;
}

/** Live deals, soonest expiry first. */
export async function getLiveDeals(nowMs = Date.now()): Promise<Deal[]> {
  return (await getCollection("deals"))
    .filter((d) => isLive(d, nowMs))
    .sort((a, b) => a.data.expiresOn.getTime() - b.data.expiresOn.getTime());
}

/** Whole days until expiry, counting the expiry day itself as day 0. */
export function daysLeft(d: Deal, nowMs = Date.now()): number {
  return Math.max(0, Math.floor((d.data.expiresOn.getTime() - nowMs) / DAY_MS));
}

/** Within this many days a deal counts as "ending soon". */
export const ENDING_SOON_DAYS = 14;
