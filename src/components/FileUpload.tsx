'use client';

import { useRef, useState } from 'react';
import { generateId, saveFile, type UploadedFile } from '@/lib/storage';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
}

const ACCEPTED_TYPES = '.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.xml,.log';

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // Ngăn chặn file ảnh hoặc file nhị phân bị đọc sai
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        throw new Error('Unsupported file type');
      }

      const content = await file.text();
      // Nếu content chứa toàn ký tự null (binary), thì từ chối
      if (content.indexOf('\u0000') !== -1) {
        throw new Error('Binary file detected');
      }

      const uploadedFile: UploadedFile = {
        id: generateId(),
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        content: content.slice(0, 50000), // cap at 50k chars
        uploadedAt: new Date().toISOString(),
      };

      saveFile(uploadedFile);
      onFileUploaded(uploadedFile);
    } catch (err) {
      console.error('File processing error:', err);
      alert('Không thể đọc file này. Vui lòng tải lên file văn bản (.txt, .md, .csv, .json).\n\nNếu là PDF hoặc hình ảnh, vui lòng copy text hoặc gửi hình ảnh trực tiếp vào khung chat!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i++) {
      processFile(fileList[i]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer
        transition-all duration-300 group
        ${isDragging
          ? 'border-electric bg-electric/10 scale-[1.02]'
          : 'border-border hover:border-electric/40 hover:bg-surface-elevated'
        }
        ${isProcessing ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />

      {isProcessing ? (
        <div className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-10 h-10 rounded-full border-2 border-electric border-t-transparent animate-spin" />
          <p className="text-sm text-electric">Processing file...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center group-hover:bg-electric/10 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted group-hover:text-electric transition-colors">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {isDragging ? 'Drop files here!' : 'Upload study materials'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              .txt, .md, .csv, .json, .py, .js and more
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
