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

/** Deduct only the fee from a separately stated gross editorial example. */
export function cardIllustrativeNetLabel(card: FeeCard, annualGross: number): string {
  if (!Number.isFinite(annualGross) || annualGross < 0) throw new Error("CardIllustrativeNet: expected a non-negative illustrative annual gross return");
  if (card.vatPolicy !== "inclusive" || cardFeeNeedsReview(card, "annualFee")) throw new Error("CardIllustrativeNet: requires a verified VAT-inclusive fee");
  return formatAED(annualGross - card.annualFee.amount);
}
