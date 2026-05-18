'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

export default function DemoSection() {
  const { t } = useLocale();

  return (
    <section id="demo" className="relative py-24 md:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl border border-teal-200/60 dark:border-teal-500/20 bg-gradient-to-br from-teal-50/80 via-white to-amber-50/60 dark:from-teal-500/[0.06] dark:via-transparent dark:to-amber-500/[0.04] p-8 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/[0.05] blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-semibold uppercase bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-200 mb-6">
              {t.demo.badge}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-space-grotesk)] text-text-primary mb-4">
              {t.demo.title1}
              <br />
              <span className="gradient-text">{t.demo.title2}</span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-10 text-sm md:text-base">{t.demo.subtitle}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/app"
                className="group inline-flex items-center gap-2 px-10 py-4 text-base font-bold rounded-full btn-primary hover:scale-[1.03] transition-transform"
              >
                <span>{t.demo.cta}</span>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1" aria-hidden>
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="https://github.com/KaiIsFound/321"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-text-secondary rounded-full border border-[var(--border-color)] bg-white/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>{t.demo.source}</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
