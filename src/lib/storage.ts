// localStorage abstraction with Supabase Offline-First Sync
import { supabase } from './supabase';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status: 'new' | 'known' | 'review';
  lastReviewed: string | null;
  nextReview: string | null;
  lectureId: string;
  subject: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Definition {
  term: string;
  definition: string;
}

export interface Deadline {
  description: string;
  date: string;
}

export interface Formula {
  name: string;
  formula: string;
  explanation: string;
}

export interface LectureSession {
  id: string;
  title: string;
  subject: string;
  date: string;
  transcript: string;
  notes: string;
  definitions: Definition[];
  deadlines: Deadline[];
  formulas: Formula[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  wpmData: number[];
  fillerWords: Record<string, number>;
  clarityScore: number;
  duration: number;
}

const STORAGE_KEY = 'lecturesync_sessions';

function getSessions(): LectureSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: LectureSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ── Supabase Background Sync ──
function syncSessionToCloud(session: LectureSession) {
  if (typeof window === 'undefined') return;
  supabase.from('sessions')
    .upsert({ id: session.id, data: session, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error('[Sync] Session error:', error.message || error); });
}

function deleteSessionFromCloud(id: string) {
  if (typeof window === 'undefined') return;
  supabase.from('sessions').delete().eq('id', id)
    .then(({ error }) => { if (error) console.error('[Sync] Delete error:', error.message || error); });
}

export function getAllSessions(): LectureSession[] {
  return getSessions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getSession(id: string): LectureSession | null {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

export function saveSession(session: LectureSession) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  saveSessions(sessions);
  syncSessionToCloud(session); // Đẩy ngầm lên Supabase
}

export function deleteSession(id: string) {
  const sessions = getSessions().filter(s => s.id !== id);
  saveSessions(sessions);
  deleteSessionFromCloud(id); // Xóa ngầm trên Supabase
}

export function getAllFlashcards(): Flashcard[] {
  const sessions = getSessions();
  return sessions.flatMap(s => s.flashcards);
}

export function getDueFlashcards(): Flashcard[] {
  const today = new Date().toISOString().split('T')[0];
  return getAllFlashcards().filter(card => {
    if (card.status === 'known') return false;
    if (!card.nextReview) return true;
    return card.nextReview <= today;
  });
}

export function updateFlashcardStatus(lectureId: string, cardId: string, status: 'known' | 'review') {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === lectureId);
  if (!session) return;

  const card = session.flashcards.find(c => c.id === cardId);
  if (!card) return;

  const today = new Date();
  card.status = status;
  card.lastReviewed = today.toISOString().split('T')[0];

  if (status === 'known') {
    // Review in 7 days
    const next = new Date(today);
    next.setDate(next.getDate() + 7);
    card.nextReview = next.toISOString().split('T')[0];
  } else {
    // Review tomorrow
    const next = new Date(today);
    next.setDate(next.getDate() + 1);
    card.nextReview = next.toISOString().split('T')[0];
  }

  saveSessions(sessions);
  syncSessionToCloud(session); // Đồng bộ trạng thái thẻ Flashcard lên Cloud
}

export function getSubjects(): string[] {
  const sessions = getSessions();
  const subjects = new Set(sessions.map(s => s.subject).filter(Boolean));
  return Array.from(subjects);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// === Uploaded Files ===

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // extracted text content
  uploadedAt: string;
}

const FILES_KEY = 'lecturesync_files';

function getFiles(): UploadedFile[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveFiles(files: UploadedFile[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
}

function syncFileToCloud(file: UploadedFile) {
  if (typeof window === 'undefined') return;
  supabase.from('uploaded_files')
    .upsert({ id: file.id, data: file, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error('[Sync] File error:', error.message || error); });
}

function deleteFileFromCloud(id: string) {
  if (typeof window === 'undefined') return;
  supabase.from('uploaded_files').delete().eq('id', id)
    .then(({ error }) => { if (error) console.error('[Sync] File delete error:', error.message || error); });
}

export function getAllFiles(): UploadedFile[] {
  return getFiles().sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function saveFile(file: UploadedFile) {
  const files = getFiles();
  files.push(file);
  saveFiles(files);
  syncFileToCloud(file);
}

export function deleteFile(id: string) {
  const files = getFiles().filter(f => f.id !== id);
  saveFiles(files);
  deleteFileFromCloud(id);
}

// === Chat Messages ===

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const CHAT_KEY = 'lecturesync_chat';

export function getChatHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CHAT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  const trimmed = messages.slice(-50);
  localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
  
  // Lưu chat lên mây (chỉ cần lưu mảng nguyên khối vì không cần truy xuất từng tin nhắn)
  supabase.from('chat_messages')
    .upsert({ id: 'global_chat', data: trimmed, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error('[Sync] Chat error:', error.message || error); });
}

export function clearChatHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAT_KEY);
  supabase.from('chat_messages').delete().eq('id', 'global_chat')
    .then(({ error }) => { if (error) console.error('[Sync] Chat delete error:', error.message || error); });
}

// === Build context for chatbot ===

export function buildChatContext(): string {
  const sessions = getSessions();
  const files = getFiles();
  const parts: string[] = [];

  // Add lecture transcripts and notes
  for (const s of sessions) {
    parts.push(`[Lecture: "${s.title}" - ${new Date(s.date).toLocaleDateString()}]`);
    if (s.notes) parts.push(`Notes:\n${s.notes}`);
    if (s.transcript) parts.push(`Transcript (first 2000 chars):\n${s.transcript.slice(0, 2000)}`);
    if (s.definitions.length > 0) {
      parts.push(`Key Terms: ${s.definitions.map(d => `${d.term}: ${d.definition}`).join('; ')}`);
    }
    parts.push('---');
  }

  // Add uploaded file contents
  for (const f of files) {
    parts.push(`[Uploaded File: "${f.name}" - ${new Date(f.uploadedAt).toLocaleDateString()}]`);
    parts.push(f.content.slice(0, 3000));
    parts.push('---');
  }

  return parts.join('\n');
}

// Filler word detection
const FILLER_WORDS = ['uh', 'um', 'like', 'so', 'basically', 'you know', 'right', 'actually', 'literally', 'honestly'];

export function countFillerWords(transcript: string): Record<string, number> {
  const lower = transcript.toLowerCase();
  const counts: Record<string, number> = {};
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lower.match(regex);
    counts[filler] = matches ? matches.length : 0;
  }
  return counts;
}

