import { createHash } from "node:crypto";
import type { SalaryTransferOffer } from "./salaryTransfer";

type TimelineOffer = Pick<SalaryTransferOffer,
  "id" | "bankSlug" | "sourceUrl" | "validFrom" | "validUntil" | "requirements" | "clawbackTerms">;

export interface SalaryTransferTimeline {
  endDate: "published" | "not-published";
  steps: readonly [open: string, qualify: string, payout: string, keep: string];
}

// These are editorial summaries of the existing offer entries, not new
// calculator inputs. An edited or replacement campaign must not inherit
// a previous campaign's clocks. The checksum covers the bank, source,
// campaign dates and the source-backed terms; a date-only verification
// refresh doesn't require republishing unchanged text.
const campaigns: Readonly<Record<string, SalaryTransferTimeline & { termsHash: string }>> = {
  "emirates-islamic-2026-oct-2027-mar": {
    termsHash: "90637bc9a574193eee289297335089ca9b340139d2debea5f5f8786f21d1b5b6",
    endDate: "published",
    steps: [
      "Enrol in the campaign. You must not have transferred salary to Emirates Islamic or Emirates NBD in the previous six months.",
      "Receive employer salary in three consecutive calendar months. New account holders must receive their first salary, use their debit card and register for EI+ within 60 days of opening. The optional card bonus has its own spend test.",
      "Emirates Islamic processes the account reward within 60 days of meeting the conditions. It uses the lower salary from months two and three to set your band.",
      "The bank may reverse the full salary reward if you miss more than three consecutive calendar months in the 12 months after the payout month.",
    ],
  },
  "fab-20-percent-2026": {
    termsHash: "641cc7eea69730849eef8f05c7db8a263efa5deb7bd0b9a1e80b3e5d107ee363",
    endDate: "published",
    steps: [
      "Use an eligible FAB conventional current account. Existing FAB customers must not have transferred salary to FAB in the previous 12 months. Your first qualifying salary must arrive by the campaign deadline.",
      "Each month, grow your eligible balance from the previous month-end by at least 20% of that month’s salary, or spend at least 20% on a qualifying new FAB card. You only need one route.",
      "FAB credits cashback within 45 calendar days after each qualifying month ends, for up to 12 months from your first qualifying salary.",
      "A missed month is not paid later. Closing your account before payment forfeits the unpaid cashback.",
    ],
  },
  "hsbc-new-to-bank-2026-sep-dec": {
    termsHash: "b81ede712174511ce7d7011ecf0b24d5f1690ac54cc4dbdf9c3227f917d15d26",
    endDate: "published",
    steps: [
      "New HSBC UAE customers open an eligible Advance or Premier account during the offer period and activate the mobile app within 30 days of opening.",
      "Receive two consecutive qualifying salaries directly from your employer in the first three months. Premier also requires qualifying Global Money activity in that window.",
      "HSBC says it pays within 90 calendar days after you meet all the applicable conditions.",
      "HSBC may withhold or reverse the reward if you close or downgrade within 180 days of first funding or salary credit. Check its separate conditions on interrupted salary transfers.",
    ],
  },
  "mashreq-2026": {
    termsHash: "ee5b49c264e27c8f19794f36e0b22abb0db0059fdca5afb18b31e124abec0475",
    endDate: "not-published",
    steps: [
      "Open an eligible Mashreq or Mashreq NEO account. This schedule applies if the first salary is credited on or after 1 August 2026; the bank does not publish a fixed end date on this offer page.",
      "Arrange qualifying employer payroll. The first salary sets your band. For the extra early-bird reward, that salary must reach Mashreq within 90 days of opening.",
      "The dated offer page says 12 equal monthly instalments, but its linked PDF says six. Confirm the applicable schedule with Mashreq before relying on it.",
      "A month without a qualifying salary loses that instalment. Mashreq says it reverses all bonus already paid if salary stops for two consecutive months in the first year.",
    ],
  },
  "dib-xtra-2026": {
    termsHash: "2d2b520baf74c469be30a5e9182e12c156b0d4d13315778ffc0093c6c9e57a0d",
    endDate: "not-published",
    steps: [
      "Start a new qualifying salary transfer into an eligible Al Islami account. Check the six-month salary lookback and confirm the campaign is still open: the terms do not give a fixed end date.",
      "Receive at least two eligible salaries within 90 days of taking the first product in the bundle. You also need an eligible Covered Card or qualifying finance. Confirm the product and any spend condition with DIB.",
      "DIB allows up to 60 calendar days from the later applicable bundle or spend window for the joining bonus. Home-finance valuation fees follow separate rules.",
      "Check the separate card or finance terms before committing. DIB may withhold or reverse the reward for default, fraud or a breach of the terms.",
    ],
  },
  "emirates-nbd-payroll-cashback-2026-q4": {
    termsHash: "29d9b2103b30883d8e75dc2fec7e2e9bd2fd6a717a778d46a53b13e9dd51e508",
    endDate: "published",
    steps: [
      "Open your first eligible Emirates NBD current or savings account during the campaign. Confirm your employer is on the bank’s approved list.",
      "Receive your first qualifying salary and get a linked new credit card within 90 calendar days of opening. Make AED 5,000 of qualifying card purchases within 60 days of issue.",
      "Emirates NBD says it pays after 150 calendar days from your first salary credit, if all conditions are met.",
      "The bank may reverse the reward if it does not receive 12 consecutive salaries or if you close a linked card or loan within 180 calendar days of account opening.",
    ],
  },
  "standard-chartered-priority-2026-nov-2027-jan": {
    termsHash: "6112b8e3342f6d136b333745e92d6bb24d6f814e2eba641b0247fe9426115cd0",
    endDate: "published",
    steps: [
      "Confirm that your Priority or Priority Private account qualifies for the salary offer. The bank treats new and existing clients differently.",
      "Receive qualifying salary for six consecutive months. New clients start the month after account opening; eligible existing clients with no transfer in 2026 must start within the campaign.",
      "Standard Chartered says the salary cashback will be credited by the end of the seventh month after the first salary credit.",
      "Check the effect of closing or changing your account. The salary clause does not state a separate post-payout salary clawback.",
    ],
  },
};

const normalise = (value: string) => value.trim().replace(/\s+/g, " ");

export function timelineTermsHash(offer: TimelineOffer): string {
  return createHash("sha256").update(JSON.stringify([
    offer.bankSlug,
    offer.sourceUrl,
    offer.validFrom.slice(0, 10),
    offer.validUntil.slice(0, 10),
    offer.requirements.map(normalise),
    normalise(offer.clawbackTerms),
  ])).digest("hex");
}

export function getSalaryTransferTimeline(offer: TimelineOffer): SalaryTransferTimeline | undefined {
  const campaign = Object.hasOwn(campaigns, offer.id) ? campaigns[offer.id] : undefined;
  if (!campaign || timelineTermsHash(offer) !== campaign.termsHash) return undefined;
  return { endDate: campaign.endDate, steps: campaign.steps };
}

export function getSalaryTransferTimelines(offers: readonly TimelineOffer[]): Record<string, SalaryTransferTimeline> {
  return Object.fromEntries(offers.flatMap((offer) => {
    const timeline = getSalaryTransferTimeline(offer);
    return timeline ? [[offer.id, timeline] as const] : [];
  }));
}
