// Content ↔ image coverage — every rendered content entry should have a
// stock image or the dedicated, source-recorded issuer card face behind its
// resolved slug (conventional unless overridden
// by the programme image selection).
//
// StockImage degrades silently to a generated SVG Cover when a slug is
// missing (BankHubLayout and AirlineProgramLayout render no hero at
// all), so nothing else surfaces an imageless page: 7 of the 8 news
// stories filed in August 2026 shipped with placeholder covers and no
// check noticed (29 Aug 2026 site audit). This makes the gap loud.
//
// A deliberate exception goes in ALLOWED_MISSING with a reason — the
// point is that shipping imageless becomes a recorded decision, not an
// accident.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HOTEL_PROGRAMME_IDS, programmeImage } from "../../src/lib/programmes";

const root = fileURLToPath(new URL("../..", import.meta.url));

const ALLOWED_MISSING: Record<string, string> = {
  // slug: reason
  "news-frieze-abu-dhabi-2026-public-tickets-mamsha-sculpture":
    "Text-led timetable and access report; event photography was not cleared for republication.",
  "guide-hotel-best-price-guarantee-uae-accor-ihg":
    "Text-led rate-match checklist; a property image would not establish offer or claim eligibility.",
  "news-air-arabia-egypt-cairo-al-ain-december-flights":
    "Text-led timetable report; no licensed route-specific photo cleared, and no flown review is claimed.",
  "news-radisson-black-friday-prepaid-hotel-uae-2026":
    "Text-led campaign analysis; showing one property could imply participation or availability.",
  "guide-uae-credit-card-cash-advance-checklist":
    "Text-led statement and fee checklist; no source-licensed card or statement image is needed.",
  "card-dib-consumer-cashback-platinum": "Text-led scope; issuer card art was used as source evidence only, not republished.",
  "card-dib-shams-platinum": "Text-led scope; issuer card art was used as source evidence only, not republished.",
  "card-dib-prime-platinum": "Text-led scope; issuer card art was used only to identify the network, not republished.",
  ...Object.fromEntries(["gold", "signature", "infinite"].map(
    tier => [`card-dib-prime-${tier}`, "Text-led scope; issuer card art was checked only to identify the network, not republished."],
  )),
  "card-dib-shams-signature": "Text-led scope; issuer card art was used only to identify the network, not republished.",
  "card-dib-shams-infinite": "Text-led scope; issuer card art was used only to identify the network, not republished.",
  "bank-nbf": "Text-led issuer directory entry with a plain-text label rather than an issuer mark.",
  "bank-nbk": "Text-led issuer directory entry with a plain-text label rather than an issuer mark.",
  "bank-united-arab-bank": "Text-led issuer directory entry: plain name identifier, not issuer artwork.",
  ...Object.fromEntries(["mastercard-titanium", "mastercard-platinum", "mastercard-world", "islamic-mastercard-titanium"].map(
    suffix => [`card-united-arab-bank-${suffix}`, "Text-led scoped issuer profile; no issuer card artwork is republished."],
  )),
  "card-nbk-visa-classic": "Text-led, scoped issuer profile; no issuer card artwork is republished.",
  "card-nbk-visa-gold": "Text-led, scoped issuer profile; no issuer card artwork is republished.",
  "card-nbk-visa-platinum": "Text-led, scoped issuer profile; no issuer card artwork is republished.",
  "card-nbf-islamic-visa-infinite": "Text-led issuer profile; no licensed issuer card art is republished.",
  "card-nbf-islamic-platinum-exclusive": "Text-led issuer profile; no licensed issuer card art is republished.",
  "card-nbf-visa-infinite": "Text-led issuer profile; no licensed issuer card art is republished.",
  "card-nbf-platinum-exclusive": "Text-led issuer profile; no licensed issuer card art is republished.",
  "card-rakbank-red": "Text-led scope; issuer card art was used as source evidence only, not republished.",
  "card-rakbank-titanium": "Text-led scope; issuer card art was used as source evidence only, not republished.",
  "card-rakbank-islamic-world": "Text-led exact-product issuer profile; no approved card art is republished.",
  ...Object.fromEntries(["skywards-signature", "barca-cashback", "rta", "amazon-world", "amazon-platinum"].map(
    slug => [`card-emirates-islamic-${slug}`, "Text-led exact-product issuer profile; no approved card art is republished."],
  )),
  ...Object.fromEntries(["noon", "platinum-plus", "solitaire"].map(
    product => [`card-mashreq-${product}`, "Text-led partial source profile; issuer art was checked only to identify the network and is not republished."],
  )),
  ...Object.fromEntries(["aura", "aura-world", "aura-world-elite"].map(
    product => [`card-mashreq-${product}`, "Text-led scoped profile; issuer card artwork is not licensed for republication."],
  )),
  ...Object.fromEntries(["hsbc-premier", "hsbc-advance", "sc-journey"].map(
    slug => [`card-${slug}`, "Text-led scoped issuer profile; no approved card art is republished."],
  )),
  ...Object.fromEntries(["emirates-nbd-share-visa-platinum", "emirates-nbd-u-by-emaar-signature", "liv-tamayaz-platinum"].map(
    slug => [`card-${slug}`, "Text-led exact-tier source profile; no approved card art is republished."],
  )),
  ...Object.fromEntries(["fab-adnoc-rewards", "fab-cashback-islamic", "fab-etihad-guest-signature", "fab-etihad-guest-platinum", "fab-gems-world", "fab-travel", "fab-du-titanium", "fab-rewards-indulge", "fab-rewards-active", "fab-z-credit-card", "fab-share-infinite", "fab-share-platinum", "fab-share-signature"].map(
    slug => [`card-${slug}`, "Text-led scoped issuer source profiles; no approved art republished."],
  )),
  ...Object.fromEntries(["simplicity", "rewards", "premier", "prestige", "ultima"].map(
    product => [`card-citi-${product}`, "Text-led source profile; no issuer card art has an approved licence record. Do not substitute synthetic card art."],
  )),
  "news-uae-card-change-log-citi-cash-back-application-route":
    "Deliberately text-led: the issuer terms and worked comparison are the evidence; no decorative article hero, with the existing fallback cover on the listing.",
  "news-uae-salary-switch-scorecard":
    "Deliberately text-led: three dated, issuer-sourced examples need no decorative hero; the news listing retains its existing fallback cover.",
  "news-cash-or-miles-uae-flight-break-even":
    "Deliberately text-led: the worked comparisons are the visual focus and no image should imply that the hypothetical flights were priced or booked.",
  "news-cash-or-miles-etihad-abu-dhabi-muscat":
    "Deliberately text-led: the dated, parsed pricing evidence is the focus; the listing uses an original route pictogram, not a photo implying first-hand travel.",
  "news-flydubai-december-europe-returns":
    "Deliberately text-led: this is a timetable report, not a flight review. No licensed photograph for these routes or original on-location imagery was verified for this item.",
  "news-skywards-my-family-pooling-pause":
    "Deliberately text-led: the official account-transition notice is the evidence; an aircraft photo would not illustrate the pooling or transfer rules.",
  "news-standard-chartered-targeted-cashback-november-2026":
    "Deliberately text-led: the invitation terms and payment exclusions are the evidence; a card image would not establish customer eligibility.",
  "news-emirates-premium-economy-europe-segment-check":
    "Deliberately text-led: the published cabin schedule and programme rules are the evidence; cabin art would not establish the equipment or cabin on a reader's flight.",
  "guide-abu-dhabi-boat-show-2026-plan-marina-visit":
    "Deliberately text-led: access and opening-time evidence comes from official event and ticket listings; no event photograph was cleared.",
  "news-etihad-calgary-daily-october-2027":
    "Deliberately text-led: the published timetable is the evidence; no licensed route-specific image was cleared.",
  "news-citi-uae-premier-rewards-airport-dining-january-2027":
    "Deliberately text-led: dated issuer allowances are the evidence; artwork would not establish entitlement.",
  "news-ihg-cyber-sale-middle-east-deposit-2026":
    "Deliberately text-led: a dated multi-property rate check is the evidence; no one hotel image represents the offer.",
  "news-global-village-taylor-swift-tribute-november-25-2026":
    "Deliberately text-led: dated operator schedule and entry rules are the evidence; no cleared event image or artist likeness.",
  "news-krisflyer-offline-service-fee-december-2026":
    "Deliberately text-led: the airline's fee table is the evidence; aircraft or route imagery would not verify the fee or waiver.",
  "news-hyatt-delta-bonus-tier-night-december-2026":
    "Text-led review candidate; a property photo would not establish offer eligibility.",
  "news-emaar-dubai-countdown-cirque-burj-park-2026":
    "Text-led review candidate; no event photography or artist likeness has been cleared.",
  "guide-dubai-city-check-in-emirates-flydubai":
    "Text-led review candidate; the carrier service table is the evidence.",
  "guide-expo-winter-city-choose-ticket-date":
    "Deliberately text-led; no imagery licensed to represent the event.",
  "guide-air-arabia-poland-choose-your-airport":
    "Deliberately text-led; the guide compares schedules, fare types and airport connections rather than claiming a first-hand flight.",
  "news-emirates-islamic-barca-cashback-card-free-for-life-up-to-4-percent":
    "Deliberately text-led: the issuer's offer page is the evidence. No clean issuer card art is published for this card yet, and a football or stadium photo would imply club imagery we do not hold.",
  "news-world-of-hyatt-2027-free-night-suite-award-check":
    "Deliberately text-led: Official programme terms are the evidence; an image would not verify individual room availability.",
  "guide-marriott-bonvoy-gift-stay-or-transfer-points-uae":
    "Deliberately text-led: Programme rules are the evidence; no claim about a particular property or a hosted stay.",
  "guide-emirates-nbd-first-card-statement-payment-check":
    "Deliberately text-led: Issuer support and payment terms; no fabricated statement or cardholder information.",
  "guide-etihad-guest-missing-miles-claim-route-uae":
    "Deliberately text-led: Official claim-route instructions are the evidence; no private membership or account image.",
  "news-dxb-concourse-b-business-lounge-opening":
    "Deliberately text-led: Named reporting and airline access guidance, not unverified photography of the new lounge.",
  // Phase E.26 deals (20 October 2026): photos are seeded by
  // .github/workflows/seed-images-e26.yml after push. Remove each line once
  // the manifest carries it (the stale-entry test below will insist).
};

