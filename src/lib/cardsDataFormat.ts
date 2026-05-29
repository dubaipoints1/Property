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
  | "aed_credit"
  // 2026-05-20 audit additions — mirror REWARD_UNIT in cardsData.ts.
  | "darna_points"
  | "dnata_points"
  | "marriott_bonvoy_points"
  | "noon_credits"
  | "red_points";

export interface StructuredWelcomeBonus {
  amount: number;
  unit: RewardUnit;
  spend_threshold_aed: number | null;
  qualify_window_days: number | null;
  headline_value_aed?: number;
  /** Phase 2a.0 (2026-05-20): ≤90-char publication one-liner. Matcher
   * prefers this over the derived display string when present. */
  headline?: string;
  notes?: string;
}

/** Phase 2a.0 (2026-05-20): structured discontinuation marker.
 * Mirrors `discontinuedForNewApplicants` on the Zod schema in cardsData.ts.
 * `date` must be a YYYY-MM-DD ISO string. */
export interface DiscontinuedForNewApplicants {
  date: string;
  note?: string;
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
  // 2026-05-20 audit additions
  darna_points: "Darna Points",
  dnata_points: "dnata Points",
  marriott_bonvoy_points: "Marriott Bonvoy Points",
  noon_credits: "noon credits",
  red_points: "RED Points",
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

// ── Phase 2a.2: CardComparison helpers ───────────────────────────────────
//
// Pure helpers consumed by `src/components/cards/CardComparison.astro`
// and tested in `tests/cards/card-comparison.test.ts`. Live here (not
// in `cardsData.ts`) so the test runner doesn't have to resolve the
// `astro:content` virtual module — same separation rationale as
// `welcomeBonusDisplay` above.

/** Known issuer-name prefixes the comparison header strips so the
 * card name reads as "Skywards Infinite" rather than "Emirates NBD
 * Skywards Infinite" in the cramped header row. Order matters: longest
 * prefix first so "Emirates NBD" matches before "Emirates" would.
 * Each entry is a `[prefix, acronym]` pair — the acronym is rendered
 * as the small eyebrow above the short card name. */
const BANK_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ["Emirates NBD ", "ENBD"],
  ["Standard Chartered ", "SC"],
  ["First Abu Dhabi Bank ", "FAB"],
  ["Commercial Bank of Dubai ", "CBD"],
  ["Dubai Islamic Bank ", "DIB"],
  ["Abu Dhabi Islamic Bank ", "ADIB"],
  ["Abu Dhabi Commercial Bank ", "ADCB"],
  ["Mashreq ", "Mashreq"],
  ["RAKBANK ", "RAKBANK"],
  ["HSBC ", "HSBC"],
  ["Citibank ", "Citi"],
  ["Citi ", "Citi"],
  ["FAB ", "FAB"],
  ["ADCB ", "ADCB"],
  ["CBD ", "CBD"],
  ["DIB ", "DIB"],
  ["ENBD ", "ENBD"],
];

export interface ShortCardLabel {
  /** Card name with the known issuer prefix stripped. */
  shortName: string;
  /** Uppercase issuer acronym ("ENBD", "FAB", "ADCB", "Mashreq", …).
   * Empty string when no known prefix matched — caller decides whether
   * to render the eyebrow row in that case. */
  acronym: string;
}

/** Strip a known bank-name prefix from `card.name` so the comparison
 * header reads as the card-only label ("Skywards Infinite") with the
 * bank as a separate eyebrow ("ENBD"). When the name doesn't carry a
 * recognised prefix, returns the full name and an empty acronym. */
export function shortCardLabel(card: { name: string }): ShortCardLabel {
  const name = card.name;
  for (const [prefix, acronym] of BANK_PREFIXES) {
    if (name.startsWith(prefix)) {
      return { shortName: name.slice(prefix.length), acronym };
    }
  }
  return { shortName: name, acronym: "" };
}

// ── Comparison row spec ──────────────────────────────────────────────────

