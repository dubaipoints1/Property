import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseHsbcLivePlusAge } from '../../scripts/scrape/_hsbc-live-plus-review.ts';
import { CardDataSchema } from '../../src/lib/cardsData.ts';
import type { PrimaryCardSource } from '../../scripts/scrape/_bank-parsers.ts';

const fixture = JSON.parse(readFileSync('tests/scrape/fixtures/2026-11-10-hsbc-live-plus-age.json', 'utf8'));
const source: PrimaryCardSource = fixture.source;
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const mutate = (text: string): PrimaryCardSource => ({ ...source, text, fixtureTextSha256: sha(text) });

test('Live+ age review parses only exact-product age tokens with original full-source line and hash pins', () => {
  assert.equal(sha(source.text), source.fixtureTextSha256);
  const fields = parseHsbcLivePlusAge(source);
  assert.deepEqual(fields.map(row => [row.field, row.value]), [['eligibility.minAge', 18], ['eligibility.maxAge', 65]]);
  for (const row of fields) {
    assert.equal(row.rawText, '- Be aged between 18 and 65');
    assert.equal(row.firstLine, 165);
    assert.equal(row.lastLine, 165);
    assert.equal(row.rawTextSha256, sha(row.rawText));
    assert.equal(source.text.split('\n')[row.firstLine - source.firstLine], row.rawText);
    assert.equal(row.sourceBodySha256, source.sourceBodySha256);
    assert.equal(row.sourceTextSha256, source.sourceTextSha256);
    assert.equal(row.capturedAt, fixture.receipt.fetchedAt);
  }
});

test('Live+ age parser refuses wrong product, missing/hash-drifted/ambiguous source and malformed age', () => {
  for (const invalid of [
    { ...source, url: source.url.replace('live-plus', 'cash-plus') },
    { ...source, url: source.url + '?product=cash-plus' },
    { ...source, sourceBodySha256: null },
    { ...source, sourceTextSha256: 'unknown' },
    { ...source, sourceRepresentation: 'pdftotext-layout' as const },
    { ...source, capturedAt: 'unknown' },
    { ...source, firstLine: 0 },
    { ...source, text: source.text.replace('18', '21') },
    mutate(source.text + '\n' + source.text),
    mutate(source.text.replace('Who can apply?', 'Other cardholders')),
    mutate(source.text.replace('Live+ Credit Card', 'Cash+ Credit Card')),
    mutate(source.text.replace('- Be aged between 18 and 65', '- Be aged between 18 and 65\n- Be aged between 21 and 65')),
    mutate(source.text.replace('between 18 and 65', 'between 18, and 65')),
    mutate(source.text.replace('between 18 and 65', 'between 65 and 18')),
  ]) assert.deepEqual(parseHsbcLivePlusAge(invalid), []);
});

test('Live+ age acceptance keeps salary, rate and reward holds, source/scrape dates and all costs unchanged', () => {
  const cards = JSON.parse(readFileSync('src/data/cards.json', 'utf8'));
  const card = cards['hsbc-live-plus'];
  assert.equal(CardDataSchema.safeParse(card).success, true);
  for (const row of parseHsbcLivePlusAge(source)) {
    const key = row.field.split('.')[1];
    assert.equal(card.eligibility[key], row.value);
    assert.equal(card._provenance[row.field], 'editor-corrected');
    const { field, value, ...evidence } = row;
    assert.deepEqual(card._fieldEvidence[field], [evidence]);
  }
  assert.equal(card._provenance.eligibility, 'needs-review');
  assert.equal(card._provenance.interestRate, 'needs-review');
  assert.equal(card._provenance.earnRates, 'needs-review');
  assert.equal(card.eligibility.minSalary, 5000);
  assert.equal(card.lastVerified, '2026-10-02');
  assert.equal(card._lastScraped, '2026-09-17');
  assert.equal(card._lastReviewed, '2026-11-10');
  assert.equal(card.annualFee.amount, 313.95);
  assert.equal(card.fxFee, 2.1);
  assert.equal(card.joiningFee, undefined);
  assert.match(card._dataIssues.eligibility, /salary conflict remains unresolved/);
});
