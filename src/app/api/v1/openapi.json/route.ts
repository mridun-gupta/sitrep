import { limited, ok, options } from '@/lib/api';
import { OPENAPI_SPEC } from '@/lib/openapi-spec';

export const runtime = 'nodejs';

export function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;
  return ok(OPENAPI_SPEC);
}

export { options as OPTIONS };
