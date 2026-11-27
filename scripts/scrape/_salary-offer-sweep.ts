import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

// Independent offline replay of the 27 November 2026 issuer PDFs. The fixture
// contains only selected English fragments and their original pdftotext -layout
// line numbers. A new PDF/edition requires fresh evidence and explicit new pins.
const PINS = {
  "rakbank-nov-2026": [
    "https://www.rakbank.ae/globalassets/rakbank/all-pdfs/001---campaign/salary-transfer-cash-reward-promotion-terms-and-conditions-nov-2026.pdf",
    "ca0fb21d1880e91b9c4b6dbe22916d4899ecf5c4be234fe9475a62699e8b4162",
    "5ad7be8456e284a19e74f7ccfffab0cc88897c5bd23dc6b145cbe0da0df71d22",
    "9f7174ce6e8327c88cfb5c6089aa1c50529128c4ce7787a3d24c93e1f4145125",
  ],
  "mashreq-2026": [
    "https://www.mashreq.com/-/jssmedia/pdfs/neo/accounts-deposits/TnCs/2026/neo-salary-bonus-tnc-en-ar.ashx",
    "43ca6fc02066ca78549c813ec112aac980076765c0cdf49d8c1e0597992e795a",
    "fe6a2a03ee294d61f64852fe9a90e40be444381148930d1ed79adf13148697e5",
    "fe8926b675be4c362584534ca63e03daef610b2bb2e00e088ddbadfcb72280bf",
  ],
  "hsbc-premier-existing-2026": [
    "https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/premier-existing-to-bank-customers-salary-transfer-offer-tscs.pdf",
    "0c057950d71651c9585aa569ab54ae0062484437837ac2721890ae43170a07fb",
    "525a4b1a1e92e5682a191fa5b394ecbd6bba7439408d5fc2dde7b59357762a4d",
    "d357e7fd38f9ef085ca4eb0eecca336e4839b1dcb3a19e0d431138b700724a7a",
  ],
} as const;

export interface SalaryOfferSourceReceipt {
  id: string;
  sourceUrl: string;
  pdfSha256: string;
  layoutTextSha256: string;
  excerpts: ReadonlyArray<{ line: number; text: string }>;
}

type Band = { minSalary: number; maxSalary: number | null; rewardAmount: number };
const MONEY = `(${SOURCE_NUMBER})`;
const DATE = String.raw`(\d{1,2}(?:st|nd|rd|th)? [A-Za-z]+ \d{4})`;
const MONTHS = "January February March April May June July August September October November December".split(" ");

function matches(value: string, pattern: RegExp): RegExpMatchArray {
  const matched = value.match(pattern);
  if (!matched) throw new Error("Salary offer source clause no longer matches");
  return matched;
}

function integer(token: string): number {
  const amount = parseSourceNumber(token);
  if (amount === null || amount <= 0 || !Number.isSafeInteger(amount)) throw new Error("Invalid source number");
  return amount;
}

function date(token: string): string {
  const [, dayToken, label, yearToken] = matches(token, /^(\d{1,2})(?:st|nd|rd|th)? ([A-Za-z]+) (\d{4})$/);
  const [day, month, year] = [integer(dayToken), MONTHS.indexOf(label), integer(yearToken)];
  const result = new Date(Date.UTC(year, month, day));
  if (month < 0 || result.getUTCMonth() !== month || result.getUTCDate() !== day) throw new Error("Invalid source date");
  return result.toISOString().slice(0, 10);
}

function band(min: string, max: string | undefined, rewardAmount: number): Band {
  const result = { minSalary: integer(min), maxSalary: max === undefined ? null : integer(max), rewardAmount };
  if (result.maxSalary !== null && result.minSalary > result.maxSalary) throw new Error("Invalid salary band");
  return result;
}

