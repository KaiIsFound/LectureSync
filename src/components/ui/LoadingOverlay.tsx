'use client';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Processing...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="absolute w-64 h-64 rounded-full bg-electric/10 blur-3xl animate-pulse" />

      {/* Spinner */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-border" />
        <div
          className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-electric"
          style={{ animation: 'spin-slow 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }}
        />
        <div
          className="absolute inset-1 w-14 h-14 rounded-full border-2 border-transparent border-b-blue"
          style={{ animation: 'spin-slow 1.8s cubic-bezier(0.5, 0, 0.5, 1) infinite reverse' }}
        />
      </div>

      <p className="text-text-primary font-display font-semibold text-lg mb-1">{message}</p>
      <p className="text-text-muted text-xs tracking-wide">This may take a few seconds</p>
    </div>
  );
}
