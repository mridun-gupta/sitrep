import type { SitrepEvent } from '../types';
import { supabaseAdmin, supabaseForWatchKey, supabasePublic } from './supabase';

/**
 * Persistence abstraction — Supabase when configured, no-op otherwise.
 * Keeps every call-site honest: the app never *requires* a database.
 */

// ── Event cache (written by cron ingest, read as a fallback layer) ──────

export async function persistEvents(events: SitrepEvent[]): Promise<number> {
  const db = supabaseAdmin();
  if (!db || events.length === 0) return 0;

  const rows = events.map((e) => ({
    id: e.id,
    source: e.source,
    category: e.category,
    severity: e.severity,
    title: e.title.slice(0, 500),
    summary: e.summary?.slice(0, 1000) ?? null,
    url: e.url ?? null,
    lat: e.location?.lat ?? null,
    lon: e.location?.lon ?? null,
    place_name: e.location?.name ?? null,
    country: e.location?.country ?? null,
    tags: e.tags,
    metrics: e.metrics ?? {},
    occurred_at: e.time,
  }));

  const { error } = await db
    .from('events_cache')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`events_cache upsert: ${error.message}`);
  return rows.length;
}

export async function readPersistedEvents(sinceIso: string): Promise<SitrepEvent[]> {
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db
    .from('events_cache')
    .select('*')
    .gte('occurred_at', sinceIso)
    .order('occurred_at', { ascending: false })
    .limit(500);
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    source: r.source,
    sourceLabel: r.source,
    category: r.category,
    severity: r.severity,
    title: r.title,
    summary: r.summary ?? undefined,
    url: r.url ?? undefined,
    location:
      r.lat !== null && r.lon !== null
        ? { lat: r.lat, lon: r.lon, name: r.place_name ?? undefined, country: r.country ?? undefined }
        : undefined,
    time: r.occurred_at,
    tags: r.tags ?? [],
    metrics: r.metrics ?? undefined,
  }));
}

// ── Ingest run log (ops observability for cron) ─────────────────────────

export async function logIngestRun(run: {
  source: string;
  fetched: number;
  upserted: number;
  durationMs: number;
  error?: string;
}): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from('ingest_runs').insert({
    source: run.source,
    fetched: run.fetched,
    upserted: run.upserted,
    duration_ms: run.durationMs,
    error: run.error ?? null,
  });
}

// ── Watchlists (anon-key friendly; rows keyed by a client-held token) ───

export interface WatchlistRow {
  watch_key: string;
  label: string;
  query: string;
  created_at?: string;
}

export async function listWatchlists(watchKey: string): Promise<WatchlistRow[]> {
  const db = supabaseForWatchKey(watchKey);
  if (!db) return [];
  const { data } = await db
    .from('watchlists')
    .select('watch_key,label,query,created_at')
    .eq('watch_key', watchKey)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function addWatchlist(w: WatchlistRow): Promise<boolean> {
  const db = supabaseForWatchKey(w.watch_key);
  if (!db) return false;
  const { error } = await db
    .from('watchlists')
    .insert({ watch_key: w.watch_key, label: w.label.slice(0, 80), query: w.query.slice(0, 300) });
  return !error;
}

export async function deleteWatchlist(watchKey: string, query: string): Promise<boolean> {
  const db = supabaseForWatchKey(watchKey);
  if (!db) return false;
  const { error } = await db
    .from('watchlists')
    .delete()
    .eq('watch_key', watchKey)
    .eq('query', query);
  return !error;
}
