import { fail, limited, ok, options } from '@/lib/api';
import { getBrief } from '@/lib/ai/brief';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const throttle = limited(req, 20); // AI calls are expensive — tighter limit
  if (throttle) return throttle;

  try {
    const { value, cached: wasCached } = await getBrief();
    return ok(value, { cached: wasCached });
  } catch {
    return fail(500, 'brief generation failed');
  }
}

export { options as OPTIONS };
