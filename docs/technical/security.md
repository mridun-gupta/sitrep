# Security Model

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


Sitrep is a **read-only intelligence surface** — the threat model is mostly
"protect upstreams, protect the operator, don't serve garbage".

## What we protect

- **No user accounts.** Watchlists are keyed by a browser-held UUID
  (`X-Watch-Key`), enforced by Postgres RLS — lose the key, lose the list;
  there is nothing to phish.
- **No secrets in the repo.** Everything credential-shaped is an env var,
  validated at boot. Service-role key is server-only.
- **Upstream shielding.** All upstream calls go through `fetchText/fetchJson`
  (timeout, 4MB cap, declared UA) and sit behind TTL caches. Public reads
  cannot fan out to upstreams faster than the cache allows.

## Layers

| Layer | Mechanism |
|---|---|
| Headers | CSP, `nosniff`, `DENY`, Referrer-Policy, HSTS, Permissions-Policy (`next.config.ts`) |
| API | zod-validated params only; GET-only + CORS `*` for public data; per-IP sliding-window limits on `/api/v1/*` **and `/mcp`**; `429` + `Retry-After` |
| Cost abuse | Brief generation (the one paid-LLM sink) sits behind a shared 10-min cache — REST, MCP and page share one generation |
| SSRF | upstream URLs are constants; feed allowlist; no proxy endpoints |
| XSS | React escaping; map popups via `textContent`; `stripHtml` on feed bodies; CSP `script-src 'self' 'unsafe-inline'` |
| Supabase | RLS on all tables; watchlists bound to `x-watch-key`; events_cache read-public write-service-role |
| Cron | `Authorization: Bearer $CRON_SECRET`, disabled entirely when unset |
| Deps | Dependabot + weekly `npm audit` workflow; no `latest`/`float` ranges |

## Known limitations (honest section)

1. **Per-instance rate limiting** on serverless — a distributed scraper can
   exceed it. For a public launch, add an edge rule (Vercel WAF / Cloudflare)
   on `/api/*`.
2. **Module-level state is per-route-bundle** in production builds. Cache and
   health are correct but not globally shared — documented in
   [architecture.md](architecture.md).
3. **OSINT data is unverified by definition.** Severity scores are heuristic.
   The UI and API label sources; consumers must verify `url` links before
   acting on anything.
4. **Map basemap** (CARTO dark / OpenFreeMap) is a third-party tile service —
   it sees map viewport traffic like any tile host. Swap via
   `NEXT_PUBLIC_BASEMAP_URL` for a self-hosted style if that matters to you.
5. **`npm audit` currently reports a `braces` advisory** (GHSA-vfj7-8cjw-p6xm,
   stack-exhaustion via deeply nested brace patterns). Chain:
   `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch →
   braces`. This is a **dev-only dependency** — it never ships to production,
   and exploitation requires an attacker to feed crafted glob patterns into
   the linter, which isn't remotely reachable. No patched `braces` release
   exists upstream yet (latest is 3.0.3); `npm audit fix --force` would
   downgrade `eslint-config-next` to v14 and break Next 16 linting, so we
   accept and monitor. Re-run `npm audit` on dependency updates — drop this
   note once a fix lands.
6. **Tailwind v4 × library CSS collision (learned the hard way).** Tailwind
   v4 emits utilities inside `@layer utilities`; unlayered library CSS
   **always wins** over layered rules. MapLibre's unlayered
   `.maplibregl-map { position: relative }` beat `.absolute` on the map
   container → 0-height container → 300px default canvas → "blank center".
   Mitigations: doubled-specificity unlayered rule in `globals.css`
   (`.maplibregl-map.maplibregl-map`) plus an inline `style` pin on the
   container. Same rule applies to ANY third-party stylesheet — never rely on
   a Tailwind utility to override library CSS.
7. **CSP wildcard footgun (learned the hard way).** `*.host` does **not**
   cover the bare `host`. `connect-src … https://*.basemaps.cartocdn.com`
   blocked the map's own style fetch at `basemaps.cartocdn.com` (no
   subdomain). Both forms are now listed explicitly — keep that rule when
   adding tile/font/CDN hosts, and verify with `node scripts/smoke-map.mjs`
   against a prod build.

## Reporting

See [SECURITY.md](../../SECURITY.md). TL;DR: email the maintainer, do not open
a public issue for unpatched vulnerabilities.

## Audit checklist

`.devin/skills/security-audit/SKILL.md` encodes the repo-specific audit —
run it before releases and when adding sources, routes, or env vars.
