import type { CardData } from "./cardsData";
import { formatAED } from "./cardsDataFormat";

type FeeCard = Pick<CardData, "annualFee" | "joiningFee" | "vatPolicy" | "_provenance">;
type FeeField = "annualFee" | "joiningFee";

/** Keep a flagged parent, amount or tax basis from becoming a precise fee. */
export function cardFeeNeedsReview(card: FeeCard, field: FeeField): boolean {
  const pending = (key: string) => card._provenance?.[key] === "needs-review";
  return pending(field) || pending(`${field}.amount`) || pending("vatPolicy") ||
    (field === "annualFee" && card.annualFee.amount === 0 && card._provenance?.annualFee === "scraped");
}

export function cardFeeAmountLabel(card: FeeCard, field: FeeField = "annualFee"): string {
  if (cardFeeNeedsReview(card, field)) return "Pending";
  const fee = card[field];
  if (fee == null) return "Not listed";
  if (fee.amount === 0) return "Free";
  return `${formatAED(fee.amount)} ${card.vatPolicy === "exclusive" ? "+ 5% VAT" : "including VAT"}`;
}

type FxCard = {
  fxFee: number | null;
  fxFeeScope?: CardData["fxFeeScope"];
  fxFeeVatTreatment?: CardData["fxFeeVatTreatment"];
  fxFeeUpperBound?: CardData["fxFeeUpperBound"];
  _provenance?: Record<string, string> | null;
};

/** Any held rate, bound, tax, scope or scheme qualifier invalidates an exact
 * display/statistic. A zero cannot take precedence over held metadata. */
export function cardFxNeedsReview(card: Pick<FxCard, "_provenance">): boolean {
  return Object.entries(card._provenance ?? {}).some(([key, state]) => state === "needs-review" && /^fxFee(?:$|[A-Z.])/.test(key));
}

/** Never let an issuer processing fee stand in for a total FX cost. */
export function cardFxFeeLabel(card: FxCard): string {
  if (cardFxNeedsReview(card)) return "Pending";
  if (card.fxFeeUpperBound) {
    const bound = card.fxFeeUpperBound;
    const scope = bound.scope === "issuer-fx-charges" ? "issuer FX charges" : "issuer processing fee";
    const vat = bound.vatTreatment === "inclusive" ? "including VAT" : "plus VAT";
    const scheme = bound.schemeCharges === "additional" ? "scheme charges may also apply" : "scheme charges included";
    return `Up to ${bound.amount}% ${scope} ${vat}; ${scheme}`;
  }
  if (card.fxFee === null) return "Pending";
  if (card.fxFeeScope) {
    const scope = card.fxFeeScope === "issuer-processing-only" ? "issuer processing fee" : "issuer FX charges";
    const vat = card.fxFeeVatTreatment === "not-applicable" ? "(VAT not applicable)"
      : card.fxFeeVatTreatment === "exclusive" ? "plus VAT" : "including VAT";
    return `${card.fxFee.toFixed(2)}% ${scope} ${vat}; scheme charges may also apply`;
  }
  return `${card.fxFee}%`;
}

/** Deduct only the fee from a separately stated gross editorial example. */
export function cardIllustrativeNetLabel(card: FeeCard, annualGross: number): string {
  if (!Number.isFinite(annualGross) || annualGross < 0) throw new Error("CardIllustrativeNet: expected a non-negative illustrative annual gross return");
  if (card.vatPolicy !== "inclusive" || cardFeeNeedsReview(card, "annualFee")) throw new Error("CardIllustrativeNet: requires a verified VAT-inclusive fee");
  return formatAED(annualGross - card.annualFee.amount);
}
