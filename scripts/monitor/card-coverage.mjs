#!/usr/bin/env node
/** Candidate inventory and primary-source observations. Never writes card data. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { hasCurrentApplicationProfile } from '../../src/lib/cardAvailability.ts';

const STATES = new Set(['research', 'hold', 'closed']);
const SURFACES = new Set(['catalogue', 'product', 'selector', 'disclosure']);
const OFFICIAL_HOSTS = new Set([
  'www.adcb.com', 'www.adib.ae', 'www.cbd.ae', 'www.citibank.ae', 'www.dib.ae', 'www.emiratesislamic.ae',
  'www.emiratesnbd.com', 'www.bankfab.com', 'apply.bankfab.com', 'www.hsbc.ae', 'www.liv.me', 'www.mashreq.com',
  'www.mashreqalislami.com', 'www.rakbank.ae', 'www.sc.com', 'wio.io', 'www.ajmanbank.ae', 'www.sib.ae',
  'www.uab.ae', 'www.alhilalbank.ae', 'nbf.ae', 'nbfislamic.ae', 'www.cbiuae.com', 'www.arabbank.ae',
  'www.almasraf.ae', 'nbq.ae', 'www.nbk.com', 'habibbank.com', 'www.americanexpress.ae', 'ruyabank.ae',
  'aafaq.ae', 'www.financehouse.ae', 'www.emirates.com',
]);
const MAX_SOURCES = 160;
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 8_000;
const MAX_LINKS = 50;
const MAX_PARALLEL = 4;
const token = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const label = value => typeof value === 'string' && value.length > 0 && value.length <= 100 &&
  /^[\p{L}\p{N}+& -]+$/u.test(value) && value.trim() === value;
const route = /^\/[a-z0-9/-]+\/$/;
const urlString = /[\s\u0000-\u001f\u007f\\]/u;

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

function fixedHttps(value) {
  if (typeof value !== 'string' || urlString.test(value)) throw new Error('Invalid fixed source');
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash || !OFFICIAL_HOSTS.has(u.hostname) ||
      !u.hostname.includes('.') || isIP(u.hostname) || u.hostname.startsWith('[') ||
      /(?:^|\.)(?:local|localhost|internal|test|invalid|example|onion|arpa)$/i.test(u.hostname)) {
    throw new Error('A fixed public HTTPS source is required');
  }
  return u;
}

// This normalisation is for URL comparison only. No substitute URL is fetched.
function key(value, base, preserveSearch = false) {
  try {
    const u = new URL(value, base);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    return u.origin + u.pathname.replace(/\/+$/, '') + (preserveSearch ? u.search : '');
  } catch {
    return null;
  }
}

export function validateRegistry(registry) {
  if (registry?.schemaVersion !== 1 || !Array.isArray(registry.catalogues) || !Array.isArray(registry.candidates) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(registry.researchDate)) throw new Error('Invalid coverage registry');
  const portfolios = new Map();
  const sources = new Set();
  const slugs = new Set();
  for (const entry of registry.catalogues) {
    if (!label(entry.issuer) || !token(entry.bank) || portfolios.has(entry.issuer) || !SURFACES.has(entry.surface) ||
        !Array.isArray(entry.discover) || entry.discover.some(prefix => !route.test(prefix))) {
      throw new Error('Invalid or duplicate issuer portfolio');
    }
    portfolios.set(entry.issuer, { ...entry, host: fixedHttps(entry.url).hostname });
    sources.add(entry.url);
  }
  for (const entry of registry.candidates) {
    const portfolio = portfolios.get(entry.issuer);
    if (!portfolio || !label(entry.name) || !token(entry.slug) || slugs.has(entry.slug) || !STATES.has(entry.status)) {
      throw new Error('Invalid or duplicate card candidate');
    }
    slugs.add(entry.slug);
    const host = fixedHttps(entry.source).hostname;
    if (host !== portfolio.host &&
        !(portfolio.bank === 'fab' && host === 'apply.bankfab.com') &&
        !(portfolio.bank === 'mashreq' && host === 'www.mashreq.com')) {
      throw new Error('Wrong issuer source for ' + entry.slug);
    }
    sources.add(entry.source);
    if (entry.status === 'hold' ? !token(entry.hold) : entry.hold !== undefined) {
      throw new Error('Missing or inconsistent hold reason for ' + entry.slug);
    }
    if (entry.status === 'closed') {
      if (!(portfolio.bank === 'dib' && fixedHttps(entry.closureSource).hostname === 'www.emirates.com')) {
        throw new Error('Missing or wrong closure source for ' + entry.slug);
      }
      sources.add(entry.closureSource);
    } else if (entry.closureSource !== undefined) {
      throw new Error('Closure source without recorded closure for ' + entry.slug);
    }
  }
  if (sources.size < 1 || sources.size > MAX_SOURCES) throw new Error('Reviewed source budget exceeded');
  return { portfolios, sources };
}

export function reconcile(registry, cards) {
  const { portfolios } = validateRegistry(registry);
  const candidates = registry.candidates.map(entry => {
    const card = Object.hasOwn(cards, entry.slug) ? cards[entry.slug] : null;
    if (card && card.bank !== portfolios.get(entry.issuer).bank) {
      throw new Error('Candidate slug belongs to another issuer: ' + entry.slug);
    }
    // A canonical-looking slug alone is not proof, especially across conventional and Islamic variants.
    // Compare exact primary paths; keep genuinely separate tiers that share a family page as distinct IDs.
    const sourceMatches = card && [card.applyUrl, ...(card.sources ?? [])]
      .some(source => key(source, undefined, true) === key(entry.source, undefined, true));
    const mapping = !card ? 'not-in-catalogue' : !sourceMatches ? 'source-mismatch' :
      card.discontinuedForNewApplicants !== undefined ? 'discontinued-profile' :
      card.applicationAvailability === 'unconfirmed' ? 'application-unconfirmed-profile' : 'catalogued';
    const potentialConflict = mapping === 'source-mismatch' || (entry.status !== 'research' && mapping === 'catalogued');
    return { ...entry, mapping, potentialConflict };
  });
  return {
    researchDate: registry.researchDate,
    catalogueCount: Object.values(cards).filter(hasCurrentApplicationProfile).length,
    discontinuedCount: Object.values(cards).filter(card => card.discontinuedForNewApplicants !== undefined).length,
    applicationUnconfirmedCount: Object.values(cards).filter(card => card.discontinuedForNewApplicants === undefined
      && card.applicationAvailability === 'unconfirmed').length,
    counts: {
      candidates: candidates.length,
      mapped: candidates.filter(entry => entry.mapping === 'catalogued').length,
      researchGaps: candidates.filter(entry => entry.status === 'research' && entry.mapping !== 'catalogued').length,
      holds: candidates.filter(entry => entry.status === 'hold').length,
      closed: candidates.filter(entry => entry.status === 'closed').length,
      potentialConflicts: candidates.filter(entry => entry.potentialConflict).length,
    },
    candidates,
  };
}

// Reject rather than follow redirects. The configured URL is the network boundary.
export async function inspectPage(url, fetchPage = fetch) {
  fixedHttps(url);
  let response;
  try {
    response = await fetchPage(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'DubaiPoints-Coverage/1.0' },
    });
    if (!response.ok || response.status !== 200) {
      await response.body?.cancel();
      return { state: 'unavailable', reason: response.status >= 300 && response.status < 400 ? 'redirect-not-followed' : 'http-status', httpStatus: response.status };
    }
    if (!/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(response.headers.get('content-type') || '')) {
      await response.body?.cancel();
      return { state: 'unavailable', reason: 'not-html' };
    }
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_BYTES || !response.body) {
      await response.body?.cancel();
      return { state: 'unavailable', reason: length > MAX_BYTES ? 'byte-limit' : 'empty-body' };
    }
    const read = response.body.getReader();
    const digest = createHash('sha256');
    const charset = new TextDecoder();
    let html = '';
    let bytes = 0;
    try {
      for (;;) {
        const { value, done } = await read.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) {
          await read.cancel();
          return { state: 'unavailable', reason: 'byte-limit' };
        }
        digest.update(value);
        html += charset.decode(value, { stream: true });
      }
      html += charset.decode();
    } finally {
      read.releaseLock();
    }
    if (!bytes || !html.trim()) return { state: 'unavailable', reason: 'empty-body' };
    if (/<title\b[^>]*>\s*(?:access denied|request rejected|just a moment|attention required|checking your browser|security check|one moment)/i.test(html)) {
      return { state: 'unavailable', reason: 'access-challenge' };
    }
    const body = /<body\b[^>]*>([\s\S]*?)(?:<\/body\s*>|$)/i.exec(html)?.[1] ?? html;
    if (!visibleWords(body).trim()) return { state: 'unavailable', reason: 'empty-static-content' };
    return { state: 'read', bytes, sha256: digest.digest('hex'), html };
  } catch (error) {
    return { state: 'unavailable', reason: ['TimeoutError', 'AbortError'].includes(error?.name) ? 'timeout' : 'fetch-failed' };
  }
}

const withoutHidden = html => html.replace(/<!--[\s\S]*?(?:-->|$)/g, ' ')
  .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ');
const normalise = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/&(?:nbsp|amp|plus|quot|apos|ndash|mdash|#x?[a-f0-9]+);/gi, ' ')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const visibleWords = html => ' ' + normalise(withoutHidden(html).replace(/<[^>]+>/g, ' ')) + ' ';

export function catalogueLinks(page, catalogue, known) {
  const base = fixedHttps(catalogue.url);
  const out = new Set();
  let capped = false;
  // Treat only card-namespace HTML anchors as leads; never fetch the extracted URLs.
  const tags = withoutHidden(page).matchAll(/<a\b[^>]{0,2048}>/gi);
  for (const [tag] of tags) {
    const match = tag.match(/\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/i);
    if (!match) continue;
    const href = (match[1] ?? match[2] ?? match[3]).trim();
    if (!href || href.length > 500 || urlString.test(href) || href.includes('&') || href.includes('%')) continue;
    const canonical = key(href, base);
    if (!canonical || canonical === key(catalogue.url) || known.has(canonical)) continue;
    const url = new URL(canonical);
    if (url.origin !== base.origin || !/^\/[A-Za-z0-9/.~-]+$/.test(url.pathname)) continue;
    const path = url.pathname.toLowerCase();
    const prefix = catalogue.discover.find(value => path.startsWith(value));
    if (!prefix) continue;
    const suffix = path.slice(prefix.length);
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)?(?:\.aspx)?$/.test(suffix) ||
        /(?:^|[/-])(?:apply|application|faq|faqs|compare|comparison|support|help|service|services|terms|rates|fees|offer|offers|form|forms|debit|prepaid|business|corporate|supplementary|discontinued|legacy|promotions|products|listing|kfs|default|index)(?:[/-]|\.|$)/.test(suffix)) continue;
    if (out.size === MAX_LINKS && !out.has(canonical)) {
      capped = true;
      break;
    }
    out.add(canonical);
  }
  return { links: [...out].sort(), capped };
}

export async function scanCoverage(registry, cards, fetchPage = fetch) {
  const { sources } = validateRegistry(registry);
  const report = reconcile(registry, cards);
  const fixed = [...sources].sort();
  const sourceResults = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, fixed.length) }, async () => {
    for (;;) {
      const url = fixed[next++];
      if (!url) return;
      sourceResults.set(url, await inspectPage(url, fetchPage));
    }
  }));

  const known = new Set([
    ...fixed.map(url => key(url)),
    ...Object.values(cards).flatMap(card => [card.applyUrl, ...[...(card.sources ?? [])].filter(item => typeof item === 'string')]).map(url => key(url)),
  ]);
  const nameCache = new Map();
  function words(source) {
    const page = sourceResults.get(source);
    if (!page || page.state !== 'read') return null;
    if (!nameCache.has(source)) nameCache.set(source, visibleWords(page.html));
    return nameCache.get(source);
  }
  function observed(source, name) {
    const text = words(source);
    if (text === null) return 'source-unavailable';
    return text.includes(' ' + normalise(name) + ' ') ? 'name-observed' : 'name-not-observed';
  }
  function closureNotice(source) {
    const text = words(source);
    if (text === null) return 'source-unavailable';
    return text.includes(' new applications ') && text.includes(' dubai islamic bank ') && text.includes(' 1 august 2026 ')
      ? 'closure-markers-observed' : 'closure-markers-not-observed';
  }
  const discoveries = new Set();
  const catalogues = registry.catalogues.map(portfolio => {
    const page = sourceResults.get(portfolio.url);
    const result = page.state === 'read'
      ? catalogueLinks(page.html, portfolio, known)
      : { links: [], capped: false };
    for (const url of result.links) discoveries.add(url);
    return { issuer: portfolio.issuer, source: portfolio.url, surface: portfolio.surface, state: page.state, discoveryConfigured: !!portfolio.discover.length,
      unverifiedProductLinks: result.links, discoveryCapped: result.capped };
  });
  const outcomes = fixed.map(url => {
    const { html: _discard, ...meta } = sourceResults.get(url);
    return { url, ...meta };
  });
  return {
    ...report,
    observedAt: new Date().toISOString(),
    sourceCounts: {
      attempted: outcomes.length,
      read: outcomes.filter(entry => entry.state === 'read').length,
      unavailable: outcomes.filter(entry => entry.state === 'unavailable').length,
      discoveryPortfolios: catalogues.filter(entry => entry.discoveryConfigured).length,
      readableDiscoveryPortfolios: catalogues.filter(entry => entry.discoveryConfigured && entry.state === 'read').length,
      fixedPortfolios: catalogues.length,
      issuerFamilies: new Set(registry.catalogues.map(portfolio => portfolio.bank)).size,
      unverifiedProductLinks: discoveries.size,
      cappedPortfolios: catalogues.filter(entry => entry.discoveryCapped).length,
    },
    catalogues,
    sources: outcomes,
    candidates: report.candidates.map(entry => ({
      ...entry,
      productObservation: observed(entry.source, entry.name),
      ...(entry.closureSource ? { closureSourceObservation: closureNotice(entry.closureSource) } : {}),
    })),
  };
}

export function renderCoverageSummary(report) {
  const counts = report.counts;
  const sources = report.sourceCounts;
  const unavailable = new Map();
  for (const source of report.sources ?? []) if (source.state === 'unavailable') {
    unavailable.set(source.reason, (unavailable.get(source.reason) ?? 0) + 1);
  }
  return [
    '## DubaiPoints card coverage',
    '',
    '- Catalogue: ' + report.catalogueCount + ' current profiles, ' + report.discontinuedCount + ' discontinued profiles, ' + report.applicationUnconfirmedCount + ' application-unconfirmed profiles.',
    '- Research registry: ' + counts.candidates + ' named records; ' + counts.mapped + ' mapped to current profiles.',
    '- Research gaps: ' + counts.researchGaps + '; explicit holds: ' + counts.holds + '; recorded closures: ' + counts.closed + '; potential conflicts: ' + counts.potentialConflicts + '.',
    ...(sources ? [
      '- Fixed primary sources read: ' + sources.read + '/' + sources.attempted + '; unavailable: ' + sources.unavailable + '.',
      '- Unverified product links: ' + sources.unverifiedProductLinks + '; discovery surfaces read: ' + sources.readableDiscoveryPortfolios + '/' + sources.discoveryPortfolios + '; capped: ' + sources.cappedPortfolios + '.',
      '- ' + sources.fixedPortfolios + ' fixed surfaces across ' + sources.issuerFamilies + ' issuer families; some are product, selector or disclosure pages rather than full catalogues.',
      ...(unavailable.size ? ['- Unavailable by reason: ' + [...unavailable].sort()
        .map(([reason, count]) => reason + ' (' + count + ')').join(', ') + '.'] : []),
    ] : []),
    '',
    'Unlisted links are relative to the current files, not confirmed additions since the previous scan. An observed name, link or page hash is a review lead only. Unavailable and not observed are not closure. No card data was written.',
    '',
  ].join('\n');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [flag, reportPath, ...extra] = process.argv.slice(2);
  if (flag === '--summary' && reportPath && !extra.length) {
    process.stdout.write(renderCoverageSummary(readJson(reportPath)));
  } else if ((!flag || flag === '--scan') && !reportPath && !extra.length) {
    const registry = readJson(new URL('./card-coverage.registry.json', import.meta.url));
    const cards = readJson(new URL('../../src/data/cards.json', import.meta.url));
    const result = flag === '--scan' ? await scanCoverage(registry, cards) : reconcile(registry, cards);
    process.stdout.write(JSON.stringify({ schemaVersion: 1, ...result }, null, 2) + '\n');
    if (flag === '--scan' && result.sourceCounts.read === 0) process.exitCode = 2;
  } else {
    console.error('Usage: card-coverage.mjs [--scan | --summary report.json]');
    process.exitCode = 1;
  }
}
