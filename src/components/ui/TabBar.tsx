'use client';

interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
}

export default function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-glass border border-border w-full overflow-x-auto">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => onChange(index)}
          className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap ${
            index === activeTab
              ? 'bg-electric/15 text-electric glow-sm'
              : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
