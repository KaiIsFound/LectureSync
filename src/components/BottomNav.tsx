'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

const tabIcons = [
  (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const tabs = [
    { name: t.bottomNav.record, href: '/app' },
    { name: t.bottomNav.notes, href: '/notes' },
    { name: t.bottomNav.chat, href: '/chat' },
    { name: t.bottomNav.study, href: '/study' },
    { name: t.bottomNav.analytics, href: '/analytics' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-4 px-4 md:px-8 pointer-events-none">
      {/* Nền mờ nhạt dần xuống dưới để hoà quyện với dock */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/80 to-transparent -z-10 pointer-events-none" />
      
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-white/60 dark:bg-[#0f172a]/70 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex justify-around items-center p-2 relative overflow-hidden">
          {/* Viền sáng phía trên */}
          <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 dark:via-blue-400/30 to-transparent" />
          
          {tabs.map((tab, i) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-500 overflow-hidden ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400 scale-105' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-105'
                }`}
              >
                {/* Nền mờ cho tab đang active */}
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl" />
                )}
                
                <div className={`relative z-10 transition-transform duration-300 ${isActive ? '-translate-y-0.5 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>
                  {tabIcons[i]}
                </div>
                
                <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                }`}>
                  {tab.name}
                </span>

                {/* Chấm tròn phát sáng phía dưới tab active */}
                {isActive && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