// Clarity score calculation
export function calculateClarityScore(wpmData: number[], fillerWords: Record<string, number>, totalWords: number): number {
  if (totalWords === 0) return 0;

  // WPM stability (less variation = better) — 40 points max
  let wpmScore = 40;
  if (wpmData.length > 1) {
    const avg = wpmData.reduce((a, b) => a + b, 0) / wpmData.length;
    const variance = wpmData.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / wpmData.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 1;
    wpmScore = Math.max(0, 40 * (1 - cv));
  }

  // Filler word penalty — 30 points max
  const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  const fillerRatio = totalFillers / totalWords;
  const fillerScore = Math.max(0, 30 * (1 - fillerRatio * 10));

  // Pacing score (ideal WPM 120-160) — 30 points max
  let pacingScore = 30;
  if (wpmData.length > 0) {
    const avg = wpmData.reduce((a, b) => a + b, 0) / wpmData.length;
    if (avg < 80 || avg > 200) pacingScore = 10;
    else if (avg < 100 || avg > 180) pacingScore = 20;
    else pacingScore = 30;
  }

  return Math.round(Math.min(100, wpmScore + fillerScore + pacingScore));
}

// ==========================================
// TẢI DỮ LIỆU TỪ CLOUD (KHI ĐĂNG NHẬP MÁY MỚI)
// ==========================================
export async function syncFromCloud(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Tải Sessions
    const { data: sessionData } = await supabase.from('sessions').select('data');
    if (sessionData && sessionData.length > 0) {
      const parsedSessions = sessionData.map(row => row.data as LectureSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedSessions));
    }

    // Tải Files
    const { data: fileData } = await supabase.from('uploaded_files').select('data');
    if (fileData && fileData.length > 0) {
      const parsedFiles = fileData.map(row => row.data as UploadedFile);
      localStorage.setItem(FILES_KEY, JSON.stringify(parsedFiles));
    }

    // Tải Chat
    const { data: chatData } = await supabase.from('chat_messages').select('data').eq('id', 'global_chat').single();
    if (chatData && chatData.data) {
      localStorage.setItem(CHAT_KEY, JSON.stringify(chatData.data));
    }

    return true;
  } catch (error) {
    console.error('[Cloud] Sync failed:', error);
    return false;
  }
}
