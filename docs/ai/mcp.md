# MCP Server

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


Sitrep exposes a Model Context Protocol server at `POST {host}/mcp`
(Streamable HTTP, stateless — no session bootstrap needed).

## Client config

```jsonc
// claude_desktop_config.json / .cursor/mcp.json
{
  "mcpServers": {
    "sitrep": { "url": "https://<your-host>/mcp" }
  }
}
```

Self-hosted/local: `"url": "http://localhost:3000/mcp"`.

## Tools

| Tool | Args | Returns |
|---|---|---|
| `sitrep_events` | `category?`, `minSeverity?`, `hours?` (≤168), `limit?` (≤200) | `SitrepEvent[]` |
| `sitrep_news` | `q?`, `topic?`, `limit?` (≤100) | `NewsItem[]` |
| `sitrep_earthquakes` | `minMag?`, `limit?` | `SitrepEvent[]` |
| `sitrep_hotspots` | `limit?` (≤50) | Hotspot summaries + `topTitles` |
| `sitrep_signals` | `limit?` (≤100) | `SignalPoint[]` |
| `sitrep_markets` | — | `MarketQuote[]` |
| `sitrep_brief` | — | `SitrepBrief` (full JSON) |

All tools are `readOnlyHint: true`. Tool responses are JSON strings — parse
`content[0].text`.

## Prompt pattern that works well

> "Give me a sitrep on <region/topic>: pull `sitrep_brief`, then
> `sitrep_hotspots` filtered toward the area, then corroborate the top
> hotspot with `sitrep_news` search terms."

## Notes for agent builders

- The server is stateless; each call re-reads the shared cache. Bursts are
  cheap after the first call.
- `sitrep_brief` can take ~30s when the deployment runs an LLM and the cache
  is cold — set generous tool timeouts.
- There is no auth on reads. Do not put secrets in tool arguments.
