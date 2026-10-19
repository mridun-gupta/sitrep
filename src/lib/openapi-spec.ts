/**
 * Hand-maintained OpenAPI 3.1 description of the public API.
 * Served at /api/v1/openapi.json — agents and codegen tools can consume it.
 */

export const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Sitrep API',
    version: '1.0.0',
    description:
      'Public, read-only global intelligence API. Normalised events, news, ' +
      'earthquakes, tension signals, correlation hotspots, market radar and ' +
      'AI/deterministic situation briefs. No authentication required for reads.',
    license: { name: 'AGPL-3.0', url: 'https://www.gnu.org/licenses/agpl-3.0' },
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/events': {
      get: {
        summary: 'Normalised geolocated events',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['conflict', 'disaster', 'humanitarian', 'political', 'economic', 'cyber', 'infrastructure', 'environment'] } },
          { name: 'minSeverity', in: 'query', schema: { type: 'string', enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' } },
          { name: 'hours', in: 'query', schema: { type: 'integer', default: 48, maximum: 168 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100, maximum: 500 } },
        ],
        responses: { '200': { description: 'SitrepEvent[]' } },
      },
    },
    '/news': {
      get: {
        summary: 'Merged news wire (RSS + GDELT)',
        parameters: [
          { name: 'topic', in: 'query', schema: { type: 'string' } },
          { name: 'source', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'hours', in: 'query', schema: { type: 'integer', default: 48 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 80, maximum: 300 } },
        ],
        responses: { '200': { description: 'NewsItem[]' } },
      },
    },
    '/earthquakes': {
      get: {
        summary: 'USGS earthquakes',
        parameters: [
          { name: 'minMag', in: 'query', schema: { type: 'number', default: 0 } },
          { name: 'hours', in: 'query', schema: { type: 'integer', default: 48 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
        ],
        responses: { '200': { description: 'SitrepEvent[]' } },
      },
    },
    '/hotspots': {
      get: { summary: 'Cross-source correlation hotspots', parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }], responses: { '200': { description: 'Hotspot[]' } } },
    },
    '/signals': {
      get: { summary: 'News tension localities (GDELT tone; falls back to event-density derivation)', parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }], responses: { '200': { description: 'SignalPoint[]' } } },
    },
    '/markets': {
      get: { summary: 'Market radar (crypto + indices)', responses: { '200': { description: 'MarketQuote[]' } } },
    },
    '/sources': {
      get: { summary: 'Source catalog + health + capabilities', responses: { '200': { description: 'Source registry with live health' } } },
    },
    '/brief': {
      get: { summary: 'Current situation brief (AI or deterministic)', responses: { '200': { description: 'SitrepBrief' } } },
    },
    '/watchlist': {
      get: { summary: 'List watchlist entries (requires X-Watch-Key header)', responses: { '200': { description: 'WatchlistRow[]' } } },
      post: { summary: 'Add a watchlist query', responses: { '200': { description: 'Created' }, '503': { description: 'Persistence not configured' } } },
      delete: { summary: 'Remove a watchlist query', responses: { '200': { description: 'Deleted' } } },
    },
  },
} as const;
