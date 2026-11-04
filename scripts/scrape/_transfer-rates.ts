// Charter §6: consume only small, reviewed primary-source excerpts with
// explicit conversion syntax. A new format must get a fixture and a test.
const INTEGER = String.raw`(?:[1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)`;
const POINTS = String.raw`(?:FAB(?: Al-Futtaim)? Rewards|Plus Points?|EI SmartMiles|Reward points|TPs)`;
const MILES = String.raw`(?:(?:Emirates )?Skywards Miles?|Etihad Guest Miles?|(?:Qatar Airways Privilege Club )?Avios|Mile)`;
const equivalence = new RegExp(
  String.raw`^(?:Minimum conversion:\s*)?(${INTEGER})\s+${POINTS}\s*(?:=|to|\|\s*→\s*\|)\s*(${INTEGER})\s+${MILES}\.?$`,
  "iu",
);
const tableRatio = new RegExp(String.raw`^(?:Emirates Skywards®?|Etihad Guest|Qatar Airways Privilege Club)\s*\|\s*(${INTEGER})\s*:\s*(${INTEGER})$`, "u");
const minimum = new RegExp(String.raw`^(?:minimum of\s+)?(${INTEGER})\s+(?:points|TPs)\.?$`, "i");
const bonvoyLimits = new RegExp(String.raw`^minimum of (${INTEGER}) and maximum of (${INTEGER}) Marriott Bonvoy points per day\.?$`, "i");
const bonus = new RegExp(String.raw`^(${INTEGER}) bonus Skywards Miles for every (${INTEGER}) points transferred$`, "i");

const positiveInteger = (token: string) => {
  const value = Number(token.replaceAll(",", ""));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

export function parseTransferRatio(excerpt: string): { input: number; output: number } | null {
  const match = excerpt.trim().match(equivalence) ?? excerpt.trim().match(tableRatio);
  if (!match) return null;
  const input = positiveInteger(match[1]);
  const output = positiveInteger(match[2]);
  return input && output ? { input, output } : null;
}

export function parseTransferMinimum(excerpt: string): number | null {
  const text = excerpt.trim();
  const match = text.match(minimum) ?? text.match(bonvoyLimits);
  if (match) return positiveInteger(match[1]);
  return text.startsWith("Minimum conversion:") ? parseTransferRatio(text)?.input ?? null : null;
}

export function parseTransferTiming(excerpt: string): "instant" | { workingDays: number } | { hours: number } | null {
  if (/^account (?:instantly|real-time)\.?$/i.test(excerpt.trim())) return "instant";
  const hourMatch = excerpt.trim().match(/^within ([1-9]\d*) hours?\.?$/i);
  if (hourMatch) {
    const hours = positiveInteger(hourMatch[1]);
    return hours ? { hours } : null;
  }
  const match = excerpt.trim().match(/^within ([1-9]\d*) working days?\.?$/i);
  const workingDays = match ? positiveInteger(match[1]) : null;
  return workingDays ? { workingDays } : null;
}

export function parseTransferBlockBonus(excerpt: string): { extraMiles: number; inputPoints: number } | null {
  const match = excerpt.trim().match(bonus);
  const extraMiles = match ? positiveInteger(match[1]) : null;
  const inputPoints = match ? positiveInteger(match[2]) : null;
  return extraMiles && inputPoints ? { extraMiles, inputPoints } : null;
}

export function parseTransferOfferRate(excerpt: string): number | null {
  const match = excerpt.trim().match(/^([1-9]\d?|100)% bonus Miles$/i);
  return match ? positiveInteger(match[1]) : null;
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function parseTransferOfferDate(excerpt: string): string | null {
  const match = excerpt.trim().match(/^(?:until )?(\d{1,2}) ([A-Za-z]+) (20\d{2})$/i);
  if (!match) return null;
  const month = months.findIndex((name) => name.toLowerCase() === match[2].toLowerCase()) + 1;
  if (!month) return null;
  const day = Number(match[1]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDate() === day && date.getUTCMonth() === month - 1 ? date.toISOString().slice(0, 10) : null;
}
