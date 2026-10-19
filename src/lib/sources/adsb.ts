import { stableId } from '../geo';
import type { Severity, SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * adsb.lol — community ADS-B aggregator, /v2/mil returns every military
 * aircraft being tracked right now (transponders on). Keyless, updates
 * continuously. A core OSINT surface: tanker orbits, ISR patterns, troop
 * transports show up here before any headline.
 */

const URL_MIL = 'https://api.adsb.lol/v2/mil';
const MAX_TRACKS = 160;

interface AdsbAc {
  hex: string;
  flight?: string;
  t?: string; // ICAO type designator
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground';
  gs?: number; // ground speed knots
  squawk?: string;
  r?: string; // registration
}

/** Airframes worth flagging — surveillance/tanker/bomber patterns. */
const INTERESTING = /^(E\d|RC|R[135]|U2|B\d|F\d+|K\d+|P8|A10|MQ|RQ|KC|V22|C17|C5)/;

function sevOf(ac: AdsbAc): Severity {
  if (ac.t && INTERESTING.test(ac.t.toUpperCase())) return 'low';
  return 'info';
}

export async function fetchMilitaryTracks(): Promise<SitrepEvent[]> {
  const data = await fetchJson<{ ac?: AdsbAc[] }>(URL_MIL, { timeoutMs: 15_000 });
  const out: SitrepEvent[] = [];
  const now = new Date().toISOString();

  for (const ac of data.ac ?? []) {
    if (ac.lat === undefined || ac.lon === undefined) continue;
    const callsign = (ac.flight ?? ac.hex).trim();
    const type = (ac.t ?? '').trim();
    const alt = typeof ac.alt_baro === 'number' ? `${ac.alt_baro.toLocaleString()}ft` : (ac.alt_baro ?? '');
    out.push({
      id: stableId(['adsb', ac.hex, ac.flight ?? '']),
      source: 'adsb',
      sourceLabel: 'ADS-B (mil)',
      category: 'military',
      severity: sevOf(ac),
      title: `${callsign}${type ? ` · ${type}` : ''} tracked`,
      summary: `Military aircraft on transponder — ${[alt, ac.gs ? `${Math.round(ac.gs)}kt` : ''].filter(Boolean).join(', ')}`,
      url: `https://globe.adsb.lol/?icao=${ac.hex}`,
      location: { lat: ac.lat, lon: ac.lon },
      time: now,
      tags: ['military', 'adsb', type].filter(Boolean),
      metrics: {
        ...(typeof ac.alt_baro === 'number' ? { altitudeFt: ac.alt_baro } : {}),
        ...(ac.gs !== undefined ? { speedKt: ac.gs } : {}),
      },
    });
    if (out.length >= MAX_TRACKS) break;
  }
  return out;
}
