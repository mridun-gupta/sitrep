import { fail, limited, ok, options } from '@/lib/api';
import { EventsQuery, parseQuery } from '@/lib/params';
import { getEvents } from '@/lib/sources/aggregator';
import { SEVERITY_ORDER } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;

  const q = parseQuery(EventsQuery, req.url);
  if (!q) return fail(400, 'invalid query params — see /api/v1/openapi.json');

  const { events } = await getEvents();
  const cutoff = Date.now() - q.hours * 3600_000;

  const filtered = events.filter(
    (e) =>
      (!q.category || e.category === q.category) &&
      SEVERITY_ORDER[e.severity] >= SEVERITY_ORDER[q.minSeverity] &&
      new Date(e.time).getTime() >= cutoff,
  );

  return ok(filtered.slice(0, q.limit), { count: filtered.length });
}

export { options as OPTIONS };
