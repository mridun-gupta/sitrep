import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { getEvents, getNews } from '@/lib/sources/aggregator';
import { logIngestRun, persistEvents } from '@/lib/db/repo';
import { cacheStats } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron ingest — pulls all sources and persists events to Supabase (when
 * configured). Protect with CRON_SECRET; Vercel Cron sends it automatically
 * as `Authorization: Bearer <secret>` when configured in vercel.json.
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return fail(503, 'CRON_SECRET not configured — ingest endpoint disabled');
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return fail(401, 'unauthorized');
  }

  const started = Date.now();
  try {
    const [{ events }, news] = await Promise.all([getEvents(), getNews()]);
    const upserted = await persistEvents(events);
    await logIngestRun({
      source: 'all',
      fetched: events.length + news.length,
      upserted,
      durationMs: Date.now() - started,
    });
    return ok({ eventsFetched: events.length, newsFetched: news.length, upserted, cache: cacheStats() });
  } catch (err) {
    await logIngestRun({
      source: 'all',
      fetched: 0,
      upserted: 0,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    return fail(500, 'ingest failed');
  }
}
