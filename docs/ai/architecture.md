# Architecture (agent-facing) — component map

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Full narrative: `docs/technical/architecture.md`.

```
request → next.config.ts (CSP/headers) → route (limited() → parseQuery() → aggregator)
                                        ↓
                          runSource(id, fn) ── per-source health + isolation
                                        ↓
                 sources/*.ts: fetchJson/Text → normalize → stableId → types
                                        ↓
          correlate.ts (hotspots) · deriveSignals (tension fallback) · brief.ts
                                        ↓
                          cache.ts (TTL + SWR + dedupe)
                                        ↓
              ApiResponse<T> envelope → client / MCP / REST consumer
```

## Module index

| Path | Role |
|------|------|
| `src/lib/types.ts` | domain types + closed enums |
| `src/lib/params.ts` | zod query schemas |
| `src/lib/cache.ts` | TTL + stale-while-revalidate, ≤500 entries |
| `src/lib/geo.ts` | haversine, cellKey, stableId, stripHtml |
| `src/lib/scoring.ts` | keyword→category, trigger→severity, tone→tension |
| `src/lib/correlate.ts` | convergence cells → Hotspot[] |
| `src/lib/sources/registry.ts` | SOURCE_REGISTRY + runSource + health |
| `src/lib/sources/aggregator.ts` | parallel fan-out, merged views, deriveSignals |
| `src/lib/sources/gazetteer.ts` | ~150 places + country centroids; `countryCentroid()` |
| `src/lib/sources/{usgs,eonet,gdacs,nws,adsb,swpc,ioda,who,rss,markets,gdelt,newsapi,acled,reliefweb,firms}.ts` | one module per upstream |
| `src/lib/ai/brief.ts` | LLM brief (zod-validated) + deterministic fallback + getBrief cache |
| `src/app/api/v1/*` | versioned REST routes |
| `src/app/mcp/route.ts` | MCP server (mcp-handler) |
| `src/components/GlobalMap.tsx` | MapLibre; vendored worker; basemap-failure notice |

## Data flow invariants

- No user input reaches an upstream URL (constants/allowlists only).
- `tone` present ⇒ GDELT-measured; absent ⇒ event-derived.
- `mode: ai` only when `AI_BASE_URL`+`AI_MODEL` set AND output passed zod.
- Map worker is a vendored static file — survives bundler worker-URL bugs.
