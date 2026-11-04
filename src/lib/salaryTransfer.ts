import { accountOnlyTrackerTiers } from "./salaryTransferTrackerBands";
import { getSalaryOfferRules, hasSalaryOfferRule } from "./salaryTransferRules";

export type RewardType = "cash" | "voucher" | "cashback_monthly" | "points";

export type AdditionalProduct =
  | "loan"
  | "auto_finance"
  | "insurance"
  | "savings"
  | "mortgage"
  | "credit_card"
  | "other";

export interface SalaryBand {
  minSalary: number;
  maxSalary: number | null;
  rewardAmount: number;
  rewardType: RewardType;
  voucherRetailer?: string;
  monthsToPayout: number;
  components?: { label: string; amount: number; requires?: string }[];
}

export interface SalaryTransferOffer {
  id: string;
  bankSlug: string;
  bankName: string;
  name: string;
  validFrom: string;
  validUntil: string;
  tenureMonths: number;
  sharia: boolean;
  creditCardRequired: boolean;
  additionalProductsRequired: AdditionalProduct[];
  salaryBands: SalaryBand[];
  requirements: string[];
  clawbackTerms: string;
  sourceUrl: string;
  lastVerified: string;
}

export interface CalculatorInput {
  monthlySalary: number;
  monthlyCardSpend?: number;
  willStay12Months: boolean;
  willingProducts: AdditionalProduct[];
  shariaOnly: boolean;
  cashOnly: boolean;
}

export type OfferStatus = "eligible" | "warning" | "conditional" | "disqualified";

export interface ScoredOffer {
  offer: SalaryTransferOffer;
  status: OfferStatus;
  matchedBand: SalaryBand | null;
  rawRewardAED: number;
  cashEquivalentAED: number;
  breakdown: { label: string; amount: number; requires?: string }[];
  reasons: string[];
}

const VOUCHER_DISCOUNT = 0.2;

export function findBand(
  bands: SalaryBand[],
  monthlySalary: number,
): SalaryBand | null {
  return (
    bands.find(
      (b) =>
        monthlySalary >= b.minSalary &&
        (b.maxSalary === null || monthlySalary <= b.maxSalary),
    ) ?? null
  );
}

export function bandToCashEquivalentAED(
  band: SalaryBand,
  tenureMonths: number,
): { rawRewardAED: number; cashEquivalentAED: number } {
  const raw = band.rewardAmount;
  switch (band.rewardType) {
    case "cash":
      return { rawRewardAED: raw, cashEquivalentAED: raw };
    case "voucher":
      return {
        rawRewardAED: raw,
        cashEquivalentAED: raw * (1 - VOUCHER_DISCOUNT),
      };
    case "cashback_monthly": {
      const total = raw * tenureMonths;
      return { rawRewardAED: total, cashEquivalentAED: total };
    }
    case "points":
      // The offer schema does not identify the points currency. Never
      // assume generic points are Skywards Miles or present them as AED.
      return { rawRewardAED: 0, cashEquivalentAED: 0 };
  }
}

