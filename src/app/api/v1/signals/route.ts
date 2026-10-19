import { fail, limited, ok, options } from '@/lib/api';
import { LimitOnlyQuery, parseQuery } from '@/lib/params';
import { getSignals } from '@/lib/sources/aggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;

  const q = parseQuery(LimitOnlyQuery, req.url);
  if (!q) return fail(400, 'invalid query params');

  const signals = await getSignals();
  return ok(signals.slice(0, Math.min(q.limit, 100)), { count: signals.length });
}

export { options as OPTIONS };
