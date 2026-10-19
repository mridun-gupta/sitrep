import type { SourceHealth } from '../types';

/**
 * Source registry — one entry per upstream integration.
 * `fetchAll` runs every enabled source in parallel, isolates failures
 * (a dead source degrades gracefully instead of failing the whole request),
 * and records per-source health for the /api/v1/sources endpoint and the
 * Source Health panel.
 */

export interface SourceDef {
  id: string;
  label: string;
  /** Homepage — shown in the UI so users can verify upstreams themselves. */
  url: string;
  /** 'keyless' works out of the box; 'keyed' needs env credentials. */
  kind: 'keyless' | 'keyed';
  description: string;
}

export const SOURCE_REGISTRY: SourceDef[] = [
  { id: 'gdelt', label: 'GDELT', url: 'https://www.gdeltproject.org', kind: 'keyless', description: 'Global news monitoring (DOC 2 API) — tone, volume, geography' },
  { id: 'usgs', label: 'USGS', url: 'https://earthquake.usgs.gov', kind: 'keyless', description: 'Real-time global earthquake feed' },
  { id: 'eonet', label: 'NASA EONET', url: 'https://eonet.gsfc.nasa.gov', kind: 'keyless', description: 'Natural events — wildfires, storms, volcanoes, ice' },
  { id: 'gdacs', label: 'GDACS', url: 'https://www.gdacs.org', kind: 'keyless', description: 'UN/EU disaster alerts — cyclones, floods, volcanoes, wildfires, droughts' },
  { id: 'nws', label: 'NWS', url: 'https://www.weather.gov', kind: 'keyless', description: 'US severe-weather alerts — tornadoes, hurricanes, floods' },
  { id: 'adsb', label: 'ADS-B (mil)', url: 'https://adsb.lol', kind: 'keyless', description: 'Live military aircraft tracks (community ADS-B)' },
  { id: 'swpc', label: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov', kind: 'keyless', description: 'Space-weather watches & warnings' },
  { id: 'ioda', label: 'IODA', url: 'https://ioda.inetintel.cc.gatech.edu', kind: 'keyless', description: 'Country-scale internet outage detection' },
  { id: 'who', label: 'WHO', url: 'https://www.who.int', kind: 'keyless', description: 'WHO outbreak/epidemic notices (gazetteer-geocoded)' },
  { id: 'rss', label: 'RSS wires', url: 'https://en.wikipedia.org/wiki/RSS', kind: 'keyless', description: 'Curated international news feeds' },
  { id: 'markets', label: 'Market feeds', url: 'https://www.coingecko.com', kind: 'keyless', description: 'Crypto (CoinGecko) + indices (stooq)' },
  { id: 'newsapi', label: 'NewsAPI', url: 'https://newsapi.org', kind: 'keyed', description: 'Headline aggregation (requires NEWSAPI_KEY)' },
  { id: 'acled', label: 'ACLED', url: 'https://acleddata.com', kind: 'keyed', description: 'Conflict event data (requires ACLED_KEY + ACLED_EMAIL)' },
  { id: 'reliefweb', label: 'ReliefWeb', url: 'https://reliefweb.int', kind: 'keyed', description: 'UN OCHA humanitarian alerts (requires RELIEFWEB_APPNAME)' },
  { id: 'firms', label: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov', kind: 'keyed', description: 'VIIRS thermal anomalies — global wildfire pixels (requires FIRMS_KEY)' },
];

const health = new Map<string, SourceHealth>();

export function getHealth(): SourceHealth[] {
  return SOURCE_REGISTRY.filter((s) => health.has(s.id)).map(
    (s) => health.get(s.id)!,
  );
}

/**
 * Run one source with timing + health bookkeeping. Never throws — returns
 * `{ data: T | null }` and records the outcome so callers can degrade.
 */
export async function runSource<T>(
  id: string,
  fn: () => Promise<{ items: number; data: T }>,
): Promise<T | null> {
  const started = Date.now();
  try {
    const { items, data } = await fn();
    health.set(id, {
      id,
      label: SOURCE_REGISTRY.find((s) => s.id === id)?.label ?? id,
      status: 'ok',
      latencyMs: Date.now() - started,
      items,
      checkedAt: new Date().toISOString(),
    });
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 'empty' responses are degraded, not down — upstream answered.
    const isNetwork = /abort|timeout|fetch failed|ECONN|ENOTFOUND/i.test(msg);
    health.set(id, {
      id,
      label: SOURCE_REGISTRY.find((s) => s.id === id)?.label ?? id,
      status: isNetwork ? 'down' : 'degraded',
      latencyMs: Date.now() - started,
      items: 0,
      error: msg.slice(0, 200),
      checkedAt: new Date().toISOString(),
    });
    return null;
  }
}
