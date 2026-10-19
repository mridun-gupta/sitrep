import { stableId } from '../geo';
import type { EventCategory, Severity, SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * GDACS — Global Disaster Alert and Coordination System (UN/OCHA + EU JRC).
 * Keyless GeoJSON. One event type per request; we fan out in parallel.
 * Alert levels are GDACS's own severity model (Green/Orange/Red).
 */

const BASE = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP';
const TYPES: { code: string; cat: EventCategory; tag: string }[] = [
  { code: 'TC', cat: 'disaster', tag: 'cyclone' },
  { code: 'FL', cat: 'disaster', tag: 'flood' },
  { code: 'VO', cat: 'disaster', tag: 'volcano' },
  { code: 'WF', cat: 'disaster', tag: 'wildfire' },
  { code: 'DR', cat: 'environment', tag: 'drought' },
];

interface GdacsFeature {
  properties?: {
    eventtype?: string;
    eventid?: number;
    name?: string;
    description?: string;
    htmldescription?: string;
    alertlevel?: string;
    iscurrent?: string;
    country?: string;
    fromdate?: string;
    datemodified?: string;
    source?: string;
    url?: { report?: string };
    severitydata?: { severity?: number; severitytext?: string; severityunit?: string };
  };
  geometry?: { coordinates?: [number, number] };
}

function severityFor(alert: string | undefined): Severity {
  switch ((alert ?? '').toLowerCase()) {
    case 'red':
      return 'high';
    case 'orange':
      return 'medium';
    default:
      return 'low';
  }
}

export async function fetchGdacs(): Promise<SitrepEvent[]> {
  const settled = await Promise.allSettled(
    TYPES.map(async (t) => {
      const u = new URL(BASE);
      u.searchParams.set('eventtype', t.code);
      u.searchParams.set('format', 'geojson');
      const raw = await fetchJson<{ features?: GdacsFeature[] }>(u.toString());
      return { type: t, features: raw.features ?? [] };
    }),
  );

  const events: SitrepEvent[] = [];
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    const { type, features } = r.value;
    for (const f of features) {
      const p = f.properties ?? {};
      const [lon, lat] = f.geometry?.coordinates ?? [];
      if (lat === undefined || lon === undefined || !p.name) continue;
      if (p.iscurrent === 'false') continue;

      events.push({
        id: stableId(['gdacs', p.eventtype ?? '', p.eventid ?? 0, p.name]),
        source: 'gdacs',
        sourceLabel: 'GDACS',
        category: type.cat,
        severity: severityFor(p.alertlevel),
        title: p.name,
        summary:
          [p.severitydata?.severitytext, p.country].filter(Boolean).join(' · ') ||
          undefined,
        url: p.url?.report,
        location: { lat, lon, name: p.country ?? p.name, country: p.country },
        time: p.fromdate
          ? new Date(p.fromdate).toISOString()
          : new Date().toISOString(),
        tags: [type.tag, p.alertlevel ? `gdacs-${p.alertlevel.toLowerCase()}` : ''],
        metrics:
          p.severitydata?.severity !== undefined
            ? { gdacsSeverity: p.severitydata.severity }
            : undefined,
      });
    }
  }

  if (events.length === 0 && settled.every((r) => r.status === 'rejected')) {
    throw new Error('GDACS unreachable');
  }
  return events;
}
