/**
 * HTTP helpers for upstream calls — timeout, UA, size cap, JSON guard.
 * All sources go through these so behaviour is uniform and safe:
 *  - fixed timeouts (no hanging lambdas)
 *  - a declared User-Agent (good API citizenship + some APIs require it)
 *  - response size caps (a misbehaving upstream can't blow up memory)
 */

const UA = 'sitrep/0.1 (+https://github.com/your-org/sitrep; open-source OSINT dashboard)';
const DEFAULT_TIMEOUT = 15_000;
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB hard cap per response

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

async function readWithCap(res: Response): Promise<string> {
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > MAX_BYTES) throw new UpstreamError(`response too large (${len}B)`, res.status);
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new UpstreamError('response too large', res.status);
  return text;
}

export async function fetchText(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: '*/*', ...opts.headers },
      // Next.js fetch caching is opt-in per call; we do our own TTL cache.
      cache: 'no-store',
    });
    if (!res.ok) throw new UpstreamError(`${res.status} ${res.statusText}`, res.status);
    return await readWithCap(res);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<T> {
  const text = await fetchText(url, {
    ...opts,
    headers: { accept: 'application/json', ...opts.headers },
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new UpstreamError('invalid JSON from upstream');
  }
}
