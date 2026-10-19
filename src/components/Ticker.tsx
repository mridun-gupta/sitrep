'use client';

import { useEffect, useRef } from 'react';
import type { NewsItem } from '@/lib/types';

/** ~readable scroll speed — news tickers run ≈55 px/s, not a blur. */
const PX_PER_SEC = 55;

/** Bottom headline ticker — CSS marquee, pauses on hover, speed measured
 *  from real content width so it stays readable regardless of item count. */
export function Ticker({ items }: { items: NewsItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const strip = items.slice(0, 30);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const tune = () => {
      // translateX(-50%) loops over half the doubled strip.
      const half = el.scrollWidth / 2;
      el.style.animationDuration = `${Math.max(30, half / PX_PER_SEC)}s`;
    };
    tune();
    const ro = new ResizeObserver(tune);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  if (strip.length === 0) return <div className="h-7 border-t border-edge bg-panel" />;
  const doubled = [...strip, ...strip]; // seamless loop
  return (
    <div className="flex h-7 items-center overflow-hidden border-t border-edge bg-panel">
      <div ref={trackRef} className="ticker-track flex whitespace-nowrap">
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
