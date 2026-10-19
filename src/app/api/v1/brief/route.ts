import { cached } from '@/lib/cache';
import { fail, limited, ok, options } from '@/lib/api';
import { generateBrief } from '@/lib/ai/brief';
import { getEvents, getNews } from '@/lib/sources/aggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req, 20); // AI calls are expensive — tighter limit
  if (throttle) return throttle;

  try {
    const { value, cached: wasCached } = await cached(
      'brief:latest',
      10 * 60_000,
      40 * 60_000,
      async () => {
        const [{ events }, news] = await Promise.all([getEvents(), getNews()]);
        return generateBrief(events, news);
      },
    );
    return ok(value, { cached: wasCached });
  } catch {
    return fail(500, 'brief generation failed');
  }
}

export { options as OPTIONS };
