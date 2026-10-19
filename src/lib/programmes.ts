// Programme sections — the one place that decides whether a loyalty
// programme lives under /airlines/ or /hotels/.
//
// The three hotel programmes moved out of /airlines/ on 11 October 2026
// (Chairman direction in-session: "all and then merge it"), closing the
// R5 ruling of 15 September 2026. Old /airlines/<hotel>/ URLs 301 to the
// new paths in public/_redirects. Brief:
// .council/briefs/2026-10-11-hotels-section.md.

//
// World of Hyatt and IHG One Rewards joined on 19 October 2026 — they were
// named across news and guides with no profile page to link to.
export const HOTEL_PROGRAMME_IDS = [
  "marriott-bonvoy",
  "hilton-honors",
  "accor-all",
  "world-of-hyatt",
  "ihg-one-rewards",
] as const;

export type ProgrammeSection = "airlines" | "hotels";

const HOTEL_SET: ReadonlySet<string> = new Set(HOTEL_PROGRAMME_IDS);

export function isHotelProgramme(id: string): boolean {
  return HOTEL_SET.has(id);
}

export function programmeSection(id: string): ProgrammeSection {
  return isHotelProgramme(id) ? "hotels" : "airlines";
}

/** Canonical path of a programme hub, e.g. "/hotels/marriott-bonvoy/". */
export function programmeHref(id: string): string {
  return `/${programmeSection(id)}/${id}/`;
}