/** Canonical "what's the headline earn rate" label map — used by
 * EarnRateTable.is-top, CardComparison, and AtAGlance. Keep one
 * implementation. */
export const CATEGORY_LABELS_FOR_TOP: Record<string, string> = {
  dining: "Dining",
  groceries: "Groceries",
  shopping: "Shopping",
  travel: "Travel",
  fuel: "Fuel",
  entertainment: "Entertainment",
  online: "Online",
  international: "International",
  everythingElse: "Everything",
  partnerBrands: "Partner",
};

const AED_INT_FMT = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});
const AED_DEC_FMT = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 2,
});

/** Canonical AED formatter — integer-precision when the amount has no
 * fractional part (annual fees: "AED 1,575"), 2dp when it does
 * (joining fees: "AED 3,148.95"). Lifted from FeeBlock so AtAGlance,
 * CardComparison and any future card surface format identically. */
export function formatAED(amount: number): string {
  return Number.isInteger(amount) ? AED_INT_FMT.format(amount) : AED_DEC_FMT.format(amount);
}

/** Minimal shape of a card object needed by `cardComparisonRows`.
 * Kept structural so tests don't need to import the full CardData. */
export interface CardForComparison {
  name: string;
  annualFee: { amount: number };
  joiningFee?: { amount: number } | null;
  eligibility: { minSalary: number; invitationOnly?: boolean };
  earnRates: Record<string, number | unknown | undefined>;
  /** L2 earnUnit + categories — drive whether the top-earn comparison row
   * renders "5%" (cashback) or "5×" (points). §6 unit-integrity. */
  earnUnit?: string | null;
  categories?: readonly string[];
  welcomeBonus?:
    | StructuredWelcomeBonus
    | StructuredWelcomeBonusBifurcated
    | string
    | null;
  _features?: ReadonlyArray<Record<string, unknown>>;
}

export type ComparisonWinner = "left" | "right" | "tie" | "none";

export interface ComparisonRow {
  /** Row key — stable for test snapshots. */
  key:
    | "annualFee"
    | "joiningFee"
    | "minSalary"
    | "topEarn"
    | "welcome"
    | "lounge";
  /** Full label (desktop). */
  label: string;
  /** Short label for <720px rendering. Falls through to `label` when
   * the desktop and mobile labels are identical. */
  mobileLabel?: string;
  /** Optional subtext shown beneath the label on mobile only. */
  subtext?: string;
  /** Display string per side. */
  leftValue: string;
  rightValue: string;
  /** Which side wins this row. `"none"` for rows that deliberately
   * carry no winner highlight (welcome bonus). `"tie"` when both
   * sides match on the dimension that drives the winner rule. */
  winner: ComparisonWinner;
}

// ── Per-row data extraction ──────────────────────────────────────────────

// Fixed category-iteration order — mirrors EarnRateTable's CATEGORY_LABELS
// so the "winning" category on a tie is deterministic across (a) the
// component reading Zod-parsed data and (b) tests reading raw JSON.
// Without this, a card with dining 2× and travel 2× would surface
// "Dining 2×" when read via Zod and "Travel 2×" when read from JSON
// in different key order — same outcome, different label.
const TOP_EARN_ITERATION_ORDER = [
  "dining",
  "groceries",
  "shopping",
  "travel",
  "fuel",
  "entertainment",
  "online",
  "international",
  "partnerBrands",
];

/** Canonical "what's the headline earn rate" source — used by
 * EarnRateTable.is-top, CardComparison, and AtAGlance. Keep one
 * implementation. Iterates a fixed key order so ties resolve
 * deterministically across Zod-parsed data and raw JSON. */
export function topEarnEntry(earnRates: Record<string, unknown>):
  | { key: string; label: string; value: number }
  | null {
  let best: { key: string; label: string; value: number } | null = null;
  for (const key of TOP_EARN_ITERATION_ORDER) {
    if (!(key in earnRates)) continue;
    const val = earnRates[key];
    if (typeof val !== "number") continue;
    if (!best || val > best.value) {
      best = {
        key,
        label: CATEGORY_LABELS_FOR_TOP[key] ?? key,
        value: val,
      };
    }
  }
  return best;
}

