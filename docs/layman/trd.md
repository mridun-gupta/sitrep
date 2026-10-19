# How it stays fast and honest — in plain words

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> (The engineer's version lives in `docs/technical/trd.md`.)

## What it runs on

- One app that you can run on your own computer or put online for free
  (Vercel, Docker, a small VPS — guides are in the docs).
- A map that draws itself in your browser. The heavy drawing part ships
  inside the app so the map can't break when the build tools change.
- An optional online database (Supabase) for saving your watchlist across
  devices. Without it, the list stays inside your browser — still works.

## How fresh the numbers are

Events refresh about every 3 minutes · news every 5 · the tension layer
every 15 · markets every minute · the summary brief every 10 minutes.
The clock on screen is real — "generated 10m ago" means it.

## How it behaves when things go wrong

- A feed that stops answering only dims its own corner — the rest keeps working.
- If the basemap can't be reached (strict office networks do this), the app
  tells you instead of showing a black rectangle.
- If the optional AI helper isn't set up, the brief is still written by
  rules — it says "deterministic" on the label.
- Too many clicks get gently slowed (rate limits), which keeps the free
  feeds healthy for everyone.
