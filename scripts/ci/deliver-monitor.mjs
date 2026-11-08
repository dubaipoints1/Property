// Deliver this poll's findings before acknowledging any check. No provider API
// calls live here: the only bank hand-off is the existing deterministic workflow.
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, renameSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIGESTS = [
  ['CARD', 'card-change', 'Card change signals', /^\.council\/monitoring\/card-change-\d{4}-\d{2}-\d{2}-\d{4}\.md$/],
  ['SALARY', 'salary-transfer-change', 'Salary-transfer change signals', /^\.council\/monitoring\/salary-transfer-change-\d{4}-\d{2}-\d{2}-\d{4}\.md$/],
  ['NEWS', 'news-digest', 'News change signals', /^\.council\/monitoring\/digest-\d{4}-\d{2}-\d{2}-\d{4}\.md$/],
  ['HEALTH', 'monitor-health', 'Monitor coverage alert', /^\.council\/monitoring\/monitor-health-\d{4}-\d{2}-\d{2}-\d{4}\.md$/],
];

function regularFile(path, root) {
  if (!lstatSync(path).isFile() || !realpathSync(path).startsWith(realpathSync(root) + sep)) {
    throw new Error(`Not a regular in-repository file: ${path}`);
  }
  if (!readFileSync(path).length) throw new Error(`Empty monitor output: ${path}`);
}

export function deliverMonitor(env = process.env, cwd = process.cwd()) {
  const runId = env.GITHUB_RUN_ID;
  if (!runId || env.MONITOR_HEALTH_RUN !== runId) throw new Error('No fresh health output for this run');
  const healthPath = env.MONITOR_HEALTH_PATH;
  if (healthPath !== 'data/monitor/health.json') throw new Error('Unexpected health path');
  regularFile(resolve(cwd, healthPath), cwd);
  const health = JSON.parse(readFileSync(resolve(cwd, healthPath), 'utf8'));
  if (String(health.runId) !== runId) throw new Error('Health report belongs to a different run');

  // Validate the WHOLE delivery plan before causing any external side effect.
  const digests = DIGESTS.flatMap(([key, label, title, pattern]) => {
    const path = env[`MONITOR_${key}_DIGEST`] || '';
    if (!path) return [];
    if (!pattern.test(path)) throw new Error(`Unexpected ${key} digest path`);
    regularFile(resolve(cwd, path), cwd);
    return [{ path, label, title }];
  });
  const stateReady = env.MONITOR_STATE_RUN === runId;
  if (stateReady) {
    if (env.MONITOR_STATE_PATH !== 'data/monitor/state.pending.json') throw new Error('Unexpected candidate state path');
    regularFile(resolve(cwd, env.MONITOR_STATE_PATH), cwd);
    JSON.parse(readFileSync(resolve(cwd, env.MONITOR_STATE_PATH), 'utf8'));
  }
  const banks = (env.MONITOR_BANKS || '').trim().split(/\s+/).filter(Boolean);
  const allowed = new Set(readdirSync(resolve(cwd, 'scripts/scrape/banks')).filter(p => p.endsWith('.urls.json')).map(p => p.slice(0, -'.urls.json'.length)));
  if (new Set(banks).size !== banks.length || banks.some(b => !allowed.has(b))) throw new Error('Unexpected targeted scrape bank');
  if (banks.length && (!stateReady || !env.MONITOR_CARD_DIGEST)) throw new Error('Bank hand-off needs a card digest and candidate state');
  if (env.MONITOR_DRY_RUN === 'true') {
    console.log('Preview only: no issue, dispatch, acknowledgement or state save.');
    return;
  }
  if (env.MONITOR_DRY_RUN !== 'false') throw new Error('Live delivery requires an explicit non-preview mode');
  const run = (bin, args) => execFileSync(bin, args, { cwd, env, stdio: 'inherit' });
  for (const { path, label, title } of digests) {
    run('bash', ['scripts/ci/post-digest.sh', label, `${title}: run ${runId}`, path]);
  }
  // A refused dispatch must leave canonical seen-state untouched. The next poll
  // then retries; duplicated alerts are preferable to a lost change signal.
  if (banks.length) run('gh', ['workflow', 'run', 'scrape.yml', '--ref', 'main', '-f', `bank=${banks.join(' ')}`]);
  const paths = [healthPath, ...digests.map(d => d.path)];
  if (stateReady) {
    renameSync(resolve(cwd, env.MONITOR_STATE_PATH), resolve(cwd, 'data/monitor/state.json'));
    paths.push('data/monitor/state.json');
  }
  // Remote acknowledgement is the successful atomic state-branch commit. A
  // failed save is red and leaves remote state unchanged for the next checkout.
  run('bash', ['scripts/ci/automation-state.sh', 'save', `monitor: delivered signals (run ${runId})`, ...paths]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { deliverMonitor(); } catch (error) {
    console.error(`::error title=Monitor hand-off failed::${error.message}`);
    process.exitCode = 1;
  }
}
