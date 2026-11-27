import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nextDubaiMidnightMs,
  selectCurrentSalaryOffers,
  type SalaryOfferEndDates,
} from "../../src/components/islands/useSalaryTransferWindow.ts";

const offers = [
  { id: "dated", validFrom: "2026-11-01", validUntil: "2026-11-30" },
  { id: "review-only", validFrom: "2026-11-01", validUntil: "2026-11-30" },
  { id: "unpublished", validFrom: "2026-11-01", validUntil: "2026-11-30" },
];
const endDates: SalaryOfferEndDates = {
  dated: { endDate: "published" },
  "review-only": { endDate: "not-published" },
};
const id = ({ id }: { id: string }) => id;

test("SSR retains the same saved offers for the initial client render", () => {
  assert.equal(selectCurrentSalaryOffers(offers, endDates, null), offers);
});

test("only exact published deadlines expire at Dubai midnight after the inclusive end day", () => {
  assert.deepEqual(selectCurrentSalaryOffers(offers, endDates, new Date("2026-11-30T19:59:59.999Z")).map(id), offers.map(id));
  assert.deepEqual(selectCurrentSalaryOffers(offers, endDates, new Date("2026-11-30T20:00:00.000Z")).map(id), ["review-only", "unpublished"]);
});

test("a dated campaign outside its start window or with invalid terms does not price in the browser", () => {
  const invalid = { ...offers[0]!, validUntil: "invalid" };
  const now = new Date("2026-10-31T19:59:59.999Z");
  assert.deepEqual(selectCurrentSalaryOffers([offers[0]!, invalid], endDates, now), []);
});

test("the local refresh schedules the next Dubai midnight across a year boundary", () => {
  const justBefore = new Date("2026-12-31T19:59:59.999Z");
  const midnight = new Date("2026-12-31T20:00:00.000Z");
  assert.equal(nextDubaiMidnightMs(justBefore) - justBefore.getTime(), 1);
  assert.equal(new Date(nextDubaiMidnightMs(midnight)).toISOString(), "2027-01-01T20:00:00.000Z");
});
