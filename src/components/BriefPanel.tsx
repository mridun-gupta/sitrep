'use client';

import { timeAgo } from '@/lib/format';
import type { SitrepBrief } from '@/lib/types';
import { Empty, Panel, RowSkeleton } from './ui';

export function BriefPanel({
  brief,
  loading,
  error,
  onRefresh,
}: {
  brief: SitrepBrief | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  return (
    <Panel
      title="Situation brief"
      className="h-full"
      right={
        <>
          {brief && (
            <span
              className={`font-mono text-[9px] tracking-wide uppercase ${
                brief.mode === 'ai' ? 'text-accent' : 'text-ink-3'
              }`}
            >
              {brief.mode === 'ai' ? '◈ ai' : '◇ auto'}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="font-mono text-[10px] text-ink-3 hover:text-accent"
            title="Regenerate"
          >
            ⟳
          </button>
        </>
      }
      bodyClassName="panel-in"
    >
      {loading && !brief ? (
        <RowSkeleton rows={6} />
      ) : error && !brief ? (
        <Empty>Brief unavailable right now.</Empty>
      ) : !brief ? (
        <Empty>Waiting for data…</Empty>
      ) : (
        <div className="p-3">
          <p className="text-[13px] leading-snug font-semibold text-ink">
            {brief.headline}
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-3">
            generated {timeAgo(brief.generatedAt)} ago
            {brief.mode === 'deterministic' && ' · set AI_* envs for LLM briefs'}
          </p>
          {brief.sections.map((s) => (
            <div key={s.title} className="mt-3">
              <div className="font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
                {s.title}
              </div>
              <ul className="mt-1 space-y-1">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-1.5 text-[11.5px] leading-snug text-ink-2">
                    <span className="text-ink-3">›</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
