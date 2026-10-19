import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { generateBrief } from '@/lib/ai/brief';
import {
  getEvents,
  getMarkets,
  getNews,
  getSignals,
} from '@/lib/sources/aggregator';
import { SEVERITY_ORDER, type EventCategory, type Severity } from '@/lib/types';

/**
 * MCP server — exposes Sitrep's intelligence feeds as tools for AI agents
 * (Claude, Cursor, any MCP client). Stateless Streamable HTTP transport.
 * Point a client at https://<host>/mcp — see docs/ai/mcp.md.
 */

const CATEGORIES = z.enum([
  'conflict', 'disaster', 'humanitarian', 'political',
  'economic', 'cyber', 'infrastructure', 'environment',
]);

const SEVERITIES = z.enum(['info', 'low', 'medium', 'high', 'critical']);

function asText(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    'sitrep_events',
    {
      title: 'Global events',
      description:
        'Normalised, geolocated global events (conflict, disasters, humanitarian, ' +
        'infrastructure…). Aggregated from USGS, NASA EONET, ReliefWeb and GDELT.',
      inputSchema: {
        category: CATEGORIES.optional(),
        minSeverity: SEVERITIES.default('info'),
        hours: z.number().min(1).max(168).default(48),
        limit: z.number().min(1).max(200).default(50),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ category, minSeverity, hours, limit }) => {
      const { events } = await getEvents();
      const cutoff = Date.now() - (hours ?? 48) * 3600_000;
      const out = events.filter(
        (e) =>
          (!category || e.category === (category as EventCategory)) &&
          SEVERITY_ORDER[e.severity] >= SEVERITY_ORDER[minSeverity as Severity] &&
          new Date(e.time).getTime() >= cutoff,
      );
      return asText(out.slice(0, limit));
    },
  );

  server.registerTool(
    'sitrep_news',
    {
      title: 'News wire',
      description:
        'Merged global news wire from curated RSS feeds and GDELT. Optionally ' +
        'full-text filter with q.',
      inputSchema: {
        q: z.string().max(200).optional(),
        topic: CATEGORIES.optional(),
        limit: z.number().min(1).max(100).default(30),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ q, topic, limit }) => {
      const news = await getNews();
      const needle = q?.toLowerCase();
      const out = news.filter(
        (n) =>
          (!topic || n.topics.includes(topic as string)) &&
          (!needle || n.title.toLowerCase().includes(needle)),
      );
      return asText(out.slice(0, limit));
    },
  );

  server.registerTool(
    'sitrep_earthquakes',
    {
      title: 'Earthquakes',
      description: 'Recent USGS earthquakes, filterable by minimum magnitude.',
      inputSchema: {
        minMag: z.number().min(0).max(10).default(4.5),
        limit: z.number().min(1).max(200).default(50),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ minMag, limit }) => {
      const { events } = await getEvents();
      const out = events.filter(
        (e) => e.source === 'usgs' && (e.metrics?.magnitude ?? 0) >= (minMag ?? 0),
      );
      return asText(out.slice(0, limit));
    },
  );

  server.registerTool(
    'sitrep_hotspots',
    {
      title: 'Correlation hotspots',
      description:
        'Places where ≥2 independent sources report concurrent activity — ' +
        'higher score = stronger cross-source convergence.',
      inputSchema: { limit: z.number().min(1).max(50).default(15) },
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) => {
      const { hotspots } = await getEvents();
      return asText(
        hotspots.slice(0, limit).map(({ events, ...h }) => ({
          ...h,
          topTitles: events.slice(0, 3).map((e) => e.title),
        })),
      );
    },
  );

  server.registerTool(
    'sitrep_signals',
    {
      title: 'Tension signals',
      description:
        'Localities with elevated negative-toned news coverage (GDELT-derived).',
      inputSchema: { limit: z.number().min(1).max(100).default(25) },
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) => {
      return asText((await getSignals()).slice(0, limit));
    },
  );

  server.registerTool(
    'sitrep_markets',
    {
      title: 'Market radar',
      description: 'Crypto prices (24h change) and major global indices.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => asText(await getMarkets()),
  );

  server.registerTool(
    'sitrep_brief',
    {
      title: 'Situation brief',
      description:
        'Current AI-generated (or deterministic fallback) situational brief ' +
        'with headline, sections and cited sources.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const [{ events }, news] = await Promise.all([getEvents(), getNews()]);
      return asText(await generateBrief(events, news));
    },
  );
});

export { handler as GET, handler as POST };