const manifest = JSON.parse(
  readFileSync(`${root}/data/stock/manifest.json`, "utf8"),
);
const manifestEntries: Array<{ slug: string; file: string; source_id?: string; source: string }> = Array.isArray(manifest)
  ? manifest
  : (manifest.images ?? manifest.entries);
const slugs = new Set(manifestEntries.map((e) => e.slug));
// The 9 October issuer-card-art amendment uses a separate provenance
// manifest; do not demand a duplicate stock row for the same real card.
const cardArt: Record<string, { file: string; url: string; page: string | null; width: number; height: number }> = JSON.parse(
  readFileSync(`${root}/data/card-art/manifest.json`, "utf8"),
);
function hasIssuerArt(id: string): boolean {
  const art = cardArt[id];
  if (!art) return false;
  assert.equal(art.file, `images/cards/${id}.webp`, `${id}: card-art path must identify this card`);
  assert.ok(existsSync(`${root}/public/${art.file}`), `${id}: issuer art file is missing`);
  assert.ok(art.width > 0 && art.height > 0, `${id}: issuer art dimensions are missing`);
  assert.equal(new URL(art.url).protocol, "https:", `${id}: image source must be recorded`);
  if (art.page) assert.equal(new URL(art.page).protocol, "https:", `${id}: product source must be HTTPS`);
  return true;
}

