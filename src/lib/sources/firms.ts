import { cellKey, stableId } from '../geo';
import type { Severity, SitrepEvent } from '../types';
import { fetchText } from './http';

/**
 * NASA FIRMS (Fire Information for Resource Management System) —
 * near-real-time thermal anomalies from VIIRS. Free key (instant signup
 * at firms.modaps.eosdis.nasa.gov/map/activate). CSV world feed is large,
 * so raw pixels are aggregated into ~2.5° cells — each event carries the
 * hotspot count + max fire radiative power for that cell.
 */

const MAX_CELLS = 60;

export async function fetchFirms(mapKey: string): Promise<SitrepEvent[]> {
  const url =
    `https://firms.modaps.eosdis.nasa.gov/api/area/csv/` +
    `${encodeURIComponent(mapKey)}/VIIRS_SNPP_NRT/world/1`;
  const csv = await fetchText(url, { timeoutMs: 25_000 });

  const lines = csv.split('\n');
  const header = lines[0]?.split(',').map((h) => h.trim()) ?? [];
  const iLat = header.indexOf('latitude');
  const iLon = header.indexOf('longitude');
  const iFrp = header.indexOf('frp');
  const iDate = header.indexOf('acq_date');
  if (iLat < 0 || iLon < 0) throw new Error('FIRMS: unexpected CSV schema');

  const cells = new Map<string, { lat: number; lon: number; n: number; maxFrp: number; day: string }>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length <= Math.max(iLat, iLon)) continue;
    const lat = Number(cols[iLat]);
    const lon = Number(cols[iLon]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    const key = cellKey(lat, lon);
    const frp = iFrp >= 0 ? Number(cols[iFrp]) || 0 : 0;
    const cur = cells.get(key);
    if (cur) {
      cur.n++;
      cur.maxFrp = Math.max(cur.maxFrp, frp);
    } else {
      cells.set(key, { lat, lon, n: 1, maxFrp: frp, day: iDate >= 0 ? cols[iDate] : '' });
    }
  }

  const sevOf = (n: number, frp: number): Severity =>
    frp >= 500 || n >= 250 ? 'high' : frp >= 120 || n >= 60 ? 'medium' : 'low';

  return [...cells.values()]
    .sort((a, b) => b.maxFrp - a.maxFrp || b.n - a.n)
    .slice(0, MAX_CELLS)
    .map((c) => ({
      id: stableId(['firms', c.lat.toFixed(1), c.lon.toFixed(1), c.day]),
      source: 'firms',
      sourceLabel: 'NASA FIRMS',
      category: 'disaster',
      severity: sevOf(c.n, c.maxFrp),
      title: `${c.n.toLocaleString()} thermal detections — ${c.lat.toFixed(1)}°, ${c.lon.toFixed(1)}°`,
      summary: `VIIRS fire/thermal cluster, peak FRP ${c.maxFrp.toFixed(0)} MW`,
      url: 'https://firms.modaps.eosdis.nasa.gov/map/',
      location: { lat: c.lat, lon: c.lon },
      time: c.day ? new Date(c.day + 'T12:00:00Z').toISOString() : new Date().toISOString(),
      tags: ['wildfire', 'thermal', 'viirs'],
      metrics: { detections: c.n, maxFrpMw: c.maxFrp },
    }));
}
