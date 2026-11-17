# Getting Around the Console

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)


Sitrep opens with three columns: the **Wire** (news), the **map** (everything
geolocated), and the **intel rail** (brief, convergence, markets).

## The Wire (left)

Live headlines from international outlets and GDELT's global crawl.

- **Topic chips** — filter to conflict, disaster, political, humanitarian,
  economic or cyber stories.
- **Filter box** — free-text match; use `|` for alternatives
  (`taiwan|strait` matches either word).
- **Save a filter as a watch** — after typing a filter, the bar at the bottom
  offers "save filter as watch". Watches become quick-tap chips at the top of
  the wire. On deployments with the database enabled they sync to the cloud;
  otherwise they live in your browser.
- Click any headline to open the original article in a new tab.

## The map (center)

Three toggleable layers (top-left):

| Layer | What it shows |
|---|---|
| **Events** | Everything geolocated, colored by category, sized by severity. Zoom into clusters by clicking them; click a dot for details + source link. |
| **Tension** | Heat where negative-toned news is concentrated — the "media weather". |
| **Hotspots** | Amber rings where *independent* sources converge — our strongest "pay attention" signal. |

## The intel rail (right)

- **Situation brief** — a short digest: top development, activity by domain,
  leading coverage. ◈ badge = written by an AI model; ◇ = built from the
  ranked feed (still accurate to the items). Regenerate with ⟳.
- **Convergence / Tension tabs** — ranked lists; click any row to fly the map
  there.
- **Market radar** — crypto + major indices, refreshed ~minutely.

## Header & ticker

- UTC clock (intelligence standard), live signal count, **sources** button →
  drawer showing every upstream's health, capabilities on this deployment,
  and your watchlist.
- Bottom ticker streams the latest wire headlines (hover pauses it).

## Reading severity colors

`info` slate → `low` blue → `medium` amber → `high` orange → `critical` red.
Colors are rule-based hints, not verified assessments — always open the
source link before quoting.

## Mobile

Everything stacks: map first, then brief, intel, wire, markets.
