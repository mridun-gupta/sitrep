import { stableId } from '../geo';
import type { Severity, SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * US National Weather Service active alerts — official severe-weather
 * warnings (tornado, hurricane, blizzard, flood, extreme heat…).
 * Keyless, GeoJSON, often zero outside storm windows — that's correct.
 */

const URL_ALERTS =
  'https://api.weather.gov/alerts/active?status=actual&message_type=alert';
const MAX_ALERTS = 80;

interface NwsProps {
  id?: string;
  event?: string;
  severity?: string;
  urgency?: string;
  certainty?: string;
  headline?: string;
  areaDesc?: string;
  effective?: string;
  expires?: string;
  senderName?: string;
}

interface NwsFeature {
  id?: string;
  properties?: NwsProps;
  geometry?: { type: string; coordinates: unknown } | null;
}

function sevOf(s: string | undefined, urgency: string | undefined): Severity {
  switch ((s ?? '').toLowerCase()) {
    case 'extreme': return 'critical';
    case 'severe': return 'high';
    case 'moderate': return urgency === 'Expected' ? 'medium' : 'medium';
    case 'minor': return 'low';
    default: return 'info';
  }
}

/** Centroid of the first polygon ring — good enough for alert display. */
function centroid(geom: NwsFeature['geometry']): { lat: number; lon: number } | null {
  if (!geom) return null;
  const rings: number[][][] | null =
    geom.type === 'Polygon'
      ? (geom.coordinates as number[][][])
      : geom.type === 'MultiPolygon'
        ? ((geom.coordinates as number[][][][])[0] ?? null)
        : null;
  const ring = rings?.[0];
  if (!ring?.length) return null;
  let lat = 0, lon = 0;
  for (const [x, y] of ring) { lat += y; lon += x; }
  return { lat: lat / ring.length, lon: lon / ring.length };
}

export async function fetchNwsAlerts(): Promise<SitrepEvent[]> {
  const data = await fetchJson<{ features?: NwsFeature[] }>(URL_ALERTS, {
    timeoutMs: 15_000,
    // NWS ToS wants a contactable UA
    headers: { 'User-Agent': 'sitrep/0.1 (osint dashboard; github.com/mridun-gupta/sitrep)' },
  });

  const out: SitrepEvent[] = [];
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    if (!p.event) continue;
    out.push({
      id: stableId(['nws', f.id ?? p.id ?? p.event + (p.areaDesc ?? '')]),
      source: 'nws',
      sourceLabel: 'NWS',
      category: 'disaster',
      severity: sevOf(p.severity, p.urgency),
      title: `${p.event} — ${p.areaDesc ?? 'US'}`,
      summary: p.headline,
      url: p.id,
      location: centroid(f.geometry)
        ? { ...centroid(f.geometry)!, name: p.areaDesc }
        : undefined,
      time: p.effective ? new Date(p.effective).toISOString() : new Date().toISOString(),
      tags: ['nws', 'weather-alert', (p.severity ?? '').toLowerCase()].filter(Boolean),
    });
    if (out.length >= MAX_ALERTS) break;
  }
  return out;
}
