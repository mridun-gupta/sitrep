# TRD (agent-facing) — technical contract

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Full engineering spec: `docs/technical/trd.md`.

```yaml
response_envelope:               # every /api/v1 response
  data: <T>
  meta: { generatedAt: ISO8601, count: int, cached: bool, version: string }

validation:
  query_params: zod (src/lib/params.ts) — invalid → 400
  enums: closed; unknown category/severity rejected, not coerced

limits:
  events.limit: 1..500 (default 100)
  news.limit: 1..300 (default 80)
  hours: 1..168 (default 48)
  rate: 60/min per route, 20/min on /api/v1/brief; Retry-After on 429

mcp:
  transport: Streamable HTTP + SSE (mcp-handler)
  init_header: 'Accept: application/json, text/event-stream'
  server_info: { name: sitrep, version: "0.1.0" }
  tools: [sitrep_events, sitrep_news, sitrep_earthquakes, sitrep_hotspots,
          sitrep_signals, sitrep_markets, sitrep_brief]   # read-only
  rate_limit: 60/min

caching:
  events: 3m   news: 5m   signals: 15m   markets: 1m   brief: 10m (stale 40m)
  note: per-instance memory; serverless replicas may diverge

signals_provenance:
  tone_present: GDELT-measured sentiment tension
  tone_absent: event-derived fallback (severity×category weighting)

timeouts: { upstream: 15-25s per source, size_cap: 4MB, aborts are isolated }

failure_contract:
  upstream_down: slice empties; GET /api/v1/sources shows status+error
  no_supabase: watchlist route → 503; UI falls back to localStorage
  no_ai_envs: /api/v1/brief → 200, mode=deterministic
```
