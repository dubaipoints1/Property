import {
  transferSources, transferOrigins, transferDestinations, transferRouteEvidence,
  transferOfferEvidence, type RouteEvidence,
} from "../data/transferEvidence";
import {
  parseTransferRatio, parseTransferMinimum, parseTransferTiming,
  parseTransferBlockBonus, parseTransferOfferRate, parseTransferOfferDate,
} from "../../scripts/scrape/_transfer-rates";

export { transferOrigins, transferDestinations };
type Fact = NonNullable<RouteEvidence["ratio"]>;

function readFact<T>(field: string, evidence: Fact | undefined | null, parse: (text: string) => T | null) {
  if (!evidence) return null;
  const value = parse(evidence.excerpt);
  if (value === null) throw new Error(`Unrecognised ${field} evidence in transfer source ${evidence.source}`);
  return value;
}

export const transferRoutes = transferRouteEvidence.map((route) => {
  const sourceIds = [
    route.ratio?.source, route.minimum?.source, route.timing?.source,
    route.blockBonus?.source, route.alternateSource,
    // The conflicting Emirates Islamic published rate is never used as a
    // numeric input. Keep the programme source linked for readers to compare.
    route.from === "ei-flex" && route.to === "etihad-guest" ? "eiProgramme" as const : undefined,
  ];
  const sources = [...new Set(sourceIds.filter((id) => id !== undefined))].map((id) => transferSources[id]);
  if (!sources.length) throw new Error(`Missing transfer source: ${route.from} to ${route.to}`);
  return {
    id: `${route.from}-${route.to}`,
    from: route.from,
    to: route.to,
    origin: transferOrigins[route.from],
    destination: transferDestinations[route.to],
    channel: route.channel,
    ratio: readFact("ratio", route.ratio, parseTransferRatio),
    minimum: readFact("minimum", route.minimum, parseTransferMinimum),
    timing: readFact("timing", route.timing, parseTransferTiming),
    blockBonus: readFact("block bonus", route.blockBonus, parseTransferBlockBonus),
    caveat: route.caveat,
    checked: sources.map((source) => source.checked).sort()[0],
    sources,
  };
});

if (new Set(transferRoutes.map((route) => route.id)).size !== transferRoutes.length) throw new Error("Duplicate transfer route");

const rate = readFact("offer rate", transferOfferEvidence.rate, parseTransferOfferRate);
const announced = readFact("offer announcement", transferOfferEvidence.announced, parseTransferOfferDate);
const ends = readFact("offer end date", transferOfferEvidence.ends, parseTransferOfferDate);
if (rate === null || !announced || !ends || ends < announced) throw new Error("Incomplete transfer offer evidence");
export const transferOffer = {
  from: transferOfferEvidence.from,
  to: transferOfferEvidence.to,
  rate,
  announced,
  ends,
  source: transferSources[transferOfferEvidence.rate.source],
  terms: transferSources[transferOfferEvidence.terms],
  caveat: transferOfferEvidence.caveat,
};
