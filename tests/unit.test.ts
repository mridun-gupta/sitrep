import { describe, expect, it } from 'vitest';
import { cached, cacheClear } from '../src/lib/cache';
import { convergentHotspots, findHotspots } from '../src/lib/correlate';
import { cellKey, haversineKm, stableId, stripHtml, truncate } from '../src/lib/geo';
import { extractPlaces as gazetteerExtract } from '../src/lib/sources/gazetteer';
import {
  classifyCategories,
  quakeSeverity,
  reliefSeverity,
  severityFromText,
  toneToTension,
} from '../src/lib/scoring';
import type { SitrepEvent } from '../src/lib/types';

const ev = (partial: Partial<SitrepEvent>): SitrepEvent => ({
  id: 'x',
  source: 'test',
  sourceLabel: 'Test',
  category: 'disaster',
  severity: 'info',
  title: 't',
  time: new Date().toISOString(),
  tags: [],
  ...partial,
});

describe('geo', () => {
  it('haversine: London→Paris ≈ 343km', () => {
    const d = haversineKm({ lat: 51.5, lon: -0.12 }, { lat: 48.85, lon: 2.35 });
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(400);
  });

  it('cellKey buckets coordinates coarsely', () => {
    expect(cellKey(51.5, -0.12, 2.5)).toBe(cellKey(51.6, -0.1, 2.5));
    expect(cellKey(51.5, -0.12, 2.5)).not.toBe(cellKey(55, -0.12, 2.5));
  });

  it('stableId is deterministic and differs on input', () => {
    expect(stableId(['a', 1])).toBe(stableId(['a', 1]));
    expect(stableId(['a', 1])).not.toBe(stableId(['a', 2]));
  });

  it('stripHtml removes tags and decodes entities', () => {
    expect(stripHtml('<p>A &amp; <b>B</b><script>x()</script></p>')).toBe('A & B');
  });

  it('truncate adds ellipsis and bounds length', () => {
    expect(truncate('hello world', 5)).toBe('hell…');
  });
});

describe('gazetteer', () => {
  it('extracts a specific place', () => {
    const hits = gazetteerExtract('Missile strike reported near Kharkiv overnight');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].name).toBe('Kharkiv');
    expect(hits[0].lat).toBeCloseTo(49.99, 1);
  });

  it('falls back to country centroid', () => {
    const hits = gazetteerExtract('New sanctions imposed on Iran');
    expect(hits.some((h) => h.kind === 'country')).toBe(true);
  });

  it('returns empty for placeless text', () => {
    expect(gazetteerExtract('Quarterly earnings beat expectations')).toHaveLength(0);
  });
});

describe('scoring', () => {
  it('classifies conflict keywords', () => {
    expect(classifyCategories('Airstrike kills three in border clash')).toContain('conflict');
  });

  it('classifies disasters', () => {
    expect(classifyCategories('Magnitude 6.1 earthquake hits coast')).toContain('disaster');
  });

  it('severity ranks critical above medium', () => {
    expect(severityFromText('hundreds dead in massive explosion')).toBe('critical');
    expect(severityFromText('warning issued after protest')).toBe('medium');
    expect(severityFromText('routine press briefing')).toBe('info');
  });

  it('quakeSeverity thresholds', () => {
    expect(quakeSeverity(7.2)).toBe('critical');
    expect(quakeSeverity(6.0)).toBe('high');
    expect(quakeSeverity(5.0)).toBe('medium');
    expect(quakeSeverity(4.2)).toBe('low');
    expect(quakeSeverity(2.0)).toBe('info');
  });

  it('toneToTension maps negative tone to higher tension', () => {
    expect(toneToTension(-4)).toBeGreaterThan(toneToTension(4));
    expect(toneToTension(undefined)).toBe(0.3);
  });

  it('reliefSeverity maps alert levels', () => {
    expect(reliefSeverity('alert')).toBe('high');
    expect(reliefSeverity('ongoing')).toBe('medium');
    expect(reliefSeverity('past')).toBe('low');
  });
});

describe('correlation', () => {
  const near = { lat: 33.5, lon: 36.3 };
  const far = { lat: 40.7, lon: -74 };

  it('convergentHotspots requires ≥2 distinct sources', () => {
    const single = [
      ev({ id: 'a', source: 'one', location: near, severity: 'high' }),
      ev({ id: 'b', source: 'one', location: near, severity: 'medium' }),
    ];
    expect(convergentHotspots(single)).toHaveLength(0);

    const multi = [
      ev({ id: 'a', source: 'one', location: near, severity: 'high' }),
      ev({ id: 'b', source: 'two', location: { lat: 33.6, lon: 36.4 }, severity: 'medium' }),
    ];
    const hs = convergentHotspots(multi);
    expect(hs).toHaveLength(1);
    expect(hs[0].sources).toHaveLength(2);
    expect(hs[0].eventCount).toBe(2);
    expect(hs[0].maxSeverity).toBe('high');
  });

  it('distant events form separate cells', () => {
    const hs = findHotspots([
      ev({ id: 'a', source: 'x', location: near }),
      ev({ id: 'b', source: 'y', location: far }),
    ]);
    expect(hs).toHaveLength(2);
  });

  it('score rewards source + category diversity', () => {
    const sameSource = findHotspots([
      ev({ id: 'a', source: 'x', location: near, category: 'disaster' }),
      ev({ id: 'b', source: 'x', location: { lat: 33.55, lon: 36.35 }, category: 'disaster' }),
    ]);
    const diverse = findHotspots([
      ev({ id: 'a', source: 'x', location: near, category: 'disaster' }),
      ev({ id: 'b', source: 'y', location: { lat: 33.55, lon: 36.35 }, category: 'conflict' }),
    ]);
    expect(diverse[0].score).toBeGreaterThan(sameSource[0].score);
  });
});

describe('cache', () => {
  it('serves fresh values from cache without refetching', async () => {
    cacheClear();
    let calls = 0;
    const fetcher = async () => (++calls, 'v');
    const r1 = await cached('k1', 1000, 5000, fetcher);
    const r2 = await cached('k1', 1000, 5000, fetcher);
    expect(r1.cached).toBe(false);
    expect(r2.cached).toBe(true);
    expect(calls).toBe(1);
  });

  it('dedupes concurrent fetches', async () => {
    cacheClear();
    let calls = 0;
    const fetcher = () => new Promise<string>((res) => setTimeout(() => (calls++, res('x')), 20));
    const [a, b] = await Promise.all([cached('k2', 1000, 5000, fetcher), cached('k2', 1000, 5000, fetcher)]);
    expect(calls).toBe(1);
    expect(a.value).toBe('x');
    expect(b.value).toBe('x');
  });
});

describe('gazetteer aliases', () => {
  it('matches alias names', () => {
    const hits = gazetteerExtract('Fighting reported near Odessa');
    expect(hits.some((h) => h.name === 'Odesa')).toBe(true);
  });
});
