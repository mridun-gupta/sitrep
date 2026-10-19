# Development

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


## Prerequisites

- Node.js ≥ 20 (repo pins `.nvmrc`)
- npm

## Commands

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest unit tests (tests/)
node .next/standalone/server.js  # serve prod build standalone — but copy
                                 # .next/static + public/ into it first
                                 # (same steps the Dockerfile does)
node scripts/smoke-map.mjs       # headless-Chrome smoke test (needs prod
                                 # server on :3100, system Chrome installed)
```

`predev`/`prebuild` run `scripts/sync-worker.mjs` — copies the installed
maplibre worker to `public/vendor/maplibre-worker.js`. If the map renders
blank, run `smoke-map.mjs` — it reports canvas presence, style load state,
layer count, and every console/CSP error.

## Conventions

- **Types first**: anything crossing a boundary is in `src/lib/types.ts`.
- **Sources** follow the contract in
  `.devin/skills/osint-source-vetting/SKILL.md`.
- **Severity/category** logic lives only in `src/lib/scoring.ts` — tune
  keyword lists there, never inline.
- **Docs discipline**: `.devin/skills/knowledge-base/SKILL.md` — user-facing
  changes update the four doc sets.
- **Style**: the UI is "operations console" — dark, hairline borders,
  IBM Plex Sans/Mono, one amber accent (`--color-accent`). Density > novelty;
  no decorative motion. See `src/app/globals.css` tokens.
- Commits: conventional (`feat:`, `fix:`, `chore:`, `docs:` …) per the
  history style.

## Testing approach

`tests/unit.test.ts` covers the pure logic (scoring, correlation, gazetteer,
cache, geo). Source modules are integration surfaces — they're verified via
`/api/v1/sources` health on a running instance rather than mocked unit tests;
mocking upstream contracts lies to you.

## Debugging a source

```bash
# watch the health endpoint while you iterate
curl -s localhost:3000/api/v1/sources | jq '.data.sources[] | {id, health: .health.status}'
```

`runSource()` captures latency, item counts and the first 200 chars of any
error — check `error` before reaching for a debugger.

## Repo layout

See [architecture.md](architecture.md#where-things-live).
