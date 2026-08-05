// Verification-freshness threshold, shared by every surface that flags
// drift.
//
// Charter §"Editorial guarantees": every card has a `lastVerified` date
// and the UI flags entries older than 90 days. The same guarantee now
// applies to salary-transfer offers, which carry `lastVerified` in the
// same shape but had no drift signal at all until 2026-08-05.
//
// The constant was previously copied into VerifiedStamp.astro,
// cards/SpecCard.astro and islands/RewardsCalculator.tsx — three literals
// that had to be changed together. One definition, four consumers.

export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Whether a verification date has drifted past the 90-day threshold.
 *
 * @param lastVerified the recorded verification date
 * @param now reference "now" — injectable so tests don't depend on the clock
 */
export function isStale(
  lastVerified: Date | string,
  now: Date | number = Date.now(),
): boolean {
  const verifiedAt =
    lastVerified instanceof Date ? lastVerified : new Date(lastVerified);
  const refTime = typeof now === "number" ? now : now.getTime();
  return refTime - verifiedAt.getTime() > NINETY_DAYS_MS;
}
