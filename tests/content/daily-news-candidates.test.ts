import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { compile } from '@mdx-js/mdx';

const slugs = ['daily-news-etihad-damascus-daily', 'daily-news-accor-regional-sale-conditions', 'daily-news-ja-hatta-deadline'];
const stages = ['research-status', 'seo-status', 'draft-status', 'factcheck-status', 'ux-status', 'standards-status', 'tech-status'];
function doc(text: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  assert.ok(match);
  return { data: parse(match[1]), body: match[2] };
}
function publicDocuments(dir: string): { file: string; slug?: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return publicDocuments(file);
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) return [];
    return [{ file, slug: doc(readFileSync(file, 'utf8')).data.slug }];
  });
}
const entries = publicDocuments('src/content');
for (const slug of slugs) {
  test(`${slug} cannot enter any public collection with incomplete article gates`, async () => {
    const brief = doc(readFileSync(`.council/briefs/2026-11-09-${slug}.md`, 'utf8')).data;
    const cleared = brief['chairman-status'] === 'approved' && stages.every(stage => brief[stage] === 'complete');
    if (!cleared) {
      assert.deepEqual(entries.filter(item => path.basename(item.file).replace(/\.mdx?$/, '') === slug || item.slug === slug), []);
      const draft = doc(readFileSync(`.council/drafts/2026-11/${slug}.mdx`, 'utf8'));
      assert.ok(draft.body.trim().length > 0);
      await compile(draft.body);
    }
  });
}
test('a maintenance Chairman approval cannot waive daily article UX or Standards checks', () => {
  const clear = Object.fromEntries([['chairman-status', 'approved'], ...stages.map(stage => [stage, 'complete'])]);
  for (const stage of ['ux-status', 'standards-status', 'factcheck-status']) {
    const mutated = { ...clear, [stage]: 'pending' };
    assert.equal(mutated['chairman-status'] === 'approved' && stages.every(key => mutated[key] === 'complete'), false);
  }
});

test('the owner-withdrawn subject stays outside publication and active commissioning', () => {
  const queue = JSON.parse(readFileSync('.council/newsroom/queue.json', 'utf8'));
  const withdrawn = queue.items.find((item: { id: string }) => item.id === 'daily-news-etihad-damascus-daily');
  assert.equal(withdrawn.stage, 'passed-over');
  assert.equal(withdrawn.disposition.status, 'passed-over');
  assert.match(withdrawn.disposition.reason, /Owner withdrew/);
  const brief = doc(readFileSync('.council/briefs/2026-11-09-daily-news-etihad-damascus-daily.md', 'utf8'));
  assert.equal(brief.data['chairman-status'], 'rejected');
  assert.match(readFileSync('CLAUDE.md', 'utf8'), /2026-11-09 — Exclude Syria-related coverage/);
  for (const entry of entries) {
    assert.doesNotMatch(readFileSync(entry.file, 'utf8'), /\b(?:Syria|Syrian|Damascus)\b/i,
      `Owner-excluded subject in public source: ${entry.file}`);
  }
});
