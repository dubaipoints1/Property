import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

// Exact document identity and receipt pins. This is an offline replay for
// editor-owned MDX, not a fetcher, data updater, or monitoring route.
const PINS = {
  "adib-arrive-2026": [
    "https://www.adib.ae/-/media/project/adib/adibsite/docs/personal/new-to-country/adib-arrive-terms-and-conditions.pdf",
    276404, "b093e340cb30cd893262be5fb8b7255a714b919c7a4c63d393703765fece70b4",
    "f0015af2e16888d42932b1ef7abd31aab52f51165f4215f0ddf30711fecc7819",
    "48c0f5c814a083a2e36e6e94ee746fbd9b0e0de957b47e4f8cedeb427ad23194",
  ],
  "mashreq-al-islami-neo-2026": [
    "https://www.mashreqalislami.com/-/jssmedia/pdfs/mai/neo/kfs-tnc/Early-Bird-TNCS.ashx",
    477524, "e0d17670b124f1f8027e7b036821ae57a64857092bdbde27ecad0dd9f5f97c8c",
    "8e2309e3b54d4e1ca946d4edbfe87cc8906754df2d92882aadae0a750809e02a",
    "6127d07c74378598a0865f6c9deeda5bf0082cbe14e2e4e5931c4fd85144a6de",
  ],
  "fab-islamic-amana-2026": [
    "https://www.bankfab.com/-/media/fab-uds/islamic-banking/promotions/2026/20-percent-salary-transfer-cashback/fab-islamic-terms-and-conditions-20-percent-salary-transfer-campaign-en.pdf?view=1",
    130689, "ab30ed5438998d7fb2ac7b0c10592bb6ab4666959ea2b94a2a0d36348811c576",
    "a26414364ba415a220138504190357b7865cddbd6da7a9c21e1b97218eea2206",
    "f0c366ad03f644c98fa6cb15af88817a2daf8d98d6bc8325cad18e96761b8f65",
  ],
} as const;

export interface SalaryThreeRouteReceipt {
  id: string;
  sourceUrl: string;
  retrievedAt: string;
  bytes: number;
  pdfSha256: string;
  layoutTextSha256: string;
  excerpts: ReadonlyArray<{ anchor: string; text: string }>;
  dateWitness?: { sourceUrl: string; retrievedAt: string; bytes: number; bodySha256: string; text: string };
}

type Band = { minSalary: number; maxSalary: number | null; rewardAmount: number };
const MONEY = `(${SOURCE_NUMBER})`;
const MONTHS = "January February March April May June July August September October November December".split(" ");

function match(text: string, pattern: RegExp) {
  const result = text.match(pattern);
  if (!result) throw new Error("Missing expected salary-offer witness");
  return result;
}

function number(value: string) {
  const parsed = parseSourceNumber(value);
  if (parsed === null || parsed <= 0 || !Number.isFinite(parsed)) throw new Error("Invalid source number");
  return parsed;
}

function integer(value: string) {
  const parsed = number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("Not a whole source number");
  return parsed;
}

