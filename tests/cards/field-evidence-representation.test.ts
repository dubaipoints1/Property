import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CardDataSchema } from '../../src/lib/cardsData.ts';

// Synthetic schema metadata only. This test does not verify a source capture,
// accept a financial field, modify cards.json or claim a new review date.
const record = JSON.parse(readFileSync('src/data/cards.json', 'utf8'))['hsbc-live-plus'];
const existing = record._fieldEvidence.fxFee[0];
const withEvidence = (evidence: Record<string, unknown>) => CardDataSchema.safeParse({
  ...record, _fieldEvidence: { regressionOnly: [{ ...existing, ...evidence }] },
});

test('field evidence accepts explicit PDF text with retained body identity and preserves HTML/DOM cases', () => {
  assert.equal(withEvidence({ sourceRepresentation: 'pdftotext-layout', captureMethod: 'public-http-reader',
    sourceExtraction: 'pdftotext-layout' }).success, true);
  assert.equal(withEvidence({ sourceRepresentation: 'http-decoded-response-body', captureMethod: 'public-http-reader' }).success, true);
  assert.equal(withEvidence({ sourceRepresentation: 'visible-main-dom-and-accessibility-snapshot',
    captureMethod: 'normal-public-browser-ui', sourceBodySha256: null,
    sourceSnapshotSha256: 'a'.repeat(64), sourceScope: 'Synthetic visible main DOM only' }).success, true);
});

test('PDF evidence rejects arbitrary representations, missing identity and DOM/HTTP contradictions', () => {
  for (const change of [
    { sourceRepresentation: 'some-pdf-string' },
    { sourceRepresentation: 'pdftotext-layout', sourceBodySha256: null },
    { sourceRepresentation: 'pdftotext-layout', sourceBodySha256: 'not-a-sha256' },
    { sourceRepresentation: 'pdftotext-layout', captureMethod: 'normal-public-browser-ui' },
    { sourceRepresentation: 'pdftotext-layout', sourceSnapshotSha256: 'a'.repeat(64) },
    { sourceRepresentation: 'pdftotext-layout', sourceExtraction: 'http-decoded-html-excerpt' },
    { sourceRepresentation: 'visible-main-dom-and-accessibility-snapshot', captureMethod: 'normal-public-browser-ui',
      sourceSnapshotSha256: 'a'.repeat(64) },
  ]) assert.equal(withEvidence(change).success, false, JSON.stringify(change));
});
