import { cardJourneyParams } from "./readerJourneyState";

export const MAX_CARD_SELECTION = 4;

export function readCardSelection(source: URLSearchParams, known: ReadonlySet<string>): string[] {
  return cardJourneyParams(source, known).get("cards")?.split(",") ?? [];
}

export function normaliseCardSelection(selection: readonly string[], known: ReadonlySet<string>): string[] {
  return [...new Set(selection)].filter(slug => known.has(slug)).slice(0, MAX_CARD_SELECTION);
}

export function updateCardSelection(selection: readonly string[], slug: string, checked: boolean, known: ReadonlySet<string>): string[] {
  const current = normaliseCardSelection(selection, known);
  if (!known.has(slug)) return current;
  return checked ? normaliseCardSelection([...current, slug], known) : current.filter(value => value !== slug);
}

export function setCardSelection(source: URLSearchParams, selection: readonly string[], known: ReadonlySet<string>): URLSearchParams {
  const state = cardJourneyParams(source, known);
  const current = normaliseCardSelection(selection, known);
  state.delete("cards");
  if (current.length) state.set("cards", current.join(","));
  return state;
}

/** A known finite minimum plus no explicit pending/conflict flag. This is
 * salary-filter suitability, not bank approval or universal verification. */
export function eligibleForSalaryFilter(provenance: Record<string, unknown> | undefined, minSalary: number | null | undefined): boolean {
  return typeof minSalary === "number" && Number.isFinite(minSalary) && minSalary >= 0
    && provenance?.eligibility !== "needs-review"
    && !Object.entries(provenance ?? {}).some(([key, state]) => state === "needs-review" && key.startsWith("eligibility."));
}
