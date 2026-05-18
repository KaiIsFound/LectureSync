'use client';

type BrandLogoProps = {
  size?: number;
  className?: string;
  showGlow?: boolean;
  priority?: boolean;
};

export default function BrandLogo({
  size = 36,
  className = '',
  showGlow = false,
}: BrandLogoProps) {
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-blue-500/20 dark:bg-indigo-500/20 blur-xl animate-[pulse-glow_3s_ease-in-out_infinite]"
          aria-hidden
        />
      )}
      <svg
        width={size * 0.8}
        height={size * 0.8}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10 text-brand dark:text-blue-400 drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <polyline points="10 2 10 10 13 7 16 10 16 2" />
      </svg>
    </div>
  );
}
