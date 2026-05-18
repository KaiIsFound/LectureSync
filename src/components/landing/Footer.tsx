'use client';

import BrandLogo from '@/components/BrandLogo';
import BrandName from '@/components/landing/BrandName';
import { useLocale } from '@/contexts/LocaleContext';

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="relative border-t border-[var(--border-color)] py-12 px-4 bg-[var(--section-alt-bg)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={28} />
            <BrandName className="text-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs text-text-muted">
            <a href="https://github.com/KaiIsFound/321" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">
              GitHub
            </a>
            <span className="text-border">|</span>
            <span>{t.footer.stack}</span>
            <span className="text-border">|</span>
            <span>© 2026 LectureSync</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
