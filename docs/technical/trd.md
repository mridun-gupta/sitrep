# Technical Requirements Document (TRD) — Sitrep

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

## 1. Stack contract

| Layer | Choice | Locked version |
|-------|--------|----------------|
| Runtime | Node.js ≥ 20 | `.nvmrc` pins the dev line |
| Framework | Next.js (App Router, Turbopack) | 16.4.2 |
| UI | React 19, Tailwind CSS 4 | `@theme` tokens in `globals.css` |
| Map | MapLibre GL 6.15 | worker vendored at `/vendor/maplibre-worker.js` |
| Validation | zod | every public query param |
| Persistence | `@supabase/supabase-js` | optional |
| Agent iface | `mcp-handler` + `@modelcontextprotocol/sdk` | SSE + Streamable HTTP |

## 2. System requirements

- **Build:** `npm run build` (runs `prebuild` → worker sync, then `next build`).
- **Serve:** `node .next/standalone/server.js` (standalone output) or `next start` in dev layouts.
- **Cold-start budget:** page first-paint must not block on any single upstream — all sources run inside `runSource()` with per-call timeouts (default 15 s) and a 4 MB response cap (`http.ts`).
- **Caching:** process-local TTL + stale-while-revalidate (`cache.ts`), 500-entry cap, request de-duplication. TTLs per view in `aggregator.ts`.

## 3. Interface contracts

- All `/api/v1/*` responses use the `ApiResponse<T>` envelope `{data, meta{generatedAt, count, cached, version}}`.
- Query validation through `parseQuery()` + zod schemas in `params.ts`; invalid input → `400`.
- Event categories (closed enum): `conflict, disaster, humanitarian, political, economic, cyber, infrastructure, environment, military, health`.
- Severities (ordered): `info < low < medium < high < critical`.
- MCP tools are read-only `sitrep_*`; transport requires `Accept: text/event-stream` on initialize.

## 4. Security requirements

- Upstream URLs are module constants or allowlists — **never** built from request input.
- `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` are server-only; only `NEXT_PUBLIC_*` reach the client.
- RLS enabled on every Supabase table (`supabase/migrations/`).
- Rate limits on every public route including `/mcp` and `openapi.json`; `/api/v1/brief` is tighter (20/min) because it can invoke a paid LLM — briefs are additionally deduped through the shared `getBrief()` cache (10 m fresh / 40 m stale).
- CSP allowlist in `next.config.ts` — every basemap/worker host named explicitly (bare + wildcard where both are used).

## 5. Source-adapter contract

Each module in `src/lib/sources/`:

1. Fetches through `fetchJson`/`fetchText` only (uniform UA, timeout, size cap).
2. Normalizes to `SitrepEvent[]` / `NewsItem[]` / `SignalPoint[]` with `stableId([...naturalKey])`.
3. Maps upstream severity via helpers in `scoring.ts`; geolocates via `extractPlaces`/`countryCentroid` when the feed lacks coordinates.
4. Throws on total failure so `runSource()` records `down`/`degraded`.
5. Registers in `SOURCE_REGISTRY` (`kind: keyless|keyed`); keyed modules gate on validated `env`.

## 6. Performance budgets

| Surface | Budget |
|---------|--------|
| `/api/v1/*` warm | < 150 ms |
| Events payload | ≤ 500 items, single aggregate call upstream |
| Ticker | ~55 px/s, measured width, `prefers-reduced-motion` stills it |
| Map init | worker + style < 3 s on broadband; explicit notice on basemap failure |

## 7. Failure modes (required behavior)

| Failure | Behavior |
|---------|----------|
| GDELT 429/down | news/events lose GDELT slice; signals fall back to event-derived tension |
| Basemap unreachable | "BASEMAP UNAVAILABLE" overlay; data layers unaffected |
| AI provider down | brief returns `mode: 'deterministic'` |
| No Supabase | watchlist = localStorage; `/api/v1/watchlist` → 503 documented |
| All upstreams down | dashboard renders empty-state panels; `/api/v1/sources` shows `down` |
