import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildReport, renderReport, validateQueue } from '../../scripts/newsroom/report.mjs';

const script = fileURLToPath(new URL('../../scripts/newsroom/report.mjs', import.meta.url));
const day = '2026-11-09';
const briefPath = '.council/briefs/2026-11-09-example-news.md';
const evidence = '.council/research/2026-11/example-source.md';
const coiRecord = '.council/research/2026-11/example-coi.md';
const reviewRecord = '.council/research/2026-11/example-factcheck.md';
const travelRecord = '.council/research/2026-11/example-travel.md';
const draftPath = '.council/drafts/2026-11/example-news.mdx';

function put(root: string, file: string, text: string) {
  const absolute = path.join(root, file);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, text);
}

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'dubaipoints-newsroom-test-'));
  mkdirSync(path.join(root, 'src/content/news'), { recursive: true });
  put(root, '.council/newsroom/queue.json', JSON.stringify({ schemaVersion: 1, items: [] }));
  return root;
}

function news(root: string, slug: string, date: string, beat?: string) {
  put(root, `src/content/news/${slug}.mdx`, `---\ntitle: "Example ${slug}"\npublishedAt: ${date}\n${beat ? `beat: ${beat}\n` : ''}---\n\nTest fixture, not published reporting.\n`);
}

function brief(root: string, extra: Record<string, string> = {}) {
  const metadata = { slug: 'example-news', 'assigned-editor': 'airline-news-editor',
    'research-status': 'complete', 'seo-status': 'complete', 'draft-status': 'complete',
    'factcheck-status': 'complete', 'tech-status': 'complete', 'ux-status': 'complete', 'standards-status': 'complete', 'chairman-status': 'approved', ...extra };
  put(root, briefPath, `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\nMechanical readiness fixture only; no actual approval.\n`);
}

function item(overrides: Record<string, unknown> = {}) {
  return { id: 'example-news', topic: 'What changed for UAE members?', desk: 'airline', format: 'quick-hit', owner: 'airline-news-editor',
    nextAction: 'Independently verify the evidence before requesting release.', stage: 'ready', brief: briefPath, draft: draftPath,
    discoveredAt: '2026-11-09T06:00:00Z', disposition: { status: 'commissioned', reason: 'Mechanical test commission only.' },
    sources: [{ url: 'https://publisher.ae/news/example', role: 'secondary', readStatus: 'read', claimsStatus: 'checked', evidencePath: evidence }],
    holds: [], coi: { status: 'declared', record: coiRecord }, review: { reviewer: 'independent-fact-checker', record: reviewRecord }, ...overrides };
}

function commission(root: string, data = item()) {
  brief(root);
  put(root, draftPath, '---\ntitle: Synthetic hand-off example\ndescription: Mechanical fixture, not a real commissioned article.\n---\n\nSynthetic narrative fixture; not publication approval.\n');
  for (const record of [evidence, coiRecord, reviewRecord, travelRecord]) put(root, record, 'Synthetic mechanical-test record; not an actual source read or editorial approval.\n');
  put(root, '.council/newsroom/queue.json', JSON.stringify({ schemaVersion: 1, items: [data] }));
}

function snapshot(root: string, dir = ''): Record<string, string> {
  return Object.fromEntries(readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? Object.entries(snapshot(root, file)) : [[file, readFileSync(path.join(root, file), 'base64')]];
  }));
}

