/**
 * In-memory sliding-window rate limiter for the public API.
 *
 * Honest scope note (documented in docs/technical/security.md): on serverless
 * this is best-effort — each instance has its own bucket map. It still stops
 * naive scraping and runaway clients. For hard limits, front the deployment
 * with Vercel WAF / Cloudflare rate rules.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs = WINDOW_MS): RateResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_BUCKETS) {
      // Evict the stalest bucket — prevents memory growth under fan-out IPs.
      let oldestKey: string | undefined;
      let oldestTs = Infinity;
      for (const [k, v] of buckets) {
        const last = v.timestamps.at(-1) ?? 0;
        if (last < oldestTs) {
          oldestTs = last;
          oldestKey = k;
        }
      }
      if (oldestKey) buckets.delete(oldestKey);
    }
    b = { timestamps: [] };
    buckets.set(key, b);
  }

  b.timestamps = b.timestamps.filter((t) => now - t < windowMs);
  if (b.timestamps.length >= limit) {
    const retryAfterSec = Math.ceil((windowMs - (now - b.timestamps[0])) / 1000);
    return { ok: false, remaining: 0, retryAfterSec };
  }
  b.timestamps.push(now);
  return { ok: true, remaining: limit - b.timestamps.length, retryAfterSec: 0 };
}

export function clientKey(req: Request): string {
  // x-forwarded-for is set by Vercel/proxies; fall back to a generic bucket
  // so a missing header never grants unlimited requests.
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || 'unknown';
}
