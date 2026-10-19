# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org).

## Unreleased

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
