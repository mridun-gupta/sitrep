# FAQ

**Is this real-time?**
Near-real-time. Each feed refreshes every few minutes (the app caches to be
polite to the free upstreams). Breaking news typically appears within
5–15 minutes of publication.

**How accurate is the severity coloring?**
It's rule-based — "killed"/"tsunami warning"/"M7 earthquake" style triggers —
not human judgment. Treat it as a triage hint. The original report is always
one click away.

**Why is a whole country marked for one headline?**
Headlines that mention a country but no specific place pin at the country's
center (documented behavior — see `gazetteer` in the technical docs). A pin on
a capital means the text named the place precisely.

**A source shows "degraded" in the Sources drawer — is the app broken?**
No. Sitrep is built to degrade gracefully: dead feeds drop out and report
themselves rather than failing the page. GDELT rate-limits browsers in some
networks — its health badge will say so.

**Do I need an account?**
Never. There is no account system. Watchlists work locally; on deployments
with the database they sync via an anonymous key stored in your browser.

**Can I run my own?**
Yes — that's the point. One-click Vercel, Docker, or `npm run dev` locally;
see `docs/technical/deployment.md`. AGPL-3.0 license: you can host it, modify
it, share it — with source disclosure for hosted derivatives.

**Can I plug this into my AI assistant?**
Yes — point an MCP client at `https://<host>/mcp`; tools are documented in
`docs/ai/mcp.md`.

**Who pays for the data?**
Nobody — every built-in source is a free public feed. That's also why polite
caching matters; hammering upstreams gets everyone's key/feed pulled.
