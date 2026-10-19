import { env } from '../env';
import { stableId, truncate } from '../geo';
import { severityFromText } from '../scoring';
import type { SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * ACLED — keyed (ACLED_KEY + ACLED_EMAIL, free registration).
 * Real conflict event data: battles, explosions, protests, violence against
 * civilians — with fatalities. This is the gold-standard OSINT conflict feed.
 */

interface AcledEvent {
  event_id_cnty?: string;
  event_date?: string;
  event_type?: string;
  sub_event_type?: string;
  country?: string;
  admin1?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  fatalities?: string;
  notes?: string;
  source?: string;
}

function acledSeverity(e: AcledEvent) {
  const fat = Number(e.fatalities ?? 0);
  if (fat >= 20) return 'critical' as const;
  if (fat >= 5) return 'high' as const;
  if (fat >= 1) return 'medium' as const;
  return severityFromText(`${e.event_type} ${e.sub_event_type} ${e.notes ?? ''}`);
}

export async function fetchAcled(): Promise<SitrepEvent[]> {
  const u = new URL('https://api.acleddata.com/acled/read');
  u.searchParams.set('key', env.ACLED_KEY!);
  u.searchParams.set('email', env.ACLED_EMAIL!);
  u.searchParams.set('limit', '120');
  u.searchParams.set('terms', 'accept');
  u.searchParams.set('fields', 'event_id_cnty|event_date|event_type|sub_event_type|country|admin1|location|latitude|longitude|fatalities|notes|source');

  const raw = await fetchJson<{ data?: AcledEvent[] }>(u.toString());
  const events: SitrepEvent[] = [];

  for (const e of raw.data ?? []) {
    const lat = Number(e.latitude);
    const lon = Number(e.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const place = [e.location, e.admin1, e.country].filter(Boolean).join(', ');
    events.push({
      id: stableId(['acled', e.event_id_cnty ?? `${lat},${lon},${e.event_date}`]),
      source: 'acled',
      sourceLabel: 'ACLED',
      category: 'conflict',
      severity: acledSeverity(e),
      title: `${e.event_type}${e.sub_event_type ? ` — ${e.sub_event_type}` : ''} in ${place}`,
      summary: [
        e.notes ? truncate(e.notes, 220) : '',
        Number(e.fatalities) ? `${e.fatalities} reported fatalities` : '',
        e.source ? `source: ${truncate(e.source, 80)}` : '',
      ].filter(Boolean).join(' · ') || undefined,
      location: { lat, lon, name: e.location, country: e.country },
      time: e.event_date
        ? new Date(`${e.event_date}T00:00:00Z`).toISOString()
        : new Date().toISOString(),
      tags: ['conflict', e.event_type ?? ''].filter(Boolean),
      metrics: { fatalities: Number(e.fatalities ?? 0) },
    });
  }

  return events;
}
