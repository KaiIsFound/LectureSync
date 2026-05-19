'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  getAllFiles,
  deleteFile,
  getAllSessions,
  getChatHistory,
  saveChatHistory,
  clearChatHistory,
  buildChatContext,
  generateId,
  type UploadedFile,
  type ChatMessage,
  type LectureSession,
} from '@/lib/storage';
import { useLocale } from '@/contexts/LocaleContext';

interface PendingImage {
  id: string;
  dataUrl: string;   // for preview
  base64: string;     // raw base64 without prefix
  mimeType: string;
}

export default function ChatPage() {
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(getChatHistory());
    setFiles(getAllFiles());
    setSessions(getAllSessions());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processImageFile(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract base64 data without the "data:image/...;base64," prefix
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/png';

      setPendingImages(prev => [
        ...prev,
        { id: generateId(), dataUrl, base64, mimeType },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const removePendingImage = (id: string) => {
    setPendingImages(prev => prev.filter(img => img.id !== id));
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setFiles(prev => [file, ...prev]);
  };

  const handleDeleteFile = (id: string) => {
    deleteFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearChat = () => {
    clearChatHistory();
    setMessages([]);
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].type.startsWith('image/')) {
        processImageFile(fileList[i]);
      }
    }
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    const hasImages = pendingImages.length > 0;
    if ((!trimmed && !hasImages) || isLoading) return;

    // Build user message content with image indicators
    let displayContent = trimmed;
    if (hasImages) {
      const imgCount = pendingImages.length;
      const imgLabel = imgCount === 1 ? '📷 1 image' : `📷 ${imgCount} images`;
      displayContent = trimmed ? `${imgLabel}\n${trimmed}` : imgLabel;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: displayContent,
      timestamp: new Date().toISOString(),
    };

    // Store image data URLs in a map for display (keyed by message id)
    if (hasImages) {
      const imageUrls = pendingImages.map(img => img.dataUrl);
      sessionStorage.setItem(`chat_images_${userMessage.id}`, JSON.stringify(imageUrls));
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Prepare images for API
    const apiImages = hasImages
      ? pendingImages.map(img => ({ mimeType: img.mimeType, base64Data: img.base64 }))
      : undefined;

    setInput('');
    setPendingImages([]);
    setIsLoading(true);

    try {
      const context = buildChatContext();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed || 'Please analyze this image and explain what you see.',
          context,
          history: newMessages.slice(-10),
          images: apiImages,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      const updated = [...newMessages, assistantMessage];
      setMessages(updated);
      saveChatHistory(updated);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please make sure your Gemini API key is set in .env.local.`,
        timestamp: new Date().toISOString(),
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
      saveChatHistory(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Get stored image URLs for a message
  const getMessageImages = (msgId: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = sessionStorage.getItem(`chat_images_${msgId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const sourceCount = sessions.length + files.length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-2 pb-3 shrink-0">
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-text-secondary text-xs">
            {sourceCount > 0
              ? t.pages.chat.subtitleSources.replace('{n}', String(sourceCount))
              : t.pages.chat.subtitleEmpty}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className={`p-2 rounded-xl transition-all ${
                showSources
                  ? 'bg-blue-100 border border-blue-300 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400'
                  : 'bg-gray-100 border border-gray-200 text-gray-500 dark:bg-white/[0.04] dark:border-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
              }`}
              title="View sources"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 dark:bg-white/[0.04] dark:border-white/[0.06] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
                title="Clear chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sources panel */}
      {showSources && (
        <div className="px-4 pb-3 shrink-0 animate-slide-up">
          <div className="rounded-2xl bg-surface border border-border p-4 space-y-3 max-h-64 overflow-y-auto">
            <FileUpload onFileUploaded={handleFileUploaded} />

            {files.length > 0 && (
              <div>
                <h3 className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Uploaded Files ({files.length})
                </h3>
                <div className="space-y-1.5">
                  {files.map(f => (
                    <div key={f.id} className="flex items-center justify-between rounded-xl bg-surface-elevated px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">📄</span>
                        <div className="min-w-0">
                          <p className="text-xs text-text-primary font-medium truncate">{f.name}</p>
                          <p className="text-[10px] text-text-muted">{formatSize(f.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(f.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0 p-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sessions.length > 0 && (
              <div>
                <h3 className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Lecture Recordings ({sessions.length})
                </h3>
                <div className="space-y-1.5">
                  {sessions.map(s => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl bg-surface-elevated px-3 py-2">
                      <span className="text-base shrink-0">🎙️</span>
                      <div className="min-w-0">
                        <p className="text-xs text-text-primary font-medium truncate">{s.title}</p>
                        <p className="text-[10px] text-text-muted">{new Date(s.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {messages.length === 0 && !showSources && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-bold text-text-primary mb-1">
              Ask me anything!
            </h2>
            <p className="text-text-muted text-xs max-w-xs mb-6">
              I can answer questions about your lectures, uploaded files, and pasted images.
              <br />
              <span className="text-electric">Ctrl+V</span> to paste an image!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
              {[
                'Summarize my last lecture',
                'What are the key terms?',
                'Create a study plan',
                'Explain this image',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-left rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] px-3 py-2.5 text-xs text-text-secondary hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-white/[0.06] transition-all shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => {
          const msgImages = getMessageImages(msg.id);
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'gradient-bg text-white rounded-br-md shadow-sm'
                    : 'bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-white/[0.06] text-text-primary rounded-bl-md shadow-sm'
                }`}
              >
                {/* Image thumbnails */}
                {msgImages.length > 0 && (
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {msgImages.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Attached image ${i + 1}`}
                        className="w-32 h-32 object-cover rounded-lg border border-white/20"
                      />
                    ))}
                  </div>
                )}
                <MarkdownRenderer content={msg.content} />
                <div className={`text-[10px] mt-1.5 ${
                  msg.role === 'user' ? 'text-white/50' : 'text-text-muted'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-electric animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-electric animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-electric animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending image previews */}
      {pendingImages.length > 0 && (
        <div className="px-4 py-2 shrink-0">
          <div className="flex gap-2 flex-wrap">
            {pendingImages.map(img => (
              <div key={img.id} className="relative group">
                <img
                  src={img.dataUrl}
                  alt="Pending upload"
                  className="w-16 h-16 object-cover rounded-xl border border-border"
                />
                <button
                  onClick={() => removePendingImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden image file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Input area */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-end gap-2 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-white/[0.06] p-2 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
          {/* Attach files */}
          <button
            onClick={() => setShowSources(!showSources)}
            className="p-2 rounded-xl text-text-muted hover:text-electric hover:bg-electric/10 transition-all shrink-0"
            title="Attach files"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Image upload button */}
          <button
            onClick={handleImageUploadClick}
            className="p-2 rounded-xl text-text-muted hover:text-purple hover:bg-purple/10 transition-all shrink-0"
            title="Upload image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingImages.length > 0 ? 'Add a message about the image...' : 'Ask about your lectures... (Ctrl+V to paste image)'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none py-2 max-h-24"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
            className="p-2 rounded-xl gradient-bg text-white disabled:opacity-30 transition-all shrink-0 hover:opacity-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
