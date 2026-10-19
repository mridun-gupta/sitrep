import { env, isAiConfigured } from '../env';
import { cached } from '../cache';
import { truncate } from '../geo';
import { getEvents, getNews } from '../sources/aggregator';
import type { SitrepBrief, SitrepEvent, NewsItem } from '../types';
import { z } from 'zod';

/**
 * Situation brief generator.
 *
 * Two modes:
 *  - 'ai': any OpenAI-compatible /chat/completions endpoint (OpenRouter,
 *     OpenAI, Ollama at http://localhost:11434/v1, LM Studio…). Strict JSON
 *     output validated with zod — the model can be wrong, never malformed.
 *  - 'deterministic': zero-dependency fallback digest that always works, so
 *     the Brief panel is never empty on a keyless install.
 */

const BriefSchema = z.object({
  headline: z.string().max(220),
  sections: z
    .array(
      z.object({
        title: z.string().max(60),
        points: z.array(z.string().max(300)).max(5),
      }),
    )
    .max(5),
});

/**
 * Shared cached brief — the only entry point callers should use.
 * One cache key ('brief:latest', 10m fresh / 40m stale) serves the page,
 * REST and MCP consumers, so a request burst can never fan out into
 * repeated paid LLM calls.
 */
export function getBrief() {
  return cached('brief:latest', 10 * 60_000, 40 * 60_000, async () => {
    const [{ events }, news] = await Promise.all([getEvents(), getNews()]);
    return generateBrief(events, news);
  });
}

export async function generateBrief(
  events: SitrepEvent[],
  news: NewsItem[],
): Promise<SitrepBrief> {
  const sources = buildSourceList(events, news);
  if (isAiConfigured) {
    try {
      const brief = await aiBrief(events, news);
      if (brief) return { ...brief, mode: 'ai', generatedAt: new Date().toISOString(), sources };
    } catch {
      // fall through to deterministic — AI is a bonus, never a dependency
    }
  }
  return {
    ...deterministicBrief(events, news),
    mode: 'deterministic',
    generatedAt: new Date().toISOString(),
    sources,
  };
}

// ── AI mode ─────────────────────────────────────────────────────────────

async function aiBrief(events: SitrepEvent[], news: NewsItem[]) {
  const eventLines = events
    .slice(0, 25)
    .map((e) => `- [${e.category}/${e.severity}] ${e.title} (${e.location?.name ?? 'unlocated'})`)
    .join('\n');
  const newsLines = news
    .slice(0, 20)
    .map((n) => `- ${n.title} (${n.sourceLabel})`)
    .join('\n');

  const prompt = `You are an intelligence briefing analyst. From the events and headlines below, write a concise situational brief for a well-informed general reader.

Rules:
- Neutral, factual tone. No speculation beyond "watch for…" statements.
- Group related items; do not list every event.
- Output STRICT JSON only, matching: {"headline": string, "sections": [{"title": string, "points": string[]}]}
- 2–4 sections, 2–4 points each. Points are single sentences.
- Headline = the single most important development right now.

EVENTS (geolocated):
${eventLines || '(none)'}

HEADLINES:
${newsLines || '(none)'}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30_000);
  let content: string | undefined;
  try {
    const r = await fetch(`${env.AI_BASE_URL!.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(env.AI_API_KEY ? { authorization: `Bearer ${env.AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    if (r.ok) {
      const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      content = json.choices?.[0]?.message?.content;
    }
  } finally {
    clearTimeout(t);
  }

  if (!content) return null;
  const parsed = BriefSchema.safeParse(JSON.parse(extractJson(content)));
  if (!parsed.success) return null;
  return { headline: parsed.data.headline, sections: parsed.data.sections };
}

function extractJson(s: string): string {
  // Models sometimes wrap JSON in ``` fences or add prose — grab the object.
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON in AI output');
  return s.slice(start, end + 1);
}

// ── Deterministic fallback ──────────────────────────────────────────────

function deterministicBrief(events: SitrepEvent[], news: NewsItem[]) {
  const bySev = [...events].sort(
    (a, b) => sevRank(b.severity) - sevRank(a.severity) || b.time.localeCompare(a.time),
  );
  const top = bySev.slice(0, 5);
  const headline = top[0]
    ? `${top[0].title}${top[0].location?.name ? ` — ${top[0].location.name}` : ''}`
    : 'No significant events in the current window';

  const sections: { title: string; points: string[] }[] = [];

  const critHigh = top.filter((e) => sevRank(e.severity) >= sevRank('high'));
  if (critHigh.length) {
    sections.push({
      title: 'Priority developments',
      points: critHigh.map((e) => e.title),
    });
  }

  // Category rollups.
  const cats = new Map<string, number>();
  for (const e of events) cats.set(e.category, (cats.get(e.category) ?? 0) + 1);
  const catSummary = [...cats.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c, n]) => `${n} ${c} event${n === 1 ? '' : 's'} tracked`);
  if (catSummary.length) sections.push({ title: 'Activity by domain', points: catSummary });

  if (news.length) {
    sections.push({
      title: 'Leading coverage',
      points: news.slice(0, 4).map((n) => truncate(n.title, 200)),
    });
  }

  return { headline, sections };
}

function sevRank(s: string) {
  return ['info', 'low', 'medium', 'high', 'critical'].indexOf(s);
}

function buildSourceList(events: SitrepEvent[], news: NewsItem[]) {
  const set = new Map<string, string | undefined>();
  for (const e of events) set.set(e.sourceLabel, e.url);
  for (const n of news) set.set(n.sourceLabel, n.link);
  return [...set.entries()].slice(0, 12).map(([label, url]) => ({ label, url }));
}
