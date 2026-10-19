import { fail, limited, ok, options } from '@/lib/api';
import { NewsQuery, parseQuery } from '@/lib/params';
import { getNews } from '@/lib/sources/aggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;

  const q = parseQuery(NewsQuery, req.url);
  if (!q) return fail(400, 'invalid query params — see /api/v1/openapi.json');

  const news = await getNews();
  const cutoff = Date.now() - q.hours * 3600_000;
  const needle = q.q?.toLowerCase();

  const filtered = news.filter(
    (n) =>
      (!q.topic || n.topics.includes(q.topic)) &&
      (!q.source || n.source === q.source || n.sourceLabel.toLowerCase() === q.source.toLowerCase()) &&
      (!needle || n.title.toLowerCase().includes(needle) || n.summary?.toLowerCase().includes(needle)) &&
      new Date(n.published).getTime() >= cutoff,
  );

  return ok(filtered.slice(0, q.limit), { count: filtered.length });
}

export { options as OPTIONS };
