'use client';

import type { Definition } from '@/lib/storage';

interface KeyDefinitionsProps {
  definitions: Definition[];
}

export default function KeyDefinitions({ definitions }: KeyDefinitionsProps) {
  if (!definitions || definitions.length === 0) {
    return <p className="text-text-muted italic text-sm">No key definitions detected in this lecture.</p>;
  }

  return (
    <div className="space-y-3">
      {definitions.map((def, i) => (
        <div
          key={i}
          className="rounded-xl bg-surface border border-border p-4 border-l-4 border-l-electric animate-slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <h4 className="text-sm font-display font-bold text-electric mb-1">{def.term}</h4>
          <p className="text-sm text-text-secondary leading-relaxed">{def.definition}</p>
        </div>
      ))}
    </div>
  );
}
