import type { EventCategory, Severity } from './types';

/**
 * Keyword-driven classification + severity scoring.
 *
 * This is intentionally transparent — every score in the system can be
 * explained by a rule below. That matters for an OSINT tool: analysts must
 * be able to see *why* something was flagged. Tune lists in one place here.
 */

const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, 'environment'>, string[]> = {
  conflict: [
    'airstrike', 'air strike', 'missile', 'shelling', 'artillery', 'drone strike',
    'killed', 'casualties', 'militia', 'insurgent', 'offensive', 'ceasefire',
    'armed clash', 'shooting', 'bombing', 'explosion', 'hostage', 'terror',
    'troops', 'war ', 'warfare', 'front line', 'invasion', 'rebels',
  ],
  disaster: [
    'earthquake', 'tsunami', 'cyclone', 'hurricane', 'typhoon', 'flood',
    'wildfire', 'volcano', 'eruption', 'landslide', 'avalanche', 'drought',
    'storm surge', 'tornado', 'blizzard', 'heatwave', 'aftershock',
  ],
  humanitarian: [
    'refugee', 'displaced', 'famine', 'aid convoy', 'humanitarian', 'cholera',
    'outbreak', 'epidemic', 'malnutrition', 'relief', 'evacuee', 'unhcr', 'famine',
  ],
  political: [
    'sanction', 'election', 'coup', 'impeach', 'protest', 'referendum',
    'diplomat', 'treaty', 'summit', 'resign', 'parliament', 'martial law',
    'arrest warrant', 'icc', 'veto', 'president', 'prime minister',
  ],
  economic: [
    'market crash', 'recession', 'default', 'inflation', 'central bank',
    'interest rate', 'oil price', 'embargo', 'tariff', 'supply chain',
    'currency', 'stock market', 'imf', 'world bank', 'trade war',
  ],
  cyber: [
    'cyberattack', 'ransomware', 'data breach', 'hackers', 'ddos', 'malware',
    'zero-day', 'outage', 'internet shutdown', 'phishing', 'botnet',
  ],
  infrastructure: [
    'pipeline', 'undersea cable', 'power grid', 'blackout', 'derail',
    'port closure', 'airspace', 'flight cancel', 'nuclear plant', 'dam ',
    'satellite', 'launch failure', 'oil tanker', 'shipping lane', 'suez', 'strait',
  ],
};

const SEVERITY_TRIGGERS: Record<Exclude<Severity, 'info'>, string[]> = {
  critical: [
    'nuclear', 'mass casualty', 'massive', 'declares war', 'invasion',
    'tsunami warning', 'magnitude 7', 'magnitude 8', 'magnitude 9',
    'hundreds dead', 'thousands dead', 'genocide', 'chemical weapon',
    'national emergency', 'catastrophic',
  ],
  high: [
    'killed', 'deaths', 'deadly', 'strike', 'missile', 'state of emergency',
    'evacuation', 'major', 'critical', 'severe', 'hostage', 'coup',
    'magnitude 6', 'category 4', 'category 5', 'sanctions', 'breakthrough',
  ],
  medium: [
    'injured', 'warning', 'alert', 'clashes', 'protest', 'magnitude 5',
    'tropical storm', 'tensions', 'deploys', 'threat', 'fires', 'flood',
  ],
  low: [
    'watch', 'monitor', 'advisory', 'concern', 'talks', 'magnitude 4',
  ],
};

export function classifyCategories(text: string): EventCategory[] {
  const t = text.toLowerCase();
  const hits: EventCategory[] = [];
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) hits.push(cat as EventCategory);
  }
  return hits;
}

export function severityFromText(text: string): Severity {
  const t = text.toLowerCase();
  // Check highest-first so the strongest trigger wins.
  for (const sev of ['critical', 'high', 'medium', 'low'] as const) {
    if (SEVERITY_TRIGGERS[sev].some((w) => t.includes(w))) return sev;
  }
  return 'info';
}

export function quakeSeverity(mag: number): Severity {
  if (mag >= 7) return 'critical';
  if (mag >= 6) return 'high';
  if (mag >= 5) return 'medium';
  if (mag >= 4) return 'low';
  return 'info';
}

/** Map ReliefWeb disaster status to severity. */
export function reliefSeverity(status: string | undefined): Severity {
  switch ((status ?? '').toLowerCase()) {
    case 'alert':
      return 'high';
    case 'ongoing':
    case 'current':
      return 'medium';
    case 'past':
      return 'low';
    default:
      return 'info';
  }
}

/**
 * Convert a GDELT average tone (−10…+10 typical) into a "tension" 0–1 value.
 * Negative tone ⇒ higher tension. Not linear on purpose — tone rarely
 * exceeds ±4, so we stretch that band.
 */
export function toneToTension(tone: number | undefined): number {
  if (tone === undefined || Number.isNaN(tone)) return 0.3;
  const clamped = Math.max(-10, Math.min(10, tone));
  return Math.max(0, Math.min(1, -clamped / 6 + 0.35));
}

/** Higher of two severities. */
export function maxSeverity(a: Severity, b: Severity): Severity {
  const order: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}
