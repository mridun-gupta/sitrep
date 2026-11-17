# Data Sources

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

Every source declares itself in `src/lib/sources/registry.ts` and reports live
health on `/api/v1/sources` and the Sources drawer.

## Keyless (always on)

| Source | Provides | Cadence/limits | License note |
|---|---|---|---|
| **GDELT DOC 2** | Global news articles + tone; gazetteer-geocoded into events & tension signals | ~1 req / 5s per IP — we query once per cache window (12min) | Free for research/non-commercial aggregation |
| **USGS** | M4.5+ earthquakes, 24h feed | Freely cacheable | US Gov public domain |
| **NASA EONET** | Open natural events (wildfires, storms, volcanoes, ice) | Generous | Public domain |
| **GDACS** | UN/EU disaster alerts — cyclones, floods, volcanoes, wildfires, droughts with Green/Orange/Red levels | Generous | EC JRC, attribution appreciated |
| **NWS** | US severe-weather alerts (`/alerts/active`) — tornadoes, hurricanes, floods; GeoJSON geometry → centroid | Generous; wants a contactable UA (we send one) | US Gov public domain |
| **adsb.lol** `/v2/mil` | Live military aircraft on transponder — callsign, airframe, altitude, speed | Community aggregator; polled once per 3min events window | Fair-use community feed |
| **NOAA SWPC** | Space-weather watches/warnings (product codes WAT/ALT/WAR; SUM routines dropped) | Generous | US Gov public domain |
| **IODA** (Georgia Tech) | Country-scale internet outages from BGP, active probing, Google traffic | Academic API; `from`/`until` required — we query a 3-day window | Research API, cite IODA |
| **WHO news feed** | Outbreak/epidemic notices; gazetteer-geocoded, items >120d dropped | RSS TTL | © WHO, headline+link |
| **RSS wires** | BBC World, Al Jazeera, Guardian, DW, France24, NPR, UN News, ReliefWeb updates, WHO, CISA advisories | Each feed's own TTL; we poll ≤ once/5min | Headline+link only; see each publisher's ToS |
| **Markets** | CoinGecko crypto prices, stooq index closes | CoinGecko ~30/min free tier | Their respective terms |

When GDELT is down/429'd, tension signals fall back to derivation from the
geolocated event mix (severity × category boost per ~2.5° cell) — the map
layer never reads empty, and derived points carry no `tone` field. Military
tracks are damped (×0.3) so routine patrols don't register as tension.

## Keyed (env-gated)

| Source | Env | Get credentials |
|---|---|---|
| ACLED | `ACLED_KEY` + `ACLED_EMAIL` | [acleddata.com](https://acleddata.com) free registration |
| NewsAPI | `NEWSAPI_KEY` | [newsapi.org](https://newsapi.org) free tier |
| ReliefWeb v2 | `RELIEFWEB_APPNAME` | [apidoc.reliefweb.int](https://apidoc.reliefweb.int/parameters#appname) free appname request |
| NASA FIRMS | `FIRMS_KEY` | [firms.modaps.eosdis.nasa.gov/map/activate](https://firms.modaps.eosdis.nasa.gov/map/activate) — instant, free; VIIRS pixels aggregated into ~2.5° cells |

When envs are absent the source simply doesn't run — registry entry remains
visible as `kind: keyed`.

## Gazetteer

`src/lib/sources/gazetteer.ts` — ~150 curated toponyms (capitals, conflict
zones, chokepoints) plus ~80 country centroids (`countryCentroid()` for
name-keyed feeds like IODA). Applied to headlines to geolocate news without
an external geocoder. Add entries in the same tuple format; longer names
take precedence over shorter ones.

## Adding a source

Read `.devin/skills/osint-source-vetting/SKILL.md` — it encodes the contract
(constant-built URLs, `fetchJson`/`fetchText`, normalization, `runSource`
health, docs updates). Rejected candidates so far: LiveUAmap (Cloudflare
403), WHO DON feed (decommissioned upstream — the general news feed is used).
