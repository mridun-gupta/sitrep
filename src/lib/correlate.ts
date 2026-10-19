import { cellKey, haversineKm } from './geo';
import { maxSeverity } from './scoring';
import type { EventCategory, Hotspot, Severity, SitrepEvent } from './types';

/**
 * Cross-source correlation engine.
 *
 * OSINT value comes from *convergence*: one source reporting a fire is noise;
 * a satellite fire detection, a ReliefWeb disaster and negative-tone news all
 * within ~2.5° is signal. We bucket geolocated events into coarse cells and
 * score each cell by volume, source diversity and category diversity.
 */

const BASE_SCORE: Record<Severity, number> = {
  info: 1,
  low: 2,
  medium: 4,
  high: 7,
  critical: 10,
};

export function findHotspots(events: SitrepEvent[], cellDeg = 2.5): Hotspot[] {
  const cells = new Map<string, SitrepEvent[]>();

  for (const e of events) {
    if (!e.location) continue;
    const key = cellKey(e.location.lat, e.location.lon, cellDeg);
    const list = cells.get(key);
    if (list) list.push(e);
    else cells.set(key, [e]);
  }

  const hotspots: Hotspot[] = [];

  for (const [key, list] of cells) {
    const sources = new Set(list.map((e) => e.source));
    const categories = new Set<EventCategory>(list.map((e) => e.category));
    const sev = list.reduce<Severity>(
      (acc, e) => maxSeverity(acc, e.severity),
      'info',
    );

    // Volume × source-diversity × category-diversity, all explainable.
    const raw = list.reduce((acc, e) => acc + BASE_SCORE[e.severity], 0);
    const score =
      raw * (1 + 0.5 * (sources.size - 1)) * (1 + 0.4 * (categories.size - 1));

    // Centroid + most common named place for the label.
    const lat = avg(list.map((e) => e.location!.lat));
    const lon = avg(list.map((e) => e.location!.lon));
    const name = mostCommonName(list);

    hotspots.push({
      id: `hs-${key}`,
      lat,
      lon,
      name,
      categories: [...categories],
      sources: [...sources],
      eventCount: list.length,
      score: Math.round(score * 10) / 10,
      maxSeverity: sev,
      events: list.sort((a, b) => b.time.localeCompare(a.time)),
    });
  }

  return hotspots.sort((a, b) => b.score - a.score);
}

/**
 * A cell only earns "hotspot" status when at least two *different* sources
 * report within it — single-source cells are just activity, not convergence.
 */
export function convergentHotspots(
  events: SitrepEvent[],
  cellDeg = 2.5,
): Hotspot[] {
  return findHotspots(events, cellDeg).filter((h) => h.sources.length >= 2);
}

function avg(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function mostCommonName(events: SitrepEvent[]): string | undefined {
  const counts = new Map<string, number>();
  for (const e of events) {
    const n = e.location?.name;
    if (!n) continue;
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [n, c] of counts) {
    if (c > bestN) {
      best = n;
      bestN = c;
    }
  }
  return best;
}

/** Merge two geolocated events within `km` — used to dedupe cross-source dupes. */
export function nearDuplicate(
  a: SitrepEvent,
  b: SitrepEvent,
  km = 50,
  titleSimilarity = 0.6,
): boolean {
  if (!a.location || !b.location) return false;
  if (haversineKm(a.location, b.location) > km) return false;
  return jaccard(a.title, b.title) >= titleSimilarity;
}

function jaccard(a: string, b: string): number {
  const sa = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const sb = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}
