import { stableId } from '../geo';
import type { Severity, SitrepEvent } from '../types';
import { fetchJson } from './http';

/**
 * NOAA Space Weather Prediction Center alerts — geomagnetic storms,
 * solar radiation storms, radio blackouts. Global effects (power grids,
 * HF radio, satellites) so events are unlocated by design — the API and
 * brief still see them; the map skips locationless events.
 *
 * Product codes: WAT-prefixed = watch (conditions possible), ALT/WAR-prefixed
 * = warning (active), SUM-prefixed = routine daily summary (dropped as noise).
 */

const URL_ALERTS = 'https://services.swpc.noaa.gov/products/alerts.json';
const MAX_ITEMS = 12;

interface SwpcAlert {
  product_id: string;
  issue_datetime: string;
  message: string;
}

const CODE_LABEL: [RegExp, string][] = [
  [/^ALTK\d/, 'Geomagnetic K-index warning'],
  [/^ALTGSW/, 'Geomagnetic storm warning'],
  [/^ALTEF\d/, 'Electron flux warning'],
  [/^ALTTP\d/, 'Proton event warning'],
  [/^ALTXMF/, 'X-ray flux warning'],
  [/^WATA\d+/, 'Geomagnetic watch'],
  [/^WARK\d+/, 'Geomagnetic watch (K-index)'],
  [/^WARC\d+/, 'Radio blackout watch'],
  [/^ALTSPC/, 'Space weather alert'],
];

function severityOf(code: string, message: string): Severity {
  const m = message.toLowerCase();
  if (/g5|g4|severe|extreme|s4|s5|r4|r5/.test(m)) return 'high';
  if (code.startsWith('ALT') || code.startsWith('WAR')) return 'medium';
  if (code.startsWith('WAT')) return 'low';
  return 'info';
}

export async function fetchSpaceWeather(): Promise<SitrepEvent[]> {
  const data = await fetchJson<SwpcAlert[]>(URL_ALERTS, { timeoutMs: 15_000 });
  const out: SitrepEvent[] = [];

  for (const a of data ?? []) {
    const code = /Space Weather Message Code:\s*(\w+)/.exec(a.message)?.[1] ?? '';
    if (code.startsWith('SUM')) continue; // routine daily summaries
    const label = CODE_LABEL.find(([re]) => re.test(code))?.[1] ?? 'Space weather bulletin';
    const body = a.message.split(/\n{2,}/)[1]?.replace(/\s+/g, ' ').trim();

    out.push({
      id: stableId(['swpc', a.product_id]),
      source: 'swpc',
      sourceLabel: 'NOAA SWPC',
      category: 'infrastructure',
      severity: severityOf(code, a.message),
      title: `${label} (${code || 'SWPC'})`,
      summary: body?.slice(0, 300),
      url: 'https://www.swpc.noaa.gov/products/alerts-watches-and-warnings',
      time: new Date(a.issue_datetime.replace(' ', 'T') + 'Z').toISOString(),
      tags: ['space-weather', code.toLowerCase()].filter(Boolean),
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}
