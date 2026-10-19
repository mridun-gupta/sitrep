# Sitrep — AI Agent Guide

Machine-oriented documentation for LLMs and autonomous agents using Sitrep.
Precise contracts live in [api-contracts.md](api-contracts.md) and [mcp.md](mcp.md).

## What Sitrep is

A read-only global intelligence aggregator. It normalizes geolocated events
(conflicts, disasters, humanitarian alerts, infrastructure signals), merges a
news wire, derives tension signals and cross-source hotspots, and produces a
situation brief — all queryable over HTTP or MCP.

**Orientation rule:** Sitrep answers "what is happening *where* right now" at
the level of a watch-floor dashboard. It is a lead generator and situational
layer, not a verified-fact database. Cite `url` fields; never present Sitrep
aggregations as independently verified claims.

## Access paths

| Path | For | Entry |
|---|---|---|
| REST API | scripts, embeddings pipelines, agent tools | `GET /api/v1/*` — [api-contracts.md](api-contracts.md) |
| MCP server | Claude/Cursor/other MCP clients | `POST {host}/mcp` — [mcp.md](mcp.md) |
| OpenAPI | codegen / tool-calling scaffolds | `GET /api/v1/openapi.json` |

All reads are unauthenticated, CORS-`*`, GET-only. Writes exist only on
`/api/v1/watchlist` (per-user, header-keyed — see contracts).

## Recommended agent patterns

1. **Triage loop**: `sitrep_brief` → `sitrep_hotspots` → `sitrep_events?category=…` on the hotspots' coordinates → `sitrep_news?q=` for corroboration.
2. **Monitoring diff**: poll `/api/v1/events?hours=6&minSeverity=medium`, diff on `id` (ids are deterministic — same upstream item = same id).
3. **Region watch**: `sitrep_news`/`sitrep_events` + the built-in place gazetteer. Country mentions resolve to centroids; city mentions resolve precisely.

## Data model in one breath

- `SitrepEvent` — geolocated thing-that-happened: `{id, source, category, severity, title, url, location{lat,lon,name}, time, tags, metrics}`
- `NewsItem` — wire article: `{id, sourceLabel, title, link, published, topics[]}`
- `SignalPoint` — `{lat, lon, name, weight, tone}` negative-coverage density
- `Hotspot` — `{lat, lon, name, categories[], sources[], eventCount, score}` where `score` scales with source diversity
- `SitrepBrief` — `{mode: ai|deterministic, headline, sections[{title,points[]}]}`

## Confidence and honesty

- `severity` is rule-based (keyword/fatigue/alert-level thresholds — see
  `src/lib/scoring.ts`), not a human judgment. Treat `critical` as "worth a
  look", not "confirmed catastrophe".
- `mode: 'deterministic'` in briefs means no LLM ran — the text is a ranked
  aggregation, still accurate to the underlying items.
- Source health is observable: `GET /api/v1/sources` reports per-source
  `ok/degraded/down` with latency and error strings. If `gdelt` is down,
  expect thin news-derived events and stale signals.

## Rate limits

60 req/min/IP for reads, 20/min for `/brief`. Exceeding returns `429` +
`Retry-After`. Bulk polling is rude — cache responses; TTL hints are in
`Cache-Control`.
