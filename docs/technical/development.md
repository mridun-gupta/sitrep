# Development

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
node .next/standalone/server.js  # serve prod build standalone
```

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
