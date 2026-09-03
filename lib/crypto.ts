import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Master secret for session signing + token encryption.
// Order of precedence: KABORD_SECRET env (64 hex chars) > .kabord.key file > generate new file.
const KEY_FILE = () => path.join(process.cwd(), '.kabord.key');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let cachedSecret: Buffer | null = null;
let cachedSessionKey: Buffer | null = null;
let cachedTokenKey: Buffer | null = null;

export function getMasterSecret(): Buffer {
  if (cachedSecret) return cachedSecret;

  const env = process.env.KABORD_SECRET;
  if (env && /^[0-9a-fA-F]{64}$/.test(env)) {
    cachedSecret = Buffer.from(env, 'hex');
    return cachedSecret;
  }

  try {
    const existing = fs.readFileSync(KEY_FILE(), 'utf8').trim();
    if (/^[0-9a-fA-F]{64}$/.test(existing)) {
      cachedSecret = Buffer.from(existing, 'hex');
      return cachedSecret;
    }
  } catch {
    // No key file yet — generate one below.
  }

  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(KEY_FILE(), generated + '\n', { mode: 0o600 });
  cachedSecret = Buffer.from(generated, 'hex');
  return cachedSecret;
}

function sessionKey(): Buffer {
  if (!cachedSessionKey) {
    cachedSessionKey = Buffer.from(crypto.hkdfSync('sha256', getMasterSecret(), '', 'kabord-session', 32));
  }
  return cachedSessionKey;
}

function tokenKey(): Buffer {
  if (!cachedTokenKey) {
    cachedTokenKey = Buffer.from(crypto.hkdfSync('sha256', getMasterSecret(), '', 'kabord-token', 32));
  }
  return cachedTokenKey;
}

// ---------- Signed session tokens ----------

export interface SessionPayload {
  uid: number;
  iat: number;
  exp: number;
}

export function signSession(uid: number): string {
  const payload: SessionPayload = { uid, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', sessionKey()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifySession(token: string): SessionPayload | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);

  let expected: Buffer;
  let received: Buffer;
  try {
    expected = crypto.createHmac('sha256', sessionKey()).update(body).digest();
    received = Buffer.from(mac, 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.uid !== 'number' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- AES-256-GCM encryption for integration tokens ----------

export function encryptJson(obj: unknown, aad: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenKey(), iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptJson<T>(blob: string, aad: string): T {
  const raw = Buffer.from(blob, 'base64');
  if (raw.length < 29) throw new Error('Invalid encrypted blob');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', tokenKey(), iv);
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  return JSON.parse(pt) as T;
}
