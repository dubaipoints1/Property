import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { ANALYTICS_HOSTNAME, decryptReport, encryptReport, validateAccountId, validateRecipientPublicKey } from '../../scripts/cloudflare/analytics-crypto.mjs';
import { decryptReportFile } from '../../scripts/cloudflare/decrypt-analytics.mjs';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
const privateMarker = '/private-test-metric-do-not-log';
const report = { hostname: ANALYTICS_HOSTNAME, analytics: { status: 'available', topPages: [{ path: privateMarker, visits: 123456789 }] } };

test('account and public-key inputs are strictly validated without echoing supplied values', () => {
  assert.equal(validateAccountId('ABCDEF0123456789ABCDEF0123456789'), 'abcdef0123456789abcdef0123456789');
  for (const value of ['', '../account', 'a'.repeat(31), `${'a'.repeat(32)}\n`, null]) {
    assert.throws(() => validateAccountId(value), /32 hexadecimal/);
  }
  assert.equal(validateRecipientPublicKey(publicKey).asymmetricKeyType, 'rsa');
  const weak = generateKeyPairSync('rsa', { modulusLength: 1024 }).publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const otherType = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const wrongContainer = pair.publicKey.export({ type: 'pkcs1', format: 'der' }).toString('base64');
  for (const value of ['', `${publicKey}\n`, ` ${publicKey}`, 'not-a-key', weak, otherType, wrongContainer, privateKey]) {
    assert.throws(() => validateRecipientPublicKey(value), error => {
      assert.match(error.message, /^Report public key must/);
      assert.ok(!error.message.includes('not-a-key'));
      assert.ok(!error.message.includes('BEGIN'));
      return true;
    });
  }
});

test('hybrid authenticated encryption round-trips a report without plaintext metadata and uses fresh randomness', () => {
  const first = encryptReport(report, publicKey);
  const second = encryptReport(report, publicKey);
  assert.deepEqual(Object.keys(first), ['version', 'algorithm', 'wrappedKey', 'iv', 'tag', 'ciphertext']);
  assert.equal(first.algorithm, 'RSA-OAEP-256+A256GCM');
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.wrappedKey, second.wrappedKey);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.ok(!JSON.stringify(first).includes(privateMarker));
  assert.ok(!JSON.stringify(first).includes('topPages'));
  assert.deepEqual(decryptReport(first, privateKey), report);
});

test('tampering, wrong keys, unexpected metadata and oversized reports fail safely', () => {
  const encrypted = encryptReport(report, publicKey);
  for (const field of ['wrappedKey', 'iv', 'tag', 'ciphertext']) {
    const bytes = Buffer.from(encrypted[field], 'base64');
    bytes[0] ^= 1;
    assert.throws(() => decryptReport({ ...encrypted, [field]: bytes.toString('base64') }, privateKey), /^Error: Unable to decrypt/);
  }
  for (const altered of [{ ...encrypted, version: 2 }, { ...encrypted, algorithm: 'none' }, { ...encrypted, path: privateMarker }, { ...encrypted, iv: '???' }]) {
    assert.throws(() => decryptReport(altered, privateKey), /Unable to decrypt/);
  }
  const differentKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  assert.throws(() => decryptReport(encrypted, differentKey), /Unable to decrypt/);
  assert.throws(() => encryptReport({ text: 'x'.repeat(1024 * 1024) }, publicKey), /Unable to encrypt/);
});

test('local decrypt writes a new owner-only file, refuses overwrite/symlinks and prints no metrics or key', () => {
  const root = mkdtempSync(join(tmpdir(), 'dp-analytics-crypto-'));
  try {
    const keyPath = join(root, 'private.pem');
    const inputPath = join(root, 'report.enc.json');
    const outputPath = join(root, 'private.json');
    writeFileSync(keyPath, privateKey, { mode: 0o600 });
    writeFileSync(inputPath, JSON.stringify(encryptReport(report, publicKey)));
    const result = spawnSync(process.execPath, [resolve('scripts/cloudflare/decrypt-analytics.mjs'), keyPath, inputPath, outputPath], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.ok(!`${result.stdout}${result.stderr}`.includes(privateMarker));
    assert.ok(!`${result.stdout}${result.stderr}`.includes('PRIVATE KEY'));
    assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf8')), report);
    assert.equal(statSync(outputPath).mode & 0o777, 0o600);
    assert.throws(() => decryptReportFile(keyPath, inputPath, outputPath), /could not be completed/);
    assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf8')), report);
    const linkedOutput = join(root, 'linked-output.json');
    symlinkSync(outputPath, linkedOutput);
    assert.throws(() => decryptReportFile(keyPath, inputPath, linkedOutput), /could not be completed/);
    const linkedKey = join(root, 'linked.pem');
    symlinkSync(keyPath, linkedKey);
    assert.throws(() => decryptReportFile(linkedKey, inputPath, join(root, 'other.json')), /could not be completed/);
    writeFileSync(inputPath, privateMarker);
    const failure = spawnSync(process.execPath, [resolve('scripts/cloudflare/decrypt-analytics.mjs'), keyPath, inputPath, join(root, 'failure.json')], { encoding: 'utf8' });
    assert.equal(failure.status, 1);
    assert.ok(!`${failure.stdout}${failure.stderr}`.includes(privateMarker));
    assert.ok(!`${failure.stdout}${failure.stderr}`.includes('PRIVATE KEY'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
