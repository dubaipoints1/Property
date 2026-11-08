#!/usr/bin/env node
/** Offline inventory/maintenance guard. Never fetches, executes parsers or writes data. */
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { validateDocumentRegistry } from '../scrape/_bank-document-policy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DAY_MS = 24 * 60 * 60 * 1000;
const HASH = /^[a-f0-9]{64}$/;
const BANK_TO_SCRAPER = { 'emirates-nbd': 'enbd' };
// Explicit issuer identity, not a rule that every bank must use *.ae.
const BANK_DOMAINS = {
  adcb: ['adcb.com'], adib: ['adib.ae', 'adib.com'], cbd: ['cbd.ae'],
  citi: ['citibank.ae'], dib: ['dib.ae'], 'emirates-islamic': ['emiratesislamic.ae'],
  'emirates-nbd': ['emiratesnbd.com'], fab: ['bankfab.com'], hsbc: ['hsbc.ae'],
  liv: ['liv.me'], mashreq: ['mashreq.com'], rakbank: ['rakbank.ae'],
  'standard-chartered': ['sc.com'], wio: ['wio.io'],
};
export const MAINTENANCE_OWNER = 'business-realestate-editor';

export function publicHttpsProblem(value) {
  if (typeof value !== 'string' || !value || /[\s\u0000-\u001f\u007f]/u.test(value)) return 'missing or non-canonical URL';
  let url;
  try { url = new URL(value); } catch { return 'invalid URL'; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return 'HTTPS without credentials or non-standard ports required';
  const host = url.hostname;
  if (isIP(host) || host.includes(':') || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(host)
      || /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion|arpa)$/i.test(host)) return 'public DNS hostname required';
  return null;
}

