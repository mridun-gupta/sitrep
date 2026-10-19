-- Sitrep — initial schema
-- Apply with: supabase db push  (or paste into the Supabase SQL editor)
-- Everything here is optional: the app runs fully without this database.

-- ── events_cache ────────────────────────────────────────────────────────
-- Server-side event cache populated by /api/cron/ingest. Lets a busy public
-- deployment serve events from the DB instead of hammering upstream APIs.
create table if not exists public.events_cache (
  id            text primary key,           -- deterministic hash id
  source        text not null,
  category      text not null,
  severity      text not null,
  title         text not null,
  summary       text,
  url           text,
  lat           double precision,
  lon           double precision,
  place_name    text,
  country       text,
  tags          text[] not null default '{}',
  metrics       jsonb not null default '{}',
  occurred_at   timestamptz not null,
  ingested_at   timestamptz not null default now()
);

create index if not exists events_cache_occurred_idx on public.events_cache (occurred_at desc);
create index if not exists events_cache_geo_idx on public.events_cache (lat, lon) where lat is not null;
create index if not exists events_cache_category_idx on public.events_cache (category, severity);

-- ── ingest_runs ─────────────────────────────────────────────────────────
-- Ops log: one row per cron source run. Only writable with the service key.
create table if not exists public.ingest_runs (
  id          bigint generated always as identity primary key,
  source      text not null,
  fetched     int  not null default 0,
  upserted    int  not null default 0,
  duration_ms int  not null default 0,
  error       text,
  ran_at      timestamptz not null default now()
);

-- ── watchlists ──────────────────────────────────────────────────────────
-- Watchlists are keyed by a client-generated watch_key (a random UUID kept
-- in the user's browser — no accounts required). RLS ensures a browser can
-- only ever touch rows carrying its own key.
create table if not exists public.watchlists (
  id         bigint generated always as identity primary key,
  watch_key  uuid not null,
  label      text not null check (char_length(label) <= 80),
  query      text not null check (char_length(query) <= 300),
  created_at timestamptz not null default now(),
  unique (watch_key, query)
);

-- ── Row Level Security ──────────────────────────────────────────────────
alter table public.events_cache  enable row level security;
alter table public.ingest_runs   enable row level security;
alter table public.watchlists    enable row level security;

-- Anyone may READ the event cache — it's public intelligence data.
create policy "events_cache is world-readable"
  on public.events_cache for select using (true);

-- ingest_runs: readable by anyone (transparency), writable only by service role
-- (service role bypasses RLS entirely, so no insert policy is needed).
create policy "ingest_runs is world-readable"
  on public.ingest_runs for select using (true);

-- Watchlists: a browser may only see/edit rows under its own watch_key.
-- The key arrives as a custom header → surfaced via request.jwt.claims is
-- not available for anon access, so instead the app always filters
-- .eq('watch_key', key) and these policies make that binding *enforced*:
-- a client cannot read or write a row whose watch_key differs from the one
-- it presented.
create policy "watchlists select own key"
  on public.watchlists for select
  using (watch_key::text = current_setting('request.headers', true)::json->>'x-watch-key');

create policy "watchlists insert own key"
  on public.watchlists for insert
  with check (watch_key::text = current_setting('request.headers', true)::json->>'x-watch-key');

create policy "watchlists delete own key"
  on public.watchlists for delete
  using (watch_key::text = current_setting('request.headers', true)::json->>'x-watch-key');

-- No update policy: watchlists are add/remove only.
