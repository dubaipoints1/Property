import type { CardData } from "./cardsData";
import { cardFeeAmountLabel } from "./cardFeeFacts";
import { cardHasUnresolvedTerms, cardSalaryLabel } from "./cardEligibility";
import { annualFeeLabel, CATEGORY_LABELS_FOR_TOP, formatEarnRate, topEarnEntry } from "./cardsDataFormat";

/** Search and Product descriptions carry the same source limitations as
 * the visible profile; a source-record date is not an unrestricted verdict. */
export function cardSearchMetadata(card: CardData) {
  const partial = card.refreshMode === "manual-primary";
  const limited = cardHasUnresolvedTerms(card);
  const top = topEarnEntry(card.earnRates as Record<string, unknown>, card._provenance);
  const topLabel = top ? CATEGORY_LABELS_FOR_TOP[top.key] ?? top.key : null;
  const qualification = partial ? annualFeeLabel(card).qual : null;
  const qualifier = qualification === "year 2+" ? " from year two"
    : qualification ? ` · ${qualification}` : "";
  const noMembershipFees = partial && card.eligibility.publishedIncomeBasis === "salaried-applicants"
    && card.annualFee.amount === 0 && card.joiningFee?.amount === 0
    && card._provenance?.annualFee === "editor-confirmed" && card._provenance?.joiningFee === "editor-confirmed";
  return {
    kind: partial ? "source profile" : "review",
    description: [
      `${card.name} ${partial ? "partial source profile" : "review"}`,
      noMembershipFees ? "Standard annual fee: none; no listed joining fee" : `Standard annual fee: ${cardFeeAmountLabel(card)}${qualifier}`,
      limited && card.standardFeeConditions === "introductory-offer-unconfirmed" ? "Terms pending" :
        limited ? "Terms pending; read source notes" : `Minimum salary: ${cardSalaryLabel(card)}`,
      !limited && top && topLabel ? `${formatEarnRate(top.value, card.earnUnit, card.categories)} ${topLabel}` : null,
    ].filter(Boolean).join(" · "),
  };
}