test('UTC-inclusive seven/thirty-day counts group real frontmatter by desk and distinct dates', () => {
  const root = fixture();
  news(root, 'airline', '2026-11-03', 'airline');
  news(root, 'hotel', '2026-11-02', 'hotel');
  news(root, 'banking', '2026-10-11', 'banking');
  news(root, 'older', '2026-10-10', 'hotel');
  news(root, 'future', '2026-11-10', 'airline');
  put(root, 'src/content/news/nested/unclassified.md', '---\ntitle: Nested entry\npublishedAt: 2026-11-09T23:59:59Z\n---\nFixture.\n');
  const report = buildReport({ root, asOf: day });
  assert.equal(report.windows[0].count, 2);
  assert.deepEqual(report.windows[0].byDesk, { airline: 1, hotel: 0, banking: 0, unclassified: 1 });
  assert.deepEqual(report.windows[0].byDate, { '2026-11-03': 1, '2026-11-09': 1 });
  assert.equal(report.windows[1].start, '2026-10-11');
  assert.equal(report.windows[1].count, 4);
  assert.equal(report.windows[1].activeDates.length, 4);
  assert.deepEqual(report.futureDatedEntries, ['src/content/news/future.mdx']);
  assert.equal(report.publicationAuthority, false);
  assert.match(report.basis, /not verified live publications/);
});

test('empty queue is explicit, not a no-news or no-backlog claim', () => {
  const report = buildReport({ root: fixture(), asOf: day });
  assert.equal(report.emptyQueue, true);
  assert.deepEqual(report.nextActions, []);
  assert.match(renderReport(report), /does not mean no leads, backlog or news exists/);
});

