import type { CardData } from "./cardsData";
type EarnCard = Pick<CardData, "earnRates" | "earnUnit" | "_provenance" | "scopedEarnRates"> & { slug?: string };
export type ScopedEarnRate = NonNullable<CardData["scopedEarnRates"]>[number];
const unmodelled = new Map<string, string>([
  ["adcb-365-cashback", "Eligible subscription merchants, direct-payment channels and reduced-category exclusions are not modelled by this all-spend example. Check the current issuer eligibility guide."],
  ["wio-credit", "Cashback depends on your Wio plan, its fee and a cap shared with My Money. The Standard plan earns none."],
  ["liv-cashback", "Your monthly spend tier and credit-limit cap change the cashback. This example cannot calculate both."],
  ["liv-cashback-plus", "Your monthly spend tier and credit-limit cap change the cashback. This example cannot calculate both."],
]);

/** One gate for generic spend models; display-only source rows never become
 * a guessed universal base, a zero return, a conversion or a ranking input. */
export function cardRewardModelIssue(card: EarnCard, slug = card.slug ?? ""): string {
  const issue = unmodelled.get(slug); if (issue) return issue;
  if (card.scopedEarnRates?.length) return "Source-qualified reward rows are display-only; no universal all-spend rate or total return is assumed.";
  const base = card.earnRates.everythingElse;
  if (typeof base !== "number" || !Number.isFinite(base) || base < 0) return "No confirmed universal base earn rate is available.";
  const held = Object.entries(card._provenance ?? {}).filter(([, state]) => state === "needs-review").map(([key]) => key);
  if (held.some(key => /^earnRates\._caps(?:\.|$)/.test(key))) return "The qualifying spend or reward cap needs confirmation.";
  if (held.some(key => key === "earnUnit" || /^earnRates(?:\.|$)/.test(key))) return "The everyday earn rate needs confirmation.";
  return "";
}

export function hasUsableGenericEarnRate<T extends EarnCard>(card: T): card is T & { earnRates: T["earnRates"] & { everythingElse: number } } {
  return cardRewardModelIssue(card) === "";
}

export function formatScopedEarnRate(row: ScopedEarnRate): string {
  if (!Number.isFinite(row.value) || row.value < 0) throw new Error("Invalid source-qualified reward value");
  const number = row.value.toLocaleString("en-GB", { maximumFractionDigits: 8 });
  const unit = row.unit.startsWith("percent ") ? `% ${row.unit.slice("percent ".length)}` : ` ${row.unit}`;
  const denominator = row.denominator
    ? ` per ${row.denominator.currency} ${row.denominator.amount.toLocaleString("en-GB", { maximumFractionDigits: 8 })}` : "";
  return `${row.bound === "upper" ? "Up to " : ""}${number}${unit}${denominator}`;
}
