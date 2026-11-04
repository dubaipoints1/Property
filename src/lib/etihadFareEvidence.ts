import snapshot from "../data/travel-evidence/etihad-auh-mct-2026-11-25.json";

const numberText = "(?:[1-9][0-9]{0,2}(?:,[0-9]{3})+|[0-9]+)";
const integer = (value: string) => Number(value.replaceAll(",", ""));

type FareText = Pick<typeof snapshot, "flightText" | "cashFareText" | "cashTotalText" | "awardFareText">;

/** Parse only the observed Value fare lines; no live data is assumed. */
export function parseEtihadFareEvidence({ flightText, cashFareText, cashTotalText, awardFareText }: FareText) {
  const flight = /\b(EY \d+)$/m.exec(flightText)?.[1];
  const cash = new RegExp(`^Including taxes\\nAED(${numberText})$`).exec(cashTotalText);
  const award = new RegExp(`^Value\\nMiles\\n(${numberText})\\n\\+\\nAED\\n(${numberText})\\nfor all guests\\n`).exec(awardFareText);
  const allowance = (line: string) => /^([1-9][0-9]*)kg\nchecked baggage$/m.exec(line)?.[1];
  const bags = allowance(cashFareText);
  if (!flight || !cash || !award || !bags || allowance(awardFareText) !== bags ||
      !cashFareText.startsWith("Value\n") || !flightText.includes("Guests: 1\n") ||
      !flightText.includes("20:50AUH\nNon-stop") || !flightText.includes("MCT22:00")) {
    throw new Error("The Etihad Value fare excerpt no longer supports the matched quote");
  }
  return { flight, cashAed: integer(cash[1]), miles: integer(award[1]), awardFeesAed: integer(award[2]), checkedBagKg: integer(bags) };
}

export const etihadMuscatFare = { ...parseEtihadFareEvidence(snapshot), checkedOn: snapshot.checkedOn,
  travelDate: snapshot.travelDate, source: snapshot.publicSource };
