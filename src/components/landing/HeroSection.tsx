'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { useLocale } from '@/contexts/LocaleContext';

const statColors = [
  'text-teal-600 dark:text-teal-400',
  'text-amber-600 dark:text-amber-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-orange-600 dark:text-orange-400',
];

export default function HeroSection() {
  const { t } = useLocale();
  const [subBefore, subAfter] = t.hero.subtitle.split('{esp32}');

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16 overflow-hidden ambient-glow">
      <div className="absolute inset-0 bg-[image:var(--hero-bg)] pointer-events-none" />
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-teal-500/[0.05] dark:bg-teal-500/[0.08] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[12%] right-[8%] w-[380px] h-[380px] rounded-full bg-amber-500/[0.04] dark:bg-amber-500/[0.07] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-teal-200/80 dark:border-teal-500/25 bg-teal-50/80 dark:bg-teal-500/10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
          </span>
          <span className="text-xs font-semibold text-teal-800 dark:text-teal-200 tracking-wide">
            {t.hero.badge}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-8"
        >
          <BrandLogo size={96} showGlow priority />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] font-[family-name:var(--font-space-grotesk)]"
        >
          <span className="text-text-primary">{t.hero.title1}</span>
          <br />
          <span className="gradient-text">{t.hero.title2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          {subBefore}
          <span className="text-teal-700 dark:text-teal-300 font-semibold">{t.hero.esp32}</span>
          {subAfter}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-full btn-primary hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            <span>{t.hero.ctaPrimary}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-text-secondary rounded-full border border-[var(--border-color)] bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.07] hover:text-text-primary transition-all duration-300 backdrop-blur-sm"
          >
            <span>{t.hero.ctaSecondary}</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 inline-flex flex-wrap items-center justify-center gap-6 md:gap-10 px-8 py-5 rounded-[28px] glass border border-[var(--border-color)]"
        >
          {t.hero.stats.map((stat, i) => (
            <div key={stat.label} className="text-center min-w-[72px]">
              <div className={`text-2xl md:text-3xl font-extrabold font-[family-name:var(--font-space-grotesk)] ${statColors[i]}`}>
                {stat.value}
              </div>
              <div className="text-[11px] text-text-muted mt-1 tracking-wide font-medium uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-11 rounded-full border-2 border-teal-500/30 flex justify-center pt-2"
        >
          <div className="w-1.5 h-2.5 rounded-full bg-teal-500/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