// ── Earn-value unit suffix (§6 numeric-integrity fix, 2026-05-29) ─────────
//
// Earn rates are stored as a bare number in `earnRates`. For points cards
// the number is a points-per-AED multiplier → renders "2×". For cashback
// cards the same field holds a percentage → must render "5%", not "5×".
// Before this helper every renderer hard-coded "{value}×", so a 5%-cashback
// card read "5×" site-wide (caught at the PR #180 Chairman gate).
//
// The signal is `earnUnit`: a unit that STARTS with "%" (e.g. "% cashback",
// "% as ENBD Plus Points") or contains "cashback" is a percentage; one
// containing "per AED" / "per USD" / "points" / "miles" / "multiplier" is a
// points multiplier. When earnUnit is absent we fall back to the cashback
// category.
//
// "Starts with %", not "contains %": points cards carry parenthetical notes
// like "Skywards Miles per USD 1 spent (EU/UK at 50%)" — the "50%" there is a
// rate note, not the earn unit. A bare `includes("%")` mis-flagged every such
// card as cashback (caught in QA: Skywards Infinite rendered "2%" not "2×").
// Check the %/cashback branch FIRST — "% as ENBD Plus Points" contains both
// "%" and "points" and must resolve to percentage.

/** True when a card's earn values are percentages rather than
 * points-per-AED multipliers. */
export function earnIsPercentage(
  earnUnit?: string | null,
  categories?: readonly string[],
): boolean {
  const u = (earnUnit ?? "").trim().toLowerCase();
  if (u.startsWith("%") || u.includes("cashback")) return true;
  if (
    u.includes("per aed") ||
    u.includes("per usd") ||
    u.includes("multiplier") ||
    u.includes("points") ||
    u.includes("miles")
  ) {
    return false;
  }
  return (categories ?? []).some((c) => c.toLowerCase() === "cashback");
}

/** Format a single earn value with the correct unit suffix —
 * "5%" for cashback / %-denominated schemes, "2×" for points multipliers. */
export function formatEarnValue(
  value: number,
  earnUnit?: string | null,
  categories?: readonly string[],
): string {
  return earnIsPercentage(earnUnit, categories) ? `${value}%` : `${value}×`;
}

interface LoungeFeature {
  type: "lounge_access";
  network: string;
  scope: "unlimited" | { visits_per_year: number };
}

function loungeFeatureOf(card: CardForComparison): LoungeFeature | null {
  const features = card._features ?? [];
  for (const f of features) {
    if ((f as { type?: string }).type === "lounge_access") {
      return f as unknown as LoungeFeature;
    }
  }
  return null;
}

function loungeDisplay(f: LoungeFeature | null): string {
  if (!f) return "None";
  if (f.scope === "unlimited") return `${f.network} — unlimited`;
  if (typeof f.scope === "object" && "visits_per_year" in f.scope) {
    return `${f.network} — ${f.scope.visits_per_year} visits/yr`;
  }
  return f.network;
}

function loungeScore(f: LoungeFeature | null): number {
  if (!f) return 0;
  if (f.scope === "unlimited") return Number.POSITIVE_INFINITY;
  if (typeof f.scope === "object" && "visits_per_year" in f.scope) {
    return f.scope.visits_per_year;
  }
  return 1;
}

function welcomeHeadlineFor(card: CardForComparison): string {
  const wb = card.welcomeBonus;
  if (!wb) return "—";
  if (typeof wb === "string") return wb;
  if (isStructuredWelcomeBonus(wb)) {
    return wb.headline ?? welcomeBonusDisplay(wb);
  }
  if (isBifurcatedWelcomeBonus(wb)) {
    return welcomeBonusDisplay(wb);
  }
  return "—";
}

