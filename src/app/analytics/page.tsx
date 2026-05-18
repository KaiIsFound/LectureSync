'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WPMChart from '@/components/WPMChart';
import PacingHeatmap from '@/components/PacingHeatmap';
import FillerWordCounter from '@/components/FillerWordCounter';
import ClarityScore from '@/components/ClarityScore';
import Skeleton from '@/components/ui/Skeleton';
import { getAllSessions, type LectureSession } from '@/lib/storage';
import { useLocale } from '@/contexts/LocaleContext';

export default function AnalyticsPage() {
  const { t } = useLocale();
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getAllSessions();
    setSessions(data);
    if (data.length > 0) setSelectedId(data[0].id);
    setLoading(false);
  }, []);

  const session = sessions.find(s => s.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen px-4 pt-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <h2 className="text-lg font-display font-bold text-text-primary mb-2">{t.pages.analytics.emptyTitle}</h2>
        <p className="text-text-secondary text-sm max-w-xs">{t.pages.analytics.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-3xl mx-auto">
      {/* Lecture selector */}
      <div className="mb-4">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-electric/50 appearance-none cursor-pointer"
        >
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.title} — {new Date(s.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {session && (
        <div className="space-y-4 animate-fade-in" key={selectedId}>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-surface border border-border p-3 text-center">
              <div className="text-lg font-display font-bold text-electric">
                {Math.floor(session.duration / 60)}m {session.duration % 60}s
              </div>
              <div className="text-[10px] text-text-muted">Duration</div>
            </div>
            <div className="rounded-xl bg-surface border border-border p-3 text-center">
              <div className="text-lg font-display font-bold text-purple">
                {session.transcript.split(/\s+/).filter(Boolean).length}
              </div>
              <div className="text-[10px] text-text-muted">Total Words</div>
            </div>
            <div className="rounded-xl bg-surface border border-border p-3 text-center">
              <div className="text-lg font-display font-bold text-success">
                {session.wpmData.length > 0 ? Math.round(session.wpmData.reduce((a, b) => a + b, 0) / session.wpmData.length) : 0}
              </div>
              <div className="text-[10px] text-text-muted">Avg WPM</div>
            </div>
          </div>

          {/* Clarity Score */}
          <ClarityScore score={session.clarityScore} />

          {/* WPM Chart */}
          <WPMChart wpmData={session.wpmData} />

          {/* Pacing Heatmap */}
          <PacingHeatmap wpmData={session.wpmData} />

          {/* Filler Words */}
          <FillerWordCounter fillerWords={session.fillerWords} />
        </div>
      )}
    </div>
  );
}
