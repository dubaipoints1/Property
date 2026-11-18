// Collection dates represent UAE calendar days, not instants at UTC midnight.
const dubaiDay = new Intl.DateTimeFormat("en", {
  timeZone: "Asia/Dubai", year: "numeric", month: "numeric", day: "numeric",
});
const DAY = 86_400_000;

function dayAsUtc(now: Date): number {
  const parts = dubaiDay.formatToParts(now);
  const field = (type: "year" | "month" | "day") => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(field("year"), field("month") - 1, field("day"));
}

function storedDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export type SalaryOfferWindow = "live" | "upcoming" | "lapsed" | "archived" | "invalid";

export function salaryOfferWindow(
  offer: { validFrom: Date; validUntil: Date; archived?: boolean },
  now = new Date(),
): SalaryOfferWindow {
  if (offer.archived) return "archived";
  const start = storedDay(offer.validFrom);
  const end = storedDay(offer.validUntil);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return "invalid";
  const today = dayAsUtc(now);
  return today < start ? "upcoming" : today > end ? "lapsed" : "live";
}

export function daysToSalaryOfferEnd(end: string, now = new Date()): number {
  return (storedDay(new Date(end)) - dayAsUtc(now)) / DAY;
}
