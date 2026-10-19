import { env } from '../env';
import { stableId } from '../geo';
import { reliefSeverity } from '../scoring';
import type { SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * ReliefWeb API v2 — keyed. ReliefWeb requires a per-app `appname` granted
 * via https://apidoc.reliefweb.int/parameters#appname (free, self-serve).
 * Set RELIEFWEB_APPNAME to enable.
 */

function apiUrl(): string {
  const u = new URL('https://api.reliefweb.int/v2/disasters');
  u.searchParams.set('appname', env.RELIEFWEB_APPNAME!);
  u.searchParams.set('profile', 'list');
  u.searchParams.set('preset', 'latest');
  u.searchParams.set('limit', '40');
  for (const f of ['name', 'status', 'date', 'primary_country', 'type', 'url']) {
    u.searchParams.append('fields[include][]', f);
  }
  return u.toString();
}

interface RwDisaster {
  id?: number;
  fields?: {
    name?: string;
    status?: string;
    url?: string;
    date?: { created?: string };
    type?: { name?: string }[];
    primary_country?: {
      name?: string;
      iso3?: string;
      location?: { lat?: number; lon?: number };
    };
  };
}

const TYPE_TAGS: Record<string, string> = {
  'Earthquake': 'earthquake', 'Flood': 'flood', 'Tropical Cyclone': 'cyclone',
  'Volcano': 'volcano', 'Drought': 'drought', 'Epidemic': 'epidemic',
  'Conflict': 'conflict', 'Wild Fire': 'wildfire', 'Land Slide': 'landslide',
  'Heat Wave': 'heatwave', 'Cold Wave': 'coldwave', 'Storm Surge': 'storm',
};

export async function fetchReliefWeb(): Promise<SitrepEvent[]> {
  const raw = await fetchJson<{ data?: RwDisaster[] }>(apiUrl());
  const events: SitrepEvent[] = [];

  for (const d of raw.data ?? []) {
    const f = d.fields;
    if (!f?.name) continue;
    const loc = f.primary_country?.location;
    const typeName = f.type?.[0]?.name ?? 'Disaster';
    const tag = TYPE_TAGS[typeName] ?? 'disaster';
    const isConflict = /conflict|complex emergency/i.test(typeName + f.name);

    events.push({
      id: stableId(['reliefweb', d.id ?? f.name]),
      source: 'reliefweb',
      sourceLabel: 'ReliefWeb',
      category: isConflict ? 'conflict' : 'humanitarian',
      severity: reliefSeverity(f.status),
      title: f.name,
      summary: `${typeName} · status: ${f.status ?? 'unknown'}` +
        (f.primary_country?.name ? ` · ${f.primary_country.name}` : ''),
      url: f.url,
      location:
        loc?.lat !== undefined && loc?.lon !== undefined
          ? { lat: loc.lat, lon: loc.lon, name: f.primary_country?.name, country: f.primary_country?.name }
          : undefined,
      time: f.date?.created ? new Date(f.date.created).toISOString() : new Date().toISOString(),
      tags: [tag],
    });
  }

  return events;
}
