import { cardFeeNeedsReview, type CardFeeReviewEvidence } from "./cardFeeProvenance";
import { cardFieldHeld } from "./cardPublicFacts";

type BreakdownFeeCard = CardFeeReviewEvidence & { vatPolicy?: "inclusive" | "exclusive"; scopedEarnRates?: readonly unknown[] };
type BreakdownTotals = { known: false; fee: null; net: null }
  | { known: true; fee: number; net: number; hasFee: boolean; barTotal: number };

/** Explicit editorial amounts or source-backed fees only. An inline override
 * cannot overrule a held source field; missing fees are unknown, never zero. */
export function cardValueBreakdownTotals(gross: number, card?: BreakdownFeeCard, annualFee?: number, itemKinds: readonly string[] = []): BreakdownTotals {
  if (!Number.isFinite(gross) || gross < 0) throw new Error("AEDValueBreakdown: expected a finite, non-negative gross value");
  const amount = annualFee ?? card?.annualFee.amount;
  const kinds = new Set(itemKinds.map(kind => kind.toLowerCase()));
  const dependentHold = card && ((kinds.has("earn") && (cardFieldHeld(card, "earnRates") || cardFieldHeld(card, "earnUnit") || !!card.scopedEarnRates?.length))
    || (kinds.has("perk") && (cardFieldHeld(card, "_features") || cardFieldHeld(card, "perks")))
    || (kinds.has("bonus") && cardFieldHeld(card, "welcomeBonus")));
  if (dependentHold || (card && cardFeeNeedsReview(card, "annualFee")) || amount === undefined || !Number.isFinite(amount) || amount < 0) {
    return { known: false, fee: null, net: null };
  }
  const fee = card?.vatPolicy === "exclusive" ? Math.round(amount * 105) / 100 : amount;
  return { known: true, fee, net: gross - fee, hasFee: fee > 0, barTotal: gross + fee };
}
