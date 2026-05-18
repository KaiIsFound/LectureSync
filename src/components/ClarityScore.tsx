'use client';

import { useEffect, useRef, useState } from 'react';

interface ClarityScoreProps {
  score: number;
}

export default function ClarityScore({ score }: ClarityScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const svgRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#06d6a0';
    if (score >= 60) return '#f4a261';
    return '#e63946';
  };

  return (
    <div className="rounded-xl bg-surface border border-border p-4 flex flex-col items-center">
      <h3 className="text-sm font-display font-semibold text-text-secondary mb-4">Clarity Score</h3>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            ref={svgRef}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold" style={{ color: getColor() }}>
            {displayScore}
          </span>
          <span className="text-xs text-text-muted">/100</span>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-3 text-center">
        {score >= 80 ? 'Excellent clarity!' : score >= 60 ? 'Good, room to improve' : 'Needs improvement'}
      </p>
    </div>
  );
}
