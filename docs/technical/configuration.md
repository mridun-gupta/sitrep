# Configuration

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


All env vars are optional. `src/lib/env.ts` validates them with zod at boot —
a malformed value fails fast with a named error.

Copy `.env.example` → `.env.local` for dev, or set vars on your platform.

## Reference

| Var | Effect when set | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables cloud watchlist sync + read path for `events_cache` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Enables cron `upsert` into `events_cache` + `ingest_runs` | Same — **never commit, never NEXT_PUBLIC** |
| `AI_BASE_URL` + `AI_MODEL` | `/api/v1/brief` uses an LLM (`mode: "ai"`) | `https://openrouter.ai/api/v1`, `https://api.openai.com/v1`, or Ollama `http://localhost:11434/v1` |
| `AI_API_KEY` | Bearer for the above (omit for local Ollama) | Provider console |
| `NEWSAPI_KEY` | Adds NewsAPI headlines to the wire | newsapi.org |
| `ACLED_KEY` + `ACLED_EMAIL` | Adds real conflict-event data | acleddata.com |
| `RELIEFWEB_APPNAME` | Adds UN OCHA humanitarian alerts | apidoc.reliefweb.int |
| `FIRMS_KEY` | Adds NASA FIRMS global wildfire cells | firms.modaps.eosdis.nasa.gov/map/activate (free, instant) |
| `CRON_SECRET` | Enables `GET /api/cron/ingest` (Bearer) | Any long random string |
| `NEXT_PUBLIC_SITE_URL` | Absolute links in generated docs/metadata | Your deployment URL |
| `NEXT_PUBLIC_BASEMAP_URL` | Override the basemap style JSON | Any MapLibre GL style URL |

## Examples

**Local, full-featured (Ollama):**
```bash
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.1
# AI_API_KEY not needed for Ollama
```

**Vercel + Supabase:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
SUPABASE_SERVICE_ROLE_KEY=eyJ…   # required for the cron ingest
CRON_SECRET=<random>
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=sk-or-…
AI_MODEL=meta-llama/llama-3.1-8b-instruct
```

## Degradation contract

| Missing | Result |
|---|---|
| Supabase | Watchlists persist in `localStorage` only; `/api/v1/watchlist` → `503` |
| `AI_*` | Brief runs `deterministic` mode (still useful — ranked aggregation) |
| `CRON_SECRET` | `/api/cron/ingest` → `503` (disabled, safe) |
| Source keys | Source skipped; registry still lists it as `keyed` |
