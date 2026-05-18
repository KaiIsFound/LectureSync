'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface SpeechLanguage {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SpeechLanguage[] = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
];

interface SpeechRecognitionResult {
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  error: string | null;
  wordCount: number;
  currentLang: string;
  start: (lang?: string) => void;
  stop: () => void;
  switchLanguage: (lang: string) => void;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState('en-US');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppedRef = useRef(false);
  const langRef = useRef('en-US');

  const wordCount = finalTranscript.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isStoppedRef.current = true;
        recognitionRef.current.abort();
      }
    };
  }, []);

  const createRecognition = useCallback((lang: string) => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    // @ts-expect-error - maxAlternatives is valid but not in all TS defs
    recognition.maxAlternatives = 3; // ★ Request multiple alternatives, browser picks best one

    recognition.onstart = () => {
      setIsListening(true);
      console.log(`[Speech] Started listening in ${lang}`);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // ★ Only accept results with reasonable confidence (> 0.3)
          const confidence = result[0].confidence;
          if (confidence === 0 || confidence > 0.3) {
            final += result[0].transcript + ' ';
          } else {
            console.log(`[Speech] Skipped low-confidence result (${(confidence * 100).toFixed(0)}%):`, result[0].transcript);
          }
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        console.log(`[Speech][${lang}] Final:`, final);
        setFinalTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // no-speech is normal — just means silence was detected, let auto-restart handle it
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      
      console.error('[Speech] Error:', event.error, event.message);
      
      // Prevent infinite auto-restart loops for critical errors
      if (event.error === 'not-allowed') {
        isStoppedRef.current = true; 
      }
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow permissions in your browser settings.');
      } else if (event.error === 'network') {
        setError('Network error with speech recognition. Trying to reconnect...');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if not manually stopped
      if (!isStoppedRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (!isStoppedRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          }
        }, 250); // ★ 250ms delay (giảm từ 500ms) — khôi phục nhanh hơn sau khoảng im lặng
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, []);

  const start = useCallback((lang?: string) => {
    const useLang = lang || langRef.current;
    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    isStoppedRef.current = false;
    langRef.current = useLang;
    setCurrentLang(useLang);

    const recognition = createRecognition(useLang);
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Failed to start speech recognition.');
    }
  }, [createRecognition]);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const switchLanguage = useCallback((lang: string) => {
    langRef.current = lang;
    setCurrentLang(lang);
    
    // If currently listening, restart with the new language
    if (recognitionRef.current && !isStoppedRef.current) {
      // Stop current recognition
      isStoppedRef.current = true;
      recognitionRef.current.abort();
      recognitionRef.current = null;

      // Small delay to let the old instance fully stop, then restart
      setTimeout(() => {
        isStoppedRef.current = false;
        const recognition = createRecognition(lang);
        if (!recognition) return;
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          setError('Failed to restart speech recognition.');
        }
      }, 200);
    }
  }, [createRecognition]);

  return {
    isListening,
    transcript: finalTranscript + interimTranscript,
    interimTranscript,
    finalTranscript,
    wordCount,
    error,
    currentLang,
    start,
    stop,
    switchLanguage,
  };
}
