/** Hubs for issuer-source fee profiles with no verified tier-specific new applications. */
export const FEE_SOURCE_HUBS: Readonly<Record<string, { title: string; description: string }>> = {
  "ajman-bank": {
    title: "Ajman Bank BRight card fee profiles | DubaiPoints",
    description: "Ajman Bank’s BRight Titanium, Platinum and World fee profiles. New applications for each tier are unconfirmed.",
  },
  cbi: {
    title: "Commercial Bank International card fee profiles | DubaiPoints",
    description: "Commercial Bank International’s Mastercard Titanium and Rewards Platinum fee profiles. New applications for each tier are unconfirmed.",
  },
  "al-masraf": {
    title: "Al Masraf Mastercard Platinum fee profile | DubaiPoints",
    description: "Al Masraf’s conventional Mastercard Platinum tariff and VAT basis. New applications for this tier and any waiver are unconfirmed.",
  },
};

export const hasFeeSourceHub = (slug: string | undefined) => !!slug && Object.hasOwn(FEE_SOURCE_HUBS, slug);
