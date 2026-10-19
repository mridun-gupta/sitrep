import { env } from '../env';
import { cached } from '../cache';
import { convergentHotspots } from '../correlate';
import { cellKey } from '../geo';
import type {
  Hotspot,
  MarketQuote,
  NewsItem,
  SignalPoint,
  SitrepEvent,
} from '../types';
import { fetchAcled } from './acled';
import { fetchEonet } from './eonet';
import { fetchGdacs } from './gdacs';
import { fetchGdelt } from './gdelt';
import { fetchMarkets } from './markets';
import { fetchNewsApi } from './newsapi';
import { fetchReliefWeb } from './reliefweb';
import { fetchRss } from './rss';
import { getHealth, runSource } from './registry';
import { fetchUsgs } from './usgs';

/**
 * Aggregation layer — fans out to every enabled source in parallel, isolates
 * failures, merges + sorts results, and caches each view with its own TTL.
 *
 * TTLs are chosen from each upstream's own refresh rate and rate limits
 * (GDELT is the most aggressive, so it caches longest).
 */

const TTL = {
  news: 5 * 60_000, // RSS + GDELT merged wire
  events: 3 * 60_000, // all geolocated events
  signals: 15 * 60_000, // tension rollup — slow moving
  markets: 60_000, // quotes
  hotspots: 3 * 60_000, // correlation, derived from events
} as const;

const STALE_FACTOR = 4; // serve stale up to 4× fresh TTL while revalidating

export interface EventsBundle {
  events: SitrepEvent[];
  hotspots: Hotspot[];
}

export async function getEvents(): Promise<EventsBundle> {
  const { value } = await cached(
    'events:all',
    TTL.events,
    TTL.events * STALE_FACTOR,
    async () => {
      const keyed: Promise<{ source: string; data: SitrepEvent[] } | null>[] = [];

      if (env.ACLED_KEY && env.ACLED_EMAIL) {
        keyed.push(
          runSource('acled', async () => {
            const d = await fetchAcled();
            return { items: d.length, data: d };
          }).then((d) => (d ? { source: 'acled', data: d } : null)),
        );
      }
      if (env.RELIEFWEB_APPNAME) {
        keyed.push(
          runSource('reliefweb', async () => {
            const d = await fetchReliefWeb();
            return { items: d.length, data: d };
          }).then((d) => (d ? { source: 'reliefweb', data: d } : null)),
        );
      }

      const [usgs, eonet, gdacs, gdelt, ...keyedResults] = await Promise.all([
        runSource('usgs', async () => {
          const d = await fetchUsgs();
          return { items: d.length, data: d };
        }),
        runSource('eonet', async () => {
          const d = await fetchEonet();
          return { items: d.length, data: d };
        }),
        runSource('gdacs', async () => {
          const d = await fetchGdacs();
          return { items: d.length, data: d };
        }),
        runSource('gdelt', async () => {
          // Shared cache key so news/events/signals all reuse one upstream call.
          const r = await cached('gdelt:doc', 12 * 60_000, 48 * 60_000, fetchGdelt);
          return { items: r.value.events.length, data: r.value };
        }),
        ...keyed,
      ]);

      const keyedEvents = keyedResults.flatMap((r) => r?.data ?? []);

      const events = [
        ...(usgs ?? []),
        ...(eonet ?? []),
        ...(gdacs ?? []),
        ...(gdelt?.events ?? []),
        ...keyedEvents,
      ].sort((a, b) => b.time.localeCompare(a.time));

      return {
        events,
        hotspots: convergentHotspots(events),
        gdeltNews: gdelt?.articles ?? [],
        gdeltSignals: gdelt?.signals ?? [],
      };
    },
  );
  return { events: value.events, hotspots: value.hotspots };
}

