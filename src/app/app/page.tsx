'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RecordButton from '@/components/RecordButton';
import { useLocale } from '@/contexts/LocaleContext';
import Waveform from '@/components/Waveform';
import LiveTranscript from '@/components/LiveTranscript';
import AIExplanation from '@/components/AIExplanation';
import RecordingStats from '@/components/RecordingStats';
import LanguageSelector from '@/components/LanguageSelector';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useToast } from '@/components/ToastProvider';
import { useSpeechRecognition, SUPPORTED_LANGUAGES } from '@/hooks/useSpeechRecognition';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import {
  saveSession, generateId, countFillerWords, calculateClarityScore,
  type LectureSession, type Flashcard,
} from '@/lib/storage';

interface ExplanationChunk { id: number; text: string; timestamp: string; }

const GLOW_COLORS = [
  'hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
  'hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
  'hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
  'hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]',
  'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
  'hover:shadow-[0_0_25px_rgba(249,115,22,0.15)]',
  'hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]',
  'hover:shadow-[0_0_25px_rgba(234,179,8,0.15)]',
];

export default function RecordPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { showToast } = useToast();
  const speech = useSpeechRecognition();
  const audio = useAudioVisualizer();

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [chunks, setChunks] = useState<ExplanationChunk[]>([]);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [procStep, setProcStep] = useState('');
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [useHW, setUseHW] = useState(false);
  const [hwText, setHwText] = useState('');
  const [hwStatus, setHwStatus] = useState({ online: false, bytes: 0, lastTime: 0, retries: 0 });

  const lastChunk = useRef('');
  const timer = useRef<NodeJS.Timeout | null>(null);
  const chunkTimer = useRef<NodeJS.Timeout | null>(null);
  const wpmTimer = useRef<NodeJS.Timeout | null>(null);
  const hwTimer = useRef<NodeJS.Timeout | null>(null);
  const startT = useRef(0);

  // ── Timers ──
  useEffect(() => {
    if (isRecording) {
      startT.current = Date.now();
      timer.current = setInterval(() => setDuration(Math.floor((Date.now() - startT.current) / 1000)), 1000);
    } else { if (timer.current) clearInterval(timer.current); }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      wpmTimer.current = setInterval(() => {
        const m = (Date.now() - startT.current) / 60000;
        if (m > 0) setWpmHistory(p => [...p, Math.round(speech.wordCount / m)]);
      }, 10000);
    } else { if (wpmTimer.current) clearInterval(wpmTimer.current); }
    return () => { if (wpmTimer.current) clearInterval(wpmTimer.current); };
  }, [isRecording, speech.wordCount]);

  useEffect(() => {
    if (speech.error && !useHW) showToast(speech.error, 'error');
  }, [speech.error, showToast, useHW]);

  // ── ESP32 polling ──
  useEffect(() => {
    if (useHW) {
      const poll = async () => {
        try {
          const r = await fetch('/api/hardware-audio');
          if (!r.ok) throw new Error(`${r.status}`);
          const d = await r.json();
          const on = d.lastReceived > 0 && Date.now() - d.lastReceived < 8000;
          setHwStatus(p => ({ online: on, bytes: d.lastBytes || 0, lastTime: d.lastReceived || 0, retries: on ? 0 : p.retries + 1 }));
          if (isRecording && d.transcripts?.length > 0) setHwText(p => p ? p + ' ' + d.transcripts.join(' ') : d.transcripts.join(' '));
        } catch { setHwStatus(p => ({ ...p, online: false, retries: p.retries + 1 })); }
      };
      poll();
      hwTimer.current = setInterval(poll, 3000);
    } else {
      if (hwTimer.current) clearInterval(hwTimer.current);
      setHwStatus({ online: false, bytes: 0, lastTime: 0, retries: 0 });
    }
    return () => { if (hwTimer.current) clearInterval(hwTimer.current); };
  }, [useHW, isRecording]);

  // ── AI explanation ──
  const explain = useCallback(async (text: string) => {
    if (!text.trim() || text.trim() === lastChunk.current.trim()) return;
    lastChunk.current = text;
    setIsExplaining(true);
    try {
      const r = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chunk: text }) });
      if (!r.ok) throw new Error((await r.json()).error);
      const d = await r.json();
      const mm = Math.floor(duration / 60), ss = duration % 60;
      setChunks(p => [...p, { id: Date.now(), text: d.explanation, timestamp: `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}` }]);
    } catch (e) { console.error('Explain err:', e); }
    finally { setIsExplaining(false); }
  }, [duration]);

  useEffect(() => {
    if (isRecording) {
      chunkTimer.current = setInterval(() => {
        const cur = useHW ? hwText : speech.finalTranscript;
        const n = cur.slice(lastChunk.current.length).trim();
        if (n.length > 20) explain(n);
      }, 30000);
    } else { if (chunkTimer.current) clearInterval(chunkTimer.current); }
    return () => { if (chunkTimer.current) clearInterval(chunkTimer.current); };
  }, [isRecording, speech.finalTranscript, hwText, useHW, explain]);

  // ── Toggle ──
  const toggle = async () => {
    if (isRecording) {
      if (!useHW) { speech.stop(); audio.stop(); }
      setIsRecording(false);
      const tx = (useHW ? hwText : speech.finalTranscript).trim();
      if (!tx || tx.length < 10) { showToast(t.record.tooShort, 'info'); return; }

      setIsProcessing(true);
      setProcStep('Đang xử lý bản ghi âm thanh...');

      // ★ Nếu đang dùng ESP32: gọi API finalize để Whisper xử lý lại toàn bộ file audio
      //   cho ra bản transcript chuẩn xác nhất, thay vì dùng bản live (rời rạc, hay sai)
      let finalTxToProcess = tx;
      if (useHW) {
        try {
          setProcStep('Đang xử lý lại toàn bộ bản ghi audio...');
          const finalizeRes = await fetch('/api/hardware-audio', { method: 'PUT' });
          if (finalizeRes.ok) {
            const finalizeData = await finalizeRes.json();
            if (finalizeData.transcript && finalizeData.transcript.trim().length > 10) {
              finalTxToProcess = finalizeData.transcript.trim();
              console.log(`[Finalize] Dùng bản transcript chuẩn (${finalizeData.method}): ${finalTxToProcess.length} ký tự`);
            }
          }
        } catch (e) {
          console.warn('[Finalize] Lỗi, dùng live transcript thay thế:', e);
        }
      }

      try {
        setProcStep('🤖 Đang chạy song song 2 AI model (Llama 3.3 + Qwen)...');
        const r = await fetch('/api/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: finalTxToProcess }) });
        if (!r.ok) throw new Error(`Server ${r.status}`);
        setProcStep('Đang phân tích kết quả...');
        const data = await r.json();

        setProcStep('Đang lưu phiên...');
        const sid = generateId();
        const wc = useHW ? finalTxToProcess.split(/\s+/).filter(Boolean).length : speech.wordCount;
        const fw = countFillerWords(finalTxToProcess);
        const cs = calculateClarityScore(wpmHistory, fw, wc);
        const fcs: Flashcard[] = (data.flashcards || []).map((f: { question: string; answer: string }, i: number) => ({
          id: `${sid}-fc-${i}`, question: f.question, answer: f.answer,
          status: 'new' as const, lastReviewed: null, nextReview: null, lectureId: sid, subject: 'General',
        }));
        const session: LectureSession = {
          id: sid, title: finalTxToProcess.slice(0, 50) + '...', subject: 'General',
          date: new Date().toISOString(), transcript: finalTxToProcess, notes: data.notes || '',
          definitions: data.definitions || [], deadlines: data.deadlines || [],
          formulas: data.formulas || [], flashcards: fcs, quiz: data.quiz || [],
          wpmData: wpmHistory, fillerWords: fw, clarityScore: cs, duration,
        };
        saveSession(session);
        showToast(t.record.success, 'success');
        router.push('/notes');
      } catch (e) {
        showToast(`Error: ${e instanceof Error ? e.message : 'Unknown'}`, 'error');
      } finally { setIsProcessing(false); setProcStep(''); }
    } else {
      setDuration(0); setChunks([]); setWpmHistory([]); lastChunk.current = ''; setHwText('');
      setIsRecording(true);
      if (!useHW) {
        await audio.start(); speech.start(speech.currentLang);
        const li = SUPPORTED_LANGUAGES.find(l => l.code === speech.currentLang);
        showToast(`${t.record.recStart} ${li?.flag} ${li?.label}`, 'success');
      } else { showToast(t.record.espStart, 'success'); }
    }
  };

  const finalTx = useHW ? hwText : speech.finalTranscript;
  const interimTx = useHW ? '' : speech.interimTranscript;
  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  if (isProcessing) return <LoadingOverlay message={procStep || t.record.processing} />;

  return (
    <div className="ambient-glow px-4 pt-4 pb-8">
        {/* ━━━ CONTROLS BAR ━━━ */}
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-3 mb-6">
          <LanguageSelector currentLang={speech.currentLang} onSelect={speech.switchLanguage} />
          <div className="flex items-center gap-2.5 bg-surface-glass border border-border px-3 py-1.5 rounded-xl text-sm">
            <span className="text-text-secondary font-medium">{t.record.esp32}</span>
            <button type="button" disabled={isRecording}
              className={`${useHW ? 'bg-brand' : 'bg-text-muted/40'} relative inline-flex h-5 w-10 items-center rounded-full transition-colors`}
              onClick={() => setUseHW(!useHW)}>
              <span className={`${useHW ? 'translate-x-5' : 'translate-x-1'} inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform`} />
            </button>
          </div>
        </div>

        {/* ━━━ ESP32 STATUS ━━━ */}
        {useHW && (
          <div className="max-w-md mx-auto mb-8 flex justify-center animate-fade-in">
            <div className={`w-full relative overflow-hidden backdrop-blur-xl border rounded-2xl p-4 transition-all duration-500 ${
              hwStatus.online 
                ? 'bg-green-500/5 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]' 
                : hwStatus.retries > 3 
                  ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                  : 'bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)]'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${
                  hwStatus.online ? 'bg-green-500/20 text-green-400' 
                  : hwStatus.retries > 3 ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <line x1="9" y1="1" x2="9" y2="4" />
                    <line x1="15" y1="1" x2="15" y2="4" />
                    <line x1="9" y1="20" x2="9" y2="23" />
                    <line x1="15" y1="20" x2="15" y2="23" />
                    <line x1="20" y1="9" x2="23" y2="9" />
                    <line x1="20" y1="14" x2="23" y2="14" />
                    <line x1="1" y1="9" x2="4" y2="9" />
                    <line x1="1" y1="14" x2="4" y2="14" />
                  </svg>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold font-display tracking-wide ${
                      hwStatus.online ? 'text-green-400' : hwStatus.retries > 3 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {hwStatus.online ? t.record.esp32Online : hwStatus.retries > 3 ? t.record.esp32Offline : t.record.esp32Searching}
                    </h3>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        hwStatus.online ? 'bg-green-400' : hwStatus.retries > 3 ? 'bg-red-400 hidden' : 'bg-yellow-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        hwStatus.online ? 'bg-green-500' : hwStatus.retries > 3 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></span>
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {hwStatus.online
                      ? t.record.esp32On.replace('{kb}', (hwStatus.bytes / 1000).toFixed(1))
                      : hwStatus.retries > 0 && hwStatus.retries <= 3
                        ? t.record.esp32Retry.replace('{n}', String(hwStatus.retries))
                        : t.record.esp32Off}
                  </p>
                </div>

                {/* ★ Nút tải file audio */}
                {hwStatus.bytes > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = '/api/hardware-audio?download=true';
                      a.download = 'recording.wav';
                      a.click();
                    }}
                    className="ml-2 p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all shrink-0"
                    title="Tải file audio WAV"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ━━━ RECORDING AREA ━━━ */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            <RecordButton isRecording={isRecording} onClick={toggle} />
            {isRecording && (
              <div className="flex items-center gap-6 text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  <span className="font-mono text-text-primary font-semibold">{fmtTime(duration)}</span>
                </div>
                <div className="text-text-secondary">{speech.wordCount} {t.common.words}</div>
                {wpmHistory.length > 0 && <div className="text-text-muted">{wpmHistory[wpmHistory.length - 1]} WPM</div>}
              </div>
            )}
            <div className="w-full max-w-md"><Waveform getFrequencyData={audio.getFrequencyData} isActive={isRecording && audio.isActive} /></div>
          </div>

          {/* ━━━ TRANSCRIPT + AI SPLIT ━━━ */}
          {(isRecording || finalTx) && (
            <div className="grid md:grid-cols-2 gap-4 animate-slide-up mb-8">
              <div className="min-w-0"><LiveTranscript finalText={finalTx} interimText={interimTx} /></div>
              <div className="min-w-0"><AIExplanation chunks={chunks} isLoading={isExplaining} /></div>
            </div>
          )}
        </div>

        {/* ━━━ FEATURE CARDS (idle state) ━━━ */}
        {!isRecording && !finalTx && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {t.record.features.map((f, i) => (
                <Link key={f.title} href={f.href}
                  className={`group relative rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] p-5 text-center transition-all duration-300 hover:border-blue-300 dark:hover:border-indigo-500/30 hover:shadow-[var(--card-shadow-hover)] hover:scale-[1.03] active:scale-[0.97]`}>
                  <div className="text-3xl mb-3 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">{f.icon}</div>
                  <p className="text-xs font-semibold text-text-primary mb-1 group-hover:text-electric transition-colors">{f.title}</p>
                  <p className="text-[10px] text-text-muted leading-snug">{f.desc}</p>
                </Link>
              ))}
            </div>
            <p className="text-center text-text-secondary text-xs mt-8 tracking-wide">{t.record.tapMic}</p>
          </div>
        )}
    </div>
  );
}
