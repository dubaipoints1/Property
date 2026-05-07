// ─────────────────────────────────────────────────────────────────────────────
// AED valuations — fils per Mile/point for UAE rewards currencies.
//
// These are *indicative* values, sampled quarterly. The published number is a
// sampled best-case for premium-cabin redemption availability ~30 days out
// (where applicable), or for the highest-value redemption path of the
// programme (cashback / statement credit / partner gift card). Methodology
// at /valuations/methodology/.
//
// Status at launch: PLACEHOLDER. The first formal sampling lands Q3 2026.
// Until then every figure on this page is flagged "Indicative — pre-sampling".
// ─────────────────────────────────────────────────────────────────────────────

export type ValuationTrend = "up" | "flat" | "down";

export interface Valuation {
  /** Display name of the programme. */
  programme: string;
  /** Internal slug — used to link to a programme page if one exists. */
  slug: string;
  /** Issuer/airline category — for grouping. */
  category: "airline" | "hotel" | "bank";
  /** Indicative value in fils per Mile/point. */
  valueFils: number;
  /** Movement vs the previous quarter's published figure. */
  trend: ValuationTrend;
  /** Short trend note shown beside the value. */
  trendNote: string;
  /** One-line characterisation of the redemption sweet spot. */
  sweetSpot: string;
  /** Whether a /airlines/<slug>/ page exists for this programme. */
  hasProgrammePage: boolean;
  /** Date this row was last sampled. */
  lastSampled: Date;
}

const Q2_2026 = new Date("2026-05-01");

export const valuations: Valuation[] = [
  {
    programme: "Emirates Skywards",
    slug: "skywards",
    category: "airline",
    valueFils: 2.4,
    trend: "up",
    trendNote: "Premium-cabin availability strong on Saver awards.",
    sweetSpot: "Emirates business class out of DXB",
    hasProgrammePage: true,
    lastSampled: Q2_2026,
  },
  {
    programme: "Etihad Guest",
    slug: "etihad-guest",
    category: "airline",
    valueFils: 2.0,
    trend: "flat",
    trendNote: "Etihad metal availability stable; partners weak.",
    sweetSpot: "Etihad business class to South-East Asia from AUH",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "Qatar Privilege Club Avios",
    slug: "qatar-privilege-club",
    category: "airline",
    valueFils: 1.8,
    trend: "flat",
    trendNote: "Qatar metal redemption rate consistent.",
    sweetSpot: "Qatar business class via DOH",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "Saudia Alfursan",
    slug: "saudia-alfursan",
    category: "airline",
    valueFils: 1.4,
    trend: "flat",
    trendNote: "Programme refresh expected; rates may shift.",
    sweetSpot: "GCC short-haul on Saudia metal",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "Marriott Bonvoy",
    slug: "marriott-bonvoy",
    category: "hotel",
    valueFils: 2.8,
    trend: "up",
    trendNote: "UAE Marriott off-peak award rates hold.",
    sweetSpot: "UAE off-peak weekend stays",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "IHG One Rewards",
    slug: "ihg-one-rewards",
    category: "hotel",
    valueFils: 2.5,
    trend: "flat",
    trendNote: "UAE properties slightly above global average.",
    sweetSpot: "Voco / Crowne Plaza UAE redemptions",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "Hilton Honors",
    slug: "hilton-honors",
    category: "hotel",
    valueFils: 1.7,
    trend: "up",
    trendNote: "5th-night-free reliable for UAE resorts.",
    sweetSpot: "UAE resort 5-night stays",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "FAB Rewards",
    slug: "fab-rewards",
    category: "bank",
    valueFils: 3.6,
    trend: "up",
    trendNote: "1:1 Skywards transfer is the strongest exit.",
    sweetSpot: "1:1 transfer to Skywards, then premium redemption",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "ADCB TouchPoints",
    slug: "adcb-touchpoints",
    category: "bank",
    valueFils: 2.0,
    trend: "flat",
    trendNote: "Statement-credit redemption rate stable.",
    sweetSpot: "Statement credit at 2 fils per point",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "ENBD Smiles",
    slug: "enbd-smiles",
    category: "bank",
    valueFils: 1.4,
    trend: "down",
    trendNote: "Devaluation on flight redemptions; gift cards now best.",
    sweetSpot: "Partner gift cards (Carrefour, Lulu)",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
  {
    programme: "Mashreq Reward Points",
    slug: "mashreq-rewards",
    category: "bank",
    valueFils: 1.6,
    trend: "flat",
    trendNote: "Cashback exit reliable; flights weak.",
    sweetSpot: "Cashback at ~1.6 fils per point",
    hasProgrammePage: false,
    lastSampled: Q2_2026,
  },
];

export const valuationsAsOf = Q2_2026;
