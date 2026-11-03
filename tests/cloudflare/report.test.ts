import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { decryptReport } from '../../scripts/cloudflare/analytics-crypto.mjs';
import { createEncryptedReport, writeEncryptedReport } from '../../scripts/cloudflare/report.mjs';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
const token = 'synthetic-cloudflare-token-never-log';
const rawMarker = 'PRIVATE-PROVIDER-RESPONSE-MUST-NOT-SURVIVE';
const env = {
  GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main',
  CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), REPORT_PUBLIC_KEY: publicKey, CLOUDFLARE_ANALYTICS_TOKEN: token,
};
const now = new Date('2026-11-03T12:00:00Z');
const project = {
  name: 'dubaipoints', domains: ['dubaipoints.pages.dev', 'dubaipoints.ae'], modified_on: '2026-11-01T08:00:00Z',
  env_vars: { private_token: { value: rawMarker } },
  build_config: { web_analytics_tag: 'c'.repeat(32), web_analytics_token: rawMarker, other_config: rawMarker },
  canonical_deployment: {
    id: '12345678-abcd-1234-abcd-123456789012', environment: 'production', latest_stage: { status: 'success' },
    deployment_trigger: { metadata: { commit_hash: 'b'.repeat(40), commit_message: rawMarker } },
    created_on: '2026-11-01T08:00:00Z', modified_on: '2026-11-01T08:01:00Z', env_vars: { value: rawMarker },
  },
  latest_deployment: { environment: 'preview', id: rawMarker },
};
const schemaTypes = [
  { name: 'Account', kind: 'OBJECT' },
  { name: 'AccountRumPageloadEventsAdaptiveGroups', kind: 'OBJECT' },
  { name: 'AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject', kind: 'INPUT_OBJECT' },
  { name: 'UnrelatedType', kind: 'OBJECT' },
];

function json(value, init = {}) { return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' }, ...init }); }
function mockApi({ pages = null, types = schemaTypes, fail = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    assert.equal(new URL(url).origin, 'https://api.cloudflare.com');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, `Bearer ${token}`);
    assert.ok(options.signal instanceof AbortSignal);
    if (fail) return fail(url, options);
    if (options.method === 'GET') {
      const page = Number(new URL(url).searchParams.get('page'));
      return json(pages ? pages(page) : { success: true, result: [project], result_info: { page: 1, total_pages: 1, total_count: 1 } });
    }
    const query = JSON.parse(options.body).query;
    assert.ok(!query.includes('viewer'));
    assert.ok(!query.includes('sum(visits)'));
    if (query.includes('__schema')) return json({ data: { __schema: { types } } });
    const data = {};
    for (const match of query.matchAll(/t(\d+): __type\(name: "([^"]+)"\)/g)) {
      const type = types.find(type => type.name === match[2]);
      data[`t${match[1]}`] = {
        ...type,
        description: rawMarker,
        fields: type.name === 'Account'
          ? [...Array.from({ length: 130 }, (_, index) => ({ name: `unrelated${index}`, type: { kind: 'SCALAR', name: 'String' }, args: [] })), { name: 'rumPageloadEventsAdaptiveGroups', type: { kind: 'LIST', name: null, ofType: { kind: 'OBJECT', name: 'AccountRumPageloadEventsAdaptiveGroups' } }, args: [] }]
          : [{ name: 'count', type: { kind: 'SCALAR', name: 'UInt64' }, args: [], description: rawMarker }],
        inputFields: [{ name: 'requestHost', type: { kind: 'SCALAR', name: 'String' }, defaultValue: rawMarker }],
      };
    }
    return json({ data });
  };
  return { calls, fetchImpl };
}

test('manual-main context, account and recipient validation happen before any network access', async () => {
  const api = mockApi();
  for (const change of [{ GITHUB_ACTIONS: 'false' }, { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_EVENT_NAME: 'push' }, { GITHUB_REF: 'refs/heads/codex/test' }, { CLOUDFLARE_ACCOUNT_ID: '../wrong' }, { REPORT_PUBLIC_KEY: 'bad' }, { CLOUDFLARE_ANALYTICS_TOKEN: '' }]) {
    await assert.rejects(createEncryptedReport({ env: { ...env, ...change }, fetchImpl: api.fetchImpl, now }));
  }
  assert.equal(api.calls.length, 0);
});

