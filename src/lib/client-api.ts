'use client';

import type {
  Hotspot,
  MarketQuote,
  NewsItem,
  SignalPoint,
  SitrepBrief,
  SitrepEvent,
} from './types';

/** Client-side fetchers for the same /api/v1 the public uses. */

interface Envelope<T> {
  data: T;
  meta: { generatedAt: string; count: number; cached: boolean; version: string };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  const body = (await res.json()) as Envelope<T>;
  return body.data;
}

export interface HotspotSlim extends Omit<Hotspot, 'events'> {
  topTitles: string[];
}

export const api = {
  events: (hours = 48, limit = 500) =>
    get<SitrepEvent[]>(`/api/v1/events?hours=${hours}&limit=${limit}`),
  news: (hours = 48, limit = 120) =>
    get<NewsItem[]>(`/api/v1/news?hours=${hours}&limit=${limit}`),
  hotspots: (limit = 40) => get<HotspotSlim[]>(`/api/v1/hotspots?limit=${limit}`),
  signals: (limit = 60) => get<SignalPoint[]>(`/api/v1/signals?limit=${limit}`),
  markets: () => get<MarketQuote[]>('/api/v1/markets'),
  sources: () =>
    get<{ sources: SourceInfo[]; capabilities: Capabilities }>('/api/v1/sources'),
  brief: () => get<SitrepBrief>('/api/v1/brief'),
};

export interface SourceInfo {
  id: string;
  label: string;
  url: string;
  kind: 'keyless' | 'keyed';
  description: string;
  health: {
    status: 'ok' | 'degraded' | 'down';
    latencyMs: number;
    items: number;
    error?: string;
    checkedAt: string;
  } | null;
}

export interface Capabilities {
  supabase: boolean;
  aiBriefs: boolean;
}
