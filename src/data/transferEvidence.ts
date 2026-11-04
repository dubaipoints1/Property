// Curated primary-source cells and short excerpts, not a copy of an issuer's
// page. Do not type numeric terms alongside the evidence: the Finder derives
// them with scripts/scrape/_transfer-rates.ts. Recheck the exact rewards
// currency, account/card, direction and channel before changing an excerpt.
const checked = "2026-11-04";
export const transferSources = {
  fab: { issuer: "FAB", label: "FAB Rewards", url: "https://www.bankfab.com/en-ae/personal/rewards/fab-rewards/program", checked },
  fabBlue: { issuer: "FAB", label: "Al-Futtaim Rewards", url: "https://www.bankfab.com/en-ae/personal/rewards/al-futtaim-rewards/program", checked },
  enbd: { issuer: "Emirates NBD", label: "Plus Points redemption", url: "https://www.emiratesnbd.com/en/help-and-support/redeeming-plus-points", checked },
  adcb: { issuer: "ADCB", label: "TouchPoints rate notice", url: "https://www.adcb.com/en/personal/promotions/tp-updates", checked },
  eiFlex: { issuer: "Emirates Islamic", label: "Flex card", url: "https://www.emiratesislamic.ae/en/cards/credit-cards/flex-card", checked },
  eiProgramme: { issuer: "Emirates Islamic", label: "EI SmartMiles conversion", url: "https://www.emiratesislamic.ae/en/personal-banking/cards/credit-cards/ei-smartmiles-conversion", checked },
  accorSkywards: { issuer: "ALL Accor", label: "Emirates partnership", url: "https://all.accor.com/a/en/loyalty-program/partners/airlines/emirates.html", checked },
  accorEtihad: { issuer: "ALL Accor", label: "Etihad partnership", url: "https://all.accor.com/loyalty-program/partners/use/etihad/index.en.shtml", checked },
  bonvoy: { issuer: "Marriott Bonvoy", label: "airline transfers", url: "https://www.marriott.com/loyalty/redeem/travel/points-to-miles.mi", checked },
  bonvoySkywards: { issuer: "Marriott Bonvoy", label: "Emirates partnership", url: "https://travel-partner.marriott.com/emirates/en-gb?action=terms.home", checked },
  emiratesBonvoy: { issuer: "Emirates", label: "Marriott Bonvoy partnership", url: "https://www.emirates.com/english/skywards/partners/marriott-bonvoy", checked },
  emiratesCampaign: { issuer: "Emirates", label: "announcement", url: "https://www.emirates.com/media-centre/emirates-skywards-rewards-members-with-bonus-miles-on-hotels-holiday-packages-and-car-rentals-this-winter/", checked },
  emiratesCampaignTerms: { issuer: "Emirates", label: "offer terms", url: "https://www.emirates.com/us/english/special-offers/festive-travel-drive/", checked },
} as const;

export const transferOrigins = {
  "enbd-plus": { label: "Emirates NBD Plus Points", unit: "Plus Points", appliesTo: "Primary holders of active Emirates NBD cards that earn Plus Points." },
  "fab-rewards": { label: "FAB Rewards", unit: "FAB Rewards", appliesTo: "Standard FAB Rewards balance. A Blue FAB Al-Futtaim balance is a different currency." },
  "fab-al-futtaim": { label: "FAB Al-Futtaim Rewards", unit: "FAB Al-Futtaim Rewards", appliesTo: "BLUE FAB credit card’s Al-Futtaim Rewards balance." },
  "adcb-touchpoints": { label: "ADCB TouchPoints", unit: "TouchPoints", appliesTo: "Eligible ADCB TouchPoints balance; not a co-branded card’s directly earned miles." },
  "ei-flex": { label: "Emirates Islamic EI SmartMiles · Flex", unit: "EI SmartMiles", appliesTo: "Flex credit card’s EI SmartMiles. Do not assume other EI cards share these terms." },
  "all-accor": { label: "ALL Accor Reward points", unit: "ALL Reward points", appliesTo: "ALL Accor members transferring to their own airline loyalty account." },
  "marriott-bonvoy": { label: "Marriott Bonvoy Points", unit: "Bonvoy Points", appliesTo: "Marriott Bonvoy members transferring to an eligible airline loyalty account." },
} as const;

export const transferDestinations = {
  skywards: { label: "Emirates Skywards", unit: "Skywards Miles", href: "/airlines/skywards/" },
  "etihad-guest": { label: "Etihad Guest", unit: "Etihad Guest Miles", href: "/airlines/etihad-guest/" },
  "qatar-privilege-club": { label: "Qatar Privilege Club", unit: "Avios", href: "/airlines/qatar-privilege-club/" },
} as const;

type SourceId = keyof typeof transferSources;
export type TransferOrigin = keyof typeof transferOrigins;
export type TransferDestination = keyof typeof transferDestinations;
type Evidence = { source: SourceId; excerpt: string };
export type RouteEvidence = {
  from: TransferOrigin;
  to: TransferDestination;
  channel: string;
  ratio: Evidence | null;
  minimum?: Evidence;
  timing?: Evidence;
  blockBonus?: Evidence;
  caveat?: string;
  alternateSource?: SourceId;
};

