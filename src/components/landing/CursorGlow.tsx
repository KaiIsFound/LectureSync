'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const [finePointer, setFinePointer] = useState(true);

  const glowX = useSpring(0, { stiffness: 120, damping: 28, mass: 0.6 });
  const glowY = useSpring(0, { stiffness: 120, damping: 28, mass: 0.6 });
  const dotX = useSpring(0, { stiffness: 280, damping: 32, mass: 0.35 });
  const dotY = useSpring(0, { stiffness: 280, damping: 32, mass: 0.35 });

  const raf = useRef<number | null>(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const updatePointer = () => setFinePointer(mq.matches);
    updatePointer();
    mq.addEventListener('change', updatePointer);

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      if (raf.current !== null) return;
      raf.current = requestAnimationFrame(() => {
        glowX.set(pos.current.x);
        glowY.set(pos.current.y);
        dotX.set(pos.current.x);
        dotY.set(pos.current.y);
        raf.current = null;
      });
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      mq.removeEventListener('change', updatePointer);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [visible, glowX, glowY, dotX, dotY]);

  if (!finePointer) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[5] top-0 left-0 w-[min(28rem,70vw)] h-[min(28rem,70vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-500"
        style={{
          x: glowX,
          y: glowY,
          opacity: visible ? 1 : 0,
          background:
            'radial-gradient(circle, rgba(13,148,136,0.14) 0%, rgba(217,119,6,0.06) 45%, transparent 70%)',
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[6] top-0 left-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/25 bg-teal-400/10 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 mix-blend-screen dark:mix-blend-screen"
        style={{ x: dotX, y: dotY, opacity: visible ? 0.85 : 0 }}
      />
    </>
  );
}
