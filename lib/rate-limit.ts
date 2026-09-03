// Simple in-memory fixed-window rate limiter.
// Single-process only (fine for a local/self-hosted instance) — a restart resets counters.

interface Bucket {
  n: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { n: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  bucket.n += 1;
  if (bucket.n > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'local';
}

// Common buckets
export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: 5 * 60 * 1000 },
  ai: { limit: 20, windowMs: 5 * 60 * 1000 },
  integration: { limit: 60, windowMs: 5 * 60 * 1000 },
} as const;
