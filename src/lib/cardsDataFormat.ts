// Pure formatting helpers for the card data layer.
//
// Lives separately from cardsData.ts so it can be unit-tested without
// pulling in `astro:content` (which is a virtual module unavailable to
// node:test running under tsx).

export type RewardUnit =
  | "skywards_miles"
  | "etihad_guest_miles"
  | "qatar_avios"
  | "saudia_alfursan"
  | "share_points"
  | "lulu_points"
  | "upoints"
  | "fab_rewards"
  | "enbd_plus_points"
  | "enbd_smiles"
  | "adcb_touchpoints"
  | "mashreq_salaam"
  | "aed_cashback"
  | "aed_voucher"
  | "aed_credit";

export interface StructuredWelcomeBonus {
  amount: number;
  unit: RewardUnit;
  spend_threshold_aed: number | null;
  qualify_window_days: number | null;
  headline_value_aed?: number;
  notes?: string;
}

/** Bifurcated welcome bonus — different bonuses for cards that pay
 * differently with vs without salary transfer. Schema requires at least
 * one branch be set. */
export interface StructuredWelcomeBonusBifurcated {
  with_salary_transfer?: StructuredWelcomeBonus;
  without_salary_transfer?: StructuredWelcomeBonus;
}

export interface StructuredAnnualFeeWaiver {
  year_one_waived: boolean;
  ongoing_threshold_aed: number | null;
  threshold_period: "annual" | "monthly";
  notes?: string;
}

const REWARD_UNIT_LABELS: Record<RewardUnit, string> = {
  skywards_miles: "Skywards Miles",
  etihad_guest_miles: "Etihad Guest Miles",
  qatar_avios: "Qatar Avios",
  saudia_alfursan: "Saudia Alfursan Miles",
  share_points: "SHARE Points",
  lulu_points: "LuLu Points",
  upoints: "UPoints",
  fab_rewards: "FAB Rewards",
  enbd_plus_points: "ENBD Plus Points",
  enbd_smiles: "ENBD Smiles",
  adcb_touchpoints: "ADCB TouchPoints",
  mashreq_salaam: "Mashreq Salaam",
  aed_cashback: "AED cashback",
  aed_voucher: "AED voucher",
  aed_credit: "AED statement credit",
};

export function isStructuredWelcomeBonus(
  v: unknown,
): v is StructuredWelcomeBonus {
  return typeof v === "object" && v !== null && "amount" in v && "unit" in v;
}

export function isBifurcatedWelcomeBonus(
  v: unknown,
): v is StructuredWelcomeBonusBifurcated {
  return (
    typeof v === "object" &&
    v !== null &&
    !("amount" in v) &&
    ("with_salary_transfer" in v || "without_salary_transfer" in v)
  );
}

export function isStructuredAnnualFeeWaiver(
  v: unknown,
): v is StructuredAnnualFeeWaiver {
  return typeof v === "object" && v !== null && "year_one_waived" in v;
}

function singleWelcomeBonusDisplay(v: StructuredWelcomeBonus): string {
  const amount = v.amount.toLocaleString();
  const unit = REWARD_UNIT_LABELS[v.unit] ?? v.unit;
  let s = `${amount} ${unit}`;
  if (v.spend_threshold_aed && v.qualify_window_days) {
    s += ` · spend AED ${v.spend_threshold_aed.toLocaleString()} in ${v.qualify_window_days} days`;
  } else if (v.spend_threshold_aed) {
    s += ` · spend AED ${v.spend_threshold_aed.toLocaleString()}`;
  }
  if (v.notes) s += ` · ${v.notes}`;
  return s;
}

export function welcomeBonusDisplay(
  v:
    | StructuredWelcomeBonus
    | StructuredWelcomeBonusBifurcated
    | string
    | null
    | undefined,
): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (isStructuredWelcomeBonus(v)) {
    return singleWelcomeBonusDisplay(v);
  }
  if (isBifurcatedWelcomeBonus(v)) {
    // Render with-salary-transfer first if present (the headline path);
    // fall through to without if that's the only branch set.
    const primary = v.with_salary_transfer ?? v.without_salary_transfer;
    const isWith = v.with_salary_transfer !== undefined;
    if (!primary) return "";
    const tag = isWith ? "with salary transfer" : "without salary transfer";
    return `${singleWelcomeBonusDisplay(primary)} · ${tag}`;
  }
  return "";
}

export function annualFeeWaiverDisplay(
  v: StructuredAnnualFeeWaiver | string | null | undefined,
): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  const parts: string[] = [];
  if (v.year_one_waived) parts.push("year-one waived");
  if (v.ongoing_threshold_aed !== null && v.ongoing_threshold_aed !== undefined) {
    const period = v.threshold_period === "monthly" ? "monthly" : "annual";
    parts.push(
      `AED ${v.ongoing_threshold_aed.toLocaleString()} ${period} spend ongoing`,
    );
  }
  let s = parts.join(", ");
  if (s.length > 0) s = s.charAt(0).toUpperCase() + s.slice(1);
  if (v.notes) s += s ? ` (${v.notes})` : v.notes;
  return s;
}