export async function getNews(): Promise<NewsItem[]> {
  const { value } = await cached(
    'news:all',
    TTL.news,
    TTL.news * STALE_FACTOR,
    async () => {
      const [rss, newsapi, gdelt] = await Promise.all([
        runSource('rss', async () => {
          const d = await fetchRss();
          if (d.feedsOk === 0) throw new Error('all feeds failed');
          return { items: d.items.length, data: d.items };
        }),
        env.NEWSAPI_KEY
          ? runSource('newsapi', async () => {
              const d = await fetchNewsApi();
              return { items: d.length, data: d };
            })
          : Promise.resolve(null),
        // Reuse the GDELT call already made for events (shared cache key).
        // Not wrapped in runSource here (health already tracked by the
        // events fetch) — but a cold-start GDELT outage must not sink
        // the whole wire, so degrade to null.
        cached('gdelt:doc', 12 * 60_000, 48 * 60_000, () => fetchGdelt()).catch(
          () => null,
        ),
      ]);

      const gdeltArticles = gdelt?.value.articles ?? [];
      const all = [...(rss ?? []), ...(newsapi ?? []), ...gdeltArticles];
      // Dedupe by id, newest first.
      const seen = new Set<string>();
      return all
        .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
        .sort((a, b) => b.published.localeCompare(a.published));
    },
  );
  return value;
}

export async function getSignals(): Promise<SignalPoint[]> {
  const { value } = await cached(
    'signals:all',
    TTL.signals,
    TTL.signals * STALE_FACTOR,
    async () => {
      const gdelt = await cached('gdelt:doc', 12 * 60_000, 48 * 60_000, fetchGdelt).catch(
        () => null,
      );
      const gdeltSignals = gdelt?.value.signals ?? [];
      if (gdeltSignals.length > 0) {
        return gdeltSignals.sort((a, b) => b.weight - a.weight);
      }
      // GDELT rate-limits hard — fall back to tension derived from the
      // geolocated event mix so the layer never reads empty. Points carry
      // no `tone`, marking them as derived rather than sentiment-measured.
      const { events } = await getEvents();
      return deriveSignals(events);
    },
  );
  return value;
}

/**
 * Tension fallback: weight each place by the severity/category of events
 * pinned there (conflict & disaster count more), take a weighted centroid,
 * cap at the heatmap's display ceiling.
 */
function deriveSignals(events: SitrepEvent[]): SignalPoint[] {
  const SEV_W: Record<string, number> = { info: 1, low: 2, medium: 4, high: 8, critical: 12 };
  const CAT_BOOST: Record<string, number> = {
    conflict: 1.5, disaster: 1.4, humanitarian: 1.3, cyber: 1.1,
  };
  const cells = new Map<string, { lat: number; lon: number; wsum: number; w: number; names: Map<string, number> }>();
  for (const e of events) {
    if (!e.location) continue;
    const key = cellKey(e.location.lat, e.location.lon);
    const c = cells.get(key) ?? { lat: 0, lon: 0, wsum: 0, w: 0, names: new Map() };
    const w = (SEV_W[e.severity] ?? 1) * (CAT_BOOST[e.category] ?? 1);
    c.lat = (c.lat * c.w + e.location.lat * w) / (c.w + w);
    c.lon = (c.lon * c.w + e.location.lon * w) / (c.w + w);
    c.w += w;
    c.wsum += w;
    if (e.location.name) c.names.set(e.location.name, (c.names.get(e.location.name) ?? 0) + 1);
    cells.set(key, c);
  }
  return [...cells.values()]
    .map((c) => ({
      lat: c.lat,
      lon: c.lon,
      name: [...c.names.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '',
      weight: Math.min(60, Math.round(c.wsum * 0.8)),
    }))
    .filter((s) => s.weight >= 3)
    .sort((a, b) => b.weight - a.weight);
}

export async function getMarkets(): Promise<MarketQuote[]> {
  const { value } = await cached(
    'markets:all',
    TTL.markets,
    TTL.markets * STALE_FACTOR,
    async () => {
      const data = await runSource('markets', async () => {
        const d = await fetchMarkets();
        return { items: d.length, data: d };
      });
      return data ?? [];
    },
  );
  return value;
}

export { getHealth };
