// Offline, exact-product review only. No network, writes or eligibility approval.
import { createHash } from 'node:crypto';
import type { BankFieldEvidence, PrimaryCardSource } from './_bank-parsers.ts';
import { parseSourceNumber } from './_lib.ts';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const PRODUCT_URL = 'https://www.hsbc.ae/credit-cards/products/live-plus/';

/** Age is separable from the unresolved conditional income/KFS conflict.
 * This function emits only the two age observations, never a salary, a
 * whole-eligibility approval, a fee, a monthly rate or a refresh date. */
export function parseHsbcLivePlusAge(source: PrimaryCardSource): BankFieldEvidence[] {
  if (source.url !== PRODUCT_URL
    || source.sourceRepresentation !== 'http-decoded-response-body'
    || source.captureMethod !== 'public-http-reader'
    || !Number.isInteger(source.firstLine) || source.firstLine < 1
    || !Number.isFinite(Date.parse(source.capturedAt))
    || !/^[a-f0-9]{64}$/.test(source.sourceTextSha256)
    || !/^[a-f0-9]{64}$/.test(source.sourceBodySha256 ?? '')
    || hash(source.text) !== source.fixtureTextSha256) return [];

  const blocks = [...source.text.matchAll(/^###\r?\nWho can apply\?\r?\n([\s\S]*?)^###\r?\nFees and rates$/gm)];
  if (blocks.length !== 1) return [];
  const block = blocks[0];
  if (!block[0].includes("You don't need an HSBC bank account to apply for a Live+ Credit Card, but you'll need to:")) return [];
  const matches = [...block[0].matchAll(/^- Be aged between (\d+) and (\d+)$/gm)];
  if (matches.length !== 1) return [];
  const age = matches[0];
  const minimum = parseSourceNumber(age[1]), maximum = parseSourceNumber(age[2]);
  if (minimum === null || maximum === null || minimum >= maximum) return [];
  const offset = block.index! + age.index!;
  const line = source.firstLine + source.text.slice(0, offset).split('\n').length - 1;
  const location = {
    parserId: 'hsbc/live-plus-product-age/v1', productScope: 'HSBC Live+ Credit Card; product eligibility age only',
    unit: 'years' as const, vatTreatment: 'not-applicable' as const,
    sourceUrl: source.url, capturedAt: source.capturedAt,
    sourceTextSha256: source.sourceTextSha256, sourceBodySha256: source.sourceBodySha256,
    sourceRepresentation: 'http-decoded-response-body' as const, captureMethod: 'public-http-reader' as const,
    firstLine: line, lastLine: line, rawText: age[0], rawTextSha256: hash(age[0]),
  };
  return [
    { field: 'eligibility.minAge', value: minimum, ...location },
    { field: 'eligibility.maxAge', value: maximum, ...location },
  ];
}
