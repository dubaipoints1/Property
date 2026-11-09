// Local newsroom preflight. Reads repository records; never fetches, writes,
// starts an agent, approves a story or certifies a production publication.
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const DESKS = ['airline', 'hotel', 'banking'];
const FORMATS = ['quick-hit', 'standard', 'analysis'];
const STAGES = ['triage', 'research', 'seo', 'draft', 'factcheck', 'tech', 'chairman', 'ready', 'published', 'held', 'passed-over'];
const BRIEF_STAGES = ['research-status', 'seo-status', 'draft-status', 'factcheck-status', 'tech-status', 'ux-status', 'standards-status'];
const QUEUE = '.council/newsroom/queue.json';

function requireThat(condition, message) { if (!condition) throw new Error(message); }
function object(value, label) { requireThat(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`); }
function string(value, label) { requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= 2000, `${label} must be a non-empty bounded string`); }
function oneOf(value, options, label) { requireThat(options.includes(value), `${label} has an unsupported value`); }
function keys(value, allowed, label) { requireThat(Object.keys(value).every(key => allowed.includes(key)), `${label} has an unknown field`); }

export function isoDay(value, label = 'date') {
  requireThat(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value), `${label} must be an ISO UTC date or timestamp`);
  const time = Date.parse(value);
  requireThat(Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value.slice(0, 10), `${label} is invalid`);
  return value.slice(0, 10);
}

function publicUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname.includes('.') &&
      !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) && !url.hostname.startsWith('[') &&
      !/(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(url.hostname) &&
      (!url.port || url.port === '443');
  } catch { return false; }
}

function reference(value, prefix, label) {
  string(value, label);
  requireThat(value.startsWith(prefix) && !value.includes('\\') && !value.split('/').some(part => part === '..' || part === '.' || !part) && /\.mdx?$/.test(value), `${label} must be a local Markdown record under ${prefix}`);
}

export function validateQueue(queue) {
  object(queue, 'queue'); keys(queue, ['schemaVersion', 'items'], 'queue');
  requireThat(queue.schemaVersion === 1 && Array.isArray(queue.items), 'queue schemaVersion/items invalid');
  const seen = new Set();
  for (const item of queue.items) {
    object(item, 'commission');
    keys(item, ['id', 'topic', 'desk', 'format', 'owner', 'nextAction', 'stage', 'brief', 'draft', 'discoveredAt', 'disposition', 'sources', 'holds', 'coi', 'review', 'travelSignoff', 'publicSlug'], 'commission');
    string(item.id, 'commission id');
    requireThat(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) && !seen.has(item.id), 'commission id must be unique kebab-case'); seen.add(item.id);
    for (const field of ['topic', 'owner', 'nextAction']) string(item[field], field);
    oneOf(item.desk, DESKS, 'desk'); oneOf(item.format, FORMATS, 'format'); oneOf(item.stage, STAGES, 'stage');
    isoDay(item.discoveredAt, 'discoveredAt');
    if (item.brief !== null) reference(item.brief, '.council/briefs/', 'brief');
    if (item.draft != null) {
      const prefix = typeof item.draft === 'string' && item.draft.startsWith('.council/drafts/') ? '.council/drafts/' : 'src/content/news/';
      reference(item.draft, prefix, 'draft');
    }
    object(item.disposition, 'disposition'); keys(item.disposition, ['status', 'reason'], 'disposition');
    oneOf(item.disposition.status, ['commissioned', 'held', 'passed-over'], 'disposition status'); string(item.disposition.reason, 'disposition reason');
    for (const status of ['held', 'passed-over']) requireThat((item.stage === status) === (item.disposition.status === status), 'stage and disposition disagree');
    requireThat(Array.isArray(item.sources) && Array.isArray(item.holds), 'sources/holds must be arrays');
    item.holds.forEach(hold => string(hold, 'hold'));
    const urls = new Set();
    for (const source of item.sources) {
      object(source, 'source'); keys(source, ['url', 'role', 'readStatus', 'claimsStatus', 'evidencePath'], 'source');
      requireThat(publicUrl(source.url) && !urls.has(source.url), 'source must have a unique public HTTPS URL'); urls.add(source.url);
      oneOf(source.role, ['primary', 'secondary'], 'source role'); oneOf(source.readStatus, ['unread', 'read'], 'source readStatus');
      oneOf(source.claimsStatus, ['unverified', 'checked'], 'source claimsStatus');
      if (source.evidencePath !== null) reference(source.evidencePath, '.council/research/', 'source evidencePath');
      requireThat(source.claimsStatus !== 'checked' || source.readStatus === 'read', 'unread source cannot have checked claims');
    }
    object(item.coi, 'coi'); keys(item.coi, ['status', 'record'], 'coi'); oneOf(item.coi.status, ['pending', 'declared'], 'coi status');
    if (item.coi.record !== null) reference(item.coi.record, '.council/', 'coi record');
    for (const field of ['review', 'travelSignoff']) {
      if (item[field] == null) continue;
      object(item[field], field); keys(item[field], ['reviewer', 'record'], field); string(item[field].reviewer, `${field} reviewer`);
      reference(item[field].record, '.council/', `${field} record`);
    }
    if (item.publicSlug != null) requireThat(typeof item.publicSlug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.publicSlug), 'publicSlug must be kebab-case');
  }
  return queue;
}

function contained(root, relative) {
  const absolute = realpathSync(path.resolve(root, relative));
  requireThat(absolute.startsWith(`${root}${path.sep}`), 'record escapes repository');
  return absolute;
}

function readRecord(root, relative) {
  const file = contained(root, relative);
  requireThat(statSync(file).isFile(), 'record is not a file');
  const text = readFileSync(file, 'utf8');
  requireThat(text.trim().length > 0, 'record is empty');
  return text;
}

function frontmatter(text, label) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  requireThat(match, `${label}: missing YAML frontmatter`);
  const data = parse(match[1]); object(data, `${label} frontmatter`);
  return data;
}

function newsFiles(root, dir = 'src/content/news') {
  return readdirSync(contained(root, dir), { withFileTypes: true }).flatMap(entry => {
    const file = `${dir}/${entry.name}`;
    requireThat(!entry.isSymbolicLink(), 'symlink in news collection is unsupported');
    if (entry.isDirectory()) return newsFiles(root, file);
    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [file] : [];
  });
}

function readNews(root) {
  return newsFiles(root).map(file => {
    const data = frontmatter(readRecord(root, file), file);
    string(data.title, `${file} title`);
    const day = isoDay(data.publishedAt instanceof Date ? data.publishedAt.toISOString() : data.publishedAt, `${file} publishedAt`);
    if (data.beat !== undefined) oneOf(data.beat, DESKS, `${file} beat`);
    return { file, title: data.title, day, desk: data.beat ?? 'unclassified', slug: typeof data.slug === 'string' ? data.slug : file.slice('src/content/news/'.length).replace(/\.mdx?$/, '') };
  });
}

function outputWindow(news, asOf, days) {
  const end = Date.parse(asOf), start = end - (days - 1) * 86_400_000;
  const entries = news.filter(item => Date.parse(item.day) >= start && Date.parse(item.day) <= end);
  return { days, start: new Date(start).toISOString().slice(0, 10), end: asOf, count: entries.length,
    activeDates: [...new Set(entries.map(item => item.day))].sort(),
    byDesk: Object.fromEntries([...DESKS, 'unclassified'].map(desk => [desk, entries.filter(item => item.desk === desk).length])),
    byDate: Object.fromEntries([...new Set(entries.map(item => item.day))].sort().map(day => [day, entries.filter(item => item.day === day).length])) };
}

function commissionReport(root, item, news, asOf) {
  const blockers = [...item.holds.map(hold => `Hold: ${hold}`)];
  const add = message => blockers.push(message);
  const recordExists = (file, purpose) => {
    if (!file) { add(`${purpose}: local evidence record missing`); return false; }
    try { readRecord(root, file); return true; } catch { add(`${purpose}: evidence record missing, empty or outside repository`); return false; }
  };
  const briefStages = {};
  if (item.disposition.status === 'passed-over') return { ...item, readiness: 'not-for-publication', briefStages, blockers: [], nextAction: item.nextAction };
  if (isoDay(item.discoveredAt) > asOf) add('Discovery date is after this report date');
  if (item.disposition.status === 'held') add('Commission is explicitly held');
  if (recordExists(item.brief, 'Brief')) {
    try {
      const metadata = frontmatter(readRecord(root, item.brief), item.brief);
      requireThat(metadata.slug === item.id, 'brief slug does not match commission id');
      requireThat(metadata['assigned-editor'] === item.owner, 'brief editor does not match queue owner');
      for (const stage of BRIEF_STAGES) {
        briefStages[stage] = metadata[stage] ?? 'missing';
        if (metadata[stage] !== 'complete') add(`Brief ${stage}: ${briefStages[stage]}`);
      }
      briefStages['chairman-status'] = metadata['chairman-status'] ?? 'missing';
      if (metadata['chairman-status'] !== 'approved') add(`Brief chairman-status: ${briefStages['chairman-status']}`);
    } catch { add('Brief frontmatter, slug or assigned editor does not match the commission'); }
  }
  if (item.draft || ['ready', 'published'].includes(item.stage)) {
    if (recordExists(item.draft, 'Draft')) {
      try {
        const text = readRecord(root, item.draft);
        const metadata = frontmatter(text, item.draft);
        const slug = metadata.slug ?? path.basename(item.draft).replace(/\.mdx?$/, '');
        requireThat(slug === item.id, 'draft identity does not match commission');
        string(metadata.title, 'draft title'); string(metadata.description, 'draft description');
        const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trim();
        requireThat(body.length > 0, 'draft body is empty');
      } catch { add('Draft must match the commission slug and contain title, description and a non-empty body'); }
    }
  }
  if (!item.sources.length) add('No source recorded');
  for (const source of item.sources) {
    if (source.readStatus !== 'read') add(`Source unread: ${source.url}`);
    if (source.claimsStatus !== 'checked') add(`Source claims unverified: ${source.url}`);
    recordExists(source.evidencePath, `Source ${source.url}`);
  }
  if (item.coi.status !== 'declared') add('Contributor/COI declaration pending; do not infer no conflict');
  recordExists(item.coi.record, 'Contributor/COI');
  for (const [field, required] of [['review', true], ['travelSignoff', item.format === 'analysis']]) {
    if (!required) continue;
    const review = item[field];
    if (!review) { add(`${field}: independent reviewer and evidence record missing`); continue; }
    if (review.reviewer.trim().toLowerCase() === item.owner.trim().toLowerCase()) add(`${field}: author cannot approve own work`);
    recordExists(review.record, field);
  }
  if (item.stage === 'published' && (item.publicSlug !== item.id || !news.some(entry => entry.slug === item.id && entry.day <= asOf))) add('Published queue claim lacks the same commission slug in a non-future repository news entry');
  if (!['ready', 'published'].includes(item.stage)) add(`Queue stage ${item.stage} is not a release candidate`);
  return { ...item, briefStages, readiness: blockers.length ? 'blocked' : 'recorded-gates-complete', blockers };
}

export function buildReport({ root = process.cwd(), asOf = new Date().toISOString().slice(0, 10) } = {}) {
  requireThat(/^\d{4}-\d{2}-\d{2}$/.test(asOf), 'asOf must be YYYY-MM-DD'); isoDay(asOf, 'asOf');
  root = realpathSync(root);
  const queue = validateQueue(JSON.parse(readRecord(root, QUEUE)));
  const news = readNews(root);
  const commissions = queue.items.map(item => commissionReport(root, item, news, asOf));
  return { schemaVersion: 1, mode: 'local-read-only', asOf, publicationAuthority: false,
    basis: 'Repository news frontmatter, not verified live publications; dates are UTC-inclusive. Local records do not certify actual source reading, independence, factual acceptance, production state or permission to publish.',
    windows: [outputWindow(news, asOf, 7), outputWindow(news, asOf, 30)],
    repositoryNewsEntries: news.length, futureDatedEntries: news.filter(item => item.day > asOf).map(item => item.file),
    commissions, emptyQueue: commissions.length === 0,
    nextActions: commissions.filter(item => item.readiness !== 'not-for-publication').map(item => ({ id: item.id, owner: item.owner, nextAction: item.nextAction, blockers: item.blockers })) };
}

function safe(value) { return String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/([\\`*_{}\[\]|<>])/g, '\\$1'); }