function issuerProblem(value, bank) {
  const problem = publicHttpsProblem(value);
  if (problem) return problem;
  const url = new URL(value);
  if ((BANK_DOMAINS[bank] ?? []).some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return null;
  // Wio's published documents use one Contentful tenant, not arbitrary CDN paths.
  if (bank === 'wio' && url.hostname === 'assets.ctfassets.net' && url.pathname.startsWith('/l65m9bcr2nac/')) return null;
  return `host is not an explicitly recognised source for bank ${bank}`;
}

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const isoDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

/** Reads only repository fixtures/configuration. Missing files remain auditable errors. */
export function loadCoverageInputs(root = ROOT) {
  const readJson = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
  const cards = readJson('src/data/cards.json');
  const activeBanks = readJson('scripts/scrape/banks.registry.json').banks;
  const configs = Object.fromEntries(readdirSync(path.join(root, 'scripts/scrape/banks')).filter(f => f.endsWith('.urls.json')).sort()
    .map(file => [file.replace(/\.urls\.json$/, ''), readJson(`scripts/scrape/banks/${file}`)]));
  const manualRegistry = readJson('scripts/scrape/manual-primary.registry.json');
  const documentRegistry = readJson('scripts/scrape/bank-document-routes.registry.json');
  const files = new Map();
  const fileErrors = new Map();
  const paths = new Set(manualRegistry.cards.flatMap(entry => [entry.parser?.module,
    ...(entry.parser?.dependencies ?? []).map(item => item.path), ...(entry.fixtures ?? []).map(item => item.path)]));
  for (const bank of activeBanks) paths.add(`scripts/scrape/${bank}.ts`);
  for (const doc of documentRegistry.documents) {
    if (doc.parser) for (const file of [doc.parser.module, ...doc.parser.dependencies.map(pin => pin.path)]) paths.add(file);
    if (doc.capture) paths.add(doc.capture.path);
  }
  for (const file of paths) {
    if (typeof file !== 'string' || path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) continue;
    try {
      const resolved = realpathSync(path.join(root, file));
      if (!resolved.startsWith(realpathSync(root) + path.sep)) throw new Error('path resolves outside repository');
      const prefix = file.startsWith('scripts/scrape/') ? 'scripts/scrape' : 'tests/scrape/fixtures';
      if (!resolved.startsWith(realpathSync(path.join(root, prefix)) + path.sep)) throw new Error(`path resolves outside ${prefix}`);
      files.set(file, readFileSync(resolved));
    } catch (error) { fileErrors.set(file, error.message); }
  }
  return { cards, activeBanks, configs, manualRegistry, documentRegistry, files, fileErrors,
    canonicalSha256: sha(readFileSync(path.join(root, 'src/data/cards.json'))),
    verificationSource: readFileSync(path.join(root, 'src/lib/verification.ts'), 'utf8') };
}

/** Pure audit over loaded bytes; date-only warnings never become structural failures. */
export function auditCardSourceCoverage(input, { asOf = new Date().toISOString().slice(0, 10) } = {}) {
  if (!isoDate(asOf)) throw new Error('asOf must be a real ISO YYYY-MM-DD date');
  const { cards, activeBanks, configs, manualRegistry, documentRegistry, files, fileErrors = new Map() } = input;
  const errors = [], warnings = [], routes = new Map();
  const add = (severity, code, slug, detail) => (severity === 'error' ? errors : warnings).push({ code, slug, detail });
  const error = (code, slug, detail) => add('error', code, slug, detail);
  const warn = (code, slug, detail) => add('warning', code, slug, detail);
  const thresholdMatch = input.verificationSource.match(/export const NINETY_DAYS_MS\s*=\s*(\d+)\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000\s*;/);
  const thresholdDays = thresholdMatch ? Number(thresholdMatch[1]) : null;
  if (!thresholdDays || !Number.isSafeInteger(thresholdDays)) error('threshold-contract', null, 'Unsupported src/lib/verification.ts threshold; update this offline reader deliberately');
  if (!Array.isArray(activeBanks) || new Set(activeBanks).size !== activeBanks.length) error('bank-registry', null, 'Active bank registry must be a unique array');
  if (manualRegistry.version !== 1 || manualRegistry.refreshMode !== 'manual-primary' || !Array.isArray(manualRegistry.cards)) error('manual-registry', null, 'Unsupported manual-primary registry');
  for (const bank of activeBanks) {
    if (!Object.hasOwn(configs, bank)) error('missing-bank-config', null, bank);
    if (!files.has(`scripts/scrape/${bank}.ts`)) error('missing-bank-scraper', null, `${bank}: scraper entry module is not present inside scripts/scrape`);
  }
  const pushRoute = route => {
    if (!cards[route.slug]) error('unknown-route', route.slug, route.location);
    const list = routes.get(route.slug) ?? []; list.push(route); routes.set(route.slug, list);
  };
  for (const [scraper, entries] of Object.entries(configs)) {
    if (!Array.isArray(entries)) { error('bank-config', null, `${scraper}: expected array`); continue; }
    for (const entry of entries) pushRoute({ ...entry, kind: 'configured-scraper', scraper,
      bank: Object.entries(BANK_TO_SCRAPER).find(([, value]) => value === scraper)?.[0] ?? scraper,
      productUrl: entry.urls?.product, kfsUrl: entry.urls?.kfs,
      location: `scripts/scrape/banks/${scraper}.urls.json`, active: activeBanks.includes(scraper) });
  }
  for (const entry of manualRegistry.cards ?? []) pushRoute({ ...entry, kind: 'manual-primary', active: false,
    location: 'scripts/scrape/manual-primary.registry.json' });

  function checkUrl(url, bank, slug, role) {
    const problem = issuerProblem(url, bank);
    if (problem) error('source-url', slug, `${role}: ${problem}`);
  }
  function pinned(pin, prefix, slug) {
    if (!pin || typeof pin.path !== 'string' || !pin.path.startsWith(prefix + '/') || pin.path.includes('\\')
        || pin.path.split('/').includes('..') || !HASH.test(pin.sha256 ?? '')) {
      error('pin-format', slug, `Expected safe ${prefix} path and SHA-256`); return null;
    }
    const bytes = files.get(pin.path);
    if (!bytes) { error('pin-missing', slug, `${pin.path}: ${fileErrors.get(pin.path) ?? 'not loaded'}`); return null; }
    if (sha(bytes) !== pin.sha256) { error('pin-hash', slug, `Hash drift: ${pin.path}`); return null; }
    return bytes;
  }
  function checkManual(route, card) {
    const { slug } = route;
    if (card.refreshMode !== 'manual-primary') error('manual-mode', slug, 'Canonical refreshMode must explicitly be manual-primary');
    const parser = route.parser ?? {};
    const parserBytes = pinned({ path: parser.module, sha256: parser.sha256 }, 'scripts/scrape', slug);
    if (!/^parse[A-Z][A-Za-z0-9]*$/.test(parser.export ?? '') || (parserBytes && !new RegExp(`export function ${parser.export}\\(`).test(parserBytes.toString('utf8')))) error('parser-export', slug, 'Declared parser function export not found');
    if (!Array.isArray(parser.dependencies)) error('parser-dependencies', slug, 'Explicit dependency pins required');
    const modulePaths = [parser.module, ...(parser.dependencies ?? []).map(item => item.path)];
    if (new Set(modulePaths).size !== modulePaths.length) error('parser-dependencies', slug, 'Duplicate parser dependency');
    for (const dependency of parser.dependencies ?? []) pinned(dependency, 'scripts/scrape', slug);
    for (const file of modulePaths) {
      const source = files.get(file)?.toString('utf8') ?? '';
      for (const match of source.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)["'](\.[^"']+)["']/g)) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
        if (!modulePaths.includes(target)) error('parser-dependency-unpinned', slug, `${file} -> ${target}`);
      }
    }
    const fixtureSources = [];
    if (!Array.isArray(route.fixtures) || !route.fixtures.length) error('manual-fixtures', slug, 'Pinned fixture sources required');
    if (new Set((route.fixtures ?? []).map(item => item.path)).size !== route.fixtures?.length) error('manual-fixtures', slug, 'Duplicate fixture path');
    for (const fixture of route.fixtures ?? []) {
      const bytes = pinned(fixture, 'tests/scrape/fixtures', slug);
      if (!bytes) continue;
      try {
        let document = JSON.parse(bytes.toString('utf8'));
        if (document.encoding === 'gzip+base64') {
          if (!Number.isSafeInteger(document.decodedBytes) || document.decodedBytes < 1 || document.decodedBytes > 8_000_000) throw new Error('Unsafe fixture expansion size');
          const decoded = gunzipSync(Buffer.from(document.data, 'base64'), { maxOutputLength: document.decodedBytes });
          if (decoded.length !== document.decodedBytes || sha(decoded) !== document.decodedSha256) throw new Error('Decoded fixture identity mismatch');
          document = JSON.parse(decoded.toString('utf8'));
        }
        if (!Array.isArray(document.sources)) throw new Error('Missing sources array');
        fixtureSources.push(...document.sources.map(source => ({ ...source, fixture: fixture.path })));
      } catch (caught) { error('fixture-content', slug, `${fixture.path}: ${caught.message}`); }
    }
    const ids = route.sourceFixtureIds;
    if (!Array.isArray(ids) || ids.length < 2 || new Set(ids).size !== ids.length) error('manual-fixture-ids', slug, 'Unique product and KFS fixture IDs required');
    const selected = [];
    for (const id of ids ?? []) {
      const matches = fixtureSources.filter(source => source.id === id);
      if (matches.length !== 1) { error('manual-source-identity', slug, `${id}: expected one pinned source, found ${matches.length}`); continue; }
      const source = matches[0]; selected.push(source);
      checkUrl(source.url, route.bank, slug, `fixture ${id}`);
      if (typeof source.text !== 'string' || !source.text || !HASH.test(source.fixtureTextSha256 ?? '') || sha(source.text) !== source.fixtureTextSha256) error('fixture-text-hash', slug, `Text identity mismatch: ${id}`);
    }
    for (const role of ['productUrl', 'kfsUrl']) if (!selected.some(source => source.url === route[role])) error('manual-source-role', slug, `${role} is not present in selected pinned evidence`);
    return selected.map(source => ({ id: source.id, url: source.url, fixture: source.fixture,
      capturedAt: source.capturedAt ?? null, representation: source.representation ?? 'not declared in fixture' }));
  }

  const manualDocuments = [];
  if (!documentRegistry) error('document-registry', null, 'Explicit manual document registry required');
  else {
    for (const detail of validateDocumentRegistry(documentRegistry)) error('document-registry', null, detail);
    for (const doc of documentRegistry.documents ?? []) {
      const before = errors.length;
      checkUrl(doc.url, doc.bank, null, `manual document ${doc.id}`);
      const parser = doc.parser;
      if (parser) {
        const bytes = pinned({ path: parser.module, sha256: parser.sha256 }, 'scripts/scrape', null);
        if (!/^parse[A-Z][A-Za-z0-9]*$/.test(parser.export ?? '') || (bytes && !new RegExp(`export function ${parser.export}\\(`).test(bytes.toString('utf8')))) error('document-parser', null, doc.id);
        const modulePaths = [parser.module, ...(parser.dependencies ?? []).map(item => item.path)];
        if (new Set(modulePaths).size !== modulePaths.length) error('document-parser', null, `${doc.id}: duplicate dependency`);
        for (const dependency of parser.dependencies ?? []) pinned(dependency, 'scripts/scrape', null);
        for (const moduleFile of modulePaths) for (const match of (files.get(moduleFile)?.toString('utf8') ?? '').matchAll(/(?:from\s+|import\s*(?:\(\s*)?)["'](\.[^"']+)["']/g)) {
          if (!modulePaths.includes(path.posix.normalize(path.posix.join(path.posix.dirname(moduleFile), match[1])))) error('document-parser-dependency', null, doc.id);
        }
      } else if (doc.id !== 'enbd-fees') error('document-parser', null, `${doc.id}: missing declared parser`);
      let source = null;
      if (!doc.capture) warn('manual-document-capture-pending', null, doc.id);
      else {
        const bytes = pinned(doc.capture, 'tests/scrape/fixtures', null);
        if (bytes) try {
          let parsed = JSON.parse(bytes.toString('utf8'));
          if (parsed.encoding === 'gzip+base64') {
            if (!Number.isSafeInteger(parsed.decodedBytes) || parsed.decodedBytes < 1 || parsed.decodedBytes > 8_000_000) throw new Error('Unsafe decoded fixture size');
            const decoded = gunzipSync(Buffer.from(parsed.data, 'base64'), { maxOutputLength: parsed.decodedBytes });
            if (decoded.length !== parsed.decodedBytes || sha(decoded) !== parsed.decodedSha256) throw new Error('Decoded fixture hash/size mismatch');
            parsed = JSON.parse(decoded.toString('utf8'));
          }
          const matches = (parsed.sources ?? []).filter(item => item.id === doc.capture.sourceId);
          if (matches.length !== 1) throw new Error('Missing/duplicate exact document fixture identity');
          source = matches[0];
          const receipt = source.captureReceipt;
          if (source.url !== doc.url || source.finalUrl !== doc.url || source.fixtureIsCompleteSource !== false
            || source.representation !== 'byte-masked-pdftotext-layout-excerpt' || source.firstLine !== 1 || source.firstByte !== 0
            || !HASH.test(source.sourceBodySha256 ?? '') || !HASH.test(source.sourceTextSha256 ?? '')
            || typeof source.text !== 'string' || !source.text.trim() || sha(source.text) !== source.fixtureTextSha256
            || source.fixtureTextSha256 === source.sourceTextSha256 || Number.isNaN(Date.parse(source.capturedAt))) throw new Error('Altered or mislabelled curated document excerpt');
          if (!receipt || receipt.version !== 1 || receipt.status !== 200 || receipt.type !== 'application/pdf'
            || receipt.complete !== true || receipt.transportComplete !== true || receipt.extractionComplete !== true
            || receipt.contentUsability !== 'readable-output' || !Array.isArray(receipt.incompleteReasons) || receipt.incompleteReasons.length
            || receipt.bodySha256 !== source.sourceBodySha256 || receipt.fullTextSha256 !== source.sourceTextSha256
            || receipt.fullTextBytes !== Buffer.byteLength(source.text) || !Number.isSafeInteger(receipt.fullBodyBytes) || receipt.fullBodyBytes < 5
            || receipt.workflowUrl !== doc.capture.captureRun || receipt.rawBodyAndFullTextIndependentlyCompared !== true) throw new Error('Incomplete/altered private full-capture receipt');
          const lines = source.text.split('\n'), retained = new Set();
          let previousEnd = 0;
          if (!Array.isArray(source.retainedLineRanges) || !source.retainedLineRanges.length) throw new Error('Curated factual excerpt ranges required');
          for (const range of source.retainedLineRanges) {
            if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger)
              || range[0] <= previousEnd || range[1] < range[0] || range[1] > lines.length) throw new Error('Invalid curated excerpt ranges');
            for (let n = range[0]; n <= range[1]; n++) retained.add(n);
            previousEnd = range[1];
          }
          if (lines.some((line, i) => !retained.has(i + 1) && line.trim())) throw new Error('Unmasked text outside curated factual ranges');
          const factualBytes = lines.reduce((total, line) => total + Buffer.byteLength(line.trim()), 0);
          if (factualBytes > 20_000 || factualBytes > receipt.fullTextBytes * 0.4) throw new Error('Document fixture is not a minimal curated excerpt');
        } catch (caught) { error('document-capture', null, `${doc.id}: ${caught.message}`); }
      }
      manualDocuments.push({ id: doc.id, bank: doc.bank, url: doc.url, role: doc.role,
        captureState: source && errors.length === before ? 'reviewed-capture-receipt-and-excerpt' : 'pending-or-invalid',
        capturedAt: source?.capturedAt ?? null, parser: parser?.export ?? 'source-only fee/VAT review; no numeric parser' });
    }
    for (const route of documentRegistry.cards ?? []) {
      if (!cards[route.slug] || cards[route.slug].bank !== route.bank) error('document-route-card', route.slug, 'Unknown card or wrong-bank manual document route');
      if (cards[route.slug]?.refreshMode === 'manual-primary') error('document-route-card', route.slug, 'Do not replace the separate 17 manual-primary maintenance routes');
    }
  }

  const rows = [];
  for (const [slug, card] of Object.entries(cards).sort(([a], [b]) => a.localeCompare(b))) {
    const ownRoutes = routes.get(slug) ?? [];
    if (ownRoutes.length !== 1) error('route-count', slug, `Expected exactly one route, found ${ownRoutes.length}`);
    const route = ownRoutes[0];
    const documentMaintenance = documentRegistry?.cards?.find(item => item.slug === slug);
    const documentSources = (documentMaintenance?.documentIds ?? []).map(id => manualDocuments.find(doc => doc.id === id)).filter(Boolean);
    const documentsReady = !!documentMaintenance && documentSources.length === documentMaintenance.documentIds.length
      && documentSources.every(doc => doc.captureState === 'reviewed-capture-receipt-and-excerpt');
    if (!BANK_DOMAINS[card.bank]) error('bank-identity', slug, `Bank identity not declared: ${card.bank}`);
    if (!Array.isArray(card.sources) || !card.sources.length) error('canonical-sources', slug, 'At least one canonical source URL required');
    for (const url of card.sources ?? []) checkUrl(url, card.bank, slug, 'canonical source');
    if (card.applyUrl) checkUrl(card.applyUrl, card.bank, slug, 'canonical product/apply URL');
    if (card.kfsUrl) checkUrl(card.kfsUrl, card.bank, slug, 'canonical declared KFS/fee URL');
    let manualEvidence = [];
    if (route) {
      if (route.bank !== card.bank) error('route-bank', slug, `${route.bank} route does not match canonical ${card.bank}`);
      checkUrl(route.productUrl, card.bank, slug, 'maintenance product URL');
      if (!(card.sources ?? []).includes(route.productUrl)) warn('route-product-inventory-differs', slug, 'Maintenance product URL differs from canonical source inventory; redirect/current content not tested');
      if (route.kfsUrl) checkUrl(route.kfsUrl, card.bank, slug, 'maintenance declared KFS/fee URL');
      else if (!documentsReady) warn('route-document-gap', slug, 'No dedicated configured document URL or reviewed receipt/excerpt manual document route');
      if (route.kind === 'manual-primary') {
        checkUrl(route.kfsUrl, card.bank, slug, 'manual KFS URL');
        manualEvidence = checkManual(route, card);
      } else {
        if (!route.active) error('inactive-scraper', slug, `${route.scraper} is not an active scraper`);
        if (card.refreshMode === 'manual-primary') error('manual-mode', slug, 'Canonical manual-primary profile routed through paid scraper configuration');
      }
    }
    if (!isoDate(card.lastVerified)) error('source-record-date', slug, 'Invalid lastVerified date');
    if (card._lastReviewed != null && !isoDate(card._lastReviewed)) error('field-review-date', slug, 'Invalid _lastReviewed date');
    const sourceAgeDays = isoDate(card.lastVerified) ? (Date.parse(asOf) - Date.parse(card.lastVerified)) / DAY_MS : null;
    const reviewThreshold = sourceAgeDays !== null && thresholdDays ? new Date(Date.parse(card.lastVerified) + thresholdDays * DAY_MS).toISOString().slice(0, 10) : null;
    const overdue = sourceAgeDays !== null && thresholdDays ? sourceAgeDays > thresholdDays : null;
    if (sourceAgeDays !== null && sourceAgeDays < 0) warn('future-source-record', slug, 'Recorded lastVerified is later than report reference date; do not claim current verification');
    if (overdue) warn('source-record-age', slug, `Source-record age is over existing ${thresholdDays}-day UI threshold; requires editorial review, not a build failure`);
    const pendingFields = Object.entries(card._provenance ?? {}).filter(([, value]) => value === 'needs-review').map(([key]) => key).sort();
    const issueFields = Object.keys(card._dataIssues ?? {}).filter(key => key !== 'reviewScope').sort();
    const declaredDocumentUrls = [...new Set([card.kfsUrl, ...(card.sources ?? []).filter(url => /\.pdf(?:[?#]|$)|(?:kfs|fees|charges|schedule)/i.test(url))].filter(Boolean))];
    rows.push({ slug, bank: card.bank,
      applicationState: card.discontinuedForNewApplicants ? 'closed-to-new-applicants' : card.applicationAvailability === 'unconfirmed' ? 'availability-unconfirmed' : 'not-flagged-unavailable',
      route: route ? { kind: route.kind, location: route.location, productUrl: route.productUrl ?? null,
        documentUrl: route.kfsUrl ?? null, productInCanonicalSources: (card.sources ?? []).includes(route.productUrl),
        activeRegistry: route.kind === 'configured-scraper' ? route.active : null } : null,
      owner: MAINTENANCE_OWNER, ownerBasis: 'Managing Editor assignment, 2026-11-08; not evidence of a completed review',
      sourceRecordDate: card.lastVerified ?? null, sourceRecordAgeDays: sourceAgeDays,
      selectedFieldReviewDate: card._lastReviewed ?? null, reviewThreshold, overdue,
      declaredDocumentUrls, canonicalSourceUrls: card.sources ?? [], manualEvidence,
      manualDocuments: documentMaintenance ? { mode: documentRegistry.mode, sources: documentSources,
        numericPolicy: documentMaintenance.numericPolicy, hold: documentMaintenance.hold ?? null, documentsReady } : null,
      pendingFields, issueFields,
      reachability: 'not tested in this offline audit', fullSourceRead: 'not performed in this audit',
      fieldAcceptance: 'not advanced; retain canonical field-level evidence and pending holds',
      structuralErrors: [] });
  }
  for (const row of rows) row.structuralErrors = errors.filter(item => item.slug === row.slug).map(item => item.code);
  return { version: 1, asOf, canonicalSha256: input.canonicalSha256 ?? null,
    reviewThresholdDays: thresholdDays, reviewThresholdBasis: 'src/lib/verification.ts; strict age > NINETY_DAYS_MS; UTC date-only report',
    summary: { cards: rows.length, banks: new Set(rows.map(row => row.bank)).size, activeScrapers: activeBanks.length,
      configuredScraperRoutes: rows.filter(row => row.route?.kind === 'configured-scraper').length,
      manualPrimaryRoutes: rows.filter(row => row.route?.kind === 'manual-primary').length,
      configuredDocumentGaps: rows.filter(row => row.route && !row.route.documentUrl).length,
      routeDocumentGaps: rows.filter(row => row.route && !row.route.documentUrl && !row.manualDocuments?.documentsReady).length,
      manualDocumentRoutes: rows.filter(row => row.manualDocuments).length,
      uniqueManualDocuments: manualDocuments.length,
      manualDocumentNumericHolds: rows.filter(row => row.manualDocuments?.numericPolicy === 'source-only-manual-hold').length,
      routeProductInventoryDifferences: rows.filter(row => row.route && !row.route.productInCanonicalSources).length,
      canonicalDocumentCandidates: rows.filter(row => row.declaredDocumentUrls.length).length,
      overdueSourceRecords: rows.filter(row => row.overdue).length,
      cardsWithPendingFields: rows.filter(row => row.pendingFields.length).length,
      errors: errors.length, warnings: warnings.length }, manualDocuments, stagedProposals: documentRegistry?.stagedProposals ?? [], errors, warnings, rows };
}

const cell = value => String(value ?? 'not declared').replaceAll('|', '\\|').replaceAll('\n', ' ');
const link = (label, url) => url ? `[${label}](${url})` : 'not declared';

export function renderCoverageMarkdown(report) {
  const s = report.summary;
  return `# Card source and maintenance coverage — ${report.asOf}\n\n`
    + `Offline structural audit: **${s.cards} canonical cards**, ${s.banks} bank identities, ${s.activeScrapers} active scraper configurations; **${s.configuredScraperRoutes} configured-scraper + ${s.manualPrimaryRoutes} manual-primary** routes. ${s.errors} structural errors. Canonical cards.json SHA-256: \`${report.canonicalSha256}\`.\n\n`
    + `## Scope and limits\n\n`
    + `This checker fetches nothing, executes no numeric parser and spends no credits. It changes no card value, source date, monitor target or public page. Product URL syntax/issuer checks do not establish current reachability. Supplemental documents carry reviewed receipts for complete private PDF captures on 8 November and relevant sanitised, byte-masked factual excerpts. Full original PDF bodies and extracted texts remain private. CI checks receipt metadata, parser pins and the different excerpt hash; it does not reread or recompute full private body/text hashes. Those receipts are not a whole-card verification or financial-field acceptance.\n\n`
    + `Maintenance owner **${MAINTENANCE_OWNER}** is assigned to every row by the Managing Editor on 2026-11-08 under the existing bank/card section mandate. This is a maintenance assignment, not a claim that a person checked every field. No per-card named human is inferred. Escalation and scheduling remain with the Managing Editor.\n\n`
    + `Review threshold = existing lastVerified source-record date + ${report.reviewThresholdDays} days, from src/lib/verification.ts. The UI flags strict age > ${report.reviewThresholdDays} days. Dates below are the **90-day source-record age review threshold, not whole-card validity, a new freshness promise or an automatic paid-refresh schedule**. The report uses midnight UTC on the as-of date; a row becomes over-threshold strictly after its threshold instant. Calendar ageing is a warning only; it cannot make structural CI fail. _lastReviewed concerns selected field review and never replaces lastVerified.\n\n`
    + `Configured-scraper means a slug is in an active bank URL configuration, not that a paid monitor contains that product, a collection succeeded or a refresh was accepted. The 17 manual-primary profiles retain their separate existing maintenance route. The new **manual-primary-documents** supplement is offline-only and never imported by paid scrapers or monitor provisioning. A declared KFS/fee URL or filename candidate alone does not prove complete field support.\n\n`
    + `## Findings and next action\n\n`
    + `- ${s.configuredDocumentGaps} configured paid routes still have no dedicated document URL. ${s.manualDocumentRoutes} cards now have an explicit supplemental manual-document route across ${s.uniqueManualDocuments} deduplicated PDFs, including HSBC Live+ whose paid “KFS” URL is a charges explainer rather than the actual KFS. **${s.routeDocumentGaps} cards lack both a configured document URL and a reviewed capture-receipt/excerpt manual-document route.** This closes maintenance routing, not any pending financial fact or freshness claim. No paid source/target/cadence was added.\n`
    + `- ${s.manualDocumentNumericHolds} ENBD variants remain source-only manual holds: Diners Club, Mastercard Platinum and UBE Infinite for Emiratis. A generic tier cannot supply their named fees. The other 28 ENBD routes and legacy ADIB Cashback use existing exact-column parsers for review candidates only; HSBC uses its named KFS section. Neither candidates nor a document's successful capture may automatically alter canonical fields or dates.\n`
    + `- ${s.routeProductInventoryDifferences} maintenance product URLs differ from the canonical source inventory: ${report.rows.filter(row => row.route && !row.route.productInCanonicalSources).map(row => `${row.slug}: ${link('configured route', row.route.productUrl)}; ${link('canonical first source', row.canonicalSourceUrls[0])}`).join('; ') || 'none'}. Fresh HSBC captures show two reachable pages with their own canonicals, not a dead link or an alias to the product page. A preferred-product substitution is staged separately; paid configuration/monitor targets remain unchanged here.\n`
    + `- ${s.cardsWithPendingFields} cards retain one or more needs-review provenance fields. These are not cured by a valid route, a recent source-record date or this audit. All pending fields are listed below.\n`
    + `- ${s.overdueSourceRecords} source records are over the age threshold as of ${report.asOf}. Prioritise any over-threshold record, availability-unconfirmed profile and unresolved financial field; obtain a fresh authorised free primary capture when needed, run the pinned deterministic parser offline, reconcile accepted fields and record the actual reviewed scope.\n`
    + `- The ${s.activeScrapers} active scraper configurations are the current registry, not the older charter/state memo's count of 12. Their live health, credit recovery and external monitor targets are separate checks.\n\n`
    + `## Deduplicated manual document evidence\n\n`
    + `Curated factual excerpt and complete-capture receipt fixture: tests/scrape/fixtures/2026-11-bank-document-recovery.json. Private raw PDF bodies/full texts, hashes and complete flags were independently compared with ${link('free source-reader run', 'https://github.com/dubaipoints1/Property/actions/runs/42496136382')}; that manual comparison is recorded, not repeated by CI. Excerpts retain parser headers/tables/VAT anchors and preserve source byte/line positions while masking unrelated text. Their hashes intentionally differ from the full-source hashes. No paid collection was used. Parser pins are checked structurally here; synthetic transport unit tests exercise these excerpts, whereas the separate real private-archive helper run validates full body/text identity. Both keep financial acceptance pending.\n\n`
    + `| Document | Role | Captured UTC | State | Existing parser / review limit |\n|---|---|---|---|---|\n`
    + report.manualDocuments.map(doc => `| ${link(doc.id, doc.url)} | ${cell(doc.role)} | ${cell(doc.capturedAt)} | ${doc.captureState} | ${cell(doc.parser)} |`).join('\n')
    + `\n\n`
    + `## Every canonical card\n\n`
    + `Owner for every row: **${MAINTENANCE_OWNER}**, as assigned above. “source / field review” preserves both different recorded dates. “configured” does not certify collection; “manual” does not promise automatic refresh.\n\n`
    + `| Card / state | Bank / route | Product route | Paid document route | Supplemental manual documents / numeric scope | Canonical document candidates | Source / field review | Age / review threshold / overdue | Pins |\n|---|---|---|---|---|---|---|---|---|\n`
    + report.rows.map(row => `| ${cell(row.slug)}; ${row.applicationState} | ${cell(row.bank)}; ${row.route?.kind ?? 'MISSING'} | ${link(row.route?.productInCanonicalSources === false ? 'product — inventory differs' : 'product', row.route?.productUrl)} | ${link('document', row.route?.documentUrl)} | ${row.manualDocuments ? row.manualDocuments.sources.map(doc => link(doc.id, doc.url)).join(', ') + '; ' + row.manualDocuments.numericPolicy + (row.manualDocuments.documentsReady ? '; pinned record' : '; pending capture') : 'not needed for this supplement'} | ${row.declaredDocumentUrls.map((url, i) => link(`D${i + 1}`, url)).join(', ') || 'none declared'} | ${cell(row.sourceRecordDate)} / ${cell(row.selectedFieldReviewDate)} | ${cell(row.sourceRecordAgeDays)} days / ${cell(row.reviewThreshold)} / ${row.overdue ? 'OVERDUE' : 'no'} | ${row.route?.kind === 'manual-primary' ? (row.structuralErrors.length ? 'ERROR — see JSON' : `${row.manualEvidence.length} selected fixture sources; hashes checked`) : row.manualDocuments ? 'manual document parser + fixture pins; no automatic merge' : 'not a manual-pinned route'} |`).join('\n')
    + `\n\n## Per-card unresolved field scope\n\n`
    + `These names come from canonical needs-review provenance and _dataIssues keys. An issue key can qualify an accepted field; it is not by itself a claim that the field is wrong. No whole-card field-acceptance decision is made here.\n\n`
    + `| Card | Owner | needs-review fields | Other source/qualification notes by key |\n|---|---|---|---|\n`
    + report.rows.map(row => `| ${cell(row.slug)} | ${row.owner} | ${cell(row.pendingFields.join(', ') || 'none flagged')} | ${cell(row.issueFields.join(', ') || 'none recorded')} |`).join('\n')
    + `\n\n## Structural errors\n\n${report.errors.length ? report.errors.map(item => `- ${cell(item.slug ?? 'registry')}: ${item.code} — ${cell(item.detail)}`).join('\n') : 'None.'}\n`;
}

function cli() {
  const args = process.argv.slice(2);
  let asOf;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--as-of') { asOf = args[++i]; if (!asOf) throw new Error('--as-of requires YYYY-MM-DD'); }
    else if (!['--json', '--markdown'].includes(args[i])) throw new Error(`Unknown option: ${args[i]}`);
  }
  const report = auditCardSourceCoverage(loadCoverageInputs(), { ...(asOf ? { asOf } : {}) });
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else if (args.includes('--markdown')) console.log(renderCoverageMarkdown(report));
  else {
    console.log(`Card source coverage: ${report.summary.cards} cards; ${report.summary.configuredScraperRoutes} configured + ${report.summary.manualPrimaryRoutes} manual; ${report.summary.errors} structural errors; ${report.summary.routeDocumentGaps} document-route gaps; ${report.summary.overdueSourceRecords} age warnings as of ${report.asOf}. Offline only.`);
    for (const item of report.errors) console.error(`${item.code}: ${item.slug ?? 'registry'}: ${item.detail}`);
  }
  process.exitCode = report.errors.length ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { cli(); } catch (error) { console.error(`Card source coverage failed: ${error.message}`); process.exitCode = 1; }
}
