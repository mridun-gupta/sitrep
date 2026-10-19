import { stableId, stripHtml, truncate } from '../geo';
import { classifyCategories, severityFromText, toneToTension } from '../scoring';
import type { NewsItem, SignalPoint, SitrepEvent } from '../types';
import { extractPlaces } from './gazetteer';
import { fetchJson } from './http';

/**
 * GDELT DOC 2 API.
 *
 * Notes from the field:
 *  - Rate limit is strict: ~1 request / 5s per IP. We run ONE broad query,
 *    cache aggressively, and treat 429/rate-limit text as a retryable error.
 *  - The GEO/Events v2 endpoints are deprecated (404), so geolocation comes
 *    from our gazetteer applied to titles.
 *  - `tone` ranges roughly −10…+10; negative = negative coverage.
 */

const DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';
const QUERY =
  '(conflict OR war OR airstrike OR missile OR earthquake OR flood OR ' +
  'wildfire OR coup OR sanction OR protest OR cyberattack OR outage OR ' +
  'refugee OR epidemic OR volcano OR typhoon OR hurricane OR ceasefire)';

interface GdeltArticle {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string; // "20261019T120000Z"
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  tone?: number;
}

interface GdeltDocResponse {
  articles?: GdeltArticle[];
}

function parseGdeltDate(s?: string): string {
  // "20261019T120000Z" → ISO
  const m = s?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!m) return new Date().toISOString();
  const [, y, mo, d, h, mi, se] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}Z`).toISOString();
}

export interface GdeltResult {
  articles: NewsItem[];
  events: SitrepEvent[];
  signals: SignalPoint[];
}

export async function fetchGdelt(timespan = '24h', maxrecords = 100): Promise<GdeltResult> {
  const url =
    `${DOC_API}?query=${encodeURIComponent(QUERY)}` +
    `&mode=artlist&maxrecords=${maxrecords}&format=json&timespan=${timespan}` +
    `&format=Json&sort=datedesc`;

  const raw = await fetchJson<GdeltDocResponse>(url, { timeoutMs: 25_000 });
  const articles = raw.articles ?? [];

  const news: NewsItem[] = [];
  const events: SitrepEvent[] = [];
  const signalMap = new Map<string, SignalPoint>();

  for (const a of articles) {
    if (!a.title || !a.url) continue;
    const title = stripHtml(a.title);
    const published = parseGdeltDate(a.seendate);
    const cats = classifyCategories(title);
    const tone = typeof a.tone === 'number' ? a.tone : undefined;

    news.push({
      id: stableId(['gdelt', a.url]),
      source: 'gdelt',
      sourceLabel: 'GDELT',
      title,
      link: a.url,
      published,
      region: a.sourcecountry,
      topics: cats,
      language: a.language,
    });

    // Only conflict/disaster-flavoured articles become map events.
    if (cats.length === 0) continue;
    const places = extractPlaces(title, 1);
    const severity = severityFromText(title);
    for (const p of places) {
      events.push({
        id: stableId(['gdelt', a.url, p.name]),
        source: 'gdelt',
        sourceLabel: 'GDELT',
        category: cats[0],
        severity,
        title: truncate(title, 140),
        url: a.url,
        location: { lat: p.lat, lon: p.lon, name: p.name, country: p.country },
        time: published,
        tags: cats,
        metrics: tone !== undefined ? { tone } : undefined,
      });

      const key = `${p.lat.toFixed(1)},${p.lon.toFixed(1)}`;
      const existing = signalMap.get(key);
      const w = 1 + toneToTension(tone);
      if (existing) {
        existing.weight += w;
        if (tone !== undefined) existing.tone = (existing.tone ?? 0) * 0.7 + tone * 0.3;
      } else {
        signalMap.set(key, { lat: p.lat, lon: p.lon, name: p.name, weight: w, tone });
      }
    }
  }

  return { articles: news, events, signals: [...signalMap.values()] };
}
