# Contributing to Sitrep

Thanks for helping make open-source situation awareness better.

## Before you start

- **Bug reports / feature ideas** → use the issue templates.
- **Security issues** → see [SECURITY.md](SECURITY.md); don't open public issues.
- By contributing you agree to the [Code of Conduct](CODE_OF_CONDUCT.md) and
  to license your work under AGPL-3.0.

## Dev setup

```bash
npm ci
npm run dev        # http://localhost:3000
```

No env vars needed — the app runs on free public sources. See
[docs/technical/development.md](docs/technical/development.md) for commands
and conventions.

## What makes a good PR

- One thing per PR; conventional commit messages (`feat:`, `fix:`, `docs:`…).
- `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` all pass.
- **Adding a data source?** Read
  [.devin/skills/osint-source-vetting/SKILL.md](.devin/skills/osint-source-vetting/SKILL.md)
  first — there's a contract (registry entry, normalization, health).
- **User-facing change?** Update the doc sets per
  [.devin/skills/knowledge-base/SKILL.md](.devin/skills/knowledge-base/SKILL.md)
  and add a `CHANGELOG.md` line under `## Unreleased`.
- **Security-relevant change?** Run
  [.devin/skills/security-audit/SKILL.md](.devin/skills/security-audit/SKILL.md)
  and note the result in the PR body.

## Code of the land

- Types first (`src/lib/types.ts`); sources normalize into shared contracts.
- All upstream fetching through `src/lib/sources/http.ts`.
- Query params through `src/lib/params.ts` zod schemas; every public route
  wrapped in `limited()`.
- No `dangerouslySetInnerHTML`; untrusted text via `textContent`/React
  escaping only.
- Dependencies: pinned or `^` ranges only — never `latest`/`*`.
