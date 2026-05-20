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
  const isRecordingRef = useRef(isRecording);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

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

  // ── ESP32 WebSocket Streaming ──
  const wsRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamActiveRef = useRef(false);

  const processAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) return;
    const fullBlob = new Blob(audioChunksRef.current, { type: "audio/pcm" });
    audioChunksRef.current = []; // Reset
    try {
      const arrayBuffer = await fullBlob.arrayBuffer();
      const res = await fetch("/api/hardware-audio", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: arrayBuffer,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transcript && data.transcript.trim()) {
          setHwText(p => p ? p + ' ' + data.transcript.trim() : data.transcript.trim());
          setHwStatus(p => ({ ...p, online: true, lastTime: Date.now() }));
        }
      }
    } catch (err) {
      console.error("ESP32 process error:", err);
    }
  };

  const discoverESP32IP = async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('http://lecturensync-esp32.local/ip', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          console.log('[ESP32] Found via mDNS:', data.ip);
          localStorage.setItem('lastEspIp', data.ip);
          return data.ip;
        }
      } catch (e) {
        console.log(`[ESP32] mDNS attempt ${attempt + 1} failed`);
      }
      await new Promise(r => setTimeout(r, 500)); // Wait before retry
    }

    // Try 2: Cached IP from previous session
    const cachedIp = localStorage.getItem('lastEspIp');
    if (cachedIp) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`http://${cachedIp}/ip`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          console.log('[ESP32] Found via cached IP:', data.ip);
          return data.ip;
        }
      } catch (e) {
        console.log('[ESP32] Cached IP failed');
      }
    }

    // Try 3: Network scan - try common ESP32 IP patterns on local network
    // Get device's gateway to guess subnet
    try {
      const subnets = ['192.168.1', '192.168.0', '10.0.0', '172.20.10', '172.20.11'];
      for (const subnet of subnets) {
        for (let i = 100; i <= 110; i++) {
          const testIp = `${subnet}.${i}`;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);
            const res = await fetch(`http://${testIp}/ip`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (data.id && data.id.includes('esp32')) {
                console.log('[ESP32] Found via network scan:', testIp);
                localStorage.setItem('lastEspIp', testIp);
                return testIp;
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.log('[ESP32] Network scan failed');
    }

    // No IP found - return null (will use relay only)
    console.log('[ESP32] Auto-discovery failed, will use relay or offline mode');
    return null;
  };

  useEffect(() => {
    let localWs: WebSocket | null = null;
    let relayWs: WebSocket | null = null;
    let cancelled = false;

    const FALLBACK_RELAY_HOST = 'lecturesync-5960.loca.lt';
    // Trang Vercel = HTTPS → bắt buộc wss/https, không dùng ws/http (trình duyệt chặn mixed content)
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const RELAY_HTTP =
      (process.env.NEXT_PUBLIC_RELAY_HTTP as string) ||
      (secure ? `https://${FALLBACK_RELAY_HOST}` : `http://${FALLBACK_RELAY_HOST}`);
    const RELAY_WS =
      (process.env.NEXT_PUBLIC_RELAY_WS as string) ||
      (secure ? `wss://${FALLBACK_RELAY_HOST}` : `ws://${FALLBACK_RELAY_HOST}`);

    const handleBinary = (data: ArrayBuffer) => {
      const size = data.byteLength || (data as any).length || 0;
      setHwStatus(p => ({ ...p, online: true, bytes: (p.bytes || 0) + size, lastTime: Date.now() }));
      if (isRecordingRef.current) {
        const blob = new Blob([data], { type: 'audio/pcm' });
        audioChunksRef.current.push(blob);
        // ~vài giây PCM (ESP POST ~1s/lần) — 80 là quá lâu, không thấy transcript
        if (audioChunksRef.current.length >= 5) processAudioChunks();
      }
    };

    const connectLocal = (ip: string) => {
      try {
        const ws = new WebSocket(`ws://${ip}:81`);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          streamActiveRef.current = true;
          setHwStatus({ online: true, bytes: 0, lastTime: Date.now(), retries: 0 });
          showToast('✅ Kết nối ESP32 thành công!', 'success');
          localStorage.setItem('lastEspIp', ip);
        };

        ws.onmessage = (event) => { if (event.data instanceof ArrayBuffer) handleBinary(event.data); };
        ws.onerror = () => setHwStatus(p => ({ ...p, online: false, retries: p.retries + 1 }));
        ws.onclose = () => setHwStatus(p => ({ ...p, online: false }));

        localWs = ws;
        wsRef.current = ws;
      } catch (e) {
        console.error('Local WebSocket Error', e);
      }
    };

    const connectRelay = async (): Promise<boolean> => {
      try {
        const res = await fetch(`${RELAY_HTTP}/devices`, {
          headers: { 'Bypass-Tunnel-Reminder': 'true' },
        });
        if (!res.ok) return false;
        const devices = await res.json();
        if (!devices || devices.length === 0) return false;
        const target = devices[0];

        return await new Promise<boolean>((resolve) => {
          const ws = new WebSocket(RELAY_WS);
          ws.binaryType = 'arraybuffer';
          let settled = false;
          const failTimer = setTimeout(() => {
            if (settled) return;
            settled = true;
            ws.close();
            console.warn('[Relay] WebSocket timeout', RELAY_WS);
            resolve(false);
          }, 10000);

          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', id: target.id }));
            streamActiveRef.current = true;
            setHwStatus({ online: true, bytes: 0, lastTime: Date.now(), retries: 0 });
            showToast('Đã kết nối tới ESP32 qua relay!', 'success');
            relayWs = ws;
            wsRef.current = ws;
            if (!settled) {
              settled = true;
              clearTimeout(failTimer);
              resolve(true);
            }
          };

          ws.onmessage = (event) => {
            if (event.data instanceof ArrayBuffer) handleBinary(event.data);
            else {
              try {
                const txt = JSON.parse(String(event.data));
                if (txt && txt.type === 'subscribed') {
                  console.log('Subscribed to', txt.id);
                }
              } catch (e) {}
            }
          };

          ws.onerror = () => {
            setHwStatus(p => ({ ...p, online: false, retries: p.retries + 1 }));
            if (!settled) {
              settled = true;
              clearTimeout(failTimer);
              resolve(false);
            }
          };
          ws.onclose = () => setHwStatus(p => ({ ...p, online: false }));
        });
      } catch (e) {
        console.error('Relay connect error', e);
        return false;
      }
    };

    if (useHW) {
      (async () => {
        const ok = await connectRelay();
        if (!ok && !cancelled) {
          setHwStatus({ online: false, bytes: 0, lastTime: 0, retries: 0 });
          showToast('🔍 Tìm kiếm ESP32 tự động...', 'info');
          const ip = await discoverESP32IP();
          if (ip && !cancelled) {
            connectLocal(ip);
          } else if (!cancelled) {
            showToast('ℹ️ ESP32 không tìm được, dùng relay hoặc WiFi cùng cục bộ', 'info');
          }
        }
      })();
    } else {
      streamActiveRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (audioChunksRef.current.length > 0) processAudioChunks(); // flush remaining
    }

    return () => {
      cancelled = true;
      streamActiveRef.current = false;
      if (localWs) localWs.close();
      if (relayWs) relayWs.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, [useHW]);

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
      let audioBlob: Blob | null = null;
      if (!useHW) { 
        speech.stop(); 
        audioBlob = await audio.stop(); 
      }
      setIsRecording(false);
      const tx = (useHW ? hwText : speech.finalTranscript).trim();
      if (!useHW && !audioBlob && (!tx || tx.length < 10)) { showToast(t.record.tooShort, 'info'); return; }
      if (useHW && (!tx || tx.length < 10)) { showToast(t.record.tooShort, 'info'); return; }

      setIsProcessing(true);
      setProcStep('Đang xử lý bản ghi âm thanh...');

      // Bỏ finalize bằng API cũ, vì WebSocket đã xử lý Real-time
      let finalTxToProcess = tx;
      if (useHW) {
        console.log(`[WebSocket Final] Bản dịch từ mạch ESP32: ${finalTxToProcess.length} ký tự`);
      }
      
      // ★ Nếu đang dùng web mic: gửi thẳng file audio lên AI để dịch lại chuẩn xác nhất!
      if (!useHW && audioBlob) {
        try {
          setProcStep('Đang dịch lại file ghi âm bằng AI để đạt độ chuẩn 100%...');
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          formData.append('language', speech.currentLang === 'vi-VN' ? 'vi' : speech.currentLang === 'en-US' ? 'en' : 'zh');
          
          const uploadRes = await fetch('/api/transcribe-file', { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.transcript && uploadData.transcript.length > 10) {
              finalTxToProcess = uploadData.transcript;
              console.log(`[WebMic Final] Bản dịch chuẩn: ${finalTxToProcess.length} ký tự`);
            }
          }
        } catch (e) {
          console.warn('[WebMic Final] Lỗi khi dịch file, dùng live transcript:', e);
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
          <div className="max-w-5xl mx-auto animate-fade-in mt-12 relative z-10">
            {/* Trang trí nền */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand/5 blur-[120px] rounded-[100%] pointer-events-none" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {t.record.features.map((f, i) => {
                const colorMatches = GLOW_COLORS[i % GLOW_COLORS.length].match(/rgba\((.*?)\)/);
                const glowColor = colorMatches ? `rgba(${colorMatches[1]})` : 'rgba(59,130,246,0.5)';
                const subtleBg = colorMatches ? `rgba(${colorMatches[1].replace(/0\.\d+/, '0.03')})` : 'rgba(59,130,246,0.03)';
                const borderGlow = colorMatches ? `rgba(${colorMatches[1].replace(/0\.\d+/, '0.2')})` : 'rgba(59,130,246,0.2)';
                
                return (
                  <Link key={f.title} href={f.href}
                    className="group relative rounded-[2rem] backdrop-blur-xl p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    {/* Gradient Border */}
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/60 to-white/10 dark:from-white/20 dark:to-white/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, ${borderGlow}, transparent)` }} />
                    
                    {/* Card Body */}
                    <div className="relative h-full w-full rounded-[calc(2rem-1px)] bg-white/70 dark:bg-[#0f172a]/80 p-6 md:p-8 flex flex-col items-center overflow-hidden" style={{ backgroundColor: subtleBg }}>
                      {/* Glass reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 dark:via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full" />
                      
                      {/* Background glow on hover */}
                      <div className="absolute -inset-0.5 opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500 blur-2xl" style={{ backgroundColor: glowColor }} />
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 mb-5 rounded-2xl bg-white/90 dark:bg-white/10 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] border border-white dark:border-white/10 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500" style={{ textShadow: `0 0 20px ${glowColor}`, borderColor: borderGlow }}>
                          {f.icon}
                        </div>
                        <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">{f.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{f.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-12 font-medium tracking-wide flex items-center justify-center gap-4">
              <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700"></span>
              {t.record.tapMic}
              <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700"></span>
            </p>
          </div>
        )}
    </div>
  );
}
