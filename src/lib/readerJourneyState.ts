import { MAX_CARD_VALUE_MONTHLY_SPEND } from "./cardValue";
import { TRACKER_SALARY_BANDS } from "./salaryTransferTrackerBands";
import type { AdditionalProduct } from "./salaryTransfer";

// URL state is explicit and shareable. No cookies, localStorage,
// sessionStorage or new analytics events; the URL remains in browser history.
// No unrecognised parameter becomes a return destination.
const one = (params: URLSearchParams, key: string) => params.getAll(key).length === 1 ? params.get(key) : null;
export function boundedInteger(value: string | null, max = 1_000_000): number | undefined {
  if (value === null || !/^(?:0|[1-9]\d{0,6})$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= max ? number : undefined;
}
export const boundedSalaryAmount = (value: string | null) => value !== null && /^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(value) && Number(value) <= 1_000_000 ? Number(value) : undefined;

export const CARD_FILTER_OPTIONS = {
  spend: ["general", "dining", "groceries", "travel", "fuel", "online"],
  prefer: ["none", "cashback", "miles", "points", "lounges", "status"],
  network: ["any", "Visa", "Mastercard", "Amex"],
  fee: ["any", "free", "under-500", "under-1000"],
  include_invite_only: ["true", "false"],
  include_legacy: ["true", "false"],
} as const;
export const CARD_FILTER_KEYS = ["salary", "spend", "prefer", "network", "fee", "include_invite_only", "include_legacy"] as const;
export type CardFilterKey = typeof CARD_FILTER_KEYS[number];
export interface CardFinderState {
  salary?: number;
  spend: typeof CARD_FILTER_OPTIONS.spend[number];
  prefer: typeof CARD_FILTER_OPTIONS.prefer[number];
  network: typeof CARD_FILTER_OPTIONS.network[number];
  fee: typeof CARD_FILTER_OPTIONS.fee[number];
  includeInviteOnly: boolean;
  includeLegacy: boolean;
}

export function cardJourneyParams(source: URLSearchParams, knownSlugs?: ReadonlySet<string>): URLSearchParams {
  const out = new URLSearchParams();
  const salary = boundedInteger(one(source, "salary"));
  const spend = boundedInteger(one(source, "cv_spend"), MAX_CARD_VALUE_MONTHLY_SPEND);
  if (salary !== undefined) out.set("salary", String(salary));
  if (spend !== undefined) out.set("cv_spend", String(spend));
  for (const [key, options] of Object.entries(CARD_FILTER_OPTIONS)) {
    const value = one(source, key);
    if (value !== null && (options as readonly string[]).includes(value)) out.set(key, value);
  }
  const selected = source.getAll("cards").flatMap(value => value.split(","))
    .filter(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100 && (!knownSlugs || knownSlugs.has(value)));
  const unique = [...new Set(selected)].slice(0, 4);
  if (unique.length) out.set("cards", unique.join(","));
  if (one(source, "via") === "finder") out.set("via", "finder");
  return out;
}

/** One parser for applied filters, ranking, tokens and navigation context. */
export function cardFinderState(source: URLSearchParams): CardFinderState {
  const state = cardJourneyParams(source);
  return {
    salary: boundedInteger(state.get("salary")),
    spend: (state.get("spend") ?? "general") as CardFinderState["spend"],
    prefer: (state.get("prefer") ?? "none") as CardFinderState["prefer"],
    network: (state.get("network") ?? "any") as CardFinderState["network"],
    fee: (state.get("fee") ?? "any") as CardFinderState["fee"],
    includeInviteOnly: state.get("include_invite_only") === "true",
    includeLegacy: state.get("include_legacy") === "true",
  };
}

export function withoutCardFilter(source: URLSearchParams, key: CardFilterKey, knownSlugs?: ReadonlySet<string>): URLSearchParams {
  const state = cardJourneyParams(source, knownSlugs);
  state.delete(key);
  return state;
}

/** Clear eligibility/reward filters, not a deliberate selection or example. */
export function clearCardFilters(source: URLSearchParams, knownSlugs?: ReadonlySet<string>): URLSearchParams {
  const state = cardJourneyParams(source, knownSlugs);
  for (const key of CARD_FILTER_KEYS) state.delete(key);
  return state;
}

export function cardJourneyHref(href: string, source: URLSearchParams, knownSlugs?: ReadonlySet<string>): string {
  // Accept only the card journey, never protocol-relative or external URLs.
  if (!/^\/cards\/(?:[a-z0-9-]+\/)?(?:\?[^#]*)?(?:#.*)?$/.test(href)) return href;
  const target = new URL(href, "https://dubaipoints.ae");
  const state = cardJourneyParams(source, knownSlugs);
  if (knownSlugs && target.searchParams.has("cards")) {
    const selected = cardJourneyParams(target.searchParams, knownSlugs).get("cards");
    target.searchParams.delete("cards");
    if (selected) target.searchParams.set("cards", selected);
  }
  for (const [key, value] of state) {
    // A comparison's own explicit selection wins over the previous shortlist.
    if (key === "cards" && target.searchParams.has("cards")) continue;
    target.searchParams.set(key, value);
  }
  return target.pathname + (target.search ? target.search : "") + target.hash;
}

const bandSlugs = new Set<string>(TRACKER_SALARY_BANDS.map(band => band.slug));
const salaryProducts: readonly AdditionalProduct[] = ["credit_card", "loan", "auto_finance", "insurance", "savings", "mortgage"];
export interface SalaryJourneyState {
  band?: string;
  cash: boolean;
  noCard: boolean;
  sharia: boolean;
  sort: "value" | "expiry";
  offer?: string;
  returnBand?: string;
  salary?: number;
  products?: AdditionalProduct[];
  stay?: boolean;
}
export function salaryJourneyState(params: URLSearchParams): SalaryJourneyState {
  const band = one(params, "st_band");
  const returnBand = one(params, "st_return");
  const offer = one(params, "st_offer");
  return {
    band: band !== null && bandSlugs.has(band) ? band : undefined,
    cash: one(params, "st_cash") === "true",
    noCard: one(params, "st_no_card") === "true",
    sharia: one(params, "st_sharia") === "true",
    sort: one(params, "st_sort") === "expiry" ? "expiry" : "value",
    offer: offer && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(offer) && offer.length <= 100 ? offer : undefined,
    returnBand: returnBand !== null && bandSlugs.has(returnBand) ? returnBand : undefined,
    salary: boundedSalaryAmount(one(params, "st_salary")),
    products: [...new Set((one(params, "st_products") ?? "").split(","))].filter((value): value is AdditionalProduct => (salaryProducts as readonly string[]).includes(value)),
    stay: one(params, "st_stay") === "false" ? false : one(params, "st_stay") === "true" ? true : undefined,
  };
}
export function salaryJourneyParams(state: SalaryJourneyState): URLSearchParams {
  const out = new URLSearchParams();
  if (state.band && bandSlugs.has(state.band)) out.set("st_band", state.band);
  if (state.returnBand && bandSlugs.has(state.returnBand)) out.set("st_return", state.returnBand);
  if (state.cash) out.set("st_cash", "true");
  if (state.noCard) out.set("st_no_card", "true");
  if (state.sharia) out.set("st_sharia", "true");
  if (state.sort === "expiry") out.set("st_sort", "expiry");
  if (state.offer && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.offer) && state.offer.length <= 100) out.set("st_offer", state.offer);
  if (state.salary !== undefined && boundedSalaryAmount(String(state.salary)) !== undefined) out.set("st_salary", String(state.salary));
  const products = [...new Set(state.products)].filter(value => salaryProducts.includes(value));
  if (products.length) out.set("st_products", products.join(","));
  if (state.stay !== undefined) out.set("st_stay", String(state.stay));
  return out;
}
export function hasSalaryJourney(params: URLSearchParams): boolean {
  // Invalid exact-salary attempts require correction, not a silent default.
  // Unrelated st_* names do not turn a bare calculator into a claimed profile.
  return salaryJourneyParams(salaryJourneyState(params)).size > 0 || params.has("st_salary");
}
export function salaryJourneyHref(href: string, state: SalaryJourneyState): string {
  if (!/^\/salary-transfer\/(?:[a-z0-9-]+\/)?(?:#[a-z0-9-]+)?$/.test(href)) return href;
  const target = new URL(href, "https://dubaipoints.ae");
  target.search = salaryJourneyParams(state).toString();
  return target.pathname + target.search + target.hash;
}
export function salaryJourneyReturnHref(state: SalaryJourneyState): string {
  return salaryJourneyHref(`/salary-transfer/${state.returnBand ? state.returnBand + "/" : ""}`, state);
}
