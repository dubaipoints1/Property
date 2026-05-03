export type RewardType = "cash" | "voucher" | "cashback_monthly" | "points";

export type AdditionalProduct =
  | "loan"
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
  monthlyCardSpend: number;
  willStay12Months: boolean;
  willingProducts: AdditionalProduct[];
  shariaOnly: boolean;
  cashOnly: boolean;
}

export type OfferStatus = "eligible" | "warning" | "disqualified";

export interface ScoredOffer {
  offer: SalaryTransferOffer;
  status: OfferStatus;
  matchedBand: SalaryBand | null;
  rawRewardAED: number;
  cashEquivalentAED: number;
  breakdown: { label: string; amount: number; requires?: string }[];
  reasons: string[];
}

const POINT_TO_AED = 0.04;
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
      return {
        rawRewardAED: raw,
        cashEquivalentAED: raw * POINT_TO_AED,
      };
  }
}

export function scoreOffer(
  offer: SalaryTransferOffer,
  input: CalculatorInput,
): ScoredOffer {
  const reasons: string[] = [];
  let status: OfferStatus = "eligible";

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

  if (offer.creditCardRequired && input.monthlyCardSpend === 0) {
    if (status !== "disqualified") status = "warning";
    reasons.push(
      "Offer requires a credit card; you indicated AED 0 monthly spend.",
    );
  }

  const { rawRewardAED, cashEquivalentAED } = bandToCashEquivalentAED(
    band,
    offer.tenureMonths,
  );

  const breakdown =
    band.components && band.components.length > 0
      ? band.components.map((c) => ({
          label: c.label,
          amount: c.amount,
          requires: c.requires,
        }))
      : [
          {
            label: rewardTypeLabel(band.rewardType),
            amount: band.rewardAmount,
          },
        ];

  return {
    offer,
    status,
    matchedBand: band,
    rawRewardAED,
    cashEquivalentAED: status === "disqualified" ? 0 : cashEquivalentAED,
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
      const aDQ = a.status === "disqualified" ? 1 : 0;
      const bDQ = b.status === "disqualified" ? 1 : 0;
      if (aDQ !== bDQ) return aDQ - bDQ;
      return b.cashEquivalentAED - a.cashEquivalentAED;
    });
}

function rewardTypeLabel(t: RewardType): string {
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
