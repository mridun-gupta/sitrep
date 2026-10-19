'use client';

import { useMemo, useState } from 'react';
import { timeAgo } from '@/lib/format';
import type { EventCategory, NewsItem } from '@/lib/types';
import { Chip, Empty, Panel, RowSkeleton } from './ui';

const TOPICS: (EventCategory | 'all')[] = [
  'all', 'conflict', 'disaster', 'political', 'humanitarian', 'economic', 'cyber',
];

export interface WatchEntry {
  label: string;
  query: string;
}

export function NewsPanel({
  items,
  loading,
  watchlists,
  onAddWatch,
}: {
  items: NewsItem[];
  loading: boolean;
  watchlists: WatchEntry[];
  onAddWatch: (label: string, query: string) => void;
}) {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const terms = needle.split('|').map((t) => t.trim()).filter(Boolean);
    return items.filter(
      (n) =>
        (topic === 'all' || n.topics.includes(topic)) &&
        (!needle ||
          terms.some((t) =>
            n.title.toLowerCase().includes(t) ||
            n.summary?.toLowerCase().includes(t),
          )),
    );
  }, [items, topic, q]);

  return (
    <Panel
      title="Wire"
      count={filtered.length}
      className="h-full"
      right={
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter…"
          className="h-5 w-24 border border-edge bg-transparent px-1.5 font-mono text-[10px] text-ink outline-none placeholder:text-ink-3 focus:border-accent/60"
        />
      }
      bodyClassName="panel-in"
    >
      <div className="flex flex-wrap gap-1 border-b border-edge p-2">
        {TOPICS.map((t) => (
          <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
          </Chip>
        ))}
      </div>
      {watchlists.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-edge p-2">
          {watchlists.map((w) => (
            <Chip
              key={w.query}
              active={q === w.query}
              onClick={() => setQ((cur) => (cur === w.query ? '' : w.query))}
            >
              ◇ {w.label}
            </Chip>
          ))}
        </div>
      )}
      {loading && items.length === 0 ? (
        <RowSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <Empty>No items match — widen the filter or time window.</Empty>
      ) : (
        <ul className="divide-y divide-edge/60">
          {filtered.map((n) => (
            <li key={n.id} className="px-3 py-2 hover:bg-panel-2">
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[12px] leading-snug text-ink hover:text-accent"
              >
                {n.title}
              </a>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-ink-3">
                <span className="text-ink-2">{n.sourceLabel}</span>
                <span>{timeAgo(n.published)}</span>
                {n.topics.slice(0, 2).map((t) => (
                  <span key={t} className="text-ink-3">#{t}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="sticky bottom-0 border-t border-edge bg-panel px-2 py-1">
        <button
          onClick={() => {
            const label = prompt('Watch name:', q.slice(0, 40) || 'watch');
            if (label && q.trim()) onAddWatch(label.trim(), q.trim());
          }}
          className="w-full font-mono text-[10px] text-ink-3 hover:text-accent"
          disabled={!q.trim()}
          title="Save the current filter as a watch"
        >
          + save filter as watch
        </button>
      </div>
    </Panel>
  );
}
