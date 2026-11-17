# What shipped — verified record

> **Last updated:** 2026-10-19 · **Authors:** mridun-gupta & Devin (AI-assisted)
> Engineering record: `docs/technical/executed.md`.

## Live and checked (2026-10-19)

- **341 events** on the map from a cold start, including ~129 military
  aircraft tracks, 80 active US weather alerts, 125 UN/EU disaster alerts,
  24 earthquakes, 17 national internet outages, 12 space-weather notices,
  and 20 WHO outbreak items.
- **112 headlines** on the merged wire (BBC, Al Jazeera, Guardian, DW,
  France24, NPR, UN News, ReliefWeb, WHO, CISA).
- **Tension index stays populated** even when GDELT rate-limits — it falls
  back to weighting the events themselves (those points carry no tone score,
  which is how you can tell them apart in the API).
- **All 11 keyless sources healthy** in `/api/v1/sources`; the four keyed
  ones correctly report "unpolled" with no keys set.

## Incidents found & fixed this cycle

| Problem | Fix |
|---------|-----|
| Map stayed blank on production | The map's graphics worker wasn't resolvable after the build; it now ships as a static file, and the blocked basemap case shows a visible notice |
| News ticker blurred past (~330 px/s) | Speed now measures real width — ~55 px/s, hover to pause |
| Tension index empty during GDELT rate limits | Event-derived fallback (see above) |
| A 3-year-old WHO item topped the brief | WHO items older than 120 days are dropped; the headline slot only considers events under 72 h old |
| Weather-alerts feed returned errors | The `limit` parameter wasn't supported upstream — removed, capped on our side |
| Repeated AI briefs could bill per-request | Briefs share a 10-minute cache across the whole app |

## Deliberate gaps (not bugs)

- No accounts: watchlists use a browser key; cloud sync is optional Supabase.
- No aircraft = nothing shown — we never fabricate tracks.
- Quiet weather nights show zero NWS alerts — that's the feed telling the truth.
