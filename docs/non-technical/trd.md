# How it's built — technical requirements, in product language

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Engineers: see `docs/technical/trd.md` for the binding contract.

## Shape of the system

- One web app (Next.js + TypeScript) that talks to public feeds, stores
  results briefly in memory, and redraws the console every few minutes.
- A world map (MapLibre) whose graphics worker ships with the app — so the
  map can't silently break when the bundler changes.
- An optional database (Supabase) for saving watchlists and event history.
  Without it, watchlists live in your browser.

## What "working" means

- No public page ever waits on a single feed — every source has a timeout
  and failure only dims that source's panel.
- Freshness has a budget: events ~3 min, news ~5 min, tension ~15 min,
  markets ~1 min. The brief caches 10 minutes so AI costs stay flat.
- Every public surface is rate-limited; the brief route is tighter because
  a connected AI model can cost money per call.
- Timestamps like "generated 10m ago" are real — they come from the clock,
  not from formatting tricks.

## Fair-use & etiquette

- We send a declared User-Agent to upstreams and respect rate limits.
- NWS alerts come from the US National Weather Service — quiet periods
  (zero alerts) are normal, not a bug.
- Military tracks reflect only aircraft *broadcasting* positions — absence
  of a track isn't absence of an aircraft.
- The gazetteer (built-in place index) means headlines like "quakes in
  Chile" land on the map without a paid geocoder.
