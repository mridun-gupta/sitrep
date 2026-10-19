# API Reference

Base: `GET /api/v1`. Full machine-readable spec: `GET /api/v1/openapi.json`.
The normative field-level contract for machines is
[../ai/api-contracts.md](../ai/api-contracts.md) — this page is the human
version with examples.

## Quick examples

```bash
curl 'https://<host>/api/v1/events?category=conflict&minSeverity=medium&hours=24'
curl 'https://<host>/api/v1/news?q=taiwan&limit=20'
curl 'https://<host>/api/v1/earthquakes?minMag=5'
curl 'https://<host>/api/v1/hotspots?limit=10'
curl 'https://<host>/api/v1/brief'
```

## Response envelope

```json
{ "data": …, "meta": { "generatedAt": "…", "count": 12, "cached": true, "version": "v1" } }
```

Errors keep the same envelope with `data: null` plus an `error` string.

## Endpoints

| Route | Params | Returns |
|---|---|---|
| `/events` | `category`, `minSeverity`, `hours` ≤168, `limit` ≤500 | `SitrepEvent[]` |
| `/news` | `topic`, `source`, `q`, `hours`, `limit` ≤300 | `NewsItem[]` |
| `/earthquakes` | `minMag`, `hours`, `limit` | `SitrepEvent[]` |
| `/hotspots` | `limit` ≤50 | convergence cells + `topTitles` |
| `/signals` | `limit` ≤100 | `SignalPoint[]` |
| `/markets` | — | `MarketQuote[]` |
| `/sources` | — | catalog + live health + capabilities |
| `/brief` | — | `SitrepBrief` (rate limit 20/min) |
| `/openapi.json` | — | OpenAPI 3.1 document |
| `/watchlist` | header `X-Watch-Key: uuid`; POST `{label,query}`; DELETE `?query=` | watchlist rows |
| `/api/cron/ingest` | `Authorization: Bearer $CRON_SECRET` | ingest stats |

## Fields

### SitrepEvent
`id` deterministic hash · `source` registry id · `category` one of
`conflict disaster humanitarian political economic cyber infrastructure environment`
· `severity` `info|low|medium|high|critical` · `location.lat/lon` · `time` ISO ·
`metrics` source-specific (`magnitude`, `fatalities`, `tone`, `gdacsSeverity`).

### NewsItem
`id` · `source`/`sourceLabel` · `title` · `link` · `published` ISO ·
`summary` (HTML-stripped) · `topics` (matched categories).

### Hotspot
`score` grows with volume × #independent sources × #categories; a hotspot only
exists when ≥2 sources agree — single-source cells are activity, not
convergence.

## Rate limits & caching

60 req/min/IP (20 for `/brief`). `429` + `Retry-After`. Responses carry
`s-maxage`/`stale-while-revalidate` — respect them; upstreams are free public
APIs and hammering them hurts everyone.

## Versioning

`meta.version` is `v1`. Breaking changes will ship `/api/v2` alongside; v1
won't be silently altered.
