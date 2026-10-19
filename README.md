<!-- ═══════════════════════════ SITREP ═══════════════════════════ -->

<p align="center">
  <img src="src/app/icon.svg" width="72" alt="Sitrep mark" />
</p>

<h1 align="center">SITREP</h1>

<p align="center">
  <b>Open-source global situation awareness.</b><br/>
  Live intelligence console merging free public feeds into a map, wire,
  convergence hotspots, tension index and AI briefs — self-hostable in minutes.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="AGPL-3.0" /></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white" alt="Node ≥20" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome" />
  <a href="/api/v1/openapi.json"><img src="https://img.shields.io/badge/API-OpenAPI%203.1-amber" alt="OpenAPI 3.1" /></a>
</p>

<p align="center">
  <b>Deploy your own:</b>
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/mridun-gupta/sitrep"><img src="https://vercel.com/button" alt="Deploy with Vercel" height="28" /></a>
  <a href="https://railway.com/new/template?template=https://github.com/mridun-gupta/sitrep"><img src="https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway" alt="Deploy on Railway" height="28" /></a>
  <a href="https://render.com/deploy?repo=https://github.com/mridun-gupta/sitrep"><img src="https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black" alt="Deploy to Render" height="28" /></a>
  <a href="Dockerfile"><img src="https://img.shields.io/badge/Docker-self--host-2496ED?logo=docker&logoColor=white" alt="Docker" height="28" /></a>
</p>

<p align="center">
  <b>Live demo → <a href="https://sitrep-lime.vercel.app">sitrep-lime.vercel.app</a></b>
</p>

> Everything works out of the box — no API keys required.

---

## What it does

| Surface | Contents |
|---|---|
| **Event map** | Clustered geolocated events — earthquakes, natural events, disaster alerts, conflict-linked news — colored by category, sized by severity. Tension heat + convergence rings. |
| **Wire** | Merged international news feed (BBC, Al Jazeera, Guardian, DW, France24, NPR, UN News, ReliefWeb + GDELT) with topic filters, keyword watchlists. |
| **Hotspots** | Cells where ≥2 independent sources converge — the cross-source signal that matters. |
| **Tension index** | Where negative-toned global coverage concentrates. |
| **Brief** | Situation digest — LLM-written when configured, transparent deterministic mode otherwise. |
| **Market radar** | Crypto + indices context, refreshed ~minutely. |
| **Public API** | `/api/v1/*` — versioned, rate-limited, OpenAPI-documented. |
| **MCP server** | `/mcp` — plug Sitrep into AI assistants as a live intelligence tool. |
| **Source health** | `/api/v1/sources` + status drawer — every upstream's live state and capabilities. |

Keyless by default: GDELT · USGS · NASA EONET · GDACS · RSS · markets.
Env-gated additions: NewsAPI · ACLED · ReliefWeb · Supabase · LLM endpoint.

## Quick start

```bash
git clone https://github.com/mridun-gupta/sitrep sitrep && cd sitrep
npm ci && npm run dev        # → http://localhost:3000
```

Production:

```bash
npm run build && node .next/standalone/server.js
```

Docker:

```bash
docker build -t sitrep . && docker run -p 3000:3000 sitrep
```

Every env var is optional — see [.env.example](.env.example) and
[docs/technical/configuration.md](docs/technical/configuration.md).

## For AI agents & integrators

- **MCP**: point your client at `https://<host>/mcp` — tools:
  `sitrep_events` `sitrep_news` `sitrep_earthquakes` `sitrep_hotspots` `sitrep_signals` `sitrep_markets` `sitrep_brief`.
- **REST**: `GET /api/v1/events?category=disaster&minSeverity=medium` —
  spec at `/api/v1/openapi.json`.
- Start with [docs/ai/agent-guide.md](docs/ai/agent-guide.md); root
  [llms.txt](llms.txt) is the machine-readable index.

## Documentation

| Audience | Where |
|---|---|
| 🤖 AI / agents | [docs/ai/](docs/ai/) — contracts, MCP tools, agent guide |
| 🛠 Engineers / self-hosters | [docs/technical/](docs/technical/) — architecture, API, deployment, security, Supabase |
| 📊 Analysts / users | [docs/non-technical/](docs/non-technical/) — console guide, features, FAQ |
| 🌍 Everyone | [docs/layman/](docs/layman/) — plain-language intro, map reading, glossary |

Key references: [Architecture](docs/technical/architecture.md) ·
[Deployment](docs/technical/deployment.md) ·
[Data sources](docs/technical/data-sources.md) ·
[Security model](docs/technical/security.md)

## Design

"Operations-room console": dark UI, hairline panels, IBM Plex Sans/Mono,
single signal-amber accent. Density over decoration — no decorative motion.

## Honest limitations

- OSINT is *reports*, not verified fact — every item links to its source.
- GDELT rate-limits aggressively; degradation is designed-in and visible.
- In-memory rate limits are per-instance — put an edge WAF in front of a
  busy public deployment ([details](docs/technical/security.md)).
- Map headlines geolocate via a built-in place index — country-level mentions
  pin at country centers (documented behavior).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) ·
[SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md).
Repo skills live in [.devin/skills/](.devin/skills/) — source vetting, security
audit, docs discipline.

## License

[AGPL-3.0](LICENSE) — run it, modify it, host it; share the source of hosted
derivatives.
