# Product Requirements Document (PRD) — Sitrep

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> **Status:** v0.1.0 shipped · **License:** AGPL-3.0-only

## 1. Purpose

Sitrep is an open-source global situation-awareness console. It aggregates
*real* signals from public OSINT feeds — earthquakes, disaster alerts, military
aircraft tracks, internet outages, space-weather warnings, outbreak notices,
news wires and markets — into one operational picture, with a versioned public
API and an MCP server so AI agents can consume the same picture.

## 2. Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Zero-config deploy | `npm run build && npm start` works with no env vars |
| G2 | Only real signals | Every item traces to an upstream URL + timestamp; nothing synthesized as fact |
| G3 | Graceful degradation | Any single upstream failure degrades its slice; the dashboard never 500s on upstream error |
| G4 | Agent-accessible | Public REST API (versioned) + MCP tools, rate-limited |
| G5 | Explainable | Severity/category derived by visible rules in `scoring.ts`, not hidden ML |

## 3. Non-goals

- Not a prediction engine — no forecasting, no scoring beyond published rules.
- No AI-generated facts. LLMs may *summarize* (`/api/v1/brief`) but never
  *produce* signal items.
- No paywalled, scraped, or license-restricted sources.
- No per-user accounts in v0.1 (watchlist is keyed by a client-generated UUID).

## 4. Users

- **Operators / analysts** — watch the console, read the brief, verify against sources.
- **Developers** — consume `/api/v1/*` or self-host a fork.
- **AI agents** — use the 7 `sitrep_*` MCP tools.

## 5. Functional requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| F1 | Event map with category colors + severity sizing | `smoke-map.mjs` |
| F2 | Tension heat layer (GDELT tone, event-derived fallback) | `/api/v1/signals` non-empty when any event source is up |
| F3 | Hotspot rings when ≥2 independent sources converge | `/api/v1/hotspots` |
| F4 | Merged news wire with topic filters | `/api/v1/news` |
| F5 | Source health + capability discovery | `/api/v1/sources` |
| F6 | Situation brief — deterministic always, LLM when `AI_*` set | `/api/v1/brief` reports `mode` |
| F7 | Optional keyed upgrades (NewsAPI, ACLED, ReliefWeb, FIRMS) | unpolled without envs |
| F8 | MCP server, SSE transport, 7 read-only tools | `POST /mcp` initialize handshake |
| F9 | Browser-mode watchlist; Supabase sync when configured | `/api/v1/watchlist` 503 w/o persistence |

## 6. Data-source requirements

Every source must be: structured (JSON/XML/CSV), public or free-keyed,
attributed (`sourceLabel` + homepage), and wrapped in `runSource()` so failures
surface in `/api/v1/sources`. Current catalog — see `data-sources.md`.

## 7. Constraints

- AGPL-3.0 — network use counts as distribution; forks must share source.
- GDELT rate-limits aggressively → shared cache key + event-derived signal fallback.
- Per-instance in-memory rate limiting; heavy traffic needs an edge WAF.
- No persistence without Supabase envs (by design — see `executed.md`).
