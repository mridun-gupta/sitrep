import { NextResponse } from 'next/server';
import type { ApiResponse } from './types';
import { clientKey, rateLimit } from './rate-limit';

export const API_VERSION = 'v1';

/** Wrap data in the standard /api/v1 envelope with cache metadata. */
export function ok<T>(data: T, opts: { cached?: boolean; count?: number } = {}) {
  const body: ApiResponse<T> = {
    data,
    meta: {
      generatedAt: new Date().toISOString(),
      count: opts.count ?? (Array.isArray(data) ? data.length : 1),
      cached: opts.cached ?? false,
      version: API_VERSION,
    },
  };
  return NextResponse.json(body, {
    headers: {
      // CDN-friendly: short fresh window + stale-while-revalidate.
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      ...CORS,
    },
  });
}

export function fail(status: number, message: string) {
  return NextResponse.json(
    { data: null, meta: { generatedAt: new Date().toISOString(), count: 0, cached: false, version: API_VERSION }, error: message },
    { status, headers: CORS },
  );
}

export const CORS = {
  // Public intelligence data — read-only GET API, safe for any origin.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

export function options() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Shared per-route limiter: 60 req/min/IP unless a route overrides. */
export function limited(req: Request, limit = 60): NextResponse | null {
  const r = rateLimit(clientKey(req), limit);
  if (r.ok) return null;
  const res = fail(429, 'rate limit exceeded — retry later');
  res.headers.set('Retry-After', String(r.retryAfterSec));
  res.headers.set('X-RateLimit-Remaining', '0');
  return res;
}
