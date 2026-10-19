import { stableId } from '../geo';
import { quakeSeverity } from '../scoring';
import type { SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * USGS real-time earthquake feed (GeoJSON). No key, generous limits.
 * Default: all M4.5+ in the last 24h — the right scale for a global view.
 */

const FEED =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';

interface UsgsFeature {
  id?: string;
  properties?: {
    mag?: number;
    place?: string;
    time?: number;
    url?: string;
    tsunami?: number;
    felt?: number;
    alert?: string;
  };
  geometry?: { coordinates?: [number, number, number] };
}

export async function fetchUsgs(): Promise<SitrepEvent[]> {
  const raw = await fetchJson<{ features?: UsgsFeature[] }>(FEED);
  const events: SitrepEvent[] = [];

  for (const f of raw.features ?? []) {
    const [lon, lat, depthKm] = f.geometry?.coordinates ?? [];
    const p = f.properties ?? {};
    if (lat === undefined || lon === undefined || !p.time) continue;
    const mag = p.mag ?? 0;

    events.push({
      id: stableId(['usgs', f.id ?? `${lat},${lon},${p.time}`]),
      source: 'usgs',
      sourceLabel: 'USGS',
      category: 'disaster',
      severity: quakeSeverity(mag),
      title: `M${mag.toFixed(1)} — ${p.place ?? 'Unknown location'}`,
      summary: `Depth ${Math.round(depthKm ?? 0)} km` + (p.tsunami ? ' · tsunami flag' : ''),
      url: p.url,
      location: { lat, lon, name: p.place },
      time: new Date(p.time).toISOString(),
      tags: ['earthquake'],
      metrics: { magnitude: mag, depthKm: depthKm ?? 0 },
    });
  }

  return events;
}
