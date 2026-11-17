# Executed — implementation record

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

What is actually built and verified — the ground truth against the PRD/TRD.
If a claim here drifts from the code, the code wins; fix the doc.

## Shipped

| Area | State | Where |
|------|-------|-------|
| Console UI (map, panels, ticker, brief, watchlist, source drawer) | ✅ live | `src/components/` |
| Versioned REST API, 10 routes + OpenAPI | ✅ live, rate-limited | `src/app/api/v1/` |
| MCP server — 7 `sitrep_*` tools over SSE | ✅ live | `src/app/mcp/route.ts` |
| Deterministic brief + optional OpenAI-compatible LLM | ✅ `mode` field reports which | `src/lib/ai/brief.ts` |
| Source health tracking + capability flags | ✅ live | `registry.ts`, `/api/v1/sources` |
| Cross-source hotspot correlation | ✅ live | `correlate.ts` |
| Event-derived tension fallback (GDELT-independent) | ✅ live | `aggregator.ts: deriveSignals` |
| Optional Supabase persistence (RLS on all tables) | ✅ code paths; disabled w/o envs | `src/lib/repo/` |
| Docker / Render / bare-metal self-host | ✅ | `Dockerfile`, `render.yaml` |
| CI + weekly security workflows | ✅ | `.github/workflows/` |

## Source catalog (as verified 2026-10-19)

| Source | Kind | Signal | Live check |
|--------|------|--------|-----------|
| GDELT DOC 2 | keyless | news + tone signals | ok (rate-limited; falls back) |
| USGS | keyless | earthquakes | ok — 24 items |
| NASA EONET | keyless | natural events | ok — 60 items |
| GDACS | keyless | disaster alerts | ok — 125 items |
| NWS | keyless | US severe-weather alerts | ok — 80 items |
| adsb.lol `/v2/mil` | keyless | military aircraft tracks | ok — 129 items |
| NOAA SWPC | keyless | space-weather watches/warnings | ok — 12 items |
| IODA (Georgia Tech) | keyless | country internet outages | ok — 17 items |
| WHO news feed | keyless | outbreak notices (gazetteer-geocoded) | ok — 20 items |
| RSS wires (10 feeds) | keyless | merged news wire incl. WHO + CISA | ok — 112 items |
| CoinGecko + stooq | keyless | markets | ok |
| NewsAPI | keyed | headline aggregation | unpolled (no key) |
| ACLED | keyed | conflict events | unpolled (no key) |
| ReliefWeb v2 | keyed | UN OCHA reports | unpolled (v1 decommissioned upstream; v2 needs `RELIEFWEB_APPNAME`) |
| NASA FIRMS | keyed | VIIRS wildfire pixels | unpolled (needs `FIRMS_KEY`) |

## Verified incidents & fixes (audit trail)

- **MapLibre worker 404/blank map** — Turbopack emitted an unresolvable module-worker URL → worker vendored (`public/vendor/maplibre-worker.js`, synced by `prebuild`), pinned with `setWorkerUrl`. Verified by `scripts/smoke-map.mjs` (98 layers, 0 console errors).
- **CSP gap** — `*.basemaps.cartocdn.com` didn't cover the bare host; both now listed.
- **NWS 400** — `limit` is not an NWS param; removed, capped client-side.
- **Brief cost hole** — unauthenticated `sitrep_brief` could hit a paid LLM per call → shared `getBrief()` cache.
- **WHO stale headline** — feed carries evergreen items; 120-day recency filter + brief headline restricted to < 72 h events.
- **Per-instance module state** — `/api/v1/sources` polls sources itself; health is per-worker (documented).
- **GDELT flakiness** — event-derived tension signals added; derived points omit `tone` to mark provenance.

## Deliberately not built

- No user accounts; watchlist is UUID-keyed (browser-local without Supabase).
- No synthetic/test signals — empty is a valid state (e.g. NWS on a quiet night).
- No LiveUAmap feed — 403/Cloudflare-gated at integration time; rejected by the vetting skill.
