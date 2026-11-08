import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const SCRIPT = resolve('scripts/ci/deliver-monitor.mjs');
const POST = resolve('scripts/ci/post-digest.sh');
const OLD = '{"seen":{"old":true}}\n';
const NEXT = '{"seen":{"old":true,"new":true}}\n';
const GH = `#!/usr/bin/env bash
set -u
echo "$*" >> "$STUB_LOG"
case "$1 $2" in
  'issue list') [[ "$*" == *'--state open --limit 1 --json number --jq'* ]] || exit 90; exit 0;;
  'issue create') [ "$3" = '--title' ] && [ "$5" = '--body-file' ] && [ -s "$6" ] || exit 91
    [ "$STUB_FAIL" != 'issue' ] || exit 1; exit 0;;
  'workflow run') [ "$3" = 'scrape.yml' ] && [ "$4" = '--ref' ] && [ "$5" = 'main' ] && [ "$6" = '-f' ] && [[ "$7" == bank=* ]] && [ "$#" = 7 ] || exit 92
    [ "$STUB_FAIL" != 'dispatch' ] || exit 1; exit 0;;
  *) exit 93;;
esac
`;
const SAVE = `#!/usr/bin/env bash
set -eu
[ "$1" = save ] || exit 94
echo "state-save $*" >> "$STUB_LOG"
if [ "$STUB_FAIL" = save ]; then exit 1; fi
cp data/monitor/state.json "$STUB_REMOTE"
`;

function run(overrides: Record<string, string> = {}, prepare?: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'monitor-delivery-'));
  try {
    for (const p of ['bin', 'scripts/ci', 'scripts/scrape/banks', 'data/monitor', '.council/monitoring']) mkdirSync(join(dir, p), { recursive: true });
    writeFileSync(join(dir, 'bin/gh'), GH); chmodSync(join(dir, 'bin/gh'), 0o755);
    copyFileSync(POST, join(dir, 'scripts/ci/post-digest.sh'));
    writeFileSync(join(dir, 'scripts/ci/automation-state.sh'), SAVE);
    // Production filenames and contents: an invented *.json fixture previously
    // concealed a .urls suffix bug that rejected all real bank hand-offs.
    for (const bank of ['adcb', 'hsbc']) copyFileSync(resolve(`scripts/scrape/banks/${bank}.urls.json`), join(dir, `scripts/scrape/banks/${bank}.urls.json`));
    writeFileSync(join(dir, 'data/monitor/state.json'), OLD);
    writeFileSync(join(dir, 'data/monitor/state.pending.json'), NEXT);
    writeFileSync(join(dir, 'data/monitor/health.json'), '{"runId":"1234","status":"degraded"}');
    const digests = { CARD: 'card-change', SALARY: 'salary-transfer-change', NEWS: 'digest', HEALTH: 'monitor-health' };
    const env: Record<string, string> = {
      GITHUB_RUN_ID: '1234', MONITOR_HEALTH_RUN: '1234', MONITOR_STATE_RUN: '1234',
      MONITOR_HEALTH_PATH: 'data/monitor/health.json', MONITOR_STATE_PATH: 'data/monitor/state.pending.json',
      MONITOR_DRY_RUN: 'false', MONITOR_BANKS: 'adcb hsbc', STUB_FAIL: '',
      STUB_LOG: join(dir, 'calls.log'), STUB_REMOTE: join(dir, 'remote-state.json'),
    };
    for (const [key, prefix] of Object.entries(digests)) {
      const p = `.council/monitoring/${prefix}-2026-11-08-1200.md`;
      writeFileSync(join(dir, p), `# ${key} signals\n`); env[`MONITOR_${key}_DIGEST`] = p;
    }
    Object.assign(env, overrides); prepare?.(dir);
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env, PATH: `${join(dir, 'bin')}:${process.env.PATH}` } });
    return {
      status: r.status, out: r.stdout + r.stderr,
      canonical: readFileSync(join(dir, 'data/monitor/state.json'), 'utf8'),
      pending: existsSync(join(dir, 'data/monitor/state.pending.json')),
      remote: existsSync(env.STUB_REMOTE) ? readFileSync(env.STUB_REMOTE, 'utf8') : null,
      calls: existsSync(env.STUB_LOG) ? readFileSync(env.STUB_LOG, 'utf8').trim().split('\n') : [],
    };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('all four alerts precede one bank dispatch and remote acknowledgement', () => {
  const r = run(); assert.equal(r.status, 0, r.out);
  const creates = r.calls.filter(c => c.startsWith('issue create'));
  assert.equal(creates.length, 4);
  assert.match(creates[1], /--label salary-transfer-change$/);
  assert.match(creates[3], /--label monitor-health$/);
  assert.match(r.calls.at(-2)!, /^workflow run scrape.yml --ref main -f bank=adcb hsbc$/);
  assert.match(r.calls.at(-1)!, /^state-save save /);
  assert.equal(r.canonical, NEXT); assert.equal(r.remote, NEXT); assert.equal(r.pending, false);
  assert.doesNotMatch(r.calls.at(-1)!, /state.pending|data\/monitor(?:\s|$)/);
});