function iso(day: string, month: number, year: string) {
  if (!Number.isInteger(month) || month < 0 || month > 11) throw new Error("Invalid calendar month");
  const d = integer(day);
  const y = integer(year);
  const date = new Date(Date.UTC(y, month, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== month || date.getUTCDate() !== d) throw new Error("Invalid calendar date");
  return date.toISOString().slice(0, 10);
}

function namedDate(day: string, month: string, year: string) {
  return iso(day, MONTHS.indexOf(month), year);
}

function validBands(bands: Band[]) {
  return bands.every((band, i) => band.maxSalary === null ? i === bands.length - 1
    : band.maxSalary >= band.minSalary && band.maxSalary + 1 === bands[i + 1]?.minSalary);
}

export function parseSalaryThreeRouteSource(receipt: SalaryThreeRouteReceipt) {
  if (!Object.hasOwn(PINS, receipt.id)) return null;
  const id = receipt.id as keyof typeof PINS;
  const [url, bytes, pdf, layout, evidence] = PINS[id];
  const receiptHash = createHash("sha256").update(JSON.stringify([receipt.excerpts, receipt.dateWitness ?? null])).digest("hex");
  if (receipt.sourceUrl !== url || receipt.bytes !== bytes || receipt.pdfSha256 !== pdf
    || receipt.layoutTextSha256 !== layout || receiptHash !== evidence) return null;

  try {
    const source = new Map(receipt.excerpts.map(({ anchor, text }) => [anchor, text.normalize("NFKC").replace(/\s+/gu, " ").trim()]));
    if (source.size !== receipt.excerpts.length) return null;
    const at = (...anchors: string[]) => anchors.map((anchor) => {
      const value = source.get(anchor);
      if (value === undefined) throw new Error(`Missing salary-offer anchor ${anchor}`);
      return value;
    }).join(" ");
    const sourceUrl = receipt.sourceUrl;
    const open = { validUntil: null, monthsToPayout: null } as const;

    if (id === "adib-arrive-2026") {
      const [, dd, mm, yy] = match(receipt.dateWitness?.text ?? "", /^Abu Dhabi, UAE – (\d{1,2}) ([A-Za-z]+) (\d{4}):$/);
      const [, residencyEvidenceDays] = match(at("p1:l8", "p1:l9", "p1:l10", "p1:l11"), /^• Be a non-UAE national; • Hold an Emirates ID and\/or residency visa issued within the previous (\d+) days of onboarding; and • Provide evidence of recent relocation to the UAE through$/);
      match(at("p2:t1:r1:c2", "p2:t1:r1:c5", "p2:t1:r1:c6"), /^Salary Transfer Qualifier Salary Transfer Welcome Prize Maximum Total Welcome Prize Amounts$/);
      match(at("p2:l44", "p2:l45", "p2:l46", "p2:l47"), /^3\. Minimum Three consecutive monthly salaries must be transferred .+ to be eligible for the payment of the Welcome Prize\.$/);
      const [, establishDays] = match(at("p7:l33", "p7:l34", "p7:l35"), /salary transfer amount and\/or qualifying deposit amount must be established within ninety \((\d+)\) calendar days from the customer's onboarding date$/);
      const [, tenureWindow] = match(at("p7:l29", "p7:l30"), /^3\.2 The Qualification Period shall be limited to the first twelve \((\d+)\) months following the customer's onboarding date\.$/);
      const [, payoutDays] = match(at("p3:l16", "p3:l17", "p3:l18"), /^7\. The Welcome Prize specified above will be transferred to customers’ accounts within \((\d+)\) ninety calendar days from the date on which the third qualifying salary is transferred\.$/);
      match(at("p7:l19", "p7:l20"), /^2\.5 The customer's account must remain active and in good standing at the time of assessment and payment\.$/);
      const salary = new RegExp(`^\\u20c3 ${MONEY}(?: - ${MONEY}| and above)$`, "u");
      const amount = new RegExp(`^\\u20c3 ${MONEY}$`, "u");
      const bands = ["Mass", "Rise", "Gold", "Diamond"].map((segment, i) => {
        const prefix = `p2:t1:r${i + 2}:c`;
        if (at(`${prefix}1`) !== segment) throw new Error("ADIB segment row changed");
        const [, floor, ceiling] = match(at(`${prefix}2`), salary);
        const [, cash] = match(at(`${prefix}5`), amount);
        const [, total] = match(at(`${prefix}6`), amount);
        if (integer(cash) >= integer(total)) throw new Error("Salary and combined rewards are not separated");
        return { minSalary: integer(floor), maxSalary: ceiling === undefined ? null : integer(ceiling), rewardAmount: integer(cash) };
      });
      if (!validBands(bands)) return null;
      return { id, sourceUrl, ...open, validFrom: namedDate(dd, mm, yy), startBasis: "announcement", tenureMonths: 3,
        residencyEvidenceDays: integer(residencyEvidenceDays), establishDays: integer(establishDays), tenureWindow: integer(tenureWindow),
        payoutDays: integer(payoutDays), creditCardRequired: false, bands } as const;
    }

    if (id === "mashreq-al-islami-neo-2026") {
      const [, dd, mm, yy] = match(receipt.dateWitness?.text ?? "", /^\*Applicable for accounts with first salary credited on or after (\d{1,2}) ([A-Za-z]+) (\d{4})\.$/);
      match(at("p1:l8", "p1:l9", "p1:l10"), /new banking relationship with Mashreq by opening a Mashreq Al Islami - NEO current and or savings account/);
      const [, min, qualificationDays] = match(at("p2:l23", "p2:l24"), new RegExp(`^b\\. A minimum salary transfer of AED ${MONEY} should be done within the first (\\d+) days of first account opening\\.$`));
      const [, tenure] = match(at("p3:l1", "p3:l2"), /period of twelve \((\d+)\) months/);
      const [, payoutDays] = match(at("p3:l10", "p3:l11"), /within ninety \((\d+)\) days from the date of the first salary transfer/);
      const [, missedMonths, clawbackPeriod] = match(at("p3:l12", "p3:l13"), /for two \((\d+)\) consecutive months during the (\d+) months period/);
      match(at("p8:l6", "p8:l7"), /^e\. This Promotion is not in conjunction with any other promotion held by the Bank or any of its subsidiaries\.$/);
      if (tenure !== clawbackPeriod) return null;
      const re = new RegExp(`^${MONEY}(?: - ${MONEY}| and above) ${MONEY} ${MONEY} ${MONEY}$`);
      const bands = [32, 33, 34, 35].map((line) => {
        const [, floor, ceiling, base, early, total] = match(at(`p2:l${line}`), re);
        if (integer(base) + integer(early) !== integer(total)) throw new Error("MAI salary total mismatch");
        return { minSalary: integer(floor), maxSalary: ceiling === undefined ? null : integer(ceiling), rewardAmount: integer(total) };
      });
      if (!validBands(bands) || bands[0].minSalary !== integer(min)) return null;
      return { id, sourceUrl, ...open, validFrom: namedDate(dd, mm, yy), startBasis: "first-salary cohort",
        tenureMonths: integer(tenure), qualificationDays: integer(qualificationDays), payoutDays: integer(payoutDays),
        missedMonths: integer(missedMonths), creditCardRequired: false, bands } as const;
    }

    const [, ddStart, mmStart, yyStart, ddEnd, mmEnd, yyEnd] = match(at("p1:l9", "p1:l10", "p1:l11"), /^• Start Date: (\d{2})\/(\d{2})\/(\d{4}) • End Date: (\d{2})\/(\d{2})\/(\d{4}) • Both dates are inclusive\.$/);
    const [, rate, spend, monthlyCap, totalCap, tenure] = match(at("p1:l3", "p1:l4", "p1:l5", "p1:l6"),
      new RegExp(`^Eligible customers will earn ${MONEY}% cashback on their monthly salary credit when they transfer their salary to FAB Islamic and spend ${MONEY}% of their monthly salary\\. The cashback is capped at a maximum of AED ${MONEY} per month, with a maximum total cashback of AED ${MONEY} over (\\d+) months\\. The total cashback over 12 months equals to 20% of a month’s salary, if customer$`));
    const [, salaryHistoryMonths, min] = match(at("p1:l14", "p1:l15"), new RegExp(`^salary transfer to FAB in the preceding (\\d+) months and a minimum monthly salary of AED ${MONEY}\\.$`));
    match(at("p1:l22", "p1:l23", "p1:l41", "p1:l42"), /must obtain a new FAB Islamic credit card during the campaign period to be eligible for the cashback o Spend: Spend at least 20% of their monthly salary using a new FAB Islamic Credit Card opened during the campaign period\.$/);
    match(at("p2:l26", "p2:l27", "p2:l28"), /^Examples of qualifying cashbacks at different salary levels: Monthly Salary \(AED\) Spend Target \(AED\) Monthly Cashback Total 12 months \(AED\) \(AED\)$/);
    match(at("p2:l22"), /^amounts are rounded down to the nearest full AED\. No fils will be paid out\.$/);
    const [, payoutDays] = match(at("p2:l14", "p2:l15", "p2:l16"), /within (\d+) calendar days following the end of the month in which the salary deposit is credited to the account\./);
    const example = new RegExp(`^${MONEY}\\+? ${MONEY} ${MONEY} ${MONEY}$`);
    const rateBasisPoints = Math.round(number(rate) * 100);
    const maxMonth = integer(monthlyCap);
    const fullTermMonths = integer(tenure);
    const maxTotal = integer(totalCap);
    if (maxMonth * fullTermMonths !== maxTotal) return null;
    const examples = [29, 30, 31, 32, 33, 34].map((line) => {
      const [, salary, spendTarget, monthly, total] = match(at(`p2:l${line}`), example);
      const minSalary = integer(salary);
      const expected = Math.min(Math.floor(minSalary * rateBasisPoints / 10_000), maxMonth);
      if (expected !== integer(monthly) || expected * fullTermMonths !== integer(total)
        || minSalary * integer(spend) !== integer(spendTarget) * 100 || integer(total) > maxTotal) {
        throw new Error("FAB illustration does not reproduce");
      }
      return { minSalary, rewardAmount: integer(total) };
    });
    const bands = examples.map((entry, i) => ({ ...entry, maxSalary: examples[i + 1] ? examples[i + 1].minSalary - 1 : null }));
    if (bands[0].minSalary !== integer(min) || !validBands(bands)) return null;
    return { id, sourceUrl, monthsToPayout: null, validFrom: iso(ddStart, integer(mmStart) - 1, yyStart),
      startBasis: "campaign dates", validUntil: iso(ddEnd, integer(mmEnd) - 1, yyEnd),
      tenureMonths: fullTermMonths, salaryHistoryMonths: integer(salaryHistoryMonths),
      payoutDays: integer(payoutDays), rateBasisPoints, spendPercent: integer(spend), monthlyCap: maxMonth,
      totalCap: maxTotal, creditCardRequired: true, illustrationOnly: true, bands } as const;
  } catch {
    return null;
  }
}
