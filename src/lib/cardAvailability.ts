type CardAvailability = {
  discontinuedForNewApplicants?: unknown;
  applicationAvailability?: "unconfirmed";
};

/** Preserve the historical/source profile without counting an unconfirmed
 * application route as a currently marketed choice for new applicants. */
export function hasCurrentApplicationProfile(card: CardAvailability): boolean {
  return card.discontinuedForNewApplicants === undefined
    && card.applicationAvailability !== "unconfirmed";
}
