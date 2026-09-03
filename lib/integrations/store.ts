import { getDb } from '../db';
import { encryptJson, decryptJson } from '../crypto';

export type Provider = 'github' | 'jira' | 'openrouter';

export interface IntegrationConfigMeta {
  provider: Provider;
  status: 'untested' | 'ok' | 'error';
  lastTestedAt: string | null;
  mask: string | null;
}

export interface GithubCredentials {
  token: string;
}

export interface JiraCredentials {
  email: string;
  domain: string;
  token: string;
}

export interface OpenRouterCredentials {
  apiKey: string;
  model?: string;
}

function aad(userId: number, provider: Provider): string {
  return `${userId}:${provider}`;
}

export function getIntegrationConfig(userId: number, provider: Provider): { encrypted: string; status: string; lastTestedAt: string | null; mask: string | null } | null {
  const db = getDb();
  const row = db
    .prepare('SELECT encrypted, status, lastTestedAt, mask FROM integration_configs WHERE userId = ? AND provider = ?')
    .get(userId, provider) as any;
  return row || null;
}

export function getCredentials<T>(userId: number, provider: Provider): T | null {
  const row = getIntegrationConfig(userId, provider);
  if (!row) return null;
  try {
    return decryptJson<T>(row.encrypted, aad(userId, provider));
  } catch {
    return null; // wrong key or corrupted — treat as unconfigured
  }
}

export function saveCredentials(userId: number, provider: Provider, credentials: unknown, mask: string): IntegrationConfigMeta {
  const db = getDb();
  const encrypted = encryptJson(credentials, aad(userId, provider));
  db.prepare(
    `INSERT INTO integration_configs (userId, provider, encrypted, status, lastTestedAt, mask, updatedAt)
     VALUES (?, ?, ?, 'untested', NULL, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(userId, provider) DO UPDATE SET
       encrypted = excluded.encrypted,
       status = 'untested',
       lastTestedAt = NULL,
       mask = excluded.mask,
       updatedAt = CURRENT_TIMESTAMP`
  ).run(userId, provider, encrypted, mask);
  return { provider, status: 'untested', lastTestedAt: null, mask };
}

export function updateStatus(userId: number, provider: Provider, status: 'ok' | 'error', mask?: string): IntegrationConfigMeta {
  const db = getDb();
  db.prepare(
    `UPDATE integration_configs SET status = ?, lastTestedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
     ${mask !== undefined ? ', mask = ?' : ''} WHERE userId = ? AND provider = ?`
  ).run(...(mask !== undefined ? [status, mask, userId, provider] : [status, userId, provider]));
  const row = getIntegrationConfig(userId, provider)!;
  return { provider, status: row.status as any, lastTestedAt: row.lastTestedAt, mask: row.mask };
}

export function deleteIntegration(userId: number, provider: Provider): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM integration_configs WHERE userId = ? AND provider = ?').run(userId, provider);
  return result.changes > 0;
}

export function listIntegrations(userId: number): IntegrationConfigMeta[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT provider, status, lastTestedAt, mask FROM integration_configs WHERE userId = ? ORDER BY provider')
    .all(userId) as any[];
  return rows.map(r => ({ provider: r.provider as Provider, status: r.status, lastTestedAt: r.lastTestedAt, mask: r.mask }));
}

// ---------- Mask builders (never expose raw secrets) ----------

export function maskToken(token: string): string {
  const clean = token.trim();
  if (clean.length <= 8) return '••••';
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
}

export function maskGithub(token: string): string {
  return `ghp…${token.trim().slice(-4)}`;
}

export function maskJira(email: string, domain: string): string {
  const user = email.split('@')[0] || email;
  return `${user.slice(0, 2)}…@${domain}`;
}

export function maskOpenRouter(key: string): string {
  return `sk-or-…${key.trim().slice(-4)}`;
}

export function normalizeJiraDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}