test('verifies exact Pages domain, encrypts only allowlisted production fields and returns honest schema-only diagnostic', async () => {
  const api = mockApi();
  const result = await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now });
  assert.equal(result.status, 'requires_verified_query');
  const report = decryptReport(result.envelope, privateKey);
  assert.equal(report.hostname, 'dubaipoints.ae');
  assert.equal(report.pages.status, 'domain_verified');
  assert.equal(report.pages.productionDeployment.environment, 'production');
  assert.equal(report.pages.productionDeployment.commitHash, 'b'.repeat(40));
  assert.equal(report.pages.analyticsSiteTag, 'c'.repeat(32));
  assert.equal(report.pages.beaconConfigured, true);
  assert.equal(report.analytics.status, 'requires_verified_query');
  assert.equal(report.analytics.metrics, null);
  assert.match(report.analytics.accessNote, /does not verify account RUM data access/);
  assert.equal(report.analytics.schema.types.length, 3);
  assert.equal(report.analytics.schema.types[0].fieldsScope, 'rum_only');
  assert.deepEqual(report.analytics.schema.types[0].fields.map(field => field.name), ['rumPageloadEventsAdaptiveGroups']);
  assert.equal(report.requestedWindow.start, '2026-10-01T00:00:00.000Z');
  assert.equal(report.requestedWindow.end, '2026-11-01T00:00:00.000Z');
  assert.equal(report.requestedWindow.endExclusive, true);
  assert.equal(report.requestedWindow.applied, false);
  assert.ok(!JSON.stringify(report).includes(rawMarker));
  assert.ok(!JSON.stringify(report).includes(token));
  assert.ok(!JSON.stringify(result.envelope).includes('productionDeployment'));
  assert.equal(api.calls.length, 3);
  assert.match(api.calls[0].url, /accounts\/a{32}\/pages\/projects\?page=1&per_page=100$/);
  assert.ok(api.calls.slice(1).every(call => new URL(call.url).pathname === '/client/v4/graphql'));
});

test('paginates fully and fails closed on project identity while allowing only global schema discovery', async () => {
  const paginated = mockApi({ pages: page => ({ success: true, result: page === 1 ? [{ name: 'other', domains: ['other.example'] }] : [project], result_info: { page, total_pages: 2, total_count: 2 } }) });
  const report = decryptReport((await createEncryptedReport({ env, fetchImpl: paginated.fetchImpl, now })).envelope, privateKey);
  assert.equal(report.pages.status, 'domain_verified');
  assert.equal(paginated.calls.filter(call => call.options.method === 'GET').length, 2);
  for (const pages of [
    () => ({ success: true, result: [{ ...project, domains: ['www.dubaipoints.ae'] }], result_info: { page: 1, total_count: 1 } }),
    () => ({ success: true, result: [project, { ...project, name: 'duplicate' }], result_info: { page: 1, total_count: 2 } }),
    page => ({ success: true, result: [project], result_info: { page, total_pages: 20 } }),
    page => ({ success: true, result: [project], result_info: { page, total_pages: 2, total_count: 1 } }),
    () => ({ success: true, result: [project] }),
  ]) {
    const api = mockApi({ pages });
    const result = await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now });
    assert.equal(result.status, 'unavailable');
    const diagnostic = decryptReport(result.envelope, privateKey);
    assert.equal(diagnostic.analytics.metrics, null);
    assert.equal(diagnostic.pages.status, 'unavailable');
    assert.equal(diagnostic.analytics.identityStatus, 'not_verified');
    assert.equal(diagnostic.analytics.status, 'requires_verified_query');
    assert.ok(api.calls.filter(call => call.options.method === 'POST').every(call => /__schema|__type/.test(JSON.parse(call.options.body).query)));
    assert.ok(api.calls.filter(call => call.options.method === 'GET').length <= 10);
  }
});

