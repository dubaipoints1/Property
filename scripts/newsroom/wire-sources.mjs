import { RSS_FEEDS } from "../news-monitor/_feeds.mjs";
import { OPML_BATCHES } from "./wire-opml-feeds.mjs";

// Private coverage proposals, not production subscriptions. A manual route
// stays manual until a narrow change adapter has separately been verified.
const feed = (id, beat, signal, question) => {
  const configured = RSS_FEEDS.find(row => row.id === id && row.tier === "primary");
  if (!configured) throw Error(`Missing approved primary feed: ${id}`);
  return { id, name: configured.name, url: configured.url, method: "rss", beat, signal, question, latinOnly: configured.latinOnly === true };
};
const page = (id, name, url, beat, signal, question) => ({ id, name, url, method: "manual", beat, signal, question });

const existing = [
  feed("flydubai", "airlines", "network", "Which UAE departure, dates and booking options actually change?"),
  page("emirates-press", "Emirates Media Centre", "https://www.emirates.com/media-centre/", "airlines", "network", "Which UAE routes, cabins or schedules change? Check the exact flight."),
  { id: "emirates-rss", name: "Emirates Media Centre (publisher-linked RSS candidate)", url: "https://www.emirates.com/media-centre/feed/en-us",
    method: "rss", beat: "airlines", signal: "network", question: "What changes for UAE travellers or Skywards members? Read the release and confirm applicable routes or terms." },
  page("etihad-press", "Etihad UAE newsroom", "https://www.etihad.com/en-ae/news", "airlines", "network", "Which Abu Dhabi routes, cabins or partnerships change? The listing may require manual discovery."),
  page("air-arabia-press", "Air Arabia press office", "https://press.airarabia.com/", "airlines", "network", "Does it affect Sharjah, Abu Dhabi or Ras Al Khaimah departures?"),
  page("qatar-press", "Qatar Airways release archive", "https://www.qatarairways.com/press-releases/releases/", "airlines", "network", "Is there a specific UAE route or confirmed benefit for UAE readers?"),
  feed("hilton-stories", "hotels", "property", "Does the story change a UAE stay or Hilton Honors option?"),
  feed("hyatt-newsroom", "hotels", "property", "Is there a material UAE/GCC property or World of Hyatt change?"),
  page("ihg-press", "IHG press releases", "https://www.ihgplc.com/en/news-and-media/news-releases", "hotels", "property", "Can members earn or redeem at the named property, and from when?"),
  page("marriott-uae", "Marriott UAE offers", "https://www.marriott.com/en-us/offers/destinations/united-arab-emirates.mi", "hotels", "offer", "Which UAE hotels participate, and what is the matched rate and cancellation policy?"),
  page("four-seasons-difc", "Four Seasons DIFC press room", "https://press.fourseasons.com/dubaidifc/hotel-news/", "hotels", "property", "Does this materially change the guest experience or booking choice?"),
  page("rotana-discovery", "Rotana DISCOVERY offers", "https://www.rotana.com/rotanadiscovery/offers", "hotels", "offer", "Is the offer available to UAE members or at a named UAE property?"),
  page("jumeirah-staycation", "Jumeirah UAE staycations", "https://www.jumeirah.com/en/campaigns/staycation", "hotels", "offer", "Which properties participate? Check residency, blackout dates and cancellation."),
  page("skywards-updates", "Skywards programme updates", "https://www.emirates.com/english/skywards/emirates-skywards-program-updates/", "points", "rules", "What changes for balances, expiry, pooling or redemptions, and on what effective date?"),
  page("skywards-rules-ae", "Skywards UAE programme rules", "https://www.emirates.com/ae/english/skywards/emirates-skywards-programme-rules/", "points", "rules", "Do UAE terms differ from the announcement or previous rules?"),
  page("skywards-partners", "Skywards UAE partners", "https://www.emirates.com/ae/english/skywards/partners/", "points", "rules", "What changed for earning, spending or converting rewards? Read partner terms."),
  page("etihad-guest-offers", "Etihad Guest UAE offers", "https://www.etihad.com/en-ae/etihadguest/programme-offers", "points", "offer", "Are eligibility and end dates public? Hold app-only or login-gated terms."),
  page("airrewards-terms", "Air Arabia AirRewards terms", "https://www.airarabia.com/en/airrewards/air-rewards-terms-and-conditions", "points", "rules", "Does expiry, eligibility, earning or redemption change?"),
  page("avios-conversions-ae", "Qatar Privilege Club UAE conversion partners", "https://www.qatarairways.com/en-ae/Privilege-Club/convert-and-link-accounts.html", "points", "rules", "Which conversions are actually available to UAE residents?"),
  page("accor-deals", "ALL Accor Deals Corner", "https://all.accor.com/a/en/deals-corner.html", "points", "offer", "Can UAE members use the promotion, and which dates, quotas or exclusions apply?"),
  page("hyatt-offers", "World of Hyatt offers", "https://world.hyatt.com/content/gp/en/offers.html", "points", "offer", "Can a UAE reader register or book at a named property? Read campaign terms."),
  page("gha-updates", "GHA DISCOVERY updates", "https://www.ghadiscovery.com/whats-new", "points", "rules", "Does a change affect DISCOVERY Dollars, elite benefits or participating UAE hotels?"),
  page("ihg-reward-nights", "IHG new-hotel Reward Night offers", "https://www.ihg.com/offers/new-hotel-deals", "points", "offer", "Is the property on the campaign list? Do not infer member-rate availability."),
  page("fab-offers", "FAB UAE card offers", "https://www.bankfab.com/en-ae/personal/credit-cards/offers", "cards", "offer", "Which exact card, channel, dates and terms apply? No canonical data updates."),
  page("enbd-cards", "Emirates NBD UAE credit cards", "https://www.emiratesnbd.com/en/cards/credit-cards", "cards", "offer", "What changed for applicants? Compare the exact issuer terms, not marketing tiles."),
];

