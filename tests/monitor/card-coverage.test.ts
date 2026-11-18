import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { catalogueLinks, inspectPage, reconcile, renderCoverageSummary, scanCoverage, validateRegistry } from '../../scripts/monitor/card-coverage.mjs';

const base = 'https://www.dib.ae/personal/cards';
const prime = base + '/prime-gold-card';
const closure = base + '/emirates-skywards-dib-infinite-covered-card';
const notice = 'https://www.emirates.com/ae/english/skywards/partners/dubai-islamic-bank/';
const registry = {
  schemaVersion: 1,
  researchDate: '2026-11-18',
  catalogues: [{ issuer: 'DIB', bank: 'dib', url: base, surface: 'catalogue', discover: ['/personal/cards/'] }],
  candidates: [
    { slug: 'dib-prime-gold', issuer: 'DIB', name: 'Prime Gold', status: 'research', source: prime },
    { slug: 'dib-prime-other', issuer: 'DIB', name: 'Prime Other', status: 'hold', source: prime, hold: 'tier-unconfirmed' },
    { slug: 'dib-emirates-skywards-infinite', issuer: 'DIB', name: 'Emirates Skywards Infinite', status: 'closed', source: closure, closureSource: notice },
  ],
};

const html = (body: string) => new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } });

test('initial audited inventory retains 112 identities, five explicit holds and the three partner-confirmed closures', () => {
  const source = JSON.parse(readFileSync(new URL('../../scripts/monitor/card-coverage.registry.json', import.meta.url), 'utf8'));
  const cards = JSON.parse(readFileSync(new URL('../../src/data/cards.json', import.meta.url), 'utf8'));
  const report = reconcile(source, cards);
  assert.equal(report.counts.candidates, 112);
  assert.equal(report.counts.holds, 5);
  assert.equal(report.counts.closed, 3);
  assert.equal(report.counts.researchGaps + report.counts.mapped, 104);
  assert.equal(report.counts.potentialConflicts, 0);
  assert.equal(report.catalogueCount + report.discontinuedCount + report.applicationUnconfirmedCount, Object.keys(cards).length);
  assert.equal(report.candidates.find(item => item.slug === 'rakbank-islamic-world')?.source,
    'https://www.rakbank.ae/en/islamic/personal/cards/credit-cards/world-credit-card');
  assert.ok(!source.candidates.some((item: {slug: string}) => item.slug === 'rakbank-world'));
  assert.deepEqual(report.candidates.filter(item => item.status === 'closed').map(item => [item.issuer, item.closureSource]),
    [['DIB', notice], ['DIB', notice], ['DIB', notice]]);
});

test('requires a canonical identity and primary source; current, discontinued and acquisition-unconfirmed remain separate', () => {
  const report = reconcile(registry, {
    'dib-prime-gold': { bank: 'dib', applyUrl: prime + '?product=not-gold', sources: [prime + '/'] },
    'dib-prime-other': { bank: 'dib', applyUrl: prime, applicationAvailability: 'unconfirmed' },
    'dib-emirates-skywards-infinite': { bank: 'dib', applyUrl: closure, discontinuedForNewApplicants: { date: '2026-08-01' } },
  });
  assert.deepEqual(report.candidates.map(item => item.mapping), ['catalogued', 'application-unconfirmed-profile', 'discontinued-profile']);
  assert.deepEqual([report.catalogueCount, report.discontinuedCount, report.applicationUnconfirmedCount], [1, 1, 1]);
  assert.equal(report.counts.researchGaps, 0);
  assert.equal(report.counts.potentialConflicts, 0);
  const mismatch = reconcile(registry, { 'dib-prime-gold': { bank: 'dib', applyUrl: prime + '?product=not-gold' } });
  assert.equal(mismatch.candidates[0].mapping, 'source-mismatch');
  assert.equal(mismatch.counts.potentialConflicts, 1);
  assert.equal(mismatch.counts.researchGaps, 1);
  assert.throws(() => reconcile(registry, { 'dib-prime-gold': { bank: 'adib', applyUrl: prime } }), /another issuer/);
});

test('no sources outside the fixed official hosts or wrong issuer are accepted', () => {
  for (const invalid of [
    'https://www.dib.ae.example.com/personal/cards/prime-gold-card',
    'https://[::1]/private',
    'http://www.dib.ae/personal/cards/prime-gold-card',
    'https://www.dib.ae:8443/private',
    'https://user:password@www.dib.ae/personal/cards',
    'https://www.dib.ae/personal/cards?dispatch=anything',
    'https://www.adib.ae/personal/cards',
  ]) {
    const wrong = structuredClone(registry);
    wrong.candidates[0].source = invalid;
    assert.throws(() => validateRegistry(wrong));
  }
  const noEvidence = structuredClone(registry);
  delete noEvidence.candidates[2].closureSource;
  assert.throws(() => validateRegistry(noEvidence));
});

