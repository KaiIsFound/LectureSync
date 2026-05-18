'use client';

interface RecordingStatsProps {
  duration: number;
  wordCount: number;
}

export default function RecordingStats({ duration, wordCount }: RecordingStatsProps) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const wpm = duration > 5 ? Math.round(wordCount / (duration / 60)) : 0;

  return (
    <div className="inline-flex items-center gap-2 p-1 rounded-2xl bg-surface-glass border border-border">
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
        <span className="text-sm font-mono font-semibold text-text-primary">{timeStr}</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <span className="text-sm font-mono font-semibold text-text-primary">
          {wpm} <span className="text-text-muted text-[10px]">WPM</span>
        </span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <span className="text-sm font-mono font-semibold text-text-primary">
          {wordCount} <span className="text-text-muted text-[10px]">words</span>
        </span>
      </div>
    </div>
  );
}
