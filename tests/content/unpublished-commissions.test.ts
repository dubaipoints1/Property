import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { compile } from '@mdx-js/mdx';

function document(text: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  assert.ok(match, 'Explicit YAML frontmatter is required');
  const metadata = parse(match[1]);
  assert.ok(metadata && typeof metadata === 'object', 'Frontmatter must be a mapping');
  return { metadata, body: match[2] };
}
function publicEntries(root: string): { file: string; metadata: Record<string, unknown> }[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return publicEntries(file);
    if (!entry.isFile() || !/\.mdx?$/.test(file)) return [];
    return [{ file, metadata: document(readFileSync(file, 'utf8')).metadata }];
  });
}
const stages = ['research-status', 'seo-status', 'draft-status', 'factcheck-status', 'tech-status'];
function violations(entries: { file: string; metadata: Record<string, unknown> }[], slug: string, brief: Record<string, unknown>) {
  // A Chairman cell alone cannot silently waive pending article stages. Any
  // explicit future waiver needs its own reviewed policy/guard reconciliation.
  const cleared = brief['chairman-status'] === 'approved' && stages.every(stage => brief[stage] === 'complete');
  if (cleared) return [];
  return entries.filter(entry => path.basename(entry.file).replace(/\.mdx?$/, '') === slug || entry.metadata.slug === slug);
}

// These commissioned comparisons have unresolved evidence gates. A Council
// draft outside src is not a published article merely because maintenance merges.
for (const slug of ['salary-bonus-switch-decision', 'hotel-points-rate-premium', 'cash-or-miles-quoted-fares']) {
  test(`unapproved ${slug} stays outside every public editorial collection`, async () => {
    const brief = readFileSync(`.council/briefs/2026-11-08-${slug}.md`, 'utf8');
    const metadata = document(brief).metadata;
    assert.deepEqual(violations(publicEntries('src/content'), slug, metadata), [], 'No unapproved public article, nested entry or frontmatter slug');
    if (metadata['chairman-status'] === 'approved' && stages.every(stage => metadata[stage] === 'complete')) return;
    const draft = `.council/drafts/2026-11/${slug}.mdx`;
    assert.ok(existsSync(draft), 'Keep the held narrative draft');
    await compile(document(readFileSync(draft, 'utf8')).body);
  });
}

test('copy mutations catch Markdown, nested files, explicit slugs and salary/history collections', () => {
  const slug = 'cash-or-miles-quoted-fares';
  const entries = [
    { file: `src/content/guides/${slug}.md`, metadata: {} },
    { file: `src/content/news/nested/${slug}.mdx`, metadata: {} },
    { file: 'src/content/guides/nested/renamed.md', metadata: { slug } },
    { file: `src/content/salaryTransferOffers/${slug}.md`, metadata: {} },
    { file: `src/content/salaryTransferOfferHistory/nested/${slug}.mdx`, metadata: {} },
  ];
  assert.equal(violations(entries, slug, { 'chairman-status': 'pending' }).length, entries.length);
});

test('maintenance approval or an article Chairman cell alone cannot clear missing article stages', () => {
  const slug = 'hotel-points-rate-premium';
  const entry = [{ file: `src/content/guides/${slug}.mdx`, metadata: {} }];
  assert.equal(violations(entry, slug, { 'chairman-status': 'approved' }).length, 1);
  const approved = Object.fromEntries([['chairman-status', 'approved'], ...stages.map(stage => [stage, 'complete'])]);
  assert.equal(violations(entry, slug, approved).length, 0);
  assert.equal(violations(entry, slug, { ...approved, 'factcheck-status': 'pending' }).length, 1);
});
