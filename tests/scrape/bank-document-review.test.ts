import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { validateDocumentRegistry, validateRawDocument, reviewBankDocumentSources, type DocumentRegistry, type RawDocumentCapture } from '../../scripts/scrape/_bank-document-review.ts';
import { parseHsbcCardKfs, type PrimaryCardSource } from '../../scripts/scrape/_bank-parsers.ts';

const registry = (): DocumentRegistry => JSON.parse(readFileSync('scripts/scrape/bank-document-routes.registry.json', 'utf8'));
const sha = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function evidenceTexts() {
  const envelope = JSON.parse(readFileSync('tests/scrape/fixtures/2026-11-bank-document-recovery.json', 'utf8'));
  const decoded = gunzipSync(Buffer.from(envelope.data, 'base64'));
  assert.equal(decoded.length, envelope.decodedBytes);
  assert.equal(sha(decoded), envelope.decodedSha256);
  const sources = JSON.parse(decoded.toString('utf8')).sources;
  for (const source of sources) {
    assert.equal(sha(source.text), source.fixtureTextSha256);
    assert.notEqual(source.sourceTextSha256, source.fixtureTextSha256);
    assert.equal(source.representation, 'byte-masked-pdftotext-layout-excerpt');
    assert.equal(source.fixtureIsCompleteSource, false);
    assert.equal(source.captureReceipt.complete, true);
    assert.equal(source.captureReceipt.status, 200);
    if (source.id === 'enbd-kfs') {
      assert.doesNotMatch(source.text, /I\/We hereby|Emirates NBD Bank PJSC is licensed/);
    }
  }
  return Object.fromEntries(sources.map((source: { id: string; text: string }) => [source.id, source.text]));
}
function harnessCaptures(): RawDocumentCapture[] {
  const texts = evidenceTexts();
  // Curated issuer-table excerpts test parser scope. Both the PDF body and the
  // transport record's "full-text" hash below are explicitly synthetic for this
  // mechanical harness, NOT an authentic body, complete source or fresh capture.
  const body = Buffer.from('%PDF-synthetic-test-body-only\n');
  return registry().documents.map(document => ({ requestedUrl: document.url, finalUrl: document.url,
    status: 200, type: 'application/pdf', fetchedAt: '2026-11-07T00:00:00.000Z',
    complete: true, transportComplete: true, extractionComplete: true,
    contentUsability: 'readable-output', incompleteReasons: [],
    body, bodySha256: sha(body), text: texts[document.id as keyof typeof texts],
    textSha256: sha(texts[document.id as keyof typeof texts]), extraction: 'pdftotext-layout' }));
}

test('33 manual routes reference five unique documents and never activate paid collection', () => {
  const input = registry();
  assert.deepEqual(validateDocumentRegistry(input), []);
  assert.equal(input.documents.length, 5);
  assert.equal(input.cards.length, 33);
  assert.equal(input.cards.filter(card => card.bank === 'emirates-nbd').length, 31);
  assert.equal(input.cards.filter(card => card.numericPolicy === 'source-only-manual-hold').length, 3);
  assert.ok(input.cards.some(card => card.slug === 'emirates-nbd-manchester-united'));
  assert.equal(input.paidConfigChangesEnabled, false);
  assert.equal(input.paidMonitorChangesEnabled, false);
});

test('reuses exact parsers once per document: 28 ENBD, legacy ADIB and named HSBC reviews—not generic tier guesses', () => {
  const input = registry(), captures = harnessCaptures();
  const before = JSON.stringify(input);
  const result = reviewBankDocumentSources(input, captures);
  assert.equal(result.uniqueDocuments, 5);
  assert.equal(result.cards.filter(card => card.state === 'review-candidates-only').length, 30);
  for (const slug of ['emirates-nbd-diners-club', 'emirates-nbd-mastercard-platinum', 'emirates-nbd-u-by-emaar-infinite-emiratis']) {
    const card = result.cards.find(card => card.slug === slug)!;
    assert.equal(card.state, 'hold'); assert.deepEqual(card.observations, []);
  }
  for (const card of result.cards) {
    assert.equal(card.automaticMergeAllowed, false);
    assert.equal(card.sourceDatePromotionAllowed, false);
    assert.equal(card.financialFieldAcceptance, 'pending');
    assert.equal(Object.hasOwn(card, 'lastVerified'), false);
    assert.equal(Object.hasOwn(card, 'draft'), false);
    for (const observation of card.observations as Array<{ slug?: string; field: string }>) {
      if (observation.slug) assert.equal(observation.slug, card.slug);
      assert.ok(card.bank === 'hsbc'
        ? ['annualFee.amount', 'eligibility.minSalary', 'fxFee', 'interestRate.annual'].includes(observation.field)
        : ['joiningFee', 'annualFee'].includes(observation.field));
    }
  }
  assert.equal(JSON.stringify(input), before);
});

