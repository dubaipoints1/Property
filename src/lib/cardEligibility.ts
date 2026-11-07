import { cardFeeNeedsReview } from "./cardFeeProvenance";

type SalaryCard = {
  eligibility: { minSalary: number | null; invitationOnly?: boolean; salaryTransferRequired?: boolean | null; residencyRequired?: boolean | null; employmentTypes?: string[] };
  _provenance?: Record<string, string> | null;
};

export function eligibilityFieldPending(provenance: Record<string, string> | null | undefined, field: string): boolean {
  return provenance?.eligibility === "needs-review" || provenance?.[`eligibility.${field}`] === "needs-review";
}

/** A pending parent group withholds ALL its qualifiers, not only salary.
 * Individual holds withhold only that field; known sibling fields may remain. */
export function eligibilityQualifiers(eligibility: {
  invitationOnly?: boolean; salaryTransferRequired: boolean | null; residencyRequired: boolean | null; employmentTypes?: string[];
}, provenance?: Record<string, string> | null): string[] {
  if (provenance?.eligibility === "needs-review") return [];
  const out: string[] = [];
  if (!eligibilityFieldPending(provenance, "invitationOnly") && eligibility.invitationOnly) out.push("Invitation only");
  if (!eligibilityFieldPending(provenance, "salaryTransferRequired") && eligibility.salaryTransferRequired) out.push("Salary transfer required");
  if (!eligibilityFieldPending(provenance, "residencyRequired") && eligibility.residencyRequired) out.push("UAE residents");
  if (eligibility.salaryTransferRequired === null || provenance?.["eligibility.salaryTransferRequired"] === "needs-review") out.push("Salary-transfer conditions pending");
  if (eligibility.residencyRequired === null || provenance?.["eligibility.residencyRequired"] === "needs-review") out.push("Residency conditions pending");
  const employmentLabels: Record<string, string> = { salaried: "Salaried", "self-employed": "Self-employed", "business-owner": "Business owner" };
  if (!eligibilityFieldPending(provenance, "employmentTypes")) {
    for (const type of eligibility.employmentTypes ?? []) if (type !== "any") out.push(employmentLabels[type] ?? type);
  }
  if (!eligibility.employmentTypes?.length || provenance?.["eligibility.employmentTypes"] === "needs-review") out.push("Employment conditions pending");
  return out;
}

/** Unknown is distinct from an explicitly published zero minimum. */
export function cardSalaryPending(card: SalaryCard): boolean {
  return card.eligibility.minSalary === null || !Number.isFinite(card.eligibility.minSalary)
    || card._provenance?.eligibility === "needs-review"
    || card._provenance?.["eligibility.minSalary"] === "needs-review";
}

/** Shared display never lets an invitation/qualifier override a pending parent. */
export function cardSalaryLabel(card: SalaryCard, options: { perMonth?: boolean; amountOnly?: boolean; pendingLabel?: string } = {}): string {
  const pendingLabel = options.pendingLabel ?? "Pending";
  if (card._provenance?.eligibility === "needs-review" || card._provenance?.["eligibility.invitationOnly"] === "needs-review") return pendingLabel;
  if (card.eligibility.invitationOnly === true) return "Invitation only";
  if (cardSalaryPending(card) || card.eligibility.minSalary === null) return pendingLabel;
  if (card.eligibility.minSalary === 0) return "No minimum";
  const amount = options.amountOnly ? card.eligibility.minSalary.toLocaleString("en-GB")
    : new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(card.eligibility.minSalary);
  return `${amount}${options.perMonth ? "/mo" : ""}`;
}

/** Numeric salary tiers/recommendations must never coerce null to zero. */
export function hasUsableSalaryMinimum<T extends SalaryCard>(card: T): card is T & { eligibility: T["eligibility"] & { minSalary: number } } {
  return !cardSalaryPending(card) && card.eligibility.invitationOnly !== true
    && card.eligibility.salaryTransferRequired !== null && card.eligibility.residencyRequired !== null
    && (card.eligibility.employmentTypes === undefined || card.eligibility.employmentTypes.length > 0)
    && !Object.entries(card._provenance ?? {}).some(([key, state]) => state === "needs-review" && key.startsWith("eligibility."));
}

export function cardHasUnresolvedTerms(card: SalaryCard & { annualFee?: { amount: number }; _dataIssues?: Record<string, string>; earnRates?: { everythingElse: number | null }; scopedEarnRates?: readonly unknown[]; applicationAvailability?: "unconfirmed" }): boolean {
  return (card.annualFee !== undefined && cardFeeNeedsReview({ annualFee: card.annualFee, _provenance: card._provenance }, "annualFee"))
    || cardSalaryPending(card) || card.earnRates?.everythingElse === null || !!card.scopedEarnRates?.length || Object.keys(card._dataIssues ?? {}).length > 0
    || card.eligibility.salaryTransferRequired === null || card.eligibility.residencyRequired === null
    || card.eligibility.employmentTypes?.length === 0 || card.applicationAvailability === "unconfirmed"
    || Object.entries(card._provenance ?? {}).some(([field, state]) => state === "needs-review"
      && (/^(?:annualFee|annualFeeWaiver|joiningFee|eligibility|earnRates|earnUnit|interestRate|welcomeBonus|_features|perks|cashAdvanceFee|minPayment|applicationAvailability)(?:\.|$)/.test(field)
        || /^fxFee(?:$|[A-Z.])/.test(field)));
}
