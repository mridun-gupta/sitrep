# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org).

## Unreleased

### Fixed
- **Blank map (critical):** CSP `connect-src`/`img-src` used
  `*.basemaps.cartocdn.com`, which does not cover the bare
  `basemaps.cartocdn.com` host serving the style JSON — the map never loaded.
  Both bare and wildcard hosts are now listed.
- **Worker failure:** MapLibre v6's module-worker URL resolves unreliably
  under Turbopack production builds. Worker is now vendored at
  `/vendor/maplibre-worker.js` (synced from `node_modules` on predev/prebuild)
  and pinned via `maplibregl.setWorkerUrl`.
- Hydration mismatch (React #418) from the SSR-rendered UTC clock — `useNow`
  now returns `null` until mounted.
- News ticker scroll speed — duration is now measured from real strip width
  (~55 px/s) instead of a fixed 90s regardless of content length.
- Empty-state overlay when the basemap itself fails to load (previously
  rendered as a silent void).

### Added
- Tension-index fallback: when GDELT is unavailable, signals are derived
  from the geolocated event mix (severity × category weighting). Derived
  points omit `tone` to mark provenance.
- `scripts/smoke-map.mjs` — headless-Chrome smoke test for the rendered page
  (map canvas, style load, layers, console errors, API reachability).
- `/mcp` and `/api/v1/openapi.json` rate limiting; shared `getBrief()` cache
  so REST/MCP/page consumers share one LLM generation (10 min).

## 0.1.0 — Initial public release

### Added

- Live intelligence dashboard: MapLibre map with clustered geolocated events,
  category/severity symbology, tension heat layer and convergence-hotspot rings.
- Keyless upstream sources: GDELT DOC 2 (news + tone), USGS earthquakes,
  NASA EONET natural events, GDACS disaster alerts, curated international RSS
  wire, CoinGecko/stooq markets — all zero-config with graceful degradation.
- Optional env-gated sources: NewsAPI, ACLED, ReliefWeb (approved appname).
- Cross-source correlation engine producing `hotspots` (multi-source
  convergence cells) and a `tension` index from GDELT tone.
- Situation brief (`/api/v1/brief`): OpenAI-compatible LLM digest with
  transparent deterministic fallback (badge: `model` | `deterministic`).
- Versioned public API (`/api/v1/*`) with zod-validated params, per-IP rate
  limiting, cache headers, and an OpenAPI 3.1 spec at `/api/v1/openapi.json`.
- MCP server at `/mcp` exposing `sitrep_events`, `sitrep_news`,
  `sitrep_earthquakes`, `sitrep_hotspots`, `sitrep_signals`, `sitrep_markets`,
  `sitrep_brief` tools.
- Watchlists: `X-Watch-Key` UUID + Postgres RLS on Supabase, with in-memory
  fallback.
- Source registry + `/api/v1/sources` health endpoint (live/degraded/down,
  latency, item counts, capabilities).
- `/api/cron/ingest` Bearer-protected persistence sweep into `events_cache`.
- Supabase migrations (RLS-enabled `events_cache`, `ingest_runs`, `watchlists`).
- Four-tier knowledge base: `docs/ai`, `docs/technical`, `docs/non-technical`,
  `docs/layman`, plus `llms.txt`.
- Repo skills under `.devin/skills/`: `security-audit`, `osint-source-vetting`,
  `knowledge-base`.
- Deployment targets: Vercel (with cron), Docker (`Dockerfile`, compose),
  Railway/Render (`render.yaml`), standalone Node (`output: "standalone"`).
- CI: typecheck/lint/test/build workflow, weekly `npm audit` + secret-scan
  workflow, Dependabot, issue/PR templates.

### Security

- CSP + security headers; GET-only public API; no user input reaches upstream
  URLs; HTML stripped from feed bodies; map popups use `textContent`.
