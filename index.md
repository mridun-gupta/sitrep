# Sitrep — Documentation

Open-source OSINT situation-awareness console: live global events, merged
news wire, cross-source hotspots, tension signals and situation briefs from
free public feeds.

**[Live console →](https://sitrep-lime.vercel.app)** ·
**[Repository →](https://github.com/mridun-gupta/sitrep)** ·
**[MCP server →](https://sitrep-lime.vercel.app/mcp)**

## Four tiers — pick your audience

| Tier | Audience | Start here |
|---|---|---|
| **AI / agents** | Tool contracts, MCP schemas, machine-readable guidance | [docs/ai/knowledge-base.md](docs/ai/knowledge-base.md) |
| **Technical** | Engineers deploying, configuring, extending Sitrep | [docs/technical/knowledge-base.md](docs/technical/knowledge-base.md) |
| **Non-technical** | Analysts and operators using the console | [docs/non-technical/knowledge-base.md](docs/non-technical/knowledge-base.md) |
| **Layman** | Plain-language explainer, zero jargon | [docs/layman/knowledge-base.md](docs/layman/knowledge-base.md) |

## Program documents

Each tier carries the same five artifacts, adapted per audience:

- **PRD** — product requirements: what Sitrep is for and why
- **TRD** — technical requirements: contracts, constraints, verification
- **EXECUTED** — the honest build log: what shipped, what broke, what was fixed
- **Architecture** — how the system is put together
- **Knowledge base** — index over the tier's docs

Example: [technical PRD](docs/technical/prd.md) ·
[technical TRD](docs/technical/trd.md) ·
[technical EXECUTED](docs/technical/executed.md) ·
[technical architecture](docs/technical/architecture.md)

## For AI agents

Sitrep exposes a Model Context Protocol server — add
`https://sitrep-lime.vercel.app/mcp` to any MCP-capable agent (Claude Code,
Cursor, Copilot, etc.) for 7 read-only `sitrep_*` tools. Contracts:
[docs/ai/mcp.md](docs/ai/mcp.md) · [docs/ai/api-contracts.md](docs/ai/api-contracts.md) ·
[docs/ai/agent-guide.md](docs/ai/agent-guide.md)

The installable agent skill package lives on the
[`sitrep-osint` branch](https://github.com/mridun-gupta/sitrep/tree/sitrep-osint).

---

Every document carries a `Last updated` timestamp and authorship line.
License: AGPL-3.0.
