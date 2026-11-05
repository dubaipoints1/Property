// Read-only, deterministic source audit. This is not a scraper or data writer.
// Input: `pdftotext -layout` output from the issuer KFS. Unknown/misaligned
// tables fail closed for editorial review instead of guessing a column.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HEADERS = ["Cashback Card", "Cashback+ Card", "Tamayaz Platinum", "Tamayaz World", "Tamayaz World Elite"];
const SALARY = "Eligibility Criteria – Min. Salary";

export function captureLivKfsProductTable(text) {
  const firstPage = String(text).split("\f")[0];
  if (!/\bJanuary 2026\b/.test(firstPage)) throw new Error("Liv KFS edition needs review");
  const sections = firstPage.split(/^Product Information\s*$/m);
  if (sections.length !== 2) throw new Error("Expected one Product Information section");
  const end = sections[1].split(/^Important Terms and Conditions\s*$/m);
  if (end.length !== 2) throw new Error("Expected one product-table boundary");
  return "January 2026\n\nProduct Information\n" + end[0].trim().split("\n").map((line) => line.trimEnd()).join("\n") + "\n\nImportant Terms and Conditions\n";
}

export function parseLivKfsProductTable(text) {
  const table = captureLivKfsProductTable(text);
  const lines = table.split("\n").map((line) => line.trim()).filter(Boolean);
  const row = (label) => {
    const matches = lines.filter((line) => line.startsWith(label));
    if (matches.length !== 1) throw new Error(`Expected one ${label} row`);
    const cells = matches[0].split(/\s{2,}/);
    if (cells.shift() !== label || cells.length !== HEADERS.length) throw new Error(`Misaligned ${label} columns`);
    return cells;
  };
  if (JSON.stringify(row("Product Type")) !== JSON.stringify(HEADERS)) throw new Error("Liv KFS column order needs review");
  const amount = (cell, allowFree = false) => {
    if (allowFree && cell === "Free for life") return 0;
    if (cell === "N/A") return null;
    if (!/^AED (?:[1-9]\d{0,2}(?:,\d{3})*|0)$/.test(cell)) throw new Error(`Unrecognised AED amount: ${cell}`);
    return Number(cell.slice(4).replaceAll(",", ""));
  };
  const salaries = row(SALARY).map((cell) => amount(cell));
  const joining = row("Joining Fee*").map((cell) => amount(cell, true));
  const renewal = row("Renewal Fee").map((cell) => amount(cell, true));
  return Object.fromEntries(["liv-cashback", "liv-cashback-plus"].map((slug, index) => {
    if (salaries[index] === null || joining[index] === null || renewal[index] === null) throw new Error("Cashback field is unavailable");
    return [slug, { minSalary: salaries[index], joiningFee: joining[index], annualFee: renewal[index] }];
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const capture = process.argv[2] === "--capture";
  const filename = process.argv[capture ? 3 : 2];
  if (!filename) throw new Error("Pass a pdftotext -layout text file; this tool never writes card data");
  const text = readFileSync(filename === "-" ? 0 : filename, "utf8");
  console.log(capture ? captureLivKfsProductTable(text).trimEnd() : JSON.stringify(parseLivKfsProductTable(text), null, 2));
}
