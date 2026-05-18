'use client';

import { useState } from 'react';
import type { QuizQuestion } from '@/lib/storage';
import ProgressBar from '@/components/ui/ProgressBar';

interface QuizViewProps {
  questions: QuizQuestion[];
}

export default function QuizView({ questions }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-text-muted text-sm">No quiz questions available yet.</p>
        <p className="text-text-muted text-xs mt-1">Record a lecture to generate a quiz!</p>
      </div>
    );
  }

  if (showResults) {
    const correctCount = answers.reduce<number>((acc, ans, i) => {
      return acc + (ans === questions[i].correctIndex ? 1 : 0);
    }, 0);
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-6">
          <div className="text-5xl font-display font-bold gradient-text mb-2">
            {percentage}%
          </div>
          <p className="text-text-secondary text-sm">
            {correctCount} of {questions.length} correct
          </p>
          <div className={`mt-2 text-sm font-medium ${percentage >= 70 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-danger'}`}>
            {percentage >= 90 ? '🌟 Excellent!' : percentage >= 70 ? '👍 Good job!' : percentage >= 50 ? '📚 Keep studying!' : '💪 Try again!'}
          </div>
        </div>

        {/* Review wrong answers */}
        <div className="space-y-3">
          <h3 className="text-sm font-display font-semibold text-text-secondary uppercase tracking-wider">Review</h3>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            return (
              <div key={i} className={`rounded-xl border p-4 ${isCorrect ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={`text-sm ${isCorrect ? 'text-success' : 'text-danger'}`}>
                    {isCorrect ? '✓' : '✕'}
                  </span>
                  <p className="text-sm text-text-primary font-medium">{q.question}</p>
                </div>
                {!isCorrect && (
                  <div className="ml-5 space-y-1">
                    <p className="text-xs text-danger">Your answer: {q.options[answers[i] ?? 0]}</p>
                    <p className="text-xs text-success">Correct: {q.options[q.correctIndex]}</p>
                    <p className="text-xs text-text-muted mt-1 italic">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setAnswers(new Array(questions.length).fill(null));
            setShowResults(false);
          }}
          className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];

  const handleSelect = (optionIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={currentIndex + 1} max={questions.length} />
      <p className="text-xs text-text-muted text-right">
        Question {currentIndex + 1} of {questions.length}
      </p>

      <div className="rounded-xl bg-surface border border-border p-5 animate-fade-in" key={currentIndex}>
        <p className="text-sm font-medium text-text-primary leading-relaxed mb-4">{question.question}</p>

        <div className="space-y-2">
          {question.options.map((option, i) => {
            let optionClass = 'border-border hover:border-electric/50 hover:bg-surface-elevated';
            if (selectedAnswer !== null) {
              if (i === question.correctIndex) {
                optionClass = 'border-success bg-success/10';
              } else if (i === selectedAnswer && i !== question.correctIndex) {
                optionClass = 'border-danger bg-danger/10';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selectedAnswer !== null}
                className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${optionClass}`}
              >
                <span className="text-text-muted mr-2">{String.fromCharCode(65 + i)}.</span>
                <span className="text-text-primary">{option}</span>
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className="mt-4 p-3 rounded-lg bg-surface-elevated text-xs text-text-muted animate-slide-up">
            <span className="font-semibold text-electric">Explanation: </span>
            {question.explanation}
          </div>
        )}
      </div>

      {selectedAnswer !== null && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity animate-slide-up"
        >
          {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
        </button>
      )}
    </div>
  );
}
