import type { GeoPoint } from './types';

/** Great-circle distance in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Bucket key for coarse spatial clustering (~`cellDeg` degrees per cell). */
export function cellKey(lat: number, lon: number, cellDeg = 2.5): string {
  return `${Math.floor(lat / cellDeg)}:${Math.floor(lon / cellDeg)}`;
}

/**
 * Coarse world regions used for the regional tension rollup.
 * Bounding boxes are deliberately approximate — this is a situational
 * rollup, not a gazetteer. Oceans fall through to 'other'.
 */
export const REGIONS: { id: string; label: string; box: [number, number, number, number] }[] = [
  // [minLat, minLon, maxLat, maxLon]
  { id: 'north-america', label: 'North America', box: [15, -170, 72, -50] },
  { id: 'latin-america', label: 'Latin America', box: [-56, -120, 15, -30] },
  { id: 'europe', label: 'Europe', box: [36, -25, 72, 45] },
  { id: 'mena', label: 'Middle East & N. Africa', box: [12, -18, 38, 60] },
  { id: 'sub-saharan-africa', label: 'Sub-Saharan Africa', box: [-35, -18, 15, 55] },
  { id: 'south-asia', label: 'South Asia', box: [5, 60, 38, 98] },
  { id: 'east-asia', label: 'East Asia', box: [18, 98, 54, 146] },
  { id: 'se-asia', label: 'Southeast Asia', box: [-11, 92, 20, 142] },
  { id: 'oceania', label: 'Oceania', box: [-48, 110, -5, 180] },
  { id: 'russia-central-asia', label: 'Russia & Central Asia', box: [38, 45, 78, 180] },
];

export function regionOf(p: GeoPoint): string {
  for (const r of REGIONS) {
    const [minLat, minLon, maxLat, maxLon] = r.box;
    if (p.lat >= minLat && p.lat <= maxLat && p.lon >= minLon && p.lon <= maxLon) {
      return r.id;
    }
  }
  return 'other';
}

export function regionLabel(id: string): string {
  return REGIONS.find((r) => r.id === id)?.label ?? 'Other / Ocean';
}

/** Deterministic short id for events (no crypto needed — dedupe key only). */
export function stableId(parts: (string | number | undefined)[]): string {
  const s = parts.filter(Boolean).join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// Gazetteer extraction lives in sources/gazetteer.ts (kept separate so the
// place index isn't bundled into code paths that don't need it).

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}
