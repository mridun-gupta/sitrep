'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Poll an async fn on an interval; pauses when the tab is hidden. */
export function usePolling<T>(
  fn: () => Promise<T>,
  intervalMs: number,
  initial: T,
): { data: T; refreshedAt: number | null; error: boolean; refresh: () => void } {
  const [data, setData] = useState<T>(initial);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const tick = useCallback(async () => {
    try {
      const v = await fnRef.current();
      setData(v);
      setRefreshedAt(Date.now());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      stop();
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void tick();
      }, intervalMs);
    };
    const stop = () => timer && clearInterval(timer);
    const onVis = () => (document.visibilityState === 'visible' ? void tick() : undefined);

    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs, tick]);

  return { data, refreshedAt, error, refresh: () => void tick() };
}

/** Ticking clock for the header (UTC). */
export function useNow(stepMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

/** localStorage-backed state, SSR-safe. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Async hydration keeps the first client render identical to SSR.
    const raf = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) setValue(JSON.parse(raw) as T);
      } catch {
        /* corrupted value — keep initial */
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage full/blocked — state still works for the session */
        }
        return next;
      });
    },
    [key],
  );

  return [value, set, loaded] as const;
}
