'use client';

interface FillerWordCounterProps {
  fillerWords: Record<string, number>;
}

export default function FillerWordCounter({ fillerWords }: FillerWordCounterProps) {
  const entries = Object.entries(fillerWords).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, count]) => acc + count, 0);
  const maxCount = entries.length > 0 ? entries[0][1] : 0;

  if (total === 0) {
    return (
      <div className="rounded-xl bg-surface border border-border p-4 text-center">
        <h3 className="text-sm font-display font-semibold text-text-secondary mb-2">Filler Words</h3>
        <p className="text-text-muted text-sm">No filler words detected!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-text-secondary">Filler Words</h3>
        <span className="text-2xl font-display font-bold text-warning">{total}</span>
      </div>
      <div className="space-y-2">
        {entries.map(([word, count]) => (
          <div key={word} className="flex items-center gap-3">
            <span className="text-xs text-text-muted font-mono w-16 shrink-0">&ldquo;{word}&rdquo;</span>
            <div className="flex-1 h-3 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-warning/60 rounded-full transition-all duration-500"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-muted font-mono w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
