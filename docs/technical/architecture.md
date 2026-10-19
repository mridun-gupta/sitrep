# Architecture

```
┌─ Browser (console UI) ─┐      ┌─ AI agents (MCP clients) ─┐
│  React 19 client comps │      │  Claude · Cursor · etc.   │
│  MapLibre GL · polls   │      └───────────┬───────────────┘
└──────────┬─────────────┘                  │
           │ /api/v1/* (GET)                │ POST /mcp
┌──────────▼─────────────┐      ┌───────────▼───────────────┐
│  Next.js 16 route      │      │  mcp-handler → same lib   │
│  handlers (validate →  │      │  tools                    │
│  aggregate → envelope) │      └───────────┬───────────────┘
└──────────┬─────────────┘                  │
           │                                │
┌──────────▼────────────────────────────────▼───┐
│  Aggregation layer (src/lib/sources/)          │
│  ├─ aggregator.ts  parallel fan-out, TTL cache │
│  ├─ registry.ts    per-source health + catalog │
│  ├─ http.ts        timeout/UA/size-cap guard   │
│  └─ <source>.ts    fetch → normalize → types   │
├────────────────────────────────────────────────┤
│  Domain logic:                                 │
│  correlate.ts  cross-source convergence cells  │
│  scoring.ts    keyword → category/severity     │
│  gazetteer.ts  toponym → lat/lon               │
│  ai/brief.ts   LLM brief + deterministic       │
├────────────────────────────────────────────────┤
│  Optional persistence (Supabase):              │
│  events_cache · ingest_runs · watchlists (RLS) │
└────────────────────────────────────────────────┘
           │ HTTPS
┌──────────▼────────────────────────────────────┐
│ Upstreams: GDELT DOC · USGS · NASA EONET ·    │
│ GDACS · RSS wires · CoinGecko/stooq ·         │
│ (keyed) ACLED · NewsAPI · ReliefWeb           │
└───────────────────────────────────────────────┘
```

## Design decisions worth knowing

**Zero-config-first.** Every keyed integration is optional and feature-gated
on env vars (`src/lib/env.ts`, zod-validated at boot). A keyless deployment
serves the full dashboard + API; Supabase adds persistence, AI_* adds LLM
briefs, source keys add feeds.

**Health over failure.** `runSource()` isolates every upstream: a dead source
degrades its slice and surfaces on `/api/v1/sources`, never 500s a read.
In practice GDELT rate-limits aggressively — the gazetteer + GDACS/USGS/EONET
keep the map populated regardless.

**Per-instance caches are honest caches.** In-memory TTL maps live in
`src/lib/cache.ts`. On Vercel each warm lambda reuses them; on a single
Docker/self-host process they're a real cache. `Cache-Control` headers give a
second, CDN-level layer. The Supabase `events_cache` table is the third layer
for deployments that run the cron.

**Determinism.** Event ids are content hashes (`stableId`) — the same upstream
item always maps to the same id, so clients can diff polls and `upsert` is
idempotent.

**Explainable scoring.** Severity/tension/hotspot math is hand-rolled and
inspectable (`scoring.ts`, `correlate.ts`). For an OSINT tool an opaque ML
score you can't justify is worse than a transparent heuristic.

**Route isolation caveat.** Next.js bundles each route independently in
production, so module-level maps (cache, health, rate-limit buckets) are
per-route-instance. `/api/v1/sources` polls sources itself for this reason.
Self-hosted single-process deployments get fully shared state.

## Request lifecycle (e.g. `GET /api/v1/events?category=conflict`)

1. `limited(req)` — in-memory sliding-window rate check.
2. `parseQuery(EventsQuery, req.url)` — zod validation; 400 on bad input.
3. `getEvents()` — TTL cache hit or parallel source fan-out via `runSource`.
4. Filter (category/severity/hours), slice to `limit`, wrap in envelope.
5. `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

## Where things live

| Path | What |
|---|---|
| `src/lib/types.ts` | Domain types (`SitrepEvent`, `NewsItem`, …) |
| `src/lib/sources/` | One module per upstream + registry + aggregator |
| `src/lib/sources/gazetteer.ts` | Curated toponym index (~150 places + country centroids) |
| `src/lib/correlate.ts` `scoring.ts` | Convergence + severity logic |
| `src/lib/db/` | Supabase clients + repository (all optional-gated) |
| `src/app/api/v1/` | Public REST routes |
| `src/app/mcp/route.ts` | MCP tool server |
| `src/components/` | Console UI (map, panels, drawer, ticker) |
| `supabase/migrations/` | Schema + RLS policies |
| `.devin/skills/` | Project skills (security-audit, osint-source-vetting, knowledge-base) |
