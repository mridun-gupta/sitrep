# API Contracts

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

`GET /api/v1/*` — JSON, CORS `*`, no auth for reads. All responses share the
envelope:

```json
{
  "data": <T>,
  "meta": { "generatedAt": "ISO-8601", "count": 0, "cached": false, "version": "v1" }
}
```

Errors: `{ "data": null, "error": "message", "meta": {…} }` with an HTTP status.
Machine-readable spec: `GET /api/v1/openapi.json` (OpenAPI 3.1).

## Endpoints

### `GET /events`
Geolocated events, newest first (locationless advisories e.g. space weather
still appear — they have no `location` field).
Params: `category` ∈ `conflict|disaster|humanitarian|political|economic|cyber|infrastructure|environment|military|health`, `minSeverity` ∈ `info|low|medium|high|critical` (default `info`), `hours` 1–168 (default 48), `limit` ≤500 (default 100).

`SitrepEvent`:
```ts
{ id, source, sourceLabel, category, severity, title, summary?, url?,
  location?: { lat, lon, name?, country? }, time: ISO, tags: string[],
  metrics?: Record<string,number> }  // e.g. {magnitude}, {fatalities}, {tone},
                                    //      {altitudeFt,speedKt}, {detections,maxFrpMw},
                                    //      {score,durationSec}
```

### `GET /news`
Merged wire (RSS feeds + GDELT + NewsAPI when keyed).
Params: `topic` (category), `source` (feed id or label), `q` (substring match on title+summary), `hours`, `limit` ≤300 (default 80).

### `GET /earthquakes`
USGS subset of events. Params: `minMag` (0–10), `hours`, `limit`.

### `GET /hotspots`
Cross-source convergence cells. Params: `limit` ≤50.
Each entry: `{id, lat, lon, name?, categories[], sources[], eventCount, score, maxSeverity, topTitles[]}`.
`score` = severity-weighted volume × source-diversity × category-diversity (see `src/lib/correlate.ts`).

### `GET /signals`
Tension localities — negative-toned news density per place. Params: `limit` ≤100.
`{lat, lon, name, weight, tone?}` — `weight` is tone-modulated article count.
Fallback: when GDELT is unavailable, signals are derived from the geolocated
event mix (severity × category boost, weighted centroid per ~2.5° cell).
Derived points have no `tone` field — that absence marks the provenance.

### `GET /markets`
`[{symbol, name, price, change24h?, unit, kind: crypto|index|commodity|fx}]`.

### `GET /sources`
Source catalog + live health + deployment capabilities:
```json
{ "sources": [{ "id","label","url","kind","description","health": {"status","latencyMs","items","error?","checkedAt"}|null }],
  "capabilities": { "supabase": bool, "aiBriefs": bool } }
```
Note: health is observed by the serving worker; per-instance on serverless.

### `GET /brief`
Current situation brief. Rate limit 20/min. `{mode, generatedAt, headline, sections[{title,points[]}], sources[]}`.
`mode=ai` requires deployment `AI_*` envs; otherwise `deterministic`.

### `GET|POST|DELETE /watchlist`
User watchlists. All verbs require header `X-Watch-Key: <uuid>` and a
Supabase-configured deployment (returns `503` otherwise — clients should
fall back to local storage).
- `GET` → `[{label, query, created_at}]`
- `POST` `{label, query}` → 201
- `DELETE ?query=<exact>` → 200

### `GET /api/cron/ingest`
`Authorization: Bearer $CRON_SECRET`. Triggers source sweep + persistence.
Returns `{eventsFetched, newsFetched, upserted, cache}`.

## Conventions

- Timestamps are ISO-8601 UTC. Distances km. `lat/lon` WGS-84.
- `id` fields are deterministic hashes — safe for dedupe keys across polls.
- Severity ordering: `info < low < medium < high < critical`.
- Missing upstream data degrades to partial results + health entries, never
  to fabricated values.
