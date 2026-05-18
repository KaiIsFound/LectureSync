'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/contexts/LocaleContext';

const stepIcons = [
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
];

const stepColors = [
  'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/20',
  'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
  'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
];

export default function HowItWorks() {
  const { t } = useLocale();

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 mb-6">
            {t.howItWorks.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            <span className="text-text-primary">{t.howItWorks.title1}</span>
            <span className="gradient-text">{t.howItWorks.title2}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.howItWorks.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative text-center"
            >
              {index < t.howItWorks.steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-[2px] bg-gradient-to-r from-teal-300/50 dark:from-teal-500/20 to-transparent" />
              )}

              <div className={`w-20 h-20 rounded-3xl ${stepColors[index]} border flex items-center justify-center mx-auto mb-6 transition-transform duration-300 hover:scale-110`}>
                {stepIcons[index]}
              </div>

              <div className="text-xs font-bold text-teal-700 dark:text-teal-300 tracking-widest uppercase mb-2">
                {t.howItWorks.stepLabel} 0{index + 1}
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3 font-[family-name:var(--font-space-grotesk)]">
                {step.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
