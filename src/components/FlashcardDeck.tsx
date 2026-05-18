'use client';

import { useState, useRef, useEffect } from 'react';
import type { Flashcard } from '@/lib/storage';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  onStatusChange?: (cardId: string, lectureId: string, status: 'known' | 'review') => void;
}

export default function FlashcardDeck({ flashcards, onStatusChange }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const flashcardsRef = useRef(flashcards);
  useEffect(() => {
    flashcardsRef.current = flashcards;
  }, [flashcards]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">No flashcards available yet.</p>
        <p className="text-text-muted text-xs mt-1">Record a lecture to generate flashcards!</p>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, Math.max(0, flashcards.length - 1));
  const card = flashcards[safeIndex];

  // Sync state if index went out of bounds due to array shrinking
  if (currentIndex !== safeIndex) {
    setCurrentIndex(safeIndex);
  }

  const goNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => Math.min(prev + 1, flashcards.length - 1)), 150);
  };

  const goPrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => Math.max(prev - 1, 0)), 150);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span className="whitespace-nowrap font-medium">{safeIndex + 1} / {flashcards.length}</span>
        <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div 
            className="h-full bg-electric transition-all duration-300 rounded-full"
            style={{ width: `${((safeIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div
        className="cursor-pointer relative w-full group"
        style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="w-full" 
          style={{ 
            display: 'grid',
            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front (Question) */}
          <div 
            className="rounded-3xl bg-surface-elevated border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-5 md:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:border-electric/40 group-hover:shadow-[0_8px_40px_rgba(99,102,241,0.12)] min-h-[300px]"
            style={{ 
              gridArea: '1 / 1', 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden' 
            }}
          >
            <div className="w-12 h-12 rounded-full bg-electric/10 flex items-center justify-center mb-6 text-electric shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted mb-4 shrink-0">Question</span>
            <p className="text-xl md:text-2xl font-display font-semibold text-text-primary leading-snug mb-8">{card.question}</p>
            
            <div className="mt-auto flex items-center gap-2 text-xs font-medium text-electric/70 bg-electric/5 px-4 py-2 rounded-full animate-pulse shrink-0">
              <span>Tap to reveal answer</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </div>
          </div>

          {/* Back (Answer) */}
          <div 
            className="rounded-3xl bg-gradient-to-br from-electric/5 to-purple/10 border border-electric/30 shadow-lg p-5 md:p-8 flex flex-col items-center justify-center text-center min-h-[300px]"
            style={{ 
              gridArea: '1 / 1',
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="w-12 h-12 rounded-full bg-electric/20 flex items-center justify-center mb-6 text-electric shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="M4.93 4.93l1.41 1.41"></path>
                <path d="M17.66 17.66l1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="M6.34 17.66l-1.41 1.41"></path>
                <path d="M19.07 4.93l-1.41 1.41"></path>
              </svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-electric mb-4 shrink-0">Answer</span>
            <p className="text-lg md:text-xl font-medium text-text-primary leading-relaxed overflow-y-auto custom-scrollbar max-h-full pb-2">
              {card.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <button
          onClick={goPrev}
          disabled={safeIndex === 0}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-elevated border border-border shadow-sm text-text-secondary hover:text-text-primary hover:border-text-muted disabled:opacity-30 disabled:hover:border-border transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Status buttons */}
        <div className="flex gap-3 flex-1">
          <button
            onClick={() => {
              const currentId = card.id;
              onStatusChange?.(currentId, card.lectureId, 'review');
              setIsFlipped(false);
              setTimeout(() => {
                const currentCards = flashcardsRef.current;
                const safeIdx = Math.min(currentIndex, Math.max(0, currentCards.length - 1));
                if (currentCards.length > 0 && currentCards[safeIdx]?.id === currentId) {
                  setCurrentIndex(prev => Math.min(prev + 1, currentCards.length - 1));
                }
              }, 150);
            }}
            className="flex-1 group relative overflow-hidden py-3 rounded-2xl bg-surface-elevated border border-warning/30 shadow-sm transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-warning/60 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-warning/0 via-warning/10 to-warning/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                <path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.84-10.36l5.03-3.02" />
              </svg>
              <span className="text-warning font-semibold tracking-wide text-sm">Review</span>
            </div>
          </button>
          <button
            onClick={() => {
              const currentId = card.id;
              onStatusChange?.(currentId, card.lectureId, 'known');
              setIsFlipped(false);
              setTimeout(() => {
                const currentCards = flashcardsRef.current;
                const safeIdx = Math.min(currentIndex, Math.max(0, currentCards.length - 1));
                if (currentCards.length > 0 && currentCards[safeIdx]?.id === currentId) {
                  setCurrentIndex(prev => Math.min(prev + 1, currentCards.length - 1));
                }
              }, 150);
            }}
            className="flex-1 group relative overflow-hidden py-3 rounded-2xl bg-surface-elevated border border-success/30 shadow-sm transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-success/60 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-success/0 via-success/10 to-success/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-success font-semibold tracking-wide text-sm">Known</span>
            </div>
          </button>
        </div>

        <button
          onClick={goNext}
          disabled={safeIndex === flashcards.length - 1}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-elevated border border-border shadow-sm text-text-secondary hover:text-text-primary hover:border-text-muted disabled:opacity-30 disabled:hover:border-border transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
