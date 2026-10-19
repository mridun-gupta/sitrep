'use client';

import type { NewsItem } from '@/lib/types';

/** Bottom headline ticker — pure CSS marquee, pauses on hover. */
export function Ticker({ items }: { items: NewsItem[] }) {
  const strip = items.slice(0, 30);
  if (strip.length === 0) return <div className="h-7 border-t border-edge bg-panel" />;
  const doubled = [...strip, ...strip]; // seamless loop
  return (
    <div className="flex h-7 items-center overflow-hidden border-t border-edge bg-panel">
      <div className="ticker-track flex whitespace-nowrap">
        {doubled.map((n, i) => (
          <a
            key={`${n.id}-${i}`}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-6 font-mono text-[10px] text-ink-2 hover:text-accent"
          >
            <span className="text-ink-3">[{n.sourceLabel}]</span> {n.title}
          </a>
        ))}
      </div>
    </div>
  );
}
