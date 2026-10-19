import Parser from 'rss-parser';
import { stableId, stripHtml, truncate } from '../geo';
import { severityFromText } from '../scoring';
import type { SitrepEvent } from '../types';
import { extractPlaces } from './gazetteer';
import { fetchText } from './http';

/**
 * WHO news feed → disease-outbreak events. We filter the general WHO
 * wire for outbreak/epidemic language and geocode the headline through
 * the built-in gazetteer — real WHO notices, no synthesis.
 */

const URL_WHO = 'https://www.who.int/rss-feeds/news-english.xml';
const MAX_EVENTS = 20;

const OUTBREAK_RE =
  /\b(outbreak|epidemic|pandemic|cholera|ebola|mpox|dengue|measles|polio|malaria|marburg|plague|yellow fever|bird flu|h5n1|hantavirus|lassa)\b/i;

const parser = new Parser();

export async function fetchWho(): Promise<SitrepEvent[]> {
  const xml = await fetchText(URL_WHO, { timeoutMs: 15_000 });
  const parsed = await parser.parseString(xml);
  const out: SitrepEvent[] = [];

  for (const entry of parsed.items ?? []) {
    if (!entry.title || !entry.link) continue;
    const text = `${entry.title} ${stripHtml(entry.contentSnippet ?? entry.content ?? '')}`;
    if (!OUTBREAK_RE.test(text)) continue;
    const published =
      entry.isoDate ??
      (entry.pubDate ? new Date(entry.pubDate).toISOString() : new Date().toISOString());
    // WHO's feed carries evergreen items — only surface recent notices.
    if (Date.now() - new Date(published).getTime() > 120 * 24 * 3600_000) continue;
    const [place] = extractPlaces(text, 1);

    out.push({
      id: stableId(['who', entry.link]),
      source: 'who',
      sourceLabel: 'WHO',
      category: 'health',
      severity: severityFromText(text) === 'info' ? 'low' : severityFromText(text),
      title: entry.title.trim(),
      summary: truncate(stripHtml(entry.contentSnippet ?? ''), 240) || undefined,
      url: entry.link,
      location: place
        ? { lat: place.lat, lon: place.lon, name: place.name, country: place.country }
        : undefined,
      time: published,
      tags: ['who', 'outbreak'],
    });
    if (out.length >= MAX_EVENTS) break;
  }
  return out;
}
