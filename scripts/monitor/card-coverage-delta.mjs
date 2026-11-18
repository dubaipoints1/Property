/** Compare local, successful coverage receipts. Never reads remote sources or writes card data. */
import { readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const hash = /^[a-f\d]{64}$/;
const MAX_RECEIPT = 2 * 1024 * 1024;
const MAX_SOURCES = 160;
const MAX_DISPLAY = 25;

function publicHttps(value) {
  try {
    const url = new URL(value);
    return url.href === value && url.protocol === 'https:' && !url.username &&
      !url.password && !url.search && !url.hash && !url.port &&
      !/[<>()\s\\]/.test(value);
  } catch {
    return false;
  }
}

function observations(report) {
  const rows = report?.sources;
  const time = Date.parse(report?.observedAt);
  if (report?.schemaVersion !== 1 || !Number.isFinite(time) ||
    !Array.isArray(rows) || rows.length > MAX_SOURCES || rows.length === 0) {
    throw new Error('Not a compatible coverage receipt.');
  }
  const sources = new Map();
  let read = 0;
  for (const entry of rows) {
    if (!publicHttps(entry?.url) || sources.has(entry.url) ||
      !['read', 'unavailable'].includes(entry.state) ||
      (entry.state === 'read' && !hash.test(entry.sha256))) {
      throw new Error('Invalid coverage observation.');
    }
    sources.set(entry.url, entry);
    if (entry.state === 'read') read += 1;
  }
  if (!read || report.sourceCounts?.attempted !== rows.length || report.sourceCounts?.read !== read) {
    throw new Error('Receipt does not contain a usable collection.');
  }
  return { time, sources };
}

export function compareCoverageReceipts(previous, current) {
  const before = observations(previous);
  const after = observations(current);
  if (after.time <= before.time) throw new Error('Prior receipt is not older than the current receipt.');
  const result = { compared: 0, changed: [], recovered: 0, unreadable: 0, addedSources: 0, retiredSources: 0 };
  for (const [url, entry] of after.sources) {
    const last = before.sources.get(url);
    if (!last) result.addedSources += 1;
    else if (last.state === 'read' && entry.state === 'read') {
      result.compared += 1;
      if (entry.sha256 !== last.sha256) result.changed.push(url);
    } else if (entry.state === 'read') result.recovered += 1;
    else if (last.state === 'read') result.unreadable += 1;
  }
  for (const url of before.sources.keys()) if (!after.sources.has(url)) result.retiredSources += 1;
  result.changed.sort();
  return result;
}

function readReceipt(path) {
  const info = statSync(path);
  if (!info.isFile() || info.size > MAX_RECEIPT) throw new Error('Not a bounded receipt file.');
  return JSON.parse(readFileSync(path, 'utf8'));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [currentPath, priorFlag, priorPath, ...extra] = process.argv.slice(2);
  if (!currentPath || extra.length || (priorFlag !== undefined && (priorFlag !== '--prior' || !priorPath))) {
    console.error('Usage: card-coverage-delta.mjs current.json [--prior previously-successful.json]');
    process.exitCode = 1;
  } else {
    const current = readReceipt(currentPath);
    observations(current);
    if (!priorPath) process.stdout.write('\n### Source change signals\n\nNo usable prior receipt was available. This run is a baseline, not evidence of unchanged terms.\n');
    else {
      const delta = compareCoverageReceipts(readReceipt(priorPath), current);
      process.stdout.write([
        '', '### Source change signals', '',
        '- Comparable pages: ' + delta.compared + '; HTML fingerprints changed: ' + delta.changed.length + '.',
        '- Readable again: ' + delta.recovered + '; newly unreadable: ' + delta.unreadable + '.',
        '- Newly tracked sources: ' + delta.addedSources + '; no longer tracked sources: ' + delta.retiredSources + '.',
        ...delta.changed.slice(0, MAX_DISPLAY).map(url => '- Changed HTML: <' + url + '>'),
        ...(delta.changed.length > MAX_DISPLAY ? ['- Additional changed pages can be identified from the two receipts.'] : []),
        '', 'Page changes prompt a source check. They do not verify prices, terms or product openings/closures.', '',
      ].join('\n'));
    }
  }
}