test('without pagination totals requests an empty terminal page; preview metadata is not substituted for production', async () => {
  const api = mockApi({ pages: page => ({ success: true, result: page === 1 ? [{ ...project, canonical_deployment: null, build_config: { web_analytics_tag: 'invalid', web_analytics_token: '' } }] : [] }) });
  const diagnostic = decryptReport((await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now })).envelope, privateKey);
  assert.equal(api.calls.filter(call => call.options.method === 'GET').length, 2);
  assert.equal(diagnostic.pages.productionDeployment.status, 'unavailable');
  assert.equal(diagnostic.pages.analyticsSiteTag, null);
  assert.equal(diagnostic.pages.beaconConfigured, null);
  assert.ok(!JSON.stringify(diagnostic).includes(rawMarker));
});

test('raw provider errors, thrown exceptions, oversized bodies and redirects never survive into diagnostics', async () => {
  const failures = [
    () => json({ success: false, errors: [{ message: `${rawMarker} ${token}` }] }),
    () => json({ errors: [{ message: rawMarker }] }, { status: 403 }),
    () => { throw new Error(`${rawMarker} ${token}`); },
    () => new Response(rawMarker, { headers: { 'content-length': '6000000' } }),
    () => new Response(rawMarker),
    () => ({ ok: true, redirected: true, body: null }),
  ];
  for (const fail of failures) {
    const api = mockApi({ fail });
    const result = await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now });
    assert.equal(result.status, 'unavailable');
    const report = decryptReport(result.envelope, privateKey);
    assert.ok(!JSON.stringify(report).includes(rawMarker));
    assert.ok(!JSON.stringify(report).includes(token));
    assert.equal(report.analytics.metrics, null);
  }
});

test('absent RUM schema and GraphQL errors remain unavailable, never fabricated zero metrics', async () => {
  const absent = mockApi({ types: [{ name: 'Account', kind: 'OBJECT' }] });
  const report = decryptReport((await createEncryptedReport({ env, fetchImpl: absent.fetchImpl, now })).envelope, privateKey);
  assert.equal(report.analytics.status, 'unavailable');
  assert.equal(report.analytics.reason, 'rum_schema_not_available');
  assert.equal(report.analytics.metrics, null);
  const api = mockApi();
  const fetchImpl = (url, options) => options.method === 'GET' ? api.fetchImpl(url, options) : json({ errors: [{ message: `${rawMarker} ${token}` }] });
  const errorReport = decryptReport((await createEncryptedReport({ env, fetchImpl, now })).envelope, privateKey);
  assert.equal(errorReport.analytics.status, 'unavailable');
  assert.equal(errorReport.analytics.reason, 'api_reported_error');
  assert.equal(errorReport.analytics.diagnostics.httpStatus, 200);
  assert.ok(!JSON.stringify(errorReport).includes(rawMarker));
});

test('HTTP diagnostic retains only status and bounded numeric Cloudflare codes, encrypted only', async () => {
  for (const status of [401, 403, 500, 503]) {
    const api = mockApi({ fail: () => json({
      success: false,
      errors: [
        { code: 10000, message: `${rawMarker} ${token}`, source: { pointer: rawMarker } },
        { code: '10001', message: rawMarker },
        { code: -1 }, { code: 1.25 }, { code: 1000001 },
        { extensions: { code: 1001, message: rawMarker } },
      ],
      private_payload: rawMarker,
    }, { status }) });
    const result = await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now });
    const report = decryptReport(result.envelope, privateKey);
    assert.equal(result.status, 'unavailable');
    assert.equal(report.pages.reason, 'http_error');
    assert.deepEqual(report.pages.diagnostics, { httpStatus: status, transportError: null, cloudflareErrorCodes: [10000, 1001] });
    assert.deepEqual(report.analytics.diagnostics, report.pages.diagnostics);
    assert.equal(report.analytics.identityStatus, 'not_verified');
    assert.equal(report.analytics.metrics, null);
    assert.ok(!JSON.stringify(report).includes(rawMarker));
    assert.ok(!JSON.stringify(report).includes(token));
    assert.ok(!JSON.stringify(result).includes('httpStatus'));
    assert.ok(!JSON.stringify(result).includes('cloudflareErrorCodes'));
    assert.equal(api.calls.length, 2);
  }
});

