export type CashOrMilesInput = {
  cashFare: string;
  miles: string;
  awardFees: string;
  target: string;
};

type Field = keyof CashOrMilesInput;
type Verdict = "above-target" | "below-target" | "at-target" | "no-target" | "no-saving" | "negative-saving";

export type CashOrMilesResult = {
  cashSavedFils: number;
  filsPerMile: number;
  breakEvenFareFils: number | null;
  verdict: Verdict;
};

export type CashOrMilesCalculation =
  | { ok: true; result: CashOrMilesResult }
  | { ok: false; errors: Partial<Record<Field, string>> };

// These are input bounds, not travel assumptions. All intermediate integer
// arithmetic stays below Number.MAX_SAFE_INTEGER even at the bounds.
const MAX_PRICE_FILS = 100_000_000;
const MAX_MILES = 10_000_000;
const MAX_TARGET_HUNDREDTH_FILS = 100_000;

function normaliseDigits(value: string): string {
  return value.trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replaceAll("٫", ".").replaceAll("٬", ",");
}

/** Parse decimal input as an integer without converting through binary decimals. */
function parseScaled(value: string, decimals: 0 | 2, max: number): number | null {
  const normalised = normaliseDigits(value);
  const pattern = decimals === 0
    ? /^(?:\d+|\d{1,3}(?:,\d{3})+)$/
    : /^(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?|\.\d{1,2})$/;
  if (!pattern.test(normalised)) return null;
  const [whole, fraction = ""] = normalised.replaceAll(",", "").split(".");
  const scaled = Number(whole || 0) * 10 ** decimals + Number(fraction.padEnd(decimals, "0"));
  return Number.isSafeInteger(scaled) && scaled <= max ? scaled : null;
}

export function calculateCashOrMiles(input: CashOrMilesInput): CashOrMilesCalculation {
  const fare = parseScaled(input.cashFare, 2, MAX_PRICE_FILS);
  const miles = parseScaled(input.miles, 0, MAX_MILES);
  const fees = parseScaled(input.awardFees, 2, MAX_PRICE_FILS);
  const hasTarget = input.target.trim() !== "";
  const target = hasTarget ? parseScaled(input.target, 2, MAX_TARGET_HUNDREDTH_FILS) : null;
  const errors: Partial<Record<Field, string>> = {};
  if (fare === null || fare === 0) errors.cashFare = "Enter a cash fare above zero, in AED (up to AED 1,000,000; two decimal places at most).";
  if (miles === null || miles === 0) errors.miles = "Enter a whole number from 1 to 10,000,000.";
  if (fees === null) errors.awardFees = "Enter the cash due in AED, or 0 if there is none (up to AED 1,000,000; two decimal places at most).";
  if (hasTarget && (target === null || target === 0)) errors.target = "Enter a target above zero, up to 1,000 fils (two decimal places at most), or leave it blank.";
  if (fare === null || fare === 0 || miles === null || miles === 0 || fees === null ||
      (hasTarget && (target === null || target === 0))) return { ok: false, errors };

  const cashSavedFils = fare - fees;
  const targetCostHundredthFils = target === null ? null : miles * target;
  const difference = targetCostHundredthFils === null ? null : cashSavedFils * 100 - targetCostHundredthFils;
  const verdict: Verdict =
    cashSavedFils < 0 ? "negative-saving" :
    cashSavedFils === 0 ? "no-saving" :
    difference === null ? "no-target" :
    difference > 0 ? "above-target" :
    difference < 0 ? "below-target" : "at-target";
  return {
    ok: true,
    result: {
      cashSavedFils,
      filsPerMile: cashSavedFils / miles,
      // Round the minimum cash fare up to a whole fils, not to the nearest
      // fils: a quote one fils below the target must not be shown as meeting it.
      breakEvenFareFils: targetCostHundredthFils === null ? null : fees + Math.ceil(targetCostHundredthFils / 100),
      verdict,
    },
  };
}
