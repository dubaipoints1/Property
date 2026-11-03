import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { inspectText, inspectRepository, formatFindings } from '../../scripts/ci/check-research-secrets.mjs';

// Construct a fake match at runtime: never commit an API-key-shaped fixture.
const fakeKey = ['AI', 'za', 'x'.repeat(35)].join('');
const git = process.env.DP_GIT || 'git';

test('reports file and line without disclosing a Google-style key', () => {
  const findings = inspectText('capture.txt', `heading\n${fakeKey}\n`);
  assert.deepEqual(findings, [{ path: 'capture.txt', line: 2, rule: 'google-api-key' }]);
  assert.ok(!JSON.stringify(findings).includes(fakeKey));
  assert.ok(!formatFindings(findings).includes(fakeKey));
  assert.ok(!JSON.stringify(inspectText(`${fakeKey}.txt`, fakeKey)).includes(fakeKey));
  assert.ok(!formatFindings([{ path: `${fakeKey}.txt`, line: 1, rule: 'google-api-key' }]).includes(fakeKey));
  assert.deepEqual(inspectText('safe.md', 'Use GoogleMapsAPIKey from the environment.'), []);
});

test('the real CLI rejects binary and symlink candidate captures and redacts key-shaped filenames', () => {
  const root = mkdtempSync(join(tmpdir(), 'dp-capture-guard-'));
  try {
    execFileSync(git, ['init', '-q', root]);
    mkdirSync(join(root, 'candidates'));
    writeFileSync(join(root, 'candidates', 'nul.html'), Buffer.from([0, 65]));
    writeFileSync(join(root, 'candidates', 'page\npart.html'), '<html></html>');
    writeFileSync(join(root, 'safe.txt'), 'clean');
    symlinkSync('../safe.txt', join(root, 'candidates', 'link.json'));
    writeFileSync(join(root, `${fakeKey}.txt`), fakeKey);
    execFileSync(git, ['add', '.'], { cwd: root });
    const findings = inspectRepository(root, git);
    assert.equal(findings.filter(finding => finding.rule === 'raw-research-capture').length, 3);
    assert.ok(!JSON.stringify(findings).includes(fakeKey));
    const result = spawnSync(process.execPath, [resolve('scripts/ci/check-research-secrets.mjs')], {
      cwd: root, encoding: 'utf8', env: { ...process.env, DP_GIT: git },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /nul\.html.*raw-research-capture/);
    assert.match(result.stderr, /link\.json.*raw-research-capture/);
    assert.match(result.stderr, /REDACTED_GOOGLE_API_KEY/);
    assert.ok(!`${result.stdout}${result.stderr}`.includes(fakeKey));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects raw candidate HTML and JSON but permits curated source excerpts', () => {
  for (const path of ['candidates/dnata-home.html', 'candidates/nested/page.HTM', 'candidates/config.json', 'candidates/page\npart.html']) {
    assert.equal(inspectText(path, '{}')[0].rule, 'raw-research-capture');
  }
  assert.deepEqual(inspectText('.council/research/2026-11/source-excerpt.md', 'A sourced excerpt.'), []);
});

test('the real CLI rejects a tracked key, keeps logs redacted, ignores untracked captures and does not follow symlinks', () => {
  const root = mkdtempSync(join(tmpdir(), 'dp-secret-guard-'));
  try {
    execFileSync(git, ['init', '-q', root]);
    writeFileSync(join(root, 'untracked.html'), fakeKey);
    writeFileSync(join(root, 'safe.txt'), 'clean');
    symlinkSync('untracked.html', join(root, 'linked.txt'));
    execFileSync(git, ['add', 'safe.txt', 'linked.txt'], { cwd: root });
    assert.deepEqual(inspectRepository(root, git), []);
    writeFileSync(join(root, 'tracked.txt'), `first line\n${fakeKey}`);
    execFileSync(git, ['add', 'tracked.txt'], { cwd: root });
    const result = spawnSync(process.execPath, [resolve('scripts/ci/check-research-secrets.mjs')], {
      cwd: root, encoding: 'utf8', env: { ...process.env, DP_GIT: git },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /tracked\.txt.*:2: google-api-key/);
    assert.ok(!`${result.stdout}${result.stderr}`.includes(fakeKey));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
