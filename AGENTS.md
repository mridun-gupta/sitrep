<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Sitrep — project notes

Open-source OSINT situation-awareness console. Next.js 16 + React 19 + Tailwind v4, MapLibre, Supabase (optional), MCP.

### Commands

- `npm run dev` — dev server
- `npm run typecheck` / `lint` / `test` / `build` — verification gates; all must pass before commit
- Prod serve: `node .next/standalone/server.js` (output is `standalone` — `next start` won't work)

### Non-negotiable conventions

- Upstream fetches only via `src/lib/sources/http.ts`; upstream URLs are constants/allowlists — never request-derived.
- Public routes: params through `src/lib/params.ts` zod schemas + `limited()` rate-limit wrapper.
- No `dangerouslySetInnerHTML`; untrusted text via `textContent`/React escaping.
- Doc discipline: user-facing changes update `docs/{ai,technical,non-technical,layman}` + `llms.txt` + `CHANGELOG.md` — see `.devin/skills/knowledge-base/SKILL.md`.
- New sources follow `.devin/skills/osint-source-vetting/SKILL.md`; security changes run `.devin/skills/security-audit/SKILL.md`.
- Deps: pinned/`^` only, ≥7 days mature — never `latest`/`*`.
