# What Sitrep must do — product requirements, in product language

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

## The promise

Sitrep watches the world's public signals — earthquakes, storms, disaster
alerts, military aircraft, internet blackouts, space-weather warnings,
disease outbreaks, news wires and markets — and puts them on one screen,
with the evidence one click away.

## Hard rules

1. **Everything is real.** Every item on the map or the wire comes from a
   named public source, with a link back to it. If a feed goes quiet, the
   panel shows "no data" — we never fill gaps with guesses.
2. **AI only summarizes, never reports.** The situation brief can be
   written by an AI model *if you plug one in*, and it says so (`mode: ai`).
   Otherwise rules generate it (`mode: deterministic`). AI never invents items.
3. **Failures are visible.** Each source's health is public inside the app —
   you can always see which feeds are up, degraded, or down.
4. **Free to run.** The whole thing works with zero paid accounts or keys.
   Optional keys (NewsAPI, ACLED, ReliefWeb, NASA FIRMS) add feeds, never
   unlock basics.

## The signals we watch

| Layer | Sources | What you see |
|-------|---------|--------------|
| Earthquakes | USGS | magnitude-scaled quake dots |
| Natural events | NASA EONET, GDACS | storms, volcanoes, floods, droughts |
| Severe weather | US National Weather Service | tornado/hurricane/flood alerts |
| Military | adsb.lol | live military aircraft on transponder |
| Internet | IODA (Georgia Tech) | country-scale connectivity drops |
| Space weather | NOAA SWPC | geomagnetic watches & warnings |
| Health | WHO | outbreak & epidemic notices |
| News | 10 curated wires + GDELT | merged, topic-filterable timeline |
| Markets | CoinGecko, stooq | crypto/index moves beside the news |
| Conflict / UN | ACLED, ReliefWeb | *optional, with a free key* |
| Wildfire | NASA FIRMS | *optional, free key* |

## What "good" looks like

- The map is never empty when the world isn't — at least two independent
  feeds back every hotspot ring.
- The tension layer stays alive even when GDELT (our mood-temperature feed)
  rate-limits, because we can derive it from the events themselves.
- You can verify anything: click through to the original source.