test('missing/duplicate/wrong-bank/missing-VAT documents fail closed without network or retry', () => {
  const input = registry();
  const missing = reviewBankDocumentSources(input, harnessCaptures().filter(source => !source.requestedUrl.includes('fees_charges')));
  assert.ok(missing.cards.filter(card => card.bank === 'emirates-nbd').every(card => card.state === 'hold' && !card.observations.length));
  const duplicate = harnessCaptures(); duplicate.push(duplicate[0]);
  assert.ok(reviewBankDocumentSources(input, duplicate).documents.some(doc => doc.errors.some(error => error.includes('found 2'))));
  const badBank = registry(); badBank.cards[0].documentIds = ['adib-kfs', 'adib-fees'];
  assert.throws(() => reviewBankDocumentSources(badBank, []), /Wrong-bank/);
  const noVat = registry(); noVat.cards[0].documentIds = ['enbd-kfs'];
  assert.ok(validateDocumentRegistry(noVat).some(error => error.includes('fee/VAT')));
  const extraUrl = registry(); extraUrl.documents[0].url = 'https://www.emiratesnbd.com.attacker.com/document.pdf';
  assert.ok(validateDocumentRegistry(extraUrl).some(error => error.includes('Unrecognised')));
  const role = registry(); role.documents[0].role = 'shared-fees-and-vat';
  assert.ok(validateDocumentRegistry(role).some(error => error.includes('role')));
});

test('HSBC PDF text representation is explicit on all four observations, with hashes and values unchanged', () => {
  const captures = harnessCaptures();
  const hsbcCapture = captures.find(capture => capture.requestedUrl.endsWith('/kfs-credit-cards.pdf'))!;
  const result = reviewBankDocumentSources(registry(), captures);
  const observations = result.cards.find(card => card.slug === 'hsbc-live-plus')!.observations as Array<{
    field: string; value: number; sourceRepresentation: string; captureMethod: string;
    sourceBodySha256: string; sourceTextSha256: string; capturedAt: string;
  }>;
  assert.deepEqual(observations.map(o => [o.field, o.value]), [
    ['annualFee.amount', 313.95], ['eligibility.minSalary', 10000], ['fxFee', 2.1], ['interestRate.annual', 44.28],
  ]);
  for (const observation of observations) {
    assert.equal(observation.sourceRepresentation, 'pdftotext-layout');
    assert.equal(observation.captureMethod, 'public-http-reader');
    assert.equal(observation.sourceBodySha256, hsbcCapture.bodySha256);
    assert.equal(observation.sourceTextSha256, hsbcCapture.textSha256);
    assert.equal(observation.capturedAt, hsbcCapture.fetchedAt);
  }
});

test('explicit PDF representation does not accept absent body identity or contradictory DOM capture metadata', () => {
  const capture = harnessCaptures().find(capture => capture.requestedUrl.endsWith('/kfs-credit-cards.pdf'))!;
  const source: PrimaryCardSource = { url: capture.requestedUrl, capturedAt: capture.fetchedAt,
    text: capture.text, sourceTextSha256: capture.textSha256, fixtureTextSha256: capture.textSha256,
    sourceBodySha256: capture.bodySha256, sourceRepresentation: 'pdftotext-layout',
    captureMethod: 'public-http-reader', firstLine: 1 };
  assert.equal(parseHsbcCardKfs(source, 'hsbc-live-plus').length, 4);
  for (const invalid of [
    { ...source, sourceBodySha256: null },
    { ...source, sourceBodySha256: 'not-a-sha256' },
    { ...source, captureMethod: 'normal-public-browser-ui' as const },
    { ...source, sourceSnapshotSha256: sha('unrelated DOM snapshot') },
    { ...source, text: source.text + '\nchanged' },
  ]) assert.deepEqual(parseHsbcCardKfs(invalid, 'hsbc-live-plus'), []);
});

test('complete raw PDF/text identity is required: an HTTP badge, excerpt or Firecrawl markdown is not enough', () => {
  const doc = registry().documents[0], good = harnessCaptures()[0];
  assert.deepEqual(validateRawDocument(doc, good), []);
  for (const partial of [
    { ...good, complete: false }, { ...good, transportComplete: false }, { ...good, extractionComplete: false },
    { ...good, status: 206 }, { ...good, type: 'text/html' }, { ...good, incompleteReasons: ['truncated'] },
    { ...good, body: Buffer.from('%PDF-modified') }, { ...good, text: good.text.slice(0, 200) },
    { ...good, finalUrl: 'https://www.emiratesnbd.com/login' }, { ...good, fetchedAt: '' },
    { ...good, body: Buffer.from('<html>shell</html>'), bodySha256: sha('<html>shell</html>') },
  ]) assert.ok(validateRawDocument(doc, partial).length);
});

test('changed/reordered/unsupported ENBD document columns stay on hold, not first-number-wins', () => {
  const sources = harnessCaptures();
  sources[0].text = sources[0].text.replace(/SHARE Private(\s+)SHARE Infinite/, 'SHARE Infinite$1SHARE Private');
  sources[0].textSha256 = sha(sources[0].text);
  const report = reviewBankDocumentSources(registry(), sources);
  assert.ok(report.cards.filter(card => card.bank === 'emirates-nbd').every(card => card.state === 'hold'));
});

test('paid scraper and monitor entry points never import the manual document registry/helper', () => {
  for (const file of ['scripts/scrape/enbd.ts', 'scripts/scrape/adib.ts', 'scripts/scrape/hsbc.ts', 'scripts/monitor/poll.mjs', 'scripts/monitor/setup.mjs']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /bank-document-routes|_bank-document-review/, file);
  }
});
