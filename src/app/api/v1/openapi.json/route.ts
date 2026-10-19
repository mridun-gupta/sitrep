import { ok, options } from '@/lib/api';
import { OPENAPI_SPEC } from '@/lib/openapi-spec';

export const runtime = 'nodejs';

export function GET() {
  return ok(OPENAPI_SPEC);
}

export { options as OPTIONS };
