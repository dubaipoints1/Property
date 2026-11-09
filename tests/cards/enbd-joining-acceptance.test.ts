import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { parseEnbdKfsFees } from '../../scripts/scrape/_enbd-refresh.ts';
import { CardDataSchema } from '../../src/lib/cardsData.ts';

const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const rows = [
  ['emirates-nbd-darna-select-visa', 'Darna Select', 3, 15, 16],
  ['emirates-nbd-lulu-247-titanium', 'Lulu 247 Titanium', 4, 15, 16],
  ['emirates-nbd-noon-one', 'noon One', 5, 15, 16],
  ['emirates-nbd-priority-banking-visa-infinite', 'Priority Banking Infinite', 0, 12, 13],
  ['emirates-nbd-share-visa-signature', 'SHARE Signature', 6, 12, 13],
  ['emirates-nbd-u-by-emaar-family', 'UBE Family', 0, 18, 19],
  ['emirates-nbd-voyager-world', 'Voyager World', 2, 12, 13],
] as const;
const cards = JSON.parse(readFileSync('src/data/cards.json', 'utf8'));
const envelope = JSON.parse(readFileSync('tests/scrape/fixtures/2026-11-bank-document-recovery.json', 'utf8'));
const decoded = gunzipSync(Buffer.from(envelope.data, 'base64'));
assert.equal(sha(decoded), envelope.decodedSha256);
const source = JSON.parse(decoded.toString('utf8')).sources.find((s: { id: string }) => s.id === 'enbd-kfs');
const parsed = parseEnbdKfsFees(source.text);
assert.equal(parsed.status, 'parsed');

for (const [slug, name, column, firstLine, lastLine] of rows) {
  test(`${slug}: explicit named Free cell supports only the accepted joining fee`, () => {
    assert.equal(parsed.status, 'parsed');
    if (parsed.status !== 'parsed') return;
    const observation = parsed.fees.find(row => row.slug === slug && row.field === 'joiningFee');
    assert.ok(observation);
    assert.equal(observation.column, column);
    assert.equal(observation.sourceToken, 'Free');
    assert.equal(observation.amount, 0);
    const card = cards[slug];
    assert.equal(CardDataSchema.safeParse(card).success, true);
    assert.deepEqual(card.joiningFee, { amount: observation.amount, currency: 'AED' });
    assert.equal(card._provenance.joiningFee, 'editor-confirmed');
    const [evidence] = card._fieldEvidence.joiningFee;
    assert.equal(evidence.parserId, 'enbd/parseEnbdKfsFees/08-2026');
    assert.equal(evidence.productScope, `${name}; joining fee; zero-based column ${column}; literal Free`);
    assert.equal(evidence.unit, 'AED');
    assert.equal(evidence.vatTreatment, 'not-applicable');
    assert.equal(evidence.sourceUrl, source.url);
    assert.equal(evidence.sourceTextSha256, source.sourceTextSha256);
    assert.equal(evidence.sourceBodySha256, source.sourceBodySha256);
    assert.equal(evidence.capturedAt, '2026-11-08T15:42:28.252Z');
    assert.equal(evidence.sourceRepresentation, 'pdftotext-layout');
    assert.equal(evidence.sourceExtraction, 'pdftotext-layout');
    assert.equal(evidence.captureMethod, 'public-http-reader');
    assert.equal(evidence.firstLine, firstLine);
    assert.equal(evidence.lastLine, lastLine);
    assert.equal(evidence.rawText, observation.span.rawText);
    assert.equal(evidence.rawTextSha256, sha(evidence.rawText));
    assert.equal(evidence.sourceEndByte - evidence.sourceStartByte, Buffer.byteLength(evidence.rawText));
  });
}

test('a zero joining fee does not erase the separate renewal tariff or product waiver', () => {
  const priority = cards['emirates-nbd-priority-banking-visa-infinite'];
  assert.equal(priority.annualFee.amount, 1575);
  assert.equal(priority.annualFeeWaiver.year_one_waived, true);
  assert.match(priority.annualFeeWaiver.notes, /Priority Banking/);
  const voyager = cards['emirates-nbd-voyager-world'];
  assert.equal(voyager.annualFee.amount, 0);
  assert.notEqual(voyager._provenance.annualFee, 'scraped');
  // Parsed standard tariff is evidence, not authority to overwrite an offer.
  if (parsed.status === 'parsed') {
    assert.equal(parsed.fees.find(row => row.slug === 'emirates-nbd-voyager-world' && row.field === 'annualFee')?.amount, 315);
  }
});
