import { fail, limited, ok, options } from '@/lib/api';
import { LimitOnlyQuery, parseQuery } from '@/lib/params';
import { getEvents } from '@/lib/sources/aggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;

  const q = parseQuery(LimitOnlyQuery, req.url);
  if (!q) return fail(400, 'invalid query params');

  const { hotspots } = await getEvents();
  // Strip full event lists to keep the payload lean; clients can re-query
  // /api/v1/events for detail.
  const slim = hotspots.slice(0, Math.min(q.limit, 50)).map(({ events, ...h }) => ({
    ...h,
    topTitles: events.slice(0, 3).map((e) => e.title),
  }));

  return ok(slim, { count: hotspots.length });
}

export { options as OPTIONS };
