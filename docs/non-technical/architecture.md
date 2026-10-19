# How Sitrep works — the picture, in product language

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Component-level detail: `docs/technical/architecture.md`.

```
PUBLIC FEEDS                    SITREP                          YOU
─────────────                   ──────────────────────────────   ─────────
USGS, NASA, UN, WHO,   ───►   fetch → normalize → merge   ───►   console
NWS, adsb.lol, IODA,          (one shape for everything)         (map + panels)
NOAA, news wires                    │                            │
                                    ▼                            ▼
                          correlate: places where            map · tension ·
                          several sources converge            hotspots · wire
                                    │
                                    ▼
                          brief: rules digest, or an
                          optional AI summary — labelled
```

## The three ideas to hold onto

1. **Normalize, then merge.** Every feed arrives in its own format; each
   gets translated into one shared "event" shape (what, where, when, how
   severe, which source). After that, sources stop mattering — a quake and
   a refugee alert are the same kind of object.
2. **Convergence is the signal.** A single feed saying "something in Odesa"
   is a dot. Three independent feeds saying it is a hotspot ring — Sitrep
   scores where independent sources overlap.
3. **Everything degrades, nothing lies.** A dead feed dims its panel and
   shows up in source health. The app would rather show you an honest empty
   cell than a plausible-looking filler.
