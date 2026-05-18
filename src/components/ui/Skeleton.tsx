export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-surface via-surface-elevated to-surface bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}
