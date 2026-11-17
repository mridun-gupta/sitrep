# Feature Guide

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


## What Sitrep does, and how sure you should be of it

**Merged wire.** Headlines from BBC, Al Jazeera, The Guardian, DW, France24,
NPR, UN News and ReliefWeb updates, merged with GDELT's global article crawl.
Each item keeps its source label — provenance is always visible.

**Geolocated event map.** Earthquakes (USGS), natural events (NASA EONET),
disaster alerts with official severity levels (GDACS), US severe-weather
alerts (NWS), live military aircraft on transponder (adsb.lol), space-weather
watches (NOAA SWPC), country internet outages (IODA), WHO outbreak notices,
and conflict-linked news located via our built-in place index. Optional
sources (ACLED conflict data, NewsAPI, ReliefWeb, NASA FIRMS wildfire
pixels) activate automatically when the deployment has keys.

**Convergence hotspots.** When two or more *independent* sources light up the
same area — e.g. a satellite wildfire plus UN alert plus spike in negative
news — Sitrep marks it. This cross-source agreement is the core OSINT trick:
it's far more reliable than any single feed.

**Tension index.** Where negative-toned coverage concentrates geographically.
Not "danger" — media attention with negative sentiment.

**Situation brief.** A generated digest of what's on the board. With an AI
endpoint configured it's written by a model; without one it's a deterministic
ranked digest (clearly labelled).

**Market radar.** Crypto + headline indices for context — a crisis often
shows up in prices before prose.

**Public data feed & agent access.** Everything on screen is also available
as a free JSON API (`/api/v1/*`, OpenAPI spec included) and as an MCP server
(`/mcp`) so AI assistants can pull live intelligence.

**Watchlists.** Save wire filters (e.g. `red sea|hormuz`) as one-tap chips.
Browser-stored; cloud-synced when the deployment enables the database.

## What Sitrep deliberately does not do

- No paywalled content, no scraped logins — public feeds only.
- No user accounts — nothing to breach, nothing to sell.
- No "AI verdict" on truth. Severity badges are transparent rules you can
  inspect (`src/lib/scoring.ts`); conclusions are yours.
