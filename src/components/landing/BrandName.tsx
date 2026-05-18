'use client';

export default function BrandName({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] ${className}`}
    >
      <span className="gradient-text">Lecture</span>
      <span className="text-text-primary">Sync</span>
    </span>
  );
}
