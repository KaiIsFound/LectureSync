'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/contexts/LocaleContext';

const cardStyles = [
  { color: 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300', border: 'hover:border-teal-300 dark:hover:border-teal-500/30' },
  { color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300', border: 'hover:border-amber-300 dark:hover:border-amber-500/30' },
  { color: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300', border: 'hover:border-cyan-300 dark:hover:border-cyan-500/30' },
  { color: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300', border: 'hover:border-orange-300 dark:hover:border-orange-500/30' },
  { color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', border: 'hover:border-emerald-300 dark:hover:border-emerald-500/30' },
  { color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300', border: 'hover:border-rose-300 dark:hover:border-rose-500/30' },
  { color: 'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300', border: 'hover:border-sky-300 dark:hover:border-sky-500/30' },
  { color: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300', border: 'hover:border-violet-300 dark:hover:border-violet-500/30' },
];

export default function FeaturesSection() {
  const { t } = useLocale();

  return (
    <section id="features" className="relative py-24 md:py-32 px-4 bg-[var(--section-alt-bg)]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-200 mb-6">
            {t.features.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            <span className="text-text-primary">{t.features.title1}</span>
            <span className="gradient-text">{t.features.title2}</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">{t.features.subtitle}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {t.features.items.map((feature, i) => {
            const style = cardStyles[i % cardStyles.length];
            return (
              <motion.div
                key={feature.title}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className={`group relative rounded-2xl border border-[var(--border-color)] bg-white dark:bg-white/[0.02] p-6 md:p-7 transition-all duration-300 hover:shadow-[var(--card-shadow-hover)] ${style.border} cursor-default`}
              >
                <div className={`w-12 h-12 rounded-2xl ${style.color} flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 font-[family-name:var(--font-space-grotesk)]">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
