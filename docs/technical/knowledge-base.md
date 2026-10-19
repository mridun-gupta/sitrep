# Knowledge base — docs/technical index

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

Engineering documentation for contributors and self-hosters.

| File | Contents |
|------|----------|
| `prd.md` | Product requirements — goals, functional reqs, constraints |
| `trd.md` | Technical requirements — stack contract, interfaces, budgets |
| `executed.md` | Verified shipped state + incident audit trail |
| `architecture.md` | Pipeline, module map, request lifecycle |
| `api-reference.md` | Human-readable route docs |
| `data-sources.md` | Upstream inventory, cadences, licenses, adding a source |
| `configuration.md` | Every env var (all optional) |
| `deployment.md` | Vercel, Docker, Render, bare Node |
| `security.md` | Threat model, RLS, rate limits, residual advisories |
| `development.md` | Commands, conventions, smoke tests |
| `supabase.md` | Optional persistence: schema, RLS, migration |

## Invariants worth memorizing

1. Upstream URLs are constants — user input never reaches a URL.
2. Every source is behind `runSource()` — health is observable, failure is contained.
3. `tone` present → measured (GDELT); absent → derived (events).
4. `AI_*` envs upgrade the brief only; they never change signal truth.
5. The vendored MapLibre worker (`prebuild` sync) is load-bearing — don't remove it.
