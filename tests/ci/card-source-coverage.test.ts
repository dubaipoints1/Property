import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCardSourceCoverage, loadCoverageInputs, publicHttpsProblem, renderCoverageMarkdown, MAINTENANCE_OWNER } from '../../scripts/ci/check-card-source-coverage.mjs';
import { NINETY_DAYS_MS, isStale } from '../../src/lib/verification.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AS_OF = '2026-11-14';
const sha = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const fresh = () => loadCoverageInputs(ROOT);
const audit = (input = fresh(), asOf = AS_OF) => auditCardSourceCoverage(input, { asOf });
const hasError = (report: ReturnType<typeof audit>, code: string) => report.errors.some((item: { code: string }) => item.code === code);

test('real catalogue: all slugs, including closed and unconfirmed profiles, have one explicit route', () => {
  const input = fresh();
  const before = sha(JSON.stringify(input.cards));
  const report = audit(input);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.rows.map((row: { slug: string }) => row.slug).sort(), Object.keys(input.cards).sort());
  assert.deepEqual(report.summary, {
    cards: 80, banks: 14, activeScrapers: 14, configuredScraperRoutes: 58, manualPrimaryRoutes: 22,
    configuredDocumentGaps: 32, routeDocumentGaps: 0, manualDocumentRoutes: 33, uniqueManualDocuments: 5,
    manualDocumentNumericHolds: 3, routeProductInventoryDifferences: 1, canonicalDocumentCandidates: 80, overdueSourceRecords: 0,
    cardsWithPendingFields: 80, errors: 0, warnings: 1,
  });
  assert.equal(report.rows.find((row: { slug: string }) => row.slug === 'emirates-nbd-manchester-united')?.applicationState, 'closed-to-new-applicants');
  assert.equal(report.rows.find((row: { slug: string }) => row.slug === 'fab-world-elite')?.applicationState, 'availability-unconfirmed');
  assert.ok(report.rows.every((row: { owner: string; fullSourceRead: string; reachability: string }) => row.owner === MAINTENANCE_OWNER
    && row.fullSourceRead === 'not performed in this audit' && row.reachability === 'not tested in this offline audit'));
  assert.equal(sha(JSON.stringify(input.cards)), before, 'audit cannot update card data or dates');
  assert.ok(renderCoverageMarkdown(report).includes('emirates-nbd-manchester-united'));
});

test('missing and duplicate routes are rejected, including dormant bank configs and manual/paid shadows', () => {
  const missing = fresh();
  missing.configs.adcb = missing.configs.adcb.slice(1);
  assert.ok(hasError(audit(missing), 'route-count'));
  const duplicate = fresh();
  duplicate.configs.adcb.push({ ...duplicate.configs.adcb[0] });
  assert.ok(hasError(audit(duplicate), 'route-count'));
  const shadow = fresh();
  const manual = shadow.manualRegistry.cards[0];
  shadow.configs.hsbc.push({ slug: manual.slug, urls: { product: manual.productUrl, kfs: manual.kfsUrl } });
  assert.ok(hasError(audit(shadow), 'route-count'));
  const dormant = fresh();
  dormant.configs['not-active'] = [{ slug: 'nonexistent-card', urls: { product: 'https://www.hsbc.ae/credit-cards/' } }];
  assert.ok(hasError(audit(dormant), 'unknown-route'));
  const removed = fresh();
  removed.activeBanks = removed.activeBanks.filter((bank: string) => bank !== 'adcb');
  assert.ok(hasError(audit(removed), 'inactive-scraper'));
  const noScript = fresh(); noScript.files.delete('scripts/scrape/adcb.ts');
  assert.ok(hasError(audit(noScript), 'missing-bank-scraper'));
});

