'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TabBar from '@/components/ui/TabBar';
import FlashcardDeck from '@/components/FlashcardDeck';
import QuizView from '@/components/QuizView';
import Skeleton from '@/components/ui/Skeleton';
import {
  getAllSessions,
  getAllFlashcards,
  getDueFlashcards,
  updateFlashcardStatus,
  type LectureSession,
  type Flashcard,
} from '@/lib/storage';
import { useLocale } from '@/contexts/LocaleContext';

export default function StudyPage() {
  const { t } = useLocale();
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedId, setSelectedId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState(0);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCards = () => {
    setAllCards(getAllFlashcards());
    setDueCards(getDueFlashcards());
  };

  useEffect(() => {
    const data = getAllSessions();
    setSessions(data);
    refreshCards();
    setLoading(false);
  }, []);

  const tabs = [...t.pages.study.tabs];

  const handleStatusChange = (cardId: string, lectureId: string, status: 'known' | 'review') => {
    updateFlashcardStatus(lectureId, cardId, status);
    refreshCards();
  };

  // Filter cards by selected session
  const filteredCards = selectedId === 'all'
    ? allCards
    : allCards.filter(c => c.lectureId === selectedId);

  const selectedSession = sessions.find(s => s.id === selectedId);
  const quizQuestions = selectedSession?.quiz || [];

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
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h2 className="text-lg font-display font-bold text-text-primary mb-2">{t.pages.study.emptyTitle}</h2>
        <p className="text-text-secondary text-sm max-w-xs">{t.pages.study.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-3xl mx-auto">
      {/* Lecture filter */}
      <div className="mb-4">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-electric/50 appearance-none cursor-pointer"
        >
          <option value="all">{t.pages.study.allLectures}</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.title} — {new Date(s.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-surface border border-border p-3 text-center">
          <div className="text-lg font-display font-bold text-electric">{allCards.length}</div>
          <div className="text-[10px] text-text-muted">Total Cards</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-3 text-center">
          <div className="text-lg font-display font-bold text-success">{allCards.filter(c => c.status === 'known').length}</div>
          <div className="text-[10px] text-text-muted">Known</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-3 text-center">
          <div className="text-lg font-display font-bold text-warning">{dueCards.length}</div>
          <div className="text-[10px] text-text-muted">Due Today</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 0 && (
          <FlashcardDeck
            flashcards={filteredCards}
            onStatusChange={handleStatusChange}
          />
        )}
        {activeTab === 1 && (
          selectedId === 'all' ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">Select a specific lecture to take its quiz.</p>
            </div>
          ) : (
            <QuizView questions={quizQuestions} />
          )
        )}
        {activeTab === 2 && (
          <FlashcardDeck
            flashcards={dueCards}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}
