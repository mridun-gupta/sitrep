import { stableId } from '../geo';
import type { EventCategory, Severity, SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * NASA EONET — Earth Observatory Natural Event Tracker.
 * Open natural events: wildfires, severe storms, volcanoes, sea/lake ice.
 */

const API = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=60';

interface EonetEvent {
  id?: string;
  title?: string;
  link?: string;
  categories?: { id?: string; title?: string }[];
  geometry?: { date?: string; type?: string; coordinates?: number[] | number[][][] }[];
}

const CAT_MAP: Record<string, { cat: EventCategory; tag: string }> = {
  wildfires: { cat: 'disaster', tag: 'wildfire' },
  severeStorms: { cat: 'disaster', tag: 'storm' },
  volcanoes: { cat: 'disaster', tag: 'volcano' },
  earthquakes: { cat: 'disaster', tag: 'earthquake' },
  floods: { cat: 'disaster', tag: 'flood' },
  landslides: { cat: 'disaster', tag: 'landslide' },
  seaLakeIce: { cat: 'environment', tag: 'ice' },
  drought: { cat: 'environment', tag: 'drought' },
  dustHaze: { cat: 'environment', tag: 'dust' },
  snow: { cat: 'disaster', tag: 'snow' },
  tempExtremes: { cat: 'environment', tag: 'temperature' },
  waterColor: { cat: 'environment', tag: 'water' },
  manmade: { cat: 'infrastructure', tag: 'manmade' },
};

function severityFor(catId: string): Severity {
  switch (catId) {
    case 'volcanoes':
    case 'severeStorms':
      return 'medium';
    case 'wildfires':
      return 'medium';
    default:
      return 'low';
  }
}

export async function fetchEonet(): Promise<SitrepEvent[]> {
  const raw = await fetchJson<{ events?: EonetEvent[] }>(API);
  const events: SitrepEvent[] = [];

  for (const e of raw.events ?? []) {
    if (!e.title) continue;
    const geo = e.geometry?.at(-1); // most recent position
    const coords = geo?.coordinates;
    // Point events only (polygons are [ [ [lon,lat]… ] ])
    if (!Array.isArray(coords) || typeof coords[0] !== 'number') continue;
    const [lon, lat] = coords as number[];

    const catId = e.categories?.[0]?.id ?? '';
    const mapped = CAT_MAP[catId] ?? { cat: 'environment' as const, tag: 'natural' };

    events.push({
      id: stableId(['eonet', e.id ?? e.title]),
      source: 'eonet',
      sourceLabel: 'NASA EONET',
      category: mapped.cat,
      severity: severityFor(catId),
      title: e.title,
      url: e.link,
      location: { lat, lon, name: e.title },
      time: geo?.date ? new Date(geo.date).toISOString() : new Date().toISOString(),
      tags: [mapped.tag],
    });
  }

  return events;
}