test('bank identity is explicit; enbd alias is valid but mismatched canonical banks are rejected', () => {
  const input = fresh();
  input.cards['adcb-365-cashback'].bank = 'hsbc';
  const report = audit(input);
  assert.ok(hasError(report, 'route-bank'));
  assert.ok(hasError(report, 'source-url'));
  assert.ok(audit().rows.filter((row: { bank: string }) => row.bank === 'emirates-nbd').every((row: { structuralErrors: string[] }) => !row.structuralErrors.length));
});

test('URLs must be public HTTPS, credential-free, on explicit issuer domains or the exact Wio tenant', () => {
  for (const value of ['http://www.hsbc.ae/', 'https://username:password@www.hsbc.ae/', 'https://localhost/',
    'https://127.1/', 'https://[::1]/', 'https://10.0.0.1/', 'https://bank.local/', 'https://bank.internal/',
    'https://www.hsbc.ae:8443/', 'https://www.hsbc.ae/\npath', 'not a URL']) assert.ok(publicHttpsProblem(value), value);
  for (const value of ['https://www.hsbc.ae/', 'https://assets.ctfassets.net/l65m9bcr2nac/document.pdf']) assert.equal(publicHttpsProblem(value), null);
  const source = fresh(); source.cards['hsbc-live-plus'].sources.push('https://www.hsbc.ae.attacker.com/credit-cards');
  assert.ok(hasError(audit(source), 'source-url'));
  const wio = fresh(); wio.cards['wio-credit'].sources.push('https://assets.ctfassets.net/another-tenant/file.pdf');
  assert.ok(hasError(audit(wio), 'source-url'));
  const product = fresh(); product.configs.adcb[0].urls.product = 'https://192.168.1.1/product';
  assert.ok(hasError(audit(product), 'source-url'));
});

test('manual registry requires canonical mode, unique source identities and product/KFS fixture coverage', () => {
  const mode = fresh(); delete mode.cards['hsbc-cash-plus'].refreshMode;
  assert.ok(hasError(audit(mode), 'manual-mode'));
  const orphan = fresh(); orphan.manualRegistry.cards[0].slug = 'unknown-hsbc-card';
  assert.ok(hasError(audit(orphan), 'unknown-route'));
  const identity = fresh(); identity.manualRegistry.cards[0].sourceFixtureIds[0] = 'unknown-fixture';
  assert.ok(hasError(audit(identity), 'manual-source-identity'));
  assert.ok(hasError(audit(identity), 'manual-source-role'));
  const duplicate = fresh(); duplicate.manualRegistry.cards[0].sourceFixtureIds.push('hsbc-card-kfs');
  assert.ok(hasError(audit(duplicate), 'manual-fixture-ids'));
  const missingKfs = fresh(); missingKfs.manualRegistry.cards[0].kfsUrl = undefined;
  assert.ok(hasError(audit(missingKfs), 'source-url'));
});

test('manual parser, dependency and fixture byte hashes are enforced without executing parser modules', () => {
  for (const category of ['parser', 'dependency', 'fixture']) {
    const input = fresh(), manual = input.manualRegistry.cards[0];
    const file = category === 'parser' ? manual.parser.module : category === 'dependency' ? manual.parser.dependencies[0].path : manual.fixtures[0].path;
    input.files.set(file, Buffer.concat([input.files.get(file)!, Buffer.from('\nchanged')]));
    assert.ok(hasError(audit(input), 'pin-hash'), category);
  }
  const missing = fresh(); missing.files.delete(missing.manualRegistry.cards[0].parser.module);
  assert.ok(hasError(audit(missing), 'pin-missing'));
  const exportName = fresh(); exportName.manualRegistry.cards[0].parser.export = 'parseUnknownProduct';
  assert.ok(hasError(audit(exportName), 'parser-export'));
  const pathEscape = fresh(); pathEscape.manualRegistry.cards[0].parser.module = 'scripts/scrape/../../private-source.ts';
  assert.ok(hasError(audit(pathEscape), 'pin-format'));
});

