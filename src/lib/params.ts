import { z } from 'zod';
import type { EventCategory, Severity } from './types';

/**
 * Query-param schemas for /api/v1 routes — strict validation at the edge,
 * so source code never sees malformed input.
 */

const CATEGORIES = [
  'conflict', 'disaster', 'humanitarian', 'political',
  'economic', 'cyber', 'infrastructure', 'environment',
] as const satisfies EventCategory[];

const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const satisfies Severity[];

const limit = z.coerce.number().int().min(1).max(500).default(100);
const hours = z.coerce.number().min(1).max(168).default(48);

export const EventsQuery = z.object({
  category: z.enum(CATEGORIES).optional(),
  minSeverity: z.enum(SEVERITIES).default('info'),
  hours,
  limit,
});

export const NewsQuery = z.object({
  topic: z.enum(CATEGORIES).optional(),
  source: z.string().max(60).optional(),
  q: z.string().max(200).optional(),
  hours,
  limit: z.coerce.number().int().min(1).max(300).default(80),
});

export const QuakesQuery = z.object({
  minMag: z.coerce.number().min(0).max(10).default(0),
  hours,
  limit,
});

export const LimitOnlyQuery = z.object({ limit });

export const WatchlistPost = z.object({
  label: z.string().min(1).max(80),
  query: z.string().min(1).max(300),
});

export const WatchlistDelete = z.object({
  query: z.string().min(1).max(300),
});

export type Validated<T extends z.ZodType> = z.infer<T>;

/** Parse a URL's searchParams against a schema; returns null on failure. */
export function parseQuery<T extends z.ZodType>(
  schema: T,
  url: string,
): z.infer<T> | null {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const r = schema.safeParse(params);
  return r.success ? r.data : null;
}
