import { constants, closeSync, openSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ANALYTICS_HOSTNAME, encryptReport, validateAccountId, validateRecipientPublicKey } from './analytics-crypto.mjs';

const API_ORIGIN = 'https://api.cloudflare.com';
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 10;
const MAX_SCHEMA_TYPES = 24;
const GRAPHQL_NAME = /^[_A-Za-z][_0-9A-Za-z]{0,159}$/;
const TYPE_KINDS = new Set(['SCALAR', 'OBJECT', 'INTERFACE', 'UNION', 'ENUM', 'INPUT_OBJECT', 'LIST', 'NON_NULL']);
const TYPE_REF_QUERY = 'kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }';

class SafeApiError extends Error {
  constructor(code) {
    super('Cloudflare read-only diagnostic is unavailable.');
    this.code = code;
  }
}

async function readJson(fetchImpl, url, token, body = null) {
  const target = new URL(url);
  if (target.origin !== API_ORIGIN || !target.pathname.startsWith('/client/v4/')) throw new SafeApiError('invalid_api_target');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetchImpl(target.href, {
      method: body === null ? 'GET' : 'POST',
      redirect: 'error',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body === null ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === null ? {} : { body: JSON.stringify(body) }),
    });
    if (response.redirected || (response.url && new URL(response.url).origin !== API_ORIGIN) || !response.ok) {
      await response.body?.cancel();
      throw new SafeApiError('api_request_unavailable');
    }
    const declaredSize = response.headers.get('content-length');
    if (declaredSize && (!/^\d+$/.test(declaredSize) || Number(declaredSize) > MAX_RESPONSE_BYTES)) {
      await response.body?.cancel();
      throw new SafeApiError('response_limit_exceeded');
    }
    if (!response.body) throw new SafeApiError('api_response_unavailable');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new SafeApiError('response_limit_exceeded');
        }
        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }
    return JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
  } catch (error) {
    if (error instanceof SafeApiError) throw error;
    // Never preserve the provider response, exception text, request or token.
    throw new SafeApiError('api_request_unavailable');
  } finally {
    clearTimeout(timer);
  }
}

function safeDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function selectProject(project) {
  // The Pages response can include environment credentials. Never retain it.
  const canonical = project.canonical_deployment;
  const siteTag = project.build_config?.web_analytics_tag;
  const analyticsSiteTag = typeof siteTag === 'string' && /^[a-f0-9]{32}$/i.test(siteTag) ? siteTag.toLowerCase() : null;
  const beaconConfigured = typeof project.build_config?.web_analytics_token === 'string' && project.build_config.web_analytics_token.length > 0 ? true : null;
  let deployment = { status: 'unavailable', reason: 'no_verified_production_deployment' };
  if (canonical && canonical.environment === 'production') {
    const stageStatus = canonical.latest_stage?.status;
    const commit = canonical.deployment_trigger?.metadata?.commit_hash;
    deployment = {
      environment: 'production',
      id: typeof canonical.id === 'string' && /^[a-f0-9-]{1,64}$/i.test(canonical.id) ? canonical.id : null,
      status: ['success', 'failure', 'canceled', 'active', 'queued'].includes(stageStatus) ? stageStatus : 'unavailable',
      commitHash: typeof commit === 'string' && /^[a-f0-9]{7,64}$/i.test(commit) ? commit : null,
      createdOn: safeDate(canonical.created_on),
      modifiedOn: safeDate(canonical.modified_on),
    };
  }
  return {
    status: 'domain_verified',
    hostname: ANALYTICS_HOSTNAME,
    projectName: typeof project.name === 'string' && /^[a-z0-9-]{1,100}$/.test(project.name) ? project.name : null,
    modifiedOn: safeDate(project.modified_on),
    analyticsSiteTag,
    beaconConfigured,
    analyticsConfigurationNote: 'Only an observed nonempty beacon configuration is marked true; missing configuration is unknown, not proof that tracking is disabled.',
    productionDeployment: deployment,
  };
}