test('redirects, challenges, errors, overlong decoded bodies and non-HTML stay unavailable', async () => {
  let reached = 0;
  const redirected = await inspectPage(prime, async (url: string, options: RequestInit) => {
    ++reached;
    assert.equal(url, prime);
    assert.equal(options.redirect, 'manual');
    assert.ok(options.signal);
    return Response.redirect('https://169.254.169.254/');
  });
  assert.equal(reached, 1);
  assert.deepEqual(redirected, { state: 'unavailable', reason: 'redirect-not-followed', httpStatus: 302 });
  assert.equal((await inspectPage(prime, async () => html('<title>Just a moment...</title>'))).reason, 'access-challenge');
  assert.equal((await inspectPage(prime, async () => html('<html><title>Issuer</title><body><div id="app"></div><script>hydrate()</script></body></html>'))).reason, 'empty-static-content');
  assert.equal((await inspectPage(prime, async () => new Response('not html'))).reason, 'not-html');
  assert.equal((await inspectPage(prime, async () => html('x'.repeat(2 * 1024 * 1024 + 1)))).reason, 'byte-limit');
  assert.equal((await inspectPage(prime, async () => { throw new DOMException('test', 'TimeoutError') })).reason, 'timeout');
});

test('new URL leads come only from bounded same-origin product anchors; no reported change implies acquisition', () => {
  const markup = [
    '<script>const foo = "<a href=/personal/cards/not-real>foo</a>"</script>',
    '<!--<a href="/personal/cards/hidden">Hidden</a>-->',
    '<a href="https://other.tld/personal/cards/untrusted">Other site</a>',
    '<a href="/other-page">Outside registered path</a>',
    '<a href="/personal/cards/card-offers">Offers, not a product</a>',
    '<a href="/personal/cards/prepaid">Prepaid category</a>',
    '<a href="/personal/cards/prime-gold-card?tracking=1">Known product</a>',
    '<a href="/personal/cards/new-credit-card?tracking=other#fees">Product-shaped lead</a>',
  ].join('\n');
  assert.deepEqual(catalogueLinks(markup, registry.catalogues[0], new Set([prime])), {
    links: [base + '/new-credit-card'],
    capped: false,
  });
  const large = Array.from({ length: 60 }, (_, i) => '<a href="/personal/cards/card-' + i + '">New candidate</a>').join('');
  const capped = catalogueLinks(large, registry.catalogues[0], new Set());
  assert.equal(capped.links.length, 50);
  assert.equal(capped.capped, true);
});

test('a scan reads only the four fixed routes, deduplicates shared source loads and never publishes raw content', async () => {
  const requested: string[] = [];
  const cards = { 'dib-prime-gold': { bank: 'dib', applyUrl: prime } };
  const original = structuredClone(cards);
  const report = await scanCoverage(registry, cards, async (url: string) => {
    requested.push(url);
    if (url === base) return html('<a href="/personal/cards/additional-card">A lead</a>');
    if (url === prime) return html('<h1>Prime <i>Gold</i></h1><script>Prime Other</script><p>raw page body marker</p>');
    if (url === notice) return html('<p>Dubai Islamic Bank: new applications from 1 August 2026.</p>');
    return new Response('Not found', { status: 404 });
  });
  assert.deepEqual(requested.sort(), [base, prime, closure, notice].sort());
  assert.deepEqual(cards, original);
  assert.equal(report.sourceCounts.read, 3);
  assert.equal(report.sourceCounts.unavailable, 1);
  assert.deepEqual(report.candidates.map(item => item.productObservation), ['name-observed', 'name-not-observed', 'source-unavailable']);
  assert.equal(report.candidates[2].closureSourceObservation, 'closure-markers-observed');
  assert.equal(report.candidates[2].status, 'closed');
  assert.equal(report.sourceCounts.unverifiedProductLinks, 1);
  assert.match(report.sources.find(item => item.url === prime)?.sha256 ?? '', /^[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(report), /raw page body marker|"html":/);
  const publicSummary = renderCoverageSummary(report);
  assert.match(publicSummary, /Fixed primary sources read: 3\/4/);
  assert.match(publicSummary, /Unverified product links: 1/);
  assert.match(publicSummary, /http-status \(1\)/);
  assert.doesNotMatch(publicSummary, /https?:|Prime Gold|Skywards Infinite|additional-card|[0-9a-f]{64}/);
});
