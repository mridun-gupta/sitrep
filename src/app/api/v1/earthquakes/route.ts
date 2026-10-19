import { fail, limited, ok, options } from '@/lib/api';
import { QuakesQuery, parseQuery } from '@/lib/params';
import { getEvents } from '@/lib/sources/aggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;

  const q = parseQuery(QuakesQuery, req.url);
  if (!q) return fail(400, 'invalid query params — see /api/v1/openapi.json');

  const { events } = await getEvents();
  const cutoff = Date.now() - q.hours * 3600_000;

  const quakes = events.filter(
    (e) =>
      e.source === 'usgs' &&
      (e.metrics?.magnitude ?? 0) >= q.minMag &&
      new Date(e.time).getTime() >= cutoff,
  );

  return ok(quakes.slice(0, q.limit), { count: quakes.length });
}

export { options as OPTIONS };
