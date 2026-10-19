/**
 * Process-local TTL cache with stale-while-revalidate semantics and
 * request de-duplication.
 *
 * On serverless each instance gets its own copy (best-effort, still saves
 * upstream calls inside a warm lambda). Self-hosters get a real cache.
 * Supabase persistence (when configured) sits underneath via repo.ts.
 */

interface Entry<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
}

const store = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

/** Hard cap so a long-lived self-hosted process can't grow unbounded. */
const MAX_ENTRIES = 500;

function evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, e] of store) if (e.staleUntil < now) store.delete(k);
  if (store.size <= MAX_ENTRIES) return;
  // Still too large — drop oldest-freshest entries.
  const sorted = [...store.entries()].sort(
    (a, b) => a[1].freshUntil - b[1].freshUntil,
  );
  for (const [k] of sorted.slice(0, store.size - MAX_ENTRIES)) store.delete(k);
}

export interface CachedResult<T> {
  value: T;
  /** true = served from cache (fresh or stale). */
  cached: boolean;
  stale: boolean;
}

/**
 * Return cached value if fresh; if stale but within `staleMs`, return it while
 * refreshing in the background; otherwise fetch. Concurrent misses share one
 * in-flight fetch so a burst never stampedes an upstream.
 */
export async function cached<T>(
  key: string,
  freshMs: number,
  staleMs: number,
  fetcher: () => Promise<T>,
): Promise<CachedResult<T>> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;

  if (hit) {
    if (hit.freshUntil > now) {
      return { value: hit.value, cached: true, stale: false };
    }
    if (hit.staleUntil > now) {
      // Stale-but-usable: refresh in background, serve stale now.
      if (!pending.has(key)) {
        const p = fetcher()
          .then((v) => {
            store.set(key, {
              value: v,
              freshUntil: Date.now() + freshMs,
              staleUntil: Date.now() + freshMs + staleMs,
            });
            return v;
          })
          .catch(() => hit.value) // refresh failed — keep stale value
          .finally(() => pending.delete(key));
        pending.set(key, p);
      }
      return { value: hit.value, cached: true, stale: true };
    }
  }

  let p = pending.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fetcher().finally(() => pending.delete(key));
    pending.set(key, p);
  }
  const value = await p;
  store.set(key, {
    value,
    freshUntil: Date.now() + freshMs,
    staleUntil: Date.now() + freshMs + staleMs,
  });
  evictIfNeeded();
  return { value, cached: false, stale: false };
}

/** Testing / ops helper. */
export function cacheStats() {
  return { entries: store.size, inFlight: pending.size };
}

export function cacheClear() {
  store.clear();
  pending.clear();
}
