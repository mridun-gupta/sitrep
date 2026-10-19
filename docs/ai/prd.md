# PRD (agent-facing) — Sitrep product contract

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Canonical prose PRD: `docs/technical/prd.md`. This file is the machine-usable summary.

```yaml
product: sitrep
version: "0.1.0"
license: AGPL-3.0-only
purpose: >-
  Aggregate real, attributable OSINT signals (events, news, tension,
  hotspots, markets) into one picture; expose the same picture over
  REST and MCP to humans and agents.

guarantees:
  - every item has source, sourceLabel, and a source URL when upstream provides one
  - timestamps are upstream-derived; "generated" fields are real generation times
  - AI never fabricates items — briefs are marked mode: ai | deterministic
  - any single upstream failure degrades its slice only (see /api/v1/sources)

non_goals:
  - prediction/forecasting
  - AI-generated events or synthetic map points
  - paywalled or scraped sources

surfaces:
  rest: GET /api/v1/{events,news,earthquakes,hotspots,signals,markets,sources,brief,openapi.json}
  mutations: GET/POST/DELETE /api/v1/watchlist (UUID X-Watch-Key; 503 without Supabase)
  mcp: POST /mcp  (tools: sitrep_{events,news,earthquakes,hotspots,signals,markets,brief})

enums:
  category: [conflict, disaster, humanitarian, political, economic, cyber, infrastructure, environment, military, health]
  severity: [info, low, medium, high, critical]   # ordered
  source_status: [ok, degraded, down]             # + unpolled (no health record)

keyless_sources: [gdelt, usgs, eonet, gdacs, nws, adsb, swpc, ioda, who, rss, markets]
keyed_sources:
  newsapi: NEWSAPI_KEY
  acled: ACLED_KEY + ACLED_EMAIL
  reliefweb: RELIEFWEB_APPNAME
  firms: FIRMS_KEY
ai_brief_env: [AI_BASE_URL, AI_MODEL, AI_API_KEY(optional)]
```
