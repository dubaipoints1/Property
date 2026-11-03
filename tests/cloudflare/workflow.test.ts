import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../../.github/workflows/cloudflare-report.yml', import.meta.url), 'utf8');

test('private Cloudflare collector is manual, main-only and read-only in GitHub', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /github\.repository == 'dubaipoints1\/Property'/);
  assert.doesNotMatch(workflow, /^\s+(schedule|pull_request|pull_request_target|push):/m);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.doesNotMatch(workflow, /: write/);
  assert.match(workflow, /persist-credentials: false/);
  const actions = [...workflow.matchAll(/uses: ([^\n]+)/g)];
  assert.equal(actions.length, 3);
  for (const [, action] of actions) assert.match(action, /^[^@]+@[a-f0-9]{40}(?:\s|$)/);
});

test('only collector receives Cloudflare secret and only ciphertext is uploaded', () => {
  assert.equal((workflow.match(/secrets\./g) ?? []).length, 1);
  const collector = workflow.split('- name: Read and encrypt Cloudflare report')[1].split('- name: Retain encrypted report only')[0];
  assert.match(collector, /CLOUDFLARE_ANALYTICS_TOKEN: \$\{\{ secrets\.CLOUDFLARE_ANALYTICS_TOKEN \}\}/);
  assert.match(collector, /REPORT_PUBLIC_KEY: \$\{\{ inputs\.recipient_public_key \}\}/);
  assert.match(collector, /run: node scripts\/cloudflare\/report\.mjs/);
  assert.doesNotMatch(collector.split('run:')[1], /\$\{\{/);
  assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/cloudflare-report\.enc\.json/);
  assert.match(workflow, /retention-days: 1/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.match(workflow, /- name: Retain encrypted report only\n\s+if: always\(\)/);
  assert.doesNotMatch(workflow, /GITHUB_STEP_SUMMARY|npm install|PRIVATE_KEY|decrypt-analytics/);
});
