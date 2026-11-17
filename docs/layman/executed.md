# What's actually in it right now — in plain words

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)

Checked on 2026-10-19 against the live sources.

## What showed up on one screen

- **341 things happening**, including about 129 military planes broadcasting
  their position, 80 US weather warnings, 125 disaster alerts, 24 earthquakes,
  17 national internet outages, 12 space-weather notices and 20 WHO
  outbreak items.
- **112 headlines** from ten world news wires.
- The tension layer still works even when the mood-measuring feed is busy —
  it estimates tension from the events themselves.

## What we fixed along the way

| What was wrong | What we did |
|----------------|-------------|
| The map came up blank on the hosted copy | The map's drawing engine wasn't reachable after building; it's now bundled with the app, and blocked basemaps show a notice |
| The news ribbon raced past | It now measures how wide the strip is and scrolls at reading speed |
| Tension numbers vanished when one feed got busy | Falls back to judging from events (those points carry no mood score, so you can tell them apart) |
| A three-year-old health notice led the summary | Old items are filtered out; the top line only considers fresh events |

## What isn't there on purpose

- No accounts — your watchlist lives in your browser unless you turn on the
  optional database.
- No pretend data — an empty panel during a quiet period is the feed being
  truthful.
