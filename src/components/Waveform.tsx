'use client';

import { useRef, useEffect } from 'react';

interface WaveformProps {
  getFrequencyData: () => Uint8Array | null;
  isActive: boolean;
}

export default function Waveform({ getFrequencyData, isActive }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const data = getFrequencyData();
      const barCount = 40;
      const barWidth = width / barCount - 2;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight: number;

        if (data && isActive) {
          const dataIndex = Math.floor((i / barCount) * data.length);
          barHeight = (data[dataIndex] / 255) * height * 0.8;
          barHeight = Math.max(barHeight, 3);
        } else {
          // Idle animation
          const time = Date.now() / 1000;
          barHeight = Math.sin(time * 2 + i * 0.3) * 8 + 10;
        }

        const x = i * (barWidth + gap) + gap;
        const y = (height - barHeight) / 2;

        // Gradient color per bar
        const ratio = i / barCount;
        const r = Math.round(67 + ratio * (114 - 67));
        const g = Math.round(97 + ratio * (9 - 97));
        const b = Math.round(238 + ratio * (183 - 238));

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${isActive ? 0.9 : 0.3})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [getFrequencyData, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 md:h-20"
    />
  );
}
