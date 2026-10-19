'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type Capabilities,
  type HotspotSlim,
  type SourceInfo,
} from '@/lib/client-api';
import { useLocalStorage, usePolling } from '@/lib/hooks';
import type {
  MarketQuote,
  NewsItem,
  SignalPoint,
  SitrepBrief,
  SitrepEvent,
} from '@/lib/types';
import { BriefPanel } from './BriefPanel';
import { Header } from './Header';
import { IntelPanel, MarketsPanel } from './IntelPanel';
import { NewsPanel, type WatchEntry } from './NewsPanel';
import { StatusDrawer } from './StatusDrawer';
import { Ticker } from './Ticker';

// MapLibre is browser-only — no SSR.
const GlobalMap = dynamic(() => import('./GlobalMap'), { ssr: false });

export interface InitialData {
  events: SitrepEvent[];
  hotspots: HotspotSlim[];
  news: NewsItem[];
  signals: SignalPoint[];
  markets: MarketQuote[];
  brief: SitrepBrief | null;
  sources: SourceInfo[];
  capabilities: Capabilities;
}

export function Dashboard({ initial }: { initial: InitialData }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

  // ── Live polling (initial data already rendered by the server) ──
  const events = usePolling(() => api.events(48, 500), 90_000, initial.events);
  const hotspots = usePolling(() => api.hotspots(40), 90_000, initial.hotspots);
  const news = usePolling(() => api.news(48, 150), 60_000, initial.news);
  const signals = usePolling(() => api.signals(60), 5 * 60_000, initial.signals);
  const markets = usePolling(() => api.markets(), 60_000, initial.markets);
  const brief = usePolling(() => api.brief(), 10 * 60_000, initial.brief);
  const sources = usePolling(() => api.sources(), 60_000, {
    sources: initial.sources,
    capabilities: initial.capabilities,
  });

  // ── Watchlist: local-first, cloud-synced when Supabase is on ────
  const [watchKey] = useLocalStorage<string>('sitrep.watchKey', '');
  const [watchlists, setWatchlists] = useLocalStorage<WatchEntry[]>(
    'sitrep.watchlists',
    [],
  );
  const [watchSynced, setWatchSynced] = useState(false);

  useEffect(() => {
    if (!watchKey && typeof crypto !== 'undefined') {
      const id = crypto.randomUUID();
      localStorage.setItem('sitrep.watchKey', JSON.stringify(id));
      window.dispatchEvent(new Event('storage'));
    }
  }, [watchKey]);

  const addWatch = useCallback(
    (label: string, query: string) => {
      setWatchlists((w) => (w.some((x) => x.query === query) ? w : [...w, { label, query }]));
      if (sources.data.capabilities.supabase && watchKey) {
        fetch('/api/v1/watchlist', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-watch-key': watchKey },
          body: JSON.stringify({ label, query }),
        })
          .then((r) => setWatchSynced(r.ok))
          .catch(() => setWatchSynced(false));
      }
    },
    [setWatchlists, sources.data.capabilities.supabase, watchKey],
  );

  const removeWatch = useCallback(
    (query: string) => {
      setWatchlists((w) => w.filter((x) => x.query !== query));
      if (sources.data.capabilities.supabase && watchKey) {
        fetch(`/api/v1/watchlist?query=${encodeURIComponent(query)}`, {
          method: 'DELETE',
          headers: { 'x-watch-key': watchKey },
        }).catch(() => undefined);
      }
    },
    [setWatchlists, sources.data.capabilities.supabase, watchKey],
  );

  const degraded = sources.data.sources.filter(
    (s) => s.health && s.health.status !== 'ok',
  ).length;

  const fly = useCallback((lat: number, lon: number, zoom = 4) => {
    setFlyTo({ lat, lon, zoom });
  }, []);

  return (
    <div className="grid h-screen grid-rows-[40px_minmax(0,1fr)_28px] bg-bg">
      <Header
        eventCount={events.data.length}
        degradedCount={degraded}
        onOpenStatus={() => setStatusOpen(true)}
      />

      {/* Desktop console grid: wire | map | intel */}
      <main className="hidden min-h-0 grid-cols-[300px_minmax(0,1fr)_320px] lg:grid">
        <div className="min-h-0 border-r border-edge">
          <NewsPanel
            items={news.data}
            loading={news.refreshedAt === null}
            watchlists={watchlists}
            onAddWatch={addWatch}
          />
        </div>

        <div className="min-h-0 min-w-0">
          <GlobalMap
            events={events.data}
            signals={signals.data}
            hotspots={hotspots.data}
            flyTo={flyTo}
          />
        </div>

        <div className="grid min-h-0 grid-rows-[1.35fr_1fr_172px] border-l border-edge">
          <div className="min-h-0 border-b border-edge">
            <BriefPanel
              brief={brief.data}
              loading={brief.refreshedAt === null}
              error={brief.error}
              onRefresh={brief.refresh}
            />
          </div>
          <div className="min-h-0 border-b border-edge">
            <IntelPanel
              hotspots={hotspots.data}
              signals={signals.data}
              loading={hotspots.refreshedAt === null}
              onFlyTo={fly}
            />
          </div>
          <div className="min-h-0">
            <MarketsPanel quotes={markets.data} loading={markets.refreshedAt === null} />
          </div>
        </div>
      </main>

      {/* Mobile / small screens: map on top, everything else stacks */}
      <main className="scroll-slim min-h-0 overflow-y-auto lg:hidden">
        <div className="h-[52vh] border-b border-edge">
          <GlobalMap
            events={events.data}
            signals={signals.data}
            hotspots={hotspots.data}
            flyTo={flyTo}
          />
        </div>
        <div className="h-[360px] border-b border-edge">
          <BriefPanel
            brief={brief.data}
            loading={brief.refreshedAt === null}
            error={brief.error}
            onRefresh={brief.refresh}
          />
        </div>
        <div className="h-[340px] border-b border-edge">
          <IntelPanel
            hotspots={hotspots.data}
            signals={signals.data}
            loading={hotspots.refreshedAt === null}
            onFlyTo={fly}
          />
        </div>
        <div className="h-[500px] border-b border-edge">
          <NewsPanel
            items={news.data}
            loading={news.refreshedAt === null}
            watchlists={watchlists}
            onAddWatch={addWatch}
          />
        </div>
        <div className="h-[220px]">
          <MarketsPanel quotes={markets.data} loading={markets.refreshedAt === null} />
        </div>
      </main>

      <Ticker items={news.data} />

      <StatusDrawer
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        sources={sources.data.sources}
        capabilities={sources.data.capabilities}
        watchlists={watchlists}
        onRemoveWatch={removeWatch}
        synced={watchSynced}
      />
    </div>
  );
}
