export default function ProgressBar({ value, max = 100, className = '' }: { value: number; max?: number; className?: string }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full h-2 bg-surface rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full gradient-bg rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