const contentIds = (dir: string): string[] =>
  readdirSync(`${root}/src/content/${dir}`)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.(mdx|md)$/, ""));

const surfaces: Array<[string, string[]]> = [
  ["guide-", contentIds("guides")],
  ["news-", contentIds("news")],
  ["deal-", contentIds("deals")],
  ["bank-", contentIds("banks")],
  ["programme-", contentIds("programs")],
  [
    "card-",
    Object.keys(JSON.parse(readFileSync(`${root}/src/data/cards.json`, "utf8"))),
  ],
];

test("every content entry has a stock image, real issuer card art or a recorded exception", () => {
  const missing: string[] = [];
  for (const [prefix, ids] of surfaces) {
    for (const id of ids) {
      const slug = prefix === "programme-" ? programmeImage(id).slug : `${prefix}${id}`;
      const issuerImage = prefix === "card-" && hasIssuerArt(id);
      if (!slugs.has(slug) && !issuerImage && !(slug in ALLOWED_MISSING)) missing.push(slug);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `content entries without a manifest image — fetch one via refetch-image.yml or record a reason in ALLOWED_MISSING:\n  ${missing.join("\n  ")}`,
  );
});

test("hotel directory and hub images resolve to licensed files, not the retired Accor photo", () => {
  for (const id of HOTEL_PROGRAMME_IDS) {
    const image = programmeImage(id);
    const entry = manifestEntries.find((item) => item.slug === image.slug);
    assert.ok(entry, `${id} must resolve to a manifest image`);
    assert.ok(existsSync(`${root}/public/${entry.file}`), `${entry.file} is missing`);
    assert.notEqual(entry.source, "ai-generated", `${id} must use a photograph`);
    assert.notEqual(entry.source_id, "20543524", "the former Sofitel is now a Dorint property");
    if (id === "accor-all") assert.equal(image.caption, "Novotel Barcelona City");
  }
});

test("ALLOWED_MISSING carries no stale entries", () => {
  const allContent = new Set(
    surfaces.flatMap(([prefix, ids]) => ids.map((id) => `${prefix}${id}`)),
  );
  for (const slug of Object.keys(ALLOWED_MISSING)) {
    assert.ok(
      allContent.has(slug),
      `ALLOWED_MISSING lists ${slug}, which no longer matches any content entry`,
    );
    assert.ok(
      !slugs.has(slug),
      `ALLOWED_MISSING lists ${slug}, but the manifest now carries it — remove the exception`,
    );
  }
});
