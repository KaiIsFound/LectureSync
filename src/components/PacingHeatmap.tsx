'use client';

interface PacingHeatmapProps {
  wpmData: number[];
}

export default function PacingHeatmap({ wpmData }: PacingHeatmapProps) {
  if (wpmData.length === 0) {
    return <p className="text-text-muted italic text-sm text-center py-8">No pacing data available.</p>;
  }

  const getColor = (wpm: number) => {
    if (wpm <= 150) return 'bg-success';
    if (wpm <= 180) return 'bg-warning';
    return 'bg-danger';
  };

  const getLabel = (wpm: number) => {
    if (wpm <= 150) return 'Clear';
    if (wpm <= 180) return 'Fast';
    return 'Erratic';
  };

  return (
    <div className="rounded-xl bg-surface border border-border p-4">
      <h3 className="text-sm font-display font-semibold text-text-secondary mb-3">Pacing Heatmap</h3>
      
      <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden mb-3">
        {wpmData.map((wpm, i) => (
          <div
            key={i}
            className={`flex-1 ${getColor(wpm)} opacity-70 hover:opacity-100 transition-opacity cursor-pointer relative group`}
            title={`${wpm} WPM - ${getLabel(wpm)}`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-surface-elevated text-[10px] text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border">
              {wpm} WPM
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success" />
          <span>Clear (≤150)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-warning" />
          <span>Fast (151-180)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-danger" />
          <span>Erratic (&gt;180)</span>
        </div>
      </div>
    </div>
  );
}
