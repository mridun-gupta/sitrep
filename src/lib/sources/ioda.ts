import { stableId } from '../geo';
import { countryCentroid } from './gazetteer';
import type { Severity, SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * IODA (Internet Outage Detection and Analysis, Georgia Tech) —
 * country-scale connectivity drops detected from BGP, active probing and
 * Google traffic. The OSINT signal: nationwide blackouts during unrest,
 * war or censorship. Keyless academic API.
 */

const WINDOW_MS = 3 * 24 * 3600_000; // look back 3 days
const MAX_EVENTS = 25;

interface IodaEvent {
  location: string; // "country/XX"
  location_name?: string;
  start: number; // unix seconds
  duration: number;
  datasource: 'bgp' | 'ping-slash24' | 'gtr' | string;
  score: number;
  status: number;
}

interface IodaResp {
  data: IodaEvent[] | null;
  error: string | null;
}

const SOURCE_LABEL: Record<string, string> = {
  bgp: 'BGP routing',
  'ping-slash24': 'active probing',
  gtr: 'Google traffic',
};

function sevOf(e: IodaEvent): Severity {
  // gtr (Google-scale) and bgp drops are more reliable than ping probing.
  if (e.datasource === 'gtr' || e.datasource === 'bgp') return 'medium';
  return 'low';
}

export async function fetchIoda(): Promise<SitrepEvent[]> {
  const until = Math.floor(Date.now() / 1000);
  const from = Math.floor((Date.now() - WINDOW_MS) / 1000);
  const url =
    `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events` +
    `?from=${from}&until=${until}&entityType=country&limit=${MAX_EVENTS}`;
  const resp = await fetchJson<IodaResp>(url, { timeoutMs: 20_000 });
  if (resp.error) throw new Error(`IODA: ${resp.error}`);

  // One event per country — keep the strongest datasource signal.
  const byCountry = new Map<string, IodaEvent>();
  for (const e of resp.data ?? []) {
    const cc = e.location.split('/')[1];
    if (!cc) continue;
    const cur = byCountry.get(cc);
    if (!cur || e.score > cur.score) byCountry.set(cc, e);
  }

  const out: SitrepEvent[] = [];
  for (const e of byCountry.values()) {
    const name = e.location_name ?? e.location;
    const centroid = countryCentroid(name);
    out.push({
      id: stableId(['ioda', e.location, e.datasource, e.start]),
      source: 'ioda',
      sourceLabel: 'IODA',
      category: 'infrastructure',
      severity: sevOf(e),
      title: `Connectivity drop — ${name}`,
      summary: `Country-scale internet outage detected via ${SOURCE_LABEL[e.datasource] ?? e.datasource}; duration ~${Math.round(e.duration / 3600)}h.`,
      url: `https://ioda.inetintel.cc.gatech.edu/country/${e.location.split('/')[1]}`,
      location: centroid
        ? { lat: centroid.lat, lon: centroid.lon, name: centroid.name, country: centroid.name }
        : undefined,
      time: new Date(e.start * 1000).toISOString(),
      tags: ['internet-outage', e.datasource],
      metrics: { score: e.score, durationSec: e.duration },
    });
  }
  return out;
}
