# Supabase

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


Optional persistence layer. The app is fully functional without it.

## Tables

| Table | Purpose | RLS |
|---|---|---|
| `events_cache` | Server-side event store written by `/api/cron/ingest`; readable by anyone — it's public intel data | `select: true`, writes service-role only |
| `ingest_runs` | Ops log — one row per cron sweep (fetched/upserted/duration/error) | read-public, write service-role |
| `watchlists` | Per-user saved wire filters | rows bound to `x-watch-key` header |

## Apply the schema

```bash
npm i -g supabase   # or scoop/brew
supabase link --project-ref <ref>
supabase db push
# or paste supabase/migrations/*.sql into the SQL editor
```

## How watchlist auth works without accounts

The browser generates a random UUID (`sitrep.watchKey` in localStorage) and
sends it as `X-Watch-Key` on watchlist requests. `supabaseForWatchKey()`
builds a per-request anon client carrying that header; RLS policies compare
it to each row's `watch_key`. A client can only ever see/modify rows under
its own key — possession of the UUID *is* the credential.

Consequences: no signup, no PII, no GDPR surface; the cost is that clearing
site data orphans the remote rows (they're filter-only — that's acceptable).

## Cron ingest

`vercel.json` can schedule `GET /api/cron/ingest` → aggregates all sources →
`persistEvents()` upserts into `events_cache` (idempotent on the
deterministic `id`), then logs to `ingest_runs`. Requires
`SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET`.

Why bother if the API already caches? Two uses: (1) warm `events_cache` lets a
busy public deployment serve reads without re-hammering upstreams on cold
lambdas; (2) `ingest_runs` gives you an audit trail of upstream health over
time.

## Local Supabase (optional)

`supabase start` spins up the full local stack; point
`NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321` at it. Not required for app
dev — the memory path covers everything except cloud sync.