export function parseSalaryOfferSweepSource(receipt: SalaryOfferSourceReceipt) {
  if (!Object.hasOwn(PINS, receipt.id)) return null;
  const id = receipt.id as keyof typeof PINS;
  const [sourceUrl, pdfHash, layoutHash, excerptHash] = PINS[id];
  const actualHash = createHash("sha256").update(JSON.stringify(receipt.excerpts)).digest("hex");
  if (receipt.sourceUrl !== sourceUrl || receipt.pdfSha256 !== pdfHash || receipt.layoutTextSha256 !== layoutHash || actualHash !== excerptHash) return null;

  try {
    const byLine = new Map(receipt.excerpts.map(({ line, text }) => [line, text.normalize("NFKC")]));
    const at = (...numbers: number[]) => numbers.map((number) => {
      const text = byLine.get(number);
      if (text === undefined) throw new Error(`Missing pinned source line ${number}`);
      return text;
    }).join(" ");
    if (id === "rakbank-nov-2026") {
      const [, start, end] = matches(at(7, 8), new RegExp(`^from ${DATE} to ${DATE} \\(both dates inclusive\\)$`));
      matches(at(24), /^individual conventional AED$/);
      const [, months, ordinaryMinimum, restrictedMinimum] = matches(at(27, 28, 29), new RegExp(`^transfer (\\d+) consecutive months’ salary of at least AED ${MONEY} per month AED ${MONEY} per month$`));
      const firstSalaryDaysForNew = integer(matches(at(32, 33), /^within (\d+) days from the date of opening$/)[1]);
      const [, lower, upper, reward] = matches(at(76), new RegExp(`^D ${MONEY} to D ${MONEY} D ${MONEY}$`));
      matches(at(30, 91), /^RAKempower Payroll solutions or RAKmore lowest salary$/);
      const range = new RegExp(`^D ${MONEY}(?: to D ${MONEY}| and above) D ${MONEY}$`);
      const bands = [band(lower, upper, integer(reward)), ...[[81, 80], [84, 83], [87, 86]].map(([row, cash]) => {
        const [, min, max, amount] = matches(at(row, cash), range);
        return band(min, max, integer(amount));
      })];
      if (bands[0].minSalary !== integer(restrictedMinimum) || bands[1].minSalary !== integer(ordinaryMinimum)) return null;
      const payoutDays = integer(matches(at(94, 95, 96), /^(\d+) days from: \(a\) the end of Promotion Period; or \(b\) the third consecutive months’ salary whichever is later$/)[1]);
      const disputeDays = integer(matches(at(113, 114), /^(\d+) calendar days conclusion of the Promotion Period$/)[1]);
      return { id, sourceUrl, validFrom: date(start), validUntil: date(end), qualificationMonths: integer(months), firstSalaryDaysForNew, payoutDays, disputeDays, bands, monthsToPayout: null };
    }
    if (id === "mashreq-2026") {
      const validFrom = date(matches(at(5), new RegExp(`^Effective ${DATE}$`))[1]);
      if (validFrom !== date(matches(at(16), new RegExp(`^first time, starting ${DATE} onwards$`))[1])) return null;
      matches(at(14), /^Mashreq NEO current or savings account$/);
      const earlyBirdDays = integer(matches(at(32), /^within (\d+) days of opening the first account$/)[1]);
      const months = integer(matches(at(48), /^(\d+) equal monthly instalments$/)[1]);
      const payoutDays = integer(matches(at(50), /^within (\d+) days of your first salary credit$/)[1]);
      const clawbackWindowMonths = integer(matches(at(78), /^two consecutive months during the (\d+) month bonus period$/)[1]);
      const row = new RegExp(`^${MONEY}(?: – ${MONEY}| and above) D ${MONEY} D ${MONEY}$`);
      const bands = [35, 37, 39, 41].map((n) => {
        const [, min, max, baseToken, earlyToken] = matches(at(n), row);
        const [base, early] = [integer(baseToken), integer(earlyToken)];
        return { ...band(min, max, base + early), base, early };
      });
      if (clawbackWindowMonths !== months || bands[0].minSalary !== integer(matches(at(18), new RegExp(`^D ${MONEY} or more$`))[1])) return null;
      return { id, sourceUrl, validFrom, validUntil: null, instalmentMonths: months, earlyBirdDays, payoutDays, clawbackWindowMonths, bands, monthsToPayout: months };
    }
    const [, start, end] = matches(at(3), new RegExp(`^${DATE} - ${DATE} \\(both dates inclusive\\)$`));
    const [, openMonth, openYear] = matches(at(29, 30), /^Premier customers who have opened their accounts before ([A-Za-z]+) (\d{4}) and who are not transferring their salaries already$/);
    const [, min, cash] = matches(at(48), new RegExp(`^HSBC Premier Transfer your salary of AED ${MONEY} or more AED ${MONEY}$`));
    const qualificationMonths = integer(matches(at(24), /^(\d+) consecutive calendar months$/)[1]);
    const [, payout, salaryOrdinal] = matches(at(57, 58), /^within (\d+) calendar will I receive the days after meeting all campaign conditions which is after the (\d+)(?:st|nd|rd|th) salary$/);
    if (integer(salaryOrdinal) !== qualificationMonths) return null;
    const retentionDays = integer(matches(at(61, 62), /^within (\d+) days of your first salary credit$/)[1]);
    const dormantMonths = integer(matches(at(40), /^dormant for more than (\d+) months$/)[1]);
    const editionDate = date(matches(at(88), new RegExp(`^Effective date is ${DATE}$`))[1]);
    return { id, sourceUrl, validFrom: date(start), validUntil: date(end), openedBefore: date(`1 ${openMonth} ${openYear}`), editionDate, qualificationMonths, payoutDays: integer(payout), retentionDays, dormantMonths, bands: [band(min, undefined, integer(cash))], monthsToPayout: null };
  } catch {
    return null;
  }
}