async function verifyPagesProject(accountId, token, fetchImpl) {
  const matches = [];
  let seen = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await readJson(fetchImpl, `${API_ORIGIN}/client/v4/accounts/${accountId}/pages/projects?page=${page}&per_page=100`, token);
    if (body?.success !== true || !Array.isArray(body.result)) throw new SafeApiError('pages_list_unavailable');
    const projects = body.result;
    seen += projects.length;
    for (const project of projects) {
      if (project && Array.isArray(project.domains) && project.domains.includes(ANALYTICS_HOSTNAME)) matches.push(selectProject(project));
    }
    const info = body.result_info;
    if (info?.page !== undefined && info.page !== page) throw new SafeApiError('pages_pagination_incomplete');
    const totalPages = info?.total_pages;
    const totalCount = info?.total_count;
    if (totalPages !== undefined && (!Number.isSafeInteger(totalPages) || totalPages < 0 || totalPages > MAX_PAGES)) throw new SafeApiError('pages_pagination_incomplete');
    if (totalCount !== undefined && (!Number.isSafeInteger(totalCount) || totalCount < 0 || totalCount > MAX_PAGES * 100)) throw new SafeApiError('pages_pagination_incomplete');
    const completeByPages = totalPages !== undefined && page >= totalPages;
    const completeByCount = totalCount !== undefined && seen >= totalCount;
    if (totalPages !== undefined && totalCount !== undefined && completeByPages !== completeByCount) throw new SafeApiError('pages_pagination_incomplete');
    if ((completeByPages || completeByCount) && totalCount !== undefined && seen !== totalCount) throw new SafeApiError('pages_pagination_incomplete');
    if (completeByPages || completeByCount || (projects.length === 0 && totalPages === undefined && totalCount === undefined)) {
      if (matches.length !== 1) throw new SafeApiError(matches.length ? 'pages_domain_match_ambiguous' : 'pages_domain_not_found');
      return matches[0];
    }
    if (!projects.length) throw new SafeApiError('pages_pagination_incomplete');
    // With no totals, request the next page even when this page is short.
    // A missing pagination contract must not be mistaken for a complete list.
  }
  throw new SafeApiError('pages_pagination_incomplete');
}

function typeReference(value, depth = 0) {
  if (!value || depth > 5 || !TYPE_KINDS.has(value.kind)) return null;
  return {
    kind: value.kind,
    name: typeof value.name === 'string' && GRAPHQL_NAME.test(value.name) ? value.name : null,
    ...(value.ofType ? { ofType: typeReference(value.ofType, depth + 1) } : {}),
  };
}

function selectFields(values, withArgs) {
  if (!Array.isArray(values)) return [];
  return values.filter(value => value && typeof value.name === 'string' && GRAPHQL_NAME.test(value.name)).slice(0, 120).map(value => ({
    name: value.name,
    type: typeReference(value.type),
    ...(withArgs ? { args: selectFields(value.args, false).slice(0, 20) } : {}),
  }));
}