const questions = {
  airlines: "Which UAE itinerary, date, service or partner benefit changes?",
  hotels: "What changes for a UAE stay, and which properties or rates qualify?",
  points: "Can UAE members act, and what are the exact programme terms?",
  cards: "Which UAE issuer, card, eligibility and exact terms apply?",
  travel: "Which UAE location or travellers are affected, and what can they do?",
};
const signals = { airlines: "network", hotels: "property", points: "rules", cards: "offer", travel: "service" };
// Local pilot repair only. Keep the owner's exact imported OPML intact.
const replacements = new Map([
  ["air-service-one", ["oag-aviation-analysis", "OAG Aviation Market Analysis", "https://www.oag.com/blog/rss.xml"]],
  ["travel-daily-media", ["hospitality-net-hotel-openings", "Hospitality Net - Hotel Openings",
    "https://www.hospitalitynet.org/rss/announcements/openings.xml"]],
]);
const pilotBatches = OPML_BATCHES.map(batch => ({
  ...batch, feeds: batch.feeds.map(feed => replacements.get(feed[0]) ?? feed),
}));
const imported = pilotBatches.flatMap(batch => batch.feeds.map(([id, name, url]) => ({
  id, name, url, batch: batch.id, beat: batch.beat, role: batch.role,
  scopeCheck: batch.scopeCheck, method: "rss", signal: signals[batch.beat], question: questions[batch.beat],
})));
const byId = new Map(imported.map(source => [source.id, source]));
const existingIds = new Set(existing.map(source => source.id));

export const BATCHES = Object.freeze(pilotBatches.map(({ id, folder, feeds }) =>
  Object.freeze({ id, folder, sourceIds: Object.freeze(feeds.map(([sourceId]) => sourceId)) })));
export const SOURCES = Object.freeze([
  ...existing.map(source => {
    const matched = byId.get(source.id);
    if (matched && matched.url !== source.url) throw Error("Imported feed changed an existing baseline identity.");
    return { role: "official", ...matched, ...source };
  }),
  ...imported.filter(source => !existingIds.has(source.id)),
].map(Object.freeze));
