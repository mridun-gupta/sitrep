import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseAdminConfigured, isSupabaseConfigured } from '../env';

/**
 * Optional Supabase persistence.
 *
 * The app is fully functional without Supabase — this module returns null
 * clients when unconfigured and every caller must degrade to memory/local.
 * Two clients:
 *   - `publicClient`  (anon key): used for watchlist reads/writes under RLS.
 *   - `adminClient`   (service role, SERVER ONLY): cron ingest + event cache.
 */

let pub: SupabaseClient | null = null;
let admin: SupabaseClient | null = null;

export function supabasePublic(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!pub) {
    pub = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return pub;
}

export function supabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured) return null;
  if (!admin) {
    admin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return admin;
}

/**
 * Anon client bound to one watchlist owner. Watchlist RLS policies compare
 * each row's watch_key to the `x-watch-key` request header — so each
 * request needs its own client carrying that header.
 */
export function supabaseForWatchKey(watchKey: string): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: { headers: { 'x-watch-key': watchKey } },
    },
  );
}
