/** Client-safe formatting helpers (no Node deps). */

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function utcClock(now: number): string {
  return new Date(now).toISOString().slice(11, 19) + 'Z';
}

export function fmtPrice(n: number): string {
  if (n >= 10_000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function fmtDelta(n: number | undefined): { text: string; up: boolean | null } {
  if (n === undefined || Number.isNaN(n)) return { text: '—', up: null };
  const up = n >= 0;
  return { text: `${up ? '+' : ''}${n.toFixed(2)}%`, up };
}
