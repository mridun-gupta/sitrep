'use client';

import { useState } from 'react';
import type { HotspotSlim } from '@/lib/client-api';
import { fmtDelta, fmtPrice } from '@/lib/format';
import type { MarketQuote, SignalPoint } from '@/lib/types';
import { CategoryTag, Empty, Panel, RowSkeleton, SeverityDot } from './ui';

/** Right-rail intel stack: hotspots/signals tab + markets. */

export function IntelPanel({
  hotspots,
  signals,
  loading,
  onFlyTo,
}: {
  hotspots: HotspotSlim[];
  signals: SignalPoint[];
  loading: boolean;
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
}) {
  const [tab, setTab] = useState<'hotspots' | 'signals'>('hotspots');
  const maxScore = hotspots[0]?.score ?? 1;
  const maxWeight = signals[0]?.weight ?? 1;

  return (
    <Panel
      title={tab === 'hotspots' ? 'Convergence' : 'Tension index'}
      count={tab === 'hotspots' ? hotspots.length : signals.length}
      className="h-full"
      right={
        <div className="flex gap-1">
          {(['hotspots', 'signals'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-1.5 font-mono text-[9px] tracking-wide uppercase ${
                tab === t ? 'text-accent' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      }
      bodyClassName="panel-in"
    >
      {loading ? (
        <RowSkeleton rows={6} />
      ) : tab === 'hotspots' ? (
        hotspots.length === 0 ? (
          <Empty>No cross-source convergence right now.</Empty>
        ) : (
          <ul>
            {hotspots.slice(0, 20).map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => onFlyTo(h.lat, h.lon, 4)}
                  className="block w-full px-3 py-2 text-left hover:bg-panel-2"
                >
                  <div className="flex items-center gap-2">
                    <SeverityDot sev={h.maxSeverity} pulse />
                    <span className="truncate text-[12px] text-ink">
                      {h.name || 'Unnamed region'}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-accent">
                      {h.score}
                    </span>
                  </div>
                  <div className="mt-1 h-0.5 w-full bg-edge">
                    <div
                      className="h-full bg-accent/80"
                      style={{ width: `${Math.min(100, (h.score / maxScore) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {h.categories.slice(0, 3).map((c) => (
                      <CategoryTag key={c} cat={c} />
                    ))}
                    <span className="font-mono text-[9px] text-ink-3">
                      {h.eventCount} events · {h.sources.length} sources
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : signals.length === 0 ? (
        <Empty>No tension localities detected.</Empty>
      ) : (
        <ul>
          {signals.slice(0, 20).map((s) => (
            <li key={`${s.lat},${s.lon}`}>
              <button
                onClick={() => onFlyTo(s.lat, s.lon, 4)}
                className="block w-full px-3 py-1.5 text-left hover:bg-panel-2"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] text-ink">{s.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-ink-2">
                    {s.weight.toFixed(0)}
                  </span>
                </div>
                <div className="mt-0.5 h-0.5 w-full bg-edge">
                  <div
                    className="h-full bg-sev-high/80"
                    style={{ width: `${Math.min(100, (s.weight / maxWeight) * 100)}%` }}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function MarketsPanel({ quotes, loading }: { quotes: MarketQuote[]; loading: boolean }) {
  return (
    <Panel title="Market radar" count={quotes.length} className="h-full" bodyClassName="panel-in">
      {loading && quotes.length === 0 ? (
        <RowSkeleton rows={3} />
      ) : quotes.length === 0 ? (
        <Empty>Market feeds unavailable.</Empty>
      ) : (
        <table className="w-full">
          <tbody>
            {quotes.map((m) => {
              const d = fmtDelta(m.change24h);
              return (
                <tr key={m.symbol} className="border-b border-edge/50 last:border-0">
                  <td className="px-3 py-1.5">
                    <span className="text-[12px] text-ink">{m.symbol}</span>
                    <span className="ml-1.5 hidden text-[10px] text-ink-3 xl:inline">{m.name}</span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-ink-2">
                    {fmtPrice(m.price)}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right font-mono text-[11px] ${
                      d.up === null ? 'text-ink-3' : d.up ? 'text-cat-economic' : 'text-cat-conflict'
                    }`}
                  >
                    {d.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