test('relative runtime imports and fixture text require their own identity even if outer pin is renewed', () => {
  const input = fresh();
  const manual = input.manualRegistry.cards[0];
  const bytes = Buffer.concat([input.files.get(manual.parser.module)!, Buffer.from('\nimport "./unpinned.ts";\n')]);
  input.files.set(manual.parser.module, bytes);
  manual.parser.sha256 = sha(bytes);
  assert.ok(hasError(audit(input), 'parser-dependency-unpinned'));
  const fixtureInput = fresh();
  const entry = fixtureInput.manualRegistry.cards[0];
  const fixture = entry.fixtures.find((item: { path: string }) => item.path.includes('hsbc-new-products'))!;
  const content = JSON.parse(fixtureInput.files.get(fixture.path)!.toString('utf8'));
  content.sources[0].text += '\nChanged source text';
  const changed = Buffer.from(JSON.stringify(content));
  fixtureInput.files.set(fixture.path, changed); fixture.sha256 = sha(changed);
  assert.ok(hasError(audit(fixtureInput), 'fixture-text-hash'));
});

test('decoded compressed fixtures retain expansion-size and decoded-hash checks', () => {
  const input = fresh();
  const entry = input.manualRegistry.cards.find((item: { bank: string }) => item.bank === 'adib')!;
  const fixture = entry.fixtures[0];
  const envelope = JSON.parse(input.files.get(fixture.path)!.toString('utf8'));
  assert.equal(envelope.encoding, 'gzip+base64', 'test exercises the actual compressed evidence fixture');
  envelope.decodedSha256 = '0'.repeat(64);
  const changed = Buffer.from(JSON.stringify(envelope)); input.files.set(fixture.path, changed); fixture.sha256 = sha(changed);
  assert.ok(hasError(audit(input), 'fixture-content'));
});

test('age threshold matches the existing strict 90-day rule; selected review date cannot reset it', () => {
  const input = fresh();
  input.cards['hsbc-cash-plus'].lastVerified = '2026-08-10';
  const fixtureBoundary = '2026-11-08';
  input.cards['hsbc-cash-plus']._lastReviewed = fixtureBoundary;
  const boundary = audit(input, fixtureBoundary);
  const row = boundary.rows.find((item: { slug: string }) => item.slug === 'hsbc-cash-plus')!;
  assert.equal(boundary.reviewThresholdDays * 24 * 60 * 60 * 1000, NINETY_DAYS_MS);
  assert.equal(row.reviewThreshold, fixtureBoundary);
  assert.equal(row.sourceRecordAgeDays, 90);
  assert.equal(row.overdue, isStale('2026-08-10', new Date(fixtureBoundary)));
  assert.equal(row.overdue, false);
  const later = audit(input, '2026-11-09');
  assert.equal(later.rows.find((item: { slug: string }) => item.slug === 'hsbc-cash-plus')?.overdue, true);
  assert.ok(later.warnings.some((item: { code: string; slug: string }) => item.code === 'source-record-age' && item.slug === 'hsbc-cash-plus'));
  assert.deepEqual(later.errors, [], 'calendar ageing is not a structural build failure');
  assert.deepEqual(audit(input, '2030-01-01').errors, [], 'expired report dates never force fictional refresh dates');
  assert.throws(() => audit(input, '2026-02-30'), /real ISO/);
  const invalid = fresh(); invalid.cards['hsbc-cash-plus'].lastVerified = 'not-a-date';
  assert.ok(hasError(audit(invalid), 'source-record-date'));
});

