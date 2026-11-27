import { useEffect, useMemo, useState } from "preact/hooks";
import { salaryOfferWindow } from "../../lib/salaryTransferWindow";
import type { SalaryTransferTimeline } from "../../lib/salaryTransferTimeline";

export type SalaryOfferEndDates = Record<string, Pick<SalaryTransferTimeline, "endDate">>;
type OfferWindow = { id: string; validFrom: string; validUntil: string };

const DAY = 86_400_000;
// Dubai observes Gulf Standard Time (UTC+04:00) throughout the year.
const DUBAI_OFFSET = 4 * 3_600_000;

export function nextDubaiMidnightMs(now: Date): number {
  return (Math.floor((now.getTime() + DUBAI_OFFSET) / DAY) + 1) * DAY - DUBAI_OFFSET;
}

export function selectCurrentSalaryOffers<T extends OfferWindow>(
  offers: T[], endDates: SalaryOfferEndDates, now: Date | null,
): T[] {
  // SSR and the first hydration pass use the same static snapshot. A validUntil
  // with no exact published deadline may be an internal review date, not an expiry.
  if (!now) return offers;
  return offers.filter((offer) => endDates[offer.id]?.endDate !== "published" ||
    salaryOfferWindow({
      validFrom: new Date(offer.validFrom),
      validUntil: new Date(offer.validUntil),
    }, now) === "live");
}

export function useSalaryTransferWindow<T extends OfferWindow>(offers: T[], endDates: SalaryOfferEndDates) {
  const [dubaiNow, setDubaiNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => {
      const now = new Date();
      const nextMidnight = nextDubaiMidnightMs(now);
      setDubaiNow((previous) => previous && nextDubaiMidnightMs(previous) === nextMidnight ? previous : now);
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, nextMidnight - now.getTime());
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const currentOffers = useMemo(() => selectCurrentSalaryOffers(offers, endDates, dubaiNow), [offers, endDates, dubaiNow]);
  return { currentOffers, dubaiNow };
}
