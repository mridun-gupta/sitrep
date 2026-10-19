'use client';

import { X } from '@phosphor-icons/react';
import type { Capabilities, SourceInfo } from '@/lib/client-api';
import { timeAgo } from '@/lib/format';
import type { WatchEntry } from './NewsPanel';

const STATUS_COLOR = {
  ok: 'bg-cat-economic',
  degraded: 'bg-sev-medium',
  down: 'bg-cat-conflict',
} as const;

export function StatusDrawer({
  open,
  onClose,
  sources,
  capabilities,
  watchlists,
  onRemoveWatch,
  synced,
}: {
  open: boolean;
  onClose: () => void;
  sources: SourceInfo[];
  capabilities: Capabilities | null;
  watchlists: WatchEntry[];
  onRemoveWatch: (query: string) => void;
  synced: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="scroll-slim h-full w-full max-w-sm overflow-y-auto border-l border-edge bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-10 items-center border-b border-edge px-3">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-2 uppercase">
            Sources &amp; status
          </span>
          <button onClick={onClose} className="ml-auto text-ink-3 hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-edge p-3">
          <div className="mb-2 font-mono text-[10px] tracking-wide text-ink-3 uppercase">Capabilities</div>
          <div className="flex gap-2 font-mono text-[10px]">
            <span className={capabilities?.aiBriefs ? 'text-cat-economic' : 'text-ink-3'}>
              AI briefs: {capabilities?.aiBriefs ? 'on' : 'off'}
            </span>
            <span className={capabilities?.supabase ? 'text-cat-economic' : 'text-ink-3'}>
              supabase: {capabilities?.supabase ? 'on' : 'off'}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-ink-3">
            Sitrep runs keyless by default. Optional env vars unlock AI briefs,
            persisted caches and cloud watchlist sync — see docs/technical.
          </p>
        </div>

        <div className="border-b border-edge">
          <div className="px-3 pt-3 font-mono text-[10px] tracking-wide text-ink-3 uppercase">
            Data sources
          </div>
          <ul className="divide-y divide-edge/60">
            {sources.map((s) => (
              <li key={s.id} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${
                      s.health ? STATUS_COLOR[s.health.status] : 'bg-ink-3'
                    }`}
                  />
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-ink hover:text-accent"
                  >
                    {s.label}
                  </a>
                  <span className="font-mono text-[9px] text-ink-3 uppercase">{s.kind}</span>
                  <span className="ml-auto font-mono text-[10px] text-ink-3">
                    {s.health ? `${s.health.items} items · ${s.health.latencyMs}ms` : 'not polled yet'}
                  </span>
                </div>
                <p className="mt-0.5 text-[10.5px] leading-snug text-ink-3">{s.description}</p>
                {s.health?.error && (
                  <p className="mt-0.5 font-mono text-[9px] text-sev-high">err: {s.health.error}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-b border-edge p-3">
          <div className="font-mono text-[10px] tracking-wide text-ink-3 uppercase">
            Watchlist {synced ? '(cloud-synced)' : '(local)'}
          </div>
          {watchlists.length === 0 ? (
            <p className="mt-1 text-[11px] text-ink-3">
              No watches yet — type a filter in the wire panel and save it.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {watchlists.map((w) => (
                <li key={w.query} className="flex items-center gap-2">
                  <span className="text-[12px] text-ink">{w.label}</span>
                  <code className="truncate font-mono text-[10px] text-ink-3">{w.query}</code>
                  <button
                    onClick={() => onRemoveWatch(w.query)}
                    className="ml-auto font-mono text-[10px] text-ink-3 hover:text-cat-conflict"
                  >
                    rm
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 text-[11px] leading-snug text-ink-3">
          <p>
            SITREP is open source (AGPL-3.0). Public JSON API at{' '}
            <code className="font-mono text-ink-2">/api/v1</code>, MCP server for agents at{' '}
            <code className="font-mono text-ink-2">/mcp</code>.
          </p>
          <p className="mt-2">
            Last checked {sources[0]?.health ? timeAgo(sources[0].health.checkedAt) + ' ago' : '—'}.
          </p>
        </div>
      </aside>
    </div>
  );
}
