---
name: osint-source-vetting
description: Evaluate and integrate a new data source into Sitrep — reliability, licensing, rate limits, normalization contract, health tracking, and docs updates. Use before adding any upstream feed.
---

# OSINT Source Vetting — Sitrep

A source is only as trustworthy as its integration. Follow this checklist before adding anything to `src/lib/sources/`.

## 1. Source evaluation (do this first)

| Question | Pass bar |
|---|---|
| Is it genuinely open? | Keyless API, or free self-serve key. Paid tiers may be optional-only. |
| Terms of use? | Redistribution/commercial use allowed, or factual-data (non-copyrightable) feeds. Note attribution requirements. |
| Rate limits? | Documented or observed; our default 3–15min TTL cache must respect it. GDELT = 1 req/5s — treat as the floor model. |
| Reliability? | HTTPS, reasonable uptime history, stable schema. If flaky, it still fits — health tracking reports degradation — but it must not be load-bearing for core UI. |
| Data quality? | Structured fields (GeoJSON/JSON/CSV/XML). Scraping HTML is out of scope — brittle and often violates ToS. |

## 2. Integration contract

Create `src/lib/sources/<id>.ts` exporting `fetch<Name>()`:

```ts
// 1. Build the URL from CONSTANTS only — no request input in upstream URLs.
// 2. fetchJson/fetchText from './http' — never raw fetch (enforces timeout + size cap + UA).
// 3. Normalize to SitrepEvent[] or NewsItem[] — see src/lib/types.ts.
// 4. stableId([source, naturalKey]) for deterministic dedupe ids.
// 5. severity via scoring.ts helpers, NOT ad-hoc — keeps the scale explainable.
// 6. location via gazetteer extractPlaces() when the source lacks coords.
// 7. Throw on total failure; runSource() catches and records health.
```

Then:
- Add a `SourceDef` row to `SOURCE_REGISTRY` in `registry.ts` (id, label, url, `kind: 'keyless' | 'keyed'`, one-line description).
- Wire into `aggregator.ts` inside the matching `get*` fan-out, wrapped in `runSource('<id>', …)` and gated on `env.<KEY>` if keyed.
- Env var? Add to `env.ts` zod schema + `.env.example` with a comment on where to get the key.

## 3. Verification

- `npm run typecheck`, `npm test`, `npm run build` green.
- `GET /api/v1/sources` shows the source with `status: ok` and `items > 0` after one poll.
- Wrong/missing key path verified: unset the env → source disappears from results but registry entry remains `keyed`.

## 4. Docs updates (mandatory)

- `docs/technical/data-sources.md` — add a row: source, coverage, auth, rate limit, license note.
- `docs/ai/api-contracts.md` — if the source adds fields/endpoints.
- `llms.txt` — update the source list.
- If the source has attribution requirements, add them to README "Data & attribution".

## Disqualification criteria

Auto-reject sources that: require scraping logged-in pages, redistribute paywalled content, have no stable machine-readable feed, or whose ToS forbids aggregation dashboards.