export function renderReport(report) {
  const lines = [`# Daily news desk — ${report.asOf}`, '', report.basis, '', 'Read-only preflight. No collection, agent activation, issue delivery, data edit, publication or live verification.', '', '## Repository-dated output', '', '| Window | Entries | Airline | Hotel | Banking | Unclassified | Active dates |', '|---|---:|---:|---:|---:|---:|---|'];
  for (const row of report.windows) lines.push(`| ${row.start} to ${row.end} (${row.days} days) | ${row.count} | ${row.byDesk.airline} | ${row.byDesk.hotel} | ${row.byDesk.banking} | ${row.byDesk.unclassified} | ${row.activeDates.join(', ') || 'None'} |`);
  if (report.futureDatedEntries.length) lines.push('', `Future-dated repository entries excluded from these windows: ${report.futureDatedEntries.map(safe).join(', ')}.`);
  lines.push('', '## Explicit commissions');
  if (report.emptyQueue) lines.push('', 'Queue empty. This means no explicit commissions are recorded here; it does not mean no leads, backlog or news exists. Review the live discovery digest separately.');
  for (const item of report.commissions) {
    lines.push('', `### ${safe(item.id)} — ${safe(item.topic)}`, '', `Desk: ${item.desk} · ${item.format} · Owner: ${safe(item.owner)} · Stage: ${item.stage} · Readiness: ${item.readiness}`, '', `Disposition: ${item.disposition.status} — ${safe(item.disposition.reason)}`, '', `Next action: ${safe(item.nextAction)}`, '', `Brief: ${safe(item.brief ?? 'not recorded')}`, '', `Draft: ${safe(item.draft ?? 'not recorded')}`, '', `Sources: ${item.sources.length} recorded; ${item.sources.filter(source => source.readStatus === 'unread').length} unread; ${item.sources.filter(source => source.claimsStatus !== 'checked').length} with unverified claims.`);
    for (const source of item.sources) lines.push(`- ${source.role} · ${source.readStatus} · ${source.claimsStatus} · ${safe(source.url)} · ${safe(source.evidencePath ?? 'no local evidence')}`);
    if (item.blockers.length) { lines.push('', 'Blocking next actions:'); for (const blocker of item.blockers) lines.push(`- ${safe(blocker)}`); }
    else if (item.readiness === 'recorded-gates-complete') lines.push('', 'Recorded local gates only. Independently verify the records and exact-head release checks; this is not publication approval.');
  }
  return `${lines.join('\n')}\n`;
}

export function main(args = process.argv.slice(2)) {
  let asOf; let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json' && !json) json = true;
    else if (args[i] === '--as-of' && asOf === undefined) asOf = args[++i];
    else throw new Error('Usage: node scripts/newsroom/report.mjs [--as-of YYYY-MM-DD] [--json]');
  }
  if (args.includes('--as-of')) requireThat(asOf !== undefined, '--as-of requires a date');
  const report = buildReport({ asOf });
  process.stdout.write(json ? `${JSON.stringify(report, null, 2)}\n` : renderReport(report));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(`Newsroom preflight failed: ${error.message}`); process.exitCode = 1; }
}
