'use client';

import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/BottomNav';

type ProductShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  hideBottomNav?: boolean;
};

export default function ProductShell({
  children,
  title,
  subtitle,
  className = '',
  hideBottomNav = false,
}: ProductShellProps) {
  return (
    <div className={`min-h-screen bg-bg text-text-primary transition-colors duration-300 ${hideBottomNav ? '' : 'pb-20'} ${className}`}>
      <AppHeader title={title} subtitle={subtitle} />
      {children}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
