# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` / latest release | ✅ |
| older | ❌ |

## Reporting a vulnerability

**Do not open a public issue for unpatched vulnerabilities.**

Email the maintainer (see the GitHub profile on the repo's owner account) with:

- description and impact
- reproduction steps or PoC
- affected commit/version

Expect acknowledgement within 72 hours; we'll coordinate a fix and disclosure
timeline together.

## Scope notes

Sitrep is a read-only OSINT surface: no accounts, no PII, no payment data.
The interesting attack surface is upstream-fetch abuse (SSRF-style), input
validation on `/api/v1/*`, the watchlist `X-Watch-Key`/RLS binding, and the
cron ingest Bearer check. The repo-specific audit checklist lives at
`.devin/skills/security-audit/SKILL.md`; the model is documented in
[docs/technical/security.md](docs/technical/security.md).
