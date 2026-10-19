import { env } from '../env';
import { stableId, stripHtml, truncate } from '../geo';
import { classifyCategories } from '../scoring';
import type { NewsItem } from '../types';
import { fetchJson } from './http';

/**
 * NewsAPI — keyed (NEWSAPI_KEY). Broad "everything" pull for world affairs.
 */

interface NaArticle {
  title?: string;
  url?: string;
  publishedAt?: string;
  description?: string;
  source?: { name?: string };
}

export async function fetchNewsApi(): Promise<NewsItem[]> {
  const u = new URL('https://newsapi.org/v2/everything');
  u.searchParams.set('q', 'conflict OR disaster OR crisis OR geopolitics');
  u.searchParams.set('language', 'en');
  u.searchParams.set('sortBy', 'publishedAt');
  u.searchParams.set('pageSize', '50');
  u.searchParams.set('apiKey', env.NEWSAPI_KEY!);

  const raw = await fetchJson<{ articles?: NaArticle[] }>(u.toString());
  const items: NewsItem[] = [];
  for (const a of raw.articles ?? []) {
    if (!a.title || !a.url || a.title === '[Removed]') continue;
    const summary = stripHtml(a.description ?? '');
    items.push({
      id: stableId(['newsapi', a.url]),
      source: 'newsapi',
      sourceLabel: a.source?.name ? `NewsAPI · ${a.source.name}` : 'NewsAPI',
      title: a.title.trim(),
      link: a.url,
      published: a.publishedAt ?? new Date().toISOString(),
      summary: summary ? truncate(summary, 240) : undefined,
      topics: classifyCategories(`${a.title} ${summary}`),
      language: 'en',
    });
  }
  return items;
}
