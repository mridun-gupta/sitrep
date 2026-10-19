import Parser from 'rss-parser';
import { stableId, stripHtml, truncate } from '../geo';
import { classifyCategories } from '../scoring';
import type { NewsItem } from '../types';
import { fetchText } from './http';

/**
 * Curated international RSS wires — all public, no keys.
 * Feeds go stale/die sometimes; the source-health layer tracks that, and
 * adding/removing a feed is a one-line change here.
 */

export const RSS_FEEDS: { id: string; label: string; url: string; lang: string }[] = [
  { id: 'bbc-world', label: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en' },
  { id: 'aljazeera', label: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en' },
  { id: 'guardian-world', label: 'The Guardian — World', url: 'https://www.theguardian.com/world/rss', lang: 'en' },
  { id: 'dw', label: 'Deutsche Welle', url: 'https://rss.dw.com/rdf/rss-en-world', lang: 'en' },
  { id: 'france24', label: 'France 24', url: 'https://www.france24.com/en/rss', lang: 'en' },
  { id: 'npr-world', label: 'NPR — World', url: 'https://feeds.npr.org/1004/rss.xml', lang: 'en' },
  { id: 'un-news', label: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', lang: 'en' },
  { id: 'reliefweb-updates', label: 'ReliefWeb — Updates', url: 'https://reliefweb.int/updates/rss.xml', lang: 'en' },
  { id: 'who', label: 'WHO News', url: 'https://www.who.int/rss-feeds/news-english.xml', lang: 'en' },
  { id: 'cisa', label: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', lang: 'en' },
];

const parser = new Parser({ timeout: 12_000 });

export interface RssResult {
  items: NewsItem[];
  /** How many feeds parsed cleanly (for health status). */
  feedsOk: number;
  feedsTotal: number;
}

export async function fetchRss(maxPerFeed = 15): Promise<RssResult> {
  const settled = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      // We fetch bytes ourselves so timeout/UA/size-cap stay consistent;
      // rss-parser only parses.
      const xml = await fetchText(feed.url, { timeoutMs: 12_000 });
      const parsed = await parser.parseString(xml);
      return { feed, parsed };
    }),
  );

  const items: NewsItem[] = [];
  let feedsOk = 0;

  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    feedsOk++;
    const { feed, parsed } = r.value;
    for (const entry of (parsed.items ?? []).slice(0, maxPerFeed)) {
      if (!entry.title || !entry.link) continue;
      const published =
        entry.isoDate ??
        (entry.pubDate ? new Date(entry.pubDate).toISOString() : undefined) ??
        new Date().toISOString();
      const summary = stripHtml(entry.contentSnippet ?? entry.content ?? '');

      items.push({
        id: stableId(['rss', feed.id, entry.link]),
        source: feed.id,
        sourceLabel: feed.label,
        title: entry.title.trim(),
        link: entry.link,
        published,
        summary: summary ? truncate(summary, 240) : undefined,
        topics: classifyCategories(entry.title + ' ' + summary),
        language: feed.lang,
      });
    }
  }

  // Newest first.
  items.sort((a, b) => b.published.localeCompare(a.published));
  return { items, feedsOk, feedsTotal: RSS_FEEDS.length };
}