async function inspectRumSchema(token, fetchImpl) {
  const list = await readJson(fetchImpl, `${API_ORIGIN}/client/v4/graphql`, token, {
    query: 'query DubaiPointsRumTypeNames { __schema { types { name kind } } }',
  });
  if (list?.errors?.length || !Array.isArray(list?.data?.__schema?.types)) throw new SafeApiError('schema_introspection_unavailable');
  const relevant = list.data.__schema.types.filter(type => type && typeof type.name === 'string' && GRAPHQL_NAME.test(type.name) && TYPE_KINDS.has(type.kind) && (type.name === 'Account' || /rum.*(?:pageload|performance)/i.test(type.name)));
  const unique = [...new Map(relevant.map(type => [type.name, { name: type.name, kind: type.kind }])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const selected = unique.slice(0, MAX_SCHEMA_TYPES);
  const names = { types: selected, truncated: unique.length > selected.length, maxTypes: MAX_SCHEMA_TYPES };
  if (!selected.some(type => /rum.*(?:pageload|performance)/i.test(type.name))) {
    return { status: 'unavailable', reason: 'rum_schema_not_available', schema: names };
  }
  const fields = selected.map((type, index) => `t${index}: __type(name: ${JSON.stringify(type.name)}) { name kind fields { name type { ${TYPE_REF_QUERY} } args { name type { ${TYPE_REF_QUERY} } } } inputFields { name type { ${TYPE_REF_QUERY} } } }`).join('\n');
  try {
    const details = await readJson(fetchImpl, `${API_ORIGIN}/client/v4/graphql`, token, { query: `query DubaiPointsRumTypeDetails { ${fields} }` });
    if (details?.errors?.length || !details?.data || typeof details.data !== 'object') throw new SafeApiError('schema_detail_unavailable');
    const types = selected.map((type, index) => {
      const detail = details.data[`t${index}`];
      if (!detail || detail.name !== type.name || detail.kind !== type.kind) throw new SafeApiError('schema_detail_unavailable');
      // Account can expose hundreds of datasets. Preserve its RUM fields
      // rather than silently cutting them off behind unrelated datasets.
      const fields = type.name === 'Account' && Array.isArray(detail.fields) ? detail.fields.filter(field => typeof field?.name === 'string' && /rum/i.test(field.name)) : detail.fields;
      return {
        ...type,
        fields: selectFields(fields, true),
        fieldsScope: type.name === 'Account' ? 'rum_only' : 'all',
        inputFields: selectFields(detail.inputFields, false),
        fieldsTruncated: Array.isArray(fields) && fields.length > 120,
        inputFieldsTruncated: Array.isArray(detail.inputFields) && detail.inputFields.length > 120,
      };
    });
    return { status: 'requires_verified_query', reason: 'metric_query_not_yet_verified', schema: { ...names, types } };
  } catch {
    return { status: 'requires_verified_query', reason: 'schema_detail_unavailable', schema: names };
  }
}

export async function createEncryptedReport({ env = process.env, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  // Defence in depth: this token-consuming entrypoint is only for an owner-
  // dispatched workflow on main, never a PR, push, schedule or local shell.
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('Run the private diagnostic through the main-branch manual workflow only.');
  const accountId = validateAccountId(env.CLOUDFLARE_ACCOUNT_ID);
  validateRecipientPublicKey(env.REPORT_PUBLIC_KEY);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('A valid report time is required.');
  const token = env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (typeof token !== 'string' || !token || token.length > 1024 || /[\r\n]/.test(token)) throw new Error('The Cloudflare read-only analytics token is unavailable.');
  const report = {
    version: 1,
    generatedAt: now.toISOString(),
    hostname: ANALYTICS_HOSTNAME,
    accountId,
    requestedWindow: {
      period: 'previous_full_calendar_month',
      start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString(),
      end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
      endExclusive: true,
      timezone: 'UTC',
      applied: false,
      note: 'Requested previous full calendar month only; no metrics query has been executed and no monthly unique-visitor figure is asserted.',
    },
    pages: { status: 'unavailable' },
    analytics: { status: 'unavailable', source: 'Cloudflare Web Analytics / RUM', metrics: null },
  };
  try {
    report.pages = await verifyPagesProject(accountId, token, fetchImpl);
  } catch (error) {
    report.pages = { status: 'unavailable', reason: error instanceof SafeApiError ? error.code : 'pages_unavailable' };
    report.analytics.reason = 'pages_domain_not_verified';
    return { envelope: encryptReport(report, env.REPORT_PUBLIC_KEY), status: 'unavailable' };
  }
  try {
    report.analytics = {
      ...report.analytics,
      ...(await inspectRumSchema(token, fetchImpl)),
      accessNote: 'Schema introspection does not verify account RUM data access. No metrics query has been executed.',
      metricNote: 'No visitor, visit, pageview or monthly unique-person figure is inferred from schema metadata.',
    };
  } catch (error) {
    report.analytics.reason = error instanceof SafeApiError ? error.code : 'schema_introspection_unavailable';
  }
  return { envelope: encryptReport(report, env.REPORT_PUBLIC_KEY), status: report.analytics.status };
}

export function writeEncryptedReport(path, envelope) {
  const fields = ['version', 'algorithm', 'wrappedKey', 'iv', 'tag', 'ciphertext'];
  if (!envelope || Object.keys(envelope).length !== fields.length || !fields.every(field => Object.hasOwn(envelope, field)) || envelope.version !== 1 || envelope.algorithm !== 'RSA-OAEP-256+A256GCM' || !fields.slice(2).every(field => typeof envelope[field] === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(envelope[field]))) {
    throw new Error('Only an encrypted report envelope may be written.');
  }
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    writeFileSync(fd, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  } finally {
    closeSync(fd);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { envelope, status } = await createEncryptedReport();
    writeEncryptedReport(process.env.REPORT_OUTPUT || 'cloudflare-analytics.enc.json', envelope);
    if (status === 'requires_verified_query') {
      console.log('Encrypted Cloudflare diagnostic saved. Analytics remains unavailable until the metric query is verified.');
    } else {
      console.error('Encrypted Cloudflare diagnostic saved. Analytics is unavailable; inspect the report privately.');
      process.exitCode = 1;
    }
  } catch {
    console.error('Cloudflare diagnostic could not be completed. Check manual-workflow inputs, secret availability and the unused encrypted output path.');
    process.exitCode = 1;
  }
}