test('CLI is read-only by default and in JSON mode, with no fetch/worker or write dependency', () => {
  const root = fixture(); news(root, 'example', day, 'hotel');
  const before = snapshot(root);
  for (const args of [[], ['--json']]) {
    const child = spawnSync(process.execPath, [script, '--as-of', day, ...args], { cwd: root, encoding: 'utf8', timeout: 5000 });
    assert.equal(child.status, 0, child.stderr);
    if (args.length) assert.equal(JSON.parse(child.stdout).mode, 'local-read-only');
    else assert.match(child.stdout, /No collection, agent activation, issue delivery/);
    assert.deepEqual(snapshot(root), before);
  }
  const code = readFileSync(script, 'utf8');
  assert.doesNotMatch(code, /\b(?:fetch|writeFileSync|appendFileSync|mkdirSync|unlinkSync|renameSync|spawnSync|execFileSync)\s*\(/);
  assert.doesNotMatch(code, /from ['"]node:(?:http|https|child_process)['"]/);
});

test('queue ready cannot override real brief gates, missing COI or an unread source', () => {
  const root = fixture();
  commission(root, item({ sources: [{ url: 'https://publisher.ae/story', role: 'secondary', readStatus: 'unread', claimsStatus: 'unverified', evidencePath: null }], coi: { status: 'pending', record: null } }));
  brief(root, { 'research-status': 'pending', 'factcheck-status': 'pending', 'chairman-status': 'pending' });
  const row = buildReport({ root, asOf: day }).commissions[0];
  assert.equal(row.readiness, 'blocked');
  assert.ok(row.blockers.some(text => text === 'Brief research-status: pending'));
  assert.ok(row.blockers.some(text => text === 'Brief factcheck-status: pending'));
  assert.ok(row.blockers.some(text => text === 'Brief chairman-status: pending'));
  assert.ok(row.blockers.some(text => text.startsWith('Source unread:')));
  assert.ok(row.blockers.some(text => text.includes('Contributor/COI declaration pending')));
  assert.equal(row.nextAction, 'Independently verify the evidence before requesting release.');
});

test('all recorded gates may complete for fully read attributed secondary news, but never grant publication authority', () => {
  const root = fixture(); commission(root);
  const report = buildReport({ root, asOf: day });
  assert.equal(report.commissions[0].readiness, 'recorded-gates-complete');
  assert.equal(report.publicationAuthority, false);
  assert.match(renderReport(report), /not publication approval/);
  assert.match(report.basis, /do not certify actual source reading, independence/);
});

test('explicit holds, missing evidence and self-review block even with completed brief cells', () => {
  const root = fixture();
  commission(root, item({ holds: ['UAE eligibility unconfirmed'], review: { reviewer: ' AIRLINE-NEWS-EDITOR ', record: reviewRecord } }));
  put(root, evidence, '  ');
  const row = buildReport({ root, asOf: day }).commissions[0];
  assert.equal(row.readiness, 'blocked');
  assert.ok(row.blockers.includes('Hold: UAE eligibility unconfirmed'));
  assert.ok(row.blockers.some(text => text.includes('Source https://publisher.ae/news/example: evidence record missing, empty or outside repository')));
  assert.ok(row.blockers.includes('review: author cannot approve own work'));
});

test('analysis needs recorded Travel countersign; quick-hit completion does not waive it', () => {
  const root = fixture(); commission(root, item({ format: 'analysis' }));
  assert.ok(buildReport({ root, asOf: day }).commissions[0].blockers.includes('travelSignoff: independent reviewer and evidence record missing'));
  commission(root, item({ format: 'analysis', travelSignoff: { reviewer: 'travel-experiences-editor', record: travelRecord } }));
  assert.equal(buildReport({ root, asOf: day }).commissions[0].readiness, 'recorded-gates-complete');
});

test('brief identity and owner must match; unrelated maintenance Chairman approval is insufficient', () => {
  const root = fixture(); commission(root);
  brief(root, { slug: 'unrelated-maintenance', 'assigned-editor': 'someone-else' });
  const row = buildReport({ root, asOf: day }).commissions[0];
  assert.equal(row.readiness, 'blocked');
  assert.ok(row.blockers.includes('Brief frontmatter, slug or assigned editor does not match the commission'));
});

test('completed source/technical cells cannot waive pending Standards and UX review', () => {
  const root = fixture(); commission(root);
  brief(root, { 'ux-status': 'pending', 'standards-status': 'pending' });
  const row = buildReport({ root, asOf: day }).commissions[0];
  assert.equal(row.readiness, 'blocked');
  assert.ok(row.blockers.includes('Brief ux-status: pending'));
  assert.ok(row.blockers.includes('Brief standards-status: pending'));
});

test('ready needs an actual matching narrative draft, not only a completed brief cell', () => {
  const root = fixture(); commission(root, item({ draft: null }));
  assert.ok(buildReport({ root, asOf: day }).commissions[0].blockers.includes('Draft: local evidence record missing'));
  commission(root);
  for (const text of [
    '---\nslug: unrelated-article\ntitle: Unrelated\ndescription: Not this commission.\n---\nA body.\n',
    '---\ntitle: Metadata only\ndescription: There is no draft body.\n---\n',
    '---\ntitle: Missing description\n---\nA body.\n',
  ]) {
    put(root, draftPath, text);
    assert.ok(buildReport({ root, asOf: day }).commissions[0].blockers.includes('Draft must match the commission slug and contain title, description and a non-empty body'));
  }
  const renamed = '.council/drafts/2026-11/renamed-candidate.md';
  put(root, renamed, '---\nslug: example-news\ntitle: Correct explicit slug\ndescription: Structural fixture, not an accepted article.\n---\nSynthetic body.\n');
  put(root, '.council/newsroom/queue.json', JSON.stringify({ schemaVersion: 1, items: [item({ draft: renamed })] }));
  const report = buildReport({ root, asOf: day });
  assert.equal(report.commissions[0].readiness, 'recorded-gates-complete');
  assert.match(renderReport(report), /Draft: \.council\/drafts\/2026-11\/renamed-candidate.md/);
});

test('held/passed-over dispositions retain reasons without pretending to be approved news', () => {
  const root = fixture();
  commission(root, item({ stage: 'held', disposition: { status: 'held', reason: 'Missing real quotation.' } }));
  assert.equal(buildReport({ root, asOf: day }).commissions[0].readiness, 'blocked');
  commission(root, item({ stage: 'passed-over', brief: null, disposition: { status: 'passed-over', reason: 'Title indicates UK-only card eligibility; no UAE story commissioned.' }, sources: [] }));
  const report = buildReport({ root, asOf: day });
  assert.equal(report.commissions[0].readiness, 'not-for-publication');
  assert.equal(report.nextActions.length, 0);
  assert.match(renderReport(report), /UK-only card eligibility/);
});

test('published queue label requires repository news evidence and still cannot verify live deployment', () => {
  const root = fixture(); commission(root, item({ stage: 'published', publicSlug: 'example-news' }));
  assert.ok(buildReport({ root, asOf: day }).commissions[0].blockers.includes('Published queue claim lacks the same commission slug in a non-future repository news entry'));
  news(root, 'example-news', '2026-11-10', 'airline');
  assert.equal(buildReport({ root, asOf: day }).commissions[0].readiness, 'blocked', 'future repository entries do not prove publication');
  news(root, 'example-news', day, 'airline');
  const report = buildReport({ root, asOf: day });
  assert.equal(report.commissions[0].readiness, 'recorded-gates-complete');
  assert.equal(report.publicationAuthority, false);
  news(root, 'unrelated-news', day, 'airline');
  put(root, '.council/newsroom/queue.json', JSON.stringify({ schemaVersion: 1, items: [item({ stage: 'published', publicSlug: 'unrelated-news' })] }));
  assert.equal(buildReport({ root, asOf: day }).commissions[0].readiness, 'blocked', 'an unrelated existing article cannot substantiate this commission');
});

test('schema rejects duplicate IDs, contradictory source claims, bad paths and unsupported values', () => {
  const bad = [
    { schemaVersion: 1, items: [item(), item()] },
    { schemaVersion: 1, items: [item({ surpriseApproval: true })] },
    { schemaVersion: 1, items: [item({ stage: 'auto-published' })] },
    { schemaVersion: 1, items: [item({ stage: 'held' })] },
    { schemaVersion: 1, items: [item({ brief: '.council/briefs/../../private.md' })] },
    { schemaVersion: 1, items: [item({ draft: '.council/research/not-a-draft.md' })] },
    { schemaVersion: 1, items: [item({ owner: '' })] },
    { schemaVersion: 1, items: [item({ discoveredAt: '2026-11-31' })] },
    { schemaVersion: 1, items: [item({ sources: [{ url: 'https://127.0.0.1/story', role: 'primary', readStatus: 'read', claimsStatus: 'checked', evidencePath: evidence }] })] },
    { schemaVersion: 1, items: [item({ sources: [{ url: 'https://publisher.ae/story', role: 'primary', readStatus: 'unread', claimsStatus: 'checked', evidencePath: evidence }] })] },
  ];
  for (const queue of bad) assert.throws(() => validateQueue(queue));
});

test('unreadable/corrupt queue and invalid news dates fail closed, not as an empty successful report', () => {
  const root = fixture();
  put(root, '.council/newsroom/queue.json', '{');
  assert.throws(() => buildReport({ root, asOf: day }));
  put(root, '.council/newsroom/queue.json', JSON.stringify({ schemaVersion: 1, items: [] }));
  news(root, 'invalid', '2026-02-30', 'airline');
  assert.throws(() => buildReport({ root, asOf: day }), /publishedAt is invalid/);
  assert.throws(() => buildReport({ root, asOf: '2026-02-30' }), /asOf is invalid/);
});

test('evidence symlink cannot certify a record outside the repository', () => {
  const root = fixture(); commission(root);
  const outside = path.join(mkdtempSync(path.join(tmpdir(), 'dubaipoints-newsroom-outside-')), 'record.md');
  writeFileSync(outside, 'Outside fixture; must not be read as repository evidence.');
  const link = '.council/research/2026-11/outside.md';
  symlinkSync(outside, path.join(root, link));
  put(root, '.council/newsroom/queue.json', JSON.stringify({ schemaVersion: 1, items: [item({ review: { reviewer: 'independent-fact-checker', record: link } })] }));
  assert.ok(buildReport({ root, asOf: day }).commissions[0].blockers.includes('review: evidence record missing, empty or outside repository'));
});

test('CLI rejects unknown options and missing dates without mutating inputs', () => {
  const root = fixture(); const before = snapshot(root);
  for (const args of [['--activate'], ['--write'], ['--as-of'], ['--as-of', 'not-a-date']]) {
    const child = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', timeout: 5000 });
    assert.equal(child.status, 1);
    assert.match(child.stderr, /Newsroom preflight failed/);
    assert.deepEqual(snapshot(root), before);
  }
});
