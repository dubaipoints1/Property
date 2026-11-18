import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareCoverageReceipts } from '../../scripts/monitor/card-coverage-delta.mjs';

const read = (key: string, fingerprint = 'a') => ({
  url: 'https://issuer.example.com/cards/' + key,
  state: 'read',
  sha256: fingerprint.repeat(64),
});
const unavailable = (key: string) => ({ url: read(key).url, state: 'unavailable' });
const receipt = (day: string, sources: Array<ReturnType<typeof read> | ReturnType<typeof unavailable>>) => ({
  schemaVersion: 1,
  observedAt: day + 'T00:00:00Z',
  sourceCounts: { attempted: sources.length, read: sources.filter(row => row.state === 'read').length },
  sources,
});

test('fingerprint changes require two reads of the same source', () => {
  const previous = receipt('2026-11-18', [read('same'), read('change'), read('outage'), unavailable('restored'), read('retired')]);
  const current = receipt('2026-11-19', [read('same'), read('change', 'b'), unavailable('outage'), read('restored'), read('new')]);
  assert.deepEqual(compareCoverageReceipts(previous, current), {
    compared: 2, changed: [read('change').url], recovered: 1, unreadable: 1,
    addedSources: 1, retiredSources: 1,
  });
});

test('no baseline from failed, incompatible, non-HTTPS or newer collections', () => {
  const current = receipt('2026-11-19', [read('same')]);
  assert.throws(() => compareCoverageReceipts(receipt('2026-11-18', [unavailable('same')]), current), /usable/);
  assert.throws(() => compareCoverageReceipts(current, current), /not older/);
  assert.throws(() => compareCoverageReceipts(receipt('2026-11-18', [read('same'), read('same')]), current), /Invalid/);
  assert.throws(() => compareCoverageReceipts(receipt('2026-11-18', [{ ...read('same'), url: 'http://issuer.example.com/' }]), current), /Invalid/);
});
