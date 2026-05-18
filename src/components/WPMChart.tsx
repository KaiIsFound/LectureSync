'use client';

import { useRef, useEffect } from 'react';

interface WPMChartProps {
  wpmData: number[];
}

export default function WPMChart({ wpmData }: WPMChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || wpmData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxWPM = Math.max(...wpmData, 200);
    const minWPM = 0;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y labels
      const val = Math.round(maxWPM - (maxWPM / 4) * i);
      ctx.fillStyle = '#6b6b80';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toString(), padding.left - 8, y + 3);
    }

    // X labels
    ctx.textAlign = 'center';
    const labelCount = Math.min(6, wpmData.length);
    for (let i = 0; i < labelCount; i++) {
      const dataIndex = Math.round((i / (labelCount - 1)) * (wpmData.length - 1));
      const x = padding.left + (dataIndex / (wpmData.length - 1)) * chartW;
      const mins = Math.floor((dataIndex * 10) / 60);
      const secs = (dataIndex * 10) % 60;
      ctx.fillStyle = '#6b6b80';
      ctx.font = '10px monospace';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, x, height - 8);
    }

    if (wpmData.length < 2) return;

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(67, 97, 238, 0.3)');
    gradient.addColorStop(1, 'rgba(67, 97, 238, 0)');

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);

    for (let i = 0; i < wpmData.length; i++) {
      const x = padding.left + (i / (wpmData.length - 1)) * chartW;
      const y = padding.top + chartH - ((wpmData[i] - minWPM) / (maxWPM - minWPM)) * chartH;
      if (i === 0) ctx.lineTo(x, y);
      else {
        const prevX = padding.left + ((i - 1) / (wpmData.length - 1)) * chartW;
        const prevY = padding.top + chartH - ((wpmData[i - 1] - minWPM) / (maxWPM - minWPM)) * chartH;
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }

    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    for (let i = 0; i < wpmData.length; i++) {
      const x = padding.left + (i / (wpmData.length - 1)) * chartW;
      const y = padding.top + chartH - ((wpmData[i] - minWPM) / (maxWPM - minWPM)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = padding.left + ((i - 1) / (wpmData.length - 1)) * chartW;
        const prevY = padding.top + chartH - ((wpmData[i - 1] - minWPM) / (maxWPM - minWPM)) * chartH;
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw dots
    for (let i = 0; i < wpmData.length; i++) {
      const x = padding.left + (i / (wpmData.length - 1)) * chartW;
      const y = padding.top + chartH - ((wpmData[i] - minWPM) / (maxWPM - minWPM)) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4361ee';
      ctx.fill();
      ctx.strokeStyle = '#0f0f0f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [wpmData]);

  if (wpmData.length === 0) {
    return <p className="text-text-muted italic text-sm text-center py-8">No WPM data available.</p>;
  }

  return (
    <div className="rounded-xl bg-surface border border-border p-4">
      <h3 className="text-sm font-display font-semibold text-text-secondary mb-3">Speaking Speed (WPM)</h3>
      <canvas ref={canvasRef} className="w-full h-48" />
    </div>
  );
}
