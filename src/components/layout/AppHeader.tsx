'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import BrandName from '@/components/landing/BrandName';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '?';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M13 8H3M3 8L7 4M3 8L7 12" />
            </svg>
            <span className="hidden sm:inline">{t.common.home}</span>
          </Link>

          <Link href="/app" className="flex items-center gap-2 min-w-0">
            <BrandLogo size={32} />
            <BrandName className="text-base hidden sm:inline" />
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <LocaleSwitcher />
            <ThemeToggle />

            {/* ★ User Profile / Login Button */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 rounded-full gradient-bg text-white text-xs font-bold flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md shadow-electric/25"
                  title={displayName}
                >
                  {initial}
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-11 w-56 bg-surface border border-border rounded-2xl shadow-2xl py-2 animate-slide-up z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowMenu(false);
                        router.push('/login');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-electric/20 text-electric hover:bg-electric/30 transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>

        {title && (
          <div className="mt-2 text-center sm:mt-3">
            <h1 className="text-lg sm:text-xl font-display font-bold gradient-text">{title}</h1>
            {subtitle && <p className="text-text-secondary text-xs sm:text-sm mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>
    </header>
  );
}

