'use client';

import { useLocale } from '@/contexts/LocaleContext';
import type { Locale } from '@/lib/i18n/translations';

const options: { code: Locale; label: string }[] = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
];

export default function LocaleSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center p-0.5 rounded-full border border-[var(--border-color)] bg-surface/80 backdrop-blur-sm ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLocale(opt.code)}
          className={`relative px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
            locale === opt.code
              ? 'text-white shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {locale === opt.code && (
            <span className="absolute inset-0 rounded-full btn-primary" aria-hidden />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
