import { Dashboard, type InitialData } from '@/components/Dashboard';
import { generateBrief } from '@/lib/ai/brief';
import { isAiConfigured, isSupabaseConfigured } from '@/lib/env';
import {
  getEvents,
  getMarkets,
  getNews,
  getSignals,
} from '@/lib/sources/aggregator';
import { getHealth } from '@/lib/sources/registry';
import { SOURCE_REGISTRY } from '@/lib/sources/registry';

export const dynamic = 'force-dynamic';

/** A failing feed must never take the whole console down. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/**
 * Server-side first paint: aggregate once here so the console opens with
 * real data, then the client keeps polling the same /api/v1 the public uses.
 */
export default async function Page() {
  const [{ events, hotspots }, news, signals, markets] = await Promise.all([
    safe(getEvents(), { events: [], hotspots: [] }),
    safe(getNews(), []),
    safe(getSignals(), []),
    safe(getMarkets(), []),
  ]);

  let brief = null;
  try {
    brief = await generateBrief(events, news);
  } catch {
    /* brief is best-effort at first paint */
  }

  const health = getHealth();
  const initial: InitialData = {
    events,
    hotspots: hotspots.map(({ events: ev, ...h }) => ({
      ...h,
      topTitles: ev.slice(0, 3).map((e) => e.title),
    })),
    news: news.slice(0, 150),
    signals: signals.slice(0, 60),
    markets,
    brief,
    sources: SOURCE_REGISTRY.map((s) => ({
      ...s,
      health: health.find((h) => h.id === s.id) ?? null,
    })),
    capabilities: {
      supabase: isSupabaseConfigured,
      aiBriefs: isAiConfigured,
    },
  };

  return <Dashboard initial={initial} />;
}
