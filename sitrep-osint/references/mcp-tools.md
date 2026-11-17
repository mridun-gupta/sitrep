# Sitrep MCP tools — full contract

Server: `POST https://sitrep-lime.vercel.app/mcp` (Streamable HTTP + SSE,
stateless). Initialize requires
`Accept: application/json, text/event-stream`.
`serverInfo: {name: "sitrep", version: "0.1.0"}` — protocol `2025-03-26`.
Rate limit ~60 req/min per deployment instance; 429 carries `Retry-After`.

All tools are `readOnlyHint: true` and return JSON strings in
`content[0].text` — parse it.

## sitrep_events

```
category?   ∈ conflict|disaster|humanitarian|political|economic|cyber|
             infrastructure|environment|military|health
minSeverity? ∈ info|low|medium|high|critical   (default info)
hours?      1..168   (default 48)
limit?      1..200   (default 50)
```

`SitrepEvent`:
```ts
{ id, source, sourceLabel, category, severity, title, summary?, url?,
  location?: {lat, lon, name?, country?}, time: ISO8601, tags: string[],
  metrics?: Record<string,number> }
// metrics examples: {magnitude} usgs · {altitudeFt,speedKt} adsb ·
// {detections,maxFrpMw} firms · {score,durationSec} ioda
```
Locationless advisories (e.g. space weather) have no `location` — don't drop
them silently; surface them in a "global/unlocated" line.

## sitrep_news

```
q?      substring on title+summary, ≤200 chars — supports | alternation
topic?  same enum as category
limit?  1..100 (default 30)
```

`NewsItem`: `{id, source, sourceLabel, title, link, published, summary?, topics[], language?}`

## sitrep_earthquakes

`minMag?` 0–10 (default 4.5) · `limit?` ≤200 (default 50) — USGS subset.

## sitrep_hotspots

`limit?` ≤50 (default 15).

```ts
{id, lat, lon, name?, categories[], sources[], eventCount, score,
 maxSeverity, topTitles[]}
```
`score` scales with source diversity × category diversity × severity volume —
higher means more *independent* corroboration, not just more noise.

## sitrep_signals

`limit?` ≤100 (default 25). `{lat, lon, name, weight, tone?}`.
- `tone` present → GDELT-measured average sentiment (negative = tension).
- `tone` absent → derived from geolocated events (severity×category weighting).

## sitrep_markets

`[{symbol, name, price, change24h?, unit, kind: crypto|index|commodity|fx}]` —
CoinGecko + stooq closes.

## sitrep_brief

`{mode: "ai"|"deterministic", generatedAt, headline, sections[{title,points[]}], sources[{label,url?}]}`.
Shared 10-min cache across the deployment — repeated calls are cheap, don't
debounce them yourself.

## REST mirror

| MCP | REST |
|---|---|
| sitrep_events | `GET /api/v1/events?category=&minSeverity=&hours=&limit=` (≤500) |
| sitrep_news | `GET /api/v1/news?topic=&source=&q=&hours=&limit=` (≤300) |
| sitrep_earthquakes | `GET /api/v1/earthquakes?minMag=&hours=&limit=` |
| sitrep_hotspots | `GET /api/v1/hotspots?limit=` |
| sitrep_signals | `GET /api/v1/signals?limit=` |
| sitrep_markets | `GET /api/v1/markets` |
| sitrep_brief | `GET /api/v1/brief` |
| (no tool) | `GET /api/v1/sources` — health + capabilities |

Response envelope everywhere: `{data, meta{generatedAt,count,cached,version}}`.
Errors: `{data:null, error}` + HTTP status. `openapi.json` is served at
`/api/v1/openapi.json`.
