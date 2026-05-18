'use client';

import { useLocale } from '@/contexts/LocaleContext';

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export default function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-full"
      aria-label={isRecording ? t.record.tapStop : t.record.tapRecord}
    >
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl ${
          isRecording
            ? 'opacity-80 scale-150 animate-pulse-glow'
            : 'opacity-0 group-hover:opacity-50 group-hover:scale-125'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45), rgba(99, 102, 241, 0.2), transparent)',
        }}
        aria-hidden
      />

      <div
        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full p-[3px] transition-all duration-500 gradient-bg ${
          isRecording ? 'animate-pulse-glow' : 'group-hover:scale-105'
        }`}
      >
        <div className="w-full h-full rounded-full bg-surface-elevated flex items-center justify-center border border-border shadow-lg">
          {isRecording ? (
            <div className="w-8 h-8 rounded-[6px] bg-danger transition-all duration-300" />
          ) : (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              className="text-brand transition-transform duration-300 group-hover:scale-110"
              aria-hidden
            >
              <path
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                fill="currentColor"
                fillOpacity="0.15"
              />
              <path
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M19 10v2a7 7 0 0 1-14 0v-2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <span
          className={`text-xs font-semibold tracking-wide ${
            isRecording ? 'text-danger' : 'text-text-secondary group-hover:text-text-primary'
          }`}
        >
          {isRecording ? t.record.tapStop.toUpperCase() : t.record.tapRecord.toUpperCase()}
        </span>
      </div>
    </button>
  );
}