/** Pick a winner where lower is better (fees, minimum salary). */
function lowerWins(a: number | null, b: number | null): ComparisonWinner {
  if (a === null && b === null) return "none";
  if (a === null) return "right";
  if (b === null) return "left";
  if (a === b) return "tie";
  return a < b ? "left" : "right";
}

/** Pick a winner where higher is better (earn rate, lounge generosity). */
function higherWins(a: number, b: number): ComparisonWinner {
  if (a === b) return "tie";
  return a > b ? "left" : "right";
}

/** Build the canonical 6-row comparison spec for two cards. Pure: the
 * Astro component does no number-crunching beyond rendering this. */
export function cardComparisonRows(
  left: CardForComparison,
  right: CardForComparison,
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // 1. Annual fee (year 2+)
  {
    const lFee = left.annualFee.amount;
    const rFee = right.annualFee.amount;
    rows.push({
      key: "annualFee",
      label: "Annual fee (year 2+)",
      mobileLabel: "Annual fee",
      subtext: "year 2+",
      leftValue: lFee === 0 ? "Free" : formatAED(lFee),
      rightValue: rFee === 0 ? "Free" : formatAED(rFee),
      winner: lowerWins(lFee, rFee),
    });
  }

  // 2. Joining fee (year 1)
  {
    const lJoin = left.joiningFee?.amount ?? null;
    const rJoin = right.joiningFee?.amount ?? null;
    rows.push({
      key: "joiningFee",
      label: "Joining fee (year 1)",
      mobileLabel: "Joining fee",
      subtext: "year 1",
      leftValue: lJoin === null ? "—" : formatAED(lJoin),
      rightValue: rJoin === null ? "—" : formatAED(rJoin),
      winner: lowerWins(lJoin, rJoin),
    });
  }

  // 3. Minimum salary
  {
    const lInvite = left.eligibility.invitationOnly === true;
    const rInvite = right.eligibility.invitationOnly === true;
    const lSalary = lInvite ? null : left.eligibility.minSalary;
    const rSalary = rInvite ? null : right.eligibility.minSalary;
    rows.push({
      key: "minSalary",
      label: "Minimum salary",
      mobileLabel: "Min salary",
      leftValue: lInvite ? "Invitation only" : `${formatAED(lSalary ?? 0)}/mo`,
      rightValue: rInvite ? "Invitation only" : `${formatAED(rSalary ?? 0)}/mo`,
      winner: lowerWins(lSalary, rSalary),
    });
  }

  // 4. Top earn rate (single highest non-base category)
  {
    const lTop = topEarnEntry(left.earnRates as Record<string, unknown>);
    const rTop = topEarnEntry(right.earnRates as Record<string, unknown>);
    const lValue = lTop
      ? `${lTop.label} ${formatEarnValue(lTop.value, left.earnUnit, left.categories)}`
      : "—";
    const rValue = rTop
      ? `${rTop.label} ${formatEarnValue(rTop.value, right.earnUnit, right.categories)}`
      : "—";
    let winner: ComparisonWinner;
    if (!lTop && !rTop) winner = "none";
    else if (!lTop) winner = "right";
    else if (!rTop) winner = "left";
    else winner = higherWins(lTop.value, rTop.value);
    rows.push({
      key: "topEarn",
      label: "Top earn rate",
      leftValue: lValue,
      rightValue: rValue,
      winner,
    });
  }

  // 5. Welcome bonus — never highlighted (temporal + bundled)
  {
    rows.push({
      key: "welcome",
      label: "Welcome bonus",
      leftValue: welcomeHeadlineFor(left),
      rightValue: welcomeHeadlineFor(right),
      winner: "none",
    });
  }

  // 6. Lounge access
  {
    const lF = loungeFeatureOf(left);
    const rF = loungeFeatureOf(right);
    rows.push({
      key: "lounge",
      label: "Lounge access",
      leftValue: loungeDisplay(lF),
      rightValue: loungeDisplay(rF),
      winner: !lF && !rF ? "none" : higherWins(loungeScore(lF), loungeScore(rF)),
    });
  }

  return rows;
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
