import { constants, createCipheriv, createDecipheriv, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt, randomBytes } from 'node:crypto';

export const ANALYTICS_HOSTNAME = 'dubaipoints.ae';
const ALGORITHM = 'RSA-OAEP-256+A256GCM';
const AAD = Buffer.from(`DubaiPoints private Cloudflare analytics|1|${ALGORITHM}`, 'utf8');
const MAX_PLAINTEXT_BYTES = 1024 * 1024;
const ENVELOPE_FIELDS = ['version', 'algorithm', 'wrappedKey', 'iv', 'tag', 'ciphertext'];

export function validateAccountId(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{32}$/i.test(value)) {
    throw new Error('Cloudflare account ID must contain exactly 32 hexadecimal characters.');
  }
  return value.toLowerCase();
}

function decodeBase64(value, minBytes, maxBytes) {
  if (typeof value !== 'string' || value.length > Math.ceil(maxBytes / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('Invalid encoded data.');
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length < minBytes || bytes.length > maxBytes || bytes.toString('base64') !== value) {
    throw new Error('Invalid encoded data.');
  }
  return bytes;
}

function assertRsaKey(key) {
  const details = key.asymmetricKeyDetails;
  if (key.asymmetricKeyType !== 'rsa' || !details || details.modulusLength < 2048 || details.modulusLength > 8192 || details.publicExponent < 65537n) {
    throw new Error('Unsupported RSA key.');
  }
  return key;
}

export function validateRecipientPublicKey(value) {
  try {
    return assertRsaKey(createPublicKey({ key: decodeBase64(value, 128, 2048), format: 'der', type: 'spki' }));
  } catch {
    throw new Error('Report public key must be a valid RSA SPKI DER key encoded as standard base64 (2048–8192 bits).');
  }
}

export function encryptReport(report, recipientPublicKey) {
  const key = validateRecipientPublicKey(recipientPublicKey);
  let plaintext;
  let contentKey;
  try {
    if (!report || typeof report !== 'object' || Array.isArray(report)) throw new Error();
    plaintext = Buffer.from(JSON.stringify(report), 'utf8');
    if (plaintext.length > MAX_PLAINTEXT_BYTES) throw new Error();
    contentKey = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', contentKey, iv);
    cipher.setAAD(AAD);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const wrappedKey = publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, contentKey);
    return {
      version: 1,
      algorithm: ALGORITHM,
      wrappedKey: wrappedKey.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  } catch {
    throw new Error('Unable to encrypt the private analytics report.');
  } finally {
    contentKey?.fill(0);
    plaintext?.fill(0);
  }
}

export function decryptReport(envelope, privateKeyPem) {
  let contentKey;
  let plaintext;
  try {
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) || Object.keys(envelope).length !== ENVELOPE_FIELDS.length || !ENVELOPE_FIELDS.every(field => Object.hasOwn(envelope, field)) || envelope.version !== 1 || envelope.algorithm !== ALGORITHM) {
      throw new Error();
    }
    const privateKey = assertRsaKey(createPrivateKey(privateKeyPem));
    const modulusBytes = Math.ceil(privateKey.asymmetricKeyDetails.modulusLength / 8);
    const wrappedKey = decodeBase64(envelope.wrappedKey, modulusBytes, modulusBytes);
    const iv = decodeBase64(envelope.iv, 12, 12);
    const tag = decodeBase64(envelope.tag, 16, 16);
    const ciphertext = decodeBase64(envelope.ciphertext, 2, MAX_PLAINTEXT_BYTES);
    contentKey = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, wrappedKey);
    if (contentKey.length !== 32) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', contentKey, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const report = JSON.parse(plaintext.toString('utf8'));
    if (!report || typeof report !== 'object' || Array.isArray(report)) throw new Error();
    return report;
  } catch {
    throw new Error('Unable to decrypt analytics report; check the encrypted file and private key.');
  } finally {
    contentKey?.fill(0);
    plaintext?.fill(0);
  }
}