test('missing dedicated document routes are warnings, not a claim that canonical documents or values are invalid', () => {
  const report = audit();
  const enbd = report.rows.find((row: { slug: string }) => row.slug === 'emirates-nbd-visa-infinite')!;
  assert.equal(enbd.route?.documentUrl, null);
  assert.ok(enbd.declaredDocumentUrls.length);
  assert.deepEqual(enbd.structuralErrors, []);
  assert.equal(enbd.manualDocuments?.documentsReady, true);
  assert.equal(enbd.manualDocuments?.mode, 'manual-primary-documents');
  assert.ok(enbd.pendingFields.length);
  const manual = report.rows.find((row: { slug: string }) => row.slug === 'hsbc-cash-plus')!;
  assert.equal(manual.route?.activeRegistry, null);
  assert.ok(manual.manualEvidence.length >= 2);
  assert.match(manual.fieldAcceptance, /not advanced/);
  const hsbc = report.rows.find((row: { slug: string }) => row.slug === 'hsbc-live-plus')!;
  assert.equal(hsbc.route?.productInCanonicalSources, false);
  assert.ok(report.warnings.some((item: { code: string; slug: string }) => item.code === 'route-product-inventory-differs' && item.slug === 'hsbc-live-plus'));
  assert.deepEqual(hsbc.structuralErrors, [], 'inventory differences do not prove a dead URL');
});

test('manual document coverage needs known-bank capture receipts and pinned curated excerpts; paid gaps remain explicit', () => {
  const pending = fresh(); pending.documentRegistry.documents[0].capture = null;
  const pendingReport = audit(pending);
  assert.equal(pendingReport.summary.routeDocumentGaps, 31);
  assert.equal(pendingReport.summary.configuredDocumentGaps, 32);
  assert.ok(pendingReport.warnings.some((item: { code: string }) => item.code === 'manual-document-capture-pending'));
  const unknown = fresh(); unknown.documentRegistry.cards[0].slug = 'unknown-card';
  assert.ok(hasError(audit(unknown), 'document-route-card'));
  const wrong = fresh(); wrong.documentRegistry.cards[0].bank = 'adib';
  assert.ok(hasError(audit(wrong), 'document-registry'));
  const duplicate = fresh(); duplicate.documentRegistry.documents.push({ ...duplicate.documentRegistry.documents[0] });
  assert.ok(hasError(audit(duplicate), 'document-registry'));
  const drift = fresh();
  const file = drift.documentRegistry.documents[0].capture.path;
  drift.files.set(file, Buffer.concat([drift.files.get(file)!, Buffer.from('\nhash drift')]));
  assert.ok(hasError(audit(drift), 'pin-hash'));
  const parser = fresh(); parser.documentRegistry.documents[0].parser.sha256 = '0'.repeat(64);
  assert.ok(hasError(audit(parser), 'pin-hash'));
  const role = fresh(); role.documentRegistry.documents[0].role = 'shared-fees-and-vat';
  assert.ok(hasError(audit(role), 'document-registry'));
  for (const change of [
    (source: any) => { source.fixtureIsCompleteSource = true; },
    (source: any) => { source.sourceTextSha256 = source.fixtureTextSha256; },
    (source: any) => { source.captureReceipt.complete = false; },
  ]) {
    const invalid = fresh();
    const fixturePath = invalid.documentRegistry.documents[0].capture.path;
    const envelope = JSON.parse(invalid.files.get(fixturePath)!.toString('utf8'));
    const content = JSON.parse(gunzipSync(Buffer.from(envelope.data, 'base64')).toString('utf8'));
    change(content.sources[0]);
    const decoded = Buffer.from(JSON.stringify(content));
    envelope.decodedBytes = decoded.length; envelope.decodedSha256 = sha(decoded);
    envelope.data = gzipSync(decoded).toString('base64');
    const changed = Buffer.from(JSON.stringify(envelope));
    invalid.files.set(fixturePath, changed);
    for (const doc of invalid.documentRegistry.documents) doc.capture.sha256 = sha(changed);
    assert.ok(hasError(audit(invalid), 'document-capture'), 'receipt/excerpt semantics survive renewed outer pins');
  }
  assert.ok(audit().rows.filter((row: { manualDocuments: { numericPolicy: string } | null }) => row.manualDocuments?.numericPolicy === 'source-only-manual-hold').every((row: { manualDocuments: { hold: string } }) => !!row.manualDocuments.hold));
});
