'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/contexts/LocaleContext';

const flowColors = ['#0d9488', '#0f766e', '#14b8a6', '#0891b2', '#059669', '#d97706'];

export default function HardwareSection() {
  const { t } = useLocale();

  const wiring = t.hardware.wiring.map((w, i) => ({
    pin: w.pin,
    to: w.to,
    c:
      i < 3
        ? 'text-teal-600 dark:text-teal-400'
        : 'text-amber-600 dark:text-amber-400',
    note: 'note' in w && w.note ? t.hardware.leftNote : undefined,
  }));

  return (
    <section id="hardware" className="relative py-24 md:py-32 px-4 bg-[var(--section-alt-bg)]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-semibold uppercase bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-200 mb-6">
            {t.hardware.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            <span className="text-text-primary">{t.hardware.title1}</span>
            <span className="gradient-text">{t.hardware.title2}</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">{t.hardware.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-[var(--border-color)] bg-white dark:bg-white/[0.02] p-8 hover:shadow-[var(--card-shadow-hover)] transition-shadow"
          >
            <h3 className="text-lg font-bold text-text-primary mb-6 font-[family-name:var(--font-space-grotesk)]">
              {t.hardware.wiringTitle}
            </h3>
            <div className="bg-gray-50 dark:bg-black/30 rounded-xl p-6 border border-[var(--border-color)] font-mono text-sm space-y-3">
              {wiring.map((w) => (
                <div key={w.pin} className="flex items-center gap-3">
                  <span className="w-12 text-right text-teal-600 dark:text-teal-400 font-semibold">{w.pin}</span>
                  <span className="text-text-muted">→</span>
                  <span className={`${w.c} font-semibold`}>{w.to}</span>
                  {w.note && <span className="text-text-muted text-xs">{w.note}</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4">{t.hardware.spec}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-[var(--border-color)] bg-white dark:bg-white/[0.02] p-8 hover:shadow-[var(--card-shadow-hover)] transition-shadow"
          >
            <h3 className="text-lg font-bold text-text-primary mb-6 font-[family-name:var(--font-space-grotesk)]">
              {t.hardware.flowTitle}
            </h3>
            <div className="space-y-4">
              {t.hardware.flow.map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: flowColors[i] }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
