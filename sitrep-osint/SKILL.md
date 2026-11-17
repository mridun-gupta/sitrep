---
name: sitrep-osint
description: Use when the user asks about current global events, conflicts,
  disasters, military flights, internet outages, disease outbreaks, space
  weather, or wants a situation report or intel brief. Connects to the free
  Sitrep OSINT console via MCP or REST — always cite the upstream source and
  never fabricate events.
summary: Live global OSINT via the Sitrep console — events, hotspots, tension, briefs.
version: 0.1.0
tags: [osint, intelligence, news, geopolitics, monitoring]
keywords: [osint, situation report, global events, conflict tracking, mcp]
use_cases:
  - "What is happening in <region> right now"
  - "Daily intel digest / situation brief"
  - "Conflict or disaster monitoring"
  - "Corroborate a claim with independent public sources"
docs_url: https://github.com/mridun-gupta/sitrep
---

# Sitrep OSINT

Sitrep is a free, open-source situation-awareness console that merges real
public feeds — earthquakes, UN/EU disaster alerts, US weather warnings,
military aircraft on transponder, country internet outages, space-weather
notices, WHO outbreak items, ten international news wires and markets — into
one queryable picture. This skill tells you when and how to use it.

Public instance: `https://sitrep-lime.vercel.app` — no key needed for reads.

## Connect

**MCP (preferred):** add to the agent's MCP config —

```jsonc
{ "mcpServers": { "sitrep": { "url": "https://sitrep-lime.vercel.app/mcp" } } }
```

The server speaks Streamable HTTP + SSE (`Accept: application/json, text/event-stream`
on initialize), is stateless, and exposes 7 read-only `sitrep_*` tools — full
contracts in `references/mcp-tools.md`.

**No MCP?** The same data is available over plain REST `GET`s at
`https://sitrep-lime.vercel.app/api/v1/{events,news,earthquakes,hotspots,signals,markets,sources,brief}`.
Every response is `{data, meta{generatedAt,count,cached,version}}`.

## Tools

| Tool | Params | Returns |
|---|---|---|
| `sitrep_events` | `category?` (conflict·disaster·humanitarian·political·economic·cyber·infrastructure·environment·military·health), `minSeverity?`, `hours?` ≤168, `limit?` ≤200 | `SitrepEvent[]` |
| `sitrep_news` | `q?`, `topic?` (same enum), `limit?` ≤100 | `NewsItem[]` |
| `sitrep_earthquakes` | `minMag?`, `limit?` ≤200 | `SitrepEvent[]` |
| `sitrep_hotspots` | `limit?` ≤50 | convergence cells w/ `sources[]`, `categories[]`, `score`, `topTitles[]` |
| `sitrep_signals` | `limit?` ≤100 | tension points `{lat,lon,name,weight,tone?}` |
| `sitrep_markets` | — | `MarketQuote[]` |
| `sitrep_brief` | — | situation brief `{mode,headline,sections,sources}` |

## Playbook — the triage loop

1. **`sitrep_brief`** first — one call gives headline + activity-by-domain.
2. **`sitrep_hotspots`** — places where ≥2 *independent* sources converge;
   these are the "pay attention" cells.
3. **`sitrep_events`** filtered by category/severity on the interesting cells.
4. **`sitrep_news?q=`** to corroborate with headlines from a second source.
5. Cross-check `sitrep_signals` (tension) and `sitrep_markets` for context.

Region sweep: query events, then filter `location.name`/`country` or compare
`lat/lon` against the region's bounding box; use `q=` on news for the region's
proper nouns.

## Rules that keep this honest

- **Always attribute.** Every item has `source` + `sourceLabel` + usually
  `url`. Cite them — "USGS", "NWS", "GDACS", "WHO" — never present a signal
  as your own finding.
- **`tone` absent ≠ neutral.** A tension point without `tone` was derived
  from the event mix, not measured from news sentiment.
- **`mode` matters.** `brief.mode: "ai"` = an LLM summarized the feed;
  `"deterministic"` = rules did. Say which produced it.
- **Empty is a valid answer.** Zero NWS alerts on a quiet night is the truth,
  not a bug. `unpolled` sources aren't configured — don't report them as down.
- **OSINT is reports, not verified fact.** Severity is rule-based triage.
  Always link the original source before asserting anything as confirmed.
- **Never invent.** No synthetic events, no guessed coordinates, no
  fabricated timestamps. If a source is silent, say so.

## Self-host (heavy use)

The public instance shares its rate limits with everyone. For sustained
collection run your own — zero keys needed:

```bash
git clone https://github.com/mridun-gupta/sitrep && cd sitrep
npm install && npm run dev          # http://localhost:3000/mcp
```

Optional envs unlock ACLED, NewsAPI, ReliefWeb, NASA FIRMS and LLM briefs —
see `docs/technical/configuration.md` in the repo.

## Output shape (default)

```
SITREP — <scope> · generated <ISO> · mode <ai|deterministic>
TOP: <headline>
KEY DEVELOPMENTS  — bullet per event, [severity] title — place (source, age)
WATCH             — convergence hotspots w/ independent-source count
COVERAGE          — 2–3 headlines w/ outlet
CAVEATS           — degraded/unpolled sources, derivation notes
SOURCES           — sourceLabel + url list
```
