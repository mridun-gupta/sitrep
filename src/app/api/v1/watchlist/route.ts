import { NextResponse } from 'next/server';
import { fail, limited, ok, options, CORS } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/env';
import { WatchlistDelete, WatchlistPost } from '@/lib/params';
import { addWatchlist, deleteWatchlist, listWatchlists } from '@/lib/db/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function watchKey(req: Request): string | null {
  const k = req.headers.get('x-watch-key');
  return k && UUID_RE.test(k) ? k : null;
}

export async function GET(req: Request) {
  const throttle = limited(req);
  if (throttle) return throttle;
  if (!isSupabaseConfigured) return fail(503, 'persistence not configured — watchlists run in local mode');
  const key = watchKey(req);
  if (!key) return fail(401, 'missing or invalid X-Watch-Key header (UUID expected)');
  return ok(await listWatchlists(key));
}

export async function POST(req: Request) {
  const throttle = limited(req, 30);
  if (throttle) return throttle;
  if (!isSupabaseConfigured) return fail(503, 'persistence not configured — watchlists run in local mode');
  const key = watchKey(req);
  if (!key) return fail(401, 'missing or invalid X-Watch-Key header (UUID expected)');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, 'invalid JSON body');
  }
  const parsed = WatchlistPost.safeParse(body);
  if (!parsed.success) return fail(400, 'label (≤80 chars) and query (≤300 chars) required');

  const added = await addWatchlist({ watch_key: key, ...parsed.data });
  if (!added) return fail(502, 'watchlist write failed');
  return NextResponse.json({ ok: true }, { status: 201, headers: CORS });
}

export async function DELETE(req: Request) {
  const throttle = limited(req, 30);
  if (throttle) return throttle;
  if (!isSupabaseConfigured) return fail(503, 'persistence not configured — watchlists run in local mode');
  const key = watchKey(req);
  if (!key) return fail(401, 'missing or invalid X-Watch-Key header (UUID expected)');

  const q = new URL(req.url).searchParams.get('query');
  const parsed = WatchlistDelete.safeParse({ query: q });
  if (!parsed.success) return fail(400, 'query param required');

  await deleteWatchlist(key, parsed.data.query);
  return NextResponse.json({ ok: true }, { headers: CORS });
}

export { options as OPTIONS };
