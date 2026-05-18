'use client';
import { useEffect, useState } from 'react';
import { syncFromCloud } from '@/lib/storage';

export default function CloudSync() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // Chỉ đồng bộ khi chưa đồng bộ trong phiên này (hoặc có thể dùng cờ trong sessionStorage)
    if (!sessionStorage.getItem('ls_synced')) {
      syncFromCloud().then((success) => {
        if (success) {
          console.log('[Cloud] Initial sync complete.');
          sessionStorage.setItem('ls_synced', 'true');
        }
      });
    }
  }, []);

  return null; // Component ẩn, chỉ chạy logic ngầm
}
