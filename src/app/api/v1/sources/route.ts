import { limited, ok, options } from '@/lib/api';
import { getEvents, getHealth, getMarkets, getNews } from '@/lib/sources/aggregator';
import { SOURCE_REGISTRY } from '@/lib/sources/registry';
import { isAiConfigured, isSupabaseConfigured } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;

  // Each route bundle owns its module state in production, so we poll here.
  // Aggregation is TTL-cached — a warm call costs nothing upstream.
  await Promise.all([getEvents(), getNews(), getMarkets()]).catch(() => undefined);

  const health = getHealth();
  const catalog = SOURCE_REGISTRY.map((s) => ({
    ...s,
    health: health.find((h) => h.id === s.id) ?? null,
  }));

  return ok({
    sources: catalog,
    capabilities: {
      supabase: isSupabaseConfigured,
      aiBriefs: isAiConfigured,
    },
    note: 'health reflects this serving worker; module state is per-instance on serverless',
  });
}

export { options as OPTIONS };
