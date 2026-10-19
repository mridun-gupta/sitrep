---
name: knowledge-base
description: Maintain Sitrep's four-tier documentation — docs/ai (agent-facing contracts), docs/technical (engineering), docs/non-technical (product guide), docs/layman (plain-language). Use when adding features, endpoints, sources, or env vars.
---

# Knowledge Base — Sitrep docs discipline

Four audiences, four doc sets. When the product changes, update whichever sets apply — a public API param touches all four; an internal refactor touches only `technical`.

## The four sets

| Set | Audience | Tone | Path |
|---|---|---|---|
| `docs/ai/` | LLMs, agents, integrators | Precise contracts, schemas, tool names, machine-readable | AI-agent-facing |
| `docs/technical/` | Engineers, self-hosters | Complete, exact commands, architecture rationale | Technical reference |
| `docs/non-technical/` | Analysts, journalists, curious users | Task-oriented, no code, screenshots described in prose | Product guide |
| `docs/layman/` | Anyone | Explain like a smart friend, zero jargon | Plain language |

## Rules that keep the KB honest

1. **Nothing in docs that isn't true.** Commands, env names, endpoints, and file paths must match the code — verify against `src/` before writing. Dead docs are worse than missing docs.
2. **Four-tier entries for user-facing features.** New endpoint → `ai/api-contracts.md` + `technical/api-reference.md` + `non-technical/features.md` + a line in `layman/what-is-sitrep.md` if it changes the mental model.
3. **Explain degradation, not just the happy path.** Every doc on a feature states what happens when it's unconfigured/down (e.g., brief falls back to deterministic mode).
4. **Security-sensitive notes live in `technical/security.md`** — and the audit checklist is `.devin/skills/security-audit/SKILL.md`. Cross-link, don't duplicate.
5. **Layman docs never use these words:** API, endpoint, JSON, schema, server, deploy, environment variable. Use "feed", "page", "list", "the app", "settings".
6. **README is a map, not a manual.** It links into `docs/`; keep it under ~250 lines.
7. `llms.txt` (repo root) is the AI-facing index — update it when adding docs or endpoints.

## Changelog discipline

Public-facing changes get a `CHANGELOG.md` entry under `## Unreleased` in [Keep a Changelog](https://keepachangelog.com) format: Added / Changed / Fixed / Removed / Security.
