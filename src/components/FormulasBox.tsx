'use client';

import type { Formula } from '@/lib/storage';

interface FormulasBoxProps {
  formulas: Formula[];
}

export default function FormulasBox({ formulas }: FormulasBoxProps) {
  if (!formulas || formulas.length === 0) {
    return <p className="text-text-muted italic text-sm">No formulas or equations detected in this lecture.</p>;
  }

  return (
    <div className="space-y-3">
      {formulas.map((formula, i) => (
        <div
          key={i}
          className="rounded-xl bg-electric/5 border border-electric/20 p-4 animate-slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <h4 className="text-sm font-display font-bold text-electric mb-2">{formula.name}</h4>
          <div className="bg-surface rounded-lg p-3 mb-2 font-mono text-sm text-text-primary text-center">
            {formula.formula}
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{formula.explanation}</p>
        </div>
      ))}
    </div>
  );
}
