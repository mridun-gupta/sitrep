/**
 * Core domain types for Sitrep.
 *
 * Everything a data source produces is normalised into one of these shapes so
 * the API, UI, MCP server and AI brief all speak the same language.
 */

export type EventCategory =
  | 'conflict' // armed conflict, strikes, unrest, terrorism
  | 'disaster' // earthquakes, storms, floods, wildfire, volcano
  | 'humanitarian' // displacement, aid alerts, epidemics
  | 'political' // coups, sanctions, elections, diplomacy
  | 'economic' // markets, trade shocks
  | 'cyber' // major outages, intrusions
  | 'infrastructure' // cables, aviation, power, ports
  | 'environment' // natural/cryosphere events (EONET)
  | 'military' // tracked military aircraft, force movements
  | 'health'; // disease outbreaks, epidemic alerts

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** A normalised, geolocated (when available) intelligence event. */
export interface SitrepEvent {
  /** Stable, deterministic id (hash of source+natural key). */
  id: string;
  /** Source registry id, e.g. 'usgs', 'gdelt', 'eonet'. */
  source: string;
  sourceLabel: string;
  category: EventCategory;
  severity: Severity;
  title: string;
  summary?: string;
  url?: string;
  location?: GeoPoint & { name?: string; country?: string };
  /** ISO-8601 timestamp. */
  time: string;
  tags: string[];
  /** Source-specific metrics (magnitude, article count, tone…). */
  metrics?: Record<string, number>;
}

/** A normalised news article from RSS / GDELT DOC. */
export interface NewsItem {
  id: string;
  source: string;
  sourceLabel: string;
  title: string;
  link: string;
  /** ISO-8601 timestamp. */
  published: string;
  summary?: string;
  region?: string;
  topics: string[];
  language?: string;
}

export type QuoteKind = 'crypto' | 'index' | 'commodity' | 'fx';

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  /** 24h % change where the upstream provides it. */
  change24h?: number;
  unit: string;
  kind: QuoteKind;
}

/** Aggregated locality from GDELT GEO — a "tension" point. */
export interface SignalPoint {
  lat: number;
  lon: number;
  name: string;
  /** Article/event intensity for the window. */
  weight: number;
  /** Average GDELT tone (< 0 = negative coverage). */
  tone?: number;
}

/** A place where multiple independent sources/categories converge. */
export interface Hotspot {
  id: string;
  lat: number;
  lon: number;
  name?: string;
  /** Distinct event categories represented. */
  categories: EventCategory[];
  /** Distinct upstream sources represented. */
  sources: string[];
  eventCount: number;
  /** Correlation score — higher = more independent convergence. */
  score: number;
  maxSeverity: Severity;
  events: SitrepEvent[];
}

export type SourceStatus = 'ok' | 'degraded' | 'down';

export interface SourceHealth {
  id: string;
  label: string;
  status: SourceStatus;
  latencyMs: number;
  items: number;
  error?: string;
  checkedAt: string;
}

export interface BriefSection {
  title: string;
  points: string[];
}

export interface SitrepBrief {
  generatedAt: string;
  /** 'ai' when an LLM endpoint produced it, 'deterministic' otherwise. */
  mode: 'ai' | 'deterministic';
  headline: string;
  sections: BriefSection[];
  sources: { label: string; url?: string }[];
}

/** API envelope — every /api/v1 response uses this shape. */
export interface ApiResponse<T> {
  data: T;
  meta: {
    generatedAt: string;
    count: number;
    cached: boolean;
    version: string;
  };
}