export function scoreOffer(
  offer: SalaryTransferOffer,
  input: CalculatorInput,
): ScoredOffer {
  const reasons: string[] = [];
  let status: OfferStatus = "eligible";
  let confirmationNeeded = false;
  const requireConfirmation = (reason: string) => {
    confirmationNeeded = true;
    reasons.push(reason);
  };

  const band = findBand(offer.salaryBands, input.monthlySalary);

  if (!band) {
    return {
      offer,
      status: "disqualified",
      matchedBand: null,
      rawRewardAED: 0,
      cashEquivalentAED: 0,
      breakdown: [],
      reasons: [
        `Salary AED ${input.monthlySalary.toLocaleString()} is outside this offer's bands (${formatBandRange(offer.salaryBands)}).`,
      ],
    };
  }

  if (input.shariaOnly && !offer.sharia) {
    status = "disqualified";
    reasons.push("Filtered out: not Sharia-compliant.");
  }

  if (input.cashOnly && band.rewardType !== "cash") {
    status = "disqualified";
    reasons.push(
      `Filtered out: reward type is ${band.rewardType.replace("_", " ")}, not cash.`,
    );
  }

  const missingProducts = offer.additionalProductsRequired.filter(
    (p) => !input.willingProducts.includes(p),
  );
  if (missingProducts.length > 0) {
    status = "disqualified";
    reasons.push(
      `Requires additional product(s) you didn't accept: ${missingProducts.join(", ")}.`,
    );
  }

  if (!input.willStay12Months && offer.tenureMonths >= 6) {
    if (status !== "disqualified") status = "warning";
    reasons.push(
      `Clawback risk: offer requires ${offer.tenureMonths} months of salary transfer.`,
    );
  }

  const rule = getSalaryOfferRules(offer);
  if (!rule && hasSalaryOfferRule(offer.id)) {
    requireConfirmation("The campaign source has changed. Verify the current conditions with the bank.");
  }
  const willing = input.willingProducts;
  if (rule?.financeAlternative) {
    if (willing.includes("credit_card") || willing.includes("loan") || willing.includes("auto_finance")) {
      requireConfirmation("Confirm an eligible covered card or qualifying personal or auto finance with DIB. Willingness alone does not qualify.");
    } else if (willing.includes("mortgage")) {
      requireConfirmation("DIB includes home finance in its facility definition. Confirm with the bank whether your specific facility qualifies for the salary bonus.");
    } else {
      status = "disqualified";
      reasons.push("This offer requires an eligible covered card or qualifying personal or auto finance. None is selected.");
    }
  } else if (offer.creditCardRequired) {
    if (!willing.includes("credit_card")) {
      status = "disqualified";
      reasons.push("A qualifying credit card is required and was not selected.");
    } else {
      requireConfirmation("Confirm the required card, application and spending conditions with the bank.");
    }
  }
  if (rule?.needsConfirmation) requireConfirmation(rule.needsConfirmation);
  if (rule?.confirmHighestTier && band.maxSalary === null) requireConfirmation(rule.confirmHighestTier);
  if (band.rewardType === "points") requireConfirmation("Points currency is not identified; no AED value is estimated.");

  let pricedBand = band;
  if (rule?.accountRewardComponent) {
    const account = accountOnlyTrackerTiers([band], rule.accountRewardComponent)[0];
    if (account) {
      pricedBand = account;
      reasons.push("Salary-account reward only. The optional Covered Card reward is not included because qualifying spend within the bank’s deadline is not verified.");
    } else {
      requireConfirmation("The account-only reward cannot be separated from the card reward.");
    }
  } else if (band.components?.some((component) => component.requires)) {
    const base = band.components.filter((component) => !component.requires);
    const total = base.reduce((sum, component) => sum + component.amount, 0);
    if (band.rewardType === "cash" && total > 0 && total <= band.rewardAmount) {
      pricedBand = { ...band, rewardAmount: total, components: base };
      reasons.push("Conditional extras are not included. Check the bank’s terms for those rewards.");
    } else {
      requireConfirmation("The reward includes conditions this calculator cannot verify.");
    }
  }
  const { rawRewardAED, cashEquivalentAED } = bandToCashEquivalentAED(
    pricedBand,
    offer.tenureMonths,
  );
  if (confirmationNeeded && status !== "disqualified") status = "conditional";
  const priced = status !== "disqualified" && !confirmationNeeded;

  const breakdown =
    !priced ? [] : pricedBand.components && pricedBand.components.length > 0
      ? pricedBand.components.map((c) => ({
          label: c.label,
          amount: c.amount,
          requires: c.requires,
        }))
      : [
          {
            label: rewardTypeLabel(pricedBand.rewardType),
            amount: pricedBand.rewardAmount,
          },
        ];

  return {
    offer,
    status,
    matchedBand: band,
    rawRewardAED: priced ? rawRewardAED : 0,
    cashEquivalentAED: priced ? cashEquivalentAED : 0,
    breakdown,
    reasons,
  };
}

export function rankOffers(
  offers: SalaryTransferOffer[],
  input: CalculatorInput,
): ScoredOffer[] {
  return offers
    .map((o) => scoreOffer(o, input))
    .sort((a, b) => {
      const order: Record<OfferStatus, number> = { eligible: 0, warning: 1, conditional: 2, disqualified: 3 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return b.cashEquivalentAED - a.cashEquivalentAED;
    });
}

export function rewardTypeLabel(t: RewardType): string {
  switch (t) {
    case "cash":
      return "Cash bonus";
    case "voucher":
      return "Voucher";
    case "cashback_monthly":
      return "Monthly cashback";
    case "points":
      return "Points / miles";
  }
}

function formatBandRange(bands: SalaryBand[]): string {
  if (bands.length === 0) return "no bands";
  const min = Math.min(...bands.map((b) => b.minSalary));
  const max = bands.some((b) => b.maxSalary === null)
    ? "no upper limit"
    : `AED ${Math.max(...bands.map((b) => b.maxSalary as number)).toLocaleString()}`;
  return `min AED ${min.toLocaleString()} → ${max}`;
}

export const formatAED = (n: number) =>
  `AED ${Math.round(n).toLocaleString("en-AE")}`;

export const daysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

/**
 * The offer title with its bank prefix removed.
 *
 * Every `salaryTransferOffers` entry names itself "<Bank> — <offer>",
 * and the calculator renders the bank name beside it from `bankName`.
 * The result read "First Abu Dhabi Bank — First Abu Dhabi Bank — 20%
 * Salary Transfer Campaign 2026" (2026-09-06 audit, F-038).
 *
 * Only an exact bank-name prefix followed by a dash is stripped, so an
 * offer whose name happens to start with a similar word keeps it, and an
 * entry that does not use the convention is returned untouched.
 */
export function offerTitle(bankName: string, name: string): string {
  if (name.slice(0, bankName.length).toLowerCase() !== bankName.toLowerCase()) {
    return name;
  }
  // The separator is required, so "Citi" does not turn "Citibank — Ready
  // Credit" into "bank — Ready Credit".
  const after = name.slice(bankName.length);
  const separator = /^\s*[—–-]\s*/.exec(after);
  if (!separator) return name;
  const rest = after.slice(separator[0].length);
  return rest.length > 0 ? rest : name;
}
