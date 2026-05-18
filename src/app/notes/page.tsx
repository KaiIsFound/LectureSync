'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TabBar from '@/components/ui/TabBar';
import SmartNotes from '@/components/SmartNotes';
import KeyDefinitions from '@/components/KeyDefinitions';
import DeadlineAlert from '@/components/DeadlineAlert';
import FormulasBox from '@/components/FormulasBox';
import Skeleton from '@/components/ui/Skeleton';
import { getAllSessions, deleteSession, type LectureSession } from '@/lib/storage';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ToastProvider';

export default function NotesPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const data = getAllSessions();
    setSessions(data);
    if (data.length > 0) setSelectedId(data[0].id);
    setLoading(false);
  }, []);

  const session = sessions.find(s => s.id === selectedId);
  const tabs = [...t.pages.notes.tabs];

  // ★ Xoá bản ghi
  const handleDelete = () => {
    if (!selectedId) return;
    deleteSession(selectedId);
    const remaining = sessions.filter(s => s.id !== selectedId);
    setSessions(remaining);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    } else {
      setSelectedId('');
    }
    setShowDeleteConfirm(false);
    showToast('Đã xoá bản ghi thành công!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen px-4 pt-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <h2 className="text-lg font-display font-bold text-text-primary mb-2">{t.pages.notes.emptyTitle}</h2>
        <p className="text-text-secondary text-sm max-w-xs">{t.pages.notes.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-3xl mx-auto">
      {/* Lecture selector + Delete button */}
      <div className="mb-4 flex gap-2 items-center">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-electric/50 appearance-none cursor-pointer"
        >
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.title} — {new Date(s.date).toLocaleDateString()}
            </option>
          ))}
        </select>

        {/* ★ Nút Xoá */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-shrink-0 p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 group"
          title="Xoá bản ghi này"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>

      {/* ★ Hộp thoại xác nhận xoá */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm mx-4 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-bold text-text-primary">Xoá bản ghi?</h3>
            </div>
            <p className="text-sm text-text-secondary mb-1">
              Bạn có chắc muốn xoá bản ghi này không?
            </p>
            <p className="text-xs text-text-muted mb-5 italic truncate">
              &quot;{session?.title}&quot;
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm font-medium hover:bg-surface-glass transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4">
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="animate-fade-in" key={`${selectedId}-${activeTab}`}>
        {session && (
          <>
            {activeTab === 0 && <SmartNotes notes={session.notes} />}
            {activeTab === 1 && <KeyDefinitions definitions={session.definitions} />}
            {activeTab === 2 && <DeadlineAlert deadlines={session.deadlines} />}
            {activeTab === 3 && <FormulasBox formulas={session.formulas} />}
          </>
        )}
      </div>
    </div>
  );
}
