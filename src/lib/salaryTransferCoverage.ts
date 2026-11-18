/**
 * Salary-transfer coverage classification — pure logic behind the
 * "Coverage status" block on /salary-transfer/.
 *
 * Why this exists (2026-09-06 site audit, P0): the tracker page asserted
 * at build time that every covered bank was hand-classified as tracked,
 * checked-without-offer or advertised-without-terms, and threw otherwise.
 * The "tracked" set is derived from live offers, which drop out the day
 * `validUntil` passes — so when RAKBANK's cash reward lapsed on 31 August
 * 2026 without being archived, the classification fell to 14 of 15 and
 * `astro build` failed from 1 September onward. Main was undeployable for
 * six days before anyone noticed, because nothing pushed to it.
 *
 * The guard's intent was right (a bank the page says nothing about is a
 * coverage gap the reader should never have to find by counting rows), so
 * it stays — but a lapsed, not-yet-archived offer is now its own bucket
 * rather than a build failure. Only a bank with no classification at all
 * still throws.
 */

// Covering an issuer's cards is not evidence about its salary-transfer offers.
export const SALARY_OFFER_REVIEW_PENDING_BANKS: readonly string[] = ["nbf"];

export interface CoverageInput {
  /** Every bank the publication covers (the denominator). */
  coveredBanks: readonly string[];
  /** Banks with at least one live (unexpired, unarchived) offer. */
  liveOfferBanks: readonly string[];
  /** Banks whose offers have all lapsed but are still unarchived. */
  lapsedOfferBanks: readonly string[];
  /** Banks with an unarchived offer that is not open yet. */
  upcomingOfferBanks?: readonly string[];
  /** Editorial: checked, no current live banded cash offer. */
  checkedWithoutLiveOffer: readonly string[];
  /** Editorial: bank advertises an offer without current published terms. */
  advertisedWithoutCurrentTerms: readonly string[];
  /** Editorial: no current salary-offer review has been completed. */
  reviewPendingBanks?: readonly string[];
}

export interface Coverage {
  tracked: string[];
  lapsed: string[];
  upcoming: string[];
  checkedWithoutLiveOffer: string[];
  advertisedWithoutCurrentTerms: string[];
  reviewPending: string[];
  /** Covered banks that appear in no bucket — still a hard build error. */
  unclassified: string[];
  /** Banks named in more than one editorial list (a copy-paste mistake). */
  overlaps: string[];
}

const uniqSorted = (xs: Iterable<string>) => [...new Set(xs)].sort();

export function classifyCoverage(input: CoverageInput): Coverage {
  const tracked = uniqSorted(input.liveOfferBanks);
  const isTracked = new Set(tracked);
  const upcoming = uniqSorted(input.upcomingOfferBanks ?? []).filter((b) => !isTracked.has(b));
  const isUpcoming = new Set(upcoming);
  const lapsed = uniqSorted(input.lapsedOfferBanks).filter((b) => !isTracked.has(b) && !isUpcoming.has(b));
  const isLapsed = new Set(lapsed);
  const checked = uniqSorted(input.checkedWithoutLiveOffer);
  const advertised = uniqSorted(input.advertisedWithoutCurrentTerms);
  const reviewPending = uniqSorted(input.reviewPendingBanks ?? []);
  const known = new Set([...tracked, ...lapsed, ...upcoming, ...checked, ...advertised]);

  const overlaps = uniqSorted(
    [...checked.filter((b) => advertised.includes(b) || isTracked.has(b) || isLapsed.has(b) || isUpcoming.has(b)),
     ...advertised.filter((b) => isTracked.has(b) || isLapsed.has(b) || isUpcoming.has(b)),
     ...reviewPending.filter((b) => known.has(b))],
  );

  const classified = new Set([...known, ...reviewPending]);
  const unclassified = uniqSorted(input.coveredBanks).filter((b) => !classified.has(b));

  return { tracked, lapsed, upcoming, checkedWithoutLiveOffer: checked, advertisedWithoutCurrentTerms: advertised, reviewPending, unclassified, overlaps };
}

/** Human-readable reason for the build guard, or null when the page may render. */
export function coverageGuardError(coverage: Coverage, coveredCount: number): string | null {
  if (coverage.unclassified.length) {
    return `Salary-transfer coverage classification misses ${coverage.unclassified.join(", ")} (${coveredCount} banks covered). Record each bank's evidence state or an explicit review hold.`;
  }
  if (coverage.overlaps.length) {
    return `Salary-transfer coverage lists ${coverage.overlaps.join(", ")} in more than one bucket.`;
  }
  return null;
}
