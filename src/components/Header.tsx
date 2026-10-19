'use client';

import { Crosshair, SlidersHorizontal } from '@phosphor-icons/react';
import { utcClock } from '@/lib/format';
import { useNow } from '@/lib/hooks';

export function Header({
  eventCount,
  degradedCount,
  onOpenStatus,
}: {
  eventCount: number;
  degradedCount: number;
  onOpenStatus: () => void;
}) {
  const now = useNow();
  return (
    <header className="flex h-10 items-center gap-3 border-b border-edge bg-panel px-3">
      <div className="flex items-center gap-2">
        <Crosshair size={18} weight="bold" className="text-accent" />
        <span className="font-mono text-sm font-semibold tracking-[0.22em] text-ink">
          SITREP
        </span>
        <span className="hidden font-mono text-[9px] text-ink-3 sm:inline">
          GLOBAL INTELLIGENCE CONSOLE
        </span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden items-center gap-1.5 font-mono text-[10px] text-ink-3 md:flex">
          <span className="live-dot size-1.5 rounded-full bg-cat-economic" />
          <span>{eventCount} signals</span>
        </div>
        <button
          onClick={onOpenStatus}
          className="flex items-center gap-1.5 font-mono text-[10px] text-ink-3 hover:text-ink"
          title="Sources & status"
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">sources</span>
          {degradedCount > 0 && (
            <span className="border border-sev-high/60 px-1 text-[9px] text-sev-high">
              {degradedCount}
            </span>
          )}
        </button>
        <div className="font-mono text-[11px] tracking-wider text-ink-2 tabular-nums">
          {now === null ? '--:--:--Z' : utcClock(now)}
        </div>
      </div>
    </header>
  );
}
