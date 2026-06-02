'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, File, X, AlertCircle } from 'lucide-react';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES, MAX_TEXT_LENGTH } from '@/lib/constants';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  disabled?: boolean;
}

export function FileUpload({ onTextExtracted, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);
    setFile(selectedFile);

    try {
      if (selectedFile.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds the 1GB limit.');
      }

      const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_FILE_TYPES.includes(ext)) {
        throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT.');
      }

      let text = '';

      if (ext === '.txt') {
        text = await selectedFile.text();
      } else if (ext === '.pdf') {
        const { extractTextFromPDF } = await import('@/lib/client-file-parser');
        text = await extractTextFromPDF(selectedFile);
      } else if (ext === '.docx') {
        const { extractTextFromDOCX } = await import('@/lib/client-file-parser');
        text = await extractTextFromDOCX(selectedFile);
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in the file.');
      }

      if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`Extracted text exceeds the maximum limit of ${MAX_TEXT_LENGTH.toLocaleString()} characters. Please upload a shorter document.`);
      }

      onTextExtracted(text, selectedFile.name);
    } catch (err) {
      console.error('File processing error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error processing file.';
      setError(message);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onTextExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  }, [processFile]);

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-zinc-500" />;
  };

  if (file && !error) {
    return (
      <div className="flex items-center gap-3.5 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
        {getFileIcon(file.name)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <button onClick={clearFile} className="p-1.5 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-10 border border-dashed rounded-xl transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30'
          }
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        <Upload className={`w-8 h-8 mb-3 transition-colors duration-200 ${isDragging ? 'text-indigo-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          PDF, DOCX, or TXT (no limits)
        </p>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
