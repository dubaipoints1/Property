import type { CardData } from "./cardsData";
import { cardFeeAmountLabel } from "./cardFeeFacts";
import { cardHasUnresolvedTerms, cardSalaryLabel } from "./cardEligibility";
import { CATEGORY_LABELS_FOR_TOP, formatEarnRate, topEarnEntry } from "./cardsDataFormat";

/** Search and Product descriptions carry the same source limitations as
 * the visible profile; a source-record date is not an unrestricted verdict. */
export function cardSearchMetadata(card: CardData) {
  const partial = card.refreshMode === "manual-primary";
  const limited = cardHasUnresolvedTerms(card);
  const top = topEarnEntry(card.earnRates as Record<string, unknown>, card._provenance);
  const topLabel = top ? CATEGORY_LABELS_FOR_TOP[top.key] ?? top.key : null;
  return {
    kind: partial ? "source profile" : "review",
    description: [
      `${card.name} ${partial ? "partial source profile" : "review"}`,
      `Standard annual fee: ${cardFeeAmountLabel(card)}`,
      limited ? "Terms pending; read source notes" : `Minimum salary: ${cardSalaryLabel(card)}`,
      !limited && top && topLabel ? `${formatEarnRate(top.value, card.earnUnit, card.categories)} ${topLabel}` : null,
    ].filter(Boolean).join(" · "),
  };
}
