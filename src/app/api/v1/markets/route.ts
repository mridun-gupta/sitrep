import { limited, ok, options } from '@/lib/api';
import { getMarkets } from '@/lib/sources/aggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;
  return ok(await getMarkets());
}

export { options as OPTIONS };
