/** Dependency-free canonical fee evidence gate, outside display formatting. */
export interface CardFeeReviewEvidence {
  annualFee: { amount: number };
  _provenance?: Record<string, string> | null;
}
export function cardFeeNeedsReview(card: CardFeeReviewEvidence, field: "annualFee" | "joiningFee"): boolean {
  const held = Object.entries(card._provenance ?? {}).some(([key, state]) => state === "needs-review"
    && [field, "vatPolicy"].some(prefix => key === prefix || key.startsWith(prefix + ".")));
  return held ||
    (field === "annualFee" && card.annualFee.amount === 0 && card._provenance?.annualFee === "scraped");
}

/** The advertised offer and standard tariff are both known, but the
 * charge that applies to a reader's application is not established. */
export function hasUnconfirmedAdvertisedFeeWaiver(card: CardFeeReviewEvidence): boolean {
  return cardFeeNeedsReview(card, "annualFee") && card._provenance?.["annualFeeWaiver.advertisedApplicability"] === "needs-review";
}

/** Known non-negative finite fees sort before unknown values. Two unknowns
 * remain a comparator tie; neither is substituted with a zero fee. */
export function compareKnownAnnualFees(left: number | null, right: number | null): number {
  const l = left !== null && Number.isFinite(left) && left >= 0 ? left : null;
  const r = right !== null && Number.isFinite(right) && right >= 0 ? right : null;
  if (l === null && r === null) return 0;
  if (l === null) return 1;
  if (r === null) return -1;
  return l - r;
}
