'use client';

import ProductShell from '@/components/layout/ProductShell';
import { useLocale } from '@/contexts/LocaleContext';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <ProductShell title={t.pages.chat.title}>
      {children}
    </ProductShell>
  );
}
