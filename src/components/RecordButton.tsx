'use client';

import { useLocale } from '@/contexts/LocaleContext';

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export default function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  const { t } = useLocale();

  return (
    <div className="relative group flex flex-col items-center">
      {/* Nền phát sáng tỏa ra xung quanh */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 rounded-full blur-[40px] pointer-events-none transition-all duration-1000 ${
        isRecording 
          ? 'bg-red-500/40 opacity-100 scale-110 animate-pulse' 
          : 'bg-blue-500/20 opacity-0 group-hover:opacity-100 group-hover:scale-100'
      }`} />

      <button
        type="button"
        onClick={onClick}
        className="relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-full focus:outline-none transition-transform duration-500 hover:scale-[1.02] active:scale-95"
        aria-label={isRecording ? t.record.tapStop : t.record.tapRecord}
      >
        {/* Vòng ngoài cùng (Pulsing ring) */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <span className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
          </>
        )}
        {!isRecording && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 group-hover:animate-spin-slow transition-opacity duration-700" style={{ padding: '2px' }}>
             <span className="block w-full h-full bg-white dark:bg-[#0f111a] rounded-full" />
          </span>
        )}

        {/* Nút chính giữa (Glassmorphism) */}
        <div className={`absolute inset-1 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-500 border ${
          isRecording 
            ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
            : 'bg-white/50 dark:bg-black/40 border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] group-hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)] group-hover:bg-white/60 dark:group-hover:bg-white/5'
        }`}>
          {/* Vòng viền Gradient xoay (khi không ghi âm) */}
          {!isRecording && (
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.4)_360deg)] animate-spin opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}

          <div className="relative z-10 flex items-center justify-center">
            {isRecording ? (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse" />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-blue-500 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-transform duration-300 group-hover:scale-110">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" fillOpacity="0.2" />
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="url(#micGradient)" strokeWidth="1.5" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="url(#micGradient)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="micGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>
      </button>

      <div className="mt-6 text-center z-10">
        <span className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 ${
          isRecording ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-400 group-hover:text-blue-500'
        }`}>
          {isRecording ? t.record.tapStop : t.record.tapRecord}
        </span>
      </div>
    </div>
  );
}
