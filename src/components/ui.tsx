import type { ReactNode } from 'react';
import type { EventCategory, Severity } from '@/lib/types';

/** Shared visual primitives — console chrome, hairline, flat, one accent. */

export function Panel({
  title,
  count,
  right,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  count?: number;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col border border-edge bg-panel ${className}`}
    >
      <header className="flex h-8 shrink-0 items-center gap-2 border-b border-edge px-3">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-2 uppercase">
          {title}
        </span>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-ink-3">{count}</span>
        )}
        <span className="ml-auto flex items-center gap-2">{right}</span>
      </header>
      <div className={`scroll-slim min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}

const SEV_COLOR: Record<Severity, string> = {
  info: 'bg-sev-info',
  low: 'bg-sev-low',
  medium: 'bg-sev-medium',
  high: 'bg-sev-high',
  critical: 'bg-sev-critical',
};

export function SeverityDot({ sev, pulse = false }: { sev: Severity; pulse?: boolean }) {
  return (
    <span
      className={`inline-block size-1.5 rounded-full ${SEV_COLOR[sev]} ${pulse && (sev === 'high' || sev === 'critical') ? 'live-dot' : ''}`}
      title={sev}
    />
  );
}

const CAT_STYLE: Record<EventCategory, string> = {
  conflict: 'text-cat-conflict border-cat-conflict/40',
  disaster: 'text-cat-disaster border-cat-disaster/40',
  humanitarian: 'text-cat-humanitarian border-cat-humanitarian/40',
  political: 'text-cat-political border-cat-political/40',
  economic: 'text-cat-economic border-cat-economic/40',
  cyber: 'text-cat-cyber border-cat-cyber/40',
  infrastructure: 'text-cat-infrastructure border-cat-infrastructure/40',
  environment: 'text-cat-environment border-cat-environment/40',
};

export function CategoryTag({ cat }: { cat: EventCategory }) {
  return (
    <span
      className={`inline-block border px-1 font-mono text-[9px] tracking-wide uppercase ${CAT_STYLE[cat]}`}
    >
      {cat}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-6 border px-2 font-mono text-[10px] tracking-wide transition-colors ${
        active
          ? 'border-accent/60 bg-accent/10 text-accent'
          : 'border-edge text-ink-3 hover:border-edge-2 hover:text-ink-2'
      }`}
    >
      {children}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-xs text-ink-3">
      {children}
    </div>
  );
}

export function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 animate-pulse bg-edge/60" style={{ width: `${88 - i * 9}%` }} />
      ))}
    </div>
  );
}
