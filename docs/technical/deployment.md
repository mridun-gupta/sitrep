# Deployment

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


Sitrep deploys anywhere Next.js 16 runs. The zero-config path needs **no env
vars** — you get the full dashboard and public API immediately.

## Vercel (recommended)

1. Push this repo to GitHub.
2. [Import](https://vercel.com/new) the repo — Next.js is auto-detected. Deploy.
3. Optional envs (see [configuration.md](configuration.md)) in Project → Settings → Environment Variables.

Cron (optional): uncomment the `crons` block in `vercel.json` and set
`CRON_SECRET`. Hobby plans run cron once per day — plenty for a personal
monitor; Pro allows the shown 15-minute sweep.

## Docker

```bash
docker build -t sitrep .
docker run -p 3000:3000 --env-file .env.local sitrep
# or
docker compose up -d
```

The image uses Next's `standalone` output — small, non-root, Alpine base.
`docker-compose.yml` runs just the app; Supabase is a hosted service.

## Railway / Render / Fly

- **Railway**: New Project → Deploy from Repo → autodetects Dockerfile.
- **Render**: New Web Service → repo → Docker; include `render.yaml` from this
  repo for a blueprint (health check path `/api/v1/sources`).
- **Fly.io**: `fly launch` picks up the Dockerfile; keep machines warm (min 1)
  so the in-memory cache actually caches.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
npm run typecheck && npm run lint
npm run build      # production build
node .next/standalone/server.js   # serve the standalone output
```

## Reverse proxy notes

- Serve over HTTPS — `Strict-Transport-Security` is set.
- `/api/v1/*` is intentionally CORS-open for reads; `/api/cron/*` must never
  be reachable without the secret.
- If you front with Cloudflare, add a rate-limit rule (e.g. 120 req/min/IP on
  `/api/*`) — the in-app limiter is per-instance.

## Supabase setup (optional)

```bash
# Option A — hosted project
supabase link --project-ref <ref>
supabase db push

# Option B — paste supabase/migrations/20261019000000_init.sql
# into the Supabase SQL editor and run.
```

Then set the three Supabase env vars. Without them everything still works —
watchlists stay in the browser.
