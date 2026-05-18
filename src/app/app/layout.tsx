'use client';

import ProductShell from '@/components/layout/ProductShell';
import { useLocale } from '@/contexts/LocaleContext';

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <ProductShell subtitle={t.record.subtitle}>
      {children}
    </ProductShell>
  );
}
