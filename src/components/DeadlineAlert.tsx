'use client';

import type { Deadline } from '@/lib/storage';

interface DeadlineAlertProps {
  deadlines: Deadline[];
}

export default function DeadlineAlert({ deadlines }: DeadlineAlertProps) {
  if (!deadlines || deadlines.length === 0) {
    return <p className="text-text-muted italic text-sm">No deadlines or assignments mentioned in this lecture.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-danger/10 border border-danger/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 className="font-display font-bold text-danger">Deadlines & Assignments</h3>
        </div>
        <div className="space-y-2">
          {deadlines.map((dl, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="px-2 py-0.5 rounded-md bg-danger/20 text-danger text-xs font-mono font-semibold shrink-0">
                {dl.date}
              </span>
              <span className="text-text-secondary">{dl.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
