'use client';

import { useRef, useEffect } from 'react';

interface LiveTranscriptProps {
  finalText: string;
  interimText: string;
}

export default function LiveTranscript({ finalText, interimText }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [finalText, interimText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" />
        <h3 className="text-xs font-display font-semibold text-text-secondary uppercase tracking-widest">
          Live Transcript
        </h3>
      </div>
      <div
        className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl bg-surface-glass border border-border p-4 text-sm leading-relaxed min-h-[200px] max-h-[400px]"
      >
        {!finalText && !interimText ? (
          <p className="text-text-muted italic">Start speaking... your words will appear here in real-time.</p>
        ) : (
          <p>
            <span className="text-text-primary">{finalText}</span>
            <span className="text-text-muted">{interimText}</span>
          </p>
        )}
        {/* Vị trí neo để cuộn xuống tự động */}
        <div ref={scrollRef} className="h-1" />
      </div>
    </div>
  );
}