test('salary-only findings reach a human without a bank scrape', () => {
  const r = run({ MONITOR_BANKS: '', MONITOR_CARD_DIGEST: '', MONITOR_NEWS_DIGEST: '', MONITOR_HEALTH_DIGEST: '' });
  assert.equal(r.status, 0, r.out); assert.equal(r.remote, NEXT);
  assert.equal(r.calls.filter(c => c.startsWith('issue create')).length, 1);
  assert.ok(r.calls.every(c => !c.startsWith('workflow run')));
});

test('failed alert delivery retains the pending changes and never dispatches or saves', () => {
  const r = run({ STUB_FAIL: 'issue' }); assert.equal(r.status, 1);
  assert.equal(r.canonical, OLD); assert.equal(r.pending, true); assert.equal(r.remote, null);
  assert.ok(r.calls.every(c => !/^(workflow run|state-save)/.test(c)));
});

test('failed targeted dispatch is red and cannot acknowledge delivered signals', () => {
  const r = run({ STUB_FAIL: 'dispatch' }); assert.equal(r.status, 1);
  assert.equal(r.canonical, OLD); assert.equal(r.pending, true); assert.equal(r.remote, null);
  assert.equal(r.calls.filter(c => c.startsWith('workflow run')).length, 1);
  assert.ok(r.calls.every(c => !c.startsWith('state-save')));
});

test('a failed remote state save is red and no remote acknowledgement exists', () => {
  const r = run({ STUB_FAIL: 'save' }); assert.equal(r.status, 1);
  assert.equal(r.remote, null);
});

test('a healthy no-findings poll can acknowledge state without an empty issue', () => {
  const r = run({ MONITOR_BANKS: '', MONITOR_CARD_DIGEST: '', MONITOR_SALARY_DIGEST: '', MONITOR_NEWS_DIGEST: '', MONITOR_HEALTH_DIGEST: '' });
  assert.equal(r.status, 0, r.out); assert.equal(r.remote, NEXT);
  assert.equal(r.calls.length, 1); assert.match(r.calls[0], /^state-save /);
});

test('a fatal poll health alert is delivered and archived without advancing seen-state', () => {
  const r = run({ MONITOR_STATE_RUN: '', MONITOR_STATE_PATH: '', MONITOR_BANKS: '', MONITOR_CARD_DIGEST: '', MONITOR_SALARY_DIGEST: '', MONITOR_NEWS_DIGEST: '' });
  assert.equal(r.status, 0, r.out); assert.equal(r.canonical, OLD); assert.equal(r.remote, OLD);
  assert.match(r.calls.at(-1)!, /health.json/);
  assert.doesNotMatch(r.calls.at(-1)!, /state.json/);
});

test('preview performs no external writes, dispatch or local acknowledgement', () => {
  const r = run({ MONITOR_DRY_RUN: 'true' }); assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.calls, []); assert.equal(r.canonical, OLD); assert.equal(r.pending, true);
});

for (const [name, overrides] of Object.entries({
  'stale run marker': { MONITOR_HEALTH_RUN: 'old' },
  'unrecognised digest path': { MONITOR_CARD_DIGEST: '../old.md' },
  'unrecognised bank': { MONITOR_BANKS: 'unknown' },
  'bank without card digest': { MONITOR_CARD_DIGEST: '' },
  'bank without pending state': { MONITOR_STATE_RUN: '' },
  'implicit live mode': { MONITOR_DRY_RUN: '' },
  'unexpected pending state path': { MONITOR_STATE_PATH: 'data/monitor/state.json' },
})) test(`${name} fails before any side effect`, () => {
  const r = run(overrides); assert.equal(r.status, 1); assert.equal(r.canonical, OLD); assert.deepEqual(r.calls, []);
});

test('a symlink digest cannot trick delivery into reading an unrelated file', () => {
  const r = run({}, dir => {
    const p = join(dir, '.council/monitoring/card-change-2026-11-08-1200.md');
    rmSync(p); symlinkSync(join(dir, 'data/monitor/state.json'), p);
  });
  assert.equal(r.status, 1); assert.deepEqual(r.calls, []); assert.equal(r.canonical, OLD);
});

test('stale health bytes cannot be delivered using a fresh environment marker', () => {
  const r = run({}, dir => writeFileSync(join(dir, 'data/monitor/health.json'), '{"runId":"old"}'));
  assert.equal(r.status, 1); assert.deepEqual(r.calls, []); assert.equal(r.canonical, OLD);
});

test('monitor workflow uses fresh outputs and a preview-safe, tested transaction', () => {
  const workflow = readFileSync('.github/workflows/monitor.yml', 'utf8');
  assert.match(workflow, /dry_run:[\s\S]*default: true/);
  assert.match(workflow, /if: always\(\) && steps.poll.outputs.health_written == github.run_id/);
  assert.match(workflow, /run: node scripts\/ci\/deliver-monitor.mjs/);
  assert.doesNotMatch(workflow, /hashFiles|ls -t|\|\| echo "dispatch failed/);
  for (const key of ['card', 'salary', 'news', 'health']) assert.match(workflow, new RegExp(`steps.poll.outputs.${key}_digest_path`));
});
