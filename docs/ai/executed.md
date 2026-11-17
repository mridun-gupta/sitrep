# EXECUTED (agent-facing) — shipped-state record

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Prose version: `docs/technical/executed.md`.

```yaml
as_of: 2026-10-19
verified_against: standalone production build + live upstream probes

shipped:
  api_routes: 10 + openapi.json + /mcp + /api/cron/ingest
  mcp_tools: 7
  keyless_sources_ok: [usgs, eonet, gdacs, nws, adsb, swpc, ioda, who, rss, markets]
  degraded_by_design: [gdelt]   # upstream 429s; system degrades gracefully
  keyed_unpolled: [newsapi, acled, reliefweb, firms]   # no envs set in test

live_counts_2026-10-19:
  events: 341        # incl. 129 military tracks, 80 NWS alerts, 125 GDACS
  ioda_outages: 17   swpc_alerts: 12   who_outbreak_items: 20
  news_wire: 112     markets: 3

fixes_landed_this_cycle:
  - maplibre worker vendored (Turbopack couldn't resolve module-worker URL)
  - CSP: bare basemaps.cartocdn.com added beside wildcard
  - nws: dropped unsupported `limit` param (400 → 200)
  - brief: shared getBrief() cache stops per-request LLM spend
  - brief: headline constrained to <72h events; WHO items >120d filtered
  - ticker: duration = measured width @ ~55px/s (was fixed 90s ≈ 330px/s)
  - tension: event-derived fallback when GDELT 429s (tone field absent = derived)

rejected_inputs:
  liveuamap_rss: 403 Cloudflare-gated — not integratable per vetting policy
  who_don_feed: endpoint decommissioned upstream (404)

open_limitations:
  - in-memory rate limiting is per-instance (edge WAF recommended at scale)
  - braces dev-dep advisory (GHSA-vfj7-8cjw-p6xm) — no upstream patch; dev-chain only
  - /api/v1/sources health is per-worker state on serverless
```