const evidence = (source: SourceId, excerpt: string): Evidence => ({ source, excerpt });
const enbdMinimum = evidence("enbd", "minimum of 500 points");
const bonvoySkywardsBonus = evidence("bonvoySkywards", "5,000 bonus Skywards Miles for every 60,000 points transferred");
const accorEtihad = evidence("accorEtihad", "Minimum conversion: 4,000 Reward points = 2,000 Etihad Guest miles");
const accorSkywards = evidence("accorSkywards", "Minimum conversion: 4,000 Reward points = 2,000 Skywards Miles");

export const transferRouteEvidence: readonly RouteEvidence[] = [
  { from: "enbd-plus", to: "skywards", channel: "Emirates NBD redemption request", ratio: evidence("enbd", "1 Plus Point = 7 Skywards Miles"), minimum: enbdMinimum },
  { from: "enbd-plus", to: "etihad-guest", channel: "Emirates NBD Phone Banking", ratio: evidence("enbd", "1 Plus Point = 10 Etihad Guest Miles"), minimum: enbdMinimum },
  { from: "enbd-plus", to: "qatar-privilege-club", channel: "Rewards Hub in ENBD X", ratio: null, timing: evidence("enbd", "within 7 working days"), alternateSource: "enbd", caveat: "Different public versions of the bank’s page show different Avios rates. Check the amount shown in Rewards Hub before confirming." },
  { from: "fab-rewards", to: "skywards", channel: "FAB Mobile · Convert to Miles", ratio: evidence("fab", "16 FAB Rewards = 1 Skywards Mile"), timing: evidence("fab", "account instantly") },
  { from: "fab-rewards", to: "etihad-guest", channel: "FAB Mobile · Convert to Miles", ratio: evidence("fab", "12 FAB Rewards = 1 Etihad Guest Mile"), timing: evidence("fab", "account real-time") },
  { from: "fab-al-futtaim", to: "skywards", channel: "FAB Mobile · Convert to Miles", ratio: evidence("fabBlue", "12 FAB Al-Futtaim Rewards = 1 Skywards Mile"), timing: evidence("fabBlue", "account instantly") },
  { from: "fab-al-futtaim", to: "etihad-guest", channel: "FAB Mobile · Convert to Miles", ratio: evidence("fabBlue", "10 FAB Al-Futtaim Rewards = 1 Etihad Guest Mile"), timing: evidence("fabBlue", "account instantly") },
  { from: "adcb-touchpoints", to: "skywards", channel: "ADCB rewards redemption", ratio: evidence("adcb", "22 TPs to 1 Mile"), minimum: evidence("adcb", "22,000 TPs"), caveat: "The ratio and minimum use the New Value column in ADCB’s rate-change notice, not the old rate alongside it." },
  { from: "ei-flex", to: "skywards", channel: "EI SmartMiles · Miles Exchange", ratio: evidence("eiFlex", "10,000 EI SmartMiles | → | 1,000 Emirates Skywards Miles") },
  { from: "ei-flex", to: "etihad-guest", channel: "EI SmartMiles · Miles Exchange", ratio: null, alternateSource: "eiFlex", caveat: "The Flex card page and the bank’s programme page disagree on the number of miles. Confirm in the redemption screen before transferring." },
  { from: "ei-flex", to: "qatar-privilege-club", channel: "EI SmartMiles · Miles Exchange", ratio: evidence("eiFlex", "10,000 EI SmartMiles | → | 1,750 Qatar Airways Privilege Club Avios") },
  { from: "all-accor", to: "skywards", channel: "ALL Accor · Emirates partner page", ratio: accorSkywards, minimum: accorSkywards },
  { from: "all-accor", to: "etihad-guest", channel: "ALL Accor · Etihad partner page", ratio: accorEtihad, minimum: accorEtihad },
  {
    from: "marriott-bonvoy", to: "skywards", channel: "Marriott Bonvoy · Transfer Points to Miles",
    ratio: evidence("bonvoy", "Emirates Skywards® | 3:1"), blockBonus: bonvoySkywardsBonus,
    minimum: evidence("emiratesBonvoy", "minimum of 3,000 and maximum of 240,000 Marriott Bonvoy points per day"),
    timing: evidence("emiratesBonvoy", "within 48 hours"),
    caveat: "Emirates says the membership names must match and the conversion cannot be reversed.",
  },
  { from: "marriott-bonvoy", to: "etihad-guest", channel: "Marriott Bonvoy · Transfer Points to Miles", ratio: evidence("bonvoy", "Etihad Guest | 3:1") },
  { from: "marriott-bonvoy", to: "qatar-privilege-club", channel: "Marriott Bonvoy · Transfer Points to Miles", ratio: evidence("bonvoy", "Qatar Airways Privilege Club | 3:1") },
];

// Separate from the underlying Accor ratio and Marriott’s standing block
// bonus. The offer is dated even in static HTML; the browser hides it outside
// its verified date window on sites that have not yet been rebuilt.
export const transferOfferEvidence = {
  from: "all-accor",
  to: "skywards",
  rate: evidence("emiratesCampaign", "25% bonus Miles"),
  announced: evidence("emiratesCampaign", "29 October 2026"),
  ends: evidence("emiratesCampaign", "until 30 November 2026"),
  terms: "emiratesCampaignTerms",
  caveat: "The names on both accounts must match. Emirates says the conversion cannot be cancelled or reversed.",
} as const;
