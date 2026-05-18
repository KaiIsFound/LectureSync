'use client';

import Skeleton from '@/components/ui/Skeleton';

interface ExplanationChunk {
  id: number;
  text: string;
  timestamp: string;
}

interface AIExplanationProps {
  chunks: ExplanationChunk[];
  isLoading: boolean;
}

export default function AIExplanation({ chunks, isLoading }: AIExplanationProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-purple animate-pulse" />
        <h3 className="text-sm font-display font-semibold text-text-secondary uppercase tracking-wider">
          AI Understanding
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto rounded-xl bg-surface/50 border border-border p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {chunks.length === 0 && !isLoading ? (
          <p className="text-text-muted italic text-sm">
            AI explanations will appear here as you speak. The AI processes your words every 30 seconds.
          </p>
        ) : (
          <>
            {chunks.map((chunk) => (
              <div key={chunk.id} className="animate-slide-in-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-text-muted font-mono">{chunk.timestamp}</span>
                </div>
                <div className="pl-3 border-l-2 border-purple/50 text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {chunk.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="space-y-2 animate-fade-in">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
