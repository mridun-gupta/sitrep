---
name: security-audit
description: Audit this repository for security issues — secrets, injection, SSRF, XSS, headers, dependency risk, authz gaps in Supabase RLS, and API abuse surface. Run before releases and whenever adding data sources, API routes, or env vars.
---

# Security Audit — Sitrep

A practical audit checklist tuned to this codebase's actual attack surface. Work through it in order; each item names *where to look*.

## 1. Secrets hygiene

- `git grep -n -iE "(api[_-]?key|secret|token|password|bearer)" -- '*.ts' '*.tsx' '*.sql'` — expect only env-var reads (`env.X`), never literals.
- `.env.example` must contain placeholders only — no real values, ever.
- Confirm `.env*` is in `.gitignore` (except `.env.example`).
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in `NEXT_PUBLIC_*` contexts and never be imported by client components (`'use client'` files must not import `src/lib/env.ts` server-only values — check `db/supabase.ts` usage sites).

## 2. External-fetch surface (SSRF-adjacent)

Every outbound request goes through `src/lib/sources/http.ts` (`fetchText`/`fetchJson`) which enforces timeout + 4MB cap + declared UA.

- **Never let request input flow into an upstream URL.** Source modules build URLs from constants only. When adding a source: the user query params (`q`, `category`, `limit`) may influence OUR filtering, never upstream URL path/host. Grep for `` `...${` `` template URLs in `src/lib/sources/` and verify each interpolated value is a constant or enum.
- RSS feed list (`rss.ts`) is a fixed allowlist — do not accept feed URLs from requests.
- No generic "fetch arbitrary URL" endpoint may exist (search `app/api/**/route.ts` for `req.url`/`searchParams` flowing into `fetch`).

## 3. Input validation

- All `/api/v1/*` routes parse query params through `src/lib/params.ts` zod schemas. Any new route must do the same — no `new URL(req.url).searchParams.get(...)` used unvalidated.
- `watchlist` POST/DELETE validate body via zod and require `X-Watch-Key` matching `UUID_RE`.
- Cron route requires `Authorization: Bearer $CRON_SECRET` — `timing-safe` comparison isn't needed here (secret not user-facing), but the check must happen *before* any work and return 401.

## 4. Output injection / XSS

- React escapes everything rendered in panels — never `dangerouslySetInnerHTML` (grep it; expect zero hits outside icon SVG).
- Map popups build DOM with `textContent` only (`popupEl` in GlobalMap.tsx) — feed titles are untrusted.
- `stripHtml` (geo.ts) must run on feed descriptions before they reach summaries.
- CSP in `next.config.ts` — if you add a tile host or external image host, extend `img-src`/`connect-src` deliberately; never add `*` or `unsafe-eval`.

## 5. API abuse surface

- `limited()` (rate-limit.ts) wraps every public route — default 60/min/IP, brief is 20/min. When adding routes, pick the limit based on upstream cost.
- Responses set `Cache-Control: public, s-maxage=…` — do not leak `Set-Cookie` or `Authorization` headers through `ok()` (CORS is `*` + GET-only, no credentials allowed).
- In-memory rate limits are per-instance on serverless — documented limitation; for public launches recommend Cloudflare/Vercel WAF rules in `docs/technical/security.md`.

## 6. Supabase / RLS

- Every table in `supabase/migrations/` must `enable row level security`.
- `watchlists` policies bind rows to `request.headers->>'x-watch-key'` — the matching header must be set by `supabaseForWatchKey()`; verify no code path writes watchlists with the admin client.
- `events_cache` is world-readable, service-role-only writable (no INSERT/UPDATE policies for anon).
- Migrations must be additive-safe (`if not exists`, `onConflict`) so self-hosters can re-run.

## 7. Dependencies

- `npm audit --audit-level=high` must pass or findings documented in the audit issue.
- Prefer >=7-day-old releases; never pin `latest`. Check `package.json` for `"*"` or `"latest"` ranges — there must be none.
- Dependabot config at `.github/dependabot.yml` — keep enabled.

## 8. Logging

- Never log request bodies, headers, or env values. Grep `console.log` in `src/lib` — allowed only for operational events (ingest results), never user data.

## Audit report format

```
# Security audit — <date> — <commit sha>
Scope: <what changed>
Findings: [CRITICAL|HIGH|MEDIUM|LOW|INFO] file:line — description — fix
Verdict: SHIP / BLOCK on <finding>
```

Block release on any CRITICAL (secret committed, auth bypass, injection sink) or HIGH (missing RLS, unvalidated input reaching sink, missing auth on cron).