test('a failed Pages permission check does not prevent schema-only discovery or authorise account-data queries', async () => {
  const api = mockApi();
  const calls = [];
  const fetchImpl = (url, options) => {
    calls.push({ url, options });
    return options.method === 'GET' ? json({ errors: [{ code: 10000, message: rawMarker }] }, { status: 403 }) : api.fetchImpl(url, options);
  };
  const result = await createEncryptedReport({ env, fetchImpl, now });
  const report = decryptReport(result.envelope, privateKey);
  assert.equal(result.status, 'unavailable');
  assert.equal(report.pages.diagnostics.httpStatus, 403);
  assert.equal(report.analytics.status, 'requires_verified_query');
  assert.equal(report.analytics.identityStatus, 'not_verified');
  assert.equal(report.analytics.schema.types.length, 3);
  assert.equal(report.analytics.metrics, null);
  assert.equal(calls.length, 3);
  for (const call of calls.filter(call => call.options.method === 'POST')) {
    const query = JSON.parse(call.options.body).query;
    assert.match(query, /__schema|__type/);
    assert.ok(!/viewer\s*\{|accounts\s*\(|zones\s*\(/.test(query));
  }
});

test('transport diagnostics use fixed categories and omit all raw exceptions, hostnames and request data', async () => {
  const cases = [
    ['ENOTFOUND', 'dns'], ['EAI_AGAIN', 'dns'], ['ERR_TLS_CERT_ALTNAME_INVALID', 'tls'],
    ['ETIMEDOUT', 'timeout'], ['UND_ERR_CONNECT_TIMEOUT', 'timeout'],
    ['ECONNREFUSED', 'connection'], ['ECONNRESET', 'connection'], [rawMarker, 'request_failed'],
  ];
  for (const [code, category] of cases) {
    const api = mockApi({ fail: () => { throw Object.assign(new Error(`${rawMarker} ${token}`), { cause: { code, hostname: rawMarker, request: token } }); } });
    const report = decryptReport((await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now })).envelope, privateKey);
    assert.deepEqual(report.pages.diagnostics, { httpStatus: null, transportError: category, cloudflareErrorCodes: [] });
    assert.ok(!JSON.stringify(report).includes(rawMarker));
    assert.ok(!JSON.stringify(report).includes(token));
  }
  const aborted = mockApi({ fail: () => { throw Object.assign(new Error(rawMarker), { name: 'AbortError' }); } });
  const timedOut = decryptReport((await createEncryptedReport({ env, fetchImpl: aborted.fetchImpl, now })).envelope, privateKey);
  assert.equal(timedOut.pages.diagnostics.transportError, 'timeout');
});

test('writes encrypted envelope only with private permissions and refuses overwrite; CLI errors are generic', async () => {
  const root = mkdtempSync(join(tmpdir(), 'dp-analytics-report-'));
  try {
    const path = join(root, 'report.enc.json');
    const api = mockApi();
    const result = await createEncryptedReport({ env, fetchImpl: api.fetchImpl, now });
    assert.throws(() => writeEncryptedReport(path, { analytics: rawMarker }), /Only an encrypted/);
    writeEncryptedReport(path, result.envelope);
    assert.equal(statSync(path).mode & 0o777, 0o600);
    assert.ok(!readFileSync(path, 'utf8').includes(rawMarker));
    assert.throws(() => writeEncryptedReport(path, result.envelope));
    const cli = spawnSync(process.execPath, [resolve('scripts/cloudflare/report.mjs')], { encoding: 'utf8', env: { ...env, GITHUB_ACTIONS: 'false' } });
    assert.equal(cli.status, 1);
    assert.ok(!`${cli.stdout}${cli.stderr}`.includes(token));
    assert.ok(!`${cli.stdout}${cli.stderr}`.includes(publicKey));
    assert.match(cli.stderr, /^Cloudflare diagnostic could not be completed\./);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
