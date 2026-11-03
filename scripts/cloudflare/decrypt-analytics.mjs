import { constants, closeSync, fstatSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decryptReport } from './analytics-crypto.mjs';

function readRegularFile(path, maxBytes, privateFile = false) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > maxBytes || (privateFile && process.platform !== 'win32' && (stat.mode & 0o077))) throw new Error();
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

// Local only: never use this helper in Actions or upload its output.
export function decryptReportFile(privateKeyPath, encryptedPath, outputPath) {
  let privateKey;
  try {
    privateKey = readRegularFile(privateKeyPath, 16 * 1024, true);
    const envelope = JSON.parse(readRegularFile(encryptedPath, 2 * 1024 * 1024).toString('utf8'));
    const report = decryptReport(envelope, privateKey);
    const fd = openSync(outputPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try {
      writeFileSync(fd, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    } finally {
      closeSync(fd);
    }
  } catch {
    throw new Error('Private report could not be completed; check the key permissions, encrypted input and unused output path. A newly created output may be incomplete.');
  } finally {
    privateKey?.fill(0);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 3) throw new Error();
    decryptReportFile(...args);
    console.log('Private analytics report written locally. Do not upload it.');
  } catch {
    console.error('Analytics report decryption failed. Use: node scripts/cloudflare/decrypt-analytics.mjs PRIVATE_KEY_PEM ENCRYPTED_JSON NEW_PRIVATE_JSON');
    process.exitCode = 1;
  }
}
