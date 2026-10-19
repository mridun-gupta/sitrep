import { z } from 'zod';

/**
 * Central, validated environment configuration.
 *
 * Sitrep runs fully with ZERO env vars — every integration below is optional
 * and the app degrades gracefully when it is absent. See .env.example.
 */
const EnvSchema = z.object({
  // --- Persistence (optional) -------------------------------------------
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  /** Server-only. Never expose to the client. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // --- AI briefs (any OpenAI-compatible endpoint: OpenRouter, Ollama…) ---
  AI_BASE_URL: z.url().optional(), // e.g. https://openrouter.ai/api/v1 or http://localhost:11434/v1
  AI_API_KEY: z.string().optional(), // may be empty for local Ollama
  AI_MODEL: z.string().optional(),

  // --- Optional keyed sources -------------------------------------------
  NEWSAPI_KEY: z.string().optional(),
  ACLED_KEY: z.string().optional(),
  ACLED_EMAIL: z.string().optional(),
  /** Free per-app token — request at https://apidoc.reliefweb.int/parameters#appname */
  RELIEFWEB_APPNAME: z.string().optional(),

  // --- Ops ---------------------------------------------------------------
  /** Bearer secret protecting /api/cron/*. Required in production if cron is exposed. */
  CRON_SECRET: z.string().optional(),
  /** Public base URL used inside generated docs/links. */
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail loudly at boot rather than mysteriously at request time.
  const issues = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration — ${issues}`);
}

export const env = parsed.data;

export const isSupabaseConfigured =
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseAdminConfigured =
  isSupabaseConfigured && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

export const isAiConfigured =
  Boolean(env.AI_BASE_URL && env.AI_MODEL); // AI_API_KEY optional (Ollama)

export const SITE_URL =
  env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
