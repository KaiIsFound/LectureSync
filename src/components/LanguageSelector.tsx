'use client';

import { SUPPORTED_LANGUAGES, type SpeechLanguage } from '@/hooks/useSpeechRecognition';

interface LanguageSelectorProps {
  currentLang: string;
  onSelect: (lang: string) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ currentLang, onSelect, disabled }: LanguageSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-glass border border-border">
      {SUPPORTED_LANGUAGES.map((lang: SpeechLanguage) => {
        const isActive = lang.code === currentLang;
        return (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            disabled={disabled}
            className={`
              relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium
              transition-all duration-300 select-none
              ${isActive
                ? 'bg-electric/15 text-electric glow-sm'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span className="hidden sm:inline text-xs">{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}
